// SafetyLink Cloudflare Worker
// Deployed at: safetylink-api.d089bef8b0b58c5d9506b512ec2f63dc.workers.dev

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── HEALTH CHECK ────────────────────────────────────────────────────
    if (path === '/health') {
      return json({ status: 'SafetyLink API online', version: '2.0.0' });
    }

    // ── PANIC ENDPOINT ──────────────────────────────────────────────────
    if (path === '/api/panic' && request.method === 'POST') {
      const body = await request.json();
      await fireAlerts(body, env);
      return json({ status: 'alerts_fired', timestamp: new Date().toISOString() });
    }

    // ── USSD ENDPOINT (Africa's Talking) ────────────────────────────────
    if (path === '/ussd' && request.method === 'POST') {
      const form = await request.formData();
      const sessionId   = form.get('sessionId') || '';
      const phoneNumber = form.get('phoneNumber') || '';
      const text        = form.get('text') || '';

      let response = '';

      if (text === '') {
        // Fire panic immediately on first dial — don't wait for menu
        await fireAlerts({
          userId:   phoneNumber,
          name:     phoneNumber,
          trigger:  'USSD',
          contacts: [{ phone: env.RESPONSE_CENTRE_NUMBER, name: 'SafetyLink Command' }],
        }, env);
        response = 'CON SafetyLink Emergency\nAlert sent. Help is coming.\n1. Confirm OK\n2. Cancel Alert';
      } else if (text === '1') {
        response = 'END Alert confirmed. Stay safe. Help is on the way.';
      } else if (text === '2') {
        response = 'END Alert cancelled.';
      } else if (text === 'menu') {
        response = 'CON SafetyLink\n1. Send Panic Alert\n2. My Subscription\n3. Contact Support';
      } else {
        response = 'END Invalid option. Dial again for emergency.';
      }

      return new Response(response, {
        headers: { ...CORS, 'Content-Type': 'text/plain' },
      });
    }

    // ── PAYSTACK WEBHOOK ────────────────────────────────────────────────
    if (path === '/api/paystack/webhook' && request.method === 'POST') {
      const body = await request.json();
      const event = body.event;

      if (event === 'charge.success' || event === 'subscription.create') {
        const data = body.data;
        const email = data?.customer?.email || '';
        const amount = (data?.amount || 0) / 100; // Paystack sends kobo/cents
        const plan = data?.plan?.name || 'Premium';
        const reference = data?.reference || '';

        // Notify command center via WhatsApp
        await sendWhatsApp(
          env.RESPONSE_CENTRE_NUMBER,
          `💳 NEW SAFETYLINK SUBSCRIPTION\nPlan: ${plan}\nAmount: R${amount}\nEmail: ${email}\nRef: ${reference}`,
          env
        );

        // Store in Upstash
        await fetch(`${env.UPSTASH_REDIS_REST_URL}/lpush/safetylink:subscriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify({ email, amount, plan, reference, timestamp: new Date().toISOString() })),
        });
      }

      if (event === 'subscription.disable' || event === 'subscription.not_renew') {
        const email = body.data?.customer?.email || '';
        await sendWhatsApp(
          env.RESPONSE_CENTRE_NUMBER,
          `⚠️ SUBSCRIPTION CANCELLED\nEmail: ${email}\nEvent: ${event}`,
          env
        );
      }

      return json({ status: 'ok' });
    }

    // ── PAYSTACK VERIFY (called after redirect) ─────────────────────────
    if (path === '/api/paystack/verify' && request.method === 'POST') {
      const { reference } = await request.json();
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
      });
      const data = await res.json();
      return json(data);
    }

    // ── VAPI WEBHOOK ────────────────────────────────────────────────────
    if (path === '/vapi/webhook' && request.method === 'POST') {
      const body = await request.json();
      const type = body.message?.type;
      const callerNumber = body.message?.call?.customer?.number || 'unknown';

      if (type === 'call-started' || type === 'assistant-request') {
        // Fire alert chain immediately
        await fireAlerts({
          userId:   callerNumber,
          name:     callerNumber,
          trigger:  'INBOUND_CALL',
          contacts: [{ phone: env.RESPONSE_CENTRE_NUMBER, name: 'SafetyLink Command' }],
        }, env);

        return json({
          assistant: {
            firstMessage: 'SafetyLink emergency line. Stay on the line. Your emergency contacts are being alerted now.',
            model: {
              provider: 'openai',
              model: 'gpt-4o-mini',
              systemPrompt: `You are SafetyLink emergency AI. Caller: ${callerNumber}. Contacts already alerted. Keep caller calm. Ask only: Are you able to speak freely? Support EN, ZU, AF, XH automatically.`,
              temperature: 0.3,
            },
            voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
            recordingEnabled: true,
            silenceTimeoutSeconds: 30,
            maxDurationSeconds: 600,
          },
        });
      }

      return json({ result: 'ok' });
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ── CORE ALERT CHAIN ──────────────────────────────────────────────────────
async function fireAlerts({ userId, name, lat, lon, trigger, contacts }, env) {
  const locationUrl = lat && lon
    ? `https://maps.google.com/?q=${lat},${lon}`
    : 'Location not captured';

  const message =
    `🚨 SAFETYLINK PANIC\n` +
    `Who: ${name || userId}\n` +
    `Trigger: ${trigger}\n` +
    `Location: ${locationUrl}\n` +
    `Time: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}`;

  const jobs = [];

  // 1. WhatsApp to all contacts
  for (const c of contacts) {
    jobs.push(sendWhatsApp(c.phone, message, env));
  }

  // 2. VAPI outbound call to primary contact
  if (contacts[0]) {
    jobs.push(
      fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
          customer: { number: contacts[0].phone },
          assistant: {
            assistantId: env.VAPI_ASSISTANT_ID,
            assistantOverrides: {
              firstMessage: `SafetyLink AI. ${name || userId} triggered a panic alert. Location: ${locationUrl}. Please respond immediately.`,
            },
          },
        }),
      })
    );
  }

  // 3. Bland.ai to secondary contact
  if (contacts[1]) {
    jobs.push(
      fetch('https://api.bland.ai/v1/calls', {
        method: 'POST',
        headers: {
          Authorization: env.BLAND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: contacts[1].phone,
          task: `SafetyLink emergency. ${name || userId} needs help at ${locationUrl}. Please respond now.`,
          voice: env.BLAND_VOICE_ID,
          language: 'babel-en',
          model: 'base',
          max_duration: 2,
          record: true,
        }),
      })
    );
  }

  // 4. Telegram command center
  if (env.TELEGRAM_BOT && env.TELEGRAM_CHAT) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT, text: message }),
      })
    );
  }

  // 5. Upstash log
  jobs.push(
    fetch(`${env.UPSTASH_REDIS_REST_URL}/lpush/safetylink:alerts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify({ userId, name, lat, lon, trigger, timestamp: new Date().toISOString() })),
    })
  );

  await Promise.allSettled(jobs);
}

async function sendWhatsApp(to, message, env) {
  return fetch('https://api.twilio.com/2010-04-01/Accounts/' + env.TWILIO_SID + '/Messages.json', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(env.TWILIO_SID + ':' + env.WHATSAPP_ACCESS_TOKEN),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${env.TWILIO_NUMBER}`,
      To: `whatsapp:${to}`,
      Body: message,
    }),
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
