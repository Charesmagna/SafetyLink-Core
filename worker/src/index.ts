import { verifyForwarderSignature } from './pcm-auth';
import { checkCredentials, makeSession, tooManyFailures, recordAttempt } from './admin-auth';
import { adminAuthorised, adminSummary, adminUsers, adminDelete } from './admin';
import { sendLoudAlarm } from './fcm';
// SafetyLink Cloudflare Worker — Full Backend
// Hono framework, D1 database, all emergency dispatch routes

import { buildPayfastSignature } from './payfast';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  checkGatewayStaleAlert,
  gatewayNumber,
  getGatewayHealth,
  inboundPcm,
  locatePcm,
  processPendingPcmRetries,
  recordGatewayHeartbeat,
  syncProfile,
} from './zero-airtime';

export interface Env {
  DB?: D1Database;
  RELEASES?: any;
  MEDIA?: any;
  FCM_SERVICE_ACCOUNT?: string;
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
  // Paystack & PayFast
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  PAYFAST_SANDBOX?: string;
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
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Profile-Token', 'X-PCM-Token', 'X-Signature', 'X-Hmac-Sha256'],
  exposeHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
  credentials: true,
}));

// ── HELPERS ───────────────────────────────────────────────────────────────────
const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const toB64Url = (input: string) =>
  btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64Url = (b64: string) => {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(norm)));
};

const makeToken = async (env: Env, payload: Record<string, any>): Promise<string> => {
  const secret = String(env.JWT_SECRET || '').trim();
  if (!secret) throw new Error('JWT_SECRET is not configured on the Worker.');
  const body = toB64Url(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 86400_000 }));
  const sig = await hexHmac(secret, body);
  return `${body}.${sig}`;
};

