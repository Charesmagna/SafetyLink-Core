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
  RAIN_GATEWAY_MSISDN?: string;
}

const DEDUPE_MS = 120_000;

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
    `CREATE TABLE IF NOT EXISTS sl_profiles (phone TEXT PRIMARY KEY, name TEXT, lat REAL, lng REAL, token TEXT, updated_at INTEGER)`,
    `CREATE TABLE IF NOT EXISTS sl_contacts (id TEXT PRIMARY KEY, owner_phone TEXT NOT NULL, contact_phone TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS sl_pcm_events (id TEXT PRIMARY KEY, owner_phone TEXT NOT NULL, created_at INTEGER NOT NULL, located INTEGER DEFAULT 0)`,
  ];
  for (const sql of statements) {
    await db.prepare(sql).run();
  }
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
  await env.DB.prepare('DELETE FROM sl_contacts WHERE owner_phone=?').bind(phone).run();
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i] || {};
    const contactPhone = toE164(c.phone || '');
    if (!contactPhone || contactPhone === phone) continue;
    await env.DB.prepare(
      'INSERT INTO sl_contacts (id, owner_phone, name, contact_phone, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), phone, String(c.name || '').slice(0, 80), contactPhone, i).run();
  }
  return { status: 200, json: { ok: true, phone, token, contacts: contacts.length } };
}

async function loadContacts(env: ZeroEnv, phone: string): Promise<{ name: string; contacts: string[]; lat?: number; lng?: number }> {
  const profile = await env.DB!.prepare('SELECT name, lat, lng FROM sl_profiles WHERE phone=?').bind(phone).first<{ name: string; lat: number; lng: number }>();
  const rows = await env.DB!.prepare(
    'SELECT contact_phone FROM sl_contacts WHERE owner_phone=? ORDER BY sort_order ASC LIMIT 5'
  ).bind(phone).all<{ contact_phone: string }>();
  return {
    name: profile?.name || phone,
    contacts: (rows.results || []).map(r => r.contact_phone).filter(Boolean),
    lat: profile?.lat || undefined,
    lng: profile?.lng || undefined,
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
}): Promise<any[]> {
  const targets = opts.contacts.length
    ? opts.contacts
    : [toE164(env.RESPONSE_CENTRE_NUMBER || '')].filter(Boolean);
  const place = opts.lat && opts.lng ? `https://maps.google.com/?q=${opts.lat},${opts.lng}` : 'Location not available yet';
  const smsBody = `${opts.smsPrefix}\n${opts.ownerName} (${opts.ownerPhone}) needs help.\n${place}`.slice(0, 480);
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
    if (env.AT_API_KEY && env.AT_USERNAME) {
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

export async function inboundPcm(env: ZeroEnv, rawText: string, sender: string, secretHeader: string): Promise<{ status: number; json: any }> {
  if (env.PCM_WEBHOOK_SECRET && secretHeader !== env.PCM_WEBHOOK_SECRET) {
    return { status: 401, json: { error: 'Bad gateway secret' } };
  }
  const phone = extractMsisdn(rawText, sender);
  if (!phone) return { status: 400, json: { error: 'No caller number in the SMS' } };
  if (!env.DB) return { status: 503, json: { error: 'Database not configured' } };
  await ensureZeroAirtimeSchema(env.DB);
  const saved = await loadContacts(env, phone);
  if (!saved.contacts.length && saved.name === phone) {
    const known = await env.DB.prepare('SELECT phone FROM sl_profiles WHERE phone=?').bind(phone).first();
    if (!known) return { status: 200, json: { ok: true, status: 'IGNORED_UNKNOWN', msisdn: phone } };
  }
  const since = Date.now() - DEDUPE_MS;
  const recent = await env.DB.prepare(
    'SELECT id FROM sl_pcm_events WHERE owner_phone=? AND created_at>? LIMIT 1'
  ).bind(phone, since).first();
  if (recent) return { status: 200, json: { ok: true, status: 'DEDUPED', msisdn: phone } };
  const eventId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO sl_pcm_events (id, owner_phone, created_at, located) VALUES (?, ?, ?, 0)').bind(eventId, phone, Date.now()).run();
  const results = await notifyContacts(env, {
    ownerPhone: phone,
    ownerName: saved.name,
    contacts: saved.contacts,
    lat: saved.lat,
    lng: saved.lng,
    voice: true,
    smsPrefix: 'SAFETYLINK PANIC',
  });
  return { status: 200, json: { ok: true, status: 'DISPATCHED', msisdn: phone, eventId, results } };
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
    'SELECT id FROM sl_pcm_events WHERE owner_phone=? AND located=0 AND created_at>? ORDER BY created_at DESC LIMIT 1'
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
