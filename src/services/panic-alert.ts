import { query } from '../db';
import { env } from '../config/env';
import { sendVapiCall } from '../providers/vapi';
import { sendTwilioSms } from '../providers/sms';
import { sendBlandCall } from '../providers/bland';
import { sendInfobipSms } from '../providers/infobip';
import { sendTelegramAlert } from '../providers/telegram';

export async function createIncident(userId: string, source: string, location?: { lat: number; lon: number; accuracy?: number }): Promise<string> {
  // 1-minute idempotency window (blocks duplicates within the exact same minute)
  const idempotencyKey = `${userId}-${new Date().toISOString().substring(0, 16)}`;
  
  const existing = await query('SELECT id FROM panic_incidents WHERE idempotency_key = $1', [idempotencyKey]);
  if (existing.rowCount && existing.rowCount > 0) {
    return existing.rows[0].id as string;
  }

  const result = await query(
    'INSERT INTO panic_incidents (user_id, idempotency_key, status) VALUES ($1, $2, $3) RETURNING id',
    [userId, idempotencyKey, 'QUEUED']
  );
  
  const incidentId = result.rows[0].id as string;

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
    SELECT p.*, u.name, u.phone 
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

  const alertMessage = `SAFETYLINK PANIC: ${incident.name as string} needs help! Location: ${location}`;

  // Fire parallel dispatch to maximize delivery chance
  console.log(`[PanicAlert] Initiating parallel dispatch for Incident #${incidentId}`);
  
  // Telegram to response center
  sendTelegramAlert(`🚨 INCOMING PANIC ALERT 🚨\nUser: ${incident.name}\n${location}`).catch(e => console.error(e));

  for (const contact of contacts) {
    const destNumber = env.TEST_DESTINATION_NUMBER || contact.contact_phone as string;
    
    // Execute all 4 comms vectors in parallel (Twilio, Infobip fallback, VAPI, Bland fallback)
    await Promise.allSettled([
      // Primary Voice: VAPI
      sendVapiCall(destNumber, contact.contact_name as string, incident, location),
      // Secondary Voice Fallback: Bland
      sendBlandCall(destNumber, `This is a SafetyLink emergency for ${incident.name}. They require immediate assistance at ${location}.`),
      // Primary SMS: Twilio
      sendTwilioSms(destNumber, alertMessage),
      // Secondary SMS Fallback: Infobip
      sendInfobipSms(destNumber, alertMessage)
    ]);
  }

  await query('UPDATE panic_incidents SET status = $1 WHERE id = $2', ['PROCESSED', incidentId]);
}
