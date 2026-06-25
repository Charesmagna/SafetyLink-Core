import { Router }           from 'express';
import { body, query }      from 'express-validator';
import pool                 from '../db/index.js';
import { broadcastAlert }   from '../socket.js';
import { sendBulkSMS }      from '../services/sms.service.js';
import { sendWhatsAppText } from '../services/whatsapp.service.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { panicLimiter }     from '../middleware/ratelimit.middleware.js';
import { validate }         from '../middleware/validate.middleware.js';

const router = Router();

/* ──────────────────────────────────────
   POST /api/alerts  — create alert (panic)
────────────────────────────────────── */
router.post('/',
  panicLimiter,
  [
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('isDrill').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    const { isDrill, latitude, longitude, source } = req.body;
    const user    = req.user;
    const orgCode = user?.org_code || (req.body.org || 'DEFAULT').toUpperCase();

    try {
      const { rows } = await pool.query(
        `INSERT INTO alerts
           (org_code, operator_phone, operator_name, latitude, longitude, is_drill, status, tier, source)
         VALUES ($1,$2,$3,$4,$5,$6,'active',1,$7)
         RETURNING *`,
        [orgCode, user?.phone || null, user?.name || null,
         latitude || null, longitude || null, !!isDrill, source || 'UI']
      );
      const alert = rows[0];

      await pool.query(
        'INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)',
        [alert.id, isDrill ? 'drill_fired' : 'panic_fired', JSON.stringify({ lat: latitude, lon: longitude })]
      );

      await pool.query(
        'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
        [orgCode, user?.phone || null, 'alert_created', `${isDrill ? 'DRILL' : 'LIVE'} #${alert.id} from ${source || 'UI'}`]
      );

      if (latitude && longitude) {
        await pool.query(
          `INSERT INTO location_history (org_code, operator_phone, alert_id, latitude, longitude)
           VALUES ($1,$2,$3,$4,$5)`,
          [orgCode, user?.phone || null, alert.id, latitude, longitude]
        );
      }

      broadcastAlert(orgCode, 'new_alert', alert);

      if (!isDrill) {
        const { rows: contacts } = await pool.query(
          'SELECT * FROM users WHERE org_code = $1 AND role IN ($2,$3) AND active = TRUE',
          [orgCode, 'responder', 'supervisor']
        );
        const phones = contacts.map(c => c.phone).filter(Boolean);

        const locationStr = (latitude && longitude)
          ? `https://maps.google.com/?q=${latitude},${longitude}`
          : 'Location unavailable';

        const smsText = `🚨 SAFETY-LINK ALERT #${alert.id}\nOperator: ${user?.name || 'Unknown'}\nOrg: ${orgCode}\n${locationStr}\nReply to acknowledge.`;

        if (phones.length && process.env.SMS_ENABLED === 'true') {
          await sendBulkSMS({ numbers: phones, message: smsText, orgCode, alertId: alert.id });
        }

        const waDispatch = process.env.WHATSAPP_DISPATCH_NUMBER;
        if (waDispatch && process.env.WHATSAPP_ENABLED === 'true') {
          await sendWhatsAppText({ to: waDispatch, message: smsText, orgCode, alertId: alert.id });
        }
      }

      res.status(201).json(alert);
    } catch (err) {
      console.error('[alerts/create]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ──────────────────────────────────────
   GET /api/alerts
────────────────────────────────────── */
router.get('/', requireAuth, async (req, res) => {
  const orgCode  = req.user.role === 'admin' ? (req.query.org || req.user.org_code) : req.user.org_code;
  const status   = req.query.status;
  const limit    = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset   = parseInt(req.query.offset) || 0;

  try {
    const conditions = ['a.org_code = $1'];
    const params     = [orgCode];
    let   idx        = 2;

    if (status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.join(' AND ');
    const { rows } = await pool.query(
      `SELECT a.*,
              COALESCE(json_agg(ae.event_type ORDER BY ae.created_at) FILTER (WHERE ae.id IS NOT NULL), '[]') AS events,
              COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS responders
       FROM alerts a
       LEFT JOIN alert_events ae ON ae.alert_id = a.id
       LEFT JOIN responders   r  ON r.alert_id  = a.id
       WHERE ${where}
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('[alerts/list]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   GET /api/alerts/all  — admin cross-tenant
────────────────────────────────────── */
router.get('/all', requireAuth, requireRole('admin'), async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 200, 1000);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM alerts ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   GET /api/alerts/:id
────────────────────────────────────── */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              COALESCE(json_agg(ae.* ORDER BY ae.created_at) FILTER (WHERE ae.id IS NOT NULL), '[]') AS events,
              COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS responders
       FROM alerts a
       LEFT JOIN alert_events ae ON ae.alert_id = a.id
       LEFT JOIN responders   r  ON r.alert_id  = a.id
       WHERE a.id = $1 AND (a.org_code = $2 OR $3 = 'admin')
       GROUP BY a.id`,
      [req.params.id, req.user.org_code, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   POST /api/alerts/:id/accept
────────────────────────────────────── */
router.post('/:id/accept', requireAuth, async (req, res) => {
  const { id } = req.params;
  const user   = req.user;
  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM responders WHERE alert_id = $1 AND responder_phone = $2', [id, user.phone]
    );
    if (existing.length) return res.status(409).json({ error: 'Already accepted' });

    const { rows } = await pool.query(
      'INSERT INTO responders (alert_id, responder_phone, responder_name) VALUES ($1,$2,$3) RETURNING *',
      [id, user.phone, user.name]
    );
    await pool.query(
      'INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)',
      [id, 'responder_accepted', JSON.stringify({ phone: user.phone, name: user.name })]
    );
    await pool.query('UPDATE alerts SET accepted_by = $1, updated_at = NOW() WHERE id = $2', [user.phone, id]);
    await pool.query(
      'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
      [user.org_code, user.phone, 'alert_accepted', `Alert #${id}`]
    );
    broadcastAlert(user.org_code, 'alert_accepted', { alertId: id, responder: rows[0] });
    res.json(rows[0]);
  } catch (err) {
    console.error('[alerts/accept]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   POST /api/alerts/:id/escalate
────────────────────────────────────── */
router.post('/:id/escalate', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE alerts SET tier = LEAST(tier + 1, 3), updated_at = NOW()
       WHERE id = $1 AND (org_code = $2 OR $3 = 'admin')
       RETURNING *`,
      [id, req.user.org_code, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });

    await pool.query('INSERT INTO alert_events (alert_id, event_type) VALUES ($1,$2)', [id, `escalated_tier_${rows[0].tier}`]);
    await pool.query(
      'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
      [req.user.org_code, req.user.phone, 'alert_escalated', `Alert #${id} → Tier ${rows[0].tier}`]
    );
    broadcastAlert(rows[0].org_code, 'alert_updated', rows[0]);

    if (rows[0].tier === 2 && rows[0].latitude && rows[0].longitude && process.env.SMS_ENABLED === 'true') {
      const policeNumber = process.env.POLICE_DISPATCH_NUMBER;
      if (policeNumber) {
        await sendBulkSMS({
          numbers: [policeNumber],
          message: `ESCALATED EMERGENCY Tier 2 — Org: ${rows[0].org_code} Alert #${id}. https://maps.google.com/?q=${rows[0].latitude},${rows[0].longitude}`,
          orgCode: rows[0].org_code,
          alertId: id,
        });
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[alerts/escalate]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ──────────────────────────────────────
   POST /api/alerts/:id/resolve
────────────────────────────────────── */
router.post('/:id/resolve', requireAuth, async (req, res) => {
  const { id }         = req.params;
  const { resolution } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE alerts SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND (org_code = $2 OR $3 = 'admin')
       RETURNING *`,
      [id, req.user.org_code, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });

    await pool.query('INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)', [id, 'resolved', JSON.stringify({ resolution, by: req.user.phone })]);
    await pool.query('INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
      [req.user.org_code, req.user.phone, 'alert_resolved', `Alert #${id}: ${resolution || 'no notes'}`]);
    broadcastAlert(rows[0].org_code, 'alert_updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[alerts/resolve]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
