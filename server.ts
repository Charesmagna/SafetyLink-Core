import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import fs from 'fs';

const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = { projectId: 'safetylink-99e56', firestoreDatabaseId: '(default)' };
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
}

let firebaseApp: any = null;
let firestore: any = null;

function getFirebase() {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId
    });
    firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  }
  return { firebaseApp, firestore };
}


import { db } from './src/db/index.js';
import { users, organizations, incidents, telemetryLogs, dispatchLogs } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'safetylink-super-secret-key-2026';

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==========================================
// Database setup is now in src/db
// ==========================================


// Seeding logic removed in favor of Drizzle ORM
async function seedDefaultUserAndOrg() {
  try {
    const existingOrg = await db.select().from(organizations).where(eq(organizations.id, 'SL-ORG-MAIN'));
    if (existingOrg.length === 0) {
      await db.insert(organizations).values({
        id: 'SL-ORG-MAIN',
        name: 'SafetyLink Main Command Node',
        contactName: 'Super Administrator',
        contactEmail: 'admin@safetylink.co',
        controlRoomNumber: '+27829110000',
        escalationPolicy: 'Tier-1 Automatic Escalate to Armed Guard Patrol units.',
      });
    }

    const existingAdmin = await db.select().from(users).where(eq(users.username, 'SL-admin-0000'));
    if (existingAdmin.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('safetylink2026', salt);
      await db.insert(users).values({
        id: 'SL-admin-0000',
        username: 'SL-admin-0000',
        fullName: 'Main Control Room Operator',
        phone: '+27829110000',
        email: 'operator@safetylink.co',
        orgCode: 'SL-ORG-MAIN',
        role: 'Control Room Operator',
        passwordHash: hashedPassword,
      });
    }

    const existingMember = await db.select().from(users).where(eq(users.username, 'community_john'));
    if (existingMember.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const memberHashedPassword = bcrypt.hashSync('member123', salt);
      await db.insert(users).values({
        id: 'SL-USR-1001',
        username: 'community_john',
        fullName: 'John Doe',
        phone: '+27831112222',
        email: 'john@gmail.com',
        orgCode: 'SL-ORG-MAIN',
        role: 'Community Member',
        passwordHash: memberHashedPassword,
      });
    }
  } catch (err) {
    console.error("Failed to seed db:", err);
  }
}
seedDefaultUserAndOrg();


// ==========================================
// Authentication Middleware
// ==========================================
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    username: string;
    role: string;
    orgCode: string;
  };
}

function authenticateToken(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
}

// ==========================================
// API Endpoints — Part B Implementation
// ==========================================

// POST /auth/register-user
app.post('/api/auth/register-user', async (req, res) => {
  const { username, password, fullName, phone, email, orgCode, role } = req.body;

  if (!username || !password || !fullName || !phone || !email || !orgCode) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const existingUser = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
  if (existingUser.length > 0) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);

  const newUser = {
    id: `SL-USR-${Math.floor(1000 + Math.random() * 9000)}`,
    username,
    fullName,
    phone,
    email,
    orgCode,
    role: role || 'Community Member',
    passwordHash: hash,
  };

  await db.insert(users).values(newUser);

  const tokenPayload = {
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    orgCode: newUser.orgCode,
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({
    message: 'User registered successfully',
    user: safeUser,
    token,
  });
});

// POST /auth/register-org
app.post('/api/auth/register-org', async (req, res) => {
  const { name, contactName, contactEmail, controlRoomNumber } = req.body;

  if (!name || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'Missing required organization fields' });
  }

  const newOrg = {
    id: `SL-ORG-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    contactName,
    contactEmail,
    controlRoomNumber: controlRoomNumber || '+27829110000',
    escalationPolicy: 'Standard dispatcher escalation loop.',
  };

  await db.insert(organizations).values(newOrg);

  return res.status(201).json({
    message: 'Organization registered successfully',
    organization: newOrg,
  });
});

// POST /auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const foundUsers = await db.select().from(users).where(eq(users.username, username.toLowerCase()));
  const user = foundUsers[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    orgCode: user.orgCode,
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = user;
  return res.status(200).json({
    message: 'Login successful',
    user: safeUser,
    token,
  });
});

// POST /dispatch/sms
app.post('/api/dispatch/sms', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and message body are required' });
  }

  const logEntry = {
    id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'SMS',
    recipient: phone,
    content: message,
    status: 'QUEUED',
    provider: 'twilio',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(202).json({
    success: true,
    message: 'SMS dispatch queued',
    dispatchId: logEntry.id,
    status: logEntry.status,
    provider: logEntry.provider,
  });
});

// POST /dispatch/voice
app.post('/api/dispatch/voice', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and voice message template are required' });
  }

  const logEntry = {
    id: `VC-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'VOICE',
    recipient: phone,
    content: message,
    status: 'INITIATED',
    provider: 'twilio',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(202).json({
    success: true,
    message: 'Voice synthesized speed-dial dispatch initiated',
    dispatchId: logEntry.id,
    status: logEntry.status,
  });
});