const verifyToken = async (env: Env, token: string): Promise<any> => {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [body, givenSig] = parts;
    const secret = String(env.JWT_SECRET || '').trim();
    if (!secret) return null;
    const expectedSig = await hexHmac(secret, body);
    if (!safeEq(givenSig, expectedSig)) return null;
    const p = JSON.parse(fromB64Url(body));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
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
  const payload = await verifyToken(c.env, auth.slice(7));
  if (!payload) return c.json({ error: 'Invalid or expired signed token' }, 401);
  if (payload.userId && c.env.DB) {
    const row: any = await c.env.DB.prepare('SELECT status, token_version FROM users WHERE id = ?').bind(payload.userId).first().catch(() => null);
    if (row && (row.status === 'suspended' || row.status === 'deactivated')) {
      return c.json({ error: `Account is ${row.status}. Contact SafetyLink Administrator.` }, 403);
    }
    if (row && typeof row.token_version === 'number' && typeof payload.tokenVersion === 'number' && row.token_version !== payload.tokenVersion) {
      return c.json({ error: 'Session revoked. Please sign in again.' }, 401);
    }
  }
  if (payload.orgId && await checkTrialExpired(c.env.DB, payload.orgId)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
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

    // Push Notification: High-priority FCM loud alarm to registered Android devices
    if ((env as any).FCM_SERVICE_ACCOUNT) {
      try {
        const rows: any = await (env as any).DB?.prepare(
          'SELECT token FROM device_tokens WHERE phone = ? LIMIT 5'
        ).bind(to).all().catch(() => ({ results: [] }));
        const tokens = (rows?.results || []).map((r: any) => r.token).filter(Boolean);
        for (const devToken of tokens) {
          const alarmTitle = 'EMERGENCY: SafetyLink Alert';
          const alarmBody = `${callerName || callerNumber || 'A user'} pressed panic! Location: ${location}`;
          const fcmRes = await sendLoudAlarm((env as any).FCM_SERVICE_ACCOUNT, devToken, alarmTitle, alarmBody).catch((e: any) => ({ ok: false, error: e?.message }));
          results.push({ channel: 'FCM_LOUD_ALARM', provider: 'firebase', to, ok: fcmRes.ok, detail: fcmRes.ok ? 'Loud alarm sent to device' : (fcmRes as any).error });
        }
      } catch (err: any) {
        console.warn('[FCM dispatch error]', err);
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
// Latest APK, served from R2 (the repo can stay private)
// Three downloads: stable 2.0 (/download/safetylink.apk), beta (/download/beta/...), legacy 1.x (/download/v1/...)
const dl = (key: string, file: string, fallbackKey?: string) => async (c: any) => {
  const releases = (c.env as any).RELEASES;
  const obj = (await releases?.get(key)) || (fallbackKey ? await releases?.get(fallbackKey) : null);
  if (!obj) return c.json({ error: 'Not published yet' }, 404);
  return new Response(obj.body, { headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': `attachment; filename="${file}"`, 'Content-Length': String(obj.size), 'Cache-Control': 'no-cache' } });
};
app.get('/download/beta/safetylink.apk', dl('safetylink-beta-latest.apk', 'SafetyLink-beta.apk', 'safetylink-latest.apk'));
app.get('/download/v1/safetylink.apk', dl('safetylink-v1-latest.apk', 'SafetyLink-1.x-legacy.apk', 'safetylink-latest.apk'));
app.get('/api/app/beta/versions', async (c) => {
  const obj: any = await (c.env as any).RELEASES?.get('versions-beta/index.json');
  const list = obj ? await obj.json().catch(() => []) : [];
  return c.json({ versions: Array.isArray(list) ? list : [] });
});

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

// Version 2 Official APK, served from R2 (tracks latest main build, falling back to safetylink-v2-latest.apk)
app.get('/download/v2/safetylink.apk', async (c) => {
  const obj: any = (await (c.env as any).RELEASES?.get('safetylink-latest.apk')) || (await (c.env as any).RELEASES?.get('safetylink-v2-latest.apk'));
  if (!obj) return c.json({ error: 'No v2 release available yet' }, 404 as any);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="SafetyLink-v2.apk"',
      'Content-Length': String(obj.size),
      'Cache-Control': 'no-cache',
    },
  });
});

app.get('/api/app/latest', async (c) => {
  const obj: any =
    (await (c.env as any).RELEASES?.get('versions/index.json')) ||
    (await (c.env as any).RELEASES?.get('versions-beta/index.json'));
  const list = obj ? await obj.json().catch(() => []) : [];
  const latest = Array.isArray(list) && list.length > 0 ? list[0] : null;
  return c.json({
    version: latest?.version || '2.0',
    apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk',
    downloadUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk',
    notes: 'SafetyLink Version 2 Release',
    date: latest?.date || new Date().toISOString()
  });
});

app.get('/api/app/versions', async (c) => {
  const obj: any =
    (await (c.env as any).RELEASES?.get('versions/index.json')) ||
    (await (c.env as any).RELEASES?.get('versions-beta/index.json'));
  const list = obj ? await obj.json().catch(() => []) : [];
  return c.json({ versions: Array.isArray(list) ? list : [] });
});

app.get('/api/app/beta/versions', async (c) => {
  const obj: any = await (c.env as any).RELEASES?.get('versions-beta/index.json');
  const list = obj ? await obj.json().catch(() => []) : [];
  return c.json({ versions: Array.isArray(list) ? list : [] });
});

// Device FCM Token Registration for Android Push Ringing
app.post('/api/device/token', async (c) => {
  const profileToken = c.req.header('X-Profile-Token') || '';
  const body: any = await c.req.json().catch(() => ({}));
  const phone = body.phone;
  const token = body.token;
  if (!phone || !token) return c.json({ error: 'Missing phone or token' }, 400);

  await c.env.DB?.prepare(`
    CREATE TABLE IF NOT EXISTS device_tokens (
      phone TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      profile_token TEXT,
      updated_at INTEGER NOT NULL
    )
  `).run().catch(() => {});

  await c.env.DB?.prepare(`
    INSERT INTO device_tokens (phone, token, profile_token, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET token=excluded.token, profile_token=excluded.profile_token, updated_at=excluded.updated_at
  `).bind(phone, token, profileToken, Date.now()).run().catch(async () => {
    await c.env.DB?.prepare(`
      INSERT OR REPLACE INTO device_tokens (phone, token, profile_token, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(phone, token, profileToken, Date.now()).run().catch(() => {});
  });

  return c.json({ ok: true, registered: true });
});

// Cloudflare R2 Media Stream & Download Routes (MEDIA bucket priority + Byte-Range support)
async function getR2AssetFromEnv(env: any, rawKey: string, rangeHeader?: string | null) {
  const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
  const candidates = key.startsWith('Safetylink/') ? [key, key.replace(/^Safetylink\//, '')] : ['Safetylink/' + key, key];

  let parsedRange: { offset: number; length?: number; end?: number } | undefined;
  let rangeStart = 0;
  let hasEnd = false;
  let requestedEnd = 0;
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const [s, e] = rangeHeader.replace(/^bytes=/, '').split('-');
    rangeStart = parseInt(s, 10) || 0;
    if (e && !isNaN(parseInt(e, 10))) {
      hasEnd = true;
      requestedEnd = parseInt(e, 10);
      parsedRange = { offset: rangeStart, length: Math.max(1, requestedEnd - rangeStart + 1) };
    } else {
      parsedRange = { offset: rangeStart };
    }
  }

  for (const bucket of [env.MEDIA, env.RELEASES]) {
    if (!bucket) continue;
    for (const candidate of candidates) {
      const obj = parsedRange
        ? await bucket.get(candidate, { range: parsedRange }).catch(() => null)
        : await bucket.get(candidate).catch(() => null);
      if (obj) {
        return { obj, key: candidate, hasRange: Boolean(parsedRange), rangeStart, hasEnd, requestedEnd };
      }
    }
  }
  return null;
}

app.get('/api/r2/assets', async (c) => {
  const prefix = c.req.query('prefix') || 'Safetylink/';
  const bucket = c.env.MEDIA || c.env.RELEASES;
  if (!bucket) {
    return c.json({ success: false, assets: [], error: 'R2 bucket binding not configured' }, 503);
  }
  const assets: any[] = [];
  const categories: Record<string, number> = {};
  let cursor: string | undefined;
  do {
    const listed: any = await bucket.list({ prefix, cursor, limit: 500 });
    for (const obj of listed?.objects || []) {
      const key = String(obj.key || '');
      if (!key || key.endsWith('/')) continue;
      const ext = key.split('.').pop()?.toLowerCase() || '';
      const category = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)
        ? 'images'
        : ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'].includes(ext)
          ? 'videos'
          : ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)
            ? 'audio'
            : ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'csv'].includes(ext)
              ? 'documents'
              : 'other';
      categories[category] = (categories[category] || 0) + 1;
      const size = Number(obj.size || 0);
      assets.push({
        key,
        name: key.split('/').pop() || key,
        category,
        extension: ext,
        sizeBytes: size,
        sizeFormatted: size >= 1048576 ? `${(size / 1048576).toFixed(2)} MB` : size >= 1024 ? `${(size / 1024).toFixed(2)} KB` : `${size} B`,
        lastModified: obj.uploaded ? new Date(obj.uploaded).toISOString() : undefined,
        streamUrl: `/api/r2/stream/${encodeURIComponent(key)}`,
        downloadUrl: `/api/r2/download/${encodeURIComponent(key)}`,
      });
    }
    cursor = listed?.truncated ? listed.cursor : undefined;
  } while (cursor);

  return c.json({
    success: true,
    bucket: c.env.MEDIA ? 'media' : 'safetylink-releases',
    prefix,
    totalCount: assets.length,
    categories,
    assets,
  });
});

app.get('/api/r2/stream/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/api\/r2\/stream\//, '');
  const rangeHeader = c.req.header('Range');
  const found = await getR2AssetFromEnv(c.env, path, rangeHeader);
  if (!found) {
    return c.json({ error: 'Asset not found in R2 storage' }, 404);
  }
  const { obj, key, hasRange, rangeStart, hasEnd, requestedEnd } = found;
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    svg: 'image/svg+xml', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm',
    mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    pdf: 'application/pdf', apk: 'application/vnd.android.package-archive'
  };
  const totalSize = Number(obj.size || 0);
  const headers: Record<string, string> = {
    'Content-Type': mimeMap[ext] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Origin': '*',
  };
  if (hasRange && totalSize > 0) {
    const end = hasEnd ? Math.min(requestedEnd, totalSize - 1) : totalSize - 1;
    const len = Math.max(0, end - rangeStart + 1);
    headers['Content-Range'] = `bytes ${rangeStart}-${end}/${totalSize}`;
    headers['Content-Length'] = String(len);
    return new Response(obj.body, { status: 206, headers });
  }
  headers['Content-Length'] = String(totalSize);
  return new Response(obj.body, { status: 200, headers });
});

app.get('/api/r2/download/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname.replace(/^\/api\/r2\/download\//, '');
  const found = await getR2AssetFromEnv(c.env, path, null);
  if (!found) {
    return c.json({ error: 'Asset not found in R2 storage' }, 404);
  }
  const { obj, key } = found;
  const filename = key.split('/').pop() || 'download';
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(obj.size),
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    }
  });
});

async function handleR2Delete(c: any) {
  if (!(await adminAuthorised(c.env, c.req.raw))) {
    return c.json({ error: 'Superadmin authorisation required to delete R2 media files' }, 401 as any);
  }
  const body = (await c.req.json().catch(() => ({}))) as any;
  const rawKey = String(body?.key || c.req.query('key') || '').trim();
  const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
  if (!key || key.includes('..') || key.endsWith('/')) {
    return c.json({ error: 'Valid R2 object key is required' }, 400 as any);
  }
  const candidates = key.startsWith('Safetylink/') ? [key, key.replace(/^Safetylink\//, '')] : [key, 'Safetylink/' + key];
  const deletedFrom: string[] = [];
  for (const [label, bucket] of [['media', c.env.MEDIA], ['safetylink-releases', c.env.RELEASES]] as const) {
    if (!bucket) continue;
    for (const candidate of candidates) {
      try {
        const head = await bucket.head(candidate).catch(() => null);
        if (head) {
          await bucket.delete(candidate);
          deletedFrom.push(`${label}:${candidate}`);
        }
      } catch {}
    }
  }
  if (deletedFrom.length === 0) {
    // Attempt direct delete on primary bucket as idempotent fallback
    const primary = c.env.MEDIA || c.env.RELEASES;
    if (primary) {
      await primary.delete(key).catch(() => {});
      deletedFrom.push(`primary:${key}`);
    }
  }
  await c.env.DB?.prepare('INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), 'SUPERADMIN', 'R2_MEDIA_DELETE', key, JSON.stringify({ deletedFrom }), Date.now())
    .run()
    .catch(() => {});
  return c.json({ ok: true, key, deletedFrom });
}

app.delete('/api/r2/assets', async (c) => handleR2Delete(c));
app.post('/api/r2/delete', async (c) => handleR2Delete(c));


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
    CREATE TABLE IF NOT EXISTS org_join_requests (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT,
      full_name TEXT,
      phone TEXT,
      email TEXT,
      requested_role TEXT DEFAULT 'Community Member',
      status TEXT DEFAULT 'PENDING',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor TEXT,
      action TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;
  for (const stmt of initStatements.split(';')) {
    if (stmt.trim()) await c.env.DB!.prepare(stmt).run();
  }
  await c.env.DB!.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run().catch(() => {});
  await c.env.DB!.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run().catch(() => {});
  await c.env.DB!.prepare('ALTER TABLE users ADD COLUMN app_version TEXT').run().catch(() => {});
  await c.env.DB!.prepare('ALTER TABLE users ADD COLUMN device_model TEXT').run().catch(() => {});
  await c.env.DB!.prepare('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1').run().catch(() => {});

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
  const cleanName = orgName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const abbrev = cleanName.length >= 3 ? cleanName.slice(0, 9) : (cleanName || 'ORG');
  // The server always issues the code. Any code sent by the phone is ignored.
  // Format: SL-<NAME>-001, 002, ... numbered from the highest existing number, so codes never repeat.
  const last = await c.env.DB!.prepare("SELECT id FROM organisations WHERE id LIKE ? ORDER BY id DESC LIMIT 1").bind(`SL-${abbrev}-%`).first() as any;
  const lastNum = last?.id ? parseInt(String(last.id).split('-').pop() || '0', 10) : 0;
  const orgId = `SL-${abbrev}-${String((isNaN(lastNum) ? 0 : lastNum) + 1).padStart(3, '0')}`;
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  const now = Date.now();
  try {
    await c.env.DB!.prepare(
      'INSERT INTO organisations (id, name, contact_name, contact_email, password_hash, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(orgId, orgName, contactName, email.toLowerCase(), hash, now).run();

    // 14-day trial. The server records it; the admin decides later whether an expired trial is blocked.
    const trialEndsAt = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString();
    await c.env.DB?.prepare('CREATE TABLE IF NOT EXISTS org_trials (org_id TEXT PRIMARY KEY, trial_ends_at TEXT NOT NULL)').run().catch(() => {});
    await c.env.DB?.prepare('INSERT OR REPLACE INTO org_trials (org_id, trial_ends_at) VALUES (?, ?)').bind(orgId, trialEndsAt).run().catch(() => {});
    const token = await makeToken(c.env, { orgId, email: email.toLowerCase() });
    return c.json({
      success: true,
      token,
      orgId,
      org_code: orgId,
      orgName,
      name: orgName,
      email: email.toLowerCase(),
      trialEndsAt,
      organization: {
        id: orgId,
        name: orgName,
        org_code: orgId,
        contactName,
        contactEmail: email.toLowerCase(),
        approved: true,
        subscriptionStatus: 'trial',
        createdAt: now,
      }
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
  const role = body.role || 'Community Member';
  const appVersion = body.appVersion || body.app_version || '1.1.1170';
  const deviceModel = body.deviceModel || body.device_model || '';
  if (!username || !password) return c.json({ error: 'Username and password required' }, 400);
  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await c.env.DB!.prepare(
      "INSERT INTO users (id, org_id, username, email, phone, role, password_hash, status, app_version, device_model, token_version, last_seen, created_at) VALUES (?,?,?,?,?,?,?,'active',?,?,1,?,?)"
    ).bind(id, orgCode || null, username, email || null, phone || null, role, hash, appVersion, deviceModel, now, now).run().catch(async () => {
      await c.env.DB!.prepare(
        'INSERT INTO users (id, org_id, username, email, phone, role, password_hash, created_at) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(id, orgCode || null, username, email || null, phone || null, role, hash, now).run();
    });

    if (orgCode) {
      await c.env.DB!.prepare(
        `INSERT OR IGNORE INTO org_join_requests (id, org_id, user_id, username, full_name, phone, email, requested_role, status, created_at) VALUES (?,?,?,?,?,?,?,?,'PENDING',?)`
      ).bind(crypto.randomUUID(), orgCode.toUpperCase(), id, username, body.fullName || username, phone || '', email || '', role, now).run().catch(() => {});
    }

    const token = await makeToken(c.env, { userId: id, orgId: orgCode || null, username, role, tokenVersion: 1 });
    return c.json({
      token,
      userId: id,
      orgId: orgCode || null,
      org_code: orgCode || null,
      username,
      role,
      user: {
        id,
        username,
        fullName: body.fullName || username,
        email: email || '',
        phone: phone || '',
        role,
        orgId: orgCode || '',
        org_code: orgCode || '',
        orgCode: orgCode || '',
        accountStatus: 'active',
      }
    });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Username taken' }, 409);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

const handleLogin = async (c: any) => {
  const body: any = await c.req.json();
  const username = String(body.username || '').trim();
  const password = body.password || body.admin_password || '';
  const orgCode = String(body.orgCode || body.org_code || '').trim();
  const appVersion = String(body.appVersion || body.app_version || '');
  const deviceModel = String(body.deviceModel || body.device_model || '');
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';

  if ((!username && !orgCode) || !password) return c.json({ error: 'Credentials required' }, 400);

  const hash = await hashPassword(password, c.env.JWT_SECRET || 'sl-salt');
  let user: any = null;
  if (username) {
    if (orgCode) {
      user = await c.env.DB!.prepare(
        'SELECT id, username, org_id, role, email, phone, status, token_version FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND UPPER(COALESCE(org_id, "")) = UPPER(?) AND password_hash = ?'
      ).bind(username, username, orgCode, hash).first().catch(() => null);
    }
    if (!user) {
      user = await c.env.DB!.prepare(
        'SELECT id, username, org_id, role, email, phone, status, token_version FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password_hash = ?'
      ).bind(username, username, hash).first().catch(() => null);
    }
  }
  if (!user) {
    const targetOrgCode = (orgCode || username || '').toUpperCase();
    const org = await c.env.DB!.prepare(
      'SELECT id, name, contact_name, contact_email, created_at FROM organisations WHERE (UPPER(id) = UPPER(?) OR UPPER(id) = UPPER(?) OR LOWER(contact_email) = LOWER(?) OR LOWER(name) = LOWER(?)) AND password_hash = ?'
    ).bind(targetOrgCode, username, username, username, hash).first().catch(() => null) as any;
    if (!org) {
      await recordAttempt(c.env.DB, ip, false).catch(() => {});
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    if (await checkTrialExpired(c.env.DB, org.id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
    const token = await makeToken(c.env, { orgId: org.id, username: username || org.id, email: org.contact_email || '' });
    return c.json({
      token,
      orgId: org.id,
      org_code: org.id,
      orgName: org.name,
      org_name: org.name,
      role: 'ORG',
      organization: {
        id: org.id,
        name: org.name,
        org_code: org.id,
        contactName: org.contact_name || org.name,
        contactEmail: org.contact_email || '',
        approved: true,
        subscriptionStatus: 'trial',
        createdAt: org.created_at || Date.now(),
      }
    });
  }
  if (user.status === 'suspended' || user.status === 'deactivated') {
    return c.json({ error: `Account is ${user.status}. Please contact support.` }, 403);
  }
  if (user.org_id && await checkTrialExpired(c.env.DB, user.org_id)) return c.json({ error: 'Trial expired', code: 'TRIAL_EXPIRED' }, 403);
  await c.env.DB!.prepare('UPDATE users SET last_seen = ?, app_version = COALESCE(NULLIF(?, ""), app_version), device_model = COALESCE(NULLIF(?, ""), device_model) WHERE id = ?')
    .bind(Date.now(), appVersion, deviceModel, user.id).run().catch(() => {});

  const token = await makeToken(c.env, { userId: user.id, orgId: user.org_id, username: user.username, role: user.role, tokenVersion: user.token_version || 1 });
  return c.json({
    token,
    userId: user.id,
    orgId: user.org_id,
    org_code: user.org_id,
    username: user.username,
    role: user.role || 'User',
    email: user.email,
    phone: user.phone,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.username,
      orgId: user.org_id || '',
      org_code: user.org_id || '',
      orgCode: user.org_id || '',
      role: user.role || 'User',
      email: user.email || '',
      phone: user.phone || '',
      accountStatus: user.status || 'active',
    }
  });
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

// Superadmin login (email + strong password from the server, returns a session)
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

app.post('/api/pcm/retry', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  const outcome = await processPendingPcmRetries(c.env);
  return c.json({ ok: true, ...outcome });
});

app.post('/api/pcm/heartbeat', async (c) => {
  const expected = (c.env.PCM_WEBHOOK_TOKEN || '').trim();
  const hmacSecrets = [c.env.PCM_WEBHOOK_SECRET, c.env.PCM_WEBHOOK_TOKEN].map((v: any) => String(v || '').trim()).filter(Boolean);
  if (!expected && hmacSecrets.length === 0) return c.json({ error: 'PCM webhook not configured' }, 503 as any);
  const raw = await c.req.text();
  const givenTok = (c.req.query('token') || c.req.header('x-pcm-token') || '').trim();
  const signatureHeader = (c.req.header('X-Signature') || c.req.header('X-Hmac-Sha256') || '').trim();
  const tokenOk = !!expected && !!givenTok && safeEq(givenTok, expected);
  const sigOk = await verifyForwarderSignature(raw, signatureHeader, hmacSecrets);
  if (!tokenOk && !sigOk) return c.json({ error: 'Unauthorized' }, 401 as any);
  let body: any = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  const outcome = await recordGatewayHeartbeat(c.env, body);
  return c.json(outcome.json, outcome.status as any);
});

app.get('/api/pcm/health', async (c) => {
  const outcome = await getGatewayHealth(c.env);
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
    return c.json({ ok: false, error: 'temporary server error' }, 500 as any);
  }
}

async function handlePcmWebhookInner(c: any) {
  // AUTH: every request must carry the secret token (?token= or x-pcm-token header),
  // or a valid HMAC signature. Without this anyone could trigger alerts.
  const expected = (c.env.PCM_WEBHOOK_TOKEN || '').trim();
  // SMS Forwarder signs with HMAC. Some existing deployments stored the same
  // shared value as PCM_WEBHOOK_TOKEN, so accept either configured secret.
  const hmacSecrets = [c.env.PCM_WEBHOOK_SECRET, c.env.PCM_WEBHOOK_TOKEN].map((v: string) => (v || '').trim()).filter(Boolean);
  if (!expected && hmacSecrets.length === 0) return c.json({ error: 'PCM webhook not configured' }, 503 as any);
  const raw = await c.req.text();
  const givenTok = (c.req.param('token') || c.req.query('token') || c.req.header('x-pcm-token') || '').trim();
  const signatureHeader = (c.req.header('X-Signature') || c.req.header('X-Hmac-Sha256') || '').trim();
  const tokenOk = !!expected && !!givenTok && safeEq(givenTok, expected);
  const sigOk = await verifyForwarderSignature(raw, signatureHeader, hmacSecrets);
  if (!tokenOk && !sigOk) {
    // Diagnostic metadata only. Never log secrets, signatures, or message contents.
    console.warn('[PCM] authentication rejected', {
      tokenConfigured: !!expected,
      hmacSecretCount: hmacSecrets.length,
      tokenProvided: !!givenTok,
      signatureProvided: !!signatureHeader,
      signatureLength: signatureHeader.length,
      signaturePrefix: /^sha256=/i.test(signatureHeader) ? 'sha256=' : 'none',
      bodyLength: raw.length,
    });
    return c.json({ error: 'Unauthorized' }, 401 as any);
  }
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

  // Authentication has already been completed against the raw request body above.
  const outcome = await inboundPcm(c.env, rawText, extractedPhone || gatewaySender);
  return c.json(outcome.json, outcome.status as any);
}

// ── USER HEARTBEAT ────────────────────────────────────────────────────────────
app.post('/api/user/heartbeat', async (c) => {
  const { userId, lat, lng, sosActive, appVersion, deviceModel } = (await c.req.json()) as any;
  if (!userId) return c.json({ error: 'Missing userId' }, 400);
  const now = Date.now();
  await c.env.DB!.prepare(
    'UPDATE users SET last_seen=?, lat=?, lng=?, sos_active=?, app_version=COALESCE(?, app_version), device_model=COALESCE(?, device_model) WHERE id=?'
  ).bind(now, lat || null, lng || null, sosActive ? 1 : 0, appVersion || null, deviceModel || null, userId).run().catch(() => {});
  return c.json({ ok: true });
});

// ── APP VERSION POLICY (Minimum Version Gate) ─────────────────────────────────
app.get('/api/app/version-policy', async (c) => {
  const row: any = await c.env.DB?.prepare("SELECT value FROM app_config WHERE key = 'min_supported_version'").first().catch(() => null);
  return c.json({
    minSupportedVersion: row?.value || '1.0.0',
    latestVersion: '1.1.1170',
    updateUrl: 'https://safetylink.online/#/download',
  });
});

app.post('/api/admin/version-policy', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  const { minSupportedVersion } = (await c.req.json().catch(() => ({}))) as any;
  if (!minSupportedVersion) return c.json({ error: 'minSupportedVersion required' }, 400);
  await c.env.DB?.prepare(
    "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('min_supported_version', ?, ?)"
  ).bind(String(minSupportedVersion), Date.now()).run().catch(() => {});
  return c.json({ ok: true, minSupportedVersion: String(minSupportedVersion) });
});

// ── ORG MEMBERS & JOIN REQUESTS ───────────────────────────────────────────────
const isOrgAuthorized = (c: any, targetOrgId: string): boolean => {
  const tokenOrg = String(c.get('orgId') || '').trim().toUpperCase();
  const paramOrg = String(targetOrgId || '').trim().toUpperCase();
  return Boolean(tokenOrg && (tokenOrg === paramOrg || tokenOrg === 'SL-ADMIN-0000'));
};

app.get('/api/org/:orgId/members', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  if (!c.env.DB) return c.json([]);
  const { results } = await c.env.DB.prepare(
    'SELECT id, username, email, phone, role, status, app_version, device_model, last_seen, lat, lng, sos_active FROM users WHERE UPPER(org_id)=UPPER(?) ORDER BY last_seen DESC LIMIT 200'
  ).bind(orgId).all();
  return c.json(results);
});

app.get('/api/org/:orgId/join-requests', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  if (!c.env.DB) return c.json({ requests: [] });
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM org_join_requests WHERE UPPER(org_id)=UPPER(?) AND status='PENDING' ORDER BY created_at DESC LIMIT 100"
  ).bind(orgId).all().catch(() => ({ results: [] }));
  return c.json({ requests: results || [] });
});

app.post('/api/org/:orgId/join-requests', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId').toUpperCase();
  const body: any = await c.req.json().catch(() => ({}));
  const reqId = crypto.randomUUID();
  await c.env.DB?.prepare(
    `INSERT INTO org_join_requests (id, org_id, user_id, username, full_name, phone, email, requested_role, status, created_at) VALUES (?,?,?,?,?,?,?,?,'PENDING',?)`
  ).bind(reqId, orgId, body.userId || reqId, body.username || '', body.fullName || '', body.phone || '', body.email || c.get('email') || '', body.requestedRole || 'Community Member', Date.now()).run();
  return c.json({ ok: true, id: reqId, status: 'PENDING' });
});

app.post('/api/org/:orgId/join-requests/:requestId/approve', authMiddleware, async (c) => {
  const { orgId, requestId } = c.req.param();
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  const reqRow: any = await c.env.DB?.prepare('SELECT * FROM org_join_requests WHERE id=? AND UPPER(org_id)=UPPER(?)').bind(requestId, orgId).first().catch(() => null);
  if (!reqRow) return c.json({ error: 'Join request not found' }, 404);
  await c.env.DB?.prepare("UPDATE org_join_requests SET status='APPROVED' WHERE id=?").bind(requestId).run();
  await c.env.DB?.prepare('UPDATE users SET org_id=?, role=? WHERE id=?').bind(orgId.toUpperCase(), reqRow.requested_role || 'Community Member', reqRow.user_id).run().catch(() => {});
  return c.json({ ok: true, status: 'APPROVED' });
});

app.post('/api/org/:orgId/join-requests/:requestId/reject', authMiddleware, async (c) => {
  const { orgId, requestId } = c.req.param();
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB?.prepare("UPDATE org_join_requests SET status='REJECTED' WHERE id=? AND UPPER(org_id)=UPPER(?)").bind(requestId, orgId).run();
  return c.json({ ok: true, status: 'REJECTED' });
});

// ── INCIDENTS ─────────────────────────────────────────────────────────────────
app.get('/api/org/:orgId/incidents', authMiddleware, async (c) => {
  const orgId = c.req.param('orgId');
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  if (!c.env.DB) return c.json([]);
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM incidents WHERE UPPER(org_id)=UPPER(?) ORDER BY created_at DESC LIMIT 100'
  ).bind(orgId).all();
  return c.json(results);
});

app.post('/api/org/:orgId/incidents/:id/resolve', authMiddleware, async (c) => {
  const { orgId, id } = c.req.param();
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB!.prepare('UPDATE incidents SET resolved=1 WHERE id=? AND UPPER(org_id)=UPPER(?)').bind(id, orgId).run();
  return c.json({ ok: true });
});

// ── SUPERADMIN ────────────────────────────────────────────────────────────────
app.post('/api/admin/users/:id/status', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  const { id } = c.req.param();
  const body: any = await c.req.json().catch(() => ({}));
  const action = String(body.action || '').toUpperCase(); // ACTIVATE | DEACTIVATE | SUSPEND | REVOKE_SESSIONS
  if (action === 'REVOKE_SESSIONS') {
    await c.env.DB?.prepare('UPDATE users SET token_version = COALESCE(token_version, 1) + 1 WHERE id = ?').bind(id).run();
  } else {
    const nextStatus = action === 'SUSPEND' ? 'suspended' : action === 'DEACTIVATE' ? 'deactivated' : 'active';
    await c.env.DB?.prepare('UPDATE users SET status = ? WHERE id = ?').bind(nextStatus, id).run();
  }
  await c.env.DB?.prepare('INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), 'SUPERADMIN', action, id, body.reason || '', Date.now()).run().catch(() => {});
  return c.json({ ok: true, id, action });
});

app.get('/api/admin/audit-logs', async (c) => {
  if (!(await adminAuthorised(c.env, c.req.raw))) return c.json({ error: 'Unauthorised' }, 401 as any);
  const { results } = await c.env.DB!.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all().catch(() => ({ results: [] }));
  return c.json({ logs: results || [] });
});

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

// ── PAYFAST CHECKOUT & VERIFIED ITN ───────────────────────────────────────────
app.post('/api/payfast/checkout', async (c) => {
  const merchantId = (c.env.PAYFAST_MERCHANT_ID || '').trim();
  const merchantKey = (c.env.PAYFAST_MERCHANT_KEY || '').trim();
  if (!merchantId || !merchantKey) {
    return c.json({ error: 'PayFast merchant credentials are not configured on this server.' }, 503 as any);
  }
  const { plan_name, amount, email, orgId, userId } = (await c.req.json().catch(() => ({}))) as any;
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return c.json({ error: 'Valid payment amount is required.' }, 400 as any);
  }
  const pfData: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: 'https://safetylink.online/#/payment-success',
    cancel_url: 'https://safetylink.online/#/payment-cancel',
    notify_url: 'https://api.safetylink.online/api/payfast/notify',
    email_address: String(email || 'user@safetylink.online').trim(),
    m_payment_id: `SL-${Date.now()}`,
    amount: parsedAmount.toFixed(2),
    item_name: `SafetyLink ${String(plan_name || 'Plan').slice(0, 64)}`,
  };
  if (orgId) pfData.custom_str1 = String(orgId).trim().slice(0, 64);
  if (userId) pfData.custom_str2 = String(userId).trim().slice(0, 64);
  pfData.signature = buildPayfastSignature(pfData, c.env.PAYFAST_PASSPHRASE);
  const host = String(c.env.PAYFAST_SANDBOX || '').toLowerCase() === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';
  const query = new URLSearchParams(pfData).toString();
  return c.json({ success: true, url: `${host}?${query}` });
});

app.post('/api/payfast/notify', async (c) => {
  const merchantId = (c.env.PAYFAST_MERCHANT_ID || '').trim();
  if (!merchantId) return c.json({ error: 'PayFast not configured' }, 503 as any);
  const raw = await c.req.text();
  const params = new URLSearchParams(raw);
  const incoming: Record<string, string> = {};
  for (const [k, v] of params.entries()) incoming[k] = v;
  const givenSig = String(incoming.signature || '').trim().toLowerCase();
  if (!givenSig || incoming.merchant_id !== merchantId) {
    return c.json({ error: 'Invalid PayFast ITN merchant or signature' }, 401 as any);
  }
  const expectedSig = buildPayfastSignature(incoming, c.env.PAYFAST_PASSPHRASE);
  if (!safeEq(givenSig, expectedSig)) {
    return c.json({ error: 'PayFast ITN signature mismatch' }, 401 as any);
  }
  const paymentStatus = String(incoming.payment_status || '').toUpperCase();
  const orgId = String(incoming.custom_str1 || '').trim();
  if (paymentStatus === 'COMPLETE' && orgId && c.env.DB) {
    await c.env.DB.prepare(
      'INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(
      crypto.randomUUID(),
      'PAYFAST_ITN',
      'PAYMENT_COMPLETE',
      orgId,
      JSON.stringify({ pf_payment_id: incoming.pf_payment_id, amount_gross: incoming.amount_gross }),
      Date.now()
    ).run().catch(() => {});
  }
  return c.json({ ok: true, payment_status: paymentStatus });
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
  const body = await c.req.json<any>().catch(() => ({}));
  const orgId = body.orgId || body.org_id || 'INDIVIDUAL';
  const items = Array.isArray(body.payload) ? body.payload : (Array.isArray(body.incidents) ? body.incidents : []);
  if (items.length === 0 && !Array.isArray(body.payload) && !Array.isArray(body.incidents)) {
    return c.json({ error: 'Invalid payload' }, 400);
  }
  const now = Date.now();
  const failedItems: any[] = [];
  for (const item of items) {
    try {
      await c.env.DB!.prepare(
        'INSERT OR IGNORE INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
      ).bind(
        item.id || item.incidentId || crypto.randomUUID(),
        item.orgId || orgId || 'INDIVIDUAL',
        item.triggeredBy || item.userId || 'OFFLINE',
        'OFFLINE_SYNC',
        item.lat ?? item.latitude ?? null,
        item.lng ?? item.longitude ?? null,
        item.timestamp || now
      ).run();
    } catch {
      failedItems.push(item);
    }
  }
  return c.json({ ok: true, synced: items.length - failedItems.length, failedItems });
});

export default {
  fetch: app.fetch,
  scheduled(_controller: any, env: Env, ctx: any) {
    ctx.waitUntil(Promise.all([
      processPendingPcmRetries(env),
      checkGatewayStaleAlert(env),
    ]));
  },
};
