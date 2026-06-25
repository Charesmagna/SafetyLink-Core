import { Router } from 'express';
import pool       from '../db/index.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/* ── GET /api/responders  — active incidents feed for responders ── */
router.get('/', requireAuth, async (req, res) => {
  const orgCode = req.user.org_code;
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS responders,
              COALESCE(json_agg(ae.event_type ORDER BY ae.created_at) FILTER (WHERE ae.id IS NOT NULL), '[]') AS events
       FROM alerts a
       LEFT JOIN responders   r  ON r.alert_id  = a.id
       LEFT JOIN alert_events ae ON ae.alert_id = a.id
       WHERE a.org_code = $1 AND a.status = 'active'
       GROUP BY a.id
       ORDER BY a.tier DESC, a.created_at DESC`,
      [orgCode]
    );
    res.json(rows);
  } catch (err) {
    console.error('[responders/feed]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── GET /api/responders/me  — my accepted incidents ── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, r.accepted_at
       FROM alerts a
       JOIN responders r ON r.alert_id = a.id
       WHERE r.responder_phone = $1 AND a.status = 'active'
       ORDER BY r.accepted_at DESC`,
      [req.user.phone]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
