import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'safetylink-super-secret-key-2026';

app.use(express.json());

// ==========================================
// In-Memory Database Store (with Seed Data)
// ==========================================
const users: any[] = [];
const organizations: any[] = [];
const incidents: any[] = [];
const telemetryLogs: any[] = [];
const dispatchLogs: any[] = [];

// Seed an Initial Organization
const defaultOrg = {
  id: 'SL-ORG-MAIN',
  name: 'SafetyLink Main Command Node',
  contactName: 'Super Administrator',
  contactEmail: 'admin@safetylink.co',
  createdAt: Date.now(),
  approved: true,
  logoUrl: '',
  primaryColor: '#0f172a',
  secondaryColor: '#10b981',
  controlRoomNumber: '+27829110000',
  escalationPolicy: 'Tier-1 Automatic Escalate to Armed Guard Patrol units.',
};
organizations.push(defaultOrg);

// Seed a Super Admin User
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync('safetylink2026', salt);
const defaultAdmin = {
  id: 'SL-admin-0000',
  username: 'SL-admin-0000',
  fullName: 'Main Control Room Operator',
  phone: '+27829110000',
  email: 'operator@safetylink.co',
  orgCode: 'SL-ORG-MAIN',
  createdAt: Date.now(),
  role: 'Control Room Operator',
  passwordHash: hashedPassword,
};
users.push(defaultAdmin);

// Seed a standard Community Member
const memberHashedPassword = bcrypt.hashSync('member123', salt);
users.push({
  id: 'SL-USR-1001',
  username: 'community_john',
  fullName: 'John Doe',
  phone: '+27831112222',
  email: 'john@gmail.com',
  orgCode: 'SL-ORG-MAIN',
  createdAt: Date.now(),
  role: 'Community Member',
  passwordHash: memberHashedPassword,
});

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
app.post('/api/auth/register-user', (req, res) => {
  const { username, password, fullName, phone, email, orgCode, role } = req.body;

  if (!username || !password || !fullName || !phone || !email || !orgCode) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
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
    createdAt: Date.now(),
    passwordHash: hash,
  };

  users.push(newUser);

  // Return user profile (without password hash) along with automatic login JWT token
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
app.post('/api/auth/register-org', (req, res) => {
  const { name, contactName, contactEmail, controlRoomNumber } = req.body;

  if (!name || !contactName || !contactEmail) {
    return res.status(400).json({ error: 'Missing required organization fields' });
  }

  const newOrg = {
    id: `SL-ORG-${Math.floor(1000 + Math.random() * 9000)}`,
    name,
    contactName,
    contactEmail,
    createdAt: Date.now(),
    approved: true,
    controlRoomNumber: controlRoomNumber || '+27829110000',
    escalationPolicy: 'Standard dispatcher escalation loop.',
  };

  organizations.push(newOrg);
  return res.status(201).json({
    message: 'Organization registered successfully',
    organization: newOrg,
  });
});

// POST /auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
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
app.post('/api/dispatch/sms', (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and message body are required' });
  }

  const logEntry = {
    id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'SMS',
    recipient: phone,
    content: message,
    timestamp: Date.now(),
    status: 'QUEUED',
    provider: 'twilio',
  };
  dispatchLogs.push(logEntry);

  console.log(`[EnterpriseDispatch] SMS to ${phone}: "${message}"`);
  return res.status(202).json({
    success: true,
    message: 'SMS dispatch queued',
    dispatchId: logEntry.id,
    status: logEntry.status,
    provider: logEntry.provider,
  });
});

