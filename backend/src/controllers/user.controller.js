import pool from '../config/db.js';
import { sendPushToUser } from '../services/fcm.service.js';

export async function listUsers(req, res) {
  const orgId = req.user.role === 'platform_owner' ? (req.query.org || req.orgId) : req.orgId;
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.role, u.status, u.created_at,
              p.display_name, p.primary_phone, p.photo_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.organization_id = $1
       ORDER BY u.created_at DESC`,
      [orgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function approveUser(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id, email, role, status`,
      [id, req.orgId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    await sendPushToUser(id, {
      title: '✅ Access Granted',
      body:  'Your Safety-Link account has been approved. Welcome!',
    }, { screen: 'screen-dashboard' }).catch(() => {});

    await pool.query(
      'INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id) VALUES ($1,$2,$3,$4,$5)',
      [req.orgId, req.user.id, 'user_approved', 'user', id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  const allowed  = ['member', 'responder', 'operator', 'supervisor', 'org_admin', 'org_owner'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING id, email, role',
      [role, req.params.id, req.orgId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function suspendUser(req, res) {
  try {
    await pool.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3',
      [req.body.status || 'suspended', req.params.id, req.orgId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getPendingUsers(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.role, u.created_at, p.display_name, p.primary_phone
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.organization_id = $1 AND u.status = 'pending'
       ORDER BY u.created_at ASC`,
      [req.orgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
