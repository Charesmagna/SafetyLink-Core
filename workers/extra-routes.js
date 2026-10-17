// workers/extra-routes.js
// SafetyLink Worker — ADDITIVE routes. Nothing in worker.js is replaced:
// Routes added:
//   POST /pcm/<token>              SMS Forwarder webhook (zero-data SMS panic + Please Call Me)
//   POST /api/crime-report         community crime report -> crime_reports (trigger builds hotspots)
//   GET  /api/hotspots             hotspots near lat/lon
//   POST /api/partners/register    partner application (inactive until you approve it)
//   export routeToPartners()       called from fireAlerts() so EVERY trigger reaches matching partners
//
// Secrets (wrangler secret put NAME):
//   NEW:      PCM_WEBHOOK_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY
//   EXISTING: RESPONSE_CENTRE_NUMBER, TWILIO_SID, WHATSAPP_ACCESS_TOKEN, TWILIO_NUMBER,
//             TELEGRAM_BOT, TELEGRAM_CHAT, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
//             VAPI_PRIVATE_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ASSISTANT_ID

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const enc = new TextEncoder();
const q = encodeURIComponent;

const CRIME_TYPES = ['robbery', 'hijacking', 'assault', 'kidnapping', 'gbv', 'housebreaking', 'murder', 'other'];
const PARTNER_TYPES = ['armed_response', 'ambulance', 'cpf', 'gbv_support', 'fire_department', 'school',
  'hospital', 'municipality', 'neighbourhood_watch', 'corporate'];
const TIER_ALERTS = {
  free: ['PANIC', 'CRIME_REPORT'],
  basic: ['PANIC', 'MEDICAL', 'CRIME_REPORT', 'WATCH_ME_EXPIRED'],
  premium: ['PANIC', 'MEDICAL', 'FIRE', 'GBV', 'CRIME_REPORT', 'WATCH_ME_EXPIRED', 'BLE_DISCONNECTED', 'USSD', 'INBOUND_CALL'],
};
const OWNED = ['/api/crime-report', '/api/hotspots', '/api/partners/register'];

// ── small utilities ─────────────────────────────────────────────────────────
export function normaliseMsisdn(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/[^\d+]/g, '');
  const m = d.match(/^(?:\+?27|0)([1-9]\d{8})$/);
  if (m) return `+27${m[1]}`;
  return /^\+\d{8,15}$/.test(d) ? d : null;
}

function numbersInText(text) {
  const out = [];
  for (const m of String(text || '').matchAll(/(?<!\d)(?:\+27|27|0)[1-9]\d{8}(?!\d)/g)) {
    const n = normaliseMsisdn(m[0]);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Upstash (fail-open: a Redis outage must never block a panic) ────────────
async function redis(env, ...cmd) {
  if (!env.UPSTASH_REDIS_REST_URL) return { result: null, skipped: true };
  const r = await fetch(env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  return r.json();
}
async function once(env, key, ttl) {
  try { const r = await redis(env, 'SET', key, '1', 'NX', 'EX', String(ttl)); return r.skipped ? true : r.result === 'OK'; }
  catch { return true; }
}
async function rateLimit(env, key, limit, ttl) {
  try {
    const r = await redis(env, 'INCR', key);
    if (r.result === 1) await redis(env, 'EXPIRE', key, String(ttl));
    return (r.result ?? 0) <= limit;
  } catch { return true; }
}

// ── Supabase REST (service key: bypasses RLS, Worker-side only) ─────────────
async function sb(env, path, init = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) { const e = new Error(`supabase ${res.status}`); (e as any).status = res.status; throw e; }
  return res.status === 204 || res.headers.get('content-length') === '0' ? null : res.json().catch(() => null);
}
const findUserByPhone = async (p, env) =>
  (await sb(env, `profiles?phone_e164=eq.${q(p)}&select=id,name,phone_e164&limit=1`))?.[0] || null;
const findUserById = async (id, env) =>
  (await sb(env, `profiles?id=eq.${q(id)}&select=id,name,phone_e164&limit=1`))?.[0] || null;
const getSecret = async (id, env) =>
  (await sb(env, `user_secrets?user_id=eq.${q(id)}&select=sms_secret&limit=1`))?.[0]?.sms_secret || null;
const getContacts = async (id, env) =>
  (await sb(env, `emergency_contacts?user_id=eq.${q(id)}&select=name,phone&order=priority.asc`)) || [];

// ── outbound helpers ────────────────────────────────────────────────────────
async function sendSms(to, body, env) {
  if (!env.TWILIO_SID || !to) return;
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.TWILIO_SID}:${env.WHATSAPP_ACCESS_TOKEN || env.TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: env.TWILIO_NUMBER, To: to, Body: body }),
  });
}
async function notifyTelegram(env, text) {
  if (!env.TELEGRAM_BOT || !env.TELEGRAM_CHAT) return;
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT, text }),
  });
}
async function vapiCall(env, number, firstMessage) {
  if (!env.VAPI_PRIVATE_KEY || !env.VAPI_PHONE_NUMBER_ID) return;
  return fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
      customer: { number: number },
      assistant: { assistantId: env.VAPI_ASSISTANT_ID, assistantOverrides: { firstMessage } },
    }),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. SMS / PLEASE-CALL-ME GATEWAY  (SMS Forwarder -> /pcm/<token>)
