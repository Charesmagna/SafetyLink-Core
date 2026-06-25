import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.middleware.js';
import { generateUniqueOrgCode } from '../services/org-code.service.js';
import { sendPushToUser } from '../services/fcm.service.js';

export async function register(req, res) {
  const { email, password, display_name, org_code, role } = req.body;
  try {
    const orgRes = await pool.query(
      'SELECT id, status FROM organizations WHERE organization_code = $1',
      [org_code.toUpperCase().trim()]
    );
    if (!orgRes.rows[0]) return res.status(404).json({ error: 'Organisation not found. Check your org code.' });
    if (orgRes.rows[0].status !== 'active') return res.status(403).json({ error: 'Organisation is suspended.' });

    const orgId = orgRes.rows[0].id;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const safeRole     = ['member', 'responder'].includes(role) ? role : 'member';

    const { rows } = await pool.query(
      `INSERT INTO users (organization_id, email, password_hash, role, status)
       VALUES ($1,$2,$3,$4,'pending') RETURNING id, email, role, status, organization_id, created_at`,
      [orgId, email, passwordHash, safeRole]
    );
    const user = rows[0];

    await pool.query(
      `INSERT INTO profiles (user_id, organization_id, display_name)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
      [user.id, orgId, display_name.trim()]
    );

    await pool.query(
      `INSERT INTO org_settings (organization_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [orgId]
    );

    res.status(201).json({
      message: 'Registration submitted. Awaiting admin approval.',
      user:    { id: user.id, email: user.email, status: 'pending' },
    });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT u.*, p.display_name FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status === 'pending')  return res.status(403).json({ error: 'Account pending approval' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
    if (user.status === 'deleted')  return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccessToken(user.id, user.organization_id, user.role);
    const refreshToken = signRefreshToken(user.id);
    const rtHash       = await bcrypt.hash(refreshToken, 8);
    await pool.query('UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2', [rtHash, user.id]);

    await pool.query(
      `INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id)
       VALUES ($1,$2,'user_login','user',$2)`,
      [user.organization_id, user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:             user.id,
        email:          user.email,
        display_name:   user.display_name,
        role:           user.role,
        status:         user.status,
        organization_id: user.organization_id,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload  = verifyRefreshToken(refreshToken);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId]);
    const user     = rows[0];
    if (!user || !user.refresh_token) return res.status(401).json({ error: 'Invalid refresh token' });

    const valid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!valid) return res.status(401).json({ error: 'Invalid refresh token' });

    const newAccess  = signAccessToken(user.id, user.organization_id, user.role);
    const newRefresh = signRefreshToken(user.id);
    const rtHash     = await bcrypt.hash(newRefresh, 8);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [rtHash, user.id]);

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function logout(req, res) {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req, res) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.role, u.status, u.organization_id, u.created_at,
            p.display_name, p.bio, p.photo_url, p.primary_phone,
            o.organization_name, o.organization_code
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1`,
    [req.user.id]
  );
  res.json(rows[0] || {});
}

export async function updateFcmToken(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    await pool.query(
      `INSERT INTO notification_tokens (user_id, organization_id, token, platform, updated_at)
       VALUES ($1,$2,$3,'android',NOW())
       ON CONFLICT (user_id, platform) DO UPDATE SET token = EXCLUDED.token, updated_at = NOW()`,
      [req.user.id, req.user.organization_id, token]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
