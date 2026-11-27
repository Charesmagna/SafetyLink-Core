import { verifyForwarderSignature } from './pcm-auth';
import { checkCredentials, makeSession, tooManyFailures, recordAttempt } from './admin-auth';
import { adminAuthorised, adminSummary, adminUsers, adminDelete, adminRestoreCustomers } from './admin';
import { sendLoudAlarm } from './fcm';
import {
  saveDeviceToken,
  tokensForPhone,
  tokenStatusForPhone,
  pruneDeviceToken,
  phoneLookupVariants,
} from './device-tokens';
import {
  createQrLink,
  resolveQrLink,
  claimQrLink,
  getIncomingMutualLinks,
} from './qr-link';
import {
  handleWorkerLiveSafetyFeed,
  resolveFreeNewsArticleUrl,
} from './safety-feed';
// SafetyLink Cloudflare Worker — Full Backend
// Hono framework, D1 database, all emergency dispatch routes

import { buildPayfastSignature } from './payfast';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  checkGatewayStaleAlert,
  extractMsisdn,
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
  FREENEWSAPI_KEY?: string;
  BIGDATACLOUD_API_KEY?: string;
  IOT_WEBHOOK_SECRET?: string;
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
  GEMINI_API_KEY?: string;
}

export interface Variables {
  orgId: string;
  email: string;
  userId: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── CORS (Strict Trusted-Origin Allowlist) ────────────────────────────────────
const ALLOWED_CORS_ORIGINS = new Set([
  'https://safetylink.online',
  'https://www.safetylink.online',
  'https://api.safetylink.online',
  'https://safetylink-core.pages.dev',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

const isTrustedCorsOrigin = (origin?: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_CORS_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol === 'https:' && (u.hostname.endsWith('.safetylink.online') || u.hostname.endsWith('.safetylink-core.pages.dev') || u.hostname.endsWith('.run.app'))) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

app.use('*', cors({
  origin: (origin) => (isTrustedCorsOrigin(origin) ? origin : ''),
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Profile-Token', 'X-PCM-Token', 'X-Signature', 'X-Hmac-Sha256', 'X-IoT-Token', 'X-Webhook-Secret', 'X-Internal-Secret'],
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
  const cleanOrg = String(orgId || '').trim().toUpperCase();
  // Private/individual users are FREE — trial enforcement applies strictly to Organizations only.
  if (!cleanOrg || cleanOrg === 'INDIVIDUAL' || cleanOrg === 'PRIVATE' || cleanOrg === 'SL-ADMIN-0000') return false;
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
  c.set('orgId', payload.orgId || '');
  c.set('email', payload.email || '');
  c.set('userId', payload.userId || '');
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

async function checkSmsCooldownD1(env: Env, callerKey: string, recipient: string, cooldownMs = 5 * 60_000): Promise<boolean> {
  if (!env.DB) return false;
  try {
    await env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS sl_sms_dedupe (dedupe_key TEXT PRIMARY KEY, sent_at INTEGER NOT NULL)'
    ).run();
    const key = `${callerKey}::${recipient}`.slice(0, 128);
    const now = Date.now();
    const row = await env.DB.prepare('SELECT sent_at FROM sl_sms_dedupe WHERE dedupe_key = ?').bind(key).first<{ sent_at: number }>();
    if (row && now - Number(row.sent_at || 0) < cooldownMs) {
      return true; // throttled within 5-minute cooldown
    }
    await env.DB.prepare(
      'INSERT INTO sl_sms_dedupe (dedupe_key, sent_at) VALUES (?, ?) ON CONFLICT(dedupe_key) DO UPDATE SET sent_at=excluded.sent_at'
    ).bind(key, now).run();
    return false;
  } catch {
    return false; // fail open for life-safety
  }
}

async function fireAllAlerts(
  env: Env,
  { callerNumber, callerName, lat, lng, address, extraContacts = [], skipVoiceTo = [], providers = {}, preferFcmOnline = false, smsCooldownMinutes = 5 }: {
    callerNumber: string; callerName: string; lat?: number; lng?: number; address?: string;
    extraContacts?: string[]; skipVoiceTo?: string[]; providers?: any;
    preferFcmOnline?: boolean; smsCooldownMinutes?: number;
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

  const rainGateway = normalizePhone(env.RAIN_GATEWAY_MSISDN || '');
  const all = Array.from(new Set([
    ...extraContacts.map(normalizePhone),
    normalizePhone(env.RESPONSE_CENTRE_NUMBER || '+27739441222'),
  ].filter(n => Boolean(n) && (!rainGateway || n !== rainGateway))));
  const skipVoice = new Set(skipVoiceTo.map(normalizePhone));
  const voiceTargets = all.filter(n => !skipVoice.has(n));
  const cooldownMs = Math.max(0, Math.min(30, Number(smsCooldownMinutes) || 5)) * 60_000;
  const callerDedupeKey = normalizePhone(callerNumber || '') || callerName || 'anon';

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
    // 1) Push Notification: High-priority DATA-ONLY FCM loud alarm is ALWAYS part of emergency dispatch
    let fcmDelivered = false;
    if ((env as any).FCM_SERVICE_ACCOUNT && (env as any).DB) {
      try {
        const tokens = await tokensForPhone((env as any).DB, to);
        await Promise.allSettled(tokens.map(async (devToken) => {
          const alarmTitle = '🚨 EMERGENCY: SafetyLink Alert';
          const alarmBody = `${callerName || callerNumber || 'A SafetyLink user'} pressed panic! Location: ${location}`;
          const fcmRes = await sendLoudAlarm((env as any).FCM_SERVICE_ACCOUNT, devToken, alarmTitle, alarmBody, {
            callerName: String(callerName || callerNumber || 'SafetyLink User'),
            callerNumber: String(callerNumber || ''),
            location: String(location || 'Location unknown'),
            triggerSource: 'ONLINE_PANIC',
            ...(typeof lat === 'number' ? { lat: String(lat) } : {}),
            ...(typeof lng === 'number' ? { lng: String(lng) } : {}),
          }).catch((e: any) => ({ ok: false, status: 500, error: String(e?.message || e), unregistered: false }));
          if (fcmRes.ok) fcmDelivered = true;
          if (!fcmRes.ok && fcmRes.unregistered) {
            await pruneDeviceToken((env as any).DB, devToken);
          }
          results.push({
            channel: 'FCM_LOUD_ALARM',
            provider: 'firebase',
            to,
            ok: fcmRes.ok,
            status: fcmRes.status,
            detail: fcmRes.ok ? 'Loud alarm ring sent to SafetyLink app' : fcmRes.error,
          });
        }));
      } catch (err: any) {
        console.warn('[FCM dispatch error]', err);
      }
    }

    // 2) SMS: Respect configurable online Data-First mode + 5-minute D1 SMS dedupe guard
    const skipSmsDueToFcm = preferFcmOnline && fcmDelivered;
    if (skipSmsDueToFcm) {
      results.push({ channel: 'SMS', provider: 'fcm_data_saver', to, ok: true, detail: 'Skipped SMS (contact alerted via free FCM Loud Alarm on internet data)' });
    } else {
      const smsThrottled = cooldownMs > 0 ? await checkSmsCooldownD1(env, callerDedupeKey, to, cooldownMs) : false;
      if (smsThrottled) {
        results.push({ channel: 'SMS', provider: 'd1_dedupe_5m', to, ok: true, detail: `SMS suppressed: already sent to ${to} within last ${Math.round(cooldownMs / 60000)} minutes` });
      } else {
        let smsOk = false;
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
      }
    }

    // 3) WhatsApp via Twilio (only when TWILIO_WHATSAPP_FROM is explicitly configured)
    if (twAuth && (env as any).TWILIO_WHATSAPP_FROM) {
      await attempt('WHATSAPP', 'twilio', to, () => twPost('Messages', { From: `whatsapp:${tw.waFrom}`, To: `whatsapp:${to}`, Body: smsBody }));
    }

    // 4) Voice: ONE call per number. Vapi (AI) -> Twilio voice -> Bland, stopping at first success
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
        const safeSpokenXml = spoken
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        called = await attempt('VOICE', 'twilio', to, () => twPost('Calls', { From: tw.from, To: to, Twiml: `<Response><Say voice="alice">${safeSpokenXml}</Say><Pause length="1"/><Say voice="alice">${safeSpokenXml}</Say></Response>` }));
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
// Latest APKs served from R2:
// - Official Stable SafetyLink Version 1 (/download/v1/safetylink.apk & /download/safetylink.apk) -> safetylink-latest.apk (full-featured main build)
// - SafetyLink Beta (/download/beta/safetylink.apk & compatibility alias /download/v2/safetylink.apk) -> safetylink-beta-latest.apk (rolling from v1.1.1218+)
const dl = (key: string, file: string, fallbackKey?: string) => async (c: any) => {
  const releases = (c.env as any).RELEASES;
  const obj = (await releases?.get(key)) || (fallbackKey ? await releases?.get(fallbackKey) : null);
  if (!obj) return c.json({ error: 'Not published yet' }, 404);
  return new Response(obj.body, { headers: { 'Content-Type': 'application/vnd.android.package-archive', 'Content-Disposition': `attachment; filename="${file}"`, 'Content-Length': String(obj.size), 'Cache-Control': 'no-cache' } });
};
app.get('/download/beta/safetylink.apk', dl('safetylink-beta-latest.apk', 'SafetyLink-Beta-v1.1.1218.apk', 'safetylink-latest.apk'));
app.get('/download/v1/safetylink.apk', dl('safetylink-latest.apk', 'SafetyLink-v1.apk', 'safetylink-v1-latest.apk'));

app.get('/download/safetylink.apk', async (c) => {
  const obj: any = (await (c.env as any).RELEASES?.get('safetylink-latest.apk')) || (await (c.env as any).RELEASES?.get('safetylink-v1-latest.apk'));
  if (!obj) return c.json({ error: 'No release available yet' }, 404 as any);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="SafetyLink-v1.apk"',
      'Content-Length': String(obj.size),
      'Cache-Control': 'no-cache',
    },
  });
});

// SafetyLink Beta APK compatibility alias (Internal testing track starting from v1.1.1218+)
app.get('/download/v2/safetylink.apk', async (c) => {
  const obj: any =
    (await (c.env as any).RELEASES?.get('safetylink-beta-latest.apk')) ||
    (await (c.env as any).RELEASES?.get('safetylink-v2-latest.apk')) ||
    (await (c.env as any).RELEASES?.get('safetylink-latest.apk'));
  if (!obj) return c.json({ error: 'No beta build available yet' }, 404 as any);
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="SafetyLink-Beta-v1.1.1218.apk"',
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
    version: latest?.version || '1.1',
    channel: 'v1-stable',
    apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk',
    downloadUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk',
    betaApkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/beta/safetylink.apk',
    betaVersion: '1.1.1218',
    notes: 'SafetyLink Version 1 — Official Stable Release (All promoted features included)',
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

// Device FCM Token Registration for Android Push Ringing (supports multi-device & E.164 normalization)
app.post('/api/device/token', async (c) => {
  const profileToken = c.req.header('X-Profile-Token') || '';
  const body: any = await c.req.json().catch(() => ({}));
  const rawPhone = String(body.phone || '').trim();
  const token = String(body.token || '').trim();
  if (!rawPhone || !token || token.length < 20) {
    return c.json({ error: 'Valid phone and FCM device token are required' }, 400);
  }
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);

  const saved = await saveDeviceToken(c.env.DB, rawPhone, token, profileToken);
  if (!saved.saved) return c.json({ error: 'Invalid phone number format' }, 400);

  return c.json({
    ok: true,
    registered: true,
    phone: saved.phone,
    tokenPrefix: token.slice(0, 12),
    updatedAt: Date.now(),
  });
});

// Check whether a SafetyLink contact phone has an active FCM device token registered (never exposes raw tokens)
app.get('/api/device/token/status', async (c) => {
  const rawPhone = String(c.req.query('phone') || '').trim();
  if (!rawPhone) return c.json({ error: 'phone query parameter is required' }, 400);
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 503);
  const st = await tokenStatusForPhone(c.env.DB, rawPhone);
  return c.json({
    ok: true,
    fcmConfigured: !!(c.env as any).FCM_SERVICE_ACCOUNT,
    ...st,
  });
});

// Send a real high-priority data-only FCM loud ring test to a registered SafetyLink phone
app.post('/api/fcm/test-ring', async (c) => {
  if (!(c.env as any).FCM_SERVICE_ACCOUNT) {
    return c.json({ ok: false, error: 'FCM_SERVICE_ACCOUNT is not configured on this server' }, 503);
  }
  if (!c.env.DB) return c.json({ ok: false, error: 'Database not configured' }, 503);
  const body: any = await c.req.json().catch(() => ({}));
  const targetPhone = normalizePhone(body.phone || '');
  if (!targetPhone) return c.json({ ok: false, error: 'Valid target phone number is required' }, 400);

  // Per-phone 20s rate limit so anonymous callers cannot abuse loud-ring test endpoint
  try {
    await c.env.DB.prepare('CREATE TABLE IF NOT EXISTS sl_fcm_test_rl (phone TEXT PRIMARY KEY, last_at INTEGER NOT NULL)').run();
    const rlRow: any = await c.env.DB.prepare('SELECT last_at FROM sl_fcm_test_rl WHERE phone = ?').bind(targetPhone).first();
    if (rlRow && Date.now() - Number(rlRow.last_at || 0) < 20_000) {
      return c.json({ ok: false, error: 'Please wait 20 seconds before sending another test ring to this number.' }, 429);
    }
    await c.env.DB.prepare('INSERT INTO sl_fcm_test_rl (phone, last_at) VALUES (?, ?) ON CONFLICT(phone) DO UPDATE SET last_at=excluded.last_at')
      .bind(targetPhone, Date.now()).run();
  } catch {}

  const tokens = await tokensForPhone(c.env.DB, targetPhone);
  if (tokens.length === 0) {
    return c.json({
      ok: false,
      phone: targetPhone,
      deviceCount: 0,
      error: 'No SafetyLink Android app FCM token registered for this number yet. Open SafetyLink on that phone while signed in with this phone number.',
    }, 404);
  }

  const callerName = String(body.callerName || 'SafetyLink Diagnostic Test').slice(0, 80);
  const callerNumber = normalizePhone(body.callerNumber || '') || targetPhone;
  const location = String(body.location || 'FCM Live Loud Ring Verification').slice(0, 200);

  const deliveries: any[] = [];
  for (const devToken of tokens) {
    const fcmRes = await sendLoudAlarm(
      (c.env as any).FCM_SERVICE_ACCOUNT,
      devToken,
      '🚨 SafetyLink FCM Ring Test',
      `${callerName} triggered a live loud-alarm verification ring.`,
      {
        callerName,
        callerNumber,
        location,
        triggerSource: 'FCM_LIVE_TEST',
        isTest: 'true',
      },
    ).catch((e: any) => ({ ok: false, status: 500, error: String(e?.message || e), unregistered: false }));

    if (!fcmRes.ok && fcmRes.unregistered) {
      await pruneDeviceToken(c.env.DB, devToken);
    }
    deliveries.push({
      ok: fcmRes.ok,
      status: fcmRes.status,
      state: fcmRes.ok ? 'DELIVERED_TO_FCM' : (fcmRes.unregistered ? 'STALE_TOKEN_PRUNED' : 'FAILED'),
      error: fcmRes.error,
    });
  }

  const anyOk = deliveries.some((d) => d.ok);
  return c.json({
    ok: anyOk,
    phone: targetPhone,
    registeredDevices: tokens.length,
    results: deliveries,
  }, anyOk ? 200 : 502);
});

// ── QR CODE MUTUAL / 1-WAY CONTACT & FCM INSTANT-LINK ROUTES ────────────────
app.post('/api/link/create', async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: 'Database not configured' }, 503);
  const body: any = await c.req.json().catch(() => ({}));
  const out = await createQrLink(c.env.DB, body.phone || '', body.name || '');
  return c.json(out.json, out.status as any);
});

app.get('/api/link/resolve', async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: 'Database not configured' }, 503);
  const code = String(c.req.query('code') || '');
  const out = await resolveQrLink(c.env.DB, code);
  return c.json(out.json, out.status as any);
});

