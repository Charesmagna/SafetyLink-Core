import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import fs from 'fs';
import { createOCUser } from './src/services/owncloud';

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
const PORT = 3000;
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }
  return secret;
};

const dispatchRateLimit = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60000;
  const limits = dispatchRateLimit.get(ip) || [];
  const validRequests = limits.filter(t => now - t < windowMs);
  if (validRequests.length >= 10) return res.status(429).json({ error: "Too many requests" });
  validRequests.push(now);
  dispatchRateLimit.set(ip, validRequests);
  next();
};

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

  jwt.verify(token, getJwtSecret(), (err, decoded) => {
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
app.post(['/api/auth/register-user', '/api/auth/register'], async (req, res) => {
  const { username, password, fullName, phone, email, orgCode, role, disabilityType, accessibilityPrefs, needsVoiceControl, needsLargeText, needsVibration } = req.body;

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
    disabilityType: disabilityType || 'NONE',
    accessibilityPrefs: accessibilityPrefs ? JSON.stringify(accessibilityPrefs) : null,
    needsVoiceControl: needsVoiceControl === true,
    needsLargeText: needsLargeText === true,
    needsVibration: needsVibration !== false, // default true
  };

  await db.insert(users).values(newUser);

  const tokenPayload = {
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    orgCode: newUser.orgCode,
  };
  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({
    message: 'User registered successfully',
    user: safeUser,
    token,
  });
});

// POST /auth/register-org
app.post(['/api/auth/register-org', '/api/org/register', '/api/family/register'], async (req, res) => {
  const { name, contactName, contactEmail, controlRoomNumber, password, id } = req.body;

  if (!name || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'Missing required organization fields' });
  }
  
  const isFamily = req.path.includes('family');
  const type = isFamily ? 'FAMILY' : 'ORGANIZATION';
  const prefix = isFamily ? 'FAM' : 'ORG';

  const newId = id || `SL-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // 1. Auto Create OC User
  const ocCreds = await createOCUser(newId, type);
  
  const newOrg = {
    id: newId,
    name,
    contactName,
    contactEmail,
    controlRoomNumber: controlRoomNumber || '+27829110000',
    escalationPolicy: 'Standard dispatcher escalation loop.',
    approved: false,
    ocUsername: ocCreds.ocUsername,
    ocPassword: ocCreds.ocPassword
  };

  await db.insert(organizations).values(newOrg);

  const saltRounds = 10;
  const hash = bcrypt.hashSync(password || 'member123', saltRounds);
  const newUser = {
    id: `SL-USR-${Math.floor(1000 + Math.random() * 9000)}`,
    username: contactName.toLowerCase().replace(/\s+/g, '_'),
    fullName: contactName,
    phone: controlRoomNumber || '+27829110000',
    email: contactEmail,
    orgCode: newOrg.id,
    role: isFamily ? 'Family Administrator' : 'Organization Administrator',
    passwordHash: hash,
    ocUsername: ocCreds.ocUsername,
    ocPassword: ocCreds.ocPassword
  };
  await db.insert(users).values(newUser);

  return res.status(201).json({
    message: isFamily ? 'Family registered successfully' : 'Organization registered successfully',
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
  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '7d' });

  const { passwordHash, ...safeUser } = user;
  return res.status(200).json({
    message: 'Login successful',
    user: safeUser,
    token,
  });
});

// POST /dispatch/sms
app.post('/api/dispatch/sms', authenticateToken, rateLimiter, async (req, res) => {
  const { phone, message, accountSid, authToken, fromNumber } = req.body;
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

  const sid = accountSid || process.env.TWILIO_ACCOUNT_SID;
  const token = authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = fromNumber || process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const body = new URLSearchParams();
      body.append('To', phone);
      body.append('From', from);
      body.append('Body', message);
      const twilioRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });
      if (!twilioRes.ok) {
        console.error('Twilio SMS error:', await twilioRes.text());
      }
    } catch (e) {
      console.error('Twilio SMS exception:', e);
    }
  }

  return res.status(202).json({
    success: true,
    message: 'SMS dispatch queued',
    dispatchId: logEntry.id,
    status: logEntry.status,
    provider: logEntry.provider,
  });
});

// POST /dispatch/voice
app.post('/api/dispatch/voice', authenticateToken, rateLimiter, async (req, res) => {
  const { phone, message, accountSid, authToken, fromNumber } = req.body;
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

  const sid = accountSid || process.env.TWILIO_ACCOUNT_SID;
  const token = authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = fromNumber || process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const body = new URLSearchParams();
      body.append('To', phone);
      body.append('From', from);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response>  <Say voice="alice">${message}</Say></Response>`;
      body.append('Twiml', twiml);
      const twilioRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });
      if (!twilioRes.ok) {
        console.error('Twilio Voice error:', await twilioRes.text());
      }
    } catch (e) {
      console.error('Twilio Voice exception:', e);
    }
  }

  return res.status(202).json({
    success: true,
    message: 'Voice synthesized speed-dial dispatch initiated',
    dispatchId: logEntry.id,
    status: logEntry.status,
  });
});

