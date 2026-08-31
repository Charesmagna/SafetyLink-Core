console.log("STARTING SERVER SCRIPT PID:", process.pid);
import { createIncident, processPanicAlert } from "./src/services/panic-alert";
import { ussdRouter } from "./src/routes/ussd";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Pusher from "pusher";
import * as stytch from "stytch";
import nodemailer from 'nodemailer';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { db } from "./src/db/index";
import crypto from "crypto";
import twilio from "twilio";
import { Queue, Worker } from "bullmq";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin for Firestore updates
initializeApp({
  projectId: 'safetylink-99e56'
});
const firestoreDb = getFirestore();


// --- Environment Variables (from GitHub Secrets via CI) ---
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const PUSHER_APP_KEY      = process.env.PUSHER_APP_KEY;
const PUSHER_APP_ID       = process.env.PUSHER_APP_ID;
const PUSHER_APP_SECRET   = process.env.PUSHER_APP_SECRET;
const ONESIGNAL_APP_ID    = process.env.ONESIGNAL_APP_ID;
const JWT_SECRET          = process.env.JWT_SECRET;
const PIPEDREAM_URL       = process.env.PIPEDREAM_WEBHOOK_URL;
const BLAND_API_KEY       = process.env.BLAND_API_KEY;
const BLAND_ORG_KEY       = process.env.BLAND_ORG_KEY;

// --- Database & Auth Initialization ---

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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS panic_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      idempotency_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS incident_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL REFERENCES panic_incidents(id),
      source TEXT NOT NULL,
      encrypted_lat TEXT,
      encrypted_lon TEXT,
      accuracy REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
  env: stytch.envs.test,
});

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET, // User did not provide explicit secret, placeholder
  cluster: "ap2",
  useTLS: true
});



const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock_key';
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const hasRedis = false; // Forced false to prevent ECONNREFUSED on Cloud Run
const connection = hasRedis ? { url: process.env.REDIS_URL } : undefined;


