// server/vapi-panic.js
// SafetyLink — VAPI Inbound Panic Handler
// Fires the full alert chain the moment a call comes in
// Deploy on Oracle VPS alongside main server/index.js

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
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: 'safetylink:panic:inbound',
});

// ── EMERGENCY CONTACTS LOOKUP ──────────────────────────────────────────────
// Replace with your actual DB/Firestore lookup
async function getContactsForNumber(phoneNumber) {
  // TODO: query Firestore/Room for registered contacts
  // Returns array of { name, phone } objects
  // Fallback: command center always receives alert
  return [
    { name: 'SafetyLink Command', phone: process.env.COMMAND_CENTER_NUMBER },
  ];
}

// ── CORE ALERT CHAIN ───────────────────────────────────────────────────────
async function fireAllAlerts({ callerNumber, callerName, location, trigger, contacts, recordingUrl }) {
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

  // 1. TWILIO SMS → all contacts
  for (const c of contacts) {
    jobs.push(
      twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_NUMBER,
        to: c.phone,
      }).catch(e => console.error('[Twilio SMS]', e.message))
    );
  }

  // 2. TWILIO WHATSAPP → all contacts
  for (const c of contacts) {
    jobs.push(
      twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WA}`,
        to: `whatsapp:${c.phone}`,
      }).catch(e => console.error('[Twilio WA]', e.message))
    );
  }

  // 3. VAPI OUTBOUND CALL → primary contact
  // Calls the first contact and reads the alert via AI voice
  if (contacts[0]) {
    jobs.push(
      axios.post('https://api.vapi.ai/call', {
        phoneNumberId: process.env.VAPI_PHONE_ID,
        customer: { number: contacts[0].phone },
        assistant: {
          firstMessage: `This is SafetyLink AI emergency alert. ${callerName || 'A registered user'} has triggered a panic call from number ${callerNumber}. Their location is ${locationText}. Please respond immediately. Press 1 to call them back now.`,
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            systemPrompt: 'You are a SafetyLink emergency notification agent. Read the alert clearly and ask the recipient to confirm they received it. If they press 1, initiate a callback. Keep the call under 60 seconds.',
            temperature: 0.2,
          },
          voice: {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM',
          },
          endCallFunctionEnabled: true,
          maxDurationSeconds: 90,
          recordingEnabled: false,
        },
      }, {
        headers: { Authorization: `Bearer ${process.env.VAPI_KEY}` },
      }).catch(e => console.error('[VAPI Outbound]', e.message))
    );
  }

  // 4. BLAND.AI VOICE CALL → secondary contact fallback
  if (contacts[1]) {
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
      }).catch(e => console.error('[Bland.ai]', e.message))
    );
  }

  // 5. INFOBIP SMS FALLBACK → all contacts
  jobs.push(
    axios.post(`https://${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      messages: contacts.map(c => ({
        from: 'SafetyLink',
        to: [{ to: c.phone }],
        text: message,
      })),
    }, {
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }).catch(e => console.error('[Infobip]', e.message))
  );

  // 6. TELEGRAM → command center
  if (process.env.TELEGRAM_BOT && process.env.TELEGRAM_CHAT) {
    jobs.push(
      axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT,
        text: message,
        parse_mode: 'HTML',
      }).catch(e => console.error('[Telegram]', e.message))
    );
  }

  // 7. UPSTASH — log alert
  jobs.push(
    redis.lpush('safetylink:alerts', JSON.stringify({
      type: 'INBOUND_CALL',
      caller: callerNumber,
      name: callerName,
      location,
      trigger,
      recordingUrl,
      timestamp: new Date().toISOString(),
    })).catch(e => console.error('[Upstash log]', e.message))
  );

  // Fire all simultaneously — never block the response
  await Promise.allSettled(jobs);
}

