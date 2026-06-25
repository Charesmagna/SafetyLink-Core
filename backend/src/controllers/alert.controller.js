import pool from '../config/db.js';
import { createAlert, escalateAlert, resolveAlert } from '../services/alert.service.js';

export async function create(req, res) {
  const { latitude, longitude, isDrill, source, clientId } = req.body;
  try {
    const alert = await createAlert({
      orgId:     req.orgId,
      userId:    req.user.id,
      latitude,
      longitude,
      isDrill,
      source,
      clientId,
    });
    res.status(201).json(alert);
  } catch (err) {
    console.error('[alert/create]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function list(req, res) {
  const orgId  = req.user.role === 'platform_owner' ? (req.query.org || req.orgId) : req.orgId;
  const status = req.query.status;
  const limit  = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const conditions = ['a.organization_id = $1'];
    const params     = [orgId];
    let idx          = 2;
    if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }

    const { rows } = await pool.query(
      `SELECT a.*,
              p.display_name AS operator_name, p.primary_phone AS operator_phone,
              COALESCE(json_agg(ae.event_type ORDER BY ae.created_at) FILTER (WHERE ae.id IS NOT NULL), '[]') AS events
       FROM alerts a
       LEFT JOIN profiles p ON p.user_id = a.user_id
       LEFT JOIN alert_events ae ON ae.alert_id = a.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY a.id, p.display_name, p.primary_phone
       ORDER BY a.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('[alert/list]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function get(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*,
              p.display_name AS operator_name, p.primary_phone AS operator_phone,
              mp.blood_type, mp.conditions, mp.medications, mp.allergies,
              COALESCE(json_agg(DISTINCT ae.*) FILTER (WHERE ae.id IS NOT NULL), '[]') AS events,
              COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS responders
       FROM alerts a
       LEFT JOIN profiles p ON p.user_id = a.user_id
       LEFT JOIN medical_profiles mp ON mp.user_id = a.user_id
       LEFT JOIN alert_events ae ON ae.alert_id = a.id
       LEFT JOIN responders r ON r.alert_id = a.id
       WHERE a.id = $1 AND (a.organization_id = $2 OR $3 = 'platform_owner')
       GROUP BY a.id, p.display_name, p.primary_phone, mp.blood_type, mp.conditions, mp.medications, mp.allergies`,
      [req.params.id, req.orgId, req.user.role]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function accept(req, res) {
  try {
    const existing = await pool.query(
      'SELECT id FROM responders WHERE alert_id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (existing.rows[0]) return res.status(409).json({ error: 'Already accepted this alert' });

    const { rows } = await pool.query(
      'INSERT INTO responders (alert_id, user_id, organization_id) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, req.orgId]
    );
    await pool.query(
      'INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)',
      [req.params.id, 'responder_accepted', JSON.stringify({ userId: req.user.id })]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function escalate(req, res) {
  try {
    const alert = await escalateAlert(req.params.id, req.orgId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function resolve(req, res) {
  try {
    const alert = await resolveAlert(req.params.id, req.orgId, req.user.id, req.body.resolution);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function streamLocation(req, res) {
  const { latitude, longitude, accuracy, altitude, heading, speed, alertId } = req.body;
  try {
    await pool.query(
      `INSERT INTO location_history (organization_id, user_id, alert_id, latitude, longitude, accuracy, altitude, heading, speed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.orgId, req.user.id, alertId || null, latitude, longitude, accuracy || null, altitude || null, heading || null, speed || null]
    );
    const { broadcastAlert } = await import('../websocket/socket.server.js');
    broadcastAlert(req.orgId, 'location_update', {
      userId: req.user.id, displayName: req.user.display_name,
      lat: latitude, lon: longitude, accuracy, ts: Date.now(),
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}
