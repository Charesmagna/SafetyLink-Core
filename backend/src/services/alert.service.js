import pool from '../config/db.js';
import { broadcastAlert } from '../websocket/socket.server.js';
import { sendBulkSMS } from './sms.service.js';
import { sendWhatsApp } from './whatsapp.service.js';
import { initiateVoiceEscalation } from './voice.service.js';
import { sendPushToOrg } from './fcm.service.js';

export async function createAlert({ orgId, userId, latitude, longitude, isDrill, source, clientId }) {
  const { rows } = await pool.query(
    `INSERT INTO alerts
       (organization_id, user_id, latitude, longitude, is_drill, status, tier, source, client_id)
     VALUES ($1,$2,$3,$4,$5,'active',1,$6,$7)
     ON CONFLICT (client_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [orgId, userId, latitude || null, longitude || null, !!isDrill, source || 'app', clientId || null]
  );
  const alert = rows[0];

  await pool.query(
    'INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)',
    [alert.id, isDrill ? 'drill_fired' : 'panic_fired', JSON.stringify({ lat: latitude, lon: longitude })]
  );

  if (latitude && longitude) {
    await pool.query(
      'INSERT INTO location_history (organization_id, user_id, alert_id, latitude, longitude) VALUES ($1,$2,$3,$4,$5)',
      [orgId, userId, alert.id, latitude, longitude]
    );
  }

  broadcastAlert(orgId, 'new_alert', alert);

  if (!isDrill) {
    await dispatchAlert({ alert, orgId, userId });
  }

  return alert;
}

async function dispatchAlert({ alert, orgId, userId }) {
  const [userRes, contactRes, orgRes] = await Promise.all([
    pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]),
    pool.query('SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY priority ASC', [userId]),
    pool.query('SELECT * FROM organizations WHERE id = $1', [orgId]),
  ]);

  const profile   = userRes.rows[0];
  const contacts  = contactRes.rows;
  const org       = orgRes.rows[0];
  const memberName = profile?.display_name || 'a member';
  const locationStr = (alert.latitude && alert.longitude)
    ? `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`
    : 'Location unavailable';

  const smsText = `🚨 SAFETY-LINK ALERT\nMember: ${memberName}\nOrg: ${org?.organization_name || orgId}\nTime: ${new Date().toLocaleTimeString()}\nLocation: ${locationStr}\nAlert ID: ${alert.id}`;

  const phones = contacts.map(c => c.phone).filter(Boolean);

  await Promise.allSettled([
    phones.length
      ? sendBulkSMS({ numbers: phones, message: smsText, orgId, alertId: alert.id })
      : Promise.resolve(),
    phones.length && process.env.WHATSAPP_ENABLED === 'true'
      ? Promise.allSettled(phones.map(p => sendWhatsApp({ to: p, message: smsText, orgId, alertId: alert.id })))
      : Promise.resolve(),
    sendPushToOrg(
      orgId,
      ['responder', 'supervisor', 'org_admin', 'org_owner'],
      { title: '🚨 SAFETY-LINK ALERT', body: `Emergency triggered by ${memberName}` },
      { alertId: alert.id, screen: 'screen-intel' }
    ),
    contacts.length && process.env.VOICE_ENABLED === 'true'
      ? initiateVoiceEscalation({ orgId, alertId: alert.id, userId, contacts, memberName })
      : Promise.resolve(),
  ]);
}

export async function escalateAlert(alertId, orgId) {
  const { rows } = await pool.query(
    `UPDATE alerts SET tier = LEAST(tier + 1, 3), updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [alertId, orgId]
  );
  if (!rows[0]) return null;
  await pool.query('INSERT INTO alert_events (alert_id, event_type) VALUES ($1,$2)', [alertId, `escalated_tier_${rows[0].tier}`]);
  broadcastAlert(orgId, 'alert_updated', rows[0]);
  return rows[0];
}

export async function resolveAlert(alertId, orgId, resolvedById, resolution) {
  const { rows } = await pool.query(
    `UPDATE alerts SET status = 'resolved', resolved_at = NOW(), resolved_by_id = $3, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING *`,
    [alertId, orgId, resolvedById]
  );
  if (!rows[0]) return null;
  await pool.query('INSERT INTO alert_events (alert_id, event_type, payload) VALUES ($1,$2,$3)',
    [alertId, 'resolved', JSON.stringify({ resolution, by: resolvedById })]);
  broadcastAlert(orgId, 'alert_updated', rows[0]);
  return rows[0];
}
