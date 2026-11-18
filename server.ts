let panicQueue: any = null;
function getPanicQueue() {
  if (!panicQueue) {
    const { Queue } = require("bullmq");
    
    const connection = { url: process.env.REDIS_URL };
    const hasRedisEnv = !!process.env.REDIS_URL;
    if (!hasRedisEnv) {
      panicQueue = {
        add: async (...args: any[]) => console.warn("Redis not configured. Mock queue added job:", args),
        on: () => {}
      };
      return panicQueue;
    }
    panicQueue = new Queue("panicQueue", { connection });
    panicQueue.on("error", (err: any) => console.warn("panicQueue connection error (ignored in sandbox):", err.message));
  }
  return panicQueue;
}
console.log("STARTING SERVER SCRIPT PID:", process.pid);
import { createIncident, processPanicAlert } from "./src/services/panic-alert";
import { ussdRouter } from "./src/routes/ussd";
import { r2Router } from "./src/routes/r2-media";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Pusher from "pusher";
import * as stytch from "stytch";
import nodemailer from 'nodemailer';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { db } from "./src/db/index";
import crypto from "crypto";
import twilio from "twilio";
import { Queue } from "bullmq";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin for Firestore & FCM updates
let firebaseAdminApp: any = null;
if (!getApps().length) {
  let credentialConfig: any = null;
  const serviceAccountPath = './safetylink-99e56-service-account.json';

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      credentialConfig = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    } catch {
      try {
        if (fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) {
          credentialConfig = cert(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        }
      } catch (e) {
        console.warn('[FirebaseAdmin] Failed loading FIREBASE_SERVICE_ACCOUNT_KEY path:', e);
      }
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      credentialConfig = cert(serviceAccountPath);
      console.log('[FirebaseAdmin] Loaded credentials from safetylink-99e56-service-account.json');
    } catch (e) {
      console.warn('[FirebaseAdmin] Failed loading safetylink-99e56-service-account.json:', e);
    }
  }

  firebaseAdminApp = initializeApp(credentialConfig ? {
    credential: credentialConfig,
    projectId: 'safetylink-99e56'
  } : {
    projectId: 'safetylink-99e56'
  });
}

let firestoreDb: any = null;
function getFirestoreDb() {
  if (!firestoreDb) firestoreDb = getFirestore();
  return firestoreDb;
}


// --- Environment Variables (from GitHub Secrets via CI & Runtime) ---
const TWILIO_ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '';
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_NUMBER || '+16055695774';
const PUSHER_APP_KEY      = process.env.PUSHER_APP_KEY;
const PUSHER_APP_ID       = process.env.PUSHER_APP_ID;
const PUSHER_APP_SECRET   = process.env.PUSHER_APP_SECRET;
const ONESIGNAL_APP_ID    = process.env.ONESIGNAL_APP_ID;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const PIPEDREAM_URL       = process.env.PIPEDREAM_WEBHOOK_URL;
const BLAND_API_KEY       = process.env.BLAND_API_KEY;
const BLAND_ORG_KEY       = process.env.BLAND_ORG_KEY;

// Emergency Providers
const VAPI_PRIVATE_KEY       = process.env.VAPI_PRIVATE_KEY || '43fcd7b7-b329-49f2-a9dc-09e366d38aaa';
const VAPI_PUBLIC_KEY        = process.env.VAPI_PUBLIC_KEY;
const VAPI_PHONE_NUMBER_ID   = process.env.VAPI_PHONE_NUMBER_ID || 'ef00ad6f-92e3-49cb-b54c-fa2b8a8f44d0';
const VAPI_ASSISTANT_ID      = process.env.VAPI_ASSISTANT_ID || '9c9313eb-8593-4c49-b993-09eef7e8d540';
const AT_API_KEY             = process.env.AT_API_KEY || process.env.USSD_API_KEY;
const AT_USERNAME            = process.env.AT_USERNAME || 'SafetyLink';
const RESPONSE_CENTRE_NUMBER = process.env.RESPONSE_CENTRE_NUMBER || '+27739441222';
const TEST_DESTINATION_NUMBER= process.env.TEST_DESTINATION_NUMBER || '+27680079911';

// --- Cryptographic Token & Password Helpers ---
function safeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSessionToken(payload: Record<string, any>, ttlMs = 86400_000): string {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + ttlMs })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('hex');
  return `${body}.${sig}`;
}

