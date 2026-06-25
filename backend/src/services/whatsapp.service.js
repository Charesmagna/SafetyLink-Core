import pool from '../config/db.js';
import { decryptJSON } from './crypto.service.js';

async function getOrgWAConfig(orgId) {
  const { rows } = await pool.query(
    'SELECT whatsapp_config_encrypted FROM org_settings WHERE organization_id = $1',
    [orgId]
  );
  return rows[0] ? decryptJSON(rows[0].whatsapp_config_encrypted) || {} : {};
}

export async function sendWhatsApp({ to, message, orgId, alertId, templateName }) {
  const config    = orgId ? await getOrgWAConfig(orgId) : {};
  const token     = config.WA_ACCESS_TOKEN    || process.env.WHATSAPP_TOKEN;
  const phoneId   = config.WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;
  const apiUrl    = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

  let providerId   = null;
  let status       = 'failed';
  let errorMessage = null;

  if (!token || !phoneId) {
    errorMessage = 'WhatsApp credentials not configured';
  } else {
    try {
      const body = {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                to.replace(/\s+/g, '').replace(/^\+/, ''),
        type:              'text',
        text:              { preview_url: false, body: message },
      };
      const res  = await fetch(apiUrl, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.messages?.[0]?.id) {
        providerId = data.messages[0].id;
        status     = 'sent';
      } else {
        errorMessage = JSON.stringify(data?.error || data);
      }
    } catch (err) {
      errorMessage = err.message;
    }
  }

  await pool.query(
    `INSERT INTO whatsapp_logs
       (organization_id, alert_id, to_number, message, template_name, status, provider_message_id, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [orgId || null, alertId || null, to, message, templateName || null, status, providerId, errorMessage]
  );

  return { providerId, status, error: errorMessage };
}
