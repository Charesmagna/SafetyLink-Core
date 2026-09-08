// vapi-panic.ts
// SafetyLink — VAPI Inbound Panic Handler
// Fires the full alert chain the moment a call comes in

import express from 'express';
import twilio from 'twilio';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// ── CLIENTS ────────────────────────────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.WHATSAPP_ACCESS_TOKEN  // This is the Twilio Auth Token
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD || 'qcp4fx2v',
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Avoid crash if Redis env vars are missing
let redis, ratelimit;
try {
  redis = Redis.fromEnv();
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: 'safetylink:panic:inbound',
  });
} catch (err) {
  console.warn("Could not initialize Upstash Redis. Rate limiting disabled.", err);
}

// ── EMERGENCY CONTACTS LOOKUP ──────────────────────────────────────────────
async function getContactsForNumber(phoneNumber: string) {
  return [
    { name: 'SafetyLink Command', phone: process.env.COMMAND_CENTER_NUMBER || '+27739441222' },
  ];
}

// ── CORE ALERT CHAIN ───────────────────────────────────────────────────────
async function fireAllAlerts({ callerNumber, callerName, location, trigger, contacts, recordingUrl }: any) {
  const locationText = location
    ? `https://maps.google.com/?q=${location.lat},${location.lon}`
    : 'Location not available — trace call number';

  const message =
    `🚨 SAFETYLINK PANIC — INBOUND CALL\n` +
    `Caller: ${callerName || callerNumber}\n` +
    `Number: ${callerNumber}\n` +
    `Trigger: ${trigger}\n` +
    `Location: ${locationText}\n` +
    `Recording: ${recordingUrl || 'Processing...'}`;

  const jobs = [];

  for (const c of contacts) {
    if (process.env.TWILIO_NUMBER) {
      jobs.push(
        twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_NUMBER,
          to: c.phone,
        }).catch((e: any) => console.error('[Twilio SMS]', e.message))
      );
    }
  }

  for (const c of contacts) {
    if (process.env.TWILIO_NUMBER) {
      jobs.push(
        twilioClient.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_NUMBER}`,
          to: `whatsapp:${c.phone}`,
        }).catch((e: any) => console.error('[Twilio WA]', e.message))
      );
    }
  }

  // ── Native Twilio voice call to Contact 1 (rings their actual phone) ──
  if (contacts[0] && process.env.TWILIO_SID && process.env.TWILIO_NUMBER) {
    const locationText = location
      ? `https://maps.google.com/?q=${location.lat},${location.lon}`
      : 'location not available';
    jobs.push(
      twilioClient.calls.create({
        twiml: `<Response><Say voice="alice">SafetyLink emergency alert. ${callerName || 'A registered user'} has triggered a panic alarm. Their location is ${locationText}. This is an automated SafetyLink emergency call. Please check on them immediately.</Say><Pause length="2"/><Say voice="alice">Repeating. SafetyLink emergency. ${callerName || 'User'} needs help. Location: ${locationText}.</Say></Response>`,
        from: process.env.TWILIO_NUMBER,
        to: contacts[0].phone,
      }).catch((e: any) => console.error('[Twilio Voice Call]', e.message))
    );
  }

  // ── VAPI AI voice call to Contact 1 (intelligent, multilingual) ──
  if (contacts[0] && process.env.VAPI_PRIVATE_KEY) {
    const locationText = location
      ? `https://maps.google.com/?q=${location.lat},${location.lon}`
      : 'location not available';
    jobs.push(
      axios.post('https://api.vapi.ai/call', {
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        customer: { number: contacts[0].phone },
        assistant: {
          firstMessage: `This is SafetyLink AI. ${callerName || 'A registered user'} has triggered a panic alert. Their location is ${locationText}. Please respond immediately.`,
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            systemPrompt: 'You are a SafetyLink emergency notification agent. Read the alert clearly and ask the recipient to confirm they received it. Keep the call under 60 seconds.',
            temperature: 0.2,
          },
          voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
          endCallFunctionEnabled: true,
          maxDurationSeconds: 90,
          recordingEnabled: false,
        },
      }, {
        headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
      }).catch((e: any) => console.error('[VAPI Outbound]', e.message))
    );
  }

  if (contacts[1] && process.env.BLAND_API_KEY) {
    jobs.push(
      axios.post('https://api.bland.ai/v1/calls', {
        phone_number: contacts[1].phone,
        voice: process.env.BLAND_VOICE_ID,
        task: `SafetyLink emergency. ${callerName || callerNumber} has triggered an inbound panic call. Location: ${locationText}. This is an automated SafetyLink alert. Please respond immediately.`,
        record: true,
        language: 'babel-en',
        max_duration: 2,
        model: 'base',
        wait_for_greeting: false,
        answered_by_enabled: true,
      }, {
        headers: { Authorization: process.env.BLAND_API_KEY },
      }).catch((e: any) => console.error('[Bland.ai]', e.message))
    );
  }

  if (process.env.INFOBIP_API_KEY) {
    jobs.push(
      axios.post(`https://${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
        messages: contacts.map((c: any) => ({
          from: 'SafetyLink',
          to: [{ to: c.phone }],
          text: message,
        })),
      }, {
        headers: {
          Authorization: `App ${process.env.INFOBIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }).catch((e: any) => console.error('[Infobip]', e.message))
    );
  }

  if (process.env.TELEGRAM_BOT && process.env.TELEGRAM_CHAT) {
    jobs.push(
      axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT,
        text: message,
        parse_mode: 'HTML',
      }).catch((e: any) => console.error('[Telegram]', e.message))
    );
  }

  if (redis) {
    jobs.push(
      redis.lpush('safetylink:alerts', JSON.stringify({
        type: 'INBOUND_CALL',
        caller: callerNumber,
        name: callerName,
        location,
        trigger,
        recordingUrl,
        timestamp: new Date().toISOString(),
      })).catch((e: any) => console.error('[Upstash log]', e.message))
    );
  }

  await Promise.allSettled(jobs);
}

