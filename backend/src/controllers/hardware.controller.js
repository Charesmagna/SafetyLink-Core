import pool from '../config/db.js';

export async function register(req, res) {
  const { device_address, friendly_name, service_uuid, characteristic_uuid, trigger_value, assigned_user_id } = req.body;
  if (!device_address || !friendly_name) return res.status(400).json({ error: 'device_address and friendly_name required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO hardware_registry
         (organization_id, device_address, friendly_name, service_uuid, characteristic_uuid, trigger_value, assigned_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (organization_id, device_address) DO UPDATE SET
         friendly_name       = EXCLUDED.friendly_name,
         service_uuid        = EXCLUDED.service_uuid,
         characteristic_uuid = EXCLUDED.characteristic_uuid,
         trigger_value       = EXCLUDED.trigger_value,
         assigned_user_id    = EXCLUDED.assigned_user_id,
         updated_at          = NOW()
       RETURNING *`,
      [req.orgId, device_address.toUpperCase(), friendly_name, service_uuid || 'FFE0', characteristic_uuid || 'FFE1', trigger_value || '01', assigned_user_id || null]
    );
    if (assigned_user_id) {
      await pool.query(
        `INSERT INTO hardware_assignment_history (hardware_id, organization_id, assigned_user_id, assigned_by_user_id)
         VALUES ($1,$2,$3,$4)`,
        [rows[0].id, req.orgId, assigned_user_id, req.user.id]
      );
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[hardware/register]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function calibrate(req, res) {
  const { device_address, rssi_samples, calibration_payload } = req.body;
  const baseline = Math.round(rssi_samples.reduce((a, v) => a + v, 0) / rssi_samples.length);
  try {
    const { rows } = await pool.query(
      `UPDATE hardware_registry SET rssi_baseline = $1, calibration_payload = $2, updated_at = NOW()
       WHERE organization_id = $3 AND device_address = $4 RETURNING *`,
      [baseline, JSON.stringify(calibration_payload || {}), req.orgId, device_address.toUpperCase()]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Device not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function list(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT h.*, p.display_name AS assigned_name, p.primary_phone AS assigned_phone
       FROM hardware_registry h
       LEFT JOIN profiles p ON p.user_id = h.assigned_user_id
       WHERE h.organization_id = $1 ORDER BY h.created_at DESC`,
      [req.orgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function assign(req, res) {
  const { user_id } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE hardware_registry SET assigned_user_id = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *',
      [user_id || null, req.params.id, req.orgId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Device not found' });
    if (user_id) {
      await pool.query(
        'INSERT INTO hardware_assignment_history (hardware_id, organization_id, assigned_user_id, assigned_by_user_id) VALUES ($1,$2,$3,$4)',
        [rows[0].id, req.orgId, user_id, req.user.id]
      );
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function remove(req, res) {
  try {
    await pool.query('DELETE FROM hardware_registry WHERE id = $1 AND organization_id = $2', [req.params.id, req.orgId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
