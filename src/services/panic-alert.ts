import { query } from '../db';
import { env } from '../config/env';
import { sendVapiCall } from '../providers/vapi';
import { sendTwilioSms } from '../providers/sms';

export async function createIncident(userId: string, source: string, location?: { lat: number; lon: number; accuracy?: number }): Promise<string> {
  const idempotencyKey = `${userId}-${new Date().toISOString().substring(0, 13)}`; // hourly unique roughly, or pass from device
  
  const existing = await query('SELECT id FROM panic_incidents WHERE idempotency_key = $1', [idempotencyKey]);
  if (existing.rowCount && existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const result = await query(
    'INSERT INTO panic_incidents (user_id, idempotency_key, status) VALUES ($1, $2, $3) RETURNING id',
    [userId, idempotencyKey, 'QUEUED']
  );
  
  const incidentId = result.rows[0].id;

  if (location) {
    await query(
      'INSERT INTO incident_locations (incident_id, source, encrypted_lat, encrypted_lon, accuracy) VALUES ($1, $2, $3, $4, $5)',
      [incidentId, source, location.lat.toString(), location.lon.toString(), location.accuracy || 0]
    );
  }

  return incidentId;
}

export async function processPanicAlert(incidentId: string) {
  if (!env.ALERTS_ENABLED) {
    console.log(`[TEST MODE] Would process incident ${incidentId}`);
    await query('UPDATE panic_incidents SET status = $1 WHERE id = $2', ['TEST_COMPLETED', incidentId]);
    return;
  }

  const incidentRes = await query(`
    SELECT p.*, u.name, u.phone_number 
    FROM panic_incidents p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.id = $1
  `, [incidentId]);

  if (!incidentRes.rowCount) return;
  const incident = incidentRes.rows[0];

  const contactsRes = await query('SELECT * FROM emergency_contacts WHERE user_id = $1 AND verified = true', [incident.user_id]);
  const contacts = contactsRes.rows;

  const locRes = await query('SELECT * FROM incident_locations WHERE incident_id = $1 ORDER BY created_at DESC LIMIT 1', [incidentId]);
  const location = locRes.rows[0] ? `Lat: ${locRes.rows[0].encrypted_lat}, Lon: ${locRes.rows[0].encrypted_lon} (Source: ${locRes.rows[0].source})` : 'Unknown Location';

  for (const contact of contacts) {
    const destNumber = env.TEST_DESTINATION_NUMBER || contact.contact_phone;
    
    // Voice
    await sendVapiCall(destNumber, contact.contact_name, incident, location);

    // SMS
    await sendTwilioSms(destNumber, `SAFETYLINK PANIC: ${incident.name} needs help! Location: ${location}`);
  }

  await query('UPDATE panic_incidents SET status = $1 WHERE id = $2', ['PROCESSED', incidentId]);
}
