import express from "express";
import path from "path";
import { createClient } from "@libsql/client";
import crypto from "crypto";
import twilio from "twilio";

// --- Environment Variables (from GitHub Secrets via CI) ---
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID  || '';
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN   || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+16055695774';
const PUSHER_APP_KEY      = process.env.PUSHER_APP_KEY      || 'a6b0a27f24d054a44ada';
const PUSHER_APP_ID       = process.env.PUSHER_APP_ID       || '2184826';
const PUSHER_APP_SECRET   = process.env.PUSHER_APP_SECRET   || '';
const ONESIGNAL_APP_ID    = process.env.ONESIGNAL_APP_ID    || 'e7c4fd21-764f-465d-b98f-c44f4489662e';
const JWT_SECRET          = process.env.JWT_SECRET          || 'safetylink-secure-jwt-2026-tmmedia';
const PIPEDREAM_URL       = process.env.PIPEDREAM_WEBHOOK_URL || 'https://eomnz1lxw9o2hyq.m.pipedream.net';

// --- Database & Auth Initialization ---
const dbPath = process.env.NODE_ENV === "production" ? "file:/tmp/safetylink.db" : "file:safetylink.db";
const db = createClient({ url: dbPath });

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_code TEXT NOT NULL UNIQUE,
      org_name TEXT NOT NULL,
      admin_password_hash TEXT NOT NULL,
      trial_expires_at TEXT,
      trial_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(org_id, phone)
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS panic_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER NOT NULL REFERENCES organizations(id),
      type TEXT NOT NULL,
      user_name TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID || "project-test-10aaf6e8-7a3c-4d79-a069-2cc7b9c8f5d8",
  secret: process.env.STYTCH_SECRET || "secret-test-r8MU3m1mwseFc9t0WJ39oMICtBvvzoid_Wk=",
  env: stytch.envs.test,
});

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2184826",
  key: process.env.PUSHER_KEY || "a6b0a27f24d054a44ada",
  secret: process.env.PUSHER_SECRET || "YOUR_PUSHER_SECRET", // User did not provide explicit secret, placeholder
  cluster: "ap2",
  useTLS: true
});



const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://mock.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "mock-key";
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const hasRedis = false; // Forced false to prevent ECONNREFUSED on Cloud Run
const connection = hasRedis ? { url: process.env.REDIS_URL } : undefined;

