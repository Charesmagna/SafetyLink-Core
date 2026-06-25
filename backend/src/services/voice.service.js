import twilio from 'twilio';
import pool from '../config/db.js';
import { decryptJSON } from './crypto.service.js';

async function getOrgVoiceConfig(orgId) {
  const { rows } = await pool.query(
    'SELECT voice_config_encrypted, escalation_delay_seconds, max_voice_contacts FROM org_settings WHERE organization_id = $1',
    [orgId]
  );
  if (!rows[0]) return { config: {}, delay: 15, maxContacts: 3 };
  return {
    config:      decryptJSON(rows[0].voice_config_encrypted) || {},
    delay:       rows[0].escalation_delay_seconds || 15,
    maxContacts: rows[0].max_voice_contacts || 3,
  };
}

async function logVoiceAttempt({ orgId, alertId, userId, contactNumber, contactName, attemptNumber, method, status, answered, errorMessage }) {
  await pool.query(
    `INSERT INTO voice_logs
       (organization_id, alert_id, user_id, contact_number, contact_name, attempt_number, method, status, answered, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [orgId, alertId, userId, contactNumber, contactName, attemptNumber, method, status, answered, errorMessage]
  );
}

async function callViaTwilio(to, config, memberName, alertId) {
  const sid    = config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const token  = config.TWILIO_AUTH_TOKEN  || process.env.TWILIO_AUTH_TOKEN;
  const from   = config.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;
  const twiUrl = process.env.BACKEND_URL + '/api/webhooks/voice-twiml?name=' + encodeURIComponent(memberName || 'a member') + '&alertId=' + alertId;

  if (!sid || !token || !from) throw new Error('Twilio Voice credentials not configured');

  const client = twilio(sid, token);
  const call   = await client.calls.create({ url: twiUrl, to, from, timeout: 20 });
  return { sid: call.sid, status: call.status };
}

export async function initiateVoiceEscalation({ orgId, alertId, userId, contacts, memberName }) {
  const { config, delay, maxContacts } = await getOrgVoiceConfig(orgId);
  const limited = contacts.slice(0, maxContacts);

  for (let i = 0; i < limited.length; i++) {
    const contact = limited[i];
    try {
      const result = await callViaTwilio(contact.phone, config, memberName, alertId);
      await logVoiceAttempt({
        orgId, alertId, userId,
        contactNumber: contact.phone,
        contactName:   contact.name,
        attemptNumber: i + 1,
        method:        'twilio',
        status:        result.status,
        answered:      null,
        errorMessage:  null,
      });
    } catch (err) {
      await logVoiceAttempt({
        orgId, alertId, userId,
        contactNumber: contact.phone,
        contactName:   contact.name,
        attemptNumber: i + 1,
        method:        'twilio',
        status:        'failed',
        answered:      false,
        errorMessage:  err.message,
      });
    }
    if (i < limited.length - 1) {
      await new Promise(r => setTimeout(r, delay * 1000));
    }
  }
}

export function buildNativeCallChain(contacts, maxContacts = 3) {
  return contacts.slice(0, maxContacts).map((c, i) => ({
    index:  i + 1,
    name:   c.name,
    phone:  c.phone,
    total:  Math.min(contacts.length, maxContacts),
  }));
}
