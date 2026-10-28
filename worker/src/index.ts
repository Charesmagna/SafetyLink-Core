import { sendLoudAlarm } from './fcm';
import { saveDeviceToken, tokensForPhone } from './device-tokens';
import { adminAuthorised, adminSummary, adminUsers, adminDelete } from './admin';
import { checkCredentials, makeSession, tooManyFailures, recordAttempt } from './admin-auth';
// SafetyLink Cloudflare Worker — Full Backend
// Hono framework, D1 database, all emergency dispatch routes

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { gatewayNumber, inboundPcm, locatePcm, syncProfile } from './zero-airtime';

export interface Env {
  FCM_SERVICE_ACCOUNT?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  RELEASES?: any;
  DB?: D1Database;
  // Auth
  JWT_SECRET: string;
  INTERNAL_API_SECRET: string;
  // Upstash Redis (Rate limiting & Deduplication)
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  ALERTS_ENABLED?: string;
  // Twilio
  TWILIO_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_NUMBER: string;
  // VAPI
  VAPI_PRIVATE_KEY: string;
  VAPI_PHONE_NUMBER_ID: string;
  VAPI_ASSISTANT_ID: string;
  // Africa's Talking
  AT_API_KEY: string;
  AT_USERNAME: string;
  // Bland.ai
  BLAND_API_KEY: string;
  TWILIO_WHATSAPP_FROM?: string;
  SMSGATE_USERNAME?: string;
  SMSGATE_PASSWORD?: string;
  SMSGATE_BASE_URL?: string;
  // Paystack
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  // Cloudinary
  CLOUDINARY_KEY: string;
  CLOUDINARY_SECRET: string;
  CLOUDINARY_CLOUD: string;
  // Neon S3 — for audio/evidence file storage only
  AWS_ENDPOINT_URL_S3: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  // Other
  RESPONSE_CENTRE_NUMBER: string;
  PIPEDREAM_WEBHOOK_URL: string;
  PCM_WEBHOOK_SECRET?: string;
  PCM_WEBHOOK_TOKEN?: string;
  RAIN_GATEWAY_MSISDN?: string;
  RECAPTCHA_SECRET: string;
}

export interface Variables {
  orgId: string;
  email: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use('*', cors({
  origin: ['https://safetylink.online', 'http://localhost:5173', 'capacitor://localhost', 'http://localhost'],
  credentials: true,
}));

// ── HELPERS ───────────────────────────────────────────────────────────────────
const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const makeToken = (payload: object) => btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 86400_000 }));

const verifyToken = (token: string) => {
  try {
    const p = JSON.parse(atob(token));
    if (p.exp < Date.now()) throw new Error('expired');
    return p;
  } catch { return null; }
};

const checkTrialExpired = async (db: D1Database, orgId: string) => {
  if (orgId === 'SL-ADMIN-0000') return false;
  const org = await db.prepare('SELECT created_at FROM organisations WHERE id = ?').bind(orgId).first() as { created_at: number } | null;
  if (!org) return false;
  return Date.now() - org.created_at > 29 * 86400_000;
};

const authMiddleware = async (c: any, next: any) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401 as any);
  const payload = verifyToken(auth.slice(7));
  if (!payload) return c.json({ error: 'Invalid or expired token' }, 401);
  if (await checkTrialExpired(c.env.DB, payload.orgId)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  c.set('orgId', payload.orgId);
  c.set('email', payload.email);
  await next();
};

// ── REVERSE GEOCODE ───────────────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'SafetyLink-Emergency/1.0 (support@safetylink.online)' }
    });
    const d: any = await res.json();
    const a = d.address || {};
    const parts = [
      a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.county,
    ].filter(Boolean);
    return parts.join(', ') || d.display_name || `${lat},${lng}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ── UPSTASH REDIS RATE LIMITING & DEDUPLICATION ──────────────────────────────
async function checkPanicRateLimit(
  env: Env,
  identifier: string,
  ttlSeconds = 60
): Promise<{ rateLimited: boolean; reason?: string }> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return { rateLimited: false };
  }

  const cleanId = String(identifier || 'unknown').replace(/[^a-zA-Z0-9_\-+]/g, '_').slice(0, 64);
  const key = `ratelimit:panic:${cleanId}`;
  const url = env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000); // 2s fail-open safeguard for emergency resilience

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', key, '1', 'EX', ttlSeconds, 'NX']),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[RateLimit] Upstash returned status ${res.status}`);
      return { rateLimited: false };
    }

    const data = (await res.json()) as { result?: string | null };
    // 'OK' means new key was set -> allowed
    // null means key already existed -> throttled
    if (data.result === 'OK') {
      return { rateLimited: false };
    } else {
      return {
        rateLimited: true,
        reason: `Duplicate panic alert throttled: cooldown active for ${ttlSeconds} seconds`,
      };
    }
  } catch (err: any) {
    // Non-negotiable life safety rule: fail open if Redis/network has an issue
    console.error(`[RateLimit] Error querying Upstash Redis, failing open:`, err?.message || err);
    return { rateLimited: false };
  }
}