// ── VAPI WEBHOOK ENDPOINT ──────────────────────────────────────────────────
router.post('/vapi/webhook', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ result: 'ok' });

  const type         = message.type;
  const call         = message.call || {};
  const callerNumber = call.customer?.number || 'unknown';
  const callId       = call.id || 'unknown';

  if (ratelimit) {
    const { success } = await ratelimit.limit(callerNumber);
    if (!success) {
      console.log(`[Rate limit] ${callerNumber} exceeded panic rate`);
      return res.json({ result: 'rate_limited' });
    }
  }

  if (type === 'call-started' || type === 'assistant-request') {
    console.log(`[VAPI] Inbound panic call from ${callerNumber} — ID: ${callId}`);

    const contacts = await getContactsForNumber(callerNumber);

    fireAllAlerts({
      callerNumber,
      callerName:   null,
      location:     null,
      trigger:      'INBOUND_CALL',
      contacts,
      recordingUrl: null,
    });

    return res.json({
      assistant: {
        firstMessage: 'SafetyLink emergency line. Stay on the line. Your emergency contacts are being alerted now.',
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          systemPrompt: `You are SafetyLink's emergency AI. Caller number: ${callerNumber}. Contacts have already been alerted. Your job: keep the caller calm. Ask only 'Are you able to speak freely?' If yes, get location. If no, say help is coming. Speak in short calm sentences. Detect language automatically — support EN, ZU, AF, XH.`,
          temperature: 0.3,
        },
        voice: {
          provider: '11labs',
          voiceId: '21m00Tcm4TlvDq8ikWAM',
        },
        recordingEnabled: true,
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
      },
    });
  }

  if (type === 'transcript') {
    const transcript = message.transcript || '';
    console.log(`[VAPI Transcript] ${callerNumber}: ${transcript}`);
    if (redis) {
      await redis.append(
        `safetylink:call:${callId}:transcript`,
        transcript + '\n'
      );
    }
  }

  if (type === 'end-of-call-report') {
    const recordingUrl  = message.recordingUrl || null;
    const transcript    = message.transcript || '';
    const durationSecs  = message.durationSeconds || 0;

    console.log(`[VAPI] Call ended. Duration: ${durationSecs}s. Recording: ${recordingUrl}`);

    let evidenceUrl = recordingUrl;
    if (recordingUrl && process.env.CLOUDINARY_CLOUD) {
      try {
        const upload = await cloudinary.uploader.upload(recordingUrl, {
          resource_type: 'video',
          folder: 'safetylink/evidence/calls',
          public_id: `panic_call_${callId}_${Date.now()}`,
        });
        evidenceUrl = upload.secure_url;
      } catch (e: any) {
        console.error('[Cloudinary evidence]', e.message);
      }
    }

    if (redis) {
      await redis.lpush('safetylink:alerts:recordings', JSON.stringify({
        callId,
        callerNumber,
        recordingUrl: evidenceUrl,
        transcript,
        durationSecs,
        timestamp: new Date().toISOString(),
      })).catch(() => {});
    }

    const contacts = await getContactsForNumber(callerNumber);
    if (evidenceUrl && contacts.length && process.env.TWILIO_NUMBER) {
      for (const c of contacts) {
        twilioClient.messages.create({
          body: `SafetyLink — Panic call recording from ${callerNumber}:\n${evidenceUrl}\nDuration: ${durationSecs}s`,
          from: `whatsapp:${process.env.TWILIO_NUMBER}`,
          to: `whatsapp:${c.phone}`,
        }).catch(() => {});
      }
    }

    return res.json({ result: 'ok' });
  }

  return res.json({ result: 'ok' });
});

