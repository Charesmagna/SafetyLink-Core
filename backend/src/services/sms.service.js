import twilio from 'twilio';
import pool from '../config/db.js';
import { decryptJSON } from './crypto.service.js';

async function getOrgSMSConfig(orgId) {
  const { rows } = await pool.query(
    'SELECT sms_provider, sms_config_encrypted FROM org_settings WHERE organization_id = $1',
    [orgId]
  );
  if (!rows[0]) return null;
  return {
    provider: rows[0].sms_provider || 'twilio',
    config:   decryptJSON(rows[0].sms_config_encrypted) || {},
  };
}

async function sendViaTwilio(to, message, config) {
  const sid   = config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const token = config.TWILIO_AUTH_TOKEN  || process.env.TWILIO_AUTH_TOKEN;
  const from  = config.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) throw new Error('Twilio credentials not configured');

  const client = twilio(sid, token);
  const msg    = await client.messages.create({ body: message, from, to });
  return { providerId: msg.sid, status: msg.status };
}

async function sendViaAfricasTalking(to, message, config) {
  const apiKey   = config.AT_API_KEY   || process.env.AT_API_KEY;
  const username = config.AT_USERNAME  || process.env.AT_USERNAME;
  const from     = config.AT_SENDER_ID || process.env.AT_SENDER_ID || '';
  if (!apiKey || !username) throw new Error("Africa's Talking credentials not configured");

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method:  'POST',
    headers: { apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, to, message, ...(from ? { from } : {}) }),
  });
  const data      = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];
  return { providerId: recipient?.messageId || null, status: recipient?.status || 'sent' };
}

export async function sendSMS({ to, message, orgId, alertId, userId }) {
  let providerId   = null;
  let status       = 'failed';
  let provider     = 'twilio';
  let errorMessage = null;

  try {
    const orgCfg = orgId ? await getOrgSMSConfig(orgId) : null;
    provider     = orgCfg?.provider || 'twilio';
    const config = orgCfg?.config  || {};

    if (provider === 'africastalking') {
      ({ providerId, status } = await sendViaAfricasTalking(to, message, config));
    } else {
      ({ providerId, status } = await sendViaTwilio(to, message, config));
    }
  } catch (err) {
    errorMessage = err.message;
    console.error('[SMS] Send error:', err.message);
  }

  await pool.query(
    `INSERT INTO sms_logs
       (organization_id, alert_id, user_id, to_number, message, provider, status, provider_message_id, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [orgId || null, alertId || null, userId || null, to, message, provider, status, providerId, errorMessage]
  );

  return { providerId, status, error: errorMessage };
}

export async function sendBulkSMS({ numbers, message, orgId, alertId }) {
  return Promise.allSettled(
    numbers.map(to => sendSMS({ to, message, orgId, alertId }))
  );
}
