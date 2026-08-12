import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { createThingsBoardCustomer } from "../src/api/services/thingsboard";
import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  PIPEDREAM_WEBHOOK_URL?: string;
}

// Helper function to trigger Pipedream Webhook asynchronously
async function triggerPipedreamEscalation(userData: any, locationData: any, env: any) {
  try {
    const webhookUrl = env.PIPEDREAM_WEBHOOK_URL || "https://eomnz1lxw9o2hyq.m.pipedream.net";
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "PANIC_TRIGGERED",
        user: userData.userId,
        orgId: userData.orgId,
        location: locationData,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error("Pipedream escalation failed:", error);
  }
}

const app = new Hono<{ Bindings: Env, Variables: { orgId: string, email: string } }>();

app.use('*', cors({ origin: ['https://safetylink.online', 'http://localhost:5173'], credentials: true }));

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register-org', async (c) => {
  const { email, password, orgName, contactName } = await c.req.json<{
    email: string; password: string; orgName: string; contactName: string;
  }>();

  if (!email || !password || !orgName || !contactName)
    return c.json({ error: 'All fields required' }, 400);
  if (password.length < 6)
    return c.json({ error: 'Password must be at least 6 characters' }, 400);

  const abbrev = orgName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ORG';
  const num = Math.floor(1000 + Math.random() * 9000);
  const orgId = `SL-${abbrev}-${num}`;

  // Hash password (simple - use bcrypt in production)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (c.env.JWT_SECRET || 'salt'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  try {
    const now = Date.now();
    await c.env.DB.prepare(
      `INSERT INTO organisations (id, name, contact_name, contact_email, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(orgId, orgName, contactName, email.toLowerCase(), hashHex, now).run();

    const token = btoa(JSON.stringify({ orgId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    let tbCustomerId = null;
    try {
      tbCustomerId = await createThingsBoardCustomer(orgName, c.env);
      if (tbCustomerId) {
        console.log(`ThingsBoard Customer ID: ${tbCustomerId}`);
      }
    } catch (err) {
      console.error("ThingsBoard provisioning error during registration", err);
    }

        const domain = email.split("@")[1];
    const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    const qrData = encodeURIComponent(JSON.stringify({ orgId, tbCustomerId }));
    const qrCodeUrl = `http://api.qrserver.com/v1/create-qr-code/?data=${qrData}&size=200x200`;
    
    return c.json({ token, orgId, orgName, email, tbCustomerId, logoUrl, qrCodeUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) return c.json({ error: 'Email already registered' }, 409);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const { email, password, orgCode } = await c.req.json<{
    email: string; password: string; orgCode: string;
  }>();

  if (!email || !password || !orgCode)
    return c.json({ error: 'All fields required' }, 400);

  const encoder = new TextEncoder();
  const data = encoder.encode(password + (c.env.JWT_SECRET || 'salt'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

  const org = await c.env.DB.prepare(
    `SELECT id, name, contact_email, password_hash FROM organisations WHERE id = ? AND contact_email = ?`
  ).bind(orgCode.toUpperCase(), email.toLowerCase()).first<{
    id: string; name: string; contact_email: string; password_hash: string;
  }>();

  if (!org || org.password_hash !== hashHex)
    return c.json({ error: 'Invalid organisation ID, email, or password' }, 401);

  if (await checkTrialExpired(c.env.DB, org.id)) {
    return c.json({ error: 'Trial expired. Please contact sales.', code: 'TRIAL_EXPIRED' }, 403);
  }

  const token = btoa(JSON.stringify({ orgId: org.id, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  return c.json({ token, orgId: org.id, orgName: org.name, email });
});

// ─── Trial Enforcement Helper ──────────────────────────────────────────────────
const checkTrialExpired = async (db: any, orgId: string) => {
  const org = await db.prepare(`SELECT created_at FROM organisations WHERE id = ?`).bind(orgId).first();
  if (!org) return false;
  const trialDuration = 29 * 24 * 60 * 60 * 1000; // 29 days
  return Date.now() - org.created_at > trialDuration;
};

// ─── Auth middleware ───────────────────────────────────────────────────────────

const authMiddleware = async (c: any, next: any) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payload = JSON.parse(atob(auth.slice(7)));
    if (payload.exp < Date.now()) return c.json({ error: 'Token expired' }, 401);

    if (await checkTrialExpired(c.env.DB, payload.orgId)) {
      return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
    }

    c.set('orgId', payload.orgId);
    c.set('email', payload.email);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// ─── Org routes ────────────────────────────────────────────────────────────────

app.get('/api/org/:orgId', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (c.get('orgId') !== orgId) return c.json({ error: 'Forbidden' }, 403);

  const org = await c.env.DB.prepare(
    `SELECT id, name, contact_name, created_at FROM organisations WHERE id = ?`
  ).bind(orgId).first();
  if (!org) return c.json({ error: 'Not found' }, 404);

  const count = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM users WHERE org_id = ?`
  ).bind(orgId).first<{ n: number }>();

  return c.json({ ...org, memberCount: count?.n || 0 });
});

app.get('/api/org/:orgId/members', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (c.get('orgId') !== orgId) return c.json({ error: 'Forbidden' }, 403);

  const { results } = await c.env.DB.prepare(
    `SELECT id, username, email, role, last_seen, lat, lng, sos_active
     FROM users WHERE org_id = ? ORDER BY last_seen DESC LIMIT 100`
  ).bind(orgId).all();

  return c.json(results.map((r: any) => ({
    id: r.id, username: r.username, email: r.email, role: r.role,
    lastSeen: r.last_seen, lat: r.lat, lng: r.lng, sosActive: !!r.sos_active
  })));
});

// ─── User telemetry (called from Android APK) ─────────────────────────────────

app.post('/api/user/heartbeat', async (c) => {
  const { userId, orgId, lat, lng, sosActive } = await c.req.json<{
    userId: string; orgId: string; lat?: number; lng?: number; sosActive?: boolean;
  }>();
  if (!userId || !orgId) return c.json({ error: 'Missing fields' }, 400);

  if (await checkTrialExpired(c.env.DB, orgId)) {
    return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  }

  const now = Date.now();
  await c.env.DB.prepare(
    `UPDATE users SET last_seen = ?, lat = ?, lng = ?, sos_active = ? WHERE id = ? AND org_id = ?`
  ).bind(now, lat || null, lng || null, sosActive ? 1 : 0, userId, orgId).run();
  return c.json({ ok: true });
});

app.post('/api/user/sos', async (c) => {
  const { userId, orgId, lat, lng } = await c.req.json<{
    userId: string; orgId: string; lat?: number; lng?: number;
  }>();
  if (!userId || !orgId) return c.json({ error: 'Missing fields' }, 400);

  if (await checkTrialExpired(c.env.DB, orgId)) {
    return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  }

  const now = Date.now();
  await c.env.DB.prepare(
    `UPDATE users SET sos_active = 1, last_seen = ?, lat = ?, lng = ? WHERE id = ? AND org_id = ?`
  ).bind(now, lat || null, lng || null, userId, orgId).run();
  await c.env.DB.prepare(
    `INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at)
     VALUES (?, ?, ?, 'SOS', ?, ?, ?)`
  ).bind(crypto.randomUUID(), orgId, userId, lat || null, lng || null, now).run();

  // Fire the Pipedream webhook in the background without making the user wait
  c.executionCtx.waitUntil(triggerPipedreamEscalation({ userId, orgId }, { lat, lng }, c.env));

  return c.json({ ok: true, message: "Panic logged and escalated" });
});

// ─── D1 Schema init ────────────────────────────────────────────────────────────

app.get('/api/init-db', async (c) => {
  await c.env.DB.exec(`
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
      org_id TEXT NOT NULL,
      username TEXT,
      email TEXT,
      role TEXT DEFAULT 'User',
      last_seen INTEGER,
      lat REAL,
      lng REAL,
      sos_active INTEGER DEFAULT 0,
      created_at INTEGER,
      FOREIGN KEY (org_id) REFERENCES organisations(id)
    );
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT,
      type TEXT,
      lat REAL,
      lng REAL,
      resolved INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  return c.json({ ok: true, message: 'Database initialized' });
});



import { GoogleGenAI } from "@google/genai";

app.post('/api/ai/chat', authMiddleware, async (c) => {
  const { message } = await c.req.json<{ message: string }>();
  if (!message) return c.json({ error: 'Message required' }, 400);

  const apiKey = c.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
  if (!apiKey) return c.json({ error: 'Gemini API Key not configured' }, 500);

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        tools: [{ googleMaps: {} }],
        systemInstruction: "You are a helpful safety and location assistant for SafetyLink. Provide accurate information about locations and safety using Google Maps grounding."
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return c.json({ text, groundingChunks });
  } catch (error) {
    console.error("Gemini API error:", error);
    return c.json({ error: 'AI request failed' }, 500);
  }
});


// ─── Offline Synchronization ───────────────────────────────────────────────────

app.post('/api/sync/offline', async (c) => {
  const { orgId, payload } = await c.req.json<{
    orgId: string;
    payload: Array<{
      id: string;
      timestamp: number;
      description: string;
      lat: number;
      lng: number;
    }>;
  }>();

  if (!orgId || !payload || !Array.isArray(payload)) {
    return c.json({ error: 'Missing fields or invalid payload' }, 400);
  }

  if (await checkTrialExpired(c.env.DB, orgId)) {
    return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  }

  const failedItems = [];
  const now = Date.now();

  for (const item of payload) {
    try {
      // 1. Write the offline event to the SQL DB
      await c.env.DB.prepare(
        `INSERT INTO incidents (id, org_id, user_id, type, lat, lng, created_at)
         VALUES (?, ?, ?, 'OFFLINE_SYNC', ?, ?, ?)`
      ).bind(item.id, orgId, 'SYNCED', item.lat || null, item.lng || null, item.timestamp || now).run();

      // 2. Trigger Pipedream Escalation
      c.executionCtx.waitUntil(triggerPipedreamEscalation({ userId: 'SYNCED', orgId }, { lat: item.lat, lng: item.lng }, c.env));
    } catch (err) {
      console.error('Failed to sync offline item', item.id, err);
      failedItems.push(item);
    }
  }

  return c.json({ ok: true, failedItems });
});


export default app;
