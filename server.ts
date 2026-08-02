import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import telnyxFactory from 'telnyx';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  // Initialize Supabase Client instead of pg for easy integration
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oirbmgpfqxojshfoguzo.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'XC8TtJsb1NefWm63';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times) {
          return Math.min(times * 50, 2000);
      }
  });

  const panicQueue = new Queue('panicDispatchPool', { connection: redisConnection });

  app.post('/api/integration/save-credentials', async (req, res) => {
      const { accountType, id, telnyx_api_key, telnyx_phone_number } = req.body;
      try {
          if (accountType === 'user') {
              await supabase.from('user_profiles').update({ telnyx_api_key, telnyx_phone_number }).eq('id', id);
          } else if (accountType === 'organisation') {
              await supabase.from('organisations').update({ telnyx_api_key, telnyx_phone_number }).eq('id', id);
          } else {
              return res.status(400).json({ error: "Invalid account type" });
          }
          return res.status(200).json({ message: "Telecom configurations successfully activated." });
      } catch (err) {
          console.error("Dashboard profile configuration write crash:", err);
          return res.status(500).json({ error: "Database configuration save error." });
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

  const panicWorker = new Worker('panicDispatchPool', async (job) => {
      const { userId, latitude, longitude, phone, message } = job.data;
      console.log(`[Queue Worker] Initiating dispatch for Job #${job.id} (name=${job.name})`);
      
      try {
          if (job.name === 'sms_dispatch') {
              // We just send the SMS if Telnyx credentials are in env, or log if they aren't.
              // We assume generic dispatch here because it's initiated directly by the native app.
              const targetApiKey = process.env.TELNYX_API_KEY;
              const targetFromPhone = process.env.TELNYX_PHONE_NUMBER;
              
              if (!targetApiKey || !targetFromPhone) {
                  console.warn(`[Mock Fallback] sms_dispatch requires TELNYX_API_KEY in env to send to ${phone}`);
                  return;
              }
              const telnyx = telnyxFactory(targetApiKey);
              await telnyx.messages.create({
                  to: phone, from: targetFromPhone, text: message
              });
              return;
          }

          // Query via Supabase for standard panic_signal
          const { data: userProfile } = await supabase
              .from('user_profiles')
              .select(`
                  name, 
                  telnyx_api_key, 
                  telnyx_phone_number,
                  linked_organisation_id
              `)
              .eq('id', userId)
              .single();

          let orgData = null;
          if (userProfile && userProfile.linked_organisation_id) {
              const { data } = await supabase
                  .from('organisations')
                  .select('telnyx_api_key, telnyx_phone_number, control_room_phone')
                  .eq('id', userProfile.linked_organisation_id)
                  .single();
              orgData = data;
          }

          if (!userProfile) {
              console.log(`[Mock Fallback] Profile ${userId} not in DB. Using fallback dispatch.`);
              return; 
          }

          let targetApiKey = userProfile.telnyx_api_key || (orgData && orgData.telnyx_api_key);
          let targetFromPhone = userProfile.telnyx_phone_number || (orgData && orgData.telnyx_phone_number);
          let controlRoomDestination = orgData && orgData.control_room_phone;

          if (!targetApiKey || !targetFromPhone) throw new Error("No active communication pathways loaded.");

          const telnyx = telnyxFactory(targetApiKey);
          const payload = `SafetyLink Emergency! Panic triggered by ${userProfile.name || 'Resident'}. Coordinates: ${latitude}, ${longitude}.`;
          
          await Promise.all([
              telnyx.calls.create({
                  to: controlRoomDestination, from: targetFromPhone,
                  connection_id: process.env.TELNYX_OUTBOUND_PROFILE_ID,
                  text_to_speech: { voice: "female", language: "en-US", text: payload }
              }).catch((e: any) => console.error("Voice delivery fallback channel failed:", e.message)),
              telnyx.messages.create({
                  to: controlRoomDestination, from: targetFromPhone, text: payload
              }).catch((e: any) => console.error("SMS channel execution error:", e.message))
          ]);
      } catch (e: any) {
          console.error(`[Worker Error] ${e.message}`);
      }
  }, { connection: redisConnection, concurrency: 15 });

  panicWorker.on('completed', (job) => console.log(`[Audit System] Job #${job.id} completed.`));
  panicWorker.on('failed', (job, err) => console.error(`[CRITICAL AUDIT FAIL] Job #${job?.id}:`, err.message));

  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
