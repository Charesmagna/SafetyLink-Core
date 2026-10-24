// worker/src/admin-auth.ts
// Superadmin login on the server. Email + password are checked against a stored PBKDF2 hash.
// Success returns a signed session that expires after 8 hours. The browser keeps it in memory only.

const ITER_LIMIT = 200000;
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const b64u = (s: string) => btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const unb64u = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
const safeEq = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

async function pbkdf2(password: string, saltHex: string, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return hex(bits);
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function checkCredentials(env: any, email: string, password: string): Promise<boolean> {
  const stored = String(env.ADMIN_PASSWORD_HASH || '');
  const parts = stored.split('$'); // pbkdf2$iter$salt$hash
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iter = Math.min(Number(parts[1]) || 0, ITER_LIMIT);
  const emailOk = safeEq(String(email || '').trim().toLowerCase(), String(env.ADMIN_EMAIL || '').toLowerCase());
  const hash = await pbkdf2(String(password || ''), parts[2], iter);
  return emailOk && safeEq(hash, parts[3]);
}

export async function makeSession(env: any): Promise<string> {
  const payload = b64u(JSON.stringify({ sub: 'superadmin', exp: Date.now() + SESSION_MS }));
  return payload + '.' + (await hmac(String(env.ADMIN_SESSION_SECRET || ''), payload));
}

export async function sessionValid(env: any, token: string): Promise<boolean> {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig || !env.ADMIN_SESSION_SECRET) return false;
  if (!safeEq(sig, await hmac(String(env.ADMIN_SESSION_SECRET), payload))) return false;
  try { return JSON.parse(unb64u(payload)).exp > Date.now(); } catch { return false; }
}

// Failed attempts are counted per caller IP in D1 so guessing is slowed down.
export async function tooManyFailures(db: any, ip: string): Promise<boolean> {
  await db.prepare('CREATE TABLE IF NOT EXISTS sl_admin_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT NOT NULL, at INTEGER NOT NULL, ok INTEGER NOT NULL)').run();
  const r: any = await db.prepare('SELECT COUNT(*) AS n FROM sl_admin_attempts WHERE ip=? AND ok=0 AND at>?').bind(ip, Date.now() - LOCK_MS).first();
  return Number(r?.n || 0) >= MAX_FAILS;
}

export async function recordAttempt(db: any, ip: string, ok: boolean) {
  await db.prepare('INSERT INTO sl_admin_attempts (ip, at, ok) VALUES (?, ?, ?)').bind(ip, Date.now(), ok ? 1 : 0).run();
}
