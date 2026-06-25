import { Router } from 'express';
import { body }   from 'express-validator';
import pool       from '../db/index.js';
import { broadcastAlert } from '../socket.js';
import { requireAuth }    from '../middleware/auth.middleware.js';
import { validate }       from '../middleware/validate.middleware.js';

const router = Router();

/* ── POST /api/location  — stream location update ── */
router.post('/',
  requireAuth,
  [
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('accuracy').optional().isFloat({ min: 0 }),
    body('altitude').optional().isFloat(),
    body('heading').optional().isFloat(),
    body('speed').optional().isFloat(),
    body('alert_id').optional().isInt(),
  ],
  validate,
  async (req, res) => {
    const { latitude, longitude, accuracy, altitude, heading, speed, alert_id } = req.body;
    const user = req.user;
    try {
      const { rows } = await pool.query(
        `INSERT INTO location_history
           (org_code, operator_phone, alert_id, latitude, longitude, accuracy, altitude, heading, speed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, recorded_at`,
        [user.org_code, user.phone, alert_id || null, latitude, longitude,
         accuracy || null, altitude || null, heading || null, speed || null]
      );

      broadcastAlert(user.org_code, 'location_update', {
        phone: user.phone, name: user.name, alert_id,
        lat: latitude, lon: longitude, accuracy, ts: rows[0].recorded_at,
      });

      res.status(201).json({ id: rows[0].id, recorded_at: rows[0].recorded_at });
    } catch (err) {
      console.error('[location/post]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ── GET /api/location  — latest positions per operator ── */
router.get('/', requireAuth, async (req, res) => {
  const alertId = req.query.alert_id;
  const orgCode = req.user.org_code;
  try {
    let rows;
    if (alertId) {
      ({ rows } = await pool.query(
        `SELECT DISTINCT ON (operator_phone)
           operator_phone, latitude, longitude, accuracy, heading, speed, recorded_at
         FROM location_history
         WHERE org_code = $1 AND alert_id = $2
         ORDER BY operator_phone, recorded_at DESC`,
        [orgCode, alertId]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT DISTINCT ON (operator_phone)
           operator_phone, latitude, longitude, accuracy, heading, speed, recorded_at
         FROM location_history
         WHERE org_code = $1 AND recorded_at > NOW() - INTERVAL '2 hours'
         ORDER BY operator_phone, recorded_at DESC`,
        [orgCode]
      ));
    }
    res.json(rows);
  } catch (err) {
    console.error('[location/get]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
