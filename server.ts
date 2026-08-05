import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
// In-memory queue fallback for environment without Redis
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';
const supabase = createClient(supabaseUrl, supabaseKey);
import { Queue, Worker } from 'bullmq';
import twilio from 'twilio';
import path from 'path';


async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  
    // BullMQ / Redis conditionally loaded
  const hasRedis = !!process.env.REDIS_URL;
  const connection = hasRedis ? { url: process.env.REDIS_URL } : undefined;
  
  const panicQueue = hasRedis ? new Queue('panic_events', { connection }) : {
    add: async (name, data, options) => {
      const job = { id: Date.now().toString(), name, data };
      setImmediate(() => processJob(job));
      return job;
    }
  };
  
  if (hasRedis) {
    const worker = new Worker('panic_events', async (job) => {
      await processJob(job);
    }, { connection });
    worker.on('error', err => console.error('Worker error:', err));
  }
  
  if (panicQueue && typeof panicQueue.on === 'function') {
    panicQueue.on('error', err => console.error('Queue error:', err));
  }


  app.post('/api/integration/save-credentials', async (req, res) => {
      const { accountType, id, twilio_account_sid, twilio_auth_token, twilio_phone_number } = req.body;
      try {
          if (accountType === 'user') {
              await supabase.from('user_profiles').update({ twilio_account_sid, twilio_auth_token, twilio_phone_number }).eq('id', id);
          } else if (accountType === 'organisation') {
              await supabase.from('organisations').update({ twilio_account_sid, twilio_auth_token, twilio_phone_number }).eq('id', id);
          } else {
              return res.status(400).json({ error: "Invalid account type" });
          }
          return res.status(200).json({ message: "Telecom configurations successfully activated." });
      } catch (err) {
          console.error("Dashboard profile configuration write crash:", err);
          return res.status(500).json({ error: "Database configuration save error." });
      }
  });

  
  
    app.post('/api/twilio/test', async (req, res) => {
      const { accountSid, authToken, fromNumber } = req.body;
      if (!accountSid || !authToken || !fromNumber) return res.status(400).json({ error: "Missing Twilio credentials" });
      try {
          const client = twilio(accountSid, authToken);
          // Just validating the client can be initialized and fetch account details
          const account = await client.api.accounts(accountSid).fetch();
          return res.status(200).json({ message: "Twilio credentials valid. " + account.friendlyName });
      } catch (err) {
          console.error("Twilio test error:", err);
          return res.status(500).json({ error: err.message || "Failed to authenticate with Twilio." });
      }
  });

  app.post('/api/dispatch/sms', async (req, res) => {
      // Stub for SMS dispatch from Android native app
      const { phone, message } = req.body;
      if (!phone || !message) {
          return res.status(400).json({ error: "Missing required parameters." });
      }
      try {
          // Simply push to the same queue for processing or handle directly
          await panicQueue.add('sms_dispatch', { phone, message, timestamp: new Date().toISOString() }, {
              attempts: 3, backoff: { type: 'exponential', delay: 2000 }
          });
          return res.status(200).json({ message: "SMS dispatch queued." });
      } catch (err) {
          return res.status(500).json({ error: "Internal SMS queue error." });
      }
  });

  app.post('/api/incidents', async (req, res) => {
      // Endpoint for Android app to log incidents
      const { id, latitude, longitude, description, org_id, triggered_by, status, severity } = req.body;
      try {
          await supabase.from('org_events').insert([{
              id, latitude, longitude, description, org_id, triggered_by, status, severity
          }]);
          return res.status(201).json({ message: "Incident logged." });
      } catch (err) {
          return res.status(500).json({ error: "Failed to log incident." });
      }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, location } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `User message: "${message}". Current location: ${location ? JSON.stringify(location) : 'unknown'}. You are Kleva, a highly tactical AI assistant for a safety app called SafetyLink. Respond concisely to the user in a professional, tactical tone.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      res.json({ reply: response.text });
    } catch (e) {
      console.error('Gemini chat error:', e);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  app.post('/api/panic/trigger', async (req, res) => {
      const { userId, latitude, longitude } = req.body;
      if (!userId || !latitude || !longitude) {
          return res.status(400).json({ error: "Missing required emergency location parameters." });
      }
      try {
          const job = await panicQueue.add(`panic_signal_${Date.now()}`, {
              userId, latitude, longitude, timestamp: new Date().toISOString()
          }, {
              attempts: 5,
              backoff: { type: 'exponential', delay: 2000 }
          });
          return res.status(202).json({ 
               status: "Accepted", 
               message: "Emergency pipeline established. Dispatches firing.",
              eventId: job.id
          });
      } catch (error) {
          console.error("Critical entry-queue storage blockage:", error);
          return res.status(500).json({ error: "Internal crash entering panic queue buffer." });
      }
  });

  
  const processJob = async (job: any) => {

      const { userId, latitude, longitude, phone, message } = job.data;
      console.log(`[Queue Worker] Initiating dispatch for Job #${job.id} (name=${job.name})`);
      
      try {
          if (job.name === 'sms_dispatch') {
              // We just send the SMS if Twilio credentials are in env, or log if they aren't.
              // We assume generic dispatch here because it's initiated directly by the native app.
              const targetApiKey = process.env.TWILIO_ACCOUNT_SID;
              const targetFromPhone = process.env.TWILIO_PHONE_NUMBER;
              
              if (!targetApiKey || !targetFromPhone) {
                  console.warn(`[Mock Fallback] sms_dispatch requires TWILIO_ACCOUNT_SID in env to send to ${phone}`);
                  return;
              }
              const client = twilio(targetApiKey, process.env.TWILIO_AUTH_TOKEN || "mock-token");
              await client.messages.create({
                  to: phone, from: targetFromPhone, body: message
              });
              return;
          }

          // Query via Supabase for standard panic_signal
          const { data: userProfile } = await supabase
              .from('user_profiles')
              .select(`
                  name, 
                  twilio_account_sid, 
                  twilio_phone_number,
                  linked_organisation_id
              `)
              .eq('id', userId)
              .single();

          let orgData = null;
          if (userProfile && userProfile.linked_organisation_id) {
              const { data } = await supabase
                  .from('organisations')
                  .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, control_room_phone')
                  .eq('id', userProfile.linked_organisation_id)
                  .single();
              orgData = data;
          }

          if (!userProfile) {
              console.log(`[Mock Fallback] Profile ${userId} not in DB. Using fallback dispatch.`);
              return; 
          }

          let targetApiKey = userProfile.twilio_account_sid || (orgData && orgData.twilio_account_sid) || process.env.TWILIO_ACCOUNT_SID;
          let targetFromPhone = userProfile.twilio_phone_number || (orgData && orgData.twilio_phone_number) || process.env.TWILIO_PHONE_NUMBER;
          let controlRoomDestination = orgData && orgData.control_room_phone;

          if (!targetApiKey || !targetFromPhone) throw new Error("No active communication pathways loaded.");

          const client = twilio(targetApiKey, process.env.TWILIO_AUTH_TOKEN || "mock-token");
          const payload = `SafetyLink Emergency! Panic triggered by ${userProfile.name || 'Resident'}. Coordinates: ${latitude}, ${longitude}.`;
          
          await Promise.all([
              client.calls.create({
                  to: controlRoomDestination, from: targetFromPhone,
                  connection_id: process.env.TWILIO_OUTBOUND_PROFILE_ID,
                  twiml: `<Response><Say voice="alice">${payload}</Say></Response>`
              }).catch((e: any) => console.error("Voice delivery fallback channel failed:", e.message)),
              client.messages.create({
                  to: controlRoomDestination, from: targetFromPhone, body: payload
              }).catch((e: any) => console.error("SMS channel execution error:", e.message))
          ]);
      } catch (e: any) {
          console.error(`[Worker Error] ${e.message}`);
      }
  
  };


  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  const fs = await import('fs');
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));
  
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