app.post('/api/link/claim', async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: 'Database not configured' }, 503);
  const body: any = await c.req.json().catch(() => ({}));
  const out = await claimQrLink(c.env.DB, body);
  return c.json(out.json, out.status as any);
});

app.get('/api/link/incoming', async (c) => {
  if (!c.env.DB) return c.json({ ok: false, error: 'Database not configured' }, 503);
  const phone = String(c.req.query('phone') || '');
  const ack = c.req.query('ack') === '1' || c.req.query('ack') === 'true';
  const out = await getIncomingMutualLinks(c.env.DB, phone, ack);
  return c.json(out.json, out.status as any);
});

// ── LIVE LOCAL SAFETY FEED (FreeNewsAPI.io + Fresh RSS + Open-Meteo) ────────
app.get('/api/safety-feed/live', async (c) => {
  const latRaw = c.req.query('lat');
  const lngRaw = c.req.query('lng');
  const query = c.req.query('query') || '';
  const radiusKm = Number(c.req.query('radiusKm') || 25);
  const origin = new URL(c.req.url).origin;
  const out = await handleWorkerLiveSafetyFeed(c.env, origin, {
    lat: latRaw !== undefined ? Number(latRaw) : undefined,
    lng: lngRaw !== undefined ? Number(lngRaw) : undefined,
    query,
    radiusKm,
    clientIp: c.req.header('CF-Connecting-IP') || '',
  });
  return c.json(out.json, out.status as any);
});