// POST /dispatch/whatsapp
app.post('/api/dispatch/whatsapp', authenticateToken, rateLimiter, async (req, res) => {
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

// POST /dispatch/ntfy
app.post('/api/dispatch/ntfy', authenticateToken, rateLimiter, async (req, res) => {
  const { topic, message, serverUrl } = req.body;
  if (!topic || !message) {
    return res.status(400).json({ error: 'Topic and message are required' });
  }
  
  const logEntry = {
    id: `NTFY-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'PUSH',
    recipient: topic,
    content: message,
    status: 'QUEUED',
    provider: 'ntfy',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(202).json({ success: true, message: 'Ntfy dispatch queued', dispatchId: logEntry.id, status: logEntry.status });
});

// POST /dispatch/owncloud
app.post('/api/dispatch/owncloud', authenticateToken, rateLimiter, async (req, res) => {
  const { folder, fileContent, filename } = req.body;
  if (!folder || !fileContent) {
    return res.status(400).json({ error: 'Folder and fileContent are required' });
  }
  
  const logEntry = {
    id: `OC-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'STORAGE',
    recipient: folder,
    content: filename || 'incident_log.txt',
    status: 'QUEUED',
    provider: 'owncloud',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(202).json({ success: true, message: 'ownCloud dispatch queued', dispatchId: logEntry.id, status: logEntry.status });
});

// POST /dispatch/sensorstream
app.post('/api/dispatch/sensorstream', authenticateToken, rateLimiter, async (req, res) => {
  const { udpHost, udpPort, payload } = req.body;
  if (!udpHost || !udpPort) {
    return res.status(400).json({ error: 'UDP host and port are required' });
  }
  
  const logEntry = {
    id: `SS-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'TELEMETRY',
    recipient: `${udpHost}:${udpPort}`,
    content: JSON.stringify(payload),
    status: 'QUEUED',
    provider: 'sensorstream',
  };
  await db.insert(dispatchLogs).values(logEntry);

  return res.status(202).json({ success: true, message: 'SensorStream dispatch queued', dispatchId: logEntry.id, status: logEntry.status });
});

// POST /incidents
app.post(['/api/incidents', '/api/panic'], authenticateToken, async (req, res) => {
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

// DELETE /api/admin/organizations/:id
app.delete('/api/admin/organizations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(organizations).where(eq(organizations.id, id));
    await db.delete(users).where(eq(users.orgCode, id));
    return res.status(200).json({ success: true, message: 'Organization deleted' });
  } catch(e) {
    return res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// POST /api/admin/organizations/:id/approve
app.post('/api/admin/organizations/:id/approve', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.update(organizations).set({ approved: true }).where(eq(organizations.id, id));
    return res.status(200).json({ success: true, message: 'Organization approved' });
  } catch(e) {
    return res.status(500).json({ error: 'Failed to approve organization' });
  }
});

// GET /incidents (Allows optional Org Filtering)
app.get('/api/incidents', authenticateToken, async (req, res) => {
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
app.get('/api/telemetry', authenticateToken, async (req, res) => {
  try {
    const data = await db.select().from(telemetryLogs).orderBy(telemetryLogs.timestamp);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

app.post('/api/telemetry', authenticateToken, async (req, res) => {
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


// POST /api/v1/sos-ingest (in case it tries with /api)
app.post('/api/v1/sos-ingest', async (req, res) => {
  // Try to extract relevant tracking info from the intercepted payload
  // The base app might send different structures, so we make it robust.
  const payload = req.body || {};
  
  const latitude = payload.lat || payload.latitude || payload.location?.lat || 0;
  const longitude = payload.lng || payload.lon || payload.longitude || payload.location?.lng || 0;
  const deviceId = payload.device_id || payload.imei || payload.uid || payload.id || `UNKNOWN_DEVICE_${Math.floor(1000 + Math.random() * 9000)}`;
  const status = payload.status || payload.state || payload.event || 'SOS_INTERCEPT';

  const telemetryEntry = {
    id: `SINKHOLE-${Math.floor(100000 + Math.random() * 900000)}`,
    deviceId: deviceId.toString(),
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    batteryLevel: payload.battery || payload.batt || 100,
    rssi: payload.rssi || payload.signal || -50,
    status: status.toString(),
  };

  try {
    await db.insert(telemetryLogs).values(telemetryEntry);
    
    // Also record it as an incident if it's an SOS
    if (status.toString().toUpperCase().includes('SOS') || status.toString().toUpperCase().includes('PANIC') || status.toString().toUpperCase().includes('EMERGENCY')) {
      const newIncident = {
        id: `INC-SINKHOLE-${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        description: 'Automated SOS trigger intercepted via DNS Sinkhole from base app',
        orgId: 'SL-ORG-MAIN',
        triggeredBy: deviceId.toString(),
        status: 'DISPATCHED',
        severity: 'CRITICAL',
        assignedResponder: 'Escalated Regional Patrol Unit Alpha',
        timelineData: [
          'Intercepted base app tracking payload.',
          'Rerouted via local DNS sinkhole.',
          'Emergency SOS registered on backend.'
        ]
      };
      await db.insert(incidents).values(newIncident);
      try { await getFirebase().firestore.collection('incidents').doc(newIncident.id).set(newIncident); } catch(e) { console.error('Firestore sync error:', e); }
    }
  } catch (e) {
    console.error('Failed to log sinkhole telemetry:', e);
  }

  // Always return 200 OK so the base app thinks its original server accepted it
  return res.status(200).json({ success: true, message: 'OK', code: 200, status: 'received' });
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
  const distPath = path.join(process.cwd(), 'dist');
  let isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware enabled for development.');
    } catch (err) {
      console.warn('Vite not found or failed to load. Falling back to production static serving.', err);
      isProduction = true;
    }
  }

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static production serving enabled.');
  }

  app.listen(PORT, '0.0.0.0', (err) => {
    if (err) { console.error('Failed to listen:', err); return; }
    console.log(`====================================================`);
    console.log(`🚀 SafetyLink Core Secure Full-Stack Node Server`);
    console.log(`   Running on http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => { console.error("Fatal error during server startup:", err); process.exit(1); });

// POST /api/org/contact/add
app.post('/api/org/contact/add', async (req, res) => {
  const { orgCode, name, phone, role, whatsappEnabled, smsEnabled } = req.body;
  if (!orgCode || !name || !phone) return res.status(400).json({ error: 'Missing fields' });
  const newContact = {
    id: `SL-CON-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    phone,
    role: role || 'Guard',
    orgId: orgCode,
    lang: 'en'
  };
  await db.insert(contacts).values(newContact);
  return res.status(201).json({ message: 'Contact added', contact: newContact });
});

// POST /api/family/contact/add
app.post('/api/family/contact/add', async (req, res) => {
  const { familyCode, name, phone, role, whatsappEnabled, smsEnabled } = req.body;
  if (!familyCode || !name || !phone) return res.status(400).json({ error: 'Missing fields' });
  const newContact = {
    id: `SL-CON-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    phone,
    role: role || 'Member',
    familyId: familyCode,
    lang: 'en'
  };
  await db.insert(contacts).values(newContact);
  return res.status(201).json({ message: 'Contact added', contact: newContact });
});
