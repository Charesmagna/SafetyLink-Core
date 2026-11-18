// Zero-airtime trail.
// The phone sends a free Please Call Me to the Rain SIM.
// Rain posts that SMS here. Contacts were saved earlier, while the user had data.
// This file does not replace /api/panic.

export interface ZeroEnv {
  DB?: D1Database;
  TWILIO_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_NUMBER?: string;
  TWILIO_WHATSAPP_FROM?: string;
  VAPI_PRIVATE_KEY?: string;
  VAPI_PHONE_NUMBER_ID?: string;
  VAPI_ASSISTANT_ID?: string;
  AT_API_KEY?: string;
  AT_USERNAME?: string;
  RESPONSE_CENTRE_NUMBER?: string;
  PCM_WEBHOOK_SECRET?: string;
  SMSGATE_USERNAME?: string;
  SMSGATE_PASSWORD?: string;
  SMSGATE_BASE_URL?: string;
  SMSGATE_DEVICE_ID?: string;
  SMSGATE_SIM_NUMBER?: string;
  RAIN_GATEWAY_MSISDN?: string;
}

const DEDUPE_MS = 90_000; // same caller, 90 seconds

export function toE164(raw: string): string {
  let n = String(raw || '').replace(/[^0-9+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0') && n.length === 10) n = '27' + n.slice(1);
  if (n.length === 9 && /^[6-8]/.test(n)) n = '27' + n;
  if (!n) return '';
  return '+' + n;
}

export function extractMsisdn(rawText: string, sender: string): string {
  const text = String(rawText || '');
  const match =
    text.match(/(?:call(?:\s|-)?me(?:\s|-)?(?:back)?(?:\s|-)?(?:at|from|on)?)[:\s]*(\+?27[6-8]\d{8}|0[6-8]\d{8})/i) ||
    text.match(/(\+?27[6-8]\d{8}|0[6-8]\d{8})/);
  return toE164((match && match[1]) || sender || '');
}

export async function ensureZeroAirtimeSchema(db: D1Database): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS sl_profiles (phone TEXT PRIMARY KEY, name TEXT, lat REAL, lng REAL, token TEXT, alert_note TEXT, updated_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS sl_contacts (id TEXT PRIMARY KEY, owner_phone TEXT NOT NULL, name TEXT, contact_phone TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS sl_pcm_events (
      id TEXT PRIMARY KEY,
      owner_phone TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      located INTEGER DEFAULT 0,
      dispatch_status TEXT NOT NULL DEFAULT 'LEGACY',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER,
      last_result TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS sl_pcm_retries (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      sms_body TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'PENDING',
      last_error TEXT,
      next_retry_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ];
  for (const sql of statements) await db.prepare(sql).run();

  // Backward-compatible, additive migrations for existing Beta databases.
  await db.prepare('ALTER TABLE sl_profiles ADD COLUMN alert_note TEXT').run().catch(() => {});
  await db.prepare('ALTER TABLE sl_contacts ADD COLUMN name TEXT').run().catch(() => {});
  await db.prepare("ALTER TABLE sl_pcm_events ADD COLUMN dispatch_status TEXT NOT NULL DEFAULT 'LEGACY'").run().catch(() => {});
  await db.prepare('ALTER TABLE sl_pcm_events ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0').run().catch(() => {});
  await db.prepare('ALTER TABLE sl_pcm_events ADD COLUMN last_attempt_at INTEGER').run().catch(() => {});
  await db.prepare('ALTER TABLE sl_pcm_events ADD COLUMN last_result TEXT').run().catch(() => {});
}

export async function syncProfile(env: ZeroEnv, body: any, presentedToken: string): Promise<{ status: number; json: any }> {
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  const phone = toE164(body?.phone || '');
  if (!phone) return { status: 400, json: { error: 'phone is required' } };
  const contacts = Array.isArray(body?.contacts) ? body.contacts.slice(0, 5) : [];
  await ensureZeroAirtimeSchema(env.DB);
  const existing = await env.DB.prepare('SELECT token FROM sl_profiles WHERE phone=?').bind(phone).first<{ token: string }>();
  if (existing?.token && existing.token !== presentedToken) {
    return { status: 401, json: { error: 'Profile token does not match this number' } };
  }
  const token = existing?.token || crypto.randomUUID();
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO sl_profiles (phone, name, lat, lng, token, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(phone) DO UPDATE SET name=excluded.name, lat=COALESCE(excluded.lat, sl_profiles.lat), lng=COALESCE(excluded.lng, sl_profiles.lng), updated_at=excluded.updated_at`
  ).bind(phone, String(body?.name || '').slice(0, 80), Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null, token, now).run();
  const note = String(body?.alertNote || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  await env.DB.prepare('UPDATE sl_profiles SET alert_note=? WHERE phone=?').bind(note || null, phone).run().catch(() => {});
  // Replace the contact set atomically. A failed insert must not leave the user
  // with an empty/partially-written emergency contact list.
  const contactStatements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM sl_contacts WHERE owner_phone=?').bind(phone),
  ];
  const seen = new Set<string>();
  let savedContactCount = 0;
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i] || {};
    const contactPhone = toE164(contact.phone || '');
    if (!contactPhone || contactPhone === phone || seen.has(contactPhone)) continue;
    seen.add(contactPhone);
    contactStatements.push(env.DB.prepare(
      'INSERT INTO sl_contacts (id, owner_phone, name, contact_phone, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), phone, String(contact.name || '').slice(0, 80), contactPhone, savedContactCount));
    savedContactCount++;
  }
  await env.DB.batch(contactStatements);
  return { status: 200, json: { ok: true, phone, token, contacts: savedContactCount } };
}

async function loadContacts(env: ZeroEnv, phone: string): Promise<{ name: string; contacts: string[]; lat?: number; lng?: number; note?: string }> {
  const profile = await env.DB!.prepare('SELECT name, lat, lng, alert_note FROM sl_profiles WHERE phone=?').bind(phone).first<{ name: string; lat: number; lng: number; alert_note: string }>();
  const rows = await env.DB!.prepare(
    'SELECT contact_phone FROM sl_contacts WHERE owner_phone=? ORDER BY sort_order ASC LIMIT 5'
  ).bind(phone).all<{ contact_phone: string }>();
  return {
    name: profile?.name || phone,
    contacts: (rows.results || []).map(r => r.contact_phone).filter(Boolean),
    lat: profile?.lat || undefined,
    lng: profile?.lng || undefined,
    note: profile?.alert_note || undefined,
  };
}

async function sendViaSmsGateOnce(env: ZeroEnv, to: string, smsBody: string): Promise<{
  to: string;
  channel: 'SMS';
  provider: 'smsgate';
  ok: boolean;
  status?: number;
  state: string;
  messageId?: string;
  detail?: string;
  retryable: boolean;
}> {
  const sgU = (env.SMSGATE_USERNAME || '').trim();
  const sgP = (env.SMSGATE_PASSWORD || '').trim();
  if (!sgU || !sgP) {
    return {
      to,
      channel: 'SMS',
      provider: 'smsgate',
      ok: false,
      state: 'UNCONFIGURED',
      detail: 'SMSGATE credentials missing',
      retryable: false,
    };
  }
  const base = (env.SMSGATE_BASE_URL || 'https://api.sms-gate.app').replace(/\/+$/, '');
  const simNumber = Math.max(1, Math.min(2, Number(env.SMSGATE_SIM_NUMBER || 1) || 1));
  const deviceId = (env.SMSGATE_DEVICE_ID || '').trim();
  try {
    const r = await fetch(`${base}/3rdparty/v1/messages`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${sgU}:${sgP}`), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textMessage: { text: smsBody },
        phoneNumbers: [to],
        ...(deviceId ? { deviceId } : {}),
        simNumber,
        ttl: 1800,
        priority: 100,
      }),
    });
    const responseText = (await r.text().catch(() => '')).slice(0, 500);
    let responseBody: any = {};
    try { responseBody = responseText ? JSON.parse(responseText) : {}; } catch { /* retain response text */ }
    const smsOk = r.ok;
    const retryable = !smsOk && (r.status === 429 || r.status >= 500);
    return {
      to,
      channel: 'SMS',
      provider: 'smsgate',
      ok: smsOk,
      status: r.status,
      state: smsOk ? 'QUEUED' : 'REJECTED',
      messageId: responseBody.id || responseBody.messageId || undefined,
      detail: smsOk ? undefined : responseText,
      retryable,
    };
  } catch (error: any) {
    return {
      to,
      channel: 'SMS',
      provider: 'smsgate',
      ok: false,
      state: 'ERROR',
      detail: String(error?.message || error).slice(0, 200),
      retryable: true,
    };
  }
}

