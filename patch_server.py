import re

with open("server.ts", "r") as f:
    content = f.read()

imports = """import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@libsql/client";
import * as stytch from "stytch";
import Pusher from "pusher";
import crypto from "crypto";

// --- Database & Auth Initialization ---
const db = createClient({ url: "file:safetylink.db" });

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_code TEXT NOT NULL UNIQUE,
      org_name TEXT NOT NULL,
      admin_password_hash TEXT NOT NULL,
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
"""

content = content.replace('import express from "express";\nimport path from "path";\nimport { createServer as createViteServer } from "vite";\nimport { GoogleGenAI } from "@google/genai";', imports)

# Insert the API routes right before Vite middleware
api_routes = """

  // --- Core SafetyLink API Endpoints ---
  
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
      const { org_code, admin_password } = req.body;
      const result = await db.execute({
        sql: "SELECT * FROM organizations WHERE org_code = ?",
        args: [org_code]
      });
      if (result.rows.length === 0) return res.status(401).json({ error: "Invalid organization" });
      
      const org = result.rows[0];
      const hash = crypto.createHash('sha256').update(admin_password).digest('hex');
      if (org.admin_password_hash !== hash) return res.status(401).json({ error: "Invalid password" });
      
      const tokenPayload = { orgId: org.id, orgCode: org.org_code, exp: Date.now() + 86400000 };
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      
      res.json({ token, org_name: org.org_name, org_code: org.org_code });
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
"""

content = content.replace("  // Vite middleware for development", api_routes)

# Call initDb on startup
content = content.replace("  app.listen(PORT, \"0.0.0.0\", () => {", "  await initDb();\n\n  app.listen(PORT, \"0.0.0.0\", () => {")

with open("server.ts", "w") as f:
    f.write(content)

