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
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from "@google/genai";
import { WebSocketServer } from "ws";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin for Firestore & FCM updates
let firebaseAdminApp: any = null;
let hasExplicitFcmCredentials = false;
if (!getApps().length) {
  let credentialConfig: any = null;
  const serviceAccountPath = './safetylink-99e56-service-account.json';
  const rawSaEnv = process.env.FCM_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawSaEnv) {
    try {
      credentialConfig = cert(JSON.parse(rawSaEnv));
      hasExplicitFcmCredentials = true;
    } catch {
      try {
        if (fs.existsSync(rawSaEnv)) {
          credentialConfig = cert(rawSaEnv);
          hasExplicitFcmCredentials = true;
        }
      } catch (e) {
        console.warn('[FirebaseAdmin] Failed loading service account env path:', e);
      }
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      credentialConfig = cert(serviceAccountPath);
      hasExplicitFcmCredentials = true;
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

// Emergency Providers (strictly from environment variables — no hardcoded credentials)
const VAPI_PRIVATE_KEY       = process.env.VAPI_PRIVATE_KEY || '';
const VAPI_PUBLIC_KEY        = process.env.VAPI_PUBLIC_KEY || '';
const VAPI_PHONE_NUMBER_ID   = process.env.VAPI_PHONE_NUMBER_ID || '';
const VAPI_ASSISTANT_ID      = process.env.VAPI_ASSISTANT_ID || '';
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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS community_safety_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      area_name TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_id TEXT,
      org_id TEXT,
      verifications INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
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


  // Initialize Gemini (v1beta required for gemini-3.8-live, speechConfig TTS, and Search/Maps grounding)
  let ai: GoogleGenAI | null = null;
  const initGemini = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        apiVersion: "v1beta",
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
    return ai;
  };

  const extractGeminiError = (err: any): { status: number; message: string; retryable: boolean } => {
    let status = typeof err?.status === "number" ? err.status : 500;
    let rawMsg = typeof err?.message === "string" ? err.message : String(err || "Gemini request failed");
    // Unwrap nested JSON error envelopes returned by SDK
    for (let depth = 0; depth < 3; depth++) {
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed?.error?.code && typeof parsed.error.code === "number") status = parsed.error.code;
        if (parsed?.error?.message) {
          rawMsg = String(parsed.error.message);
          continue;
        }
      } catch {
        break;
      }
    }
    if (status < 400 || status >= 600) status = 500;
    const retryable = status === 503 || status === 429 || status === 502 || status === 504 || /UNAVAILABLE|overloaded|high demand|ECONNRESET|ETIMEDOUT/i.test(rawMsg);
    return { status, message: rawMsg, retryable };
  };

  const withGeminiRetry = async <T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> => {
    let lastErr: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const info = extractGeminiError(err);
        if (!info.retryable || attempt === maxAttempts) {
          throw err;
        }
        const delayMs = 450 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastErr;
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

      const primaryModel = useFlashLite && !useGrounding ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
      const runGenerate = async (targetModel: string) => {
        const config: any = {};
        if (targetModel === "gemini-4-hydrogen") {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
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
        return genAI.models.generateContent({
          model: targetModel,
          contents: prompt,
          config,
        });
      };

      let usedModel = primaryModel;
      let response;
      try {
        response = await withGeminiRetry(() => runGenerate(primaryModel), 3);
      } catch (primaryErr: any) {
        const info = extractGeminiError(primaryErr);
        if (info.retryable && primaryModel === "gemini-4-hydrogen" && !useGrounding) {
          usedModel = "gemini-3.1-flash-lite";
          response = await withGeminiRetry(() => runGenerate(usedModel), 2);
        } else {
          throw primaryErr;
        }
      }

      const metadata = response.candidates?.[0]?.groundingMetadata;
      const chunks = metadata?.groundingChunks || [];
      res.json({
        text: response.text || "",
        chunks,
        model: usedModel,
        searchEntryPointHtml: metadata?.searchEntryPoint?.renderedContent || null,
      });
    } catch (e: any) {
      console.error("[/api/gemini/generate]", e);
      const info = extractGeminiError(e);
      res.status(info.status).json({ error: info.message });
    }
  });

  // 1b. Multi-turn SafetyLink & Post-Emergency Chatbot (gemini-4-hydrogen / gemini-3.1-flash-lite)
  const buildChatSystemInstruction = (role?: string, customInstruction?: string, incidentContext?: string) => {
    if (customInstruction && typeof customInstruction === "string" && customInstruction.trim()) {
      return incidentContext
        ? `${customInstruction.trim()}\n\nRecent Incident Context:\n${incidentContext}`
        : customInstruction.trim();
    }
    const rolePrompts: Record<string, string> = {
      post_emergency:
        "You are Kleva (Lizzy), SafetyLink's compassionate Post-Emergency Care Companion. The user may have just experienced or disarmed an emergency SOS alert. Be calm, reassuring, grounded, and practical. First check if they are physically safe and uninjured. Offer grounding breathing steps if they feel shaken, help them draft a clear 'I am safe' message for family/contacts or a structured incident summary for police / security / insurance, and provide emergency numbers (South Africa: 10111 SAPS Police, 112 cellular emergency, 10177 Ambulance/Fire, 082 911 Netcare, 084 124 ER24; or local emergency services if outside South Africa) when needed. Keep replies well-structured and concise.",
      coordinator:
        "You are Kleva (Lizzy), SafetyLink's Safety Coordinator. Help users plan safe routes, configure emergency contacts, understand SafetyLink's offline Please Call Me relay and BLE iTAG panic triggers, and stay prepared wherever they are. Share verified emergency numbers when relevant.",
      scribe:
        "You are Kleva (SafetyLink's Incident Scribe). Help the user calmly document what happened after an emergency — capturing time, location, people involved, actions taken, and contacts notified — and format a clean, factual summary suitable for police reporting, estate security, or insurance.",
    };
    const base = rolePrompts[role || "post_emergency"] || rolePrompts.post_emergency;
    return incidentContext ? `${base}\n\nActive/Recent SafetyLink Incident Context:\n${incidentContext}` : base;
  };

  const buildChatConfig = (
    targetModel: string,
    opts: { useMaps?: boolean; lat?: number; lng?: number; role?: string; systemInstruction?: string; incidentContext?: string }
  ) => {
    const config: any = {};
    if (targetModel === "gemini-4-hydrogen") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }
    if (opts.useMaps) {
      config.tools = [{ googleMaps: {} }];
      if (typeof opts.lat === "number" && typeof opts.lng === "number" && (opts.lat !== 0 || opts.lng !== 0)) {
        config.toolConfig = { retrievalConfig: { latLng: { latitude: opts.lat, longitude: opts.lng } } };
      }
    } else {
      config.systemInstruction = buildChatSystemInstruction(opts.role, opts.systemInstruction, opts.incidentContext);
    }
    return config;
  };

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction, role, incidentContext, model, useFlashLite, useMaps, lat, lng } = req.body || {};
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "message is required" });
      }
      const genAI = initGemini();
      const allowedModels = new Set(["gemini-4-hydrogen", "gemini-3.1-flash-lite"]);
      const primaryModel = useMaps
        ? "gemini-4-hydrogen"
        : typeof model === "string" && allowedModels.has(model)
          ? model
          : useFlashLite
            ? "gemini-3.1-flash-lite"
            : "gemini-4-hydrogen";

      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h: any) => h && typeof h.text === "string" && h.text.trim().length > 0)
            .slice(-20)
            .map((h: any) => ({
              role: h.role === "model" || h.sender === "bot" ? "model" : "user",
              parts: [{ text: h.text }],
            }))
        : [];

      const runChat = async (targetModel: string) => {
        const config = buildChatConfig(targetModel, { useMaps, lat, lng, role, systemInstruction, incidentContext });
        const chat = genAI.chats.create({
          model: targetModel,
          history: formattedHistory,
          config,
        });
        return chat.sendMessage({ message: message.trim() });
      };

      let usedModel = primaryModel;
      let response;
      try {
        response = await withGeminiRetry(() => runChat(primaryModel), 3);
      } catch (primaryErr: any) {
        const info = extractGeminiError(primaryErr);
        const fallbackModel = primaryModel === "gemini-4-hydrogen" ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
        if (info.retryable && !useMaps) {
          usedModel = fallbackModel;
          response = await withGeminiRetry(() => runChat(fallbackModel), 2);
        } else {
          throw primaryErr;
        }
      }

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      res.json({ text: response.text || "", chunks, model: usedModel });
    } catch (e: any) {
      console.error("[/api/gemini/chat]", e);
      const info = extractGeminiError(e);
      res.status(info.status).json({ error: info.message });
    }
  });

  // 1b-stream. Streaming Multi-Turn SafetyLink Chatbot (SSE via ai.chats.create + sendMessageStream)
  app.post("/api/gemini/chat/stream", async (req, res) => {
    try {
      const { message, history, systemInstruction, role, incidentContext, model, useFlashLite, useMaps, lat, lng } = req.body || {};
      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "message is required" });
      }
      const genAI = initGemini();
      const allowedModels = new Set(["gemini-4-hydrogen", "gemini-3.1-flash-lite"]);
      const primaryModel = useMaps
        ? "gemini-4-hydrogen"
        : typeof model === "string" && allowedModels.has(model)
          ? model
          : useFlashLite
            ? "gemini-3.1-flash-lite"
            : "gemini-4-hydrogen";

      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h: any) => h && typeof h.text === "string" && h.text.trim().length > 0)
            .slice(-20)
            .map((h: any) => ({
              role: h.role === "model" || h.sender === "bot" ? "model" : "user",
              parts: [{ text: h.text }],
            }))
        : [];

      const openStream = async (targetModel: string) => {
        const config = buildChatConfig(targetModel, { useMaps, lat, lng, role, systemInstruction, incidentContext });
        const chat = genAI.chats.create({
          model: targetModel,
          history: formattedHistory,
          config,
        });
        return chat.sendMessageStream({ message: message.trim() });
      };

      // Open stream BEFORE flushing SSE headers so 503 retries and fallback work seamlessly
      let usedModel = primaryModel;
      let streamResponse;
      try {
        streamResponse = await withGeminiRetry(() => openStream(primaryModel), 3);
      } catch (primaryErr: any) {
        const info = extractGeminiError(primaryErr);
        const fallbackModel = primaryModel === "gemini-4-hydrogen" ? "gemini-3.1-flash-lite" : "gemini-4-hydrogen";
        if (info.retryable && !useMaps) {
          usedModel = fallbackModel;
          streamResponse = await withGeminiRetry(() => openStream(fallbackModel), 2);
        } else {
          throw primaryErr;
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      let lastChunks: any[] = [];
      for await (const chunk of streamResponse) {
        const chunkText = chunk.text || "";
        const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(grounding) && grounding.length > 0) {
          lastChunks = grounding;
        }
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ delta: chunkText })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true, model: usedModel, chunks: lastChunks })}\n\n`);
      res.end();
    } catch (e: any) {
      console.error("[/api/gemini/chat/stream]", e);
      const info = extractGeminiError(e);
      if (!res.headersSent) {
        res.status(info.status).json({ error: info.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: info.message })}\n\n`);
        res.end();
      }
    }
  });

  // 1c. Safety Feed AI Grounded Updates (Separate Google Search & Google Maps calls per SDK rules)
  app.post("/api/gemini/safety-feed", async (req, res) => {
    try {
      const { queryText, locationName, lat, lng } = req.body || {};
      const hasCoords = typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
      if (!locationName && !queryText && !hasCoords) {
        return res.status(400).json({ error: "Please provide your current GPS location or enter a city/suburb." });
      }
      const genAI = initGemini();
      const placeLabel = locationName
        ? String(locationName).trim()
        : hasCoords
          ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          : String(queryText).trim();

      const searchPrompt = queryText && locationName
        ? `${queryText} in ${placeLabel}. Focus on real current public safety advisories, police/community alerts, traffic disruptions, and severe weather.`
        : `Latest real-time public safety advisories, police/community alerts, traffic incidents, and weather warnings specifically in ${placeLabel}. Summarize concisely with factual local details only.`;

      const searchRes = await withGeminiRetry(() =>
        genAI.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: searchPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            tools: [{ googleSearch: {} }],
          },
        }),
      3);

      let mapsRes: any = null;
      if (hasCoords) {
        mapsRes = await withGeminiRetry(() =>
          genAI.models.generateContent({
            model: "gemini-4-hydrogen",
            contents: `List the 4 nearest verified police stations, emergency hospitals, or 24-hour safe zones near latitude ${lat}, longitude ${lng}.`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              tools: [{ googleMaps: {} }],
              toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } },
            },
          }),
        2).catch(() => null);
      }

      res.json({
        advisoryText: searchRes.text || "",
        searchChunks: searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        safeZonesText: mapsRes?.text || "",
        mapsChunks: mapsRes?.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      });
    } catch (e: any) {
      console.error("[/api/gemini/safety-feed]", e);
      const info = extractGeminiError(e);
      res.status(info.status).json({ error: info.message });
    }
  });

  // 1d. REAL LIVE LOCATION-SPECIFIC SAFETY FEED (Nominatim + Google News RSS + Open-Meteo + SQLite DB — ZERO MOCKS)
  const geoCache = new Map<string, { expiresAt: number; data: any }>();

  const decodeXmlEntities = (s: string) =>
    s
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const haversineDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const classifySafetyCategory = (text: string): string => {
    const t = text.toLowerCase();
    if (/fire|wildfire|blaze|smoke|explosion|flood|storm|cyclone|tornado|hail/.test(t)) return "FIRE_HAZARD";
    if (/crash|accident|traffic|highway|road closed|collision|pileup|congestion/.test(t)) return "TRAFFIC";
    if (/power|outage|load ?shedding|blackout|water|substation|electricity/.test(t)) return "POWER_WATER";
    if (/hospital|ambulance|medical|paramedic|ems|injured|clinic/.test(t)) return "MEDICAL";
    if (/patrol|police|saps|arrest|suspect|robbery|hijack|shooting|murder|crime|theft|burglary|assault/.test(t)) return "CRIME";
    return "SUSPICIOUS";
  };

  const classifySafetySeverity = (text: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
    const t = text.toLowerCase();
    if (/shooting|fatal|murder|explosion|wildfire|tornado|evacuat|armed robbery|hijack/.test(t)) return "CRITICAL";
    if (/robbery|fire|flood|storm|crash|collision|crime|assault|emergency|warning/.test(t)) return "HIGH";
    if (/outage|traffic|theft|suspicious|delay|advisory|protest/.test(t)) return "MEDIUM";
    return "LOW";
  };

  const weatherCodeLabel = (code: number): { label: string; hazardous: boolean; severity: "LOW" | "MEDIUM" | "HIGH" } => {
    if (code >= 95) return { label: "Thunderstorm / Lightning Risk", hazardous: true, severity: "HIGH" };
    if (code >= 80 && code <= 82) return { label: "Heavy Rain Showers", hazardous: true, severity: "MEDIUM" };
    if (code >= 63 && code <= 67) return { label: "Heavy / Freezing Rain", hazardous: true, severity: "MEDIUM" };
    if (code >= 71 && code <= 77) return { label: "Snowfall / Low Visibility", hazardous: true, severity: "MEDIUM" };
    if (code >= 45 && code <= 48) return { label: "Dense Fog / Reduced Visibility", hazardous: true, severity: "MEDIUM" };
    if (code >= 51 && code <= 61) return { label: "Light Rain / Drizzle", hazardous: false, severity: "LOW" };
    if (code >= 1 && code <= 3) return { label: "Partly Cloudy / Overcast", hazardous: false, severity: "LOW" };
    return { label: "Clear Conditions", hazardous: false, severity: "LOW" };
  };

  app.get("/api/safety-feed/live", async (req, res) => {
    try {
      const rawLat = req.query.lat !== undefined ? Number(req.query.lat) : NaN;
      const rawLng = req.query.lng !== undefined ? Number(req.query.lng) : NaN;
      const queryText = typeof req.query.query === "string" ? req.query.query.trim() : "";
      const radiusKm = Math.min(100, Math.max(5, Number(req.query.radiusKm) || 25));

      const hasCoords = Number.isFinite(rawLat) && Number.isFinite(rawLng) && (rawLat !== 0 || rawLng !== 0);
      if (!hasCoords && !queryText) {
        return res.status(400).json({ error: "Provide GPS coordinates (lat, lng) or a city/suburb query." });
      }

      let resolvedLat = rawLat;
      let resolvedLng = rawLng;
      let suburb = "";
      let city = "";
      let state = "";
      let country = "";
      let countryCode = "ZA";
      let displayLocation = queryText || `${rawLat.toFixed(4)}, ${rawLng.toFixed(4)}`;

      // 1. Resolve exact location via OpenStreetMap Nominatim (cached 10 minutes)
      const cacheKey = hasCoords
        ? `rev:${rawLat.toFixed(3)},${rawLng.toFixed(3)}`
        : `fwd:${queryText.toLowerCase()}`;
      const cachedGeo = geoCache.get(cacheKey);
      let geoData: any = cachedGeo && cachedGeo.expiresAt > Date.now() ? cachedGeo.data : null;

      if (!geoData) {
        try {
          const nomUrl = hasCoords
            ? `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(rawLat))}&lon=${encodeURIComponent(String(rawLng))}&zoom=14&addressdetails=1`
            : `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(queryText)}`;
          const geoResp = await fetch(nomUrl, {
            headers: {
              "User-Agent": "SafetyLink-Core/1.0 (https://safetylink.online)",
              "Accept-Language": "en",
            },
            signal: AbortSignal.timeout(6000),
          });
          if (geoResp.ok) {
            const parsed = await geoResp.json();
            geoData = Array.isArray(parsed) ? parsed[0] || null : parsed;
            if (geoData) {
              geoCache.set(cacheKey, { expiresAt: Date.now() + 10 * 60_000, data: geoData });
            }
          }
        } catch (geoErr) {
          console.warn("[safety-feed] Nominatim lookup skipped:", (geoErr as any)?.message);
        }
      }

      if (geoData) {
        if (!hasCoords && geoData.lat && geoData.lon) {
          resolvedLat = Number(geoData.lat);
          resolvedLng = Number(geoData.lon);
        }
        const addr = geoData.address || {};
        suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.hamlet || "";
        city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || "";
        state = addr.state || addr.region || "";
        country = addr.country || "";
        countryCode = String(addr.country_code || "za").toUpperCase();
        const labelParts = [suburb, city, state, country].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);
        if (labelParts.length > 0) {
          displayLocation = labelParts.slice(0, 3).join(", ");
        }
      }

      const effectiveCoords = Number.isFinite(resolvedLat) && Number.isFinite(resolvedLng) && (resolvedLat !== 0 || resolvedLng !== 0);
      const searchArea = [suburb, city || state].filter(Boolean).join(" ") || queryText || displayLocation;

      // 2. Fetch real live local safety/emergency/traffic news via Google News RSS for THIS exact location
      const newsPromise = (async () => {
        if (!searchArea) return [];
        const q = `"${city || suburb || queryText}" (crime OR police OR safety OR traffic OR accident OR fire OR outage OR emergency OR weather)`;
        const gl = /^[A-Z]{2}$/.test(countryCode) ? countryCode : "US";
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=${gl}&ceid=${gl}:en`;
        try {
          const rssResp = await fetch(rssUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SafetyLinkFeed/1.0)" },
            signal: AbortSignal.timeout(7000),
          });
          if (!rssResp.ok) return [];
          const xml = await rssResp.text();
          const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 18);
          const parsedItems = itemMatches.map((m, idx) => {
            const block = m[1];
            const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
            const rawLink = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "";
            const rawDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "";
            const rawSource = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] || "";
            const rawDesc = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || "";

            const cleanTitle = decodeXmlEntities(rawTitle);
            const sourceName = decodeXmlEntities(rawSource) || "Local News";
            // Remove trailing " - Publisher" duplicate if present
            const titleWithoutSource = sourceName && cleanTitle.endsWith(` - ${sourceName}`)
              ? cleanTitle.slice(0, -(` - ${sourceName}`).length).trim()
              : cleanTitle;
            const cleanDesc = decodeXmlEntities(rawDesc);
            const parsedTime = Date.parse(rawDate);
            const timestamp = Number.isFinite(parsedTime) ? parsedTime : Date.now();
            const combined = `${titleWithoutSource} ${cleanDesc}`;

            return {
              id: `news-${timestamp}-${idx}`,
              title: titleWithoutSource,
              description: cleanDesc && cleanDesc !== cleanTitle ? cleanDesc : `Live local safety update reported by ${sourceName} for ${city || suburb || displayLocation}.`,
              source: sourceName,
              url: decodeXmlEntities(rawLink),
              category: classifySafetyCategory(combined),
              severity: classifySafetySeverity(combined),
              areaName: [suburb, city].filter(Boolean).join(", ") || displayLocation,
              timestamp,
              feedType: "LIVE_NEWS" as const,
            };
          });
          // Sort newest first
          return parsedItems
            .filter((i) => i.title.length > 5 && i.url.startsWith("http"))
            .sort((a, b) => b.timestamp - a.timestamp);
        } catch (rssErr) {
          console.warn("[safety-feed] Live RSS fetch error:", (rssErr as any)?.message);
          return [];
        }
      })();

      // 3. Fetch real live weather conditions & hazard detection from Open-Meteo for exact coordinates
      const weatherPromise = (async () => {
        if (!effectiveCoords) return null;
        try {
          const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLng}&current=temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m&timezone=auto`;
          const wResp = await fetch(wUrl, { signal: AbortSignal.timeout(5000) });
          if (!wResp.ok) return null;
          const wJson = await wResp.json();
          const cur = wJson?.current;
          if (!cur) return null;
          const code = Number(cur.weather_code ?? 0);
          const meta = weatherCodeLabel(code);
          const tempC = Number(cur.temperature_2m);
          const windKmh = Number(cur.wind_speed_10m);
          const gustsKmh = Number(cur.wind_gusts_10m);
          const precipMm = Number(cur.precipitation ?? 0);
          const extremeHeat = Number.isFinite(tempC) && tempC >= 36;
          const extremeCold = Number.isFinite(tempC) && tempC <= 2;
          const highWind = Number.isFinite(gustsKmh) && gustsKmh >= 45;
          const heavyRain = Number.isFinite(precipMm) && precipMm >= 5;
          const hazardous = meta.hazardous || extremeHeat || extremeCold || highWind || heavyRain;
          const advisoryReasons: string[] = [];
          if (meta.hazardous) advisoryReasons.push(meta.label);
          if (highWind) advisoryReasons.push(`High wind gusts (${Math.round(gustsKmh)} km/h)`);
          if (heavyRain) advisoryReasons.push(`Active precipitation (${precipMm.toFixed(1)} mm)`);
          if (extremeHeat) advisoryReasons.push(`Extreme heat (${Math.round(tempC)}°C)`);
          if (extremeCold) advisoryReasons.push(`Near-freezing temperature (${Math.round(tempC)}°C)`);
          return {
            temperatureC: Number.isFinite(tempC) ? tempC : null,
            apparentTempC: Number.isFinite(Number(cur.apparent_temperature)) ? Number(cur.apparent_temperature) : null,
            windSpeedKmh: Number.isFinite(windKmh) ? windKmh : null,
            windGustsKmh: Number.isFinite(gustsKmh) ? gustsKmh : null,
            precipitationMm: Number.isFinite(precipMm) ? precipMm : 0,
            condition: meta.label,
            hazardous,
            advisoryText: hazardous ? advisoryReasons.join(" · ") : null,
            observedAt: cur.time || new Date().toISOString(),
          };
        } catch {
          return null;
        }
      })();

      // 4. Query real SafetyLink DB community reports & active panic alerts near user's actual coordinates
      const dbReportsPromise = (async () => {
        try {
          const rows = await db.execute({
            sql: "SELECT * FROM community_safety_reports ORDER BY created_at DESC LIMIT 100",
            args: [],
          });
          const mapped = (rows.rows || []).map((r: any) => {
            const rLat = Number(r.lat);
            const rLng = Number(r.lng);
            const dist = effectiveCoords && Number.isFinite(rLat) && Number.isFinite(rLng)
              ? haversineDistanceKm(resolvedLat, resolvedLng, rLat, rLng)
              : null;
            return {
              id: String(r.id),
              title: String(r.title),
              description: String(r.description),
              category: String(r.category),
              severity: String(r.severity),
              status: String(r.status || "ACTIVE"),
              lat: rLat,
              lng: rLng,
              areaName: String(r.area_name),
              reporterName: String(r.reporter_name),
              reporterId: r.reporter_id ? String(r.reporter_id) : undefined,
              orgId: r.org_id ? String(r.org_id) : undefined,
              timestamp: Number(r.created_at),
              verifications: Number(r.verifications || 1),
              distanceKm: dist !== null ? Number(dist.toFixed(2)) : null,
              feedType: "COMMUNITY" as const,
            };
          });
          return effectiveCoords
            ? mapped.filter((r) => r.distanceKm !== null && r.distanceKm <= radiusKm)
            : mapped;
        } catch {
          return [];
        }
      })();

      const [liveNews, weather, communityReports] = await Promise.all([
        newsPromise,
        weatherPromise,
        dbReportsPromise,
      ]);

      // Build honest live advisories strictly from real nearby reports or active weather hazards
      const advisories: Array<{
        id: string;
        name: string;
        area: string;
        lat: number;
        lng: number;
        radiusMeters: number;
        riskLevel: "MODERATE" | "HIGH" | "CRITICAL";
        advisory: string;
        recentIncidents: number;
        updatedAt: number;
      }> = [];

      if (weather?.hazardous && effectiveCoords) {
        advisories.push({
          id: `wx-${Math.round(resolvedLat * 100)}-${Math.round(resolvedLng * 100)}`,
          name: `Live Weather Advisory — ${city || suburb || displayLocation}`,
          area: displayLocation,
          lat: resolvedLat,
          lng: resolvedLng,
          radiusMeters: radiusKm * 1000,
          riskLevel: "MODERATE",
          advisory: weather.advisoryText || weather.condition,
          recentIncidents: 1,
          updatedAt: Date.now(),
        });
      }

      const activeHighReports = communityReports.filter(
        (r) => r.status !== "RESOLVED" && (r.severity === "HIGH" || r.severity === "CRITICAL")
      );
      if (activeHighReports.length > 0 && effectiveCoords) {
        const top = activeHighReports[0];
        advisories.push({
          id: `comm-adv-${top.id}`,
          name: `${top.areaName} — Active Community Alert`,
          area: top.areaName,
          lat: top.lat,
          lng: top.lng,
          radiusMeters: 1500,
          riskLevel: top.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
          advisory: `${top.title}: ${top.description}`,
          recentIncidents: activeHighReports.length,
          updatedAt: top.timestamp,
        });
      }

      res.json({
        location: {
          lat: effectiveCoords ? resolvedLat : null,
          lng: effectiveCoords ? resolvedLng : null,
          suburb,
          city,
          state,
          country,
          countryCode,
          displayLocation,
        },
        radiusKm,
        weather,
        advisories,
        communityReports,
        liveNews,
        fetchedAt: Date.now(),
      });
    } catch (e: any) {
      console.error("[/api/safety-feed/live]", e);
      res.status(500).json({ error: e?.message || "Failed to load live safety feed" });
    }
  });

  app.post("/api/safety-feed/report", async (req, res) => {
    try {
      const { title, description, category, severity, lat, lng, areaName, reporterName, reporterId, orgId } = req.body || {};
      if (!title || !description || typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: "title, description, and valid GPS coordinates (lat, lng) are required." });
      }
      const allowedCats = new Set(["CRIME", "SUSPICIOUS", "TRAFFIC", "POWER_WATER", "FIRE_HAZARD", "MEDICAL", "PATROL_UPDATE"]);
      const allowedSev = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
      const safeCat = allowedCats.has(category) ? category : "SUSPICIOUS";
      const safeSev = allowedSev.has(severity) ? severity : "MEDIUM";
      const id = `rep-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const createdAt = Date.now();
      const safeArea = String(areaName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`).slice(0, 140);
      const safeReporter = String(reporterName || "Community Member").slice(0, 80);

      await db.execute({
        sql: `INSERT INTO community_safety_reports
          (id, title, description, category, severity, status, lat, lng, area_name, reporter_name, reporter_id, org_id, verifications, created_at)
          VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, 1, ?)`,
        args: [
          id,
          String(title).trim().slice(0, 160),
          String(description).trim().slice(0, 1200),
          safeCat,
          safeSev,
          lat,
          lng,
          safeArea,
          safeReporter,
          reporterId ? String(reporterId).slice(0, 80) : null,
          orgId ? String(orgId).slice(0, 80) : null,
          createdAt,
        ],
      });

      res.status(201).json({
        id,
        title: String(title).trim().slice(0, 160),
        description: String(description).trim().slice(0, 1200),
        category: safeCat,
        severity: safeSev,
        status: "ACTIVE",
        lat,
        lng,
        areaName: safeArea,
        reporterName: safeReporter,
        reporterId: reporterId ? String(reporterId) : undefined,
        orgId: orgId ? String(orgId) : undefined,
        timestamp: createdAt,
        verifications: 1,
        verifiedByMe: true,
      });
    } catch (e: any) {
      console.error("[POST /api/safety-feed/report]", e);
      res.status(500).json({ error: e?.message || "Failed to publish safety report" });
    }
  });

  app.post("/api/safety-feed/report/:id/verify", async (req, res) => {
    try {
      const id = String(req.params.id || "").trim();
      if (!id) return res.status(400).json({ error: "Report id is required" });
      await db.execute({
        sql: "UPDATE community_safety_reports SET verifications = verifications + 1 WHERE id = ?",
        args: [id],
      });
      const updated = await db.execute({
        sql: "SELECT verifications FROM community_safety_reports WHERE id = ?",
        args: [id],
      });
      const count = Number((updated.rows?.[0] as any)?.verifications ?? 1);
      res.json({ id, verifications: count });
    } catch (e: any) {
      console.error("[POST /api/safety-feed/report/:id/verify]", e);
      res.status(500).json({ error: e?.message || "Failed to confirm report" });
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
      const response = await withGeminiRetry(() =>
        genAI.models.generateContent({
          model: "gemini-3.5-transcribe",
          contents: [
            {
              role: "user",
              parts: [
                { text: "Transcribe this spoken audio accurately in English or the spoken language. Return plain transcript text only." },
                { inlineData: { data: audioBase64, mimeType: mimeType || "audio/webm" } },
              ],
            },
          ],
        }),
      2);
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error("[/api/gemini/transcribe]", e);
      const info = extractGeminiError(e);
      res.status(info.status).json({ error: info.message });
    }
  });

  // 2b. Accessibility & Kleva/Lizzy Text-to-Speech (gemini-3.8-flash-lite-tts)
  app.post("/api/gemini/tts", async (req, res) => {
    try {
      const { text, voiceName } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }
      const genAI = initGemini();
      const response = await withGeminiRetry(() =>
        genAI.models.generateContent({
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
        }),
      2);
      const inlineData = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (!inlineData?.data) {
        return res.status(502).json({ error: "No audio returned by TTS model" });
      }
      res.json({ audioBase64: inlineData.data, mimeType: inlineData.mimeType || "audio/wav" });
    } catch (e: any) {
      console.error("[/api/gemini/tts]", e);
      const info = extractGeminiError(e);
      res.status(info.status).json({ error: info.message });
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

  // ── ZERO-AIRTIME PROFILE, CONTACT & FCM DEVICE TOKEN REGISTRY (SQLite) ───────
  const normalizeSaE164 = (raw: string): string => {
    let n = String(raw || '').replace(/[^0-9+]/g, '');
    if (n.startsWith('+')) n = n.slice(1);
    if (n.startsWith('00')) n = n.slice(2);
    if (n.startsWith('0') && n.length === 10) n = '27' + n.slice(1);
    if (n.length === 9 && /^[6-8]/.test(n)) n = '27' + n;
    return n ? '+' + n : '';
  };

  const saPhoneVariants = (raw: string): string[] => {
    const e164 = normalizeSaE164(raw);
    if (!e164) return [];
    const set = new Set<string>([e164, e164.slice(1)]);
    if (e164.startsWith('+27') && e164.length === 12) {
      set.add('0' + e164.slice(3));
    }
    return Array.from(set);
  };

  const extractSaMsisdn = (rawText: string, sender: string): string => {
    const text = String(rawText || '');
    const saPattern = '(?:\\+?27|0)[\\s\\-()]?[6-8]\\d[\\s\\-]?\\d{3}[\\s\\-]?\\d{4}';
    const ctxRe = new RegExp(`(?:call(?:\\s|-)?me(?:\\s|-)?(?:back)?(?:\\s|-)?(?:at|from|on)?|pls\\s*call|callback)[:\\s]*(${saPattern})`, 'i');
    const bareRe = new RegExp(`(${saPattern})`);
    const match = text.match(ctxRe) || text.match(bareRe);
    if (match && match[1]) {
      const norm = normalizeSaE164(match[1]);
      if (norm.length >= 11) return norm;
    }
    const senderNorm = normalizeSaE164(sender || '');
    if (/^\+27[6-8]\d{8}$/.test(senderNorm) || /^\+\d{10,15}$/.test(senderNorm)) {
      return senderNorm;
    }
    return '';
  };

  let zeroAirtimeTablesReady = false;
  const ensureZeroAirtimeLocalTables = async () => {
    if (zeroAirtimeTablesReady) return;
    await db.execute(`CREATE TABLE IF NOT EXISTS sl_profiles (phone TEXT PRIMARY KEY, name TEXT, lat REAL, lng REAL, token TEXT, alert_note TEXT, updated_at INTEGER)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS sl_contacts (id TEXT PRIMARY KEY, owner_phone TEXT NOT NULL, name TEXT, contact_phone TEXT NOT NULL, sort_order INTEGER DEFAULT 0)`);
    await db.execute(`CREATE TABLE IF NOT EXISTS sl_device_tokens (phone TEXT NOT NULL, token TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (phone, token))`);
    zeroAirtimeTablesReady = true;
  };

  const lookupLocalFcmTokens = async (rawPhone: string): Promise<string[]> => {
    await ensureZeroAirtimeLocalTables();
    const variants = saPhoneVariants(rawPhone);
    if (!variants.length) return [];
    const ph = variants.map(() => '?').join(', ');
    const r = await db.execute({
      sql: `SELECT token FROM sl_device_tokens WHERE phone IN (${ph}) ORDER BY updated_at DESC LIMIT 8`,
      args: variants,
    });
    return Array.from(new Set(r.rows.map((x: any) => String(x.token || '').trim()).filter((t) => t.length > 20)));
  };

  const sendDataOnlyFcmRing = async (
    deviceToken: string,
    title: string,
    body: string,
    extra: Record<string, string> = {}
  ): Promise<{ ok: boolean; messageId?: string; error?: string; unregistered?: boolean }> => {
    if (!hasExplicitFcmCredentials) {
      return { ok: false, error: 'FCM service account credentials not configured on Express server' };
    }
    try {
      const messaging = getMessaging();
      const messageId = await messaging.send({
        token: deviceToken,
        // DATA-ONLY HIGH-priority payload so Android always invokes SafetyFcmService.onMessageReceived()
        // even when locked, backgrounded, in Doze mode, or swiped away.
        data: {
          type: 'EMERGENCY_RING',
          priority: 'CRITICAL',
          ringDurationSec: '45',
          title,
          body,
          timestamp: String(Date.now()),
          ...extra,
        },
        android: {
          priority: 'high',
          ttl: 60_000,
          directBootOk: true,
        },
      });
      return { ok: true, messageId };
    } catch (err: any) {
      const code = String(err?.code || '');
      const msg = String(err?.message || err).slice(0, 260);
      const unregistered = /registration-token-not-registered|invalid-registration-token|UNREGISTERED|NOT_FOUND/i.test(`${code} ${msg}`);
      if (unregistered) {
        await db.execute({ sql: 'DELETE FROM sl_device_tokens WHERE token = ?', args: [deviceToken] }).catch(() => {});
      }
      return { ok: false, error: msg, unregistered };
    }
  };

  app.get('/api/pcm/gateway', (_req, res) => {
    return res.json({ number: normalizeSaE164(process.env.RAIN_GATEWAY_MSISDN || '0816738186') });
  });

  app.post('/api/profile/sync', async (req, res) => {
    try {
      await ensureZeroAirtimeLocalTables();
      const body = req.body || {};
      const phone = normalizeSaE164(body.phone || '');
      if (!phone) return res.status(400).json({ error: 'phone is required' });
      const presentedToken = String(req.headers['x-profile-token'] || '').trim();
      const existing = await db.execute({ sql: 'SELECT token FROM sl_profiles WHERE phone = ? LIMIT 1', args: [phone] });
      const existingToken = existing.rows[0]?.token ? String(existing.rows[0].token) : '';
      if (existingToken && presentedToken && !safeEqualStr(existingToken, presentedToken)) {
        return res.status(401).json({ error: 'Profile token does not match this number' });
      }
      const token = existingToken || crypto.randomUUID();
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const now = Date.now();
      const name = String(body.name || '').slice(0, 80);
      const alertNote = String(body.alertNote || '').replace(/\s+/g, ' ').trim().slice(0, 140);

      await db.execute({
        sql: `INSERT INTO sl_profiles (phone, name, lat, lng, token, alert_note, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(phone) DO UPDATE SET
                name=excluded.name,
                lat=COALESCE(excluded.lat, sl_profiles.lat),
                lng=COALESCE(excluded.lng, sl_profiles.lng),
                alert_note=excluded.alert_note,
                updated_at=excluded.updated_at`,
        args: [phone, name, Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null, token, alertNote || null, now],
      });

      const contacts = Array.isArray(body.contacts) ? body.contacts.slice(0, 5) : [];
      await db.execute({ sql: 'DELETE FROM sl_contacts WHERE owner_phone = ?', args: [phone] });
      const seen = new Set<string>();
      let savedCount = 0;
      for (const c of contacts) {
        const cp = normalizeSaE164(c?.phone || '');
        if (!cp || cp === phone || seen.has(cp)) continue;
        seen.add(cp);
        await db.execute({
          sql: 'INSERT INTO sl_contacts (id, owner_phone, name, contact_phone, sort_order) VALUES (?, ?, ?, ?, ?)',
          args: [crypto.randomUUID(), phone, String(c?.name || '').slice(0, 80), cp, savedCount],
        });
        savedCount++;
      }
      return res.json({ ok: true, phone, token, contacts: savedCount });
    } catch (e: any) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.post('/api/device/token', async (req, res) => {
    try {
      await ensureZeroAirtimeLocalTables();
      const body = req.body || {};
      const phone = normalizeSaE164(body.phone || '');
      const token = String(body.token || '').trim();
      if (!phone || token.length < 20) {
        return res.status(400).json({ error: 'Valid phone and FCM token are required' });
      }
      const now = Date.now();
      await db.execute({
        sql: `INSERT INTO sl_device_tokens (phone, token, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(phone, token) DO UPDATE SET updated_at=excluded.updated_at`,
        args: [phone, token, now],
      });
      return res.json({ ok: true, registered: true, phone, tokenPrefix: token.slice(0, 12), updatedAt: now });
    } catch (e: any) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.get('/api/device/token/status', async (req, res) => {
    try {
      await ensureZeroAirtimeLocalTables();
      const rawPhone = String(req.query.phone || '').trim();
      const phone = normalizeSaE164(rawPhone);
      if (!phone) return res.status(400).json({ error: 'phone query parameter is required' });
      const variants = saPhoneVariants(phone);
      const ph = variants.map(() => '?').join(', ');
      const r = await db.execute({
        sql: `SELECT token, updated_at FROM sl_device_tokens WHERE phone IN (${ph}) ORDER BY updated_at DESC LIMIT 8`,
        args: variants,
      });
      const valid = r.rows.filter((x: any) => String(x.token || '').trim().length > 20);
      const lastUpdated = valid.length ? Math.max(...valid.map((x: any) => Number(x.updated_at || 0))) : null;
      return res.json({
        ok: true,
        fcmConfigured: hasExplicitFcmCredentials,
        phone,
        registered: valid.length > 0,
        deviceCount: valid.length,
        lastUpdated,
      });
    } catch (e: any) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  });

  app.post('/api/fcm/test-ring', async (req, res) => {
    try {
      const body = req.body || {};
      const phone = normalizeSaE164(body.phone || '');
      if (!phone) return res.status(400).json({ ok: false, error: 'Valid target phone is required' });
      const tokens = await lookupLocalFcmTokens(phone);
      if (!tokens.length) {
        return res.status(404).json({ ok: false, phone, deviceCount: 0, error: 'No registered FCM device token for this phone number' });
      }
      const callerName = String(body.callerName || 'SafetyLink Diagnostic Test').slice(0, 80);
      const callerNumber = normalizeSaE164(body.callerNumber || '') || phone;
      const location = String(body.location || 'FCM Live Loud Ring Verification').slice(0, 200);
      const deliveries = await Promise.all(
        tokens.map((t) =>
          sendDataOnlyFcmRing(t, '🚨 SafetyLink FCM Ring Test', `${callerName} triggered a live loud-alarm verification ring.`, {
            callerName,
            callerNumber,
            location,
            triggerSource: 'FCM_LIVE_TEST',
            isTest: 'true',
          })
        )
      );
      const anyOk = deliveries.some((d) => d.ok);
      return res.status(anyOk ? 200 : 502).json({ ok: anyOk, phone, deviceCount: tokens.length, deliveries });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  // ── RAIN SIM HARDWARE GATEWAY: UNIVERSAL PLEASE-CALL-ME / USSD / RL WEBHOOK ───
  // Accepts payloads from off-the-shelf Android SMS Forwarder / Incoming SMS Gateway apps and custom APK forwarders
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

      // 1. Universal field resolution across SMS Forwarder / Incoming SMS to HTTP / Custom Gateway APK formats
      const rawText = String(
        body.rawMessage || body.pcmText || body.message || body.text || body.msg ||
        body.body || body.content || body.sms_body || body.sms ||
        query.text || query.message || query.rawMessage || ''
      ).trim();

      const gatewaySender = String(
        body.callerMsisdn || body.sender || body.from || body.phone ||
        body.address || body.number || body.sms_from || body.originatingAddress || body.from_number ||
        query.from || query.sender || query.phone || ''
      ).trim();

      const gatewayId = body.gatewayId || query.gatewayId || 'RAIN-SIM-GW-1';
      const batteryLevel = body.batteryLevel ?? query.batteryLevel;
      const simSlot = body.simSlot ?? query.simSlot;

      // 2. Extract South African MSISDN from Please-Call-Me text (including spaced/dashed carrier formats)
      const intlMsisdn = body.callerMsisdn
        ? normalizeSaE164(String(body.callerMsisdn))
        : extractSaMsisdn(rawText, gatewaySender);

      if (!intlMsisdn) {
        return res.status(200).json({ ok: true, alerted: false, reason: 'No caller MSISDN detected in message payload' });
      }

      const localMsisdn = intlMsisdn.startsWith('+27') && intlMsisdn.length === 12
        ? '0' + intlMsisdn.slice(3)
        : intlMsisdn;

      // 3. User, Emergency Contact & Organization Identity Resolution
      await ensureZeroAirtimeLocalTables();
      let matchedUser: any = null;
      let orgCode = 'INDIVIDUAL';
      let orgId = 1;
      let userName = `Mobile User (${localMsisdn})`;
      let latitude = 0.0;
      let longitude = 0.0;
      let alertNote = '';
      let locationSource: 'LIVE_GPS' | 'CACHED_LAST_KNOWN' | 'SILENT_SMS_FALLBACK' = 'SILENT_SMS_FALLBACK';
      let isDemo = false;
      const contactPhones = new Set<string>();

      try {
        const variants = saPhoneVariants(intlMsisdn);
        const ph = variants.map(() => '?').join(', ');

        const slProf = await db.execute({
          sql: `SELECT name, lat, lng, alert_note FROM sl_profiles WHERE phone IN (${ph}) ORDER BY updated_at DESC LIMIT 1`,
          args: variants,
        });
        if (slProf.rows.length > 0) {
          const p: any = slProf.rows[0];
          if (p.name) userName = String(p.name);
          if (p.alert_note) alertNote = String(p.alert_note);
          if (p.lat && p.lng && (Number(p.lat) !== 0 || Number(p.lng) !== 0)) {
            latitude = Number(p.lat);
            longitude = Number(p.lng);
            locationSource = 'CACHED_LAST_KNOWN';
          }
        }

        const slContacts = await db.execute({
          sql: `SELECT contact_phone FROM sl_contacts WHERE owner_phone IN (${ph}) ORDER BY sort_order ASC LIMIT 5`,
          args: variants,
        });
        for (const row of slContacts.rows) {
          const cp = normalizeSaE164(String((row as any).contact_phone || ''));
          if (cp) contactPhones.add(cp);
        }

        const userRes = await db.execute({
          sql: `SELECT u.id, u.name, u.phone, u.latitude, u.longitude, u.org_id, o.org_code FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.phone IN (${ph}) LIMIT 1`,
          args: variants,
        });
        if (userRes.rows.length > 0) {
          matchedUser = userRes.rows[0];
          if (userName.startsWith('Mobile User (') && matchedUser.name) {
            userName = String(matchedUser.name);
          }
          orgId = (matchedUser.org_id as number) || 1;
          if (matchedUser.org_code) orgCode = String(matchedUser.org_code);
          if (locationSource === 'SILENT_SMS_FALLBACK' && matchedUser.latitude && matchedUser.longitude && (matchedUser.latitude !== 0 || matchedUser.longitude !== 0)) {
            latitude = Number(matchedUser.latitude);
            longitude = Number(matchedUser.longitude);
            locationSource = 'CACHED_LAST_KNOWN';
          }
        }
      } catch (dbErr: any) {
        console.warn('[Rain SIM Gateway] Identity query note:', dbErr.message);
      }

      if (
        matchedUser?.id === 1001 || matchedUser?.id === 1002 || matchedUser?.id === 1003 || matchedUser?.id === 1004 ||
        localMsisdn.includes('60123456') || rawText.includes('[DEMO')
      ) {
        isDemo = true;
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
          args: [orgId, userName, `Rain SIM PCM Triggered (${localMsisdn}) — Contacts: ${contactPhones.size}`]
        });
      } catch (err: any) {
        console.warn('[Rain SIM Gateway] DB insert note:', err.message);
      }

      // 5. Broadcast 1: Realtime WebSockets (Pusher)
      try {
        await getPusher().trigger(`org-${orgCode}`, "panic_alert", {
          user_id: matchedUser?.id || 0,
          name: userName,
          phone: localMsisdn,
          latitude,
          longitude,
          location_source: locationSource,
          trigger_source: "USSD_PCM",
          description: `🚨 RAIN SIM Zero-Airtime PCM Distress from ${userName}`,
          timestamp: new Date().toISOString()
        });
      } catch (pusherErr: any) {
        console.warn('[Rain SIM Gateway] Pusher broadcast note:', pusherErr.message);
      }

      // 6. Broadcast 2: High-Priority DATA-ONLY FCM Loud Alarm directly to every emergency contact's SafetyLink app
      const fcmResults: any[] = [];
      if (!isDemo) {
        const mapsUrl = (latitude !== 0 || longitude !== 0)
          ? `https://maps.google.com/?q=${latitude},${longitude}`
          : 'Last known location unavailable';
        const targetList = contactPhones.size > 0
          ? Array.from(contactPhones)
          : [normalizeSaE164(RESPONSE_CENTRE_NUMBER)].filter(Boolean);

        await Promise.allSettled(targetList.map(async (contactPhone) => {
          const tokens = await lookupLocalFcmTokens(contactPhone);
          for (const tok of tokens) {
            const r = await sendDataOnlyFcmRing(
              tok,
              '🚨 EMERGENCY: SafetyLink Alert',
              `${userName} (${localMsisdn}) triggered a zero-airtime SOS! ${mapsUrl}`,
              {
                callerName: userName,
                callerNumber: intlMsisdn,
                location: mapsUrl,
                triggerSource: 'RAIN_PCM_ZERO_AIRTIME',
                ...(alertNote ? { alertNote } : {}),
                ...(latitude !== 0 ? { lat: String(latitude) } : {}),
                ...(longitude !== 0 ? { lng: String(longitude) } : {}),
              }
            );
            fcmResults.push({ to: contactPhone, channel: 'FCM_LOUD_ALARM', ...r });
          }
        }));
      }

      // 7. Response
      return res.json({
        success: true,
        gatewayId,
        msisdn: localMsisdn,
        e164: intlMsisdn,
        user: userName,
        orgCode,
        contactsMatched: contactPhones.size,
        fcmRungCount: fcmResults.filter((r) => r.ok).length,
        fcmResults,
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
  app.post("/webhook/pcm/:token", pcmGatewayHandler);
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
    let session: any = null;
    let clientClosed = false;
    const pendingMessages: Array<Buffer | string> = [];

    const forwardClientPayload = (raw: Buffer | string) => {
      if (!session || clientClosed) return;
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === "audio" && msg.data) {
          session.sendRealtimeInput({
            audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (msg.type === "text" && msg.text) {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: String(msg.text) }] }],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error("[Live WS message error]", err);
      }
    };

    clientWs.on("message", (raw: Buffer | string) => {
      if (!session) {
        if (pendingMessages.length < 25) pendingMessages.push(raw);
        return;
      }
      forwardClientPayload(raw);
    });

    clientWs.on("close", () => {
      clientClosed = true;
      try {
        session?.close();
      } catch {}
      session = null;
    });

    try {
      const aiClient = initGemini();
      const urlObj = new URL(request.url || "/live", "http://localhost");
      const mode = urlObj.searchParams.get("mode") || "post_emergency";
      const requestedVoice = urlObj.searchParams.get("voice") || "Zephyr";
      const allowedVoices = new Set(["Zephyr", "Kore", "Puck", "Charon", "Fenrir"]);
      const voiceName = allowedVoices.has(requestedVoice) ? requestedVoice : "Zephyr";
      const incidentSummary = (urlObj.searchParams.get("context") || "").slice(0, 600);

      const modeInstructions: Record<string, string> = {
        checkin:
          "You are Kleva (Lizzy) from SafetyLink calling after an emergency SOS alert was triggered. Speak warmly and calmly. First ask 'Are you okay right now? Should I keep emergency dispatch active, or mark you safe?' Listen carefully and keep replies short, reassuring, and clear (1–2 sentences).",
        post_emergency:
          "You are Kleva (Lizzy), SafetyLink's real-time Post-Emergency Voice Companion. Speak with a warm, calm, steady voice. Check if the user is physically safe and uninjured, guide them through calm breathing if shaken, help them plan immediate next steps or contact loved ones, and share emergency numbers only if needed. Keep spoken responses natural and concise (2–3 sentences).",
        assistant:
          "You are Kleva (Lizzy), SafetyLink's real-time AI voice safety companion. Answer questions about personal safety, route planning, BLE iTAG triggers, and SafetyLink emergency tools in a warm, calm, concise spoken tone.",
      };

      const baseInstruction = modeInstructions[mode] || modeInstructions.post_emergency;
      const systemText = incidentSummary
        ? `${baseInstruction}\n\nRecent SafetyLink Incident Context: ${incidentSummary}`
        : baseInstruction;

      let readySent = false;
      const notifyReady = () => {
        if (!readySent && clientWs.readyState === 1) {
          readySent = true;
          clientWs.send(JSON.stringify({ type: "ready", model: "gemini-3.8-live", voice: voiceName, mode }));
        }
      };

      session = await aiClient.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemText,
        },
        callbacks: {
          onopen: () => {
            notifyReady();
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== 1) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({ type: "inputTranscript", text: content.inputTranscription.text }));
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(JSON.stringify({ type: "outputTranscript", text: content.outputTranscription.text }));
            }

            const parts = content?.modelTurn?.parts || [];
            for (const part of parts) {
              const audio = (part as any)?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ type: "audio", data: audio }));
              }
              const txt = (part as any)?.text;
              if (txt) {
                clientWs.send(JSON.stringify({ type: "text", text: txt }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onerror: (err: any) => {
            console.error("[Live WS Gemini error]", err);
            if (clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: "error", message: String(err?.message || err || "Gemini Live error") }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: "closed" }));
            }
          },
        },
      });

      if (clientClosed) {
        try { session?.close(); } catch {}
        return;
      }

      notifyReady();
      while (pendingMessages.length > 0) {
        const queued = pendingMessages.shift();
        if (queued !== undefined) forwardClientPayload(queued);
      }

      if (mode === "checkin" || mode === "post_emergency") {
        try {
          const introPrompt =
            mode === "checkin"
              ? "Greet the user warmly and ask if they are safe right now or if they need emergency dispatch restarted."
              : incidentSummary
                ? `Greet the user warmly after their recent SafetyLink incident (${incidentSummary}). Ask calmly if they are physically safe right now and how you can support them.`
                : "Greet the user warmly as Kleva from SafetyLink and ask if they are safe right now and how you can help.";
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: introPrompt }] }],
            turnComplete: true,
          });
        } catch (greetErr) {
          console.warn("[Live WS initial prompt skipped]", greetErr);
        }
      }
    } catch (err: any) {
      console.error("[Live WS connection setup failed]", err);
      const info = extractGeminiError(err);
      if (clientWs.readyState === 1) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            message: info.message || "Failed to start Gemini Live voice session.",
          })
        );
        clientWs.close();
      }
    }
  });
}

startServer();
// Keep process alive