app.get('/api/safety-feed/article/:uuid', async (c) => {
  const uuid = c.req.param('uuid') || '';
  const apiKey = String((c.env as any).FREENEWSAPI_KEY || '').trim();
  const resolved = await resolveFreeNewsArticleUrl(apiKey, uuid);
  if (!resolved.ok || !resolved.url) {
    return c.json({ ok: false, error: resolved.error || 'Article not found' }, 404);
  }
  if (c.req.query('format') === 'json') {
    return c.json({ ok: true, url: resolved.url, article: resolved.article });
  }
  return c.redirect(resolved.url, 302);
});

// Cloudflare R2 Media Stream & Download Routes (strictly isolated to MEDIA bucket; never exposes RELEASES backups)
async function getR2AssetFromEnv(env: any, rawKey: string, rangeHeader?: string | null) {
  let decoded = '';
  try { decoded = decodeURIComponent(rawKey); } catch { return null; }
  const key = decoded.replace(/^\/+/, '');
  if (!key || key.includes('..') || key.includes('\\') || /^(backups|versions|versions-beta)\//i.test(key) || /\.(sql|db|sqlite|env)$/i.test(key)) {
    return null;
  }
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

  // Strictly serve public media from MEDIA bucket only (never RELEASES bucket where D1 SQL backups live)
  const bucket = env.MEDIA;
  if (!bucket) return null;
  for (const candidate of candidates) {
    const obj = parsedRange
      ? await bucket.get(candidate, { range: parsedRange }).catch(() => null)
      : await bucket.get(candidate).catch(() => null);
    if (obj) {
      return { obj, key: candidate, hasRange: Boolean(parsedRange), rangeStart, hasEnd, requestedEnd };
    }
  }
  return null;
}

