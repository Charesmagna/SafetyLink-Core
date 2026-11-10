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

async function notifyContacts(env: ZeroEnv, opts: {
  ownerPhone: string;
  ownerName: string;
  contacts: string[];
  lat?: number;
  lng?: number;
  voice: boolean;
  smsPrefix: string;
  note?: string;
}): Promise<any[]> {
  const targets = opts.contacts.length
    ? opts.contacts
    : [toE164(env.RESPONSE_CENTRE_NUMBER || '')].filter(Boolean);
  const place = opts.lat && opts.lng ? `https://maps.google.com/?q=${opts.lat},${opts.lng}` : 'Location not available yet';
  const locTxt = opts.lat && opts.lng ? `Last known location: ${place}` : 'Last known location: not available yet';
  const noteTxt = opts.note ? ` Message from ${opts.ownerName}: ${opts.note}.` : '';
  const smsBody = `SAFETYLINK ALERT: ${opts.ownerName} (${opts.ownerPhone}) pressed the SafetyLink button. ${locTxt}.${noteTxt} Please call them now. SafetyLink does not replace 10111 or 112.`.slice(0, 480);
  const spoken = `This is SafetyLink. ${opts.ownerName} has triggered a panic alert. ${opts.lat ? 'A map link was sent by message.' : 'No location yet.'} Please respond.`;
  const twAuth = env.TWILIO_SID && env.TWILIO_AUTH_TOKEN ? btoa(`${env.TWILIO_SID}:${env.TWILIO_AUTH_TOKEN}`) : '';
  const waFrom = env.TWILIO_WHATSAPP_FROM || env.TWILIO_NUMBER;
  const results: any[] = [];

  const twPost = (path: string, params: Record<string, string>) =>
    fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/${path}.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${twAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });

  await Promise.allSettled(targets.map(async (to, index) => {
    if (twAuth && waFrom) {
      const r = await twPost('Messages', { From: `whatsapp:${waFrom}`, To: `whatsapp:${to}`, Body: smsBody }).catch(() => null);
      results.push({ to, channel: 'WHATSAPP', ok: !!r?.ok, status: r?.status });
    }
    let smsOk = false;
    // Primary route: SMS-Gate Cloud delivers through the registered Rain Android gateway.
    const sgU = env.SMSGATE_USERNAME, sgP = env.SMSGATE_PASSWORD;
    if (sgU && sgP) {
      const base = (env.SMSGATE_BASE_URL || 'https://api.sms-gate.app').replace(/\/+$/, '');
      const simNumber = Math.max(1, Math.min(2, Number(env.SMSGATE_SIM_NUMBER || 1) || 1));
      try {
        const r = await fetch(`${base}/3rdparty/v1/messages`, {
          method: 'POST',
          headers: { Authorization: 'Basic ' + btoa(`${sgU}:${sgP}`), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textMessage: { text: smsBody },
            phoneNumbers: [to],
            ...(env.SMSGATE_DEVICE_ID ? { deviceId: env.SMSGATE_DEVICE_ID } : {}),
            simNumber,
            ttl: 1800,
            priority: 100,
          }),
        });
        const responseText = (await r.text().catch(() => '')).slice(0, 500);
        let responseBody: any = {};
        try { responseBody = responseText ? JSON.parse(responseText) : {}; } catch { /* retain response text */ }
        smsOk = r.ok;
        results.push({
          to, channel: 'SMS', provider: 'smsgate',
          ok: smsOk, status: r.status,
          state: smsOk ? 'QUEUED' : 'REJECTED',
          messageId: responseBody.id || responseBody.messageId || undefined,
          detail: smsOk ? undefined : responseText,
        });
      } catch (error: any) {
        results.push({ to, channel: 'SMS', provider: 'smsgate', ok: false, state: 'ERROR', detail: String(error?.message || error).slice(0, 200) });
      }
    }
    // 2) Backups only if the Rain route did not work
    if (!smsOk && env.AT_API_KEY && env.AT_USERNAME) {
      const r = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { apiKey: env.AT_API_KEY, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: env.AT_USERNAME, to, message: smsBody }).toString(),
      }).catch(() => null);
      smsOk = !!r?.ok;
      results.push({ to, channel: 'SMS', provider: 'africastalking', ok: smsOk, status: r?.status });
    }
    if (!smsOk && twAuth && env.TWILIO_NUMBER) {
      const r = await twPost('Messages', { From: env.TWILIO_NUMBER, To: to, Body: smsBody }).catch(() => null);
      results.push({ to, channel: 'SMS', provider: 'twilio', ok: !!r?.ok, status: r?.status });
    }
    if (!opts.voice || index > 2) return;
    if (env.VAPI_PRIVATE_KEY && env.VAPI_PHONE_NUMBER_ID) {
      const body: any = {
        phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
        customer: { number: to },
      };
      if (env.VAPI_ASSISTANT_ID) {
        body.assistantId = env.VAPI_ASSISTANT_ID;
        body.assistantOverrides = { firstMessage: spoken };
      } else {
        body.assistant = { firstMessage: spoken, model: { provider: 'openai', model: 'gpt-4o-mini' }, voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }, maxDurationSeconds: 45 };
      }
      const r = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => null);
      if (r?.ok) {
        results.push({ to, channel: 'VOICE', provider: 'vapi', ok: true });
        return;
      }
      results.push({ to, channel: 'VOICE', provider: 'vapi', ok: false, status: r?.status });
    }
    if (twAuth && env.TWILIO_NUMBER) {
      const r = await twPost('Calls', {
        From: env.TWILIO_NUMBER,
        To: to,
        Twiml: `<Response><Say voice="alice">${spoken}</Say></Response>`,
      }).catch(() => null);
      results.push({ to, channel: 'VOICE', provider: 'twilio', ok: !!r?.ok, status: r?.status });
    }
  }));
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
      // Unknown caller: never alert strangers. Send the command centre a single SMS so a person can act.
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
      voice: true,
      smsPrefix: 'SAFETYLINK PANIC',
      note: saved.note,
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
  const summary = {
    attemptedChannels: channelStates.length,
    acceptedChannels,
    failedChannels,
    providerAccepted: acceptedChannels > 0,
    handsetDeliveryConfirmed: false,
    results,
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
  });
  return { status: 200, json: { ok: true, status: 'LOCATION_SENT', results } };
}

export function gatewayNumber(env: ZeroEnv): string {
  return toE164(env.RAIN_GATEWAY_MSISDN || '');
}
