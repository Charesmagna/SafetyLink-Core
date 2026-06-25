import { Router } from 'express';
import { body }   from 'express-validator';
import pool       from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate }  from '../middleware/validate.middleware.js';

const router = Router();

/* ── POST /api/hardware/register ── */
router.post('/register',
  requireAuth,
  requireRole('admin', 'supervisor', 'operator'),
  [
    body('device_address').trim().notEmpty().withMessage('device_address required'),
    body('friendly_name').trim().notEmpty().withMessage('friendly_name required'),
    body('service_uuid').optional().trim(),
    body('characteristic_uuid').optional().trim(),
    body('trigger_value').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { device_address, friendly_name, service_uuid, characteristic_uuid, trigger_value, assigned_to_phone } = req.body;
    const orgCode = req.user.org_code;
    try {
      const { rows } = await pool.query(
        `INSERT INTO hardware_registry
           (org_code, device_address, friendly_name, service_uuid, characteristic_uuid, trigger_value, assigned_to_phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (org_code, device_address) DO UPDATE SET
           friendly_name       = EXCLUDED.friendly_name,
           service_uuid        = EXCLUDED.service_uuid,
           characteristic_uuid = EXCLUDED.characteristic_uuid,
           trigger_value       = EXCLUDED.trigger_value,
           assigned_to_phone   = EXCLUDED.assigned_to_phone,
           updated_at          = NOW()
         RETURNING *`,
        [orgCode, device_address.toUpperCase(), friendly_name,
         service_uuid || 'FFE0', characteristic_uuid || 'FFE1',
         trigger_value || '01', assigned_to_phone || null]
      );

      await pool.query(
        'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
        [orgCode, req.user.phone, 'hardware_registered', `${friendly_name} (${device_address})`]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[hardware/register]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ── POST /api/hardware/calibrate ── */
router.post('/calibrate',
  requireAuth,
  [
    body('device_address').trim().notEmpty(),
    body('rssi_samples').isArray({ min: 1 }).withMessage('rssi_samples must be an array'),
    body('calibration_payload').optional().isObject(),
  ],
  validate,
  async (req, res) => {
    const { device_address, rssi_samples, calibration_payload } = req.body;
    const orgCode = req.user.org_code;

    const rssiBaseline = Math.round(
      rssi_samples.reduce((a, v) => a + v, 0) / rssi_samples.length
    );

    try {
      const { rows } = await pool.query(
        `UPDATE hardware_registry
         SET rssi_baseline = $1, calibration_payload = $2, updated_at = NOW()
         WHERE org_code = $3 AND device_address = $4
         RETURNING *`,
        [rssiBaseline, JSON.stringify(calibration_payload || {}), orgCode, device_address.toUpperCase()]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Device not found in registry' });

      await pool.query(
        'INSERT INTO audit_log (org_code, operator_phone, action, detail) VALUES ($1,$2,$3,$4)',
        [orgCode, req.user.phone, 'hardware_calibrated', `${device_address} baseline RSSI: ${rssiBaseline} dBm`]
      );

      res.json({ ...rows[0], rssi_baseline: rssiBaseline });
    } catch (err) {
      console.error('[hardware/calibrate]', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ── GET /api/hardware ── */
router.get('/', requireAuth, async (req, res) => {
  const orgCode = req.user.org_code;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM hardware_registry WHERE org_code = $1 ORDER BY created_at DESC',
      [orgCode]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ── DELETE /api/hardware/:id ── */
router.delete('/:id', requireAuth, requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM hardware_registry WHERE id = $1 AND org_code = $2',
      [req.params.id, req.user.org_code]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