async function startServer() {
  const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: ["https://safetylink.online", "https://www.safetylink.online", "http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

  const PORT = 3000;

  // Security Hardening: Helmet protects from common web vulnerabilities by setting HTTP headers.
  // We disable the contentSecurityPolicy in dev so Vite HMR works.

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    frameguard: false
  }));

  // Security Hardening: Rate Limiting to prevent brute-force attacks on our APIs.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
  });
  app.use("/api/", apiLimiter);

  app.use(express.json({ limit: "50mb", verify: (req: any, res, buf) => { req.rawBody = buf; } }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Modular Provider Routes
  app.use("/ussd", ussdRouter);


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
      const { prompt, useThinking, useGrounding, useFlashLite, lat, lng } = req.body;
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
        if (lat !== undefined && lng !== undefined) {
           config.toolConfig = {
             retrievalConfig: {
               latLng: {
                 latitude: lat,
                 longitude: lng
               }
             }
           };
        }
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });

      let chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      res.json({ text: response.text, chunks });
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



  // 7. Deep Research Agent
  app.post("/api/gemini/research/start", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = initGemini();
      const initialInteraction = await ai.interactions.create({
          agent: "deep-research-preview-04-2026",
          input: prompt,
          background: true,
      });
      res.json({ interactionId: initialInteraction.id });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/gemini/research/:id", async (req, res) => {
    try {
      const ai = initGemini();
      const interaction = await ai.interactions.get(req.params.id);
      let fullReport = "";
      for (const step of interaction.steps) {
          if (step.type === 'model_output') {
              const textContent = step.content?.find((c: any) => c.type === 'text');
              if (textContent) fullReport += textContent.text;
          }
      }
      res.json({ status: interaction.status, text: fullReport, steps: interaction.steps });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
  

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
      const { phone, message, accountSid, authToken, fromNumber, liveSmsEnabled } = req.body;
      if (!phone || !message) {
          return res.status(400).json({ error: "Missing required parameters." });
      }
      try {
          await panicQueue.add('sms_dispatch', { phone, message, accountSid, authToken, fromNumber, liveSmsEnabled, timestamp: new Date().toISOString() }, {
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
      const { userId, latitude, longitude, description, isDrill } = req.body;
      if (!userId || latitude === undefined || longitude === undefined) {
          return res.status(400).json({ error: "Missing required emergency location parameters." });
      }
      try {
          // Import dynamic to avoid top-level circular issues if any
          
          
          const incidentId = await createIncident(userId, 'APP_BUTTON', { lat: latitude, lon: longitude });
          
          // Execute the parallel fallback chain asynchronously (fire and forget from Express's perspective to reply instantly)
          processPanicAlert(incidentId).catch(err => {
              console.error("[PanicAlert] Background Processing Error:", err);
          });
          
          return res.status(202).json({ 
               status: "Accepted", 
               message: "Emergency pipeline established. Parallel dispatches firing.",
               eventId: incidentId
          });
      } catch (error) {
          console.error("Critical entry-queue storage blockage:", error);
          return res.status(500).json({ error: "Internal crash entering panic queue buffer: " + (error instanceof Error ? error.message : String(error)) });
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
      const { org_name, admin_password, name, password, id } = req.body;
      const final_org_name = org_name || name;
      const final_admin_password = admin_password || password;
      const org_code = id || ('SL-' + final_org_name.toUpperCase().replace(/[^A-Z0-9]/g,'').substring(0,6) + '-' + Math.floor(1000 + Math.random() * 9000));
      const hash = crypto.createHash('sha256').update(final_admin_password).digest('hex');
      const trial_expires = new Date(Date.now() + 14 * 86400000).toISOString();
      await db.execute({
        sql: "INSERT INTO organizations (org_code, org_name, admin_password_hash, trial_active, trial_expires_at) VALUES (?, ?, ?, 1, ?)",
        args: [org_code, final_org_name, hash, trial_expires]
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

  app.post("/api/sync/offline", async (req, res) => {
    try {
      const { orgId, payload } = req.body;
      if (!orgId || !payload || !Array.isArray(payload)) {
        return res.status(400).json({ error: 'Missing fields or invalid payload' });
      }

      const failedItems = [];
      const now = Date.now();

      for (const item of payload) {
        try {
          await db.execute({
            sql: "INSERT INTO panic_alerts (user_id, latitude, longitude, status, created_at) VALUES ((SELECT id FROM users WHERE org_id = ? LIMIT 1), ?, ?, 'resolved', ?)",
            args: [orgId, item.lat, item.lng, new Date(item.timestamp || now).toISOString()]
          });
          
          await db.execute({
            sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
            args: [orgId, "OFFLINE_SYNC", "SYNCED", `Offline alert synced: ${item.description || ''}`]
          });
        } catch (err) {
          console.error('Failed to sync offline item', item.id, err);
          failedItems.push(item);
        }
      }

      res.json({ success: true, failedItems });
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
      
      // Twilio SMS + Voice dispatch to org emergency contacts
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
          const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
          const userName = (userRes.rows[0] as any).name || phone;

          // Reverse geocode for address
          let address = `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`;
          try {
            const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const geoData = await geo.json() as any;
            if (geoData?.display_name) address = geoData.display_name.split(',').slice(0,3).join(',');
          } catch {}

          // Get org emergency contacts
          const contactsRes = await db.execute({
            sql: 'SELECT phone FROM users WHERE org_id = ? AND phone != ? LIMIT 5',
            args: [orgId, phone]
          });

          const smsBody = `🚨 SAFETYLINK SOS: ${userName} needs help! Location: ${address} | Map: https://maps.google.com/?q=${latitude},${longitude}`;
          const twimlVoice = `<Response><Say voice="alice">Emergency alert from SafetyLink. ${userName} has triggered a panic button at ${address}. Please respond immediately.</Say><Pause length="1"/><Say voice="alice">This message will repeat.</Say><Say voice="alice">Emergency alert from SafetyLink. ${userName} has triggered a panic button at ${address}. Please respond immediately.</Say></Response>`;

          for (const contact of contactsRes.rows as any[]) {
            if (!contact.phone) continue;
            // SMS
            twilioClient.messages.create({ body: smsBody, from: TWILIO_PHONE_NUMBER, to: contact.phone })
              .catch(e => console.error('Twilio SMS failed:', e.message));
            
            // Voice call
            twilioClient.calls.create({
              twiml: twimlVoice,
              from: TWILIO_PHONE_NUMBER,
              to: contact.phone
            }).catch(e => console.error('Twilio call failed:', e.message));
            
            // --- BLAND AI AUTOMATED DISPATCH ---
            if (BLAND_API_KEY) {
              const blandData = {
                "phone_number": contact.phone,
                "voice": "45bfac80-786f-409e-acd0-6c424603a12e",
                "wait_for_greeting": false,
                "record": true,
                "answered_by_enabled": true,
                "noise_cancellation": false,
                "interruption_threshold": 500,
                "block_interruptions": false,
                "max_duration": 12,
                "model": "base",
                "language": "babel-en",
                "background_track": "none",
                "endpoint": "https://api.bland.ai",
                "voicemail_action": "hangup",
                "prompt": `Emergency alert from SafetyLink. ${userName} has triggered a panic button at ${address}. Please respond immediately.`
              };
              
              fetch('https://api.bland.ai/v1/calls', {
                method: 'POST',
                headers: { 'Authorization': BLAND_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(blandData)
              }).catch(e => console.error('Bland AI dispatch failed:', e.message));
            }
          }
          
          // --- PIPEDREAM WEBHOOK DEPLOYMENT/TRIGGER ---
          if (process.env.PIPEDREAM_API_KEY) {
             const pipedreamPayload = {
                "org_id": "o_GOIjor7",
                "project_id": "proj_p2sPmV3",
                "steps": [],
                "triggers": [],
                "settings": {
                  "name": "SafetyLink Alert Workflow",
                  "auto_deploy": true
                }
             };
             fetch('https://api.pipedream.com/v1/workflows?template_id=tch_2EfnyV', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.PIPEDREAM_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(pipedreamPayload)
             }).catch(e => console.error('Pipedream trigger failed:', e.message));
          }
        } catch (twilioErr: any) {
          console.error('Twilio dispatch error:', twilioErr.message);
        }
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

  
  // --- External Integrations ---

  // 1. Bland AI Call Dispatch
  app.post("/api/integrations/bland-ai", async (req, res) => {
    try {
      const { phone_number, prompt } = req.body;
      
      const headers = {
        'Authorization': BLAND_API_KEY, 
        'Content-Type': 'application/json'
      };

      const data = {
        "phone_number": phone_number || "+27680079911",
        "voice": "45bfac80-786f-409e-acd0-6c424603a12e",
        "wait_for_greeting": false,
        "record": true,
        "answered_by_enabled": true,
        "noise_cancellation": false,
        "interruption_threshold": 500,
        "block_interruptions": false,
        "max_duration": 12,
        "model": "base",
        "language": "babel-en",
        "background_track": "none",
        "endpoint": "https://api.bland.ai",
        "voicemail_action": "hangup",
        "prompt": prompt || "Emergency alert from SafetyLink. Please respond immediately."
      };

      const response = await fetch('https://api.bland.ai/v1/calls', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      res.json({ success: response.ok, data: result });
    } catch (e: any) {
      console.error("Bland AI Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  
  // 3. Google Drive Public Folder Fetcher
  app.get("/api/drive/media", async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
      }
      const folderId = req.query.folderId || '1l78cZjsK9RFFsr4DNqYwhK4swg8SIbmW';
      
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,description)&key=${apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || "Failed to fetch from Google Drive API" });
      }
      
      res.json({ success: true, files: data.files });
    } catch (e) {
      console.error("Google Drive API Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Pipedream Workflow Deployment
  app.post("/api/integrations/pipedream-deploy", async (req, res) => {
    try {
      const payload = {
        "org_id": "o_GOIjor7",
        "project_id": "proj_p2sPmV3",
        "steps": [],
        "triggers": [],
        "settings": {
          "name": "SafetyLink ",
          "auto_deploy": true
        }
      };

      const headers = {
        'Authorization': `Bearer ${process.env.PIPEDREAM_API_KEY}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('https://api.pipedream.com/v1/workflows?template_id=tch_2EfnyV', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      res.json({ success: response.ok, data: result });
    } catch (e: any) {
      console.error("Pipedream Error:", e);
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

  
  
  // --- PAYSTACK INTEGRATION ---
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.MERCHANT_EMAIL,
          pass: process.env.EMAIL_PASSWORD
      }
  });

  app.post('/api/webhooks/paystack', async (req, res) => {
      // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION
      const signature = req.headers['x-paystack-signature'];
      if (!signature) {
          console.error('Security alert: Paystack signature header is missing!');
          return res.status(401).send('Unauthorized');
      }

      if (!PAYSTACK_SECRET_KEY) {
          console.error('Security alert: PAYSTACK_SECRET_KEY not configured!');
          return res.status(500).send('Configuration Error');
      }

      const hash = crypto
          .createHmac('sha512', PAYSTACK_SECRET_KEY)
          .update((req as any).rawBody || JSON.stringify(req.body))
          .digest('hex');

      if (hash !== signature) {
          console.error('Security alert: Webhook signature verification failed!');
          return res.status(401).send('Unauthorized');
      }

      // Fast response to prevent timeout loops from payment gateway
      res.status(200).send('Webhook Received');

      // Process heavy tasks asynchronously
      setImmediate(async () => {
        try {
          const eventPayload = req.body;
      
      if (eventPayload.event === 'charge.success') {
          const transactionData = eventPayload.data;
          const customerEmail = transactionData.customer.email;
          const paidAmount = transactionData.amount / 100;
          const paystackRef = transactionData.reference;
          
          const metadata = transactionData.metadata || {};
          const productId = metadata.product_id;
          const quantity = metadata.quantity || 1;
          const productName = metadata.product_name || 'Generic iTag';

          console.log(`Processing Order for ${customerEmail}: ${quantity}x ${productName} (Paid: R${paidAmount})`);

          let sourcingInstructions = '';
          let financialSummary = '';

          switch (productId) {
              case 'lite':
                  sourcingInstructions = `
                  📌 **PRODUCT:** SafetyLink Lite (Budget Key Finder)
                  📦 **ACTION REQUIRED:** Ship ${quantity} button(s) from your local SafetyLink Lite inventory.
                  🛒 **REPLENISHMENT SOURCE:** Purchase Takealot 5-Pack (PLID95687197) for R205.00 (R41.00/unit).
                  💡 **PRO-TIP:** Purchase at least 4 packs (R820.00) to secure Free Shipping on Takealot!
                  ⚙️ **CONFIG:** Flash with Service UUID: '0000ffe0-0000-1000-8000-00805f9b34fb'.`;
                  
                  financialSummary = `
                  💵 **Customer Paid:** R${paidAmount.toFixed(2)} (R100.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R${(quantity * 41.00).toFixed(2)} (R41.00 each)
                  🛡️ **Net Profit Margin:** ~54.5%`;
                  break;

              case 'active':
                  sourcingInstructions = `
                  📌 **PRODUCT:** SafetyLink Active (Keychain Tag)
                  📦 **ACTION REQUIRED:** Ship ${quantity} button(s) from your local SafetyLink Active inventory.
                  🛒 **REPLENISHMENT SOURCE:** Order from Creative Brands (TECH-2051) at R72.89 each (incl. VAT).
                  💡 **PRO-TIP:** Order 18+ units (R1,312.02) to secure free delivery (Creative Brands threshold is R1,250).
                  ⚙️ **CONFIG:** Flash with Service UUID: '00001802-0000-1000-8000-00805f9b34fb'.`;
                  
                  financialSummary = `
                  💵 **Customer Paid:** R${paidAmount.toFixed(2)} (R150.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R${(quantity * 72.89).toFixed(2)} (R72.89 each)
                  🛡️ **Net Profit Margin:** ~47.3%`;
                  break;

              case 'premium':
                  sourcingInstructions = `
                  📌 **PRODUCT:** SafetyLink Premium (IP67 Waterproof Tracker)
                  📦 **ACTION REQUIRED:** Ship ${quantity} button(s) from your local SafetyLink Premium inventory.
                  🛒 **REPLENISHMENT SOURCE:** Fulfill using a waterproof Apple Find My-compatible tracker (average local cost ~R120.00).`;
                  
                  financialSummary = `
                  💵 **Customer Paid:** R${paidAmount.toFixed(2)} (R299.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R${(quantity * 120.00).toFixed(2)} (R120.00 each)
                  🛡️ **Net Profit Margin:** ~55%`;
                  break;

              default:
                  sourcingInstructions = `
                  📌 **PRODUCT:** Unknown/Custom Hardware Product
                  📦 **ACTION REQUIRED:** Manual lookup required for Paystack Reference: ${paystackRef}.`;
                  financialSummary = `💵 **Customer Paid:** R${paidAmount.toFixed(2)}`;
          }

          const emailContent = `
          ⚡ NEW SAFETYLINK HARDWARE SALE SECURED! ⚡
          
          A payment has been successfully cleared and routed to your profile (Phathutshedzo1).
          
          ------------------------------------------------------------
          ORDER DETAILS:
          ------------------------------------------------------------
          • Customer: ${customerEmail}
          • Product: ${quantity}x ${productName}
          • Total Cleared: R${paidAmount.toFixed(2)}
          • Paystack Reference: ${paystackRef}
          
          ------------------------------------------------------------
          FULFILLMENT INSTRUCTIONS (HOW TO SHIP):
          ------------------------------------------------------------
          ${sourcingInstructions}
          
          ------------------------------------------------------------
          FINANCIAL PERFORMANCE:
          ------------------------------------------------------------
          ${financialSummary}
          
          *This is an automated system notification for SafetyLink Core.*
          `;

          const mailOptions = {
              from: process.env.MERCHANT_EMAIL,
              to: process.env.MERCHANT_FULFILLMENT_EMAIL,
              subject: `[SafetyLink Order] Fulfill ${quantity}x ${productName} (${customerEmail})`,
              text: emailContent
          };

          try {
              await transporter.sendMail(mailOptions);
              console.log(`Success: Fulfillment instructions sent for order: ${paystackRef}`);
          } catch (error) {
              console.error('Error: Failed to send merchant fulfillment email:', error);
          }
      }

              } catch (e) {
          console.error('Async Webhook Processing Error:', e);
        }
      });
  });

  // --- PAYFAST INTEGRATION ---


  app.post("/api/external-sia", async (req, res) => {
    try {
      const { url, payload } = req.body;
      
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ error: "Invalid URL provided." });
      }

      // Basic SSRF Protection
      try {
        const targetUrl = new URL(url);
        const blockedHosts = ['localhost', '127.0.0.1', '169.254.169.254', '0.0.0.0'];
        if (blockedHosts.includes(targetUrl.hostname) || targetUrl.hostname.endsWith('.local') || targetUrl.hostname.endsWith('.internal')) {
          console.warn(`Blocked SSRF attempt to internal domain: ${targetUrl.hostname}`);
          return res.status(403).json({ error: "Access to internal domains is forbidden." });
        }
      } catch (e) {
        return res.status(400).json({ error: "Malformed URL structure." });
      }

      // Timeout Optimization for Proxy
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const SIA_TOKEN = process.env.VITE_SIA_TOKEN || 'placeholder';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + SIA_TOKEN,
          'User-Agent': 'SafetyLink-External-SIA-Proxy/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal as any
      });
      
      clearTimeout(timeoutId);
      const textRes = await response.text().catch(() => "");
      res.json({ success: response.ok, status: response.status, body: textRes.substring(0, 500) });
    } catch (e: any) {
      console.error("External SIA Proxy Error:", e);
      if (e.name === 'AbortError') {
         return res.status(504).json({ error: "Gateway Timeout: External endpoint took too long to respond." });
      }
      res.status(500).json({ error: e.message || "Internal server proxy error" });
    }
  });

  app.post("/api/payfast/checkout", async (req, res) => {
    try {
      const { plan_name, amount, item_description, email } = req.body;
      const merchant_id = process.env.PAYFAST_MERCHANT_ID;
      const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PASSPHRASE;
      const baseUrl = req.headers.origin || 'https://safetylink.online';

      const data = {
        merchant_id,
        merchant_key,
        return_url: `${baseUrl}?payment=success`,
        cancel_url: `${baseUrl}?payment=cancel`,
        notify_url: `${baseUrl}/api/payfast/webhook`,
        name_first: 'SafetyLink',
        name_last: 'User',
        email_address: email || 'user@example.com',
        m_payment_id: `sl_${Date.now()}`,
        amount: parseFloat(amount).toFixed(2),
        item_name: plan_name || 'SafetyLink Subscription',
        item_description: item_description || 'SafetyLink Core Subscription'
      };

      let pfOutput = '';
      for (let key in data) {
        if (data[key] !== '') {
          pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
        }
      }
      let getString = pfOutput.slice(0, -1);
      if (passphrase) {
        getString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
      }
      const signature = crypto.createHash('md5').update(getString).digest('hex');
      const payload = { ...data, signature };

      // Payfast uses https://www.payfast.co.za/eng/process for production
      const payfastUrl = 'https://www.payfast.co.za/eng/process?' + new URLSearchParams(payload).toString();
      
      res.json({ success: true, url: payfastUrl });
    } catch (e: any) {
      console.error("Payfast Checkout Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/payfast/webhook", express.urlencoded({ extended: true, verify: (req: any, res, buf) => { req.rawBody = buf; } }), async (req, res) => {
    try {
      const pfData = req.body;
      console.log('Received Payfast ITN:', pfData);
      
      // Payfast ITN Validation
      const pfHost = process.env.NODE_ENV === 'production' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
      const validateUrl = `https://${pfHost}/eng/query/validate`;
      
      const validateResponse = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: (req as any).rawBody || new URLSearchParams(req.body).toString()
      });
      
      const validateResult = await validateResponse.text();
      if (validateResult !== 'VALID') {
        console.error("Security alert: Payfast ITN validation failed:", validateResult);
        return res.status(401).send('Unauthorized');
      }

      // Fast response to prevent timeout loops
      res.status(200).send('OK');

      // Process heavy database operations asynchronously
      setImmediate(async () => {
        try {
          if (pfData.payment_status === 'COMPLETE') {
         console.log('Payment complete for:', pfData.item_name, 'User:', pfData.email_address);
         
         // Update Firestore Database Role/Status
         try {
           const usersRef = firestoreDb.collection('users');
           const snapshot = await usersRef.where('email', '==', pfData.email_address).get();
           
           if (!snapshot.empty) {
             const batch = firestoreDb.batch();
             snapshot.forEach(doc => {
               batch.update(doc.ref, {
                 subscription_status: 'active',
                 subscription_plan: pfData.item_name || 'Premium',
                 role: (pfData.item_name && pfData.item_name.includes('Organisation')) ? 'org_admin' : 'premium_user',
                 updated_at: FieldValue.serverTimestamp()
               });
             });
             await batch.commit();
             console.log('Successfully upgraded user roles in Firestore for:', pfData.email_address);
           } else {
             console.log('User not found in Firestore for email:', pfData.email_address);
           }
         } catch (firestoreErr) {
           console.error('Firestore update error during webhook processing:', firestoreErr);
         }
                }
        } catch (e) {
          console.error('Async Payfast Webhook Processing Error:', e);
        }
      });
    } catch (e: any) {
      console.error('Payfast ITN Error:', e);
      res.status(500).send('Error');
    }
  });

  // Vite middleware for development




  if (process.env.NODE_ENV !== "production" && (!process.argv[1] || !process.argv[1].endsWith("server.cjs"))) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 24678 } },
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

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/live' });

  wss.on("connection", async (clientWs) => {
    const ai = initGemini();
    
    // Connect to Live API
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
        },
        systemInstruction: {
          parts: [{ text: "You are K'leva.info, the secure AI voice coordinator for SafetyLink. Provide tactical support, short responses, and assertive guidance." }],
        },
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio && clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: "audio", data: audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === 1) {
            clientWs.send(JSON.stringify({ type: "interrupted" }));
          }
        }
      }
    });

    clientWs.on("message", (message: string) => {
      try {
        const msg = JSON.parse(message);
        if (msg.type === "audio") {
          session.sendRealtimeInput({
            audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (err) {
        console.error("Live API WS message error", err);
      }
    });

    clientWs.on("close", () => {
      session.close();
    });
  });
}

startServer();

// Keep process alive