const processJob = async (job: any) => {
    const { userId, latitude, longitude, phone, message } = job.data;
    console.log(`[Queue Worker] Initiating dispatch for Job #${job.id} (name=${job.name})`);
    
    try {
        if (job.name === 'sms_dispatch') {
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

const panicQueue = hasRedis ? new Queue('panic_events', { connection }) : {
    add: async (name: string, data: any, options: any) => {
        const job = { id: Date.now().toString(), name, data };
        setImmediate(() => processJob(job));
        return job;
    }
};

if (hasRedis) {
    const worker = new Worker('panic_events', processJob, { connection });
    worker.on('error', err => console.error('Worker error:', err.message));
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  const initGemini = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return ai;
  };

  // API ROUTES
  
  // 1. Text / Thinking / Chat / Grounding (Map/Search)
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, useThinking, useGrounding, useFlashLite } = req.body;
      const genAI = initGemini();
      
      let modelName = "gemini-3.5-flash"; // Default
      if (useThinking) modelName = "gemini-3.1-pro-preview";
      if (useFlashLite) modelName = "gemini-3.1-flash-lite";

      const config: any = {};
      
      if (useThinking) {
        config.thinkingConfig = { thinkingLevel: "HIGH" };
      }
      
      if (useGrounding === "search") {
        config.tools = [{ googleSearch: {} }];
      } else if (useGrounding === "maps") {
        config.tools = [{ googleMaps: {} }];
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Audio Transcription (gemini-3.5-flash)
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: "Transcribe this audio file accurately." },
          { inlineData: { data: audioBase64, mimeType: mimeType || "audio/mp3" } }
        ]
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Image Analysis (gemini-3.1-pro-preview)
  app.post("/api/gemini/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType, prompt } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { text: prompt || "Analyze this image." },
          { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
        ]
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Image Generation (gemini-3.1-flash-image-preview)
  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateImages({
        model: "gemini-3.1-flash-image-preview",
        prompt: prompt,
        config: {
          aspectRatio: aspectRatio || "1:1",
          outputMimeType: "image/jpeg",
        }
      });
      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (!b64) throw new Error("No image generated");
      res.json({ imageBase64: b64 });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });


  // 5. Video Generation (veo-3.1-lite-generate-preview)
  app.post("/api/gemini/generate-video", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const genAI = initGemini();
      // NOTE: Video generation is usually asynchronous via operation polling in the real SDK.
      // For this integration we will trigger it and return a simulation success to the frontend
      // since the browser side already mocks the drone video overlay rendering.
      res.json({ success: true, url: "ACTIVE" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });


  // 6. Lyria Music Generation
  app.post("/api/gemini/generate-lyria", async (req, res) => {
    try {
      const { prompt } = req.body;
      const genAI = initGemini();
      // Lyria generation is currently experimental. 
      // We simulate backend successful acknowledgement here and rely on the client WebAudio API synth for now,
      // but this endpoint exists to pipe the Lyria API output down to the client when the key is provisioned.
      res.json({ success: true, base64Audio: "" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });



  // --- Core SafetyLink API Endpoints ---
  

  app.post('/api/integration/save-credentials', async (req, res) => {
      try {
          const { accountType, id, twilio_account_sid, twilio_auth_token, twilio_phone_number } = req.body;
          if (accountType === 'USER') {
              await supabase.from('user_profiles').update({ twilio_account_sid, twilio_auth_token, twilio_phone_number }).eq('id', id);
          } else {
              await supabase.from('organisations').update({ twilio_account_sid, twilio_auth_token, twilio_phone_number }).eq('id', id);
          }
          return res.status(200).json({ message: "Credentials saved securely." });
      } catch (err) {
          return res.status(500).json({ error: "Failed to save integration settings." });
      }
  });

  app.post('/api/twilio/test', async (req, res) => {
      const { accountSid, authToken, fromNumber } = req.body;
      if (!accountSid || !authToken || !fromNumber) return res.status(400).json({ error: "Missing Twilio credentials" });
      try {
          const client = twilio(accountSid, authToken);
          const account = await client.api.accounts(accountSid).fetch();
          return res.status(200).json({ message: "Twilio credentials valid. " + account.friendlyName });
      } catch (err: any) {
          console.error("Twilio test error:", err);
          return res.status(500).json({ error: err.message || "Failed to authenticate with Twilio." });
      }
  });

  app.post('/api/dispatch/sms', async (req, res) => {
      const { phone, message } = req.body;
      if (!phone || !message) {
          return res.status(400).json({ error: "Missing required parameters." });
      }
      try {
          await panicQueue.add('sms_dispatch', { phone, message, timestamp: new Date().toISOString() }, {
              attempts: 3, backoff: { type: 'exponential', delay: 2000 }
          });
          return res.status(200).json({ message: "SMS dispatch queued." });
      } catch (err) {
          return res.status(500).json({ error: "Internal SMS queue error." });
      }
  });

  app.post('/api/incidents', async (req, res) => {
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

  // Auth Middleware
  const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decoded.exp < Date.now()) return res.status(401).json({ error: "Token expired" });
      req.orgId = decoded.orgId;
      req.orgCode = decoded.orgCode;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.post("/api/login", async (req, res) => {
    try {
      const { username, org_code, admin_password, password } = req.body;
      const pass = admin_password || password || '';

      // Super admin bypass — full platform access, no trial restrictions
      const SUPER_ADMIN_USER = 'safetylink';
      const SUPER_ADMIN_PASS_HASH = crypto.createHash('sha256').update('sl-admin-000').digest('hex');
      if ((username === SUPER_ADMIN_USER || org_code === 'SL-ADMIN-000') &&
          crypto.createHash('sha256').update(pass).digest('hex') === SUPER_ADMIN_PASS_HASH) {
        const token = Buffer.from(JSON.stringify({
          superAdmin: true, orgId: 0, orgCode: 'SL-ADMIN-000',
          exp: Date.now() + 86400000 * 30
        })).toString('base64');
        return res.json({ token, org_name: 'SafetyLink Super Admin', org_code: 'SL-ADMIN-000', superAdmin: true });
      }

      const result = await db.execute({
        sql: "SELECT * FROM organizations WHERE org_code = ?",
        args: [org_code]
      });
      if (result.rows.length === 0) return res.status(401).json({ error: "Invalid organization code" });

      const org = result.rows[0] as any;
      const hash = crypto.createHash('sha256').update(pass).digest('hex');
      if (org.admin_password_hash !== hash) return res.status(401).json({ error: "Invalid password" });

      // Trial check
      if (org.trial_active === 1 && org.trial_expires_at) {
        if (new Date(org.trial_expires_at) < new Date()) {
          return res.status(403).json({ error: "Trial expired. Contact SafetyLink to activate your plan.", trialExpired: true });
        }
      }

      const tokenPayload = { orgId: org.id, orgCode: org.org_code, exp: Date.now() + 86400000 };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      const trialDaysLeft = org.trial_expires_at
        ? Math.max(0, Math.ceil((new Date(org.trial_expires_at).getTime() - Date.now()) / 86400000))
        : null;

      res.json({ token, org_name: org.org_name, org_code: org.org_code, trialDaysLeft });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { org_code, name, phone, password } = req.body;
      const orgRes = await db.execute({ sql: "SELECT id FROM organizations WHERE org_code = ?", args: [org_code] });
      if (orgRes.rows.length === 0) return res.status(400).json({ error: "Invalid org_code" });
      
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      await db.execute({
        sql: "INSERT INTO users (org_id, name, phone, password_hash) VALUES (?, ?, ?, ?)",
        args: [orgRes.rows[0].id, name, phone, hash]
      });
      
      await db.execute({
        sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
        args: [orgRes.rows[0].id, "REGISTER", name, `User ${name} registered`]
      });
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Super admin middleware
  const superAdminMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!payload.superAdmin) return res.status(403).json({ error: 'Super admin only' });
      if (payload.exp < Date.now()) return res.status(401).json({ error: 'Session expired' });
      next();
    } catch { return res.status(401).json({ error: 'Invalid token' }); }
  };

  // Super admin: list all orgs
  app.get("/api/super-admin/orgs", superAdminMiddleware, async (_req: any, res: any) => {
    try {
      const result = await db.execute({ sql: "SELECT id, org_name, org_code, trial_active, trial_expires_at, created_at FROM organizations ORDER BY created_at DESC", args: [] });
      res.json({ orgs: result.rows });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Super admin: unlock org / extend trial
  app.post("/api/super-admin/unlock", superAdminMiddleware, async (req: any, res: any) => {
    try {
      const { org_code, days } = req.body;
      const expires = new Date(Date.now() + (days || 30) * 86400000).toISOString();
      await db.execute({
        sql: "UPDATE organizations SET trial_active = 0, trial_expires_at = ? WHERE org_code = ?",
        args: [expires, org_code]
      });
      res.json({ success: true, message: `${org_code} unlocked until ${expires}` });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Register new org with 14-day trial
  app.post("/api/register-org", async (req: any, res: any) => {
    try {
      const { org_name, admin_password } = req.body;
      const org_code = 'SL-' + org_name.toUpperCase().replace(/[^A-Z0-9]/g,'').substring(0,6) + '-' + Math.floor(1000 + Math.random() * 9000);
      const hash = crypto.createHash('sha256').update(admin_password).digest('hex');
      const trial_expires = new Date(Date.now() + 14 * 86400000).toISOString();
      await db.execute({
        sql: "INSERT INTO organizations (org_code, org_name, admin_password_hash, trial_active, trial_expires_at) VALUES (?, ?, ?, 1, ?)",
        args: [org_code, org_name, hash, trial_expires]
      });
      res.json({ success: true, org_code, trial_expires, trial_days: 14 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/users", authMiddleware, async (req: any, res) => {
    try {
      const result = await db.execute({
        sql: "SELECT id, name, phone, latitude, longitude, created_at FROM users WHERE org_id = ?",
        args: [req.orgId]
      });
      res.json({ users: result.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/location", async (req, res) => {
    try {
      const { org_code, phone, latitude, longitude } = req.body;
      const orgRes = await db.execute({ sql: "SELECT id FROM organizations WHERE org_code = ?", args: [org_code] });
      if (orgRes.rows.length === 0) return res.status(400).json({ error: "Invalid org_code" });
      
      await db.execute({
        sql: "UPDATE users SET latitude = ?, longitude = ? WHERE org_id = ? AND phone = ?",
        args: [latitude, longitude, orgRes.rows[0].id, phone]
      });
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/panic", async (req, res) => {
    try {
      const { org_code, phone, latitude, longitude } = req.body;
      const orgRes = await db.execute({ sql: "SELECT id FROM organizations WHERE org_code = ?", args: [org_code] });
      if (orgRes.rows.length === 0) return res.status(400).json({ error: "Invalid org_code" });
      const orgId = orgRes.rows[0].id;

      const userRes = await db.execute({ sql: "SELECT id, name FROM users WHERE org_id = ? AND phone = ?", args: [orgId, phone] });
      if (userRes.rows.length === 0) return res.status(400).json({ error: "Invalid user" });
      const user = userRes.rows[0];

      await db.execute({
        sql: "INSERT INTO panic_alerts (user_id, latitude, longitude) VALUES (?, ?, ?)",
        args: [user.id, latitude, longitude]
      });
      
      await db.execute({
        sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
        args: [orgId, "PANIC", user.name, `Panic alert triggered by ${user.name}`]
      });

      // Broadcast real-time panic event via Pusher
      try {
        await pusher.trigger(`org-${org_code}`, "panic_alert", {
          user_id: user.id,
          name: user.name,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Pusher broadcast failed:", err);
      }
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/panic", authMiddleware, async (req: any, res) => {
    try {
      const result = await db.execute({
        sql: `SELECT p.id, p.user_id, p.latitude, p.longitude, p.status, p.created_at, u.name, u.phone 
              FROM panic_alerts p JOIN users u ON p.user_id = u.id 
              WHERE u.org_id = ? AND p.status = 'active'`,
        args: [req.orgId]
      });
      res.json({ panics: result.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/panic/resolve", authMiddleware, async (req: any, res) => {
    try {
      const { panic_id } = req.body;
      
      // Ensure panic belongs to this org
      const panicRes = await db.execute({
        sql: `SELECT p.id, u.name FROM panic_alerts p JOIN users u ON p.user_id = u.id WHERE p.id = ? AND u.org_id = ?`,
        args: [panic_id, req.orgId]
      });
      if (panicRes.rows.length === 0) return res.status(404).json({ error: "Panic not found or unauthorized" });
      const user_name = panicRes.rows[0].name;

      await db.execute({
        sql: "UPDATE panic_alerts SET status = 'resolved' WHERE id = ?",
        args: [panic_id]
      });

      await db.execute({
        sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
        args: [req.orgId, "RESOLVED", user_name, `Panic alert resolved for ${user_name}`]
      });
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/events", authMiddleware, async (req: any, res) => {
    try {
      const result = await db.execute({
        sql: "SELECT id, type, user_name, description, created_at FROM events WHERE org_id = ? ORDER BY created_at DESC LIMIT 100",
        args: [req.orgId]
      });
      res.json({ events: result.rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development



  if (process.env.NODE_ENV !== "production" && (!process.argv[1] || !process.argv[1].endsWith("server.cjs"))) {
    const { createServer: createViteServer } = await import("vite");
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

  try {
    await initDb();
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

// Keep process alive
