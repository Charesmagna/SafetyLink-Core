import { Router } from 'express';
import { body }   from 'express-validator';
import pool       from '../db/index.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate }    from '../middleware/validate.middleware.js';

const router = Router();

/* ── POST /api/devices  — register / heartbeat ── */
router.post('/',
  requireAuth,
  [
    body('device_id').trim().notEmpty(),
    body('platform').optional().trim(),
    body('os_version').optional().trim(),
    body('app_version').optional().trim(),
    body('push_token').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { device_id, platform, os_version, app_version, push_token } = req.body;
    const orgCode = req.user.org_code;
    try {
      const { rows } = await pool.query(
        `INSERT INTO devices (org_code, device_id, name, platform, os_version, app_version, push_token, last_seen)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (device_id) DO UPDATE SET
           last_seen   = NOW(),
           platform    = EXCLUDED.platform,
           os_version  = EXCLUDED.os_version,
           app_version = EXCLUDED.app_version,
           push_token  = COALESCE(EXCLUDED.push_token, devices.push_token)
         RETURNING *`,
        [orgCode, device_id, req.user.name, platform || null, os_version || null, app_version || null, push_token || null]
      );
      res.json(rows[0]);
    } catch (err) {
      console.error('[devices/register]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ── GET /api/devices ── */
router.get('/', requireAuth, async (req, res) => {
  const orgCode = req.user.org_code;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM devices WHERE org_code = $1 ORDER BY last_seen DESC',
      [orgCode]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── DELETE /api/devices/:id ── */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM devices WHERE id = $1 AND org_code = $2',
      [req.params.id, req.user.org_code]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