// ── EMERGENCY DISPATCH ────────────────────────────────────────────────────────
type AlertResult = { channel: string; provider: string; to: string; ok: boolean; status?: number; detail?: string };

const normalizePhone = (raw: string): string => {
  let n = String(raw || '').replace(/[^0-9+]/g, '');
  if (!n) return '';
  if (n.startsWith('+')) return n;
  if (n.startsWith('00')) return '+' + n.slice(2);
  if (n.startsWith('0') && n.length === 10) return '+27' + n.slice(1);
  if (n.startsWith('27')) return '+' + n;
  return '+' + n;
};

async function fireAllAlerts(
  env: Env,
  { callerNumber, callerName, lat, lng, address, extraContacts = [], skipVoiceTo = [], providers = {} }: {
    callerNumber: string; callerName: string; lat?: number; lng?: number; address?: string;
    extraContacts?: string[]; skipVoiceTo?: string[]; providers?: any;
  }
): Promise<AlertResult[]> {
  const location = address || (lat ? await reverseGeocode(lat, lng!) : 'Location unknown');
  const mapsLink = lat ? `https://maps.google.com/?q=${lat},${lng}` : '';
  const smsBody = [
    'SAFETYLINK PANIC ALERT',
    `${callerName || callerNumber || 'A SafetyLink user'} pressed the panic button.`,
    `Location: ${location}`,
    mapsLink ? `Map: ${mapsLink}` : '',
    callerNumber ? `Call back: ${callerNumber}` : '',
    'Please respond now.',
  ].filter(Boolean).join('\n').slice(0, 600);

  // Per-user keys (entered in app Settings) override server secrets
  const tw = { sid: providers?.twilio?.sid || env.TWILIO_SID, token: providers?.twilio?.token || env.TWILIO_AUTH_TOKEN, from: providers?.twilio?.from || env.TWILIO_NUMBER, waFrom: providers?.twilio?.waFrom || (env as any).TWILIO_WHATSAPP_FROM || providers?.twilio?.from || env.TWILIO_NUMBER };
  const vp = { key: providers?.vapi?.key || env.VAPI_PRIVATE_KEY, phoneId: providers?.vapi?.phoneNumberId || env.VAPI_PHONE_NUMBER_ID, assistantId: providers?.vapi?.assistantId || env.VAPI_ASSISTANT_ID };
  const at = { key: providers?.at?.key || env.AT_API_KEY, username: providers?.at?.username || env.AT_USERNAME };
  const bl = { key: providers?.bland?.key || env.BLAND_API_KEY };

  const all = Array.from(new Set([
    ...extraContacts.map(normalizePhone),
    normalizePhone(env.RESPONSE_CENTRE_NUMBER || '+27739441222'),
  ].filter(Boolean)));
  const skipVoice = new Set(skipVoiceTo.map(normalizePhone));
  const voiceTargets = all.filter(n => !skipVoice.has(n));

  const results: AlertResult[] = [];
  const attempt = async (channel: string, provider: string, to: string, fn: () => Promise<Response>): Promise<boolean> => {
    try {
      const r = await fn();
      const text = (await r.text().catch(() => '')).slice(0, 180);
      results.push({ channel, provider, to, ok: r.ok, status: r.status, detail: r.ok ? undefined : text });
      if (!r.ok) console.error(`[${provider} ${channel}] ${r.status} ${text}`);
      return r.ok;
    } catch (e: any) {
      results.push({ channel, provider, to, ok: false, detail: String(e?.message || e).slice(0, 180) });
      console.error(`[${provider} ${channel}]`, e);
      return false;
    }
  };

  const twAuth = tw.sid && tw.token ? btoa(`${tw.sid}:${tw.token}`) : '';
  const twPost = (path: string, params: Record<string, string>) =>
    fetch(`https://api.twilio.com/2010-04-01/Accounts/${tw.sid}/${path}.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${twAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });

  const spoken = `SafetyLink emergency alert. ${callerName || 'A user'} has triggered a panic. Location: ${location}. Please respond immediately.`;

  await Promise.allSettled(all.map(async (to) => {
    // Loud push to any SafetyLink phone registered with this number
    const sa = (env as any).FCM_SERVICE_ACCOUNT;
    if (sa && env.DB) {
      try {
        const tokens = await tokensForPhone(env.DB, to);
        for (const tok of tokens) {
          await attempt('ALARM', 'fcm', to, async () => {
            const r = await sendLoudAlarm(sa, tok, 'SafetyLink ALERT', smsBody.split('\n').slice(0, 2).join(' '));
            return new Response(r.error || '', { status: r.ok ? 200 : (r.status || 500) });
          });
        }
      } catch (e) { console.error('[FCM]', e); }
    }

    // SMS: Twilio first, Africa's Talking as backup
    let smsOk = false;
    // 0) Free route: Rain SIM via SMSGate (200 SMS/month included). Off until credentials are saved.
    const sgUser = (env as any).SMSGATE_USERNAME, sgPass = (env as any).SMSGATE_PASSWORD;
    if (sgUser && sgPass) {
      smsOk = await attempt('SMS', 'smsgate', to, () => fetch(`${((env as any).SMSGATE_BASE_URL || 'https://api.sms-gate.app').replace(/\/+$/, '')}/3rdparty/v1/messages`, {
        method: 'POST',
        headers: { Authorization: 'Basic ' + btoa(`${sgUser}:${sgPass}`), 'Content-Type': 'application/json' },
        body: JSON.stringify({ textMessage: { text: smsBody }, phoneNumbers: [to] }),
      }));
    }
    if (!smsOk && twAuth && tw.from) smsOk = await attempt('SMS', 'twilio', to, () => twPost('Messages', { From: tw.from, To: to, Body: smsBody }));
    if (!smsOk && at.key && at.username) {
      await attempt('SMS', 'africastalking', to, () => fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { apiKey: at.key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: at.username, to, message: smsBody }).toString(),
      }));
    }

    // WhatsApp via Twilio (needs a WhatsApp-enabled sender or the sandbox joined by the recipient)
    if (twAuth && tw.waFrom) {
      await attempt('WHATSAPP', 'twilio', to, () => twPost('Messages', { From: `whatsapp:${tw.waFrom}`, To: `whatsapp:${to}`, Body: smsBody }));
    }

    // Voice: ONE call per number. Vapi (AI) -> Twilio voice -> Bland, stopping at first success
    if (voiceTargets.includes(to)) {
      let called = false;
      if (vp.key && vp.phoneId) {
        const body: any = { phoneNumberId: vp.phoneId, customer: { number: to } };
        if (vp.assistantId) {
          body.assistantId = vp.assistantId;
          body.assistantOverrides = { firstMessage: `This is SafetyLink. ${callerName || 'A registered user'} has triggered a panic alert. Location: ${location}. Please respond immediately.` };
        } else {
          body.assistant = {
            firstMessage: `This is SafetyLink. ${callerName || 'A registered user'} has triggered a panic alert. Location: ${location}. Please respond immediately.`,
            model: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.2 },
            voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
            maxDurationSeconds: 60,
          };
        }
        called = await attempt('VOICE', 'vapi', to, () => fetch('https://api.vapi.ai/call', {
          method: 'POST', headers: { Authorization: `Bearer ${vp.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        }));
      }
      if (!called && twAuth && tw.from) {
        called = await attempt('VOICE', 'twilio', to, () => twPost('Calls', { From: tw.from, To: to, Twiml: `<Response><Say voice="alice">${spoken}</Say><Pause length="1"/><Say voice="alice">${spoken}</Say></Response>` }));
      }
      if (!called && bl.key && bl.key !== 'not_provided') {
        await attempt('VOICE', 'bland', to, () => fetch('https://api.bland.ai/v1/calls', {
          method: 'POST', headers: { authorization: bl.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: to, task: `Tell the person: ${spoken} Then ask them to confirm they will respond.`, max_duration: 2, wait_for_greeting: true }),
        }));
      }
    }
  }));

  if (env.PIPEDREAM_WEBHOOK_URL) {
    await attempt('WEBHOOK', 'pipedream', 'n/a', () => fetch(env.PIPEDREAM_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PANIC_TRIGGERED', callerNumber, callerName, location, lat, lng, timestamp: new Date().toISOString() }),
    }));
  }
  return results;
}

