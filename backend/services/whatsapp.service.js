import pool from '../db/index.js';

const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_API_URL  = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;

export async function sendWhatsAppText({ to, message, orgCode, alertId, templateName }) {
  let providerId   = null;
  let status       = 'failed';
  let errorMessage = null;

  if (!WA_TOKEN || !WA_PHONE_ID) {
    errorMessage = 'WhatsApp credentials not configured';
    console.warn('[WA] ' + errorMessage);
  } else {
    try {
      const body = {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                to.replace(/\s+/g, '').replace(/^\+/, ''),
        type:              'text',
        text:              { preview_url: false, body: message },
      };

      const res  = await fetch(WA_API_URL, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
      console.error('[WA] Send error:', err.message);
    }
  }

  await pool.query(
    `INSERT INTO whatsapp_logs (org_code, alert_id, to_number, message, template_name, status, provider_message_id, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [orgCode || null, alertId || null, to, message, templateName || null, status, providerId, errorMessage]
  );

  return { providerId, status, error: errorMessage };
}

export async function sendWhatsAppTemplate({ to, templateName, languageCode = 'en_US', components = [], orgCode, alertId }) {
  let providerId   = null;
  let status       = 'failed';
  let errorMessage = null;

  if (!WA_TOKEN || !WA_PHONE_ID) {
    errorMessage = 'WhatsApp credentials not configured';
    console.warn('[WA] ' + errorMessage);
  } else {
    try {
      const body = {
        messaging_product: 'whatsapp',
        to:                to.replace(/\s+/g, '').replace(/^\+/, ''),
        type:              'template',
        template:          { name: templateName, language: { code: languageCode }, components },
      };

      const res  = await fetch(WA_API_URL, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
    `INSERT INTO whatsapp_logs (org_code, alert_id, to_number, message, template_name, status, provider_message_id, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [orgCode || null, alertId || null, to, `[template:${templateName}]`, templateName, status, providerId, errorMessage]
  );

  return { providerId, status, error: errorMessage };
}