app.get('/api/r2/assets', async (c) => {
  const rawPrefix = String(c.req.query('prefix') || 'Safetylink/').replace(/^\/+/, '');
  if (rawPrefix.includes('..') || /^(backups|versions|versions-beta)\/?/i.test(rawPrefix)) {
    return c.json({ success: false, assets: [], error: 'Invalid prefix' }, 400);
  }
  const prefix = rawPrefix;
  const bucket = c.env.MEDIA;
  if (!bucket) {
    return c.json({ success: false, assets: [], error: 'R2 media bucket binding not configured' }, 503);
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
  const filename = (key.split('/').pop() || 'download').replace(/["\\\r\n]/g, '');
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
  const isAdmin = await adminAuthorised(c.env, c.req.raw);
  const internalSecret = String(c.env.INTERNAL_API_SECRET || '').trim();
  const givenInternal = String(
    c.req.header('X-Internal-Secret') ||
    (c.req.header('Authorization') || '').replace(/^Bearer\s+/i, '')
  ).trim();
  const internalOk = Boolean(internalSecret && givenInternal && safeEq(givenInternal, internalSecret));
  if (!isAdmin && !internalOk) {
    return c.json({ error: 'Unauthorised' }, 401 as any);
  }
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
const ORG_STOP_WORDS = new Set([
  'THE', 'OF', 'AND', 'FOR', 'IN', 'AT', 'BY', 'TO', 'A', 'AN',
  'PTY', 'LTD', 'LIMITED', 'INC', 'LLC', 'CO', 'CC', 'SA', 'NPC',
]);
const ORG_RAND_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildOrgAbbrev(orgName: string): string {
  const cleaned = String(orgName || '')
    .toUpperCase()
    .replace(/&/g, ' ')
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .trim();
  const rawWords = cleaned.split(/\s+/).filter(Boolean);
  const meaningful = rawWords.filter((w) => !ORG_STOP_WORDS.has(w));
  const words = meaningful.length > 0 ? meaningful : rawWords;
  if (words.length === 0) return 'NODE';
  if (words.length >= 3) return words.slice(0, 5).map((w) => w[0]).join('');
  if (words.length === 2) {
    const [w1, w2] = words;
    if (w1.length <= 3 && w2.length >= 1) return `${w1}${w2[0]}`.slice(0, 5);
    return `${w1.slice(0, 2)}${w2.slice(0, 2)}`;
  }
  const single = words[0].replace(/[^A-Z0-9]/g, '');
  return single.length <= 4 ? single.padEnd(2, 'X') : single.slice(0, 4);
}

function generateCryptoOrgSuffix(length = 5): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ORG_RAND_ALPHABET[bytes[i] % ORG_RAND_ALPHABET.length];
  }
  return out;
}

const handleRegisterOrg = async (c: any) => {
  const body: any = await c.req.json();
  const email = body.email || body.contactEmail || body.contact_email;
  const password = body.password || body.admin_password;
  const orgName = body.orgName || body.org_name || body.name;
  const contactName = body.contactName || body.contact_name || orgName || 'Admin';

  if (!email || !password || !orgName || !contactName) return c.json({ error: 'All fields required' }, 400);
  const abbrev = buildOrgAbbrev(orgName);

  // If the client previewed a valid non-predictable SL-<ABBREV>-<RAND5> code, honour it if unused;
  // reject legacy sequential SL-ORG-001 / SL-FAM-001 hints and always generate a cryptographic random suffix.
  const requestedId = String(body.id || body.org_code || body.orgCode || '').trim().toUpperCase();
  const matchesRequested =
    requestedId.startsWith(`SL-${abbrev}-`) &&
    new RegExp(`^SL-${abbrev}-[A-HJ-NP-Z2-9]{5}$`).test(requestedId) &&
    !/^SL-(ORG|FAM)-\d{3}$/.test(requestedId);

  let orgId = '';
  if (matchesRequested) {
    const taken = await c.env.DB!.prepare('SELECT id FROM organisations WHERE id = ?').bind(requestedId).first();
    if (!taken) orgId = requestedId;
  }
  for (let attempt = 0; attempt < 8 && !orgId; attempt++) {
    const candidate = `SL-${abbrev}-${generateCryptoOrgSuffix(5)}`;
    const taken = await c.env.DB!.prepare('SELECT id FROM organisations WHERE id = ?').bind(candidate).first();
    if (!taken) orgId = candidate;
  }
  if (!orgId) {
    orgId = `SL-${abbrev}-${generateCryptoOrgSuffix(6)}`;
  }

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

  // If caller did not pass explicit contacts (e.g., native Android background trigger),
  // hydrate saved emergency contacts from D1 sl_contacts so FCM still rings all contacts.
  let resolvedContacts = [...contactNumbers];
  if (resolvedContacts.length === 0 && callerNumber && c.env.DB) {
    try {
      const variants = phoneLookupVariants(callerNumber);
      if (variants.length > 0) {
        const placeholders = variants.map(() => '?').join(', ');
        const rows: any = await c.env.DB.prepare(
          `SELECT contact_phone FROM sl_contacts WHERE owner_phone IN (${placeholders}) ORDER BY sort_order ASC LIMIT 5`
        ).bind(...variants).all().catch(() => ({ results: [] }));
        resolvedContacts = (rows?.results || []).map((r: any) => r.contact_phone).filter(Boolean);
      }
    } catch {}
  }

  const results = await fireAllAlerts(c.env, {
    callerNumber: callerNumber || '', callerName: callerName || '', lat, lng, address,
    extraContacts: resolvedContacts,
    skipVoiceTo: Array.isArray(body.skipVoiceTo) ? body.skipVoiceTo : [],
    providers: body.providers || {},
    preferFcmOnline: Boolean(body.preferFcmOnline),
    smsCooldownMinutes: typeof body.smsCooldownMinutes === 'number' ? body.smsCooldownMinutes : 5,
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
  smsgate: !!(c.env.SMSGATE_USERNAME && c.env.SMSGATE_PASSWORD),
  twilio: !!(c.env.TWILIO_SID && c.env.TWILIO_AUTH_TOKEN && c.env.TWILIO_NUMBER),
  vapi: !!(c.env.VAPI_PRIVATE_KEY && c.env.VAPI_PHONE_NUMBER_ID),
  vapiAssistant: !!c.env.VAPI_ASSISTANT_ID,
  africasTalking: !!(c.env.AT_API_KEY && c.env.AT_USERNAME),
  bland: !!(c.env.BLAND_API_KEY && c.env.BLAND_API_KEY !== 'not_provided'),
  fcm: !!(c.env as any).FCM_SERVICE_ACCOUNT,
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

// Super Admin: Restore & unify every registered customer across all D1 tables
app.post('/api/admin/restore-customers', async (c) => {
  const sessionOk = await adminAuthorised(c.env, c.req.raw);
  let jwtSuperOk = false;
  if (!sessionOk) {
    const auth = c.req.header('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      const payload = await verifyToken(c.env, auth.slice(7));
      if (payload && String(payload.orgId || '').toUpperCase() === 'SL-ADMIN-0000') {
        jwtSuperOk = true;
      }
    }
  }
  if (!sessionOk && !jwtSuperOk) return c.json({ error: 'Unauthorised' }, 401 as any);
  const restored = await adminRestoreCustomers(c.env.DB);
  return c.json(restored);
});

// Super Admin: Production Launch Health, Rain SIM Watchdog & Live Billing Telemetry
app.get('/api/admin/launch-health', async (c) => {
  const sessionOk = await adminAuthorised(c.env, c.req.raw);
  let jwtSuperOk = false;
  if (!sessionOk) {
    const auth = c.req.header('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      const payload = await verifyToken(c.env, auth.slice(7));
      if (payload && String(payload.orgId || '').toUpperCase() === 'SL-ADMIN-0000') {
        jwtSuperOk = true;
      }
    }
  }
  if (!sessionOk && !jwtSuperOk) return c.json({ error: 'Unauthorised' }, 401 as any);

  const [summary, gatewayHealth] = await Promise.all([
    c.env.DB ? adminSummary(c.env.DB).catch(() => null) : Promise.resolve(null),
    getGatewayHealth(c.env).catch(() => ({ json: { ok: false, gateways: [] }, status: 200 })),
  ]);

  let activeSubscribers = 0;
  let totalOrgs = 0;
  if (c.env.DB) {
    try {
      const subRow: any = await c.env.DB.prepare(
        `SELECT COUNT(*) AS n FROM users WHERE LOWER(COALESCE(status,'')) = 'active'`
      ).first();
      activeSubscribers = Number(subRow?.n ?? 0);
    } catch {}
    try {
      const orgRow: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM organisations').first();
      totalOrgs = Number(orgRow?.n ?? 0);
    } catch {}
  }

  const payfastMerchantId = String(c.env.PAYFAST_MERCHANT_ID || '').trim();
  const payfastMerchantKey = String(c.env.PAYFAST_MERCHANT_KEY || '').trim();
  const payfastSandbox = String(c.env.PAYFAST_SANDBOX || '').toLowerCase() === 'true';
  const paystackSecret = String(c.env.PAYSTACK_SECRET_KEY || '').trim();
  const paystackLive = paystackSecret.startsWith('sk_live_');

  return c.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    environment: 'cloudflare-worker',
    api: { status: 'ONLINE', dbBound: Boolean(c.env.DB) },
    rainGateway: {
      number: gatewayNumber(c.env),
      ...(gatewayHealth?.json || {}),
    },
    providers: {
      fcm: Boolean((c.env.FCM_SERVICE_ACCOUNT || '').trim()),
      smsgate: Boolean((c.env.SMSGATE_USERNAME || '').trim() && (c.env.SMSGATE_PASSWORD || '').trim()),
      twilio: Boolean((c.env.TWILIO_SID || '').trim() && (c.env.TWILIO_AUTH_TOKEN || '').trim()),
      vapi: Boolean((c.env.VAPI_PRIVATE_KEY || '').trim()),
      africasTalking: Boolean((c.env.AT_API_KEY || '').trim()),
      bland: Boolean((c.env.BLAND_API_KEY || '').trim()),
      bigDataCloud: Boolean((c.env.BIGDATACLOUD_API_KEY || '').trim()),
      freeNewsApi: Boolean((c.env.FREENEWSAPI_KEY || '').trim()),
    },
    billing: {
      payfastConfigured: Boolean(payfastMerchantId && payfastMerchantKey),
      payfastLiveMode: Boolean(payfastMerchantId && payfastMerchantKey && !payfastSandbox),
      payfastSandbox,
      paystackConfigured: Boolean(paystackSecret),
      paystackLiveMode: paystackLive,
    },
    metrics: {
      totalAccounts: summary?.totalAccounts ?? 0,
      activeSubscribers,
      totalOrgs,
      activeLast24Hours: summary?.activeLast24Hours ?? 0,
      devicesRegistered: summary?.devicesRegistered ?? 0,
      panicsLast30Days: summary?.panicsLast30Days ?? 0,
    },
  });
});

// IoT Hardware Panic Webhook (NB-IoT Buttons, Hikvision AX PRO Hubs, 4G GPS Smartwatches)
app.post('/api/webhook/iot-panic', async (c) => {
  const configuredSecret = String(c.env.IOT_WEBHOOK_SECRET || c.env.PCM_WEBHOOK_TOKEN || '').trim();
  if (!configuredSecret) {
    return c.json({ error: 'IoT webhook authentication is not configured on this server' }, 503 as any);
  }
  const provided = String(
    c.req.header('X-IoT-Token')
    || c.req.header('X-Webhook-Secret')
    || c.req.query('token')
    || ''
  ).trim();
  if (!provided || !safeEq(provided, configuredSecret)) {
    return c.json({ error: 'Unauthorized IoT webhook token' }, 401 as any);
  }

  const body: any = await c.req.json().catch(() => ({}));
  const deviceId = String(body.deviceId || body.imei || body.hubId || body.serial || '').trim();
  const deviceType = String(body.deviceType || body.hardware || (body.zone ? 'HIKVISION_AX_PRO' : body.imei ? '4G_GPS_WATCH' : 'NB_IOT_BUTTON')).toUpperCase();
  const ownerPhone = String(body.phone || body.ownerPhone || body.msisdn || '').trim();
  const orgId = String(body.orgId || body.orgCode || 'INDIVIDUAL').trim();
  const lat = Number.isFinite(Number(body.lat ?? body.latitude)) ? Number(body.lat ?? body.latitude) : null;
  const lng = Number.isFinite(Number(body.lng ?? body.longitude)) ? Number(body.lng ?? body.longitude) : null;
  const battery = body.battery !== undefined ? Number(body.battery) : null;
  const zone = String(body.zone || body.eventType || 'SOS_TRIGGER').trim();

  if (!deviceId && !ownerPhone) {
    return c.json({ error: 'deviceId/imei or ownerPhone is required' }, 400 as any);
  }

  const incidentId = `IOT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = Date.now();
  let fcmTriggered = 0;

  if (c.env.DB) {
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO incidents (id, org_id, user_id, type, lat, lng, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(
      incidentId,
      orgId,
      deviceId || ownerPhone,
      `${deviceType}:${zone}`,
      lat,
      lng,
      now
    ).run().catch(() => {});

    // Look up emergency contacts for ownerPhone and trigger loud FCM alarm
    if (ownerPhone && c.env.FCM_SERVICE_ACCOUNT) {
      const variants = phoneLookupVariants(ownerPhone);
      const contactPhones = new Set<string>();
      for (const v of variants) {
        const res: any = await c.env.DB.prepare(
          'SELECT contact_phone FROM sl_contacts WHERE owner_phone = ?'
        ).bind(v).all().catch(() => ({ results: [] }));
        for (const r of (res?.results ?? []) as any[]) {
          if (r.contact_phone) contactPhones.add(String(r.contact_phone));
        }
      }
      for (const target of contactPhones) {
        const toks = await tokensForPhone(c.env.DB, target).catch(() => []);
        for (const tok of toks) {
          const alarmTitle = '🚨 EMERGENCY: Hardware SOS Alert';
          const alarmBody = `Hardware SOS Triggered (${deviceType} · ${zone})${battery !== null ? ` · Battery ${battery}%` : ''}`;
          const sent = await sendLoudAlarm(c.env.FCM_SERVICE_ACCOUNT, tok, alarmTitle, alarmBody, {
            incidentId,
            callerName: `${deviceType} (${deviceId || ownerPhone})`,
            callerNumber: ownerPhone,
            location: lat !== null && lng !== null ? `https://maps.google.com/?q=${lat},${lng}` : 'Hardware Panic Trigger',
            triggerSource: 'IOT_HARDWARE',
            ...(lat !== null ? { lat: String(lat) } : {}),
            ...(lng !== null ? { lng: String(lng) } : {}),
          }).catch(() => ({ ok: false, unregistered: false } as any));
          if (sent?.ok) fcmTriggered++;
          if (sent?.unregistered) await pruneDeviceToken(c.env.DB, tok).catch(() => {});
        }
      }
    }
  }

  return c.json({
    ok: true,
    incidentId,
    deviceId: deviceId || ownerPhone,
    deviceType,
    zone,
    coordinates: lat !== null && lng !== null ? { lat, lng } : null,
    fcmTriggered,
    receivedAt: new Date(now).toISOString(),
  }, 201 as any);
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
const hexHmacSha512 = async (secret: string, data: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
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

  // Support native SMSGate (sms-gate.app) webhook events cleanly without retry loops
  const webhookEvent = String(body.event || '').trim().toLowerCase();
  if (webhookEvent === 'system:ping') {
    const hb = await recordGatewayHeartbeat(c.env, {
      gatewayId: String(body.deviceId || body.payload?.deviceId || 'smsgate-1'),
      battery: body.payload?.battery ?? body.battery,
      network: body.payload?.network ?? body.network,
    }).catch(() => ({ json: { ok: true }, status: 200 }));
    return c.json({ ok: true, event: 'system:ping', heartbeat: hb.json }, 200);
  }
  if (webhookEvent && webhookEvent.startsWith('sms:') && webhookEvent !== 'sms:received') {
    return c.json({ ok: true, alerted: false, ignoredEvent: webhookEvent }, 200);
  }

  const nested = body && typeof body.payload === 'object' && body.payload ? body.payload : {};

  const rawText = String(
    body.rawMessage ||
    body.pcmText ||
    body.message ||
    body.text ||
    body.msg ||
    body.body ||
    body.content ||
    body.sms_body ||
    body.sms ||
    nested.message ||
    nested.text ||
    nested.body ||
    ''
  ).trim();

  const gatewaySender = String(
    body.callerMsisdn ||
    body.sender ||
    body.from ||
    body.phone ||
    body.phoneNumber ||
    body.address ||
    body.number ||
    body.sms_from ||
    body.originatingAddress ||
    body.from_number ||
    nested.phoneNumber ||
    nested.sender ||
    nested.from ||
    nested.phone ||
    ''
  ).trim();

  const extractedPhone = body.callerMsisdn
    ? normalizePhone(String(body.callerMsisdn))
    : extractMsisdn(rawText, gatewaySender);

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
  const idxObj: any = await (c.env as any).RELEASES?.get('versions/index.json').catch(() => null);
  const list = idxObj ? await idxObj.json().catch(() => []) : [];
  const latestVer = Array.isArray(list) && list[0]?.version ? String(list[0].version) : '1.1.1211';
  return c.json({
    minSupportedVersion: row?.value || '1.0.0',
    latestVersion: latestVer,
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
  const authedUserId = String(c.get('userId') || '').trim();
  const isSuper = String(c.get('orgId') || '').toUpperCase() === 'SL-ADMIN-0000';
  const targetUserId = isSuper ? (body.userId || authedUserId || reqId) : (authedUserId || reqId);
  await c.env.DB?.prepare(
    `INSERT INTO org_join_requests (id, org_id, user_id, username, full_name, phone, email, requested_role, status, created_at) VALUES (?,?,?,?,?,?,?,?,'PENDING',?)`
  ).bind(reqId, orgId, targetUserId, body.username || '', body.fullName || '', body.phone || '', body.email || c.get('email') || '', body.requestedRole || 'Community Member', Date.now()).run();
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

app.post('/api/org/:orgId/members/:userId/status', authMiddleware, async (c) => {
  const { orgId, userId } = c.req.param();
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  const body: any = await c.req.json().catch(() => ({}));
  const action = String(body.action || 'ACTIVATE').toUpperCase();
  const nextStatus = action === 'SUSPEND' ? 'suspended' : action === 'DEACTIVATE' ? 'deactivated' : 'active';
  await c.env.DB?.prepare('UPDATE users SET status=? WHERE id=? AND UPPER(org_id)=UPPER(?)').bind(nextStatus, userId, orgId).run();
  await c.env.DB?.prepare('INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), orgId.toUpperCase(), `ORG_MEMBER_${action}`, userId, body.reason || '', Date.now()).run().catch(() => {});
  return c.json({ ok: true, userId, status: nextStatus });
});

app.delete('/api/org/:orgId/members/:userId', authMiddleware, async (c) => {
  const { orgId, userId } = c.req.param();
  if (!isOrgAuthorized(c, orgId)) return c.json({ error: 'Forbidden' }, 403);
  await c.env.DB?.prepare('UPDATE users SET org_id=NULL WHERE id=? AND UPPER(org_id)=UPPER(?)').bind(userId, orgId).run();
  await c.env.DB?.prepare("UPDATE org_join_requests SET status='DISCONNECTED' WHERE user_id=? AND UPPER(org_id)=UPPER(?)").bind(userId, orgId).run().catch(() => {});
  await c.env.DB?.prepare('INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), orgId.toUpperCase(), 'ORG_MEMBER_DISCONNECTED', userId, 'Member disconnected by Organization Admin', Date.now()).run().catch(() => {});
  return c.json({ ok: true, userId, disconnected: true });
});

app.post('/api/user/org/disconnect', authMiddleware, async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const authedUserId = String(c.get('userId') || '').trim();
  const isSuper = String(c.get('orgId') || '').toUpperCase() === 'SL-ADMIN-0000';
  const requestedUserId = String(body.userId || '').trim();
  const userId = isSuper ? (requestedUserId || authedUserId) : authedUserId;
  const email = String(c.get('email') || '').trim();
  if (!userId && !email) return c.json({ error: 'User identity required' }, 400);
  if (userId) {
    await c.env.DB?.prepare('UPDATE users SET org_id=NULL WHERE id=?').bind(userId).run();
  } else {
    await c.env.DB?.prepare('UPDATE users SET org_id=NULL WHERE LOWER(email)=LOWER(?)').bind(email).run();
  }
  return c.json({ ok: true, disconnected: true });
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
  const userId = String(incoming.custom_str2 || '').trim();
  const buyerEmail = String(incoming.email_address || '').trim().toLowerCase();
  if (paymentStatus === 'COMPLETE' && c.env.DB) {
    // Activate individual consumer subscription by userId or buyer email
    if (userId) {
      await c.env.DB.prepare(
        `UPDATE users SET status = 'active' WHERE id = ?`
      ).bind(userId).run().catch(() => {});
    } else if (buyerEmail) {
      await c.env.DB.prepare(
        `UPDATE users SET status = 'active' WHERE LOWER(email) = ?`
      ).bind(buyerEmail).run().catch(() => {});
    }
    const targetRef = userId || orgId || buyerEmail || incoming.m_payment_id || 'CONSUMER';
    await c.env.DB.prepare(
      'INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(
      crypto.randomUUID(),
      'PAYFAST_ITN',
      'PAYMENT_COMPLETE',
      targetRef,
      JSON.stringify({
        pf_payment_id: incoming.pf_payment_id,
        m_payment_id: incoming.m_payment_id,
        amount_gross: incoming.amount_gross,
        orgId: orgId || undefined,
        userId: userId || undefined,
        email: buyerEmail || undefined,
      }),
      Date.now()
    ).run().catch(() => {});
  }
  return c.json({ ok: true, payment_status: paymentStatus });
});

// ── PAYSTACK CHECKOUT INITIALIZE, VERIFY & SIGNED WEBHOOK ─────────────────────
app.post('/api/paystack/initialize', async (c) => {
  const secretKey = String(c.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!secretKey) {
    return c.json({ error: 'Paystack credentials are not configured on this server.' }, 503 as any);
  }
  const body = (await c.req.json().catch(() => ({}))) as any;
  const email = String(body.email || '').trim();
  const amount = Math.round(Number(body.amount || 0));
  const planId = String(body.planId || 'individual_premium').trim().slice(0, 64);
  if (!email || !email.includes('@') || !Number.isFinite(amount) || amount < 100) {
    return c.json({ error: 'Valid email and amount (in cents) are required.' }, 400 as any);
  }
  const reference = `SL-${planId.toUpperCase()}-${Date.now()}`;
  const resp = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      currency: 'ZAR',
      reference,
      callback_url: 'https://safetylink.online/#/payment-success',
      metadata: {
        planId,
        userId: String(body.userId || body.metadata?.userId || '').trim().slice(0, 64),
        orgId: String(body.orgId || body.metadata?.orgId || '').trim().slice(0, 64),
        planName: String(body.metadata?.planName || planId).slice(0, 80),
      },
    }),
  });
  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.status) {
    return c.json({ error: data?.message || 'Paystack initialization failed.' }, 502 as any);
  }
  return c.json({ status: true, data: data.data });
});