async function sendViaSmsGateWithRetry(env: ZeroEnv, to: string, smsBody: string, maxAttempts = 2) {
  let lastResult = await sendViaSmsGateOnce(env, to, smsBody);
  for (let attempt = 1; attempt < maxAttempts && !lastResult.ok && lastResult.retryable; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    lastResult = await sendViaSmsGateOnce(env, to, smsBody);
  }
  return {
    to: lastResult.to,
    channel: lastResult.channel,
    provider: lastResult.provider,
    ok: lastResult.ok,
    status: lastResult.status,
    state: lastResult.state,
    messageId: lastResult.messageId,
    detail: lastResult.detail,
    smsBody,
  };
}

async function enqueueFailedRetries(env: ZeroEnv, eventId: string, ownerPhone: string, results: any[]): Promise<void> {
  if (!env.DB) return;
  const now = Date.now();
  const nextRetryAt = now + 60_000;
  for (const r of results) {
    if (r?.ok === true || !r?.to || !r?.smsBody) continue;
    await env.DB.prepare(
      `INSERT INTO sl_pcm_retries (id, event_id, owner_phone, recipient_phone, sms_body, attempts, max_attempts, status, last_error, next_retry_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 5, 'PENDING', ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      eventId,
      ownerPhone,
      String(r.to),
      String(r.smsBody),
      String(r.detail || r.state || 'SMSGate send failed').slice(0, 400),
      nextRetryAt,
      now,
      now
    ).run().catch(() => {});
  }
}

/**
 * Offline zero-airtime dispatch uses ONLY the RAIN phone SMS Gateway (SMSGate).
 * Twilio, VAPI, and Telegram are intentionally NOT used on the offline path.
 */
async function notifyContacts(env: ZeroEnv, opts: {
  ownerPhone: string;
  ownerName: string;
  contacts: string[];
  lat?: number;
  lng?: number;
  voice: boolean;
  smsPrefix: string;
  note?: string;
  eventId?: string;
}): Promise<any[]> {
  const targets = opts.contacts.length
    ? opts.contacts
    : [toE164(env.RESPONSE_CENTRE_NUMBER || '')].filter(Boolean);
  const place = opts.lat && opts.lng ? `https://maps.google.com/?q=${opts.lat},${opts.lng}` : 'Location not available yet';
  const locTxt = opts.lat && opts.lng ? `Last known location: ${place}` : 'Last known location: not available yet';
  const noteTxt = opts.note ? ` Message from ${opts.ownerName}: ${opts.note}.` : '';
  const smsBody = `${opts.smsPrefix || 'SAFETYLINK ALERT'}: ${opts.ownerName} (${opts.ownerPhone}) pressed the SafetyLink button. ${locTxt}.${noteTxt} Please call them now. SafetyLink does not replace 10111 or 112.`.slice(0, 480);

  const results: any[] = [];
  await Promise.allSettled(targets.map(async (to) => {
    const res = await sendViaSmsGateWithRetry(env, to, smsBody, 2);
    results.push(res);
  }));

  if (opts.eventId) {
    await enqueueFailedRetries(env, opts.eventId, opts.ownerPhone, results);
  }
  return results;
}

export async function inboundPcm(env: ZeroEnv, rawText: string, sender: string): Promise<{ status: number; json: any }> {
  const phone = extractMsisdn(rawText, sender);
  if (!phone) return { status: 400, json: { error: 'No caller number in the SMS' } };
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  await ensureZeroAirtimeSchema(env.DB);
  const saved = await loadContacts(env, phone);
  if (!saved.contacts.length && saved.name === phone) {
    const known = await env.DB.prepare('SELECT phone FROM sl_profiles WHERE phone=?').bind(phone).first();
    if (!known) {
      // Unknown caller: never alert strangers. Send the command centre a single SMS via Rain SMSGate.
      const centre = toE164(env.RESPONSE_CENTRE_NUMBER || '');
      if (centre) {
        await notifyContacts(env, { ownerPhone: phone, ownerName: 'Unregistered caller', contacts: [centre], voice: false, smsPrefix: 'UNKNOWN CALLER' });
      }
      return { status: 200, json: { ok: true, status: 'UNKNOWN_FORWARDED_TO_COMMAND', msisdn: phone } };
    }
  }

  // Suppress accepted/in-flight events, but never let a failed dispatch block a retry.
  // LEGACY rows are treated as previously handled for backward compatibility.
  const since = Date.now() - DEDUPE_MS;
  const recent = await env.DB.prepare(
    "SELECT id, dispatch_status FROM sl_pcm_events WHERE owner_phone=? AND created_at>? AND COALESCE(dispatch_status, 'LEGACY') <> 'FAILED' ORDER BY created_at DESC LIMIT 1"
  ).bind(phone, since).first<{ id: string; dispatch_status: string }>();
  if (recent) {
    const recentStatus = String(recent.dispatch_status || 'LEGACY');
    return {
      status: 200,
      json: {
        ok: true,
        status: recentStatus === 'PROCESSING' ? 'PROCESSING' : recentStatus === 'PARTIAL' ? 'PARTIAL' : 'DEDUPED',
        msisdn: phone,
        eventId: recent.id,
      },
    };
  }

  const eventId = crypto.randomUUID();
  const startedAt = Date.now();
  await env.DB.prepare(
    "INSERT INTO sl_pcm_events (id, owner_phone, created_at, located, dispatch_status, attempts, last_attempt_at) VALUES (?, ?, ?, 0, 'PROCESSING', 1, ?)"
  ).bind(eventId, phone, startedAt, startedAt).run();

  let results: any[] = [];
  try {
    results = await notifyContacts(env, {
      ownerPhone: phone,
      ownerName: saved.name,
      contacts: saved.contacts,
      lat: saved.lat,
      lng: saved.lng,
      voice: false,
      smsPrefix: 'SAFETYLINK ALERT',
      note: saved.note,
      eventId,
    });
  } catch (error: any) {
    const detail = String(error?.message || error).slice(0, 500);
    await env.DB.prepare(
      "UPDATE sl_pcm_events SET dispatch_status='FAILED', last_result=? WHERE id=?"
    ).bind(JSON.stringify({ error: detail }), eventId).run();
    return { status: 502, json: { ok: false, status: 'FAILED', msisdn: phone, eventId, error: 'All dispatch processing failed; gateway may retry' } };
  }

  // A 2xx from a provider means accepted/queued, not confirmed handset delivery.
  // Group fallbacks by recipient + channel so a failed primary followed by a
  // successful backup is counted as success for that channel.
  const channelOutcomes = new Map<string, boolean>();
  for (const result of results) {
    const key = `${String(result.to || '')}:${String(result.channel || 'UNKNOWN')}`;
    channelOutcomes.set(key, (channelOutcomes.get(key) || false) || result.ok === true);
  }
  const channelStates = Array.from(channelOutcomes.values());
  const acceptedChannels = channelStates.filter(Boolean).length;
  const failedChannels = channelStates.length - acceptedChannels;
  const dispatchStatus = acceptedChannels === 0 ? 'FAILED' : failedChannels > 0 ? 'PARTIAL' : 'ACCEPTED';
  const sanitizedResults = results.map(({ smsBody: _b, ...rest }: any) => rest);
  const summary = {
    attemptedChannels: channelStates.length,
    acceptedChannels,
    failedChannels,
    providerAccepted: acceptedChannels > 0,
    handsetDeliveryConfirmed: false,
    results: sanitizedResults,
  };
  await env.DB.prepare(
    'UPDATE sl_pcm_events SET dispatch_status=?, last_result=? WHERE id=?'
  ).bind(dispatchStatus, JSON.stringify(summary).slice(0, 12000), eventId).run();

  if (dispatchStatus === 'FAILED') {
    // Non-2xx is intentional: SMS Forwarder can retry. FAILED rows do not dedupe retries.
    return {
      status: 502,
      json: { ok: false, status: 'FAILED', msisdn: phone, eventId, ...summary },
    };
  }

  // Return 2xx for accepted/partial dispatch to avoid resending to recipients
  // whose providers already accepted the alert. PARTIAL remains explicit in the result.
  return {
    status: 200,
    json: {
      ok: dispatchStatus === 'ACCEPTED',
      status: dispatchStatus === 'ACCEPTED' ? 'PROVIDER_ACCEPTED' : 'PARTIAL',
      msisdn: phone,
      eventId,
      ...summary,
    },
  };
}

export async function processPendingPcmRetries(env: ZeroEnv): Promise<{ processed: number; sent: number; failed: number }> {
  if (!env.DB) return { processed: 0, sent: 0, failed: 0 };
  await ensureZeroAirtimeSchema(env.DB);
  const now = Date.now();
  const { results: rows } = await env.DB.prepare(
    `SELECT id, recipient_phone, sms_body, attempts, max_attempts FROM sl_pcm_retries
     WHERE status = 'PENDING' AND next_retry_at <= ? AND attempts < max_attempts
     ORDER BY next_retry_at ASC LIMIT 20`
  ).bind(now).all<{ id: string; recipient_phone: string; sms_body: string; attempts: number; max_attempts: number }>();

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const row of rows || []) {
    processed++;
    const attemptRes = await sendViaSmsGateOnce(env, row.recipient_phone, row.sms_body);
    const nextAttempts = Number(row.attempts || 1) + 1;
    const updatedAt = Date.now();
    if (attemptRes.ok) {
      sent++;
      await env.DB.prepare(
        `UPDATE sl_pcm_retries SET status = 'PROVIDER_ACCEPTED', attempts = ?, last_error = NULL, updated_at = ? WHERE id = ?`
      ).bind(nextAttempts, updatedAt, row.id).run();
    } else {
      failed++;
      const exhausted = nextAttempts >= Number(row.max_attempts || 5);
      const nextRetryAt = updatedAt + Math.min(30 * 60_000, 60_000 * Math.pow(2, nextAttempts - 1));
      await env.DB.prepare(
        `UPDATE sl_pcm_retries SET status = ?, attempts = ?, last_error = ?, next_retry_at = ?, updated_at = ? WHERE id = ?`
      ).bind(
        exhausted ? 'DEAD' : 'PENDING',
        nextAttempts,
        String(attemptRes.detail || attemptRes.state || 'Retry failed').slice(0, 400),
        nextRetryAt,
        updatedAt,
        row.id
      ).run();
    }
  }
  return { processed, sent, failed };
}

export async function locatePcm(env: ZeroEnv, body: any): Promise<{ status: number; json: any }> {
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  const phone = toE164(body?.phone || '');
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!phone || !Number.isFinite(lat) || !Number.isFinite(lng)) return { status: 400, json: { error: 'phone, lat and lng are required' } };
  await ensureZeroAirtimeSchema(env.DB);
  await env.DB.prepare('UPDATE sl_profiles SET lat=?, lng=?, updated_at=? WHERE phone=?').bind(lat, lng, Date.now(), phone).run();
  const event = await env.DB.prepare(
    "SELECT id FROM sl_pcm_events WHERE owner_phone=? AND located=0 AND created_at>? AND COALESCE(dispatch_status, 'LEGACY') <> 'FAILED' ORDER BY created_at DESC LIMIT 1"
  ).bind(phone, Date.now() - 10 * 60_000).first<{ id: string }>();
  if (!event) return { status: 200, json: { ok: true, status: 'SAVED_NO_OPEN_ALERT' } };
  await env.DB.prepare('UPDATE sl_pcm_events SET located=1 WHERE id=?').bind(event.id).run();
  const saved = await loadContacts(env, phone);
  const results = await notifyContacts(env, {
    ownerPhone: phone,
    ownerName: saved.name,
    contacts: saved.contacts,
    lat,
    lng,
    voice: false,
    smsPrefix: 'SAFETYLINK LOCATION',
    eventId: event.id,
  });
  return { status: 200, json: { ok: true, status: 'LOCATION_SENT', results: results.map(({ smsBody: _b, ...r }: any) => r) } };
}

export function gatewayNumber(env: ZeroEnv): string {
  return toE164(env.RAIN_GATEWAY_MSISDN || '');
}