// ═══════════════════════════════════════════════════════════════════════════
function classify(text) {
  const t = String(text || '');
  if (/^\s*SL1\|/.test(t) || /^\s*(sos|panic|help)\b/i.test(t)) return 'SMS';
  if (/please\s*call\s*me|call\s*me\s*back/i.test(t)) return 'PCM';
  return null; // anything else (OTPs, promos, bank SMS) is dropped and never stored
}

function parseSl1(text) {
  const m = String(text).trim().match(
    /^SL1\|([0-9a-fA-F-]{36})\|(-?\d+(?:\.\d+)?)?\|(-?\d+(?:\.\d+)?)?\|(\d{9,11})\|([0-9a-f]{16})$/);
  return m ? { userId: m[1], lat: m[2] ?? '', lon: m[3] ?? '', ts: m[4], sig: m[5] } : null;
}

function loosePayload(raw) {
  const grab = k => { const m = raw.match(new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"\\s*[,}]`)); return m ? m[1] : ''; };
  return { from: grab('from'), text: grab('text') };
}

async function handlePcm(request, env, { fireAlerts }, ctx) {
  const token = new URL(request.url).pathname.split('/')[2] || '';
  if (env.PCM_WEBHOOK_TOKEN && !safeEqual(token, env.PCM_WEBHOOK_TOKEN)) return json({ error: 'not_found' }, 404);

  const raw = await request.text();
  let p; try { p = JSON.parse(raw); } catch { p = loosePayload(raw); }
  const text = String(p.text || '');
  const kind = classify(text);
  // Always 200 for non-panic traffic so SMS Forwarder does not burn its retries.
  if (!kind) return json({ status: 'ignored' });

  const fromN = normaliseMsisdn(p.from);
  const parsed = kind === 'SMS' ? parseSl1(text) : null;

  // ── who is this? ──
  let user = null, verified = false;
  if (parsed) {
    const u = await findUserById(parsed.userId, env);
    if (u) {
      const secret = await getSecret(u.id, env);
      const age = Math.abs(Date.now() / 1000 - Number(parsed.ts));
      if (secret && age < 7 * 86400) {
        const expect = (await hmacHex(secret, `${parsed.userId}|${parsed.lat}|${parsed.lon}|${parsed.ts}`)).slice(0, 16);
        verified = safeEqual(expect, parsed.sig);
      }
      if (verified || u.phone_e164 === fromN) user = u;
    }
  }
  if (!user) {
    const candidates = [];
    if (fromN) candidates.push(fromN);
    if (kind === 'PCM') for (const n of numbersInText(text)) if (!candidates.includes(n)) candidates.push(n);
    for (const c of candidates) { user = await findUserByPhone(c, env); if (user) break; }
  }

  // ── duplicates: forwarder retries, replays, double-presses ──
  if (parsed?.sig && !(await once(env, `sl:sig:${parsed.sig}`, 7 * 86400))) return json({ status: 'duplicate' });
  if (!(await once(env, `sl:user:${user ? user.id : fromN || 'unknown'}`, 30))) return json({ status: 'duplicate' });

  const defaultGatewayPhone = env.RESPONSE_CENTRE_NUMBER || '+27816738186';

  // ── not a registered user: tell the command centre, do NOT auto-call anyone ──
  if (!user) {
    if (!(await rateLimit(env, `sl:unreg:${fromN || 'unknown'}`, 3, 3600))) return json({ status: 'rate_limited' });
    const note = `SafetyLink gateway: ${kind} from UNREGISTERED ${fromN || p.from || 'unknown'}. "${text.slice(0, 160)}"`;
    const work = Promise.allSettled([notifyTelegram(env, note), sendSms(defaultGatewayPhone, note.slice(0, 300), env)]);
    if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
    return json({ status: 'unregistered_forwarded' });
  }

  // ── registered user: full alert chain ──
  const trusted = verified || (!!parsed && user.phone_e164 === fromN);
  const lat = trusted && parsed?.lat ? Number(parsed.lat) : null;
  const lon = trusted && parsed?.lon ? Number(parsed.lon) : null;
  const contacts = await getContacts(user.id, env);
  const list = contacts.length ? contacts : [{ name: 'SafetyLink Command', phone: defaultGatewayPhone }];
  const smsText =
    `SAFETYLINK PANIC: ${user.name} needs help (no data, sent via ${kind === 'PCM' ? 'Please Call Me' : 'SMS'}). ` +
    `Call ${user.phone_e164 || fromN || ''}. ` +
    (lat != null && lon != null ? `Location https://maps.google.com/?q=${lat},${lon}` : 'Location not captured') +
    (verified ? '' : ' [sender not verified]');

  const work = (async () => {
    await fireAlerts({
      userId: user.id, name: user.name, lat, lon,
      trigger: kind === 'PCM' ? 'PCM_GATEWAY' : 'SMS_GATEWAY',
      contacts: list,
    }, env);
    await Promise.allSettled(list.map(c => sendSms(normaliseMsisdn(c.phone) || c.phone, smsText, env)));
  })().catch(e => console.error('[gateway] dispatch failed', e?.message));

  if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
  return json({ status: 'alert_dispatched', verified, contacts: list.length });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CRIME REPORTS + HOTSPOTS
// ═══════════════════════════════════════════════════════════════════════════
async function handleCrimeReport(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `sl:crime:${ip}`, 10, 3600))) return json({ error: 'rate_limited' }, 429);
  let b; try { b = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const lat = Number(b.lat), lon = Number(b.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return json({ error: 'bad_location' }, 400);
  if (!CRIME_TYPES.includes(b.crimeType)) return json({ error: 'bad_crime_type' }, 400);
  // Store report in Supabase
  await sb(env, 'crime_reports', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ lat, lon, crime_type: b.crimeType, description: String(b.description || '').slice(0, 500), anonymous: true }),
  });
  return json({ status: 'recorded' });
}

