// SafetyLink Cloudflare Worker — Full Backend
// Hono framework, D1 database, all emergency dispatch routes

import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB?: D1Database;
  // Auth
  JWT_SECRET: string;
  INTERNAL_API_SECRET: string;
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
  PCM_WEBHOOK_SECRET?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_TEMPLATE_NAME?: string;
  WHATSAPP_TEMPLATE_LANG?: string;
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
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
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
  { callerNumber, callerName, lat, lng, address, extraContacts = [], skipVoiceTo = [], providers = {}, locationNote = '' }: {
    callerNumber: string; callerName: string; lat?: number; lng?: number; address?: string;
    extraContacts?: string[]; skipVoiceTo?: string[]; providers?: any; locationNote?: string;
  }
): Promise<AlertResult[]> {
  const location = address || (lat ? await reverseGeocode(lat, lng!) : 'Location unknown');
  const mapsLink = lat ? `https://maps.google.com/?q=${lat},${lng}` : '';
  const who = callerName || callerNumber || 'A SafetyLink user';
  const smsBody = `SAFETYLINK PANIC ALERT\n${who} has pressed the panic button.\nLocation${locationNote}: ${location}\n${mapsLink}\nCall them: ${callerNumber || 'n/a'}`.slice(0, 600);
  const spokenIntro = `This is SafetyLink. ${who} has pressed the panic button at this location: ${location}. Please respond immediately.`;

  const tw = { sid: providers?.twilio?.sid || env.TWILIO_SID, token: providers?.twilio?.token || env.TWILIO_AUTH_TOKEN, from: providers?.twilio?.from || env.TWILIO_NUMBER, waFrom: providers?.twilio?.waFrom || (env as any).TWILIO_WHATSAPP_FROM || providers?.twilio?.from || env.TWILIO_NUMBER };
  const vp = { key: providers?.vapi?.key || env.VAPI_PRIVATE_KEY, phoneId: providers?.vapi?.phoneNumberId || env.VAPI_PHONE_NUMBER_ID, assistantId: providers?.vapi?.assistantId || env.VAPI_ASSISTANT_ID };
  const at = { key: providers?.at?.key || env.AT_API_KEY, username: providers?.at?.username || env.AT_USERNAME };
  const bl = { key: providers?.bland?.key || env.BLAND_API_KEY };
  const hasBland = !!bl.key && bl.key !== 'not_provided';

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

  const callVapi = (to: string) => {
    const body: any = { phoneNumberId: vp.phoneId, customer: { number: to } };
    if (vp.assistantId) {
      body.assistantId = vp.assistantId;
      body.assistantOverrides = { firstMessage: spokenIntro };
    } else {
      body.assistant = { firstMessage: spokenIntro, model: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.2 }, voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }, maxDurationSeconds: 60 };
    }
    return fetch('https://api.vapi.ai/call', { method: 'POST', headers: { Authorization: `Bearer ${vp.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  };
  const callBland = (to: string) => fetch('https://api.bland.ai/v1/calls', {
    method: 'POST', headers: { authorization: bl.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: to, task: `Say exactly this, then ask them to confirm they will respond: ${spokenIntro}`, max_duration: 2, wait_for_greeting: true }),
  });
  const callTwilio = (to: string) => twPost('Calls', { From: tw.from, To: to, Twiml: `<Response><Say voice="alice">${spokenIntro}</Say><Pause length="1"/><Say voice="alice">${spokenIntro}</Say></Response>` });

  // SMS + WhatsApp: every number, every provider in parallel (redundancy matters in an emergency)
  const messaging = all.flatMap((to) => {
    const jobs: Promise<unknown>[] = [];
    if (twAuth && tw.from) {
      jobs.push(attempt('SMS', 'twilio', to, () => twPost('Messages', { From: tw.from, To: to, Body: smsBody })));
      if (tw.waFrom) jobs.push(attempt('WHATSAPP', 'twilio', to, () => twPost('Messages', { From: `whatsapp:${tw.waFrom}`, To: `whatsapp:${to}`, Body: smsBody })));
    }
    // WhatsApp via Meta Cloud API (your WhatsApp Business number) - not limited by Twilio trial rules
    if (env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
      const waTo = to.replace(/[^0-9]/g, '');
      const payload: any = env.WHATSAPP_TEMPLATE_NAME
        ? { messaging_product: 'whatsapp', to: waTo, type: 'template', template: { name: env.WHATSAPP_TEMPLATE_NAME, language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' }, components: [{ type: 'body', parameters: [
            { type: 'text', text: who.slice(0, 60) }, { type: 'text', text: String(location).slice(0, 200) }, { type: 'text', text: callerNumber || 'n/a' }] }] } }
        : { messaging_product: 'whatsapp', to: waTo, type: 'text', text: { body: smsBody, preview_url: true } };
      jobs.push(attempt('WHATSAPP', 'meta-cloud', to, () => fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })));
    }
    if (at.key && at.username) {
      jobs.push(attempt('SMS', 'africastalking', to, () => fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST', headers: { apiKey: at.key, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: at.username, to, message: smsBody }).toString(),
      })));
    }
    return jobs;
  });

  // Voice: first contact -> Vapi (AI talks), second contact -> Bland, then everyone else Vapi.
  // If a provider fails, the next one tries the same person (Vapi -> Twilio -> Bland).
  const voice = voiceTargets.map(async (to, i) => {
    const order: Array<'vapi' | 'bland' | 'twilio'> = (i === 1 && hasBland) ? ['bland', 'vapi', 'twilio'] : ['vapi', 'twilio', 'bland'];
    for (const prov of order) {
      if (prov === 'vapi' && vp.key && vp.phoneId) { if (await attempt('VOICE', 'vapi', to, () => callVapi(to))) return; }
      if (prov === 'twilio' && twAuth && tw.from) { if (await attempt('VOICE', 'twilio', to, () => callTwilio(to))) return; }
      if (prov === 'bland' && hasBland) { if (await attempt('VOICE', 'bland', to, () => callBland(to))) return; }
    }
  });

  await Promise.allSettled([...messaging, ...voice]);

  if (env.PIPEDREAM_WEBHOOK_URL) {
    await attempt('WEBHOOK', 'pipedream', 'n/a', () => fetch(env.PIPEDREAM_WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PANIC_TRIGGERED', callerNumber, callerName, location, lat, lng, timestamp: new Date().toISOString() }),
    }));
  }
  return results;
}

// ── Profiles: lets the server find out WHO pressed (needed for offline "Please Call Me") ──
let schemaReady = false;
async function ensureSchema(env: Env) {
  if (schemaReady || !env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS profiles (phone TEXT PRIMARY KEY, name TEXT, contacts TEXT, lat REAL, lng REAL, token_hash TEXT, updated_at INTEGER)').run().catch(() => {});
  schemaReady = true;
}
const sha256Hex = async (t: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))).map(b => b.toString(16).padStart(2, '0')).join('');
async function recentIncident(env: Env, key: string, ms: number): Promise<boolean> {
  if (!env.DB || !key) return false;
  const r = await env.DB.prepare('SELECT 1 FROM incidents WHERE user_id=? AND created_at>? LIMIT 1').bind(key, Date.now() - ms).first().catch(() => null);
  return !!r;
}

// ── DB INIT ───────────────────────────────────────────────────────────────────
app.get('/api/init-db', async (c) => {
  await c.env.DB!.exec(`
    CREATE TABLE IF NOT EXISTS organisations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT,
      username TEXT,
      email TEXT,
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
  `);
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

app.post('/api/auth/register-user', async (c) => {
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
      'INSERT INTO users (id, org_id, username, email, role, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(id, orgCode || null, username, email || null, 'User', Date.now()).run();
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
  // SuperAdmin shortcut
  if ((username === 'safetylink' && password === '0000' && (orgCode === 'SL-ADMIN-0000' || orgCode === 'SL-ADMIN-000')) ||
      (username === 'safetylink' && password === 'sl-admin-000')) {
    const token = makeToken({ orgId: 'SL-ADMIN-0000', username, superAdmin: true });
    return c.json({ token, orgId: 'SL-ADMIN-0000', org_code: 'SL-ADMIN-0000', org_name: 'SafetyLink Super Admin', superAdmin: true });
  }
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
  if (!orgId && !callerNumber && contactNumbers.length === 0) return c.json({ error: 'Missing fields' }, 400);
  await ensureSchema(c.env);
  const isDemo = Boolean(
    body.isDemo || body.isDrill ||
    userId === '1001' || userId === '1002' || userId === '1003' || userId === '1004' || userId === 'SL-U-DEMO' ||
    (body.description && typeof body.description === 'string' && body.description.includes('[DEMO'))
  );
  if (isDemo) {
    console.log(`[Worker Demo SOS] Suppressing live telecom dispatch for demo user ${callerName || userId || 'Demo User'}`);
    return c.json({ ok: true, simulated: true, isDemo: true, address: lat ? 'demo' : 'Location unknown', results: [
      { channel: 'SMS', provider: 'demo_simulation', to: callerNumber || 'DEMO', ok: true, detail: 'Demo SOS simulation completed. Real telecom dispatch suppressed.' }
    ] });
  }


  const key = normalizePhone(callerNumber || '') || userId || '';
  if (await recentIncident(c.env, key, 60000)) return c.json({ ok: true, deduped: true });

  const address = lat ? await reverseGeocode(lat, lng) : 'Location unknown';
  const now = Date.now();
  await c.env.DB?.prepare('INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), orgId || null, key || null, 'PANIC', lat || null, lng || null, now).run().catch(() => {});
  if (userId && orgId) {
    await c.env.DB?.prepare('UPDATE users SET sos_active=1, last_seen=?, lat=?, lng=? WHERE id=?').bind(now, lat || null, lng || null, userId).run().catch(() => {});
  }

  const results = await fireAllAlerts(c.env, {
    callerNumber: callerNumber || '', callerName: callerName || '', lat, lng, address,
    extraContacts: contactNumbers,
    skipVoiceTo: Array.isArray(body.skipVoiceTo) ? body.skipVoiceTo : [],
    providers: body.providers || {},
  });
  return c.json({ ok: results.some(r => r.ok), address, results });
});

// App saves who the user is + their emergency contacts + last known location (works when online)
app.post('/api/profile/sync', async (c) => {
  await ensureSchema(c.env);
  const b = (await c.req.json().catch(() => ({}))) as any;
  const phone = normalizePhone(b.phone || '');
  if (!/^\+27[6-8][0-9]{8}$/.test(phone)) return c.json({ error: 'A valid South African mobile number is required' }, 400);
  const contacts = (Array.isArray(b.contacts) ? b.contacts : []).slice(0, 5)
    .map((x: any) => ({ name: String(x?.name || '').slice(0, 60), phone: normalizePhone(x?.phone || '') })).filter((x: any) => x.phone);
  const given = c.req.header('X-Profile-Token') || '';
  const existing: any = await c.env.DB?.prepare('SELECT token_hash FROM profiles WHERE phone=?').bind(phone).first().catch(() => null);
  let token = '';
  let hash = existing?.token_hash || '';
  if (existing?.token_hash) {
    if (!given || (await sha256Hex(given)) !== existing.token_hash) return c.json({ error: 'This number is already registered from another device' }, 403);
  } else {
    token = crypto.randomUUID() + crypto.randomUUID();
    hash = await sha256Hex(token);
  }
  await c.env.DB?.prepare('INSERT INTO profiles (phone, name, contacts, lat, lng, token_hash, updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name, contacts=excluded.contacts, lat=COALESCE(excluded.lat, profiles.lat), lng=COALESCE(excluded.lng, profiles.lng), updated_at=excluded.updated_at')
    .bind(phone, String(b.name || '').slice(0, 80), JSON.stringify(contacts), b.lat ?? null, b.lng ?? null, hash, Date.now()).run();
  return c.json({ ok: true, contacts: contacts.length, ...(token ? { token } : {}) });
});

// Which providers have keys loaded (no secret values returned)
app.get('/api/health/providers', (c) => c.json({
  twilio: !!(c.env.TWILIO_SID && c.env.TWILIO_AUTH_TOKEN && c.env.TWILIO_NUMBER),
  vapi: !!(c.env.VAPI_PRIVATE_KEY && c.env.VAPI_PHONE_NUMBER_ID),
  vapiAssistant: !!c.env.VAPI_ASSISTANT_ID,
  africasTalking: !!(c.env.AT_API_KEY && c.env.AT_USERNAME),
  bland: !!(c.env.BLAND_API_KEY && c.env.BLAND_API_KEY !== 'not_provided'),
  responseCentre: !!c.env.RESPONSE_CENTRE_NUMBER,
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

// ── PCM / "Please Call Me" webhook (Rain SIM SMS forwarder) ───────────────────
const hexHmac = async (secret: string, data: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
};
const safeEq = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

app.post('/webhook/pcm', async (c) => {
  const secret = c.env.PCM_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: 'PCM webhook not configured' }, 503); // fail closed
  const raw = await c.req.text();
  const given = (c.req.header('X-Signature') || '').toLowerCase();
  if (!given || !safeEq(given, await hexHmac(secret, raw))) return c.json({ error: 'Invalid signature' }, 401);
  await ensureSchema(c.env);

  let body: any = {};
  try { body = JSON.parse(raw); } catch { return c.json({ error: 'Bad JSON' }, 400); }
  const text = String(body.text || '');
  const match = text.match(/(?:\+27|27|0)[6-8][0-9]{8}/) || String(body.from || '').match(/(?:\+27|27|0)[6-8][0-9]{8}/);
  if (!match) return c.json({ ok: false, reason: 'No SA mobile number found in message' }, 200);
  const msisdn = normalizePhone(match[0]);

  if (await recentIncident(c.env, msisdn, 90000)) return c.json({ ok: true, deduped: true, caller: msisdn });

  // Who is this? Look up the profile the app saved while online.
  const prof: any = await c.env.DB?.prepare('SELECT name, contacts, lat, lng, updated_at FROM profiles WHERE phone=?').bind(msisdn).first().catch(() => null);
  let contacts: string[] = [];
  try { contacts = (JSON.parse(prof?.contacts || '[]') as any[]).map(x => x.phone).filter(Boolean); } catch { /* ignore */ }
  const lat = prof?.lat ?? undefined, lng = prof?.lng ?? undefined;
  const ageMin = prof?.updated_at ? Math.max(1, Math.round((Date.now() - prof.updated_at) / 60000)) : 0;

  await c.env.DB?.prepare('INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), null, msisdn, 'PCM_PANIC', lat ?? null, lng ?? null, Date.now()).run().catch(() => {});

  const results = await fireAllAlerts(c.env, {
    callerNumber: msisdn,
    callerName: prof?.name || msisdn,
    lat, lng,
    address: lat ? undefined : 'unknown (phone was offline) - call them back immediately',
    locationNote: lat ? ` (last known, updated ${ageMin} min ago)` : '',
    extraContacts: contacts,
  });
  return c.json({ ok: results.some(r => r.ok), caller: msisdn, knownProfile: !!prof, contacts: contacts.length, results });
});

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