app.get('/api/paystack/verify/:reference', async (c) => {
  const secretKey = String(c.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!secretKey) return c.json({ error: 'Paystack not configured' }, 503 as any);
  const reference = String(c.req.param('reference') || '').trim();
  if (!reference || !/^[A-Za-z0-9._-]{4,100}$/.test(reference)) {
    return c.json({ error: 'Invalid payment reference' }, 400 as any);
  }
  const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data: any = await resp.json().catch(() => ({}));
  const tx = data?.data;
  const paid = resp.ok && data?.status === true && String(tx?.status || '').toLowerCase() === 'success';
  if (paid && c.env.DB) {
    const userId = String(tx?.metadata?.userId || '').trim();
    const email = String(tx?.customer?.email || '').trim().toLowerCase();
    if (userId) {
      await c.env.DB.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).bind(userId).run().catch(() => {});
    } else if (email) {
      await c.env.DB.prepare(`UPDATE users SET status = 'active' WHERE LOWER(email) = ?`).bind(email).run().catch(() => {});
    }
  }
  return c.json({
    ok: paid,
    status: tx?.status || 'unknown',
    reference,
    amount: tx?.amount ?? 0,
    currency: tx?.currency || 'ZAR',
  });
});

app.post('/api/paystack/webhook', async (c) => {
  const secretKey = String(c.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!secretKey) return c.json({ error: 'Paystack not configured' }, 503 as any);
  const raw = await c.req.text();
  const givenSig = String(c.req.header('x-paystack-signature') || '').trim().toLowerCase();
  if (!givenSig) return c.json({ error: 'Missing Paystack signature' }, 401 as any);
  const expectedSig = await hexHmacSha512(secretKey, raw);
  if (!safeEq(givenSig, expectedSig)) {
    return c.json({ error: 'Invalid Paystack signature' }, 401 as any);
  }
  let payload: any = {};
  try { payload = JSON.parse(raw); } catch { return c.json({ error: 'Invalid JSON' }, 400 as any); }
  const event = String(payload?.event || '');
  const tx = payload?.data || {};
  if (event === 'charge.success' && String(tx?.status || '').toLowerCase() === 'success' && c.env.DB) {
    const userId = String(tx?.metadata?.userId || '').trim();
    const orgId = String(tx?.metadata?.orgId || '').trim();
    const email = String(tx?.customer?.email || '').trim().toLowerCase();
    if (userId) {
      await c.env.DB.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).bind(userId).run().catch(() => {});
    } else if (email) {
      await c.env.DB.prepare(`UPDATE users SET status = 'active' WHERE LOWER(email) = ?`).bind(email).run().catch(() => {});
    }
    await c.env.DB.prepare(
      'INSERT INTO audit_logs (id, actor, action, target_id, details, created_at) VALUES (?,?,?,?,?,?)'
    ).bind(
      crypto.randomUUID(),
      'PAYSTACK_WEBHOOK',
      'PAYMENT_COMPLETE',
      userId || orgId || email || String(tx?.reference || 'CONSUMER'),
      JSON.stringify({
        reference: tx?.reference,
        amount: tx?.amount,
        currency: tx?.currency || 'ZAR',
        planId: tx?.metadata?.planId,
        email: email || undefined,
      }),
      Date.now()
    ).run().catch(() => {});
  }
  return c.json({ ok: true, event });
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

// ── GEMINI AI PROXY (FOR APK & PRODUCTION WEB) ────────────────────────────────
const wrapPcm16ToWavBase64 = (base64Pcm: string, sampleRate = 24000): string => {
  const binary = atob(base64Pcm);
  const pcmLen = binary.length;
  if (pcmLen >= 4 && binary.slice(0, 4) === 'RIFF') return base64Pcm;
  const wav = new Uint8Array(44 + pcmLen);
  const view = new DataView(wav.buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) wav[off + i] = s.charCodeAt(i);
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, pcmLen, true);
  for (let i = 0; i < pcmLen; i++) wav[44 + i] = binary.charCodeAt(i);
  let out = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < wav.length; i += chunkSize) {
    out += String.fromCharCode(...wav.subarray(i, i + chunkSize));
  }
  return btoa(out);
};

