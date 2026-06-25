import pool from '../config/db.js';
import { buildNativeCallChain } from '../services/voice.service.js';

export async function getCallChain(req, res) {
  const alertId = req.params.alertId;
  try {
    const alertRes = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
    if (!alertRes.rows[0]) return res.status(404).json({ error: 'Alert not found' });

    const contacts = await pool.query(
      'SELECT name, phone, relationship, priority FROM emergency_contacts WHERE user_id = $1 ORDER BY priority ASC LIMIT 5',
      [alertRes.rows[0].user_id]
    );

    const chain = buildNativeCallChain(contacts.rows);
    res.json({ chain, alertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function logCallResult(req, res) {
  const { alertId, contactNumber, contactName, attemptNumber, answered } = req.body;
  try {
    await pool.query(
      `INSERT INTO voice_logs
         (organization_id, alert_id, user_id, contact_number, contact_name, attempt_number, method, status, answered)
       VALUES ($1,$2,$3,$4,$5,$6,'native',$7,$8)`,
      [req.orgId, alertId, req.user.id, contactNumber, contactName, attemptNumber, answered ? 'answered' : 'no_answer', answered]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function twimlWebhook(req, res) {
  const name    = req.query.name || 'a member';
  const alertId = req.query.alertId || '';
  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-ZA">
    This is an emergency alert from Safety Link for ${name}.
    Alert reference: ${alertId.slice(0, 8)}.
    Please call back immediately.
  </Say>
  <Pause length="2"/>
  <Say voice="alice">Goodbye.</Say>
</Response>`);
}
