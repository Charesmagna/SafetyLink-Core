import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'changeme-set-JWT_SECRET-in-env';
const EXPIRY  = process.env.JWT_EXPIRY  || '7d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}