const sanitizeWorkerChatContents = (history: unknown, message: string) => {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-20)) {
      if (!h || typeof (h as any).text !== 'string') continue;
      const text = (h as any).text.trim();
      if (!text) continue;
      const role: 'user' | 'model' = (h as any).role === 'model' || (h as any).sender === 'bot' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') continue;
      const prev = contents[contents.length - 1];
      if (prev && prev.role === role) prev.parts[0].text += `\n${text}`;
      else contents.push({ role, parts: [{ text }] });
    }
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents.pop();
  }
  contents.push({ role: 'user', parts: [{ text: message.trim() }] });
  return contents;
};

app.post('/api/gemini/chat', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: 'Gemini AI key not configured on worker' }, 503 as any);
  const body = await c.req.json<any>().catch(() => ({}));
  const message = String(body?.message || '').trim();
  if (!message) return c.json({ error: 'message is required' }, 400 as any);

  const allowedModels: Record<string, string> = {
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    // Backward-compatible aliases from earlier APK/web builds
    'gemini-3.1-flash-lite': 'gemini-2.5-flash',
    'gemini-4-hydrogen': 'gemini-2.5-flash',
  };
  const model = allowedModels[String(body?.model || '')] || 'gemini-2.5-flash';
  const sysText =
    body?.systemInstruction ||
    "You are Kleva (Lizzy), SafetyLink's calm, reassuring Post-Emergency Care Companion. Check if the user is physically safe, keep responses concise and practical, and share emergency numbers (10111 SAPS, 112 Emergency, 10177 Ambulance) when needed.";
  const fullSystem = body?.incidentContext ? `${sysText}\n\nRecent Incident Context:\n${body.incidentContext}` : sysText;

  const reqPayload: any = {
    system_instruction: { parts: [{ text: fullSystem }] },
    contents: sanitizeWorkerChatContents(body?.history, message),
  };

  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'SafetyLink-Worker/1.0' },
      body: JSON.stringify(reqPayload),
    }
  );
  const data: any = await gRes.json().catch(() => ({}));
  if (!gRes.ok) {
    return c.json({ error: data?.error?.message || `Gemini error (${gRes.status})` }, gRes.status as any);
  }
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p?.text || '')
    .join('')
    .trim();
  return c.json({ text, chunks: data?.candidates?.[0]?.groundingMetadata?.groundingChunks || [], model });
});