router.post('/api/panic', async (req, res) => {
  const {
    userId, name, lat, lon, trigger,
    contacts: reqContacts, photoBase64,
  } = req.body;

  if (ratelimit) {
    const { success } = await ratelimit.limit(userId || req.ip);
    if (!success) return res.status(429).json({ error: 'Rate limited' });
  }

  let photoUrl = null;
  if (photoBase64 && process.env.CLOUDINARY_CLOUD) {
    try {
      const upload = await cloudinary.uploader.upload(photoBase64, {
        folder: 'safetylink/evidence/photos',
        public_id: `panic_photo_${userId}_${Date.now()}`,
      });
      photoUrl = upload.secure_url;
    } catch (e: any) {
      console.error('[Cloudinary photo]', e.message);
    }
  }

  const contacts = reqContacts?.length
    ? reqContacts
    : await getContactsForNumber(userId);

  fireAllAlerts({
    callerNumber: userId,
    callerName:   name,
    location:     lat && lon ? { lat, lon } : null,
    trigger:      trigger || 'APP_BUTTON',
    contacts,
    recordingUrl: photoUrl,
  });

  res.json({ status: 'alerts_fired', timestamp: new Date().toISOString() });
});

router.post('/ussd', async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;

  let response = '';

  if (text === '') {
    response = 'CON SafetyLink Emergency\n1. Send Panic Alert\n2. Update Contacts\n3. Check Status';
  } else if (text === '1') {
    const contacts = await getContactsForNumber(phoneNumber);
    fireAllAlerts({
      callerNumber: phoneNumber,
      callerName:   null,
      location:     null,
      trigger:      'USSD',
      contacts,
      recordingUrl: null,
    });
    response = 'END Panic alert sent. Help is coming. Stay safe.';
  } else if (text === '2') {
    response = 'END To update contacts WhatsApp 0739441222';
  } else if (text === '3') {
    response = 'END SafetyLink is active. Your contacts are registered.';
  } else {
    response = 'END Invalid option.';
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

export default router;
