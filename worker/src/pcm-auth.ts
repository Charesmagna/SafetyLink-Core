// Verifies an SMS Forwarder request. The signature is HMAC-SHA256 over the exact raw body bytes,
// sent as hex in X-Signature (an optional "sha256=" prefix is accepted). Secrets are trimmed once here.
export const enc = new TextEncoder();

export async function hexHmac(secret: string, raw: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function parseSignature(header: string | null | undefined): string {
  return String(header || '').trim().replace(/^sha256=/i, '').trim().toLowerCase();
}

/** True only when the signature matches the raw body under one of the configured secrets. */
export async function verifyForwarderSignature(raw: string, header: string | null | undefined, secrets: (string | undefined)[]): Promise<boolean> {
  const given = parseSignature(header);
  if (!given || !/^[0-9a-f]{64}$/.test(given)) return false;
  for (const s of secrets.map(x => (x || '').trim()).filter(Boolean)) {
    if (safeEq(given, await hexHmac(s, raw))) return true;
  }
  return false;
}

/** Duplicate window for the same caller's alert, in milliseconds. */
export const DEDUPE_WINDOW_MS = 90_000;