// ── DB INIT ───────────────────────────────────────────────────────────────────
// Public version list (published by the build; no GitHub involved)
app.get('/api/app/versions', async (c) => {
  const obj: any = await (c.env as any).RELEASES?.get('versions/index.json');
  if (!obj) return c.json({ versions: [] });
  const list = await obj.json().catch(() => []);
  return c.json({ versions: Array.isArray(list) ? list : [] });
});
app.get('/download/version/:file', async (c) => {
  const file = c.req.param('file');
  if (!/^SafetyLink-v[0-9.]+-Signed\.apk$/.test(file)) return c.json({ error: 'not found' }, 404 as any);
  const obj: any = await (c.env as any).RELEASES?.get('versions/' + file);
  if (!obj) return c.json({ error: 'not found' }, 404 as any);
  return new Response(obj.body, { headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': 'attachment; filename="' + file + '"', 'Content-Length': String(obj.size), 'Cache-Control': 'no-cache' } });
});

// Latest APK, served from R2 (the repo can stay private)
app.get('/download/safetylink.apk', async (c) => {
  const obj: any = await (c.env as any).RELEASES?.get('safetylink-latest.apk');
  if (!obj) return c.json({ error: 'No release available yet' }, 404 as any);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="SafetyLink.apk"',
      'Content-Length': String(obj.size),
      'Cache-Control': 'no-cache',
    },
  });
});

