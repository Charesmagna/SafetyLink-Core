import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import pool from '../config/db.js';

export async function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload    = jwt.verify(token, ENV.JWT_SECRET);
    const { rows }   = await pool.query(
      `SELECT u.*, p.display_name, p.primary_phone, p.photo_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.status != 'deleted'`,
      [payload.userId]
    );
    req.user = rows[0] || null;
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function signAccessToken(userId, orgId, role) {
  return jwt.sign({ userId, orgId, role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_ACCESS_TTL });
}

export function signRefreshToken(userId) {
  return jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_TTL });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
}