async function handleHotspots(request, env) {
  const u = new URL(request.url);
  const lat = Number(u.searchParams.get('lat')), lon = Number(u.searchParams.get('lon'));
  const radius = Math.min(Math.max(Number(u.searchParams.get('radius')) || 10, 1), 50);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json({ error: 'bad_location' }, 400);
  const dLat = radius / 111, dLon = radius / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const rows = await sb(env,
    `crime_hotspots?lat=gte.${lat - dLat}&lat=lte.${lat + dLat}&lon=gte.${lon - dLon}&lon=lte.${lon + dLon}` +
    `&last_reported=gte.${q(since)}&select=id,lat,lon,radius,crime_type,severity,report_count,last_reported,area&limit=500`);
  return json((rows || []).map(r => ({
    id: r.id, lat: r.lat, lon: r.lon, radius: r.radius, crimeType: r.crime_type, severity: r.severity,
    reportCount: r.report_count, lastReported: r.last_reported, area: r.area || 'Reported area',
  })));
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PARTNER PLATFORM
// ═══════════════════════════════════════════════════════════════════════════
function isSafeWebhook(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(':')) return false;
    return true;
  } catch { return false; }
}
const randomHex = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
function randomOrgCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (const b of crypto.getRandomValues(new Uint8Array(4))) s += A[b % A.length];
  return `SL-ORG-${s}`;
}