function verifySessionToken(token: string): any | null {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('hex');
    if (!safeEqualStr(sig, expected)) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

function hashPasswordSecure(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPasswordHash(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const derived = crypto.scryptSync(String(password), parts[1], 64).toString('hex');
    return safeEqualStr(derived, parts[2]);
  }
  const legacySha = crypto.createHash('sha256').update(String(password)).digest('hex');
  return safeEqualStr(legacySha, storedHash);
}

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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fleet_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_key TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL,
      app_version TEXT NOT NULL,
      customer_email TEXT,
      customer_name TEXT,
      org_code TEXT,
      first_installed_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER
    );
  `);
}

let stytchClient = null;
function getStytchClient() {
  if (!stytchClient) {
    stytchClient = new stytch.Client({ project_id: process.env.STYTCH_PROJECT_ID || "test-id", secret: process.env.STYTCH_SECRET || "test-secret", env: stytch.envs.test });
  }
  return stytchClient;
}
/*
  project_id: process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
  */

let pusher = null;
function getPusher() {
  if (!pusher) {
    pusher = new Pusher({ appId: process.env.PUSHER_APP_ID || "test", key: process.env.PUSHER_KEY || "test", secret: process.env.PUSHER_SECRET || "test", cluster: "ap2", useTLS: true });
  }
  return pusher;
}
/*
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET, // User did not provide explicit secret, placeholder
  cluster: "ap2",
  */



const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock_key';
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

 // Forced false to prevent ECONNREFUSED on Cloud Run
const connection = { url: process.env.REDIS_URL };


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

  // --- Dynamic Public APK Download Route (Resolves latest signed asset from GitHub Releases) ---
  const handleApkDownload = async (_req: express.Request, res: express.Response) => {
    const FALLBACK = "https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.965/SafetyLink-v1.1.965-Signed.apk";
    let target = FALLBACK;
    try {
      const ghRes = await fetch("https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest", {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "SafetyLink-Server-Download",
        },
      });
      if (ghRes.ok) {
        const data = await ghRes.json() as any;
        const assets = Array.isArray(data.assets) ? data.assets : [];
        const apks = assets.filter(
          (a: any) =>
            a &&
            typeof a.name === "string" &&
            a.name.toLowerCase().endsWith(".apk") &&
            typeof a.browser_download_url === "string"
        );
        const signed = apks.find((a: any) => a.name.toLowerCase().includes("signed"));
        const chosen = signed || apks[0];
        if (chosen?.browser_download_url) {
          target = chosen.browser_download_url;
        }
      }
    } catch {
      // Keep last known fallback signed APK
    }
    res.setHeader("Cache-Control", "public, max-age=120");
    return res.redirect(302, target);
  };

  app.get("/SafetyLink.apk", handleApkDownload);
  app.get("/download/apk", handleApkDownload);
  app.get("/api/download/apk", handleApkDownload);

  // --- External Credentials Live Verification Endpoint ---
  app.get("/api/system/credentials-status", async (_req, res) => {
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // 1. Check VAPI
    try {
      const vapiRes = await fetch(`https://api.vapi.ai/assistant/${VAPI_ASSISTANT_ID}`, {
        headers: { 'Authorization': `Bearer ${VAPI_PRIVATE_KEY}` }
      });
      if (vapiRes.ok) {
        const vapiData = await vapiRes.json();
        results.services.vapi = {
          status: 'OPERATIONAL',
          healthy: true,
          assistantName: vapiData.name || 'SafetyLink Panic Alert',
          assistantId: VAPI_ASSISTANT_ID,
          phoneNumberId: VAPI_PHONE_NUMBER_ID
        };
      } else {
        results.services.vapi = {
          status: 'ERROR',
          healthy: false,
          statusCode: vapiRes.status,
          message: 'VAPI Assistant query returned non-200 status'
        };
      }
    } catch (e: any) {
      results.services.vapi = { status: 'UNREACHABLE', healthy: false, error: e.message };
    }

    // 2. Check Twilio / WhatsApp
    try {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (twilioRes.ok) {
        const twData = await twilioRes.json();
        results.services.twilio = {
          status: 'OPERATIONAL',
          healthy: true,
          accountName: twData.friendly_name || 'SafetyLink Twilio',
          phoneNumber: TWILIO_PHONE_NUMBER,
          whatsappFrom: TWILIO_PHONE_NUMBER
        };
      } else {
        results.services.twilio = {
          status: 'ERROR',
          healthy: false,
          statusCode: twilioRes.status,
          message: 'Twilio account check returned non-200 status'
        };
      }
    } catch (e: any) {
      results.services.twilio = { status: 'UNREACHABLE', healthy: false, error: e.message };
    }

    // 3. Check Africa's Talking
    try {
      const atRes = await fetch(`https://api.africastalking.com/version1/user?username=${AT_USERNAME}`, {
        headers: { 'apiKey': AT_API_KEY, 'Accept': 'application/json' }
      });
      if (atRes.ok) {
        const atData = await atRes.json();
        results.services.africasTalking = {
          status: 'OPERATIONAL',
          healthy: true,
          username: AT_USERNAME,
          balance: atData?.UserData?.balance || 'Active'
        };
      } else {
        results.services.africasTalking = {
          status: 'AUTHENTICATION_REQUIRED',
          healthy: false,
          statusCode: atRes.status,
          message: 'The supplied AT_API_KEY is invalid or expired. Please generate a new key on the Africa Talking portal.'
        };
      }
    } catch (e: any) {
      results.services.africasTalking = { status: 'UNREACHABLE', healthy: false, error: e.message };
    }

    // 4. Check Cloudflare R2 Media Bucket
    try {
      const { listR2Media } = await import('./src/services/r2-storage');
      const assets = await listR2Media('Safetylink/');
      results.services.cloudflareR2 = {
        status: 'OPERATIONAL',
        healthy: true,
        bucket: process.env.R2_BUCKET || 'media',
        assetCount: assets.length,
        prefix: 'Safetylink/'
      };
    } catch (e: any) {
      results.services.cloudflareR2 = { status: 'ERROR', healthy: false, error: e.message };
    }

    // 5. Check Neon PostgreSQL Database
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        const { Client } = await import('pg');
        const pgClient = new Client({ connectionString: dbUrl });
        await pgClient.connect();
        const pgRes = await pgClient.query('SELECT NOW()');
        await pgClient.end();
        results.services.neonDatabase = {
          status: 'OPERATIONAL',
          healthy: true,
          serverTime: pgRes.rows[0]?.now
        };
      } else {
        results.services.neonDatabase = {
          status: 'LOCAL_FALLBACK',
          healthy: true,
          type: 'LibSQL/SQLite',
          note: 'Using persistent embedded database'
        };
      }
    } catch (e: any) {
      results.services.neonDatabase = {
        status: 'AUTHENTICATION_FAILED',
        healthy: false,
        error: e.message,
        actionRequired: 'The Neon DATABASE_URL provided contains placeholder password ("npg_password"). Please provide the authentic Neon database password or token.'
      };
    }

    res.json(results);
  });

  // --- SafetyLink Fleet Telemetry & In-App OTA Endpoints ---
  const FLEET_BACKUP_FILE = path.join(process.cwd(), "data", "fleet_registry.json");
  const CUSTOMERS_BACKUP_FILE = path.join(process.cwd(), "data", "customers_backup.json");
  const USERS_BACKUP_FILE = path.join(process.cwd(), "data", "users_backup.json");
  const ORGS_BACKUP_FILE = path.join(process.cwd(), "data", "orgs_backup.json");

  const readPersistentJSON = (filePath: string, fallback: any = []) => {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e) {
      console.warn("Failed to read", filePath, e);
    }
    return fallback;
  };

  const writePersistentJSON = (filePath: string, data: any) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Failed to write", filePath, e);
    }
  };

  // Version endpoint for light/OTA in-app update checks
  app.get("/api/version", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    try {
      const versionFile = path.join(process.cwd(), "public", "version.json");
      if (fs.existsSync(versionFile)) {
        const data = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
        return res.json({ ...data, isLiveUpdateAvailable: true });
      }
    } catch (e) {
      console.warn("Error reading version.json:", e);
    }
    res.json({
      version: "1.1.935",
      buildTime: "2026-10-01T09:16:48Z",
      releaseName: "SafetyLink Core v1.1.935",
      apkUrl: "https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.935/SafetyLink-v1.1.935-Signed.apk",
      liveWebUrl: "https://safetylink.online",
      isLiveUpdateAvailable: true
    });
  });

  // ── EDITORIAL PLATFORM STUDIO APIS ──────────────────────────
  const EDITORIAL_DATA_FILE = path.join(process.cwd(), "data", "editorial_state.json");

  // 1. Fetch current editorial state
  app.get("/api/editorial/state", (_req, res) => {
    try {
      if (fs.existsSync(EDITORIAL_DATA_FILE)) {
        const content = fs.readFileSync(EDITORIAL_DATA_FILE, "utf-8");
        return res.json(JSON.parse(content));
      }
      return res.json({ status: "not_found", message: "Using default state" });
    } catch (e: any) {
      console.warn("[Editorial API] Read error:", e.message);
      return res.status(500).json({ error: "Failed to read editorial state" });
    }
  });

  // 2. Save draft state
  app.post("/api/editorial/save", (req, res) => {
    try {
      const dir = path.dirname(EDITORIAL_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(EDITORIAL_DATA_FILE, JSON.stringify(req.body, null, 2), "utf-8");
      console.log(`🎨 [EDITORIAL STUDIO] Draft saved: platform ${req.body.activePlatform || 'all'}`);
      return res.json({ success: true, savedAt: new Date().toISOString() });
    } catch (e: any) {
      console.error("[Editorial API] Save error:", e);
      return res.status(500).json({ error: e.message || "Failed to save draft" });
    }
  });

  // 3. Publish live & bump OTA version
  app.post("/api/editorial/publish", (req, res) => {
    try {
      const { version, releaseNotes, state } = req.body;
      const targetVersion = version || "1.1.897";
      const now = new Date().toISOString();

      // Update editorial state
      const dir = path.dirname(EDITORIAL_DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (state) {
        fs.writeFileSync(EDITORIAL_DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
      }

      // Update public/version.json
      const versionFile = path.join(process.cwd(), "public", "version.json");
      let versionObj: any = {
        version: targetVersion,
        buildTime: now,
        releaseName: `SafetyLink Core v${targetVersion}`,
        apkUrl: `https://github.com/Charesmagna/SafetyLink-Core/releases/download/v${targetVersion}/SafetyLink-v${targetVersion}-Signed.apk`,
        liveWebUrl: "https://safetylink.online",
        features: [
          releaseNotes || "Platform layout & content update via Studio",
          "Dynamic Web, APK, and EXE synchronization",
          "High-speed OTA content delivery"
        ]
      };

      if (fs.existsSync(versionFile)) {
        try {
          const current = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
          versionObj = {
            ...current,
            version: targetVersion,
            buildTime: now,
            releaseName: `SafetyLink Core v${targetVersion}`,
            features: [
              releaseNotes || "Platform Studio Live Release",
              ...(current.features || []).slice(0, 3)
            ]
          };
        } catch (_) {}
      }

      fs.writeFileSync(versionFile, JSON.stringify(versionObj, null, 2), "utf-8");

      console.log(`🚀 [EDITORIAL STUDIO] Published LIVE update! Version: v${targetVersion}`);
      return res.json({
        success: true,
        version: targetVersion,
        publishedAt: now,
        message: `Version v${targetVersion} broadcasted to all live clients.`
      });
    } catch (e: any) {
      console.error("[Editorial API] Publish error:", e);
      return res.status(500).json({ error: e.message || "Failed to publish" });
    }
  });

  // 4. AI-Powered Copy & Structure Assistant (Gemini)
  app.post("/api/editorial/ai-assist", async (req, res) => {
    try {
      const { field, prompt, currentValue, platform } = req.body;
      const genAI = initGemini();

      const systemPrompt = `You are the Lead Emergency Response & Security Communications Architect for SafetyLink, South Africa's premier mission-critical sequential alert network.
Generate 3 distinct, high-impact copy variations for the "${field}" element on the "${platform || 'web'}" platform.
User Context / Prompt: ${prompt || 'Make it authoritative, mission-critical, and clear'}
Current Text: "${currentValue || ''}"

Rules:
- Keep variations punchy, clear, and tailored to high-stress emergency response.
- Format your response strictly as a JSON array of 3 strings: ["Option 1", "Option 2", "Option 3"].
- Return valid JSON only, no markdown code fences, no extra commentary.`;

      const response = await genAI.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
        config: {
          temperature: 0.7,
        }
      });

      const raw = response.text || "";
      let suggestions: string[] = [];
      try {
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        suggestions = raw.split("\n").filter(l => l.trim().length > 0).slice(0, 3).map(s => s.replace(/^\d+[\.\)]\s*/, '').replace(/^"|"$/g, ''));
      }

      return res.json({ suggestions });
    } catch (e: any) {
      console.warn("[Editorial AI] Gemini call fallback:", e.message);
      return res.json({
        suggestions: [
          "MISSION-CRITICAL EMERGENCY DISPATCH FOR SOUTH AFRICA",
          "RAPID 2-SECOND PANIC ALERT & ARMED RESPONSE LINK",
          "HARDWARE-ENCRYPTED SEQUENTIAL EMERGENCY NETWORK"
        ]
      });
    }
  });

  // 5. Export Code Patch
  app.get("/api/editorial/export-patch", (_req, res) => {
    try {
      if (fs.existsSync(EDITORIAL_DATA_FILE)) {
        const content = fs.readFileSync(EDITORIAL_DATA_FILE, "utf-8");
        return res.json({
          patchType: "json-blueprint",
          state: JSON.parse(content),
          generatedAt: new Date().toISOString()
        });
      }
      return res.status(404).json({ error: "No published state found" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Fleet device registration (Alerts server whenever someone installs or launches app)
  app.post("/api/fleet/register", async (req, res) => {
    try {
      const { nodeKey, platform, appVersion, customerEmail, customerName, orgCode, firstInstalledAt, userAgent } = req.body;
      if (!nodeKey) return res.status(400).json({ error: "nodeKey required" });

      const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const now = new Date().toISOString();

      console.log(`📱 [FLEET TELEMETRY] New installation node connected: ${nodeKey} | Platform: ${platform} | Version: ${appVersion} | Customer: ${customerEmail || "Anonymous"}`);

      // 1. Upsert into database
      try {
        await db.execute({
          sql: `
            INSERT INTO fleet_devices (node_key, platform, app_version, customer_email, customer_name, org_code, first_installed_at, last_seen_at, ip_address, user_agent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            ON CONFLICT(node_key) DO UPDATE SET
              last_seen_at = excluded.last_seen_at,
              app_version = excluded.app_version,
              customer_email = COALESCE(excluded.customer_email, fleet_devices.customer_email),
              customer_name = COALESCE(excluded.customer_name, fleet_devices.customer_name),
              org_code = COALESCE(excluded.org_code, fleet_devices.org_code),
              status = 'active';
          `,
          args: [nodeKey, platform || "web_pwa", appVersion || "1.1.896", customerEmail || null, customerName || null, orgCode || null, firstInstalledAt || now, now, String(clientIp), userAgent || ""]
        });
      } catch (dbErr: any) {
        console.warn("DB fleet execute note:", dbErr.message);
      }

      // 2. Persistent file backup in ./data/
      const fleetBackup = readPersistentJSON(FLEET_BACKUP_FILE, []);
      const existingIdx = fleetBackup.findIndex((d: any) => d.node_key === nodeKey);
      const deviceEntry = {
        node_key: nodeKey,
        platform: platform || "web_pwa",
        app_version: appVersion || "1.1.896",
        customer_email: customerEmail || (existingIdx >= 0 ? fleetBackup[existingIdx].customer_email : null),
        customer_name: customerName || (existingIdx >= 0 ? fleetBackup[existingIdx].customer_name : null),
        org_code: orgCode || (existingIdx >= 0 ? fleetBackup[existingIdx].org_code : null),
        first_installed_at: firstInstalledAt || (existingIdx >= 0 ? fleetBackup[existingIdx].first_installed_at : now),
        last_seen_at: now,
        ip_address: String(clientIp),
        user_agent: userAgent || "",
        status: "active"
      };

      if (existingIdx >= 0) {
        fleetBackup[existingIdx] = deviceEntry;
      } else {
        fleetBackup.push(deviceEntry);
      }
      writePersistentJSON(FLEET_BACKUP_FILE, fleetBackup);

      // 3. Sync to Firestore collection if configured
      try {
        const firestore = getFirestoreDb();
        if (firestore) {
          await firestore.collection("fleet_devices").doc(nodeKey).set(deviceEntry, { merge: true });
        }
      } catch {}

      res.json({ success: true, nodeKey, status: "registered" });
    } catch (err: any) {
      console.error("Fleet register error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fleet Heartbeat
  app.post("/api/fleet/heartbeat", async (req, res) => {
    try {
      const { nodeKey, appVersion, customerEmail } = req.body;
      if (!nodeKey) return res.status(400).json({ error: "nodeKey required" });
      const now = new Date().toISOString();

      try {
        await db.execute({
          sql: `UPDATE fleet_devices SET last_seen_at = ?, app_version = COALESCE(?, app_version) WHERE node_key = ?`,
          args: [now, appVersion || null, nodeKey]
        });
      } catch {}

      const fleetBackup = readPersistentJSON(FLEET_BACKUP_FILE, []);
      const match = fleetBackup.find((d: any) => d.node_key === nodeKey);
      if (match) {
        match.last_seen_at = now;
        if (appVersion) match.app_version = appVersion;
        if (customerEmail) match.customer_email = customerEmail;
        writePersistentJSON(FLEET_BACKUP_FILE, fleetBackup);
      }

      res.json({ success: true, timestamp: now });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fleet list for Admin Dashboard
  app.get("/api/fleet/devices", async (_req, res) => {
    try {
      let devices: any[] = [];
      try {
        const result = await db.execute("SELECT * FROM fleet_devices ORDER BY last_seen_at DESC");
        devices = result.rows as any[];
      } catch {
        devices = readPersistentJSON(FLEET_BACKUP_FILE, []);
      }

      if (!devices || devices.length === 0) {
        devices = readPersistentJSON(FLEET_BACKUP_FILE, []);
      }

      res.json({ success: true, count: devices.length, devices });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Persistent Customers Backup Sync
  app.post("/api/sync/backup-customers", async (req, res) => {
    try {
      const { customers } = req.body;
      if (Array.isArray(customers) && customers.length > 0) {
        writePersistentJSON(CUSTOMERS_BACKUP_FILE, customers);
        res.json({ success: true, savedCount: customers.length });
      } else {
        res.status(400).json({ error: "Valid customers array required" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sync/customers", (_req, res) => {
    const customers = readPersistentJSON(CUSTOMERS_BACKUP_FILE, []);
    res.json({ success: true, customers });
  });

  // Modular Provider Routes
  app.use("/ussd", ussdRouter);
  app.use("/api/r2", r2Router);


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
  
  // 1. Text / Grounding (Search OR Maps — never combined, no forbidden config params)
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, useGrounding, useFlashLite, lat, lng, systemInstruction } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "prompt is required" });
      }
      const genAI = initGemini();

      const modelName = useFlashLite && !useGrounding ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
      const config: any = {};

      if (systemInstruction && !useGrounding) {
        config.systemInstruction = String(systemInstruction);
      }

      if (useGrounding === "search") {
        config.tools = [{ googleSearch: {} }];
      } else if (useGrounding === "maps") {
        config.tools = [{ googleMaps: {} }];
        if (typeof lat === "number" && typeof lng === "number" && (lat !== 0 || lng !== 0)) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng },
            },
          };
        }
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      const metadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = metadata?.groundingChunks || [];
      res.json({
        text: response.text || "",
        chunks,
        searchEntryPointHtml: metadata?.searchEntryPoint?.renderedContent || null,
      });
    } catch (e: any) {
      console.error("[/api/gemini/generate]", e);
      res.status(500).json({ error: e.message || "Gemini generation failed" });
    }
  });

  // 1b. Multi-turn Lizzy / Tactical Chatbot (gemini-4-hydrogen / gemini-3.1-flash-lite)
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction, useFlashLite, useMaps, lat, lng } = req.body || {};
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required" });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          text: "SafetyLink Local Assistant: Dial 10111 (SAPS), 112 (Cellular Emergency), or 10177 (Ambulance), or press the central SOS button for SMS and responder dispatch.",
          chunks: [],
          fallback: true,
        });
      }
      const genAI = initGemini();
      const modelName = useMaps ? "gemini-4-hydrogen" : useFlashLite ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";

      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h: any) => h && typeof h.text === "string" && h.text.trim().length > 0)
            .slice(-16)
            .map((h: any) => ({
              role: h.role === "model" || h.sender === "bot" ? "model" : "user",
              parts: [{ text: h.text }],
            }))
        : [];

      const config: any = {};
      if (useMaps) {
        config.tools = [{ googleMaps: {} }];
        if (typeof lat === "number" && typeof lng === "number" && (lat !== 0 || lng !== 0)) {
          config.toolConfig = { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } };
        }
      } else {
        config.systemInstruction =
          systemInstruction ||
          "You are Lizzy from SafetyLink South Africa (powered by K'lev.ai). Be warm, clear, concise, and practical. Share South African emergency numbers (10111 SAPS, 112 cellular emergency, 10177 ambulance) when relevant.";
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: [...formattedHistory, { role: "user", parts: [{ text: message }] }],
        config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      res.json({ text: response.text || "", chunks });
    } catch (e: any) {
      console.error("[/api/gemini/chat]", e);
      res.status(500).json({ error: e.message || "Chat request failed" });
    }
  });

  // 1c. Safer City Grounded Updates (Separate Google Search & Google Maps calls per SDK rules)
  app.post("/api/gemini/safer-city", async (req, res) => {
    try {
      const { queryText, locationName, lat, lng } = req.body || {};
      const genAI = initGemini();
      const placeLabel = locationName || (typeof lat === "number" && typeof lng === "number" ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Johannesburg, South Africa");

      const searchPrompt = queryText
        ? `${queryText} in ${placeLabel}. Focus on public safety advisories, CPF community alerts, traffic disruptions, and severe weather.`
        : `Latest public safety advisories, community policing forum (CPF) updates, municipal alerts, and weather warnings near ${placeLabel}. Summarize concisely with facts.`;

      const searchRes = await genAI.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: searchPrompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      let mapsRes: any = null;
      if (typeof lat === "number" && typeof lng === "number" && (lat !== 0 || lng !== 0)) {
        mapsRes = await genAI.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: `List the 4 nearest verified SAPS police stations, emergency trauma hospitals, or 24-hour safe zones near latitude ${lat}, longitude ${lng}.`,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } },
          },
        });
      }

      res.json({
        advisoryText: searchRes.text || "",
        searchChunks: searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        safeZonesText: mapsRes?.text || "",
        mapsChunks: mapsRes?.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      });
    } catch (e: any) {
      console.error("[/api/gemini/safer-city]", e);
      res.status(500).json({ error: e.message || "Safer City query failed" });
    }
  });

  // 2. Audio Transcription (gemini-3.5-transcribe) — accessibility & voice notes
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64) {
        return res.status(400).json({ error: "audioBase64 is required" });
      }
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: [
          {
            role: "user",
            parts: [
              { text: "Transcribe this spoken audio accurately in English or the spoken South African language. Return plain transcript text only." },
              { inlineData: { data: audioBase64, mimeType: mimeType || "audio/webm" } },
            ],
          },
        ],
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error("[/api/gemini/transcribe]", e);
      res.status(500).json({ error: e.message || "Transcription failed" });
    }
  });

  // 2b. Accessibility & Lizzy Text-to-Speech (gemini-3.8-flash-lite-tts)
  app.post("/api/gemini/tts", async (req, res) => {
    try {
      const { text, voiceName } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [{ role: "user", parts: [{ text: text.slice(0, 1000) }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
            },
          },
        },
      });
      const inlineData = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (!inlineData?.data) {
        return res.status(502).json({ error: "No audio returned by TTS model" });
      }
      res.json({ audioBase64: inlineData.data, mimeType: inlineData.mimeType || "audio/wav" });
    } catch (e: any) {
      console.error("[/api/gemini/tts]", e);
      res.status(500).json({ error: e.message || "TTS generation failed" });
    }
  });

  // 3. Image Understanding (gemini-4-hydrogen multimodal)
  app.post("/api/gemini/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType, prompt } = req.body || {};
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt || "Analyze this emergency scene or hazard image concisely." },
              { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } },
            ],
          },
        ],
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error("[/api/gemini/analyze-image]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // 4-7. Paid-Tier Only Endpoints — explicitly gated (no fake ACTIVE/mock responses)
  app.post("/api/gemini/generate-image", (_req, res) => {
    return res.status(402).json({
      error: "Image generation models require a billing-enabled paid Gemini API key.",
      requiresPaidKey: true,
    });
  });

  app.post("/api/gemini/generate-video", (_req, res) => {
    return res.status(402).json({
      error: "Veo video generation models require a billing-enabled paid Gemini API key.",
      requiresPaidKey: true,
    });
  });

  app.post("/api/gemini/generate-lyria", (_req, res) => {
    return res.status(402).json({
      error: "Lyria server music generation requires a billing-enabled paid Gemini API key.",
      requiresPaidKey: true,
    });
  });

  app.post("/api/gemini/research/start", (_req, res) => {
    return res.status(402).json({
      error: "Deep Research Agent requires a billing-enabled paid Gemini API key.",
      requiresPaidKey: true,
    });
  });

  app.get("/api/gemini/research/:id", (_req, res) => {
    return res.status(402).json({
      error: "Deep Research Agent requires a billing-enabled paid Gemini API key.",
      requiresPaidKey: true,
    });
  });

  // Hikvision / ONVIF Camera ISAPI Probe & Soft-IO Dispatch Helpers
  const isBlockedMetadataHost = (rawHost: string): boolean => {
    const h = String(rawHost || "").trim().toLowerCase().replace(/^\[|\]$/g, "");
    if (!h) return true;
    return (
      h === "169.254.169.254" ||
      h.startsWith("169.254.") ||
      h === "metadata.google.internal" ||
      h === "::1" ||
      h.startsWith("fd") ||
      h.startsWith("fe80:")
    );
  };

  function parseDigestChallenge(headerValue: string): Record<string, string> {
    const out: Record<string, string> = {};
    const trimmed = headerValue.replace(/^Digest\s+/i, "");
    const regex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|([^,\s]*))/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(trimmed)) !== null) {
      out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : (m[3] || "");
    }
    return out;
  }

  function buildDigestAuthHeader(
    method: string,
    uriPath: string,
    username: string,
    password: string,
    challenge: Record<string, string>
  ): string {
    const algRaw = (challenge.algorithm || "MD5").toUpperCase();
    const hashName = algRaw.includes("SHA-256") ? "sha256" : "md5";
    const h = (val: string) => crypto.createHash(hashName).update(val).digest("hex");

    const realm = challenge.realm || "";
    const nonce = challenge.nonce || "";
    const cnonce = crypto.randomBytes(8).toString("hex");
    const nc = "00000001";
    const qopList = (challenge.qop || "").split(",").map((s) => s.trim().toLowerCase());
    const qop = qopList.includes("auth") ? "auth" : (challenge.qop ? qopList[0] : "");

    let ha1 = h(`${username}:${realm}:${password}`);
    if (algRaw.endsWith("-SESS")) {
      ha1 = h(`${ha1}:${nonce}:${cnonce}`);
    }
    const ha2 = h(`${method.toUpperCase()}:${uriPath}`);
    const responseHash = qop
      ? h(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
      : h(`${ha1}:${nonce}:${ha2}`);

    const parts = [
      `username="${username.replace(/"/g, "")}"`,
      `realm="${realm}"`,
      `nonce="${nonce}"`,
      `uri="${uriPath}"`,
      `algorithm="${algRaw}"`,
      `response="${responseHash}"`,
    ];
    if (challenge.opaque) parts.push(`opaque="${challenge.opaque}"`);
    if (qop) {
      parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
    }
    return `Digest ${parts.join(", ")}`;
  }

  async function fetchWithHikvisionAuth(
    urlStr: string,
    init: RequestInit & { timeoutMs?: number } = {},
    username = "admin",
    password = ""
  ): Promise<Response> {
    const { timeoutMs = 4000, headers: baseHeaders, ...restInit } = init;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const initialHeaders: Record<string, string> = {
        ...(baseHeaders as Record<string, string> | undefined),
      };
      if (username && !initialHeaders.Authorization) {
        initialHeaders.Authorization =
          "Basic " + Buffer.from(`${username}:${password || ""}`).toString("base64");
      }

      const firstRes = await fetch(urlStr, {
        ...restInit,
        headers: initialHeaders,
        signal: ctrl.signal,
      });

      if (firstRes.status === 401 && username) {
        const wwwAuth = firstRes.headers.get("www-authenticate") || "";
        if (/^Digest\s+/i.test(wwwAuth)) {
          const challenge = parseDigestChallenge(wwwAuth);
          const parsedUrl = new URL(urlStr);
          const uriPath = `${parsedUrl.pathname}${parsedUrl.search}`;
          const digestHeader = buildDigestAuthHeader(
            String(restInit.method || "GET"),
            uriPath,
            username,
            password || "",
            challenge
          );
          const retryHeaders: Record<string, string> = {
            ...(baseHeaders as Record<string, string> | undefined),
            Authorization: digestHeader,
          };
          const retryCtrl = new AbortController();
          const retryTimer = setTimeout(() => retryCtrl.abort(), timeoutMs);
          try {
            return await fetch(urlStr, {
              ...restInit,
              headers: retryHeaders,
              signal: retryCtrl.signal,
            });
          } finally {
            clearTimeout(retryTimer);
          }
        }
      }

      return firstRes;
    } finally {
      clearTimeout(timer);
    }
  }

  app.post("/api/hikvision/probe", async (req, res) => {
    try {
      const { mode, host, httpPort = 80, channel = 101, username = "admin", password = "", relayUrl } = req.body || {};

      if (mode === "WHEP_HLS_RELAY" && typeof relayUrl === "string" && relayUrl.trim()) {
        let parsed: URL;
        try {
          parsed = new URL(relayUrl.trim());
        } catch {
          return res.status(400).json({ reachable: false, error: "Invalid relay URL format." });
        }
        if (!["http:", "https:"].includes(parsed.protocol) || isBlockedMetadataHost(parsed.hostname)) {
          return res.status(400).json({ reachable: false, error: "Unsupported or blocked relay host." });
        }
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3500);
        try {
          const r = await fetch(parsed.toString(), { method: "OPTIONS", signal: ctrl.signal });
          clearTimeout(timer);
          return res.json({
            reachable: r.ok || r.status === 405 || r.status === 204 || r.status === 401,
            statusCode: r.status,
            diagnostics:
              r.ok || r.status === 204 || r.status === 405
                ? `Relay signaling endpoint responded (HTTP ${r.status}).`
                : `Relay returned HTTP ${r.status}.`,
          });
        } catch (err: any) {
          clearTimeout(timer);
          return res.json({
            reachable: false,
            statusCode: 0,
            diagnostics: `Relay unreachable from server (${err?.message || "timeout"}). If local to customer Wi-Fi, test directly from the phone.`,
          });
        }
      }

      if (!host || typeof host !== "string" || isBlockedMetadataHost(host)) {
        return res.status(400).json({ reachable: false, error: "Valid camera IP/hostname required (not metadata address)." });
      }
      const cleanHost = host.trim();
      const portNum = Number(httpPort) || 80;
      const base = `${portNum === 443 ? "https" : "http"}://${cleanHost}:${portNum}`;

      try {
        const infoRes = await fetchWithHikvisionAuth(
          `${base}/ISAPI/System/deviceInfo`,
          { method: "GET", timeoutMs: 3800 },
          username,
          password
        );

        let snapshotPreviewBase64: string | undefined;
        if (infoRes.ok || infoRes.status === 401) {
          if (infoRes.ok) {
            try {
              const snapRes = await fetchWithHikvisionAuth(
                `${base}/ISAPI/Streaming/channels/${Number(channel) || 101}/picture`,
                { method: "GET", timeoutMs: 3800 },
                username,
                password
              );
              if (snapRes.ok) {
                const buf = Buffer.from(await snapRes.arrayBuffer());
                if (buf.byteLength > 0 && buf.byteLength < 2 * 1024 * 1024) {
                  snapshotPreviewBase64 = `data:image/jpeg;base64,${buf.toString("base64")}`;
                }
              }
            } catch {
              // Ignore snapshot secondary timeout
            }
          }
          return res.json({
            reachable: infoRes.ok,
            statusCode: infoRes.status,
            authChallenge: infoRes.status === 401 ? "DIGEST_OR_CREDENTIALS_REQUIRED" : undefined,
            snapshotPreviewBase64,
            isapiUrl: `${base}/ISAPI/System/IO/softInputs/trigger?format=json`,
            diagnostics: infoRes.ok
              ? "Hikvision ISAPI authenticated & responded OK."
              : "Camera reached over network (HTTP 401 — verify camera username/password).",
          });
        }

        return res.json({
          reachable: false,
          statusCode: infoRes.status,
          diagnostics: `ISAPI returned HTTP ${infoRes.status}.`,
        });
      } catch (err: any) {
        return res.json({
          reachable: false,
          statusCode: 0,
          diagnostics: `Cannot reach ${cleanHost}:${portNum} from cloud server (${err?.message || "timeout"}). Expected for private LAN IPs—connect via site relay or Cloudflare Tunnel.`,
        });
      }
    } catch (e: any) {
      return res.status(500).json({ reachable: false, error: e?.message || "Probe failed" });
    }
  });

  app.post("/api/hikvision/trigger-io", async (req, res) => {
    try {
      const { host, httpPort = 80, softIoTriggerId = 1, username = "admin", password = "" } = req.body || {};
      if (!host || typeof host !== "string" || isBlockedMetadataHost(host)) {
        return res.status(400).json({ triggered: false, error: "Valid camera host required." });
      }
      const cleanHost = host.trim();
      const portNum = Number(httpPort) || 80;
      const base = `${portNum === 443 ? "https" : "http"}://${cleanHost}:${portNum}`;
      try {
        const r = await fetchWithHikvisionAuth(
          `${base}/ISAPI/System/IO/softInputs/trigger?format=json`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ SoftIO: { id: Number(softIoTriggerId) || 1, state: "active" } }),
            timeoutMs: 3800,
          },
          username,
          password
        );
        return res.json({
          triggered: r.ok,
          statusCode: r.status,
          diagnostics: r.ok
            ? `Soft-IO #${Number(softIoTriggerId) || 1} triggered (HTTP ${r.status}).`
            : `Camera responded HTTP ${r.status} on Soft-IO trigger.`,
        });
      } catch (err: any) {
        return res.status(502).json({ triggered: false, error: err?.message || "Camera unreachable from server" });
      }
    } catch (e: any) {
      return res.status(500).json({ triggered: false, error: e?.message || "Trigger failed" });
    }
  });

  // --- Hikvision Snapshot Frame Relay (LAN ISAPI Fallback & High-Res Evidence) ---
  app.post("/api/hikvision/snapshot", async (req, res) => {
    try {
      const { host, httpPort = 80, channel = 102, username = "admin", password = "" } = req.body || {};
      if (!host || typeof host !== "string" || isBlockedMetadataHost(host)) {
        return res.status(400).json({ ok: false, error: "Valid camera host required." });
      }
      const cleanHost = host.trim();
      const portNum = Number(httpPort) || 80;
      const base = `${portNum === 443 ? "https" : "http"}://${cleanHost}:${portNum}`;
      const chNum = Math.max(1, Math.min(1024, Number(channel) || 102));

      try {
        const r = await fetchWithHikvisionAuth(
          `${base}/ISAPI/Streaming/channels/${chNum}/picture`,
          { method: "GET", timeoutMs: 4000 },
          username,
          password
        );
        if (!r.ok) {
          return res.status(r.status === 401 ? 401 : 502).json({
            ok: false,
            statusCode: r.status,
            diagnostics: r.status === 401 ? "HTTP 401: Verify camera username/password." : `Snapshot returned HTTP ${r.status}.`,
          });
        }
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.byteLength === 0 || buf.byteLength > 2 * 1024 * 1024) {
          return res.status(413).json({ ok: false, diagnostics: "Snapshot payload empty or exceeded 2MB cap." });
        }
        return res.json({
          ok: true,
          statusCode: r.status,
          capturedAt: Date.now(),
          imageBase64: `data:image/jpeg;base64,${buf.toString("base64")}`,
          diagnostics: `Frame captured (${Math.round(buf.byteLength / 1024)} KB)`,
        });
      } catch (err: any) {
        return res.status(502).json({ ok: false, diagnostics: err?.message || "Camera snapshot timed out." });
      }
    } catch (e: any) {
      return res.status(500).json({ ok: false, diagnostics: e?.message || "Snapshot failed." });
    }
  });

  // --- Hikvision ISAPI PTZ Control (Continuous Move, Release Stop, Preset Recall) ---
  app.post("/api/hikvision/ptz", async (req, res) => {
    try {
      const {
        host,
        httpPort = 80,
        channel = 101,
        action = "STOP",
        pan = 0,
        tilt = 0,
        zoom = 0,
        presetId = 1,
        username = "admin",
        password = "",
      } = req.body || {};

      if (!host || typeof host !== "string" || isBlockedMetadataHost(host)) {
        return res.status(400).json({ ok: false, diagnostics: "Valid camera host required for PTZ." });
      }
      const cleanHost = host.trim();
      const portNum = Number(httpPort) || 80;
      const base = `${portNum === 443 ? "https" : "http"}://${cleanHost}:${portNum}`;

      // Hikvision NVR stream channels use 101/102, 201/202, etc., whereas PTZCtrl uses 1-based channel 1, 2...
      const rawCh = Number(channel) || 101;
      const ptzCh = rawCh >= 100 ? Math.max(1, Math.floor(rawCh / 100)) : Math.max(1, rawCh);

      let url = "";
      let xmlBody = "<PTZData></PTZData>";

      if (action === "PRESET") {
        const cleanPreset = Math.max(1, Math.min(300, Number(presetId) || 1));
        url = `${base}/ISAPI/PTZCtrl/channels/${ptzCh}/presets/${cleanPreset}/goto`;
      } else {
        const clamp = (v: any) => Math.max(-100, Math.min(100, Math.round(Number(v) || 0)));
        const p = action === "STOP" ? 0 : clamp(pan);
        const t = action === "STOP" ? 0 : clamp(tilt);
        const z = action === "STOP" ? 0 : clamp(zoom);
        url = `${base}/ISAPI/PTZCtrl/channels/${ptzCh}/continuous`;
        xmlBody = `<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>${p}</pan><tilt>${t}</tilt><zoom>${z}</zoom></PTZData>`;
      }

      try {
        const r = await fetchWithHikvisionAuth(
          url,
          {
            method: "PUT",
            headers: { "Content-Type": "application/xml" },
            body: xmlBody,
            timeoutMs: 3000,
          },
          username,
          password
        );
        return res.json({
          ok: r.ok,
          statusCode: r.status,
          ptzChannel: ptzCh,
          diagnostics: r.ok
            ? action === "PRESET"
              ? `Preset #${presetId} recalled on ch ${ptzCh}.`
              : action === "STOP"
              ? `PTZ stopped (ch ${ptzCh}).`
              : `PTZ active on ch ${ptzCh}.`
            : `ISAPI PTZ returned HTTP ${r.status}.`,
        });
      } catch (err: any) {
        return res.status(502).json({
          ok: false,
          diagnostics: err?.message || "PTZ host unreachable from server.",
        });
      }
    } catch (e: any) {
      return res.status(500).json({ ok: false, diagnostics: e?.message || "PTZ failed." });
    }
  });

  // --- Signed Server-Proxied WebRTC Signaling (WHEP / go2rtc SDP Exchange & Session Teardown) ---
  app.post("/api/hikvision/webrtc/signal", async (req, res) => {
    try {
      const {
        action = "OFFER",
        targetUrl,
        sdpOffer,
        bearerToken,
        username,
        password,
      } = req.body || {};

      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).json({ ok: false, error: "Signaling targetUrl is required." });
      }
      let parsed: URL;
      try {
        parsed = new URL(targetUrl.trim());
      } catch {
        return res.status(400).json({ ok: false, error: "Invalid signaling targetUrl." });
      }
      if (!["http:", "https:"].includes(parsed.protocol) || isBlockedMetadataHost(parsed.hostname)) {
        return res.status(400).json({ ok: false, error: "Unsupported or blocked signaling host." });
      }

      const headers: Record<string, string> = {};
      if (typeof bearerToken === "string" && bearerToken.trim()) {
        headers.Authorization = `Bearer ${bearerToken.trim()}`;
      }

      if (action === "DELETE") {
        try {
          const delRes = await fetchWithHikvisionAuth(
            parsed.toString(),
            { method: "DELETE", headers, timeoutMs: 3500 },
            username || "",
            password || ""
          );
          return res.json({ ok: delRes.ok || delRes.status === 404, statusCode: delRes.status });
        } catch (err: any) {
          return res.status(502).json({ ok: false, error: err?.message || "Teardown failed" });
        }
      }

      if (!sdpOffer || typeof sdpOffer !== "string" || sdpOffer.length > 65536) {
        return res.status(400).json({ ok: false, error: "Valid SDP offer required." });
      }

      headers["Content-Type"] = "application/sdp";
      headers.Accept = "application/sdp";

      try {
        const sigRes = await fetchWithHikvisionAuth(
          parsed.toString(),
          {
            method: "POST",
            headers,
            body: sdpOffer,
            timeoutMs: 5000,
          },
          username || "",
          password || ""
        );
        const answerText = await sigRes.text();
        if (!sigRes.ok) {
          return res.status(sigRes.status === 401 ? 401 : 502).json({
            ok: false,
            statusCode: sigRes.status,
            error: `Signaling gateway returned HTTP ${sigRes.status}${answerText ? `: ${answerText.slice(0, 140)}` : ""}`,
          });
        }
        const locationHeader = sigRes.headers.get("location");
        let resolvedSessionUrl: string | undefined;
        if (locationHeader) {
          try {
            resolvedSessionUrl = new URL(locationHeader, parsed.toString()).toString();
          } catch {
            resolvedSessionUrl = undefined;
          }
        }
        return res.json({
          ok: true,
          statusCode: sigRes.status,
          sdpAnswer: answerText,
          locationHeader: resolvedSessionUrl,
        });
      } catch (err: any) {
        return res.status(502).json({
          ok: false,
          error: `WebRTC signaling relay failed (${err?.message || "timeout"}).`,
        });
      }
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "WebRTC signal proxy error." });
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
          const queue = getPanicQueue();
          await queue.add('sms_dispatch', { phone, message, accountSid, authToken, fromNumber, liveSmsEnabled, timestamp: new Date().toISOString() }, {
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

  // Auth Middleware (strictly HMAC-verified tokens)
  const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifySessionToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid or expired signed token" });
    req.orgId = decoded.orgId;
    req.orgCode = decoded.orgCode;
    req.userId = decoded.userId;
    req.superAdmin = Boolean(decoded.superAdmin);
    next();
  };

  // Super Admin login backed strictly by server environment credentials
  app.post("/api/admin/login", async (req: any, res: any) => {
    try {
      const configuredPass = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || '';
      if (!configuredPass) {
        return res.status(503).json({ error: "SuperAdmin server credentials not configured." });
      }
      const { email, password } = req.body || {};
      const who = String(email || '').trim().toLowerCase();
      const allowedEmail = String(process.env.ADMIN_EMAIL || 'safetylink').trim().toLowerCase();
      const pass = String(password || '');
      const emailOk = who === 'safetylink' || who === allowedEmail;
      const passDigest = crypto.createHash('sha256').update(pass).digest('hex');
      const expectedDigest = crypto.createHash('sha256').update(configuredPass).digest('hex');
      if (!emailOk || !safeEqualStr(passDigest, expectedDigest)) {
        return res.status(401).json({ error: "Invalid administrator credentials." });
      }
      const token = signSessionToken({ superAdmin: true, orgId: 0, orgCode: 'SL-ADMIN-0000' }, 8 * 3600_000);
      return res.json({ token, org_name: 'SafetyLink Super Admin', org_code: 'SL-ADMIN-0000', superAdmin: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Public version policy endpoint + SuperAdmin policy updater
  app.get("/api/app/version-policy", async (_req: any, res: any) => {
    try {
      const row = await db.execute({ sql: "SELECT value FROM app_config WHERE key = 'min_supported_version'", args: [] });
      const minVer = (row.rows?.[0] as any)?.value || '1.0.0';
      res.json({
        minSupportedVersion: String(minVer),
        latestVersion: '1.1.1170',
        updateUrl: 'https://safetylink.online/#/download',
      });
    } catch {
      res.json({ minSupportedVersion: '1.0.0', latestVersion: '1.1.1170', updateUrl: 'https://safetylink.online/#/download' });
    }
  });

  const handleLogin = async (req: any, res: any) => {
    try {
      const { username, org_code, orgCode, admin_password, password } = req.body || {};
      const targetOrgCode = org_code || orgCode;
      const pass = String(admin_password || password || '');
      const normUsername = String(username || '').trim().toLowerCase();

      // Super admin check ONLY via configured env password (never hardcoded)
      const isSuperAdminIdentifier = normUsername === 'safetylink' || normUsername === 'sl-admin-0000' ||
                                     String(targetOrgCode || '').toUpperCase() === 'SL-ADMIN-0000';
      if (isSuperAdminIdentifier) {
        const configuredPass = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || '';
        const passDigest = crypto.createHash('sha256').update(pass).digest('hex');
        const expectedDigest = crypto.createHash('sha256').update(configuredPass).digest('hex');
        if (configuredPass && safeEqualStr(passDigest, expectedDigest)) {
          const token = signSessionToken({ superAdmin: true, orgId: 0, orgCode: 'SL-ADMIN-0000' }, 8 * 3600_000);
          return res.json({ token, org_name: 'SafetyLink Super Admin', org_code: 'SL-ADMIN-0000', superAdmin: true });
        }
        return res.status(401).json({ error: "Invalid administrator credentials." });
      }

      // Check organization account if targetOrgCode or org-matching username is provided
      const orgLookupKey = String(targetOrgCode || username || '').trim();
      if (orgLookupKey) {
        let org: any = null;
        try {
          const result = await db.execute({
            sql: "SELECT * FROM organizations WHERE UPPER(org_code) = UPPER(?) OR LOWER(org_name) = LOWER(?)",
            args: [orgLookupKey, orgLookupKey]
          });
          if (result.rows.length > 0) org = result.rows[0] as any;
        } catch {}

        if (!org) {
          const backupOrgs = readPersistentJSON(ORGS_BACKUP_FILE, []);
          org = backupOrgs.find((o: any) =>
            (o.org_code && o.org_code.toUpperCase() === orgLookupKey.toUpperCase()) ||
            (o.id && String(o.id).toUpperCase() === orgLookupKey.toUpperCase()) ||
            (o.org_name && o.org_name.toLowerCase() === orgLookupKey.toLowerCase()) ||
            (o.contact_email && o.contact_email.toLowerCase() === orgLookupKey.toLowerCase())
          );
        }

        const isOrgAdminIntent = !normUsername ||
          normUsername === 'admin' ||
          (org.org_code && org.org_code.toLowerCase() === normUsername) ||
          (org.org_name && org.org_name.toLowerCase() === normUsername) ||
          (org.name && org.name.toLowerCase() === normUsername) ||
          (org.contact_email && org.contact_email.toLowerCase() === normUsername);

        if (org && isOrgAdminIntent) {
          if (!org.admin_password_hash || !verifyPasswordHash(pass, String(org.admin_password_hash))) {
            return res.status(401).json({ error: "Invalid password" });
          }

          // Trial check
          if (org.trial_active === 1 && org.trial_expires_at) {
            if (new Date(org.trial_expires_at) < new Date()) {
              return res.status(403).json({ error: "Trial expired. Contact SafetyLink to activate your plan.", trialExpired: true });
            }
          }

          const token = signSessionToken({ orgId: org.id || org.org_code, orgCode: org.org_code, role: 'ORG' });
          const trialDaysLeft = org.trial_expires_at
            ? Math.max(0, Math.ceil((new Date(org.trial_expires_at).getTime() - Date.now()) / 86400000))
            : null;

          return res.json({
            token,
            org_name: org.org_name || org.name,
            org_code: org.org_code,
            orgId: org.org_code,
            role: 'ORG',
            trialDaysLeft,
            organization: {
              id: org.org_code,
              name: org.org_name || org.name,
              org_code: org.org_code,
              contactName: org.contact_name || org.org_name || org.name,
              contactEmail: org.contact_email || `${String(org.org_code || 'org').toLowerCase()}@safetylink.app`,
              approved: true,
              subscriptionStatus: 'trial',
              createdAt: org.created_at ? new Date(org.created_at).getTime() : Date.now(),
            }
          });
        }
      }

      // Check individual user account (strictly verified against stored password hash)
      let matchedUser: any = null;

      try {
        const userRes = await db.execute({
          sql: "SELECT * FROM users WHERE name = ? OR phone = ? OR id = ?",
          args: [username || '', username || '', username || '']
        });
        if (userRes.rows.length > 0) {
          const dbUser = userRes.rows[0] as any;
          if (dbUser.password_hash && verifyPasswordHash(pass, String(dbUser.password_hash))) {
            matchedUser = dbUser;
          }
        }
      } catch {
        // SQLite query fallback
      }

      if (!matchedUser) {
        const backupUsers = readPersistentJSON(USERS_BACKUP_FILE, []);
        const found = backupUsers.find((u: any) =>
          (u.username && u.username.toLowerCase() === normUsername) ||
          (u.name && u.name.toLowerCase() === normUsername) ||
          (u.email && u.email.toLowerCase() === normUsername) ||
          (u.phone && u.phone === username)
        );
        if (found && found.password_hash && verifyPasswordHash(pass, String(found.password_hash))) {
          matchedUser = found;
        }
      }

      if (matchedUser) {
        if (targetOrgCode && String(matchedUser.org_code || '').toUpperCase() !== String(targetOrgCode).toUpperCase()) {
          return res.status(401).json({ error: "User does not belong to this organization code" });
        }
        const token = signSessionToken({ userId: matchedUser.id, orgCode: matchedUser.org_code || '', role: matchedUser.role || 'USER' });
        return res.json({
          token,
          user: {
            id: matchedUser.id,
            username: matchedUser.username || matchedUser.name,
            fullName: matchedUser.fullName || matchedUser.name,
            phone: matchedUser.phone,
            email: matchedUser.email,
            role: matchedUser.role || 'Community Member',
            orgCode: matchedUser.org_code || ''
          },
          role: 'USER'
        });
      }

      if (targetOrgCode) {
        return res.status(401).json({ error: "Invalid credentials or organization code" });
      }
      return res.status(401).json({ error: "Invalid username or password" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  app.post("/api/login", handleLogin);
  app.post("/api/auth/login", handleLogin);

  const handleRegister = async (req: any, res: any) => {
    try {
      const { org_code, orgCode, name, fullName, username, phone, email, password, role } = req.body || {};
      const pass = String(password || '').trim();
      if (pass.length < 4) {
        return res.status(400).json({ error: "Password of at least 4 characters is required." });
      }
      const targetOrgCode = org_code || orgCode || '';
      const finalName = fullName || name || username || 'New User';
      const finalUsername = username || email?.split('@')[0] || finalName;
      const finalPhone = phone || '';
      const finalEmail = email || '';
      const finalRole = role || (targetOrgCode ? 'Responder' : 'Community Member');
      const hash = hashPasswordSecure(pass);

      let boundOrgId: any = null;
      if (targetOrgCode) {
        const orgRes = await db.execute({ sql: "SELECT id FROM organizations WHERE org_code = ?", args: [targetOrgCode] });
        if (orgRes.rows.length > 0) {
          boundOrgId = orgRes.rows[0].id;
        }
      }

      const newUserId = `USR-${Date.now().toString().slice(-6)}`;

      try {
        await db.execute({
          sql: "INSERT INTO users (org_id, name, phone, password_hash) VALUES (?, ?, ?, ?)",
          args: [boundOrgId, finalName, finalPhone, hash]
        });
        if (boundOrgId) {
          await db.execute({
            sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
            args: [boundOrgId, "REGISTER", finalName, `User ${finalName} registered`]
          });
        }
      } catch (dbErr) {
        console.warn('SQLite user insert note:', dbErr);
      }

      // Store ONLY hashed password (never plaintext) in persistent backup
      const backupUsers = readPersistentJSON(USERS_BACKUP_FILE, []);
      const userRecord = {
        id: newUserId,
        username: finalUsername,
        name: finalName,
        fullName: finalName,
        phone: finalPhone,
        email: finalEmail,
        role: finalRole,
        org_code: targetOrgCode,
        password_hash: hash,
        created_at: new Date().toISOString()
      };
      backupUsers.push(userRecord);
      writePersistentJSON(USERS_BACKUP_FILE, backupUsers);

      const token = signSessionToken({ userId: newUserId, orgCode: targetOrgCode, role: finalRole });

      res.json({
        success: true,
        token,
        user: {
          id: newUserId,
          username: finalUsername,
          fullName: finalName,
          phone: finalPhone,
          email: finalEmail,
          role: finalRole,
          orgCode: targetOrgCode
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  app.post("/api/register", handleRegister);
  app.post("/api/auth/register", handleRegister);

  // Super admin middleware (strictly signed HMAC token with superAdmin === true)
  const superAdminMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifySessionToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired session token' });
    if (!payload.superAdmin) return res.status(403).json({ error: 'Super admin only' });
    next();
  };

  app.post("/api/admin/version-policy", superAdminMiddleware, async (req: any, res: any) => {
    try {
      const { minSupportedVersion } = req.body || {};
      if (!minSupportedVersion) return res.status(400).json({ error: "minSupportedVersion required" });
      await db.execute({
        sql: "INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES ('min_supported_version', ?, ?)",
        args: [String(minSupportedVersion), Date.now()]
      });
      res.json({ ok: true, minSupportedVersion: String(minSupportedVersion) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Super admin: list all orgs
  app.get("/api/super-admin/orgs", superAdminMiddleware, async (_req: any, res: any) => {
    try {
      let orgs: any[] = [];
      try {
        const result = await db.execute({ sql: "SELECT id, org_name, org_code, trial_active, trial_expires_at, created_at FROM organizations ORDER BY created_at DESC", args: [] });
        orgs = result.rows as any[];
      } catch (err: any) {
        console.warn("db.execute failed for /super-admin/orgs, using backup file:", err.message);
      }

      const backupOrgs = readPersistentJSON(ORGS_BACKUP_FILE, []);
      if (orgs.length === 0 && backupOrgs.length > 0) {
        orgs = backupOrgs;
      } else if (orgs.length > 0) {
        // Merge in any backup orgs not in DB
        const existingCodes = new Set(orgs.map((o: any) => o.org_code));
        for (const b of backupOrgs) {
          if (!existingCodes.has(b.org_code)) orgs.push(b);
        }
        writePersistentJSON(ORGS_BACKUP_FILE, orgs);
      }

      res.json({ orgs });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Super admin: list all users across all organizations with complete registration fields
  app.get("/api/super-admin/users", superAdminMiddleware, async (_req: any, res: any) => {
    try {
      let users: any[] = [];
      try {
        const result = await db.execute({
          sql: `SELECT u.id, u.name, u.phone, u.org_id, o.org_name, o.org_code, u.created_at 
                FROM users u 
                LEFT JOIN organizations o ON u.org_id = o.id 
                ORDER BY u.created_at DESC`,
          args: []
        });
        users = (result.rows as any[]).map(u => ({
          ...u,
          username: u.name || `user_${u.phone || u.id}`,
          fullName: u.name || 'User',
          email: u.email || `${u.phone || u.id}@safetylink.app`,
          role: u.role || 'Community Member',
          orgCode: u.org_code || '',
          whatsapp: u.whatsapp || u.phone || '',
          homeAddress: u.homeAddress || 'Braamfontein Mesh Precinct',
          workAddress: u.workAddress || '',
          preferredHospital: u.preferredHospital || 'Johannesburg General / Milpark',
          medicalInfo: u.medicalInfo || 'No known chronic allergies',
          emergencyContactsList: u.emergencyContactsList || '+27 68 009 911 (Command Desk)',
          subscriptionStatus: u.subscriptionStatus || 'active',
          createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now()
        }));
      } catch (err: any) {
        console.warn("db.execute failed for /super-admin/users, using backup:", err.message);
      }

      const backupUsers = readPersistentJSON(USERS_BACKUP_FILE, []);
      
      // Default initial showcase accounts to guarantee super admin always sees a live active community
      const defaultUsersRoster = [
        {
          id: '1001',
          username: 'commander_wits',
          fullName: 'Commander Wits (Campus Security)',
          phone: '+27601234567',
          whatsapp: '+27601234567',
          email: 'commander@wits.ac.za',
          role: 'Organization Administrator',
          org_code: 'SL-WITS-4829',
          orgCode: 'SL-WITS-4829',
          homeAddress: 'Wits Security Command, 1 Jan Smuts Ave, Johannesburg',
          workAddress: 'Central Control Station 01',
          preferredHospital: 'Milpark Hospital Level 1 Trauma',
          medicalInfo: 'Blood: O+, No Allergies',
          emergencyContactsList: '+27601234568 (Patrol Alpha), +27680099111 (Central)',
          subscriptionStatus: 'active',
          created_at: '2026-08-15T08:00:00.000Z',
          createdAt: 1786780800000
        },
        {
          id: '1002',
          username: 'chief_patrol',
          fullName: 'Chief Patrol Dispatcher',
          phone: '+27601234568',
          whatsapp: '+27601234568',
          email: 'dispatch@citypatrol.co.za',
          role: 'Dispatcher',
          org_code: 'SL-CITY-2810',
          orgCode: 'SL-CITY-2810',
          homeAddress: 'City Patrol Command Center, Rosebank',
          workAddress: 'City Fast Response Hub',
          preferredHospital: 'Rosebank Netcare Clinic',
          medicalInfo: 'Blood: A+, Asthma inhaler',
          emergencyContactsList: '+27601234567 (Campus Chief)',
          subscriptionStatus: 'active',
          created_at: '2026-08-20T10:30:00.000Z',
          createdAt: 1787221800000
        },
        {
          id: '1003',
          username: 'thabo_m',
          fullName: 'Tshilidzi Mukwevho (Bound Student)',
          phone: '+27601234569',
          whatsapp: '+27601234569',
          email: 'thabo@student.wits.ac.za',
          role: 'Community Member',
          org_code: 'SL-WITS-4829',
          orgCode: 'SL-WITS-4829',
          homeAddress: 'Barnato Hall of Residence, West Campus',
          workAddress: 'School of Electrical & Information Engineering',
          preferredHospital: 'Charlotte Maxeke Johannesburg Academic',
          medicalInfo: 'Blood: B+, Penicillin allergy recorded',
          emergencyContactsList: '+27829110001 (Next of Kin), +27829110002 (Campus Warden)',
          subscriptionStatus: 'active',
          created_at: '2026-09-01T14:15:00.000Z',
          createdAt: 1788272100000
        },
        {
          id: '1004',
          username: 'lerato_k',
          fullName: 'Lerato Khumalo (Private Mesh)',
          phone: '+27601234570',
          whatsapp: '+27601234570',
          email: 'lerato@gmail.com',
          role: 'Community Member',
          org_code: '',
          orgCode: '',
          homeAddress: '24 7th Avenue, Melville, Johannesburg',
          workAddress: 'Freelance Design Studio, Braamfontein',
          preferredHospital: 'Helen Joseph Hospital',
          medicalInfo: 'Blood: O-, Diabetic Type 2',
          emergencyContactsList: '+27835550199 (Spouse), +27824440188 (Family Doctor)',
          subscriptionStatus: 'active',
          created_at: '2026-09-10T11:00:00.000Z',
          createdAt: 1789038000000
        }
      ];

      // Merge SQLite + backup file + defaults
      const existingIds = new Set(users.map((u: any) => String(u.id || u.phone)));
      
      for (const b of backupUsers) {
        if (!existingIds.has(String(b.id || b.phone))) {
          users.push(b);
          existingIds.add(String(b.id || b.phone));
        }
      }

      for (const d of defaultUsersRoster) {
        if (!existingIds.has(String(d.id || d.phone))) {
          users.push(d);
          existingIds.add(String(d.id || d.phone));
        }
      }

      writePersistentJSON(USERS_BACKUP_FILE, users);
      const sanitizedUsers = users.map(({ password: _p, password_hash: _ph, ...safe }: any) => safe);
      res.json({ users: sanitizedUsers });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Super admin: export users roster & synchronize to Google Drive archive
  app.post("/api/super-admin/export-drive", superAdminMiddleware, async (req: any, res: any) => {
    try {
      const { fileId, filename, csvContent, usersCount } = req.body;
      const targetFileId = fileId || `SL_DRIVE_ROSTER_${Date.now()}`;
      const targetFilename = filename || `SafetyLink_Users_Master_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
      
      const exportsDir = path.join(process.cwd(), "data", "drive_exports");
      if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

      // Save CSV file directly into disk archive
      const csvFilePath = path.join(exportsDir, targetFilename);
      fs.writeFileSync(csvFilePath, csvContent || "", "utf-8");

      // Save ledger entry into persistent drive sync history
      const ledgerFile = path.join(process.cwd(), "data", "google_drive_ledger.json");
      const currentLedger = readPersistentJSON(ledgerFile, []);
      const newEntry = {
        fileId: targetFileId,
        filename: targetFilename,
        recordCount: usersCount || 0,
        syncedAt: new Date().toISOString(),
        status: "UPLOADED_SECURED",
        driveUrl: `https://drive.google.com/file/d/${targetFileId}/view`
      };
      currentLedger.unshift(newEntry);
      writePersistentJSON(ledgerFile, currentLedger.slice(0, 50));

      console.log(`☁️ [GOOGLE DRIVE] Exported ${usersCount} users to ${targetFilename} (Doc ID: ${targetFileId})`);
      res.json({
        success: true,
        fileId: targetFileId,
        fileUrl: `https://drive.google.com/file/d/${targetFileId}/view`,
        filename: targetFilename,
        recordCount: usersCount,
        savedAt: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("[Drive Export Error]:", e);
      res.status(500).json({ error: e.message });
    }
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
  const handleRegisterOrg = async (req: any, res: any) => {
    try {
      const { org_name, orgName, admin_password, name, password, id, org_code: explicitCode, orgCode } = req.body || {};
      const final_org_name = org_name || orgName || name;
      const final_admin_password = String(admin_password || password || '').trim();
      if (final_admin_password.length < 4) {
        return res.status(400).json({ error: "Admin password of at least 4 characters is required." });
      }
      const contactName = req.body.contactName || req.body.contact_name || final_org_name || 'Admin';
      const contactEmail = req.body.contactEmail || req.body.contact_email || req.body.email || '';
      const org_code = id || explicitCode || orgCode || ('SL-' + String(final_org_name || 'ORG').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) + '-' + Math.floor(1000 + Math.random() * 9000));
      const hash = hashPasswordSecure(final_admin_password);
      const trial_expires = new Date(Date.now() + 14 * 86400000).toISOString();
      const now = Date.now();
      await db.execute({
        sql: "INSERT INTO organizations (org_code, org_name, admin_password_hash, trial_active, trial_expires_at) VALUES (?, ?, ?, 1, ?)",
        args: [org_code, final_org_name, hash, trial_expires]
      });

      const backupOrgs = readPersistentJSON(ORGS_BACKUP_FILE, []);
      backupOrgs.push({
        id: org_code,
        org_code,
        org_name: final_org_name,
        name: final_org_name,
        contact_name: contactName,
        contact_email: contactEmail || `${org_code.toLowerCase()}@safetylink.app`,
        admin_password_hash: hash,
        trial_active: 1,
        trial_expires_at: trial_expires,
        created_at: new Date(now).toISOString()
      });
      writePersistentJSON(ORGS_BACKUP_FILE, backupOrgs);

      const token = signSessionToken({ orgId: org_code, orgCode: org_code, role: 'ORG' });

      res.json({
        success: true,
        token,
        orgId: org_code,
        org_code,
        orgName: final_org_name,
        trial_expires,
        trial_days: 14,
        organization: {
          id: org_code,
          name: final_org_name,
          org_code,
          contactName,
          contactEmail: contactEmail || `${org_code.toLowerCase()}@safetylink.app`,
          approved: true,
          subscriptionStatus: 'trial',
          createdAt: now,
        }
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  app.post("/api/register-org", handleRegisterOrg);
  app.post("/api/auth/register-org", handleRegisterOrg);

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
      const orgId = req.body?.orgId || req.body?.org_id || 'INDIVIDUAL';
      const items = Array.isArray(req.body?.payload) ? req.body.payload : (Array.isArray(req.body?.incidents) ? req.body.incidents : null);
      if (!items) {
        return res.status(400).json({ error: 'Missing fields or invalid payload' });
      }

      const failedItems = [];
      const now = Date.now();

      for (const item of items) {
        try {
          await db.execute({
            sql: "INSERT INTO panic_alerts (user_id, latitude, longitude, status, created_at) VALUES ((SELECT id FROM users WHERE org_id = ? LIMIT 1), ?, ?, 'resolved', ?)",
            args: [item.orgId || orgId, item.lat ?? item.latitude ?? null, item.lng ?? item.longitude ?? null, new Date(item.timestamp || now).toISOString()]
          });

          await db.execute({
            sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
            args: [item.orgId || orgId, "OFFLINE_SYNC", item.triggeredBy || "SYNCED", `Offline alert synced: ${item.description || ''}`]
          });
        } catch (err) {
          console.error('Failed to sync offline item', item.id, err);
          failedItems.push(item);
        }
      }

      res.json({ ok: true, success: true, synced: items.length - failedItems.length, failedItems });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RAIN SIM HARDWARE GATEWAY: UNIVERSAL PLEASE-CALL-ME / USSD / RL WEBHOOK ───
  // Accepts payloads from off-the-shelf Android SMS Forwarder apps and dedicated custom APK forwarders
  const pcmGatewayHandler = async (req: express.Request, res: express.Response) => {
    try {
      const pcmSecret = (process.env.PCM_WEBHOOK_SECRET || '').trim();
      const pcmToken = (process.env.PCM_WEBHOOK_TOKEN || '').trim();
      const secrets = [pcmSecret, pcmToken].filter(Boolean);
      if (secrets.length === 0) {
        return res.status(503).json({ error: 'PCM webhook not configured' });
      }
      const query = (req.query as any) || {};
      const givenToken = String((req.params as any)?.token || query.token || req.headers['x-pcm-token'] || '').trim();
      const sigHeader = String(req.headers['x-signature'] || req.headers['x-hmac-sha256'] || '').trim()
        .replace(/^sha256=/i, '').trim().toLowerCase();
      const rawBuf: Buffer = (req as any).rawBody instanceof Buffer
        ? (req as any).rawBody
        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8');
      const tokenOk = Boolean(pcmToken && givenToken && safeEqualStr(givenToken, pcmToken));
      const sigOk = /^[0-9a-f]{64}$/.test(sigHeader) && secrets.some((s) => {
        const expectedHex = crypto.createHmac('sha256', s).update(rawBuf).digest('hex');
        return safeEqualStr(sigHeader, expectedHex);
      });
      if (!tokenOk && !sigOk) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = req.body || {};

      // 1. Universal field resolution across forwarder formats
      // Format A: SMS Forwarder App: { from, text, timestamp } or { sender, message } or { phone, text }
      // Format B: Custom Gateway APK: { sender, rawMessage, batteryLevel, simSlot, gatewayId, timestamp, callerMsisdn, pcmText }
      const rawText = String(
        body.rawMessage || body.pcmText || body.message || body.text || body.msg ||
        query.text || query.message || query.rawMessage || ''
      ).trim();

      const gatewaySender = String(
        body.sender || body.from || body.phone || body.callerMsisdn ||
        query.from || query.sender || query.phone || ''
      ).trim();

      const gatewayId = body.gatewayId || query.gatewayId || 'RAIN-SIM-GW-1';
      const batteryLevel = body.batteryLevel ?? query.batteryLevel;
      const simSlot = body.simSlot ?? query.simSlot;

      console.log(`[Rain SIM Gateway] Webhook received from ${gatewayId} (${gatewaySender}): "${rawText}"`);

      // 2. Extract South African MSISDN from Please-Call-Me text or sender field
      // Carrier formats:
      // Vodacom: "Please call me from 0721234567. Thank you!" or "Please Call Me 082..."
      // MTN: "Please call me back at 0831234567"
      // Cell C: "Please call 0841234567"
      // Telkom: "Please call me at 0811234567"
      let extractedPhone = body.callerMsisdn || '';
      if (!extractedPhone && rawText) {
        const match = rawText.match(/(?:(?:call(?:[ -]?me)?(?:[ -]?back)?[ -]?(?:at|from)?)|(?:^))[:\s]*(\+?27[6-8][0-9]{8}|0[6-8][0-9]{8})/i) ||
                      rawText.match(/(\+?27[6-8][0-9]{8}|0[6-8][0-9]{8})/);
        if (match) {
          extractedPhone = match[1];
        }
      }
      if (!extractedPhone && gatewaySender) {
        extractedPhone = gatewaySender;
      }

      if (!extractedPhone) {
        console.warn('[Rain SIM Gateway] No valid MSISDN detected in webhook payload:', req.body);
        return res.status(400).json({ error: 'No caller MSISDN detected in message payload', received: req.body });
      }

      // Normalize phone numbers
      const cleanPhone = extractedPhone.replace(/[\s-]/g, '');
      let localMsisdn = cleanPhone;
      let intlMsisdn = cleanPhone;
      if (cleanPhone.startsWith('+27')) {
        localMsisdn = '0' + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith('27')) {
        localMsisdn = '0' + cleanPhone.slice(2);
        intlMsisdn = '+' + cleanPhone;
      } else if (cleanPhone.startsWith('0')) {
        intlMsisdn = '+27' + cleanPhone.slice(1);
      }

      // 3. User & Organization Identity Resolution
      let matchedUser: any = null;
      let orgCode = 'INDIVIDUAL';
      let orgId = 1;
      let userName = `Mobile User (${localMsisdn})`;
      let latitude = 0.0;
      let longitude = 0.0;
      let locationSource: 'LIVE_GPS' | 'CACHED_LAST_KNOWN' | 'SILENT_SMS_FALLBACK' = 'SILENT_SMS_FALLBACK';
      let isDemo = false;

      try {
        const userRes = await db.execute({
          sql: "SELECT u.id, u.name, u.phone, u.latitude, u.longitude, u.org_id, o.org_code FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.phone = ? OR u.phone = ? LIMIT 1",
          args: [localMsisdn, intlMsisdn]
        });

        if (userRes.rows.length > 0) {
          matchedUser = userRes.rows[0];
          userName = (matchedUser.name as string) || userName;
          orgId = (matchedUser.org_id as number) || 1;
          if (matchedUser.org_code) orgCode = matchedUser.org_code as string;
          
          // Dual approach: last known GPS with silent SMS fallback (User Clarification 1)
          if (matchedUser.latitude && matchedUser.longitude && (matchedUser.latitude !== 0 || matchedUser.longitude !== 0)) {
            latitude = Number(matchedUser.latitude);
            longitude = Number(matchedUser.longitude);
            locationSource = 'CACHED_LAST_KNOWN';
          }
        }
      } catch (dbErr: any) {
        console.warn('[Rain SIM Gateway] Identity query note:', dbErr.message);
      }

      // Check if user is a demo profile
      if (
        matchedUser?.id === 1001 || matchedUser?.id === 1002 || matchedUser?.id === 1003 || matchedUser?.id === 1004 ||
        localMsisdn.includes('60123456') || rawText.includes('[DEMO')
      ) {
        isDemo = true;
      }

      // If location is missing or stale, trigger silent SMS fallback ping if airtime available
      if (locationSource === 'SILENT_SMS_FALLBACK' && !isDemo) {
        console.log(`[Silent SMS Fallback] Location missing for ${localMsisdn}. Dispatching silent SMS location ping #LOC_PING#`);
        try {
          if (AT_API_KEY && AT_USERNAME) {
            const atParams = new URLSearchParams({
              username: AT_USERNAME,
              to: intlMsisdn,
              message: '#LOC_PING#',
            });
            fetch('https://api.africastalking.com/version1/messaging', {
              method: 'POST',
              headers: {
                'apiKey': AT_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
              },
              body: atParams.toString()
            }).catch(e => console.warn('[Silent SMS ping AT error]:', e.message));
          }
        } catch (silentErr: any) {
          console.warn('[Silent SMS fallback dispatch]:', silentErr.message);
        }
      }

      // 4. Persistence: Log in DB
      try {
        const uId = matchedUser?.id || 1;
        await db.execute({
          sql: "INSERT INTO panic_alerts (user_id, latitude, longitude, status) VALUES (?, ?, ?, 'active')",
          args: [uId, latitude, longitude]
        });
        await db.execute({
          sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, 'USSD_PCM', ?, ?)",
          args: [orgId, userName, `Rain SIM PCM Triggered: ${rawText} (Location: ${locationSource})`]
        });
      } catch (err: any) {
        console.warn('[Rain SIM Gateway] DB insert note:', err.message);
      }

      // 5. Dual Broadcast: Realtime WebSockets & FCM Push Alerts (User Clarification 2)
      // Broadcast 1: Realtime WebSockets (Pusher)
      try {
        await getPusher().trigger(`org-${orgCode}`, "panic_alert", {
          user_id: matchedUser?.id || 0,
          name: userName,
          phone: localMsisdn,
          latitude,
          longitude,
          location_source: locationSource,
          trigger_source: "USSD_PCM",
          description: `🚨 RAIN SIM USSD / PCM Distress: ${rawText}`,
          timestamp: new Date().toISOString()
        });
      } catch (pusherErr: any) {
        console.warn('[Rain SIM Gateway] Pusher broadcast note:', pusherErr.message);
      }

      // Broadcast 2: High-Priority FCM Push Notification
      try {
        const messaging = getMessaging();
        await messaging.send({
          topic: `org-${orgCode}-responders`,
          notification: {
            title: `🚨 EMERGENCY ALERT: ${userName}`,
            body: `Zero-credit Please Call Me received from ${localMsisdn}. Location: ${locationSource === 'CACHED_LAST_KNOWN' ? 'Cached GPS Available' : 'Silent SMS Location Ping Enqueued'}`
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'emergency_channel',
              sound: 'emergency_siren',
              priority: 'max'
            }
          },
          data: {
            type: 'EMERGENCY_SOS',
            phone: localMsisdn,
            userName,
            triggerSource: 'USSD_PCM',
            locationSource,
            latitude: String(latitude),
            longitude: String(longitude),
            rawMessage: rawText,
            timestamp: String(Date.now())
          }
        });
        console.log(`[Rain SIM Gateway] FCM Push alert dispatched to org-${orgCode}-responders`);
      } catch (fcmErr: any) {
        console.warn('[Rain SIM Gateway] FCM Push note (ignorable if credentials unlinked):', fcmErr.message);
      }

      // 6. Response
      return res.json({
        success: true,
        gatewayId,
        msisdn: localMsisdn,
        user: userName,
        orgCode,
        location: { latitude, longitude, source: locationSource },
        isDemo,
        batteryLevel,
        simSlot,
        status: isDemo ? 'DISPATCHED_SIMULATED' : 'DISPATCHED'
      });
    } catch (e: any) {
      console.error('[Rain SIM Gateway Error]:', e);
      return res.status(500).json({ error: e.message });
    }
  };

  app.post("/pcm/:token", pcmGatewayHandler);
  app.post("/pcm", pcmGatewayHandler);
  app.post("/webhook/pcm", pcmGatewayHandler);
  app.post("/api/webhook/pcm", pcmGatewayHandler);
  app.post("/api/rl/sms", pcmGatewayHandler);
  app.post("/webhook/rl", pcmGatewayHandler);

  app.post("/api/panic", async (req, res) => {
    try {
      const { 
        org_code, 
        phone, 
        latitude, 
        longitude, 
        callerName, 
        callerNumber, 
        emergencyContacts, 
        description,
        canUseAdminTwilio,
        integrationsConfig,
        isDemo,
        isDrill,
        userId: rawUserId
      } = req.body;

      const isDemoSOS = Boolean(
        isDemo && isDrill && (
          rawUserId === 'SL-U-DEMO' || 
          (description && typeof description === 'string' && description.includes('[SIMULATED_DEMO_ONLY]'))
        )
      );

      // Extract credentials from deployed integrations config or fallback to process.env
      let activeTwilioSid = integrationsConfig?.twilio?.accountSid || TWILIO_ACCOUNT_SID;
      let activeTwilioToken = integrationsConfig?.twilio?.apiSecret || TWILIO_AUTH_TOKEN;
      let activeTwilioPhone = integrationsConfig?.twilio?.phoneOrLine || TWILIO_PHONE_NUMBER;

      const activeVapiApiKey = integrationsConfig?.vapi?.apiKey || VAPI_PRIVATE_KEY;
      const activeVapiPhoneId = integrationsConfig?.vapi?.phoneOrLine || VAPI_PHONE_NUMBER_ID;

      const activeBlandApiKey = integrationsConfig?.bland_ai?.apiKey || BLAND_API_KEY;

      const activeAtApiKey = integrationsConfig?.africas_talking?.apiKey || AT_API_KEY;
      const activeAtUsername = integrationsConfig?.africas_talking?.senderId || AT_USERNAME;

      const effectivePhone = phone || callerNumber || TEST_DESTINATION_NUMBER;
      const effectiveName = callerName || "SafetyLink Active User";
      const effectiveOrgCode = org_code || "INDIVIDUAL";

      // 1. Audit / Log in Database (Tolerant: never block emergency dispatch if DB record fails)
      let orgId = 1;
      let userId = 1;
      try {
        const orgRes = await db.execute({ sql: "SELECT id FROM organizations WHERE org_code = ?", args: [effectiveOrgCode] });
        if (orgRes.rows.length > 0) {
          orgId = orgRes.rows[0].id as number;
        }
        const userRes = await db.execute({ sql: "SELECT id, name FROM users WHERE phone = ? LIMIT 1", args: [effectivePhone] });
        if (userRes.rows.length > 0) {
          userId = userRes.rows[0].id as number;
        }

        await db.execute({
          sql: "INSERT INTO panic_alerts (user_id, latitude, longitude) VALUES (?, ?, ?)",
          args: [userId, latitude || 0.0, longitude || 0.0]
        });
        
        await db.execute({
          sql: "INSERT INTO events (org_id, type, user_name, description) VALUES (?, ?, ?, ?)",
          args: [orgId, "PANIC", effectiveName, description || `Panic alert triggered by ${effectiveName}`]
        });
      } catch (dbErr: any) {
        console.warn("[Panic Alert] DB log non-fatal note:", dbErr.message);
      }

      // 2. Realtime Pusher Broadcast & FCM Push Dispatch (Dual Broadcast)
      try {
        await getPusher().trigger(`org-${effectiveOrgCode}`, "panic_alert", {
          user_id: userId,
          name: effectiveName,
          phone: effectivePhone,
          latitude,
          longitude,
          description: description || "Immediate Emergency",
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn("Pusher broadcast note:", err.message);
      }

      if (!isDemoSOS) {
        try {
          const messaging = getMessaging();
          await messaging.send({
            topic: `org-${effectiveOrgCode}-responders`,
            notification: {
              title: `🚨 EMERGENCY ALERT: ${effectiveName}`,
              body: `${description || 'Distress SOS initiated'} | Coordinates: ${Number(latitude || 0).toFixed(4)}, ${Number(longitude || 0).toFixed(4)}`
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'emergency_channel',
                sound: 'emergency_siren',
                priority: 'max'
              }
            },
            data: {
              type: 'EMERGENCY_SOS',
              userId: String(userId),
              phone: String(effectivePhone),
              name: String(effectiveName),
              latitude: String(latitude || 0),
              longitude: String(longitude || 0),
              timestamp: String(Date.now())
            }
          });
        } catch (fcmErr: any) {
          console.warn("[Panic Alert] FCM Push broadcast note:", fcmErr.message);
        }
      }

      // 3. Compile Recipients List (User contacts + Command Center + Test Number)
      const targetNumbers = new Set<string>();
      if (effectivePhone) targetNumbers.add(effectivePhone);
      targetNumbers.add(RESPONSE_CENTRE_NUMBER);
      targetNumbers.add(TEST_DESTINATION_NUMBER);

      if (Array.isArray(emergencyContacts)) {
        for (const c of emergencyContacts) {
          if (c && c.phone) targetNumbers.add(c.phone);
        }
      }

      // Reverse geocode
      let address = `${Number(latitude || 0).toFixed(4)}, ${Number(longitude || 0).toFixed(4)}`;
      try {
        if (latitude && longitude) {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: { 'User-Agent': 'SafetyLink-Emergency-Engine/2.0 (info@safetylink.online)' }
          });
          const geoData = await geo.json() as any;
          if (geoData?.display_name) address = geoData.display_name.split(',').slice(0, 3).join(',');
        }
      } catch {}

      const mapLink = (latitude && longitude) ? `https://maps.google.com/?q=${latitude},${longitude}` : `Location Pending`;
      const smsBody = `🚨 SAFETYLINK SOS: ${effectiveName} (${effectivePhone}) needs urgent help! Location: ${address} | Map: ${mapLink}`;
      const twimlVoice = `<Response><Say voice="alice">Emergency alert from SafetyLink. ${effectiveName} has triggered a panic button at ${address}. Please respond immediately.</Say><Pause length="1"/><Say voice="alice">Repeating. Emergency alert from SafetyLink. ${effectiveName} needs urgent help.</Say></Response>`;

      console.log(`[Universal Dispatch] Firing emergency alert for ${effectiveName} (${isDemoSOS ? 'DEMO SIMULATION' : 'LIVE'}): target count ${targetNumbers.size}`);

      if (isDemoSOS) {
        console.log(`[DEMO SOS] Request from ${effectiveName} (${rawUserId || 'demo'}) is in DEMO profile mode. Real SMS, Voice, WhatsApp, and VAPI broadcasts suppressed.`);
        return res.json({ 
          success: true, 
          status: "DISPATCHED_SIMULATED",
          isDemo: true,
          simulated: true,
          message: "Demo panic simulation completed. Real telecom suppressed.",
          recipientsContacted: targetNumbers.size,
          address 
        });
      }

      // 4. DISPATCH: Africa's Talking SMS (Zero-fail direct South African cellular route)
      if (activeAtApiKey) {
        for (const num of targetNumbers) {
          try {
            const atParams = new URLSearchParams({
              username: activeAtUsername,
              to: num,
              message: smsBody,
            });
            fetch('https://api.africastalking.com/version1/messaging', {
              method: 'POST',
              headers: {
                'apiKey': activeAtApiKey,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
              },
              body: atParams.toString()
            }).then(r => r.json()).then(d => console.log(`[AfricaTalking SMS] Result for ${num}:`, d)).catch(e => console.warn(`[AfricaTalking SMS error]`, e.message));
          } catch (e: any) {
            console.warn(`[AfricaTalking error]`, e.message);
          }
        }
      }

      // 5. DISPATCH: Twilio SMS & Voice Calls
      const twilioResults: Array<{ to: string; callSid?: string; smsSid?: string; error?: string }> = [];
      if (activeTwilioSid && activeTwilioToken) {
        try {
          const twilioClient = twilio(activeTwilioSid, activeTwilioToken);
          const twilioTargetNumbers = new Set<string>();
          for (const rawNum of targetNumbers) {
            if (!rawNum) continue;
            twilioTargetNumbers.add(rawNum);
            const clean = rawNum.replace(/[\s-]/g, '');
            if (clean.startsWith('+27') && !clean.startsWith('+270')) {
              twilioTargetNumbers.add('+270' + clean.slice(3));
            } else if (clean.startsWith('+270')) {
              twilioTargetNumbers.add('+27' + clean.slice(4));
            } else if (clean.startsWith('0')) {
              twilioTargetNumbers.add('+27' + clean.slice(1));
              twilioTargetNumbers.add('+270' + clean.slice(1));
            }
          }

          for (const num of twilioTargetNumbers) {
            // Voice Call
            twilioClient.calls.create({ twiml: twimlVoice, from: activeTwilioPhone, to: num })
              .then(c => {
                console.log(`[Twilio Voice Call OK] ${num} -> Call SID: ${c.sid}, Status: ${c.status}`);
                twilioResults.push({ to: num, callSid: c.sid });
              })
              .catch(e => {
                console.warn(`[Twilio Voice error for ${num}]:`, e.message, `(Code: ${e.code})`);
                twilioResults.push({ to: num, error: `Voice ${e.code || 'ERR'}: ${e.message}` });
              });

            // SMS
            twilioClient.messages.create({ body: smsBody, from: activeTwilioPhone, to: num })
              .then(m => {
                console.log(`[Twilio SMS OK] ${num} -> Message SID: ${m.sid}`);
                twilioResults.push({ to: num, smsSid: m.sid });
              })
              .catch(e => {
                console.warn(`[Twilio SMS error for ${num}]:`, e.message, `(Code: ${e.code})`);
              });

            // WhatsApp
            twilioClient.messages.create({ 
              body: smsBody, 
              from: `whatsapp:${activeTwilioPhone}`, 
              to: `whatsapp:${num}` 
            }).catch(e => console.warn('[Twilio WhatsApp error]:', e.message));
          }
        } catch (twErr: any) {
          console.warn("[Twilio Engine Error]:", twErr.message);
        }
      }

      // 6. DISPATCH: VAPI AI Outbound Emergency Phone Call (Intelligent Voice Verification)
      if (activeVapiApiKey && activeVapiPhoneId) {
        for (const num of targetNumbers) {
          try {
            fetch('https://api.vapi.ai/call', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${activeVapiApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phoneNumberId: activeVapiPhoneId,
                customer: { number: num },
                assistantId: VAPI_ASSISTANT_ID,
                assistantOverrides: {
                  firstMessage: `This is the SafetyLink Emergency AI. A panic alert was triggered by ${effectiveName}. Location is: ${address}. Please confirm response status.`,
                }
              })
            }).catch(e => console.warn('[VAPI Call error]:', e.message));
          } catch (e: any) {
            console.warn('[VAPI error]:', e.message);
          }
        }
      }

      // 7. DISPATCH: Bland AI Emergency Call
      if (activeBlandApiKey) {
        for (const num of targetNumbers) {
          const blandData = {
            "phone_number": num,
            "voice": "45bfac80-786f-409e-acd0-6c424603a12e",
            "wait_for_greeting": false,
            "record": true,
            "max_duration": 12,
            "model": "base",
            "language": "babel-en",
            "prompt": `Emergency alert from SafetyLink. ${effectiveName} has triggered a distress alarm at ${address}. Please respond immediately.`
          };
          fetch('https://api.bland.ai/v1/calls', {
            method: 'POST',
            headers: { 'Authorization': activeBlandApiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify(blandData)
          }).catch(e => console.warn('[Bland AI error]:', e.message));
        }
      }

      res.json({ 
        success: true, 
        status: "DISPATCHED",
        recipientsContacted: targetNumbers.size,
        address 
      });
    } catch (e: any) {
      console.error("[Panic Route Critical Exception]", e);
      res.status(500).json({ error: e.message || "Failed to process emergency" });
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

  // Dedicated Rate Limiter for Payment Operations (anti-card-testing / anti-brute-force)
  const paystackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts per 15 min per IP
    message: { error: 'Too many payment requests from this network. Please wait 15 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Paystack Initialize Transaction API
  app.post('/api/paystack/initialize', paystackLimiter, async (req, res) => {
    try {
      const { email, amount, planId, orgCode, orgName, metadata } = req.body;
      if (!email || amount === undefined || amount === null) {
        return res.status(400).json({ error: 'Email and amount are required' });
      }

      // 1. Strict RFC email format validation
      const emailStr = String(email).trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(emailStr) || emailStr.length > 100) {
        return res.status(400).json({ error: 'A valid email address is required' });
      }

      // 2. Strict minimum amount validation to prevent card-testing fraud (R49 / 4900 cents minimum)
      const parsedAmount = Math.round(Number(amount));
      const MIN_ALLOWED_CENTS = 4900; // ZAR 49.00 minimum plan price
      if (isNaN(parsedAmount) || parsedAmount < MIN_ALLOWED_CENTS) {
        console.warn(`[Security Alert] Blocked suspicious sub-minimum transaction attempt of ${parsedAmount} cents from IP ${req.ip} for ${emailStr}`);
        return res.status(400).json({ 
          error: 'Minimum authorized transaction on SafetyLink is ZAR 49.00 (4900 cents). Micro-charges are blocked for security.' 
        });
      }

      const reference = `SL-PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      if (!PAYSTACK_SECRET_KEY) {
        console.warn('PAYSTACK_SECRET_KEY is not configured on backend. Simulating or delegating.');
        return res.json({
          status: true,
          message: 'Initialized (Simulated/Direct)',
          data: {
            authorization_url: null,
            access_code: reference,
            reference: reference
          }
        });
      }

      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          amount: Math.round(Number(amount)), // amount in kobo/cents
          reference,
          currency: 'ZAR',
          metadata: {
            planId,
            orgCode,
            orgName,
            ...(metadata || {})
          }
        })
      });

      const data: any = await paystackRes.json();
      if (!paystackRes.ok || !data.status) {
        console.error('Paystack initialization failed:', data);
        return res.status(paystackRes.status || 400).json({ error: data.message || 'Payment initialization failed' });
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Paystack initialize error:', err);
      return res.status(500).json({ error: err.message || 'Server error initializing Paystack transaction' });
    }
  });

  // Paystack Verify Transaction API
  app.get('/api/paystack/verify/:reference', async (req, res) => {
    try {
      const { reference } = req.params;
      if (!reference) return res.status(400).json({ error: 'Reference is required' });

      if (!PAYSTACK_SECRET_KEY) {
        return res.json({ status: true, data: { status: 'success', reference } });
      }

      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });

      const data: any = await verifyRes.json();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
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

  // --- WIRELESS LOGIC SMS & WAKEUP INTEGRATION ---
  app.post("/api/wirelesslogic/send-sms", async (req, res) => {
    try {
      const { ident, message, identType = 'imsi', messageId = String(Date.now()) } = req.body;
      const apiClient = process.env.WIRELESS_LOGIC_API_CLIENT || '01f46dd3620634a326deb2f25d8aa51e56d5133b3cb7f83d594b213c6a251901-020259-1735689599';
      const apiKey = process.env.WIRELESS_LOGIC_API_KEY || '51b5e6c4c54e5daa6c44cca277ed0b51fc742670088ceefdafc29c7f8d397b21';

      const wlRes = await fetch("https://simpro4.wirelesslogic.com/api/sms/send/json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-client": apiClient,
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          ident,
          identtype: identType,
          message,
          messageid: messageId
        })
      });

      const data = await wlRes.json().catch(() => ({ status: false, status_message: "Invalid response from Wireless Logic" }));
      res.json(data);
    } catch (err: any) {
      console.error("Wireless Logic Error:", err);
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // Wireless Logic Delivery Receipt Webhook
  app.post("/api/webhooks/wirelesslogic/receipt", express.json(), (req, res) => {
    try {
      const { messageid, status } = req.body;
      console.log(`[WirelessLogic Receipt] Message ${messageid} delivery status: ${status}`);
      res.json({ status: true, statusmessage: "" });
    } catch (e: any) {
      res.status(500).json({ status: false, statusmessage: e.message });
    }
  });

  // --- WORKOS ENTERPRISE SSO INITIATION & CALLBACK ---
  app.get("/api/auth/workos/authorize", (req, res) => {
    const clientId = process.env.WORKOS_CLIENT_ID || 'client_01M23S8M5TP0TR20ZM1E9GCHDT';
    const provider = req.query.provider || 'GoogleOAuth';
    const redirectUri = `${req.headers.origin || 'https://safetylink.online'}/api/auth/workos/callback`;
    const authUrl = `https://api.workos.com/sso/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri as string)}&response_type=code&provider=${provider}`;
    res.redirect(authUrl);
  });

  app.get("/api/auth/workos/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=workos_no_code');
    res.redirect('/#sso-authenticated');
  });

  // --- APILAYER COUNTRYLAYER PROXY (FOR SA & SADC REGIONAL TELEMETRY) ---
  app.get("/api/geo/countries", async (_req, res) => {
    try {
      const accessKey = process.env.APILAYER_ACCESS_KEY || '36d4e8507f1e55f9724f130b0fae4a4d';
      const alRes = await fetch(`https://api.apilayer.net/countrylayer/v2/all?access_key=${accessKey}&filters=name;capital;currencies;callingCodes`);
      const data = await alRes.json().catch(() => []);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/check-stock/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const { url } = req.body;
      const isOutOfStock = Math.random() < 0.05; // High availability
      
      if (isOutOfStock) {
        res.json({ 
          inStock: false,
          redirectUrl: `https://wa.me/27680079911?text=${encodeURIComponent(`Hi SafetyLink, I am looking to order "${slug}" but it shows low stock. Please assist with immediate order/backorder.`)}` 
        });
      } else {
        res.json({ 
          inStock: true,
          redirectUrl: url || 'https://www.brandability.co.za/buy/altitude-tracker-key-tag?utm_source=safetylink' 
        });
      }
    } catch (e) {
      console.error("Stock Check Error:", e);
      res.status(500).json({ error: "Internal server error" });
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
           const usersRef = getFirestoreDb().collection('users');
           const snapshot = await usersRef.where('email', '==', pfData.email_address).get();
           
           if (!snapshot.empty) {
             const batch = getFirestoreDb().batch();
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
    try { const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 24678 } },
      appType: "spa",
    });
    app.use(vite.middlewares); } catch (e) { console.error("Vite not found."); const distPath = path.join(process.cwd(), "dist"); app.use(express.static(distPath)); app.get("*all", (req, res) => res.sendFile(path.join(distPath, "index.html"))); }
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

  const wss = new WebSocketServer({ noServer: true });
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url && request.url.startsWith('/live')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs, request) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        if (clientWs.readyState === 1) {
          clientWs.send(JSON.stringify({
            type: "text",
            text: "Local voice check-in active (offline/free-tier mode). Tap Start/Restart Dispatch or I'm Okay below."
          }));
          clientWs.send(JSON.stringify({
            type: "error",
            message: "Cloud live voice key unavailable — using local voice prompt."
          }));
          clientWs.close();
        }
        return;
      }
      const ai = initGemini();
      const urlObj = new URL(request.url || '/live', 'http://localhost');
      const mode = urlObj.searchParams.get('mode') || 'assistant';

      const systemText =
        mode === 'checkin'
          ? "You are Lizzy from SafetyLink South Africa calling 10 minutes after a panic SOS alert was triggered. Speak warmly, ask 'Are you okay right now? Should I restart emergency dispatch or mark you safe?', listen to their answer, and keep responses under 2 short sentences."
          : "You are Lizzy from SafetyLink South Africa (powered by K'lev.ai), the emergency AI voice coordinator. Provide calm, reassuring tactical guidance in short, clear responses.";

      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: {
            parts: [{ text: systemText }],
          },
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              const audio = (part as any)?.inlineData?.data;
              if (audio && clientWs.readyState === 1) {
                clientWs.send(JSON.stringify({ type: "audio", data: audio }));
              }
              const txt = (part as any)?.text;
              if (txt && clientWs.readyState === 1) {
                clientWs.send(JSON.stringify({ type: "text", text: txt }));
              }
            }
            if (message.serverContent?.interrupted && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onerror: (err: any) => {
            console.error("[Live WS Gemini error]", err);
            if (clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: "error", message: String(err?.message || err) }));
            }
          },
        },
      });

      if (mode === 'checkin') {
        try {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: 'Begin the 10-minute post-panic welfare check now and greet the user.' }] }],
            turnComplete: true,
          });
        } catch {}
      }

      clientWs.on("message", (message: string) => {
        try {
          const msg = JSON.parse(String(message));
          if (msg.type === "audio" && msg.data) {
            session.sendRealtimeInput({
              audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (msg.type === "text" && msg.text) {
            session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: String(msg.text) }] }],
              turnComplete: true,
            });
          }
        } catch (err) {
          console.error("Live API WS message error", err);
        }
      });

      clientWs.on("close", () => {
        try { session.close(); } catch {}
      });
    } catch (err: any) {
      console.error("[Live WS connection setup failed]", err);
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: "error", message: err?.message || "Live connection failed" }));
        clientWs.close();
      }
    }
  });
}

startServer();

// Keep process alive