// POST /dispatch/voice
app.post('/api/dispatch/voice', (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and voice message template are required' });
  }

  const logEntry = {
    id: `VC-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'VOICE',
    recipient: phone,
    content: message,
    timestamp: Date.now(),
    status: 'INITIATED',
    provider: 'twilio',
  };
  dispatchLogs.push(logEntry);

  console.log(`[EnterpriseDispatch] Voice synthesized call to ${phone}: "${message}"`);
  return res.status(202).json({
    success: true,
    message: 'Voice synthesized speed-dial dispatch initiated',
    dispatchId: logEntry.id,
    status: logEntry.status,
  });
});

// POST /dispatch/whatsapp
app.post('/api/dispatch/whatsapp', (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Recipient phone number and WhatsApp message are required' });
  }

  const logEntry = {
    id: `WA-${Math.floor(100000 + Math.random() * 900000)}`,
    channel: 'WHATSAPP',
    recipient: phone,
    content: message,
    timestamp: Date.now(),
    status: 'OPENED',
    provider: 'whatsapp-direct',
  };
  dispatchLogs.push(logEntry);

  console.log(`[EnterpriseDispatch] WhatsApp protocol link spawned for ${phone}: "${message}"`);
  return res.status(200).json({
    success: true,
    message: 'WhatsApp message dispatch link successfully generated',
    dispatchId: logEntry.id,
    status: logEntry.status,
  });
});

// POST /incidents
app.post('/api/incidents', (req, res) => {
  const { id, latitude, longitude, description, org_id, triggered_by, status, severity } = req.body;

  if (!id || latitude === undefined || longitude === undefined || !description) {
    return res.status(400).json({ error: 'Missing incident core variables' });
  }

  const newIncident = {
    id,
    latitude,
    longitude,
    description,
    org_id: org_id || 'SL-ORG-MAIN',
    triggered_by: triggered_by || 'Anonymous',
    status: status || 'DISPATCHED',
    severity: severity || 'CRITICAL',
    timestamp: Date.now(),
    assignedResponder: 'Escalated Regional Patrol Unit Alpha',
    timelineData: [
      'Incident logged via native API proxy securely.',
      'Emergency response team notified.'
    ]
  };

  incidents.push(newIncident);
  console.log(`[EnterpriseDispatch] Recorded new Incident: ${id} at [${latitude}, ${longitude}]`);
  return res.status(201).json({
    success: true,
    message: 'Incident recorded successfully',
    incident: newIncident,
  });
});

// GET /incidents (Allows optional Org Filtering)
app.get('/api/incidents', (req, res) => {
  const orgCode = req.query.orgCode as string;

  if (orgCode) {
    const filtered = incidents.filter(i => i.org_id === orgCode);
    return res.status(200).json(filtered);
  }

  return res.status(200).json(incidents);
});

// POST /telemetry
app.post('/api/telemetry', (req, res) => {
  const { deviceId, latitude, longitude, batteryLevel, rssi, status } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const telemetryEntry = {
    id: `TEL-${Math.floor(100000 + Math.random() * 900000)}`,
    deviceId,
    latitude: latitude || 0,
    longitude: longitude || 0,
    batteryLevel: batteryLevel !== undefined ? batteryLevel : 100,
    rssi: rssi !== undefined ? rssi : -50,
    status: status || 'OK',
    timestamp: Date.now(),
  };

  telemetryLogs.push(telemetryEntry);
  console.log(`[EnterpriseDispatch] Telemetry received from ${deviceId}: battery=${batteryLevel}%, status=${status}`);
  return res.status(200).json({
    success: true,
    message: 'Telemetry logged successfully',
    telemetryId: telemetryEntry.id,
  });
});

// POST /webhooks/twilio-status
app.post('/api/webhooks/twilio-status', (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;

  console.log(`[TwilioWebhook] SID: ${MessageSid}, status: ${MessageStatus}, errorCode: ${ErrorCode}`);

  const log = dispatchLogs.find(l => l.id === MessageSid);
  if (log) {
    log.status = MessageStatus;
    if (ErrorCode) log.errorCode = ErrorCode;
  }

  return res.status(200).json({ received: true });
});

// ==========================================
// Vite SPA Static Asset / Middleware Routing
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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

startServer();