async function handlePartnerRegister(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await rateLimit(env, `sl:partner:${ip}`, 5, 3600))) return json({ error: 'rate_limited' }, 429);
  let b; try { b = await request.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const whatsapp = normaliseMsisdn(b.whatsapp);
  const type = b.partnerType, tier = TIER_ALERTS[b.tier] ? b.tier : 'free';
  if (name.length < 2 || name.length > 120) return json({ error: 'bad_name' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'bad_email' }, 400);
  if (!whatsapp) return json({ error: 'bad_whatsapp' }, 400);
  if (!PARTNER_TYPES.includes(type)) return json({ error: 'bad_partner_type' }, 400);

  let webhook = null, dispatch = null;
  if (tier !== 'free') {
    if (b.webhookUrl) { if (!isSafeWebhook(String(b.webhookUrl))) return json({ error: 'bad_webhook' }, 400); webhook = String(b.webhookUrl); }
    if (b.dispatchPhone) { dispatch = normaliseMsisdn(b.dispatchPhone); if (!dispatch) return json({ error: 'bad_dispatch_phone' }, 400); }
  }

  const defaultGatewayPhone = env.RESPONSE_CENTRE_NUMBER || '+27816738186';

  const row = {
    name, type, tier, email, whatsapp,
    contact_person: String(b.contactPerson || '').slice(0, 120),
    coverage_areas: String(b.coverageAreas || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20),
    webhook_url: webhook, webhook_secret: randomHex(32), dispatch_phone: dispatch,
    alert_types: TIER_ALERTS[tier],
    active: false,
  };

  for (let i = 0; i < 5; i++) {
    const orgCode = randomOrgCode();
    try {
      await sb(env, 'partners', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ ...row, org_code: orgCode }) });
      const note = `New SafetyLink partner application: ${name} (${type}, ${tier}) ${whatsapp} ${email} — ${orgCode} — inactive until approved.`;
      await Promise.allSettled([notifyTelegram(env, note), sendSms(defaultGatewayPhone, note.slice(0, 300), env)]);
      return json({ status: 'received' });
    } catch (e) { if (e.status !== 409) throw e; }
  }
  return json({ error: 'try_again' }, 503);
}

export async function routeToPartners(env, alert) {
  if (!env.SUPABASE_URL || alert.lat == null || alert.lon == null) return;
  const partners = await sb(env,
    `partners?active=eq.true&alert_types=cs.%7B${alert.type}%7D` +
    `&select=id,org_code,name,webhook_url,webhook_secret,dispatch_phone,lat,lon,coverage_radius_km&limit=200`) || [];
  const near = partners.filter(p => p.lat != null && p.lon != null &&
    distanceKm(alert.lat, alert.lon, p.lat, p.lon) <= (p.coverage_radius_km || 10));
  const alertId = crypto.randomUUID();
  const maps = `https://maps.google.com/?q=${alert.lat},${alert.lon}`;

  await Promise.allSettled(near.map(async p => {
    const started = Date.now();
    let method = 'none', status = 'failed';
    try {
      if (p.webhook_url) {
        method = 'webhook';
        const body = JSON.stringify({
          alertId, type: alert.type, timestamp: new Date().toISOString(),
          user: { id: alert.userId, name: alert.name },
          location: { lat: alert.lat, lon: alert.lon, googleMapsUrl: maps },
          trigger: alert.trigger, severity: 'critical', orgCode: p.org_code,
        });
        const res = await fetch(p.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SafetyLink-Signature': await hmacHex(p.webhook_secret, body),
            'X-SafetyLink-Partner': p.org_code,
          },
          body, signal: AbortSignal.timeout(8000),
        });
        status = res.ok ? 'sent' : 'failed';
      } else if (p.dispatch_phone) {
        method = 'vapi';
        const res = await vapiCall(env, p.dispatch_phone,
          `SafetyLink alert for ${p.name}. ${alert.type} reported. ${alert.name || 'A user'} needs help. Location link sent by SMS.`);
        await sendSms(p.dispatch_phone, `SAFETYLINK ${alert.type}: ${alert.name || 'user'} needs help. ${maps}`, env);
        status = res.ok ? 'sent' : 'failed';
      }
    } catch { status = 'failed'; }
    await sb(env, 'alert_routing', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ alert_id: alertId, partner_id: p.id, partner_name: p.name, method, status, response_time_ms: Date.now() - started }),
    }).catch(() => {});
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT — returns a Response for routes it owns, otherwise null
// ═══════════════════════════════════════════════════════════════════════════
export async function handleExtra(request, env, helpers, ctx) {
  const path = new URL(request.url).pathname;
  const owned = path.startsWith('/pcm/') || OWNED.includes(path);
  if (!owned) return null;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    if (path.startsWith('/pcm/') && request.method === 'POST') return await handlePcm(request, env, helpers, ctx);
    if (path === '/api/crime-report' && request.method === 'POST') return await handleCrimeReport(request, env);
    if (path === '/api/hotspots' && request.method === 'GET') return await handleHotspots(request, env);
    if (path === '/api/partners/register' && request.method === 'POST') return await handlePartnerRegister(request, env);
    return json({ error: 'method_not_allowed' }, 405);
  } catch (e) {
    console.error('[extra-routes]', path, e?.message);
    return json({ error: 'server_error' }, 500);
  }
}
