import { verifyToken } from '../services/jwt.service.js';
import pool from '../db/index.js';

export async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload    = verifyToken(token);
    const { rows }   = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND token = $2 AND active = TRUE',
      [payload.userId, token]
    );
    req.user = rows[0] || null;
    if (req.user) {
      await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [req.user.id]);
    }
  } catch {
    req.user = null;
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Role '${req.user.role}' is not permitted. Required: ${roles.join(' | ')}` });
    }
    next();
  };
}

export function requireOrgMatch(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const orgParam = req.params.orgCode || req.query.org;
  if (orgParam && orgParam !== req.user.org_code && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }
  next();
}
