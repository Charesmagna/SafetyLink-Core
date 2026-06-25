import twilio from 'twilio';
import pool from '../db/index.js';

const PROVIDER = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();

/* ── Twilio ── */
function getTwilioClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured');
  return twilio(sid, token);
}

async function sendViaTwilio(to, message) {
  const client = getTwilioClient();
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to,
  });
  return { providerId: result.sid, status: result.status };
}

/* ── Africa's Talking ── */
async function sendViaAfricasTalking(to, message) {
  const { default: AfricasTalking } = await import('@vonage/server-sdk').catch(() => null) || {};

  const apiKey      = process.env.AT_API_KEY;
  const username    = process.env.AT_USERNAME;
  const senderId    = process.env.AT_SENDER_ID || '';

  if (!apiKey || !username) throw new Error("Africa's Talking credentials not configured");

  const body = JSON.stringify({
    username,
    to,
    message,
    ...(senderId ? { from: senderId } : {}),
  });

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];
  return {
    providerId: recipient?.messageId || null,
    status: recipient?.status || 'queued',
  };
}

/* ── Public API ── */
export async function sendSMS({ to, message, orgCode, alertId }) {
  let providerResult = { providerId: null, status: 'failed' };
  let errorMessage   = null;

  try {
    if (PROVIDER === 'africastalking') {
      providerResult = await sendViaAfricasTalking(to, message);
    } else {
      providerResult = await sendViaTwilio(to, message);
    }
  } catch (err) {
    errorMessage = err.message;
    console.error(`[SMS] Failed to send to ${to}:`, err.message);
  }

  await pool.query(
    `INSERT INTO sms_logs (org_code, alert_id, to_number, from_number, message, provider, status, provider_message_id, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      orgCode   || null,
      alertId   || null,
      to,
      PROVIDER === 'africastalking'
        ? (process.env.AT_SENDER_ID || null)
        : (process.env.TWILIO_FROM_NUMBER || null),
      message,
      PROVIDER,
      providerResult.status,
      providerResult.providerId,
      errorMessage,
    ]
  );

  return { ...providerResult, error: errorMessage };
}

export async function sendBulkSMS({ numbers, message, orgCode, alertId }) {
  return Promise.allSettled(
    numbers.map(to => sendSMS({ to, message, orgCode, alertId }))
  );
}