app.get('/api/init-db', async (c) => {
  const initStatements = `
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT UNIQUE,
      password_hash TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      username TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      role TEXT DEFAULT 'User',
      last_seen INTEGER,
      lat REAL, lng REAL,
      sos_active INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      user_id TEXT,
      type TEXT,
      lat REAL, lng REAL,
      resolved INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `;
  for (const stmt of initStatements.split(';')) {
    if (stmt.trim()) await c.env.DB!.prepare(stmt).run();
  }
  // Add the password column to existing databases (ignored if it already exists)
  await c.env.DB!.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run().catch(() => {});

  return c.json({ ok: true });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
const handleRegisterOrg = async (c: any) => {
  const body: any = await c.req.json();
  const email = body.email || body.contactEmail || body.contact_email;
  const password = body.password || body.admin_password;
  const orgName = body.orgName || body.org_name || body.name;
  const contactName = body.contactName || body.contact_name || orgName || 'Admin';

  if (!email || !password || !orgName || !contactName) return c.json({ error: 'All fields required' }, 400);
  const abbrev = orgName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ORG';
  const orgId = body.id || body.org_code || body.orgCode || `SL-${abbrev}-${Math.floor(1000 + Math.random() * 9000)}`;
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  try {
    await c.env.DB!.prepare(
      'INSERT INTO organisations (id, name, contact_name, contact_email, password_hash, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(orgId, orgName, contactName, email.toLowerCase(), hash, Date.now()).run();
    const token = makeToken({ orgId, email });
    return c.json({
      success: true,
      token,
      orgId,
      org_code: orgId,
      orgName,
      name: orgName,
      email,
      organization: { id: orgId, name: orgName, org_code: orgId, contactEmail: email }
    });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Email already registered' }, 409);
    return c.json({ error: 'Registration failed' }, 500);
  }
};

app.post('/api/auth/register-org', handleRegisterOrg);
app.post('/api/register-org', handleRegisterOrg);

app.on('POST', ['/api/auth/register-user', '/api/register'], async (c) => {
  const body: any = await c.req.json();
  const username = body.username;
  const password = body.password;
  const email = body.email;
  const phone = body.phone;
  const orgCode = body.orgCode || body.org_code;
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  const id = crypto.randomUUID();
  try {
    await c.env.DB!.prepare(
      'INSERT INTO users (id, org_id, username, email, role, password_hash, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(id, orgCode || null, username, email || null, 'User', hash, Date.now()).run();
    return c.json({ token: makeToken({ userId: id, orgId: orgCode || null, username }), userId: id, username });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Username taken' }, 409);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

const handleLogin = async (c: any) => {
  const body: any = await c.req.json();
  const username = body.username;
  const password = body.password || body.admin_password;
  const orgCode = body.orgCode || body.org_code;

  if (!username || !password) return c.json({ error: 'Credentials required' }, 400);

  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  const user = await c.env.DB!.prepare(
    'SELECT id, username, org_id FROM users WHERE username = ? AND password_hash = ?'
  ).bind(username, hash).first().catch(() => null) as any;
  if (!user) {
    // Try org login
    const targetOrgCode = (orgCode || username || '').toUpperCase();
    const org = await c.env.DB!.prepare(
      'SELECT id, name FROM organisations WHERE id = ? AND password_hash = ?'
    ).bind(targetOrgCode, hash).first().catch(() => null) as any;
    if (!org) return c.json({ error: 'Invalid credentials' }, 401);
    if (await checkTrialExpired(c.env.DB, org.id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
    const token = makeToken({ orgId: org.id, username });
    return c.json({ token, orgId: org.id, org_code: org.id, orgName: org.name, org_name: org.name });
  }
  if (user.org_id && await checkTrialExpired(c.env.DB, user.org_id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  const token = makeToken({ userId: user.id, orgId: user.org_id, username: user.username });
  return c.json({ token, userId: user.id, orgId: user.org_id, org_code: user.org_id, username: user.username });
};

app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);

// ── PANIC / SOS ───────────────────────────────────────────────────────────────
app.post('/api/panic', async (c) => {
  const body = (await c.req.json()) as any;
  const { userId, orgId, callerName, callerNumber } = body;
  const lat = body.lat ?? body.latitude;
  const lng = body.lng ?? body.longitude;
  const contactNumbers: string[] = Array.isArray(body.emergencyContacts) ? body.emergencyContacts.map((x: any) => x?.phone).filter(Boolean) : [];
  const origin = c.req.header('Origin') || '';
  if (!orgId && !callerNumber && contactNumbers.length === 0) return c.json({ error: 'Missing fields' }, 400);

  const address = lat ? await reverseGeocode(lat, lng) : 'Location unknown';
  const now = Date.now();

  await c.env.DB?.prepare(
    'INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
  ).bind(crypto.randomUUID(), orgId || null, userId || null, 'PANIC', lat || null, lng || null, now).run().catch(() => {});

  if (userId && orgId) {
    await c.env.DB?.prepare('UPDATE users SET sos_active=1, last_seen=?, lat=?, lng=? WHERE id=?')
      .bind(now, lat || null, lng || null, userId).run().catch(() => {});
  }

  const isDemo = Boolean(
    body.isDemo || 
    body.isDrill || 
    userId === '1001' || 
    userId === '1002' || 
    userId === '1003' || 
    userId === '1004' || 
    userId === 'SL-U-DEMO' ||
    (body.description && typeof body.description === 'string' && body.description.includes('[DEMO'))
  );

  if (isDemo) {
    console.log(`[Worker Demo SOS] Suppressing live telecom dispatch for demo user ${callerName || userId || 'Demo User'}`);
    return c.json({
      ok: true,
      simulated: true,
      isDemo: true,
      address,
      results: [
        { channel: 'SMS', provider: 'demo_simulation', to: callerNumber || 'DEMO', ok: true, detail: 'Demo SOS simulation completed. Real telecom suppressed.' }
      ]
    });
  }

  // 60-second anti-spam deduplication rate limit (Upstash Redis)
  const rateLimitTarget = callerNumber || userId || orgId || 'anonymous';
  const rl = await checkPanicRateLimit(c.env, rateLimitTarget, 60);
  if (rl.rateLimited) {
    console.warn(`[Panic RateLimit] Throttled duplicate panic alert for ${rateLimitTarget} within 60s window.`);
    return c.json({
      ok: true,
      rateLimited: true,
      address,
      message: 'Duplicate panic alert throttled (60s cooldown active). Responders already notified.',
      results: [
        {
          channel: 'ALL',
          provider: 'upstash_redis_ratelimit',
          to: rateLimitTarget,
          ok: true,
          detail: 'Alert throttled: a live distress dispatch was already executed for this user/number within the last 60 seconds.'
        }
      ]
    });
  }

  const results = await fireAllAlerts(c.env, {
    callerNumber: callerNumber || '', callerName: callerName || '', lat, lng, address,
    extraContacts: contactNumbers,
    skipVoiceTo: Array.isArray(body.skipVoiceTo) ? body.skipVoiceTo : [],
    providers: body.providers || {},
  });
  return c.json({ ok: results.some(r => r.ok), address, results });
});

app.post('/api/incidents', async (c) => {
  const body = (await c.req.json()) as any;
  const id = body.id || crypto.randomUUID();
  const orgId = body.orgId || body.org_id || 'INDIVIDUAL';
  const userId = body.userId || body.triggered_by || 'UNKNOWN';
  const lat = body.latitude ?? body.lat ?? null;
  const lng = body.longitude ?? body.lng ?? null;
  const now = Date.now();

  await c.env.DB?.prepare(
    'INSERT OR REPLACE INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
  ).bind(id, orgId, userId, 'PANIC', lat, lng, now).run().catch(() => {});

  return c.json({ ok: true, id, status: 'RECORDED' });
});

// Which providers have keys loaded (no secret values returned)
app.get('/api/health/providers', (c) => c.json({
  twilio: !!(c.env.TWILIO_SID && c.env.TWILIO_AUTH_TOKEN && c.env.TWILIO_NUMBER),
  vapi: !!(c.env.VAPI_PRIVATE_KEY && c.env.VAPI_PHONE_NUMBER_ID),
  vapiAssistant: !!c.env.VAPI_ASSISTANT_ID,
  africasTalking: !!(c.env.AT_API_KEY && c.env.AT_USERNAME),
  bland: !!(c.env.BLAND_API_KEY && c.env.BLAND_API_KEY !== 'not_provided'),
  responseCentre: !!c.env.RESPONSE_CENTRE_NUMBER,
  redis: !!(c.env.UPSTASH_REDIS_REST_URL && c.env.UPSTASH_REDIS_REST_TOKEN),
  alertsEnabled: c.env.ALERTS_ENABLED !== 'false',
}));

// ── USSD (Africa's Talking) ───────────────────────────────────────────────────
app.post('/api/ussd', async (c) => {
  const body = await c.req.text();
  const params = new URLSearchParams(body);
  const text = params.get('text') || '';
  const phoneNumber = params.get('phoneNumber') || '';
  const parts = text.split('*').filter(Boolean);

  let response = '';
  let end = false;

  if (parts.length === 0 || text === '') {
    response = "CON Welcome to SafetyLink\n1. Send Panic Alert\n2. I am Safe\n3. My Status";
  } else if (parts[0] === '1') {
    // Fire panic
    c.executionCtx.waitUntil(fireAllAlerts(c.env, {
      callerNumber: phoneNumber,
      callerName: `USSD User (${phoneNumber})`,
    }));
    response = 'END Panic alert sent. Help is on the way.';
    end = true;
  } else if (parts[0] === '2') {
    response = 'END You are marked as safe. Stay alert.';
    end = true;
  } else if (parts[0] === '3') {
    response = 'END Your SafetyLink subscription is active. safetylink.online';
    end = true;
  } else {
    response = 'END Invalid option.';
    end = true;
  }

  return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
});

// ── RAIN SIM HARDWARE GATEWAY: UNIVERSAL PLEASE-CALL-ME / RL SMS WEBHOOK ───────
app.post('/pcm/:token', async (c) => handlePcmWebhook(c));
app.post('/pcm', async (c) => handlePcmWebhook(c));
app.get('/pcm/:token', (c) => {
  const expected = c.env.PCM_WEBHOOK_TOKEN || '';
  if (!expected || !safeEq(c.req.param('token'), expected)) return c.json({ error: 'Unauthorized' }, 401 as any);
  return c.json({ ok: true, service: 'SafetyLink PCM webhook', ready: true }, 200);
});
app.get('/pcm', (c) => c.json({ ok: true, service: 'SafetyLink PCM webhook', hint: 'POST with token' }, 200));
app.post('/webhook/pcm', async (c) => handlePcmWebhook(c));
app.post('/webhook/pcm/:token', async (c) => handlePcmWebhook(c));
// Some forwarder apps test the address with a GET request: answer 200 when the token is right
app.get('/webhook/pcm/:token', (c) => {
  const expected = c.env.PCM_WEBHOOK_TOKEN || '';
  if (!expected || !safeEq(c.req.param('token'), expected)) return c.json({ error: 'Unauthorized' }, 401 as any);
  return c.json({ ok: true, service: 'SafetyLink PCM webhook', ready: true }, 200);
});
app.get('/webhook/pcm', (c) => c.json({ ok: true, service: 'SafetyLink PCM webhook', hint: 'POST with token' }, 200));
app.post('/api/webhook/pcm', async (c) => handlePcmWebhook(c));
app.post('/api/rl/sms', async (c) => handlePcmWebhook(c));
app.post('/webhook/rl', async (c) => handlePcmWebhook(c));

// Superadmin login (email + strong password, returns a session)
app.post('/api/admin/login', async (c) => {
  if (!c.env.DB) return c.json({ error: 'database unavailable' }, 503 as any);
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  if (await tooManyFailures(c.env.DB, ip)) return c.json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429 as any);
  const b = (await c.req.json().catch(() => ({}))) as any;
  const ok = await checkCredentials(c.env, b.email, b.password);
  await recordAttempt(c.env.DB, ip, ok);
  if (!ok) return c.json({ error: 'Email or password is incorrect' }, 401 as any);
  return c.json({ token: await makeSession(c.env), expiresInHours: 8 });
});
app.get('/api/admin/summary', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  return c.json(await adminSummary(c.env.DB));
});
app.get('/api/admin/users', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  return c.json({ users: await adminUsers(c.env.DB) });
});
app.post('/api/admin/delete-user', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  const b = (await c.req.json().catch(() => ({}))) as any;
  const phone = String(b.phone || '').replace(/[^0-9+]/g, '');
  if (!phone) return c.json({ error: 'phone required' }, 400 as any);
  return c.json(await adminDelete(c.env.DB, phone));
});

// Phone registers its FCM token (must present its profile token for that number)
app.post('/api/device/token', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as any;
  const phone = String(b.phone || '').replace(/[^0-9+]/g, '');
  const token = String(b.token || '');
  if (!/^\+27[6-8][0-9]{8}$/.test(phone) || token.length < 20) return c.json({ error: 'phone and token required' }, 400 as any);
  if (!c.env.DB) return c.json({ error: 'database unavailable' }, 503 as any);
  const presented = c.req.header('X-Profile-Token') || '';
  const owner: any = await c.env.DB.prepare('SELECT token FROM sl_profiles WHERE phone=?').bind(phone).first().catch(() => null);
  if (!owner?.token || !presented || presented !== owner.token) return c.json({ error: 'Not authorised for this number' }, 401 as any);
  await saveDeviceToken(c.env.DB, phone, token);
  return c.json({ ok: true });
});

app.post('/api/profile/sync', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const outcome = await syncProfile(c.env, body, c.req.header('x-profile-token') || '');
  return c.json(outcome.json, outcome.status as any);
});

app.get('/api/pcm/gateway', (c) => c.json({ number: gatewayNumber(c.env) || null }));

app.post('/api/pcm/locate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const outcome = await locatePcm(c.env, body);
  return c.json(outcome.json, outcome.status as any);
});

const safeEq = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};
const hexHmac = async (secret: string, data: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
};

async function handlePcmWebhook(c: any) {
  try {
    return await handlePcmWebhookInner(c);
  } catch (e: any) {
    console.error('[PCM] crash', e);
    return c.json({ ok: false, error: 'server error', detail: String(e?.message || e).slice(0, 300) }, 200 as any);
  }
}

async function handlePcmWebhookInner(c: any) {
  // AUTH: every request must carry the secret token (?token= or x-pcm-token header),
  // or a valid HMAC signature. Without this anyone could trigger alerts.
  const expected = (c.env.PCM_WEBHOOK_TOKEN || '').trim();
  const secret = (c.env.PCM_WEBHOOK_SECRET || '').trim();
  if (!expected && !secret) return c.json({ error: 'PCM webhook not configured' }, 503 as any);
  const raw = await c.req.text();
  const givenTok = (c.req.param('token') || c.req.query('token') || c.req.header('x-pcm-token') || '').trim();
  const givenSig = (c.req.header('X-Signature') || c.req.header('X-Hmac-Sha256') || '').toLowerCase().trim();
  const tokenOk = !!expected && !!givenTok && safeEq(givenTok, expected);
  const sigOk = !!secret && !!givenSig && safeEq(givenSig, await hexHmac(secret, raw));
  if (!tokenOk && !sigOk) return c.json({ error: 'Unauthorized' }, 401 as any);
  let body: any = {};
  try { body = JSON.parse(raw); } catch { try { body = Object.fromEntries(new URLSearchParams(raw)); } catch { body = {}; } }

  const rawText = String(
    body.rawMessage || body.pcmText || body.message || body.text || body.msg || ''
  ).trim();

  const gatewaySender = String(
    body.sender || body.from || body.phone || body.callerMsisdn || ''
  ).trim();

  let extractedPhone = body.callerMsisdn || '';
  if (!extractedPhone && rawText) {
    const match = rawText.match(/(?:(?:call(?:[ -]?me)?(?:[ -]?back)?[ -]?(?:at|from)?)|(?:^))[:\s]*(\+?27[6-8][0-9]{8}|0[6-8][0-9]{8})/i) ||
                  rawText.match(/(\+?27[6-8][0-9]{8}|0[6-8][0-9]{8})/);
    if (match) extractedPhone = match[1];
  }
  if (!extractedPhone && gatewaySender) extractedPhone = gatewaySender;

  if (!extractedPhone) {
    return c.json({ ok: true, alerted: false, reason: 'No caller number in message (test or non-emergency SMS)' }, 200);
  }

  const cleanPhone = extractedPhone.replace(/[\s-]/g, '');
  const localMsisdn = cleanPhone.startsWith('+27')
    ? '0' + cleanPhone.slice(3)
    : cleanPhone.startsWith('27')
      ? '0' + cleanPhone.slice(2)
      : cleanPhone;

  const isDemo = localMsisdn.includes('60123456') || rawText.includes('[DEMO');
  if (isDemo) {
    return c.json({ ok: true, msisdn: localMsisdn, status: 'DISPATCHED_SIMULATED', isDemo: true });
  }

  const outcome = await inboundPcm(c.env, rawText, extractedPhone || gatewaySender, (tokenOk || sigOk) ? (c.env.PCM_WEBHOOK_SECRET || '') : (c.req.header('x-safetylink-gateway') || ''));
  return c.json(outcome.json, outcome.status as any);
}

// ── USER HEARTBEAT ────────────────────────────────────────────────────────────
app.post('/api/user/heartbeat', async (c) => {
  const { userId, orgId, lat, lng, sosActive } = (await c.req.json()) as any;
  if (!userId) return c.json({ error: 'Missing userId' }, 400);
  const now = Date.now();
  await c.env.DB!.prepare('UPDATE users SET last_seen=?, lat=?, lng=?, sos_active=? WHERE id=?')
    .bind(now, lat || null, lng || null, sosActive ? 1 : 0, userId).run().catch(() => {});
  return c.json({ ok: true });
});

// ── ORG MEMBERS (live map) ────────────────────────────────────────────────────
app.get('/api/org/:orgId/members', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (!c.env.DB) return c.json([]);
  const { results } = await c.env.DB.prepare(
    'SELECT id, username, role, last_seen, lat, lng, sos_active FROM users WHERE org_id=? ORDER BY last_seen DESC LIMIT 200'
  ).bind(orgId).all();
  return c.json(results);
});

// ── INCIDENTS ─────────────────────────────────────────────────────────────────
app.get('/api/org/:orgId/incidents', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (!c.env.DB) return c.json([]);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM incidents WHERE org_id=? ORDER BY created_at DESC LIMIT 100'
  ).bind(orgId).all();
  return c.json(results);
});

