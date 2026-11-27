// Zero-airtime trail.
// The phone sends a free Please Call Me to the Rain SIM.
// Rain posts that SMS here. Contacts were saved earlier, while the user had data.
// This file does not replace /api/panic.

import { sendLoudAlarm } from './fcm';
import { tokensForPhone, pruneDeviceToken, phoneLookupVariants } from './device-tokens';

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
  FCM_SERVICE_ACCOUNT?: string;
}

const DEDUPE_MS = 5 * 60_000; // 5-minute strict cooldown per caller (prevents repeat PCM SMS bursts)

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
  // Match South African mobile numbers even with spaces, hyphens, or parentheses
  // e.g. "Please call me: 072 123 4567", "+27 82-123-4567", "27831234567", "(084) 123 4567"
  const saPhonePattern = '(?:\\+?27|0)[\\s\\-()]?[6-8]\\d[\\s\\-]?\\d{3}[\\s\\-]?\\d{4}';
  const contextualRe = new RegExp(`(?:call(?:\\s|-)?me(?:\\s|-)?(?:back)?(?:\\s|-)?(?:at|from|on)?|pls\\s*call|callback)[:\\s]*(${saPhonePattern})`, 'i');
  const bareRe = new RegExp(`(${saPhonePattern})`);
  const match = text.match(contextualRe) || text.match(bareRe);
  const candidate = (match && match[1]) || '';
  if (candidate) {
    const normalized = toE164(candidate);
    if (normalized.length >= 11) return normalized;
  }
  // Fall back to sender only if it looks like a real mobile number (not carrier shortcodes like 140 / Vodacom)
  const senderNormalized = toE164(sender || '');
  if (/^\+27[6-8]\d{8}$/.test(senderNormalized) || /^\+\d{10,15}$/.test(senderNormalized)) {
    return senderNormalized;
  }
  return '';
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
    `CREATE TABLE IF NOT EXISTS sl_gateway_health (
      gateway_id TEXT PRIMARY KEY,
      last_seen INTEGER NOT NULL,
      battery INTEGER,
      sim_slot TEXT,
      network TEXT,
      last_alert_at INTEGER
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
  const contacts = Array.isArray(body?.contacts) ? body.contacts.slice(0, 15) : [];
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

async function loadContacts(env: ZeroEnv, phone: string): Promise<{ name: string; contacts: string[]; lat?: number; lng?: number; note?: string; known: boolean }> {
  const variants = phoneLookupVariants(phone);
  const placeholders = variants.map(() => '?').join(', ');

  let profile: { phone?: string; name: string; lat: number; lng: number; alert_note: string } | null = null;
  if (variants.length > 0) {
    profile = await env.DB!.prepare(
      `SELECT phone, name, lat, lng, alert_note FROM sl_profiles WHERE phone IN (${placeholders}) ORDER BY updated_at DESC LIMIT 1`
    ).bind(...variants).first<{ phone?: string; name: string; lat: number; lng: number; alert_note: string }>().catch(() => null);
  }

  // Fallback to main users table if user registered an account before sl_profiles synced
  if (!profile && variants.length > 0) {
    const userRow = await env.DB!.prepare(
      `SELECT username, phone, lat, lng FROM users WHERE phone IN (${placeholders}) LIMIT 1`
    ).bind(...variants).first<{ username?: string; phone?: string; lat?: number; lng?: number }>().catch(() => null);
    if (userRow) {
      profile = {
        phone: userRow.phone,
        name: userRow.username || phone,
        lat: Number(userRow.lat || 0),
        lng: Number(userRow.lng || 0),
        alert_note: '',
      };
    }
  }

  const rows = variants.length > 0
    ? await env.DB!.prepare(
        `SELECT contact_phone FROM sl_contacts WHERE owner_phone IN (${placeholders}) ORDER BY sort_order ASC LIMIT 5`
      ).bind(...variants).all<{ contact_phone: string }>().catch(() => ({ results: [] }))
    : { results: [] };

  const uniqueContacts = Array.from(
    new Set((rows.results || []).map((r) => toE164(r.contact_phone)).filter(Boolean))
  );

  return {
    name: profile?.name || phone,
    contacts: uniqueContacts,
    lat: profile?.lat || undefined,
    lng: profile?.lng || undefined,
    note: profile?.alert_note || undefined,
    known: Boolean(profile || uniqueContacts.length > 0),
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
  const nextRetryAt = now + 5 * 60_000; // Wait 5 minutes before a single automatic retry
  for (const r of results) {
    if (r?.ok === true || !r?.to || !r?.smsBody) continue;
    // Never enqueue FCM or client-rejected 4xx errors for SMSGate retry
    if (r.channel !== 'SMS') continue;
    if (typeof r.status === 'number' && r.status >= 400 && r.status < 500 && r.status !== 429) continue;
    await env.DB.prepare(
      `INSERT INTO sl_pcm_retries (id, event_id, owner_phone, recipient_phone, sms_body, attempts, max_attempts, status, last_error, next_retry_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 2, 'PENDING', ?, ?, ?, ?)`
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
    // Run FCM Loud Alarm (high-priority data-only wake ring) AND SMSGate in parallel
    // so emergency contacts with the SafetyLink app start ringing immediately regardless of SMSGate latency!
    const fcmTask = (async () => {
      if (!env.FCM_SERVICE_ACCOUNT || !env.DB) return;
      try {
        const tokens = await tokensForPhone(env.DB, to);
        if (tokens.length === 0) {
          results.push({
            to,
            channel: 'FCM_LOUD_ALARM',
            provider: 'firebase',
            ok: false,
            state: 'NO_DEVICE_TOKEN',
            detail: 'Contact has no registered SafetyLink app FCM token yet',
          });
          return;
        }
        await Promise.allSettled(tokens.map(async (devToken) => {
          const fcmRes = await sendLoudAlarm(
            env.FCM_SERVICE_ACCOUNT!,
            devToken,
            '🚨 EMERGENCY: SafetyLink Alert',
            `${opts.ownerName} (${opts.ownerPhone}) triggered a zero-airtime SOS! ${locTxt}`,
            {
              callerName: opts.ownerName,
              callerNumber: opts.ownerPhone,
              location: place,
              triggerSource: 'RAIN_PCM_ZERO_AIRTIME',
              ...(opts.eventId ? { incidentId: opts.eventId, eventId: opts.eventId } : {}),
              ...(opts.note ? { alertNote: opts.note } : {}),
              ...(opts.lat ? { lat: String(opts.lat) } : {}),
              ...(opts.lng ? { lng: String(opts.lng) } : {}),
            },
          ).catch((e: any) => ({ ok: false, status: 500, error: String(e?.message || e), unregistered: false }));

          if (!fcmRes.ok && fcmRes.unregistered) {
            await pruneDeviceToken(env.DB, devToken);
          }

          results.push({
            to,
            channel: 'FCM_LOUD_ALARM',
            provider: 'firebase',
            ok: fcmRes.ok,
            status: fcmRes.status,
            state: fcmRes.ok ? 'DELIVERED_TO_FCM' : (fcmRes.unregistered ? 'STALE_TOKEN_PRUNED' : 'FAILED'),
            detail: fcmRes.ok ? 'High-priority loud alarm sent to SafetyLink app' : fcmRes.error,
          });
        }));
      } catch (e: any) {
        results.push({
          to,
          channel: 'FCM_LOUD_ALARM',
          provider: 'firebase',
          ok: false,
          state: 'ERROR',
          detail: String(e?.message || e).slice(0, 200),
        });
      }
    })();

    const smsTask = (async () => {
      const res = await sendViaSmsGateWithRetry(env, to, smsBody, 2);
      results.push(res);
    })();

    await Promise.allSettled([fcmTask, smsTask]);
  }));

  if (opts.eventId) {
    await enqueueFailedRetries(env, opts.eventId, opts.ownerPhone, results);
  }
  return results;
}

function isLoopOrCarrierNoise(rawText: string, sender: string, extractedPhone: string, env: ZeroEnv): string | null {
  const txt = String(rawText || '').toLowerCase();
  const gw = gatewayNumber(env);
  const centre = toE164(env.RESPONSE_CENTRE_NUMBER || '');
  if (gw && extractedPhone === gw) return 'SELF_GATEWAY_NUMBER';
  if (centre && extractedPhone === centre) return 'RESPONSE_CENTRE_ECHO';
  if (
    txt.includes('safetylink alert') ||
    txt.includes('safetylink panic') ||
    txt.includes('safetylink location') ||
    txt.includes('safetylink watchdog') ||
    txt.includes('unknown caller:')
  ) {
    return 'SAFETYLINK_OUTBOUND_ECHO';
  }
  if (
    txt.includes('delivery report') ||
    txt.includes('remaining sms') ||
    txt.includes('out of bundle') ||
    txt.includes('insufficient airtime') ||
    txt.includes('insufficient balance') ||
    txt.includes('otp') ||
    txt.includes('verification code') ||
    txt.includes('bundle balance')
  ) {
    return 'CARRIER_SYSTEM_NOTICE';
  }
  // If rawText is long and does not look like a Please Call Me / emergency SMS, ignore to prevent SMS loops
  const looksLikePcm = /call\s*me|please\s*call|pls\s*call|call\s*back|callback|pcm|sos|panic|help|emergency/i.test(txt) || txt.length <= 40;
  if (txt.length > 0 && !looksLikePcm) {
    return 'NON_PCM_SMS_IGNORED';
  }
  return null;
}

export async function inboundPcm(env: ZeroEnv, rawText: string, sender: string): Promise<{ status: number; json: any }> {
  const phone = extractMsisdn(rawText, sender);
  if (!phone) return { status: 200, json: { ok: true, status: 'IGNORED_NO_CALLER_NUMBER' } };
  const noiseReason = isLoopOrCarrierNoise(rawText, sender, phone, env);
  if (noiseReason) {
    console.warn('[PCM Loop Guard] Ignored inbound SMS:', { noiseReason, phone });
    return { status: 200, json: { ok: true, status: 'IGNORED_LOOP_GUARD', reason: noiseReason, msisdn: phone } };
  }
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  await ensureZeroAirtimeSchema(env.DB);
  const saved = await loadContacts(env, phone);
  if (!saved.known) {
      // Unknown caller: apply 5-minute dedupe here too so unregistered numbers can never spam SMSGate!
      const since = Date.now() - DEDUPE_MS;
      const recentUnknown = await env.DB.prepare(
        "SELECT id FROM sl_pcm_events WHERE owner_phone=? AND created_at>? LIMIT 1"
      ).bind(phone, since).first<{ id: string }>();
      if (recentUnknown) {
        return { status: 200, json: { ok: true, status: 'DEDUPED_UNKNOWN', msisdn: phone, eventId: recentUnknown.id } };
      }
      const evId = crypto.randomUUID();
      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO sl_pcm_events (id, owner_phone, created_at, located, dispatch_status, attempts, last_attempt_at) VALUES (?, ?, ?, 0, 'ACCEPTED', 1, ?)"
      ).bind(evId, phone, now, now).run().catch(() => {});
      const centre = toE164(env.RESPONSE_CENTRE_NUMBER || '');
      if (centre) {
        await notifyContacts(env, { ownerPhone: phone, ownerName: 'Unregistered caller', contacts: [centre], voice: false, smsPrefix: 'UNKNOWN CALLER' });
      }
      return { status: 200, json: { ok: true, status: 'UNKNOWN_FORWARDED_TO_COMMAND', msisdn: phone, eventId: evId } };
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
    if (result?.state === 'NO_DEVICE_TOKEN') continue;
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
  return toE164(env.RAIN_GATEWAY_MSISDN || '0816738186');
}

const GATEWAY_STALE_MS = 15 * 60_000;
const GATEWAY_ALERT_COOLDOWN_MS = 60 * 60_000;

export async function recordGatewayHeartbeat(
  env: ZeroEnv,
  body: { gatewayId?: string; battery?: number; simSlot?: string; network?: string }
): Promise<{ status: number; json: any }> {
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  await ensureZeroAirtimeSchema(env.DB);
  const gatewayId = String(body?.gatewayId || 'rain-sim-1').trim().slice(0, 64) || 'rain-sim-1';
  const now = Date.now();
  const battery = Number.isFinite(Number(body?.battery)) ? Math.max(0, Math.min(100, Math.round(Number(body.battery)))) : null;
  const simSlot = body?.simSlot ? String(body.simSlot).slice(0, 24) : null;
  const network = body?.network ? String(body.network).slice(0, 48) : null;
  await env.DB.prepare(
    `INSERT INTO sl_gateway_health (gateway_id, last_seen, battery, sim_slot, network, last_alert_at)
     VALUES (?, ?, ?, ?, ?, NULL)
     ON CONFLICT(gateway_id) DO UPDATE SET last_seen=excluded.last_seen, battery=COALESCE(excluded.battery, sl_gateway_health.battery), sim_slot=COALESCE(excluded.sim_slot, sl_gateway_health.sim_slot), network=COALESCE(excluded.network, sl_gateway_health.network)`
  ).bind(gatewayId, now, battery, simSlot, network).run();
  return { status: 200, json: { ok: true, gatewayId, lastSeen: now, battery, simSlot, network } };
}

export async function getGatewayHealth(env: ZeroEnv): Promise<{ status: number; json: any }> {
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  await ensureZeroAirtimeSchema(env.DB);
  const now = Date.now();
  const { results: gateways } = await env.DB.prepare(
    'SELECT gateway_id, last_seen, battery, sim_slot, network, last_alert_at FROM sl_gateway_health ORDER BY last_seen DESC LIMIT 10'
  ).all<{ gateway_id: string; last_seen: number; battery: number | null; sim_slot: string | null; network: string | null; last_alert_at: number | null }>();
  const pendingRow = await env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM sl_pcm_retries WHERE status = 'PENDING'"
  ).first<{ cnt: number }>();

  const list = (gateways || []).map((g) => {
    const ageMs = Math.max(0, now - Number(g.last_seen || 0));
    return {
      gatewayId: g.gateway_id,
      lastSeen: g.last_seen,
      ageSeconds: Math.round(ageMs / 1000),
      online: ageMs <= GATEWAY_STALE_MS,
      battery: g.battery,
      simSlot: g.sim_slot,
      network: g.network,
    };
  });

  return {
    status: 200,
    json: {
      ok: true,
      anyOnline: list.some((g) => g.online),
      staleThresholdMinutes: Math.round(GATEWAY_STALE_MS / 60_000),
      pendingRetries: Number(pendingRow?.cnt || 0),
      gateways: list,
    },
  };
}

export async function checkGatewayStaleAlert(env: ZeroEnv): Promise<{ checked: number; stale: number; alerted: number }> {
  if (!env.DB) return { checked: 0, stale: 0, alerted: 0 };
  await ensureZeroAirtimeSchema(env.DB);
  const now = Date.now();
  const { results: gateways } = await env.DB.prepare(
    'SELECT gateway_id, last_seen, last_alert_at FROM sl_gateway_health'
  ).all<{ gateway_id: string; last_seen: number; last_alert_at: number | null }>();

  let stale = 0;
  let alerted = 0;
  const centre = toE164(env.RESPONSE_CENTRE_NUMBER || '');

  for (const g of gateways || []) {
    const ageMs = now - Number(g.last_seen || 0);
    if (ageMs <= GATEWAY_STALE_MS) continue;
    stale++;
    const lastAlert = Number(g.last_alert_at || 0);
    if (lastAlert && now - lastAlert < GATEWAY_ALERT_COOLDOWN_MS) continue;
    console.warn('[PCM Gateway Watchdog] Stale Rain relay detected', {
      gatewayId: g.gateway_id,
      silentMinutes: Math.round(ageMs / 60_000),
    });
    if (centre && env.SMSGATE_USERNAME && env.SMSGATE_PASSWORD) {
      const msg = `SAFETYLINK WATCHDOG: Rain relay ${g.gateway_id} has not sent a heartbeat for ${Math.round(ageMs / 60_000)} minutes. Check power, SIM, and SMS Forwarder app.`;
      await sendViaSmsGateOnce(env, centre, msg).catch(() => {});
    }
    await env.DB.prepare('UPDATE sl_gateway_health SET last_alert_at=? WHERE gateway_id=?')
      .bind(now, g.gateway_id).run().catch(() => {});
    alerted++;
  }

  return { checked: (gateways || []).length, stale, alerted };
}
