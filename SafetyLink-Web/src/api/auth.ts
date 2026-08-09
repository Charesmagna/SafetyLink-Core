import { sign, verify } from 'hono/jwt';

const JWT_SECRET = 'safetylink-super-secret-key-2026-xyz';

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createToken(orgId: number, orgCode: string): Promise<string> {
  const payload = {
    orgId,
    orgCode,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours expiration
  };
  return await sign(payload, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ orgId: number; orgCode: string } | null> {
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    if (!payload) return null;
    return payload as { orgId: number; orgCode: string };
  } catch {
    return null;
  }
}