app.post('/api/org/:orgId/incidents/:id/resolve', authMiddleware, async (c) => {
  const { id } = c.req.param();
  await c.env.DB!.prepare('UPDATE incidents SET resolved=1 WHERE id=?').bind(id).run();
  return c.json({ ok: true });
});

// ── SUPERADMIN ────────────────────────────────────────────────────────────────
app.get('/api/superadmin/orgs', authMiddleware, async (c) => {
  if (c.get('orgId') !== 'SL-ADMIN-0000') return c.json({ error: 'Forbidden' }, 403);
  const { results } = await c.env.DB!.prepare('SELECT id, name, contact_email, created_at FROM organisations').all();
  return c.json(results);
});

app.post('/api/superadmin/orgs/:id/unlock', authMiddleware, async (c) => {
  if (c.get('orgId') !== 'SL-ADMIN-0000') return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB!.prepare('UPDATE organisations SET created_at=? WHERE id=?').bind(Date.now(), c.req.param('id')).run();
  return c.json({ ok: true });
});

// ── PAYFAST CHECKOUT ──────────────────────────────────────────────────────────
app.post('/api/payfast/checkout', async (c) => {
  const { plan_name, amount, email } = (await c.req.json()) as any;
  // PayFast ITN — return redirect URL for client
  const pfData = {
    merchant_id: '10000100',
    merchant_key: 'key_here',
    return_url: 'https://safetylink.online/#/payment-success',
    cancel_url: 'https://safetylink.online/#/payment-cancel',
    notify_url: 'https://safetylink-api.workers.dev/api/payfast/notify',
    email_address: email || 'user@safetylink.online',
    amount: parseFloat(amount).toFixed(2),
    item_name: `SafetyLink ${plan_name}`,
  };
  const query = new URLSearchParams(pfData as any).toString();
  return c.json({ success: true, url: `https://www.payfast.co.za/eng/process?${query}` });
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({
  status: 'ok',
  service: 'SafetyLink API',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// ── OFFLINE SYNC ──────────────────────────────────────────────────────────────
app.post('/api/sync/offline', async (c) => {
  const { orgId, payload } = await c.req.json<any>();
  if (!orgId || !Array.isArray(payload)) return c.json({ error: 'Invalid payload' }, 400);
  const now = Date.now();
  for (const item of payload) {
    await c.env.DB!.prepare(
      'INSERT OR IGNORE INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(item.id || crypto.randomUUID(), orgId, 'OFFLINE', 'OFFLINE_SYNC', item.lat || null, item.lng || null, item.timestamp || now).run().catch(() => {});
  }
  return c.json({ ok: true, synced: payload.length });
});

export default app;