app.post('/api/gemini/tts', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: 'Gemini AI key not configured on worker' }, 503 as any);
  const body = await c.req.json<any>().catch(() => ({}));
  const text = String(body?.text || '').trim();
  if (!text) return c.json({ error: 'text is required' }, 400 as any);

  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'SafetyLink-Worker/1.0' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: text.slice(0, 1000) }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: body?.voiceName || 'Kore' } },
          },
        },
      }),
    }
  );
  const data: any = await gRes.json().catch(() => ({}));
  if (!gRes.ok) {
    return c.json({ error: data?.error?.message || `Gemini TTS error (${gRes.status})` }, gRes.status as any);
  }
  const inlineData = (data?.candidates?.[0]?.content?.parts || []).find((p: any) => p?.inlineData)?.inlineData;
  if (!inlineData?.data) return c.json({ error: 'No audio returned by TTS model' }, 502 as any);
  const rawMime = String(inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000');
  const rateMatch = rawMime.match(/rate=(\d+)/i);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const audioBase64 = /pcm|l16|raw/i.test(rawMime)
    ? wrapPcm16ToWavBase64(inlineData.data, sampleRate)
    : inlineData.data;
  return c.json({ audioBase64, mimeType: 'audio/wav' });
});

app.post('/api/gemini/transcribe', async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: 'Gemini AI key not configured on worker' }, 503 as any);
  const body = await c.req.json<any>().catch(() => ({}));
  if (!body?.audioBase64) return c.json({ error: 'audioBase64 is required' }, 400 as any);

  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'SafetyLink-Worker/1.0' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this spoken audio accurately in English or the spoken language. Return plain transcript text only.' },
              { inlineData: { data: body.audioBase64, mimeType: body.mimeType || 'audio/webm' } },
            ],
          },
        ],
      }),
    }
  );
  const data: any = await gRes.json().catch(() => ({}));
  if (!gRes.ok) {
    return c.json({ error: data?.error?.message || `Gemini transcribe error (${gRes.status})` }, gRes.status as any);
  }
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p: any) => p?.text || '')
    .join('')
    .trim();
  return c.json({ text });
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
