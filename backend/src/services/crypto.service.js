import crypto from 'crypto';
import { ENV } from '../config/env.js';

const KEY = Buffer.from(ENV.AES_KEY, 'utf8').slice(0, 32);
const ALGO = 'aes-256-gcm';

export function encrypt(plaintext) {
  if (!plaintext) return null;
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc    = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString('hex')}:${enc.toString('hex')}:${tag.toString('hex')}`;
}

export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const [ivHex, encHex, tagHex] = ciphertext.split(':');
    const iv       = Buffer.from(ivHex, 'hex');
    const enc      = Buffer.from(encHex, 'hex');
    const tag      = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return null;
  }
}

export function encryptJSON(obj) {
  return encrypt(JSON.stringify(obj));
}

export function decryptJSON(ciphertext) {
  const raw = decrypt(ciphertext);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
