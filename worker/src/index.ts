// SafetyLink Cloudflare Worker — Full Backend
// Hono framework, D1 database, all emergency dispatch routes

import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB?: D1Database;  // Optional until D1 is bound
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
  // Paystack
  PAYSTACK_SECRET_KEY: string;
  // Cloudinary
  CLOUDINARY_KEY: string;
  CLOUDINARY_SECRET: string;
  CLOUDINARY_CLOUD: string;
  // Other
  RESPONSE_CENTRE_NUMBER: string;
  PIPEDREAM_WEBHOOK_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

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
  const org = await db.prepare('SELECT created_at FROM organisations WHERE id = ?').bind(orgId).first<{ created_at: number }>();
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
async function fireAllAlerts(env: Env, { callerNumber, callerName, lat, lng, address }: {
  callerNumber: string; callerName: string; lat?: number; lng?: number; address?: string;
}) {
  const location = address || (lat ? await reverseGeocode(lat, lng!) : 'Location unknown');
  const mapsLink = lat ? `https://maps.google.com/?q=${lat},${lng}` : '';
  const smsBody = `🚨 SAFETYLINK PANIC ALERT\n${callerName || callerNumber} has triggered an emergency.\n📍 ${location}\n${mapsLink}`;

  const contacts = [
    env.RESPONSE_CENTRE_NUMBER || '+27739441222',
  ];

  const jobs: Promise<any>[] = [];

  // ── Twilio SMS to all contacts ──
  if (env.TWILIO_SID && env.TWILIO_AUTH_TOKEN) {
    const auth = btoa(`${env.TWILIO_SID}:${env.TWILIO_AUTH_TOKEN}`);
    for (const to of contacts) {
      jobs.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: env.TWILIO_NUMBER, To: to, Body: smsBody }).toString(),
      }).catch(e => console.error('[Twilio SMS]', e)));
    }

    // ── Twilio Voice Call ──
    const twiml = `<Response><Say voice="alice">SafetyLink emergency alert. ${callerName || 'A user'} has triggered a panic from ${location}. Please respond immediately.</Say><Pause length="1"/><Say voice="alice">Repeating. SafetyLink emergency. ${callerName || 'User'} needs help. Location: ${location}.</Say></Response>`;
    for (const to of contacts) {
      jobs.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Calls.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: env.TWILIO_NUMBER, To: to, Twiml: twiml }).toString(),
      }).catch(e => console.error('[Twilio Voice]', e)));
    }

    // ── WhatsApp ──
    for (const to of contacts) {
      jobs.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: `whatsapp:${env.TWILIO_NUMBER}`, To: `whatsapp:${to}`, Body: smsBody }).toString(),
      }).catch(e => console.error('[WhatsApp]', e)));
    }
  }

  // ── VAPI AI Voice Call ──
  if (env.VAPI_PRIVATE_KEY && env.VAPI_PHONE_NUMBER_ID) {
    for (const to of contacts) {
      jobs.push(fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
          customer: { number: to },
          assistant: {
            firstMessage: `This is SafetyLink AI. ${callerName || 'A registered user'} has triggered a panic alert. Their location is ${location}. Please respond immediately.`,
            model: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.2 },
            voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
            maxDurationSeconds: 60,
          },
        }),
      }).catch(e => console.error('[VAPI]', e)));
    }
  }

  // ── Africa's Talking SMS ──
  if (env.AT_API_KEY && env.AT_USERNAME) {
    for (const to of contacts) {
      jobs.push(fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { apiKey: env.AT_API_KEY, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: env.AT_USERNAME, to, message: smsBody }).toString(),
      }).catch(e => console.error('[AT SMS]', e)));
    }
  }

  // ── Pipedream Webhook ──
  if (env.PIPEDREAM_WEBHOOK_URL) {
    jobs.push(fetch(env.PIPEDREAM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'PANIC_TRIGGERED', callerNumber, callerName, location, lat, lng, timestamp: new Date().toISOString() }),
    }).catch(() => {}));
  }

  await Promise.allSettled(jobs);
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
app.post('/api/auth/register-org', async (c) => {
  const { email, password, orgName, contactName } = await c.req.json<any>();
  if (!email || !password || !orgName || !contactName) return c.json({ error: 'All fields required' }, 400);
  const abbrev = orgName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ORG';
  const orgId = `SL-${abbrev}-${Math.floor(1000 + Math.random() * 9000)}`;
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  try {
    await c.env.DB!.prepare(
      'INSERT INTO organisations (id, name, contact_name, contact_email, password_hash, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(orgId, orgName, contactName, email.toLowerCase(), hash, Date.now()).run();
    return c.json({ token: makeToken({ orgId, email }), orgId, orgName, email });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Email already registered' }, 409);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/auth/register-user', async (c) => {
  const { username, password, email, phone, orgCode } = await c.req.json<any>();
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

app.post('/api/auth/login', async (c) => {
  const { username, password, orgCode } = await c.req.json<any>();
  if (!username || !password) return c.json({ error: 'Credentials required' }, 400);
  // SuperAdmin shortcut
  if (username === 'safetylink' && password === '0000' && orgCode === 'SL-ADMIN-0000') {
    return c.json({ token: makeToken({ orgId: 'SL-ADMIN-0000', username }), orgId: 'SL-ADMIN-0000' });
  }
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  const user = await c.env.DB!.prepare(
    'SELECT id, username, org_id FROM users WHERE username = ? AND password_hash = ?'
  ).bind(username, hash).first<any>().catch(() => null);
  if (!user) {
    // Try org login
    const org = await c.env.DB!.prepare(
      'SELECT id, name FROM organisations WHERE id = ? AND password_hash = ?'
    ).bind((orgCode || '').toUpperCase(), hash).first<any>().catch(() => null);
    if (!org) return c.json({ error: 'Invalid credentials' }, 401);
    if (await checkTrialExpired(c.env.DB, org.id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
    return c.json({ token: makeToken({ orgId: org.id, username }), orgId: org.id, orgName: org.name });
  }
  if (user.org_id && await checkTrialExpired(c.env.DB, user.org_id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  return c.json({ token: makeToken({ userId: user.id, orgId: user.org_id, username: user.username }), userId: user.id, orgId: user.org_id });
});

// ── PANIC / SOS ───────────────────────────────────────────────────────────────
app.post('/api/panic', async (c) => {
  const { userId, orgId, lat, lng, callerName, callerNumber } = await c.req.json<any>();
  if (!orgId && !callerNumber) return c.json({ error: 'Missing fields' }, 400);

  const address = lat ? await reverseGeocode(lat, lng) : 'Location unknown';
  const now = Date.now();

  // Log to D1
  await c.env.DB!.prepare(
    'INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
  ).bind(crypto.randomUUID(), orgId || null, userId || null, 'PANIC', lat || null, lng || null, now).run().catch(() => {});

  if (userId && orgId) {
    await c.env.DB!.prepare('UPDATE users SET sos_active=1, last_seen=?, lat=?, lng=? WHERE id=?')
      .bind(now, lat || null, lng || null, userId).run().catch(() => {});
  }

  // Fire all alerts in background
  c.executionCtx.waitUntil(fireAllAlerts(c.env, { callerNumber: callerNumber || '', callerName: callerName || '', lat, lng, address }));

  return c.json({ ok: true, address });
});

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

// ── USER HEARTBEAT ────────────────────────────────────────────────────────────
app.post('/api/user/heartbeat', async (c) => {
  const { userId, orgId, lat, lng, sosActive } = await c.req.json<any>();
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
  const { plan_name, amount, email } = await c.req.json<any>();
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