// ── VAPI WEBHOOK ENDPOINT ──────────────────────────────────────────────────
// VAPI calls this URL at each stage of the inbound call lifecycle
router.post('/vapi/webhook', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ result: 'ok' });

  const type         = message.type;
  const call         = message.call || {};
  const callerNumber = call.customer?.number || 'unknown';
  const callId       = call.id || 'unknown';

  // Rate limit by caller number
  const { success } = await ratelimit.limit(callerNumber);
  if (!success) {
    console.log(`[Rate limit] ${callerNumber} exceeded panic rate`);
    return res.json({ result: 'rate_limited' });
  }

  // ── CALL STARTED — fire immediately ──────────────────────────────────────
  if (type === 'call-started' || type === 'assistant-request') {
    console.log(`[VAPI] Inbound panic call from ${callerNumber} — ID: ${callId}`);

    const contacts = await getContactsForNumber(callerNumber);

    // Fire the full alert chain WITHOUT waiting — respond to VAPI instantly
    fireAllAlerts({
      callerNumber,
      callerName:   null,
      location:     null,
      trigger:      'INBOUND_CALL',
      contacts,
      recordingUrl: null,
    });

    // Respond to VAPI — this controls what the agent says
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

  // ── TRANSCRIPT UPDATE — extract location if caller speaks it ─────────────
  if (type === 'transcript') {
    const transcript = message.transcript || '';
    console.log(`[VAPI Transcript] ${callerNumber}: ${transcript}`);

    // Simple GPS extraction if caller says coordinates or address
    // In production: pass transcript to Gemini for NLP extraction
    await redis.append(
      `safetylink:call:${callId}:transcript`,
      transcript + '\n'
    );
  }

  // ── CALL ENDED — attach recording ────────────────────────────────────────
  if (type === 'end-of-call-report') {
    const recordingUrl  = message.recordingUrl || null;
    const transcript    = message.transcript || '';
    const durationSecs  = message.durationSeconds || 0;

    console.log(`[VAPI] Call ended. Duration: ${durationSecs}s. Recording: ${recordingUrl}`);

    // Upload recording to Cloudinary as evidence
    let evidenceUrl = recordingUrl;
    if (recordingUrl) {
      try {
        const upload = await cloudinary.uploader.upload(recordingUrl, {
          resource_type: 'video',
          folder: 'safetylink/evidence/calls',
          public_id: `panic_call_${callId}_${Date.now()}`,
        });
        evidenceUrl = upload.secure_url;
      } catch (e) {
        console.error('[Cloudinary evidence]', e.message);
      }
    }

    // Update alert log with recording
    await redis.lpush('safetylink:alerts:recordings', JSON.stringify({
      callId,
      callerNumber,
      recordingUrl: evidenceUrl,
      transcript,
      durationSecs,
      timestamp: new Date().toISOString(),
    })).catch(() => {});

    // Send recording link to contacts via WhatsApp
    const contacts = await getContactsForNumber(callerNumber);
    if (evidenceUrl && contacts.length) {
      for (const c of contacts) {
        twilioClient.messages.create({
          body: `SafetyLink — Panic call recording from ${callerNumber}:\n${evidenceUrl}\nDuration: ${durationSecs}s`,
          from: `whatsapp:${process.env.TWILIO_WA}`,
          to: `whatsapp:${c.phone}`,
        }).catch(() => {});
      }
    }

    return res.json({ result: 'ok' });
  }

  return res.json({ result: 'ok' });
});

// ── MAIN PANIC ENDPOINT (data-based trigger) ───────────────────────────────
// Used by app when data is available — same alert chain
router.post('/api/panic', async (req, res) => {
  const {
    userId, name, lat, lon, trigger,
    contacts: reqContacts, photoBase64,
  } = req.body;

  const { success } = await ratelimit.limit(userId || req.ip);
  if (!success) return res.status(429).json({ error: 'Rate limited' });

  let photoUrl = null;
  if (photoBase64) {
    try {
      const upload = await cloudinary.uploader.upload(photoBase64, {
        folder: 'safetylink/evidence/photos',
        public_id: `panic_photo_${userId}_${Date.now()}`,
      });
      photoUrl = upload.secure_url;
    } catch (e) {
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

// ── USSD ENDPOINT (Africa's Talking) ──────────────────────────────────────
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

/*
─────────────────────────────────────────────────────────
.env VARIABLES NEEDED ON ORACLE VPS
─────────────────────────────────────────────────────────
VAPI_KEY=
VAPI_PHONE_ID=
VAPI_WEBHOOK_SECRET=
BLAND_API_KEY=
BLAND_VOICE_ID=45bfac80-786f-409e-acd0-6c424603a12e
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_NUMBER=+16055695774
TWILIO_WA=
INFOBIP_BASE_URL=y4jwjd.api.infobip.com
INFOBIP_API_KEY=
TELEGRAM_BOT=
TELEGRAM_CHAT=
CLOUDINARY_CLOUD=qcp4fx2v
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
COMMAND_CENTER_NUMBER=+27739441222

─────────────────────────────────────────────────────────
MOUNT THIS IN YOUR MAIN server/index.js
─────────────────────────────────────────────────────────
import panicRouter from './vapi-panic.js';
app.use('/', panicRouter);

─────────────────────────────────────────────────────────
VAPI DASHBOARD SETUP
─────────────────────────────────────────────────────────
1. Go to dashboard.vapi.ai
2. Phone Numbers → your inbound number
3. Set Assistant: "Inbound Webhook" 
4. Server URL: https://api.safetylink.online/vapi/webhook
5. This file handles the rest automatically

─────────────────────────────────────────────────────────
CALL FLOW SUMMARY
─────────────────────────────────────────────────────────
Caller dials SafetyLink number
    ↓ (instantly — same second)
VAPI webhook fires → this server receives call-started
    ↓
getContactsForNumber() → fetch registered contacts
    ↓ (all fire simultaneously via Promise.allSettled)
├── Twilio SMS → all contacts
├── Twilio WhatsApp → all contacts  
├── VAPI outbound call → contact 1 (AI voice alert)
├── Bland.ai call → contact 2 (fallback voice)
├── Infobip SMS → all contacts (fallback)
├── Telegram → command center
└── Upstash Redis → log alert
    ↓
VAPI agent speaks to caller: "Stay on the line. Help is coming."
    ↓
Agent keeps caller calm, extracts location if possible
    ↓
Call ends → recording uploaded to Cloudinary as evidence
    ↓
Recording URL sent to contacts via WhatsApp
*/