// POST /dispatch/whatsapp
app.post('/api/dispatch/whatsapp', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and WhatsApp message are required' });
  }

  const logEntry = {
    id: `WA-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'WHATSAPP',
    recipient: phone,
    content: message,
    status: 'OPENED',
    provider: 'whatsapp-direct',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(200).json({
    success: true,
    message: 'WhatsApp message dispatch link successfully generated',
    dispatchId: logEntry.id,
    status: logEntry.status,
  });
});

// POST /incidents
app.post('/api/incidents', async (req, res) => {
  const { id, latitude, longitude, description, org_id, triggered_by, status, severity } = req.body;

  if (!id || latitude === undefined || longitude === undefined || !description) {
    return res.status(400).json({ error: 'Missing incident core variables' });
  }

  const newIncident = {
    id,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    description,
    orgId: org_id || 'SL-ORG-MAIN',
    triggeredBy: triggered_by || 'Anonymous',
    status: status || 'DISPATCHED',
    severity: severity || 'CRITICAL',
    assignedResponder: 'Escalated Regional Patrol Unit Alpha',
    timelineData: [
      'Incident logged via native API proxy securely.',
      'Emergency response team notified.'
    ]
  };

  await db.insert(incidents).values(newIncident);
  try { await getFirebase().firestore.collection('incidents').doc(newIncident.id).set(newIncident); } catch(e) { console.error('Firestore sync error:', e); }

  console.log(`[EnterpriseDispatch] Recorded new Incident: ${id} at [${latitude}, ${longitude}]`);
  return res.status(201).json({
    success: true,
    message: 'Incident recorded successfully',
    incident: newIncident,
  });
});

// GET /incidents (Allows optional Org Filtering)
app.get('/api/incidents', async (req, res) => {
  const orgCode = req.query.orgCode as string;
  try {
    if (orgCode) {
      const filtered = await db.select().from(incidents).where(eq(incidents.orgId, orgCode));
      return res.status(200).json(filtered);
    }
    const allIncidents = await db.select().from(incidents);
    return res.status(200).json(allIncidents);
  } catch (err) {
    return res.status(500).json({error: 'Failed to fetch incidents'});
  }
});

// POST /telemetry
app.post('/api/telemetry', async (req, res) => {
  const { deviceId, latitude, longitude, batteryLevel, rssi, status } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const telemetryEntry = {
    id: `TEL-${Math.floor(100000 + Math.random() * 900000)}`,
    deviceId,
    latitude: (latitude || 0).toString(),
    longitude: (longitude || 0).toString(),
    batteryLevel: batteryLevel !== undefined ? batteryLevel : 100,
    rssi: rssi !== undefined ? rssi : -50,
    status: status || 'OK',
  };

  await db.insert(telemetryLogs).values(telemetryEntry);

  return res.status(200).json({
    success: true,
    message: 'Telemetry logged successfully',
    telemetryId: telemetryEntry.id,
  });
});

// POST /webhooks/twilio-status
app.post('/api/webhooks/twilio-status', async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;
  
  try {
    const logs = await db.select().from(dispatchLogs).where(eq(dispatchLogs.id, MessageSid));
    if (logs.length > 0) {
      await db.update(dispatchLogs).set({ status: MessageStatus, errorCode: ErrorCode || null }).where(eq(dispatchLogs.id, MessageSid));
    }
  } catch(e) {}

  return res.status(200).json({ received: true });
});

// ==========================================
// Vite SPA Static Asset / Middleware Routing
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 SafetyLink Core Secure Full-Stack Node Server`);
    console.log(`   Running on http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => { console.error("Fatal error during server startup:", err); process.exit(1); });
process.on('beforeExit', () => console.log('BEFORE EXIT EVENT')); process.on('exit', () => console.log('EXIT EVENT'));
