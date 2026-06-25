import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

// Interfaces & In-Memory Database State
interface Organization {
  id: string;
  name: string;
  code: string;
  subscriptionPlan: string;
  status: "active" | "suspended";
  twilioSid?: string;
  twilioToken?: string;
  whatsappPhoneId?: string;
  whatsappToken?: string;
  voiceEscalationNumbers?: string;
  createdAt: string;
}

interface User {
  id: string;
  organizationId: string | null;
  name: string;
  email: string;
  role: string; // Member, Responder, Supervisor, Admin, Owner
  status: "pending" | "approved" | "suspended";
  phone: string;
  bio?: string;
  profilePhoto?: string; // base64
  createdAt: string;
}

interface MedicalProfile {
  userId: string;
  bloodType: string;
  allergies: string;
  medications: string;
  notes: string;
  emergencyContacts: Array<{ name: string; relationship: string; phone: string }>;
}

interface HardwareDevice {
  id: string;
  organizationId: string;
  name: string;
  deviceId: string; // MAC or UUID
  assignedUserId: string | null;
  batteryLevel: number;
  connectionState: "connected" | "disconnected" | "scanning";
  rssi: number;
  mappedAction: "SOS" | "DRILL" | "CHECK_IN" | "CANCEL";
  createdAt: string;
}

interface Alert {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  status: "active" | "escalated" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  medicalSummary?: string;
}

interface AlertEvent {
  id: string;
  alertId: string;
  type: string; // 'trigger', 'sms_sent', 'whatsapp_sent', 'voice_call', 'fcm_broadcast', 'responder_assigned', 'status_changed', 'resolved'
  message: string;
  timestamp: string;
}

interface SMSLog {
  id: string;
  orgId: string;
  alertId: string;
  toNumber: string;
  provider: "Twilio" | "AfricasTalking";
  status: "delivered" | "failed";
  messageId: string;
  sentAt: string;
  errorMessage?: string;
}

interface WhatsAppLog {
  id: string;
  orgId: string;
  alertId: string;
  toNumber: string;
  status: "delivered" | "failed";
  messageId: string;
  sentAt: string;
}

interface VoiceLog {
  id: string;
  orgId: string;
  alertId: string;
  contactNumber: string;
  contactName: string;
  attemptNumber: number;
  method: "twilio" | "native";
  status: "answered" | "no-answer" | "busy" | "initiated";
  initiatedAt: string;
  errorMessage?: string;
}

// In-Memory DB
const organizations: Organization[] = [];
const users: User[] = [];
const medicalProfiles: Record<string, MedicalProfile> = {};
const hardwarePool: HardwareDevice[] = [];
const alerts: Alert[] = [];
const alertEvents: AlertEvent[] = [];
const smsLogs: SMSLog[] = [];
const whatsappLogs: WhatsAppLog[] = [];
const voiceLogs: VoiceLog[] = [];

// Enterprise In-Memory Database Collections (v5.2.0 Upgrade)
const incidents: any[] = [];
const shifts: any[] = [];
const geofences: any[] = [];
const heartbeats: any[] = [];
const auditLogs: any[] = [];
const geofenceAlerts: any[] = [];

// Pre-populate some realistic seed data for immediate operational Command Centre and Platform demonstration
const defaultOrgId = "org-sa-tactical-01";
const seedOrg: Organization = {
  id: defaultOrgId,
  name: "Gauteng Tactical Patrols",
  code: "GP-TACT-99",
  subscriptionPlan: "Enterprise",
  status: "active",
  twilioSid: "AC99887766554433221100abcdef",
  twilioToken: "token_encrypted_0911_xyz",
  whatsappPhoneId: "1098485294",
  whatsappToken: "token_wa_meta_secure",
  voiceEscalationNumbers: "+27829998888,+27715554444",
  createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
};
organizations.push(seedOrg);

// Seed Responders and Supervisors
const responderUser1: User = {
  id: "user-resp-01",
  organizationId: defaultOrgId,
  name: "Officer Sipho Dlamini",
  email: "sipho@gptactical.co.za",
  role: "Responder",
  status: "approved",
  phone: "+27 82 555 0192",
  bio: "Senior Field Responder - Johannesburg North Sector",
  createdAt: new Date().toISOString()
};
const responderUser2: User = {
  id: "user-resp-02",
  organizationId: defaultOrgId,
  name: "Officer Jaco Botha",
  email: "jaco@gptactical.co.za",
  role: "Responder",
  status: "approved",
  phone: "+27 71 555 4912",
  bio: "Tactical Canine Unit - Midrand Sector",
  createdAt: new Date().toISOString()
};
const supervisorUser: User = {
  id: "user-sup-01",
  organizationId: defaultOrgId,
  name: "Dispatcher Leandra Naidoo",
  email: "leandra@gptactical.co.za",
  role: "Supervisor",
  status: "approved",
  phone: "+27 68 007 9911",
  bio: "Lead Command Centre Controller",
  createdAt: new Date().toISOString()
};
const standardMember: User = {
  id: "user-member-01",
  organizationId: defaultOrgId,
  name: "Tshilidzi Mukwevho",
  email: "tshilidzi.mukwevho54@gmail.com",
  role: "Member",
  status: "approved",
  phone: "+27 82 999 8888",
  bio: "SafetyLink Lead Developer",
  createdAt: new Date().toISOString()
};

users.push(responderUser1, responderUser2, supervisorUser, standardMember);

// Seed Medical Profile
medicalProfiles[standardMember.id] = {
  userId: standardMember.id,
  bloodType: "O+",
  allergies: "Penicillin, Sulfonamides",
  medications: "Lisinopril 10mg daily",
  notes: "Wearable safety wristband connected. Fast responder access required.",
  emergencyContacts: [
    { name: "Sipho Khumalo", relationship: "Spouse", phone: "+27829998888" },
    { name: "Leandra Naidoo", relationship: "Sister", phone: "+27715554444" }
  ]
};

// Seed Hardware Pool (iTAG buttons)
const iTagDevice: HardwareDevice = {
  id: "hw-itag-01",
  organizationId: defaultOrgId,
  name: "iTAG Wearable Wristband (v2.1)",
  deviceId: "FF:E0:45:90:AB:12",
  assignedUserId: standardMember.id,
  batteryLevel: 94,
  connectionState: "connected",
  rssi: -58,
  mappedAction: "SOS",
  createdAt: new Date().toISOString()
};
const keyfobDevice: HardwareDevice = {
  id: "hw-keyfob-02",
  organizationId: defaultOrgId,
  name: "SirenLink Keyfob (v3.0)",
  deviceId: "FF:E0:11:22:33:44",
  assignedUserId: responderUser1.id,
  batteryLevel: 88,
  connectionState: "connected",
  rssi: -72,
  mappedAction: "DRILL",
  createdAt: new Date().toISOString()
};
hardwarePool.push(iTagDevice, keyfobDevice);

// Seed Shifts (Phase 7)
shifts.push(
  {
    id: "shift-01",
    organizationId: defaultOrgId,
    userId: responderUser1.id,
    userName: responderUser1.name,
    role: "Responder",
    state: "Available",
    startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    currentTask: "Patrol"
  },
  {
    id: "shift-02",
    organizationId: defaultOrgId,
    userId: responderUser2.id,
    userName: responderUser2.name,
    role: "Responder",
    state: "Busy",
    startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    currentTask: "Emergency Response"
  },
  {
    id: "shift-03",
    organizationId: defaultOrgId,
    userId: supervisorUser.id,
    userName: supervisorUser.name,
    role: "Supervisor",
    state: "Online",
    startedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    currentTask: "Monitoring"
  }
);

// Seed Geofences (Phase 8)
geofences.push(
  {
    id: "geo-01",
    organizationId: defaultOrgId,
    name: "Lenasia Community Patrol Sector",
    type: "Community Zone",
    centerLat: -26.3085,
    centerLng: 27.8344,
    radiusMeters: 5000
  },
  {
    id: "geo-02",
    organizationId: defaultOrgId,
    name: "Sandton CBD Safe Zone",
    type: "Patrol Zone",
    centerLat: -26.1076,
    centerLng: 28.0567,
    radiusMeters: 3000
  },
  {
    id: "geo-03",
    organizationId: defaultOrgId,
    name: "Mitchells Plain Watch Boundary",
    type: "Community Zone",
    centerLat: -34.0485,
    centerLng: 18.6052,
    radiusMeters: 4000
  }
);

// Seed Device Heartbeats (Phase 4)
heartbeats.push(
  {
    id: "hb-01",
    deviceId: iTagDevice.id,
    organizationId: defaultOrgId,
    userId: standardMember.id,
    rssi: -58,
    batteryPercent: 94,
    connectionStatus: "Connected",
    latitude: -26.3085,
    longitude: 27.8344,
    lastSeen: new Date().toISOString()
  },
  {
    id: "hb-02",
    deviceId: keyfobDevice.id,
    organizationId: defaultOrgId,
    userId: responderUser1.id,
    rssi: -92,
    batteryPercent: 88,
    connectionStatus: "Weak Signal",
    latitude: -26.2041,
    longitude: 28.0473,
    lastSeen: new Date(Date.now() - 90 * 1000).toISOString()
  }
);

// Seed Audit Logs (Phase 11)
auditLogs.push(
  {
    id: "audit-01",
    organizationId: defaultOrgId,
    userId: supervisorUser.id,
    userName: supervisorUser.name,
    action: "API_CREDENTIAL_CHANGE",
    category: "Config",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    details: "Supervisors updated Twilio secure parameters for Gauteng clusters.",
    ipAddress: "196.25.255.1"
  },
  {
    id: "audit-02",
    organizationId: defaultOrgId,
    userId: standardMember.id,
    userName: standardMember.name,
    action: "HARDWARE_ASSIGN",
    category: "Hardware",
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    details: "Assigned iTAG wristband FF:E0:45:90:AB:12 to lead emergency contact.",
    ipAddress: "196.25.255.45"
  }
);

// Seed Initial Incidents (Phase 6)
const seedAlertId = "alt-seed-sos-01";
const seedAlert: Alert = {
  id: seedAlertId,
  organizationId: defaultOrgId,
  userId: standardMember.id,
  userName: standardMember.name,
  latitude: -26.3085,
  longitude: 27.8344,
  status: "escalated",
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  medicalSummary: "Blood: O+ | Allergies: Penicillin, Sulfonamides"
};
alerts.push(seedAlert);

alertEvents.push(
  {
    id: "evt-seed-1",
    alertId: seedAlertId,
    type: "trigger",
    message: "SOS Emergency alarm initiated by Tshilidzi Mukwevho near Lenasia, GP",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: "evt-seed-2",
    alertId: seedAlertId,
    type: "sms_sent",
    message: "SMS Alert dispatched via Twilio to primary contacts.",
    timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString()
  },
  {
    id: "evt-seed-3",
    alertId: seedAlertId,
    type: "voice_call",
    message: "Twilio voice call failed with No-Answer. Cascading down to backup responders.",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString()
  }
);

incidents.push({
  id: "inc-" + crypto.randomUUID(),
  organizationId: defaultOrgId,
  alertId: seedAlertId,
  userName: standardMember.name,
  userId: standardMember.id,
  mode: "standard",
  status: "Escalated",
  createdAt: seedAlert.createdAt,
  assignedResponderId: responderUser1.id,
  assignedResponderName: responderUser1.name,
  actionsTaken: ["GPS telemetry mapped", "Twilio automated fallback activated", "Officer Sipho Dlamini routed to Lenasia sector"],
  notes: "Caller requires high priority medical response support. Officer Dlamini ETA 4 minutes.",
  gpsTrail: [
    { latitude: -26.3085, longitude: 27.8344, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { latitude: -26.3080, longitude: 27.8342, timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
  ],
  timeline: [
    { message: "SOS Alert received from GPS mobile tracker.", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { message: "Twilio SMS dispatches sent to primary contact.", timestamp: new Date(Date.now() - 29 * 60 * 1000).toISOString() },
    { message: "Escalation initiated. Shift Responder Sipho Dlamini assigned.", timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
  ]
});


// No seed data. All clients and platform owners will register directly at runtime.

// Helper to generate organization codes: SL-XXXX-YY
function generateOrgCode(prefix: string = "SL"): string {
  const hex = crypto.randomBytes(2).toString("hex").toUpperCase();
  const suffix = crypto.randomBytes(1).toString("hex").toUpperCase();
  return `${prefix}-${hex}-${suffix}`;
}

function getClosestSouthAfricanCity(lat: number, lng: number): string {
  const cities = [
    { name: "Johannesburg, GP", lat: -26.2041, lng: 28.0473 },
    { name: "Cape Town, WC", lat: -33.9249, lng: 18.4241 },
    { name: "Durban, KZN", lat: -29.8587, lng: 31.0218 },
    { name: "Pretoria, GP", lat: -25.7479, lng: 28.2293 },
    { name: "Port Elizabeth, EC", lat: -33.9608, lng: 25.6022 },
    { name: "Bloemfontein, FS", lat: -29.1181, lng: 26.2241 },
    { name: "Lenasia, GP", lat: -26.3085, lng: 27.8344 },
    { name: "Soweto, GP", lat: -26.2678, lng: 27.8585 },
    { name: "Sandton, GP", lat: -26.1076, lng: 28.0567 },
    { name: "Mitchells Plain, WC", lat: -34.0485, lng: 18.6052 }
  ];
  let closest = cities[0];
  let minDist = Infinity;
  for (const city of cities) {
    const dist = Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }
  return closest.name;
}

// AES Encryption mock for credentials (per requirements, keep them secure)
function encryptAES(text: string): string {
  // Simple deterministic base64 encode as simple mock AES for in-memory safety
  return Buffer.from(text).toString("base64");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini Client Lazily as per guidelines to prevent startup crashes
  let ai: GoogleGenAI | null = null;
  function getAI() {
    if (!ai) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.warn("GEMINI_API_KEY is not defined. AI analysis functions will return simulated responses.");
        return null;
      }
      ai = new GoogleGenAI({ apiKey: key });
    }
    return ai;
  }

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      stats: {
        organizations: organizations.length,
        users: users.length,
        alerts: alerts.length,
        hardware: hardwarePool.length
      }
    });
  });

  // --- ORGANIZATIONS ENDPOINTS ---
  app.post("/api/organizations", (req, res) => {
    const { name, subscriptionPlan } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required." });
    }

    const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "SL";
    const code = generateOrgCode(prefix);

    const newOrg: Organization = {
      id: "org-" + crypto.randomUUID(),
      name,
      code,
      subscriptionPlan: subscriptionPlan || "Enterprise",
      status: "active",
      createdAt: new Date().toISOString()
    };

    organizations.push(newOrg);

    // Automatically log this admin action
    console.log(`[AUDIT] Organization created: ${name} (${code})`);

    res.status(201).json(newOrg);
  });

  app.put("/api/organizations/:id/credentials", (req, res) => {
    const { id } = req.params;
    const { twilioSid, twilioToken, whatsappPhoneId, whatsappToken, voiceEscalationNumbers } = req.body;
    const org = organizations.find(o => o.id === id);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }
    org.twilioSid = twilioSid;
    org.twilioToken = twilioToken;
    org.whatsappPhoneId = whatsappPhoneId;
    org.whatsappToken = whatsappToken;
    org.voiceEscalationNumbers = voiceEscalationNumbers;
    console.log(`[AUDIT] Organization API credentials updated for: ${org.name}`);
    res.json(org);
  });

  app.get("/api/organizations", (req, res) => {
    res.json(organizations);
  });

  app.get("/api/organizations/:code", (req, res) => {
    const { code } = req.params;
    const org = organizations.find(o => o.code.toUpperCase() === code.toUpperCase());
    if (!org) {
      return res.status(404).json({ error: "Invalid organization code. Please verify and try again." });
    }
    if (org.status === "suspended") {
      return res.status(403).json({ error: "This organization is currently suspended." });
    }
    res.json(org);
  });

  // --- AUTH ENDPOINTS ---
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, role, orgCode } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ error: "Missing required registration parameters." });
    }

    let orgId: string | null = null;
    if (role !== "Platform Owner") {
      if (!orgCode) {
        return res.status(400).json({ error: "Organization code is required for registration." });
      }
      const org = organizations.find(o => o.code.toUpperCase() === orgCode.toUpperCase());
      if (!org) {
        return res.status(404).json({ error: "Organization code not found." });
      }
      orgId = org.id;
    }

    // Check if user exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const newUser: User = {
      id: "usr-" + crypto.randomUUID(),
      organizationId: orgId,
      name,
      email,
      role,
      phone,
      status: role === "Platform Owner" ? "approved" : "pending", // Default standard users to pending as required
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Initialize Default Medical profile
    medicalProfiles[newUser.id] = {
      userId: newUser.id,
      bloodType: "Unknown",
      allergies: "",
      medications: "",
      notes: "",
      emergencyContacts: []
    };

    console.log(`[AUDIT] User registered: ${name} (${role}), status: ${newUser.status}`);

    res.status(201).json({
      user: newUser,
      message: role === "Platform Owner" ? "Registered successfully." : "Registration submitted. Pending Admin approval."
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.status === "pending") {
      return res.status(403).json({ error: "Your account is pending administrator approval." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended." });
    }

    // Return dummy token & user payload
    const token = "jwt-token-mock-" + user.id;
    console.log(`[AUDIT] User logged in: ${user.name}`);

    res.json({
      token,
      user,
      medicalProfile: medicalProfiles[user.id] || null
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer jwt-token-mock-")) {
      return res.status(401).json({ error: "Unauthorized access." });
    }
    const userId = authHeader.replace("Bearer jwt-token-mock-", "");
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      user,
      medicalProfile: medicalProfiles[userId] || null
    });
  });

  // Approved user list / Approval controls
  app.get("/api/users", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(users.filter(u => u.organizationId === orgId));
    } else {
      res.json(users);
    }
  });

  app.put("/api/users/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "suspended", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    user.status = status;
    console.log(`[AUDIT] User status changed for ${user.name} to ${status}`);
    res.json(user);
  });

  // --- USER PROFILE & MEDICAL EDITORS ---
  app.put("/api/users/:id/profile", (req, res) => {
    const { id } = req.params;
    const { name, phone, bio, profilePhoto } = req.body;

    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    res.json(user);
  });

  app.get("/api/users/:id/medical", (req, res) => {
    const { id } = req.params;
    const med = medicalProfiles[id];
    if (!med) {
      return res.status(404).json({ error: "Medical profile not found." });
    }
    res.json(med);
  });

  app.put("/api/users/:id/medical", (req, res) => {
    const { id } = req.params;
    const { bloodType, allergies, medications, notes, emergencyContacts } = req.body;

    if (!medicalProfiles[id]) {
      medicalProfiles[id] = {
        userId: id,
        bloodType: "Unknown",
        allergies: "",
        medications: "",
        notes: "",
        emergencyContacts: []
      };
    }

    const med = medicalProfiles[id];
    if (bloodType !== undefined) med.bloodType = bloodType;
    if (allergies !== undefined) med.allergies = allergies;
    if (medications !== undefined) med.medications = medications;
    if (notes !== undefined) med.notes = notes;
    if (emergencyContacts !== undefined) med.emergencyContacts = emergencyContacts;

    res.json(med);
  });

  // --- ALERTS (SOS WORKFLOW) ---
  app.post("/api/alerts", (req, res) => {
    const { userId, latitude, longitude, clientGeneratedId } = req.body;

    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing alert location parameters." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Alert user not found." });
    }

    const orgId = user.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: "User must belong to an organization to trigger an alert." });
    }

    // Prevent duplicate processing via client generated ID
    const existingAlert = clientGeneratedId ? alerts.find(a => a.id === clientGeneratedId) : null;
    if (existingAlert) {
      return res.json(existingAlert);
    }

    const med = medicalProfiles[userId];
    const medicalSummary = med
      ? `Blood: ${med.bloodType} | Allergies: ${med.allergies || "None"} | Meds: ${med.medications || "None"} | Contacts Count: ${med.emergencyContacts?.length || 0}`
      : "No medical information configured.";

    const newAlert: Alert = {
      id: clientGeneratedId || "alt-" + crypto.randomUUID(),
      organizationId: orgId,
      userId,
      userName: user.name,
      latitude,
      longitude,
      status: "active",
      medicalSummary,
      createdAt: new Date().toISOString()
    };

    alerts.push(newAlert);

    const org = organizations.find(o => o.id === orgId);
    const twilioGate = org?.twilioSid ? `Custom Org SID [${org.twilioSid.slice(0, 8)}...]` : "System Default Gate";
    const waGate = org?.whatsappPhoneId ? `Custom Meta ID [${org.whatsappPhoneId}]` : "System Default Meta API";

    // Create Initial Trigger Event
    alertEvents.push({
      id: "evt-" + crypto.randomUUID(),
      alertId: newAlert.id,
      type: "trigger",
      message: `SOS Emergency alarm initiated by ${user.name} at coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Multi-Tenant Isolation Code: ${org?.code || "DEFAULT"}.`,
      timestamp: new Date().toISOString()
    });

    // Escalation Steps Simulation
    const timestampStr = new Date().toLocaleTimeString();
    
    // 1. WhatsApp Escalation
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      med.emergencyContacts.forEach((contact, idx) => {
        const waMsgId = "wa-sim-" + crypto.randomBytes(4).toString("hex");
        whatsappLogs.push({
          id: "wa-log-" + crypto.randomUUID(),
          orgId,
          alertId: newAlert.id,
          toNumber: contact.phone,
          status: "delivered",
          messageId: waMsgId,
          sentAt: new Date().toISOString()
        });
        
        alertEvents.push({
          id: "evt-" + crypto.randomUUID(),
          alertId: newAlert.id,
          type: "whatsapp_sent",
          message: `🚨 WhatsApp Alert dispatched via ${waGate} to ${contact.name} (${contact.phone}): "SAFETY-LINK: Member ${user.name} triggered SOS. Location: https://maps.google.com/?q=${latitude},${longitude}"`,
          timestamp: new Date().toISOString()
        });
      });
    }

    // 2. SMS Escalation
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      med.emergencyContacts.forEach((contact, idx) => {
        const smsMsgId = "sms-sim-" + crypto.randomBytes(4).toString("hex");
        smsLogs.push({
          id: "sms-log-" + crypto.randomUUID(),
          orgId,
          alertId: newAlert.id,
          toNumber: contact.phone,
          provider: "Twilio",
          status: "delivered",
          messageId: smsMsgId,
          sentAt: new Date().toISOString()
        });

        alertEvents.push({
          id: "evt-" + crypto.randomUUID(),
          alertId: newAlert.id,
          type: "sms_sent",
          message: `💬 SMS Alert dispatched via ${twilioGate} to ${contact.name} (${contact.phone}): "Safety-Link Alert! ${user.name} needs help at ${latitude.toFixed(4)},${longitude.toFixed(4)}"`,
          timestamp: new Date().toISOString()
        });
      });
    }

    // 3. Voice Call Escalation simulation (First contact initiated, cascading if no answer)
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      const primaryContact = med.emergencyContacts[0];
      voiceLogs.push({
        id: "voice-log-" + crypto.randomUUID(),
        orgId,
        alertId: newAlert.id,
        contactNumber: primaryContact.phone,
        contactName: primaryContact.name,
        attemptNumber: 1,
        method: "twilio",
        status: "initiated",
        initiatedAt: new Date().toISOString()
      });

      alertEvents.push({
        id: "evt-" + crypto.randomUUID(),
        alertId: newAlert.id,
        type: "voice_call",
        message: `📞 Twilio Automated Voice escalation initiated for ${primaryContact.name} (${primaryContact.phone}). TwiML: Reading out emergency alarm.`,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback native loop event
      alertEvents.push({
        id: "evt-" + crypto.randomUUID(),
        alertId: newAlert.id,
        type: "voice_call",
        message: `⚠️ No emergency contacts available for voice escalation. Mobile client will prompt direct phone fallback.`,
        timestamp: new Date().toISOString()
      });
    }

    // 4. FCM push notification to all responders and supervisors in the organization
    const orgResponders = users.filter(u => u.organizationId === orgId && ["Responder", "Supervisor", "Admin"].includes(u.role));
    if (orgResponders.length > 0) {
      const nearestCity = getClosestSouthAfricanCity(latitude, longitude);
      alertEvents.push({
        id: "evt-" + crypto.randomUUID(),
        alertId: newAlert.id,
        type: "fcm_broadcast",
        message: `📱 FCM Alert dispatched to ${orgResponders.length} active responders: "${user.name} triggered SOS near ${nearestCity}"`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[AUDIT] Emergency SOS Triggered! Alert: ${newAlert.id}, User: ${user.name}`);

    // Create Incident for the complete Incident Lifecycle (Phase 6)
    const assignedResp = shifts.find(s => s.state === "Available" && s.role === "Responder");
    const newIncident = {
      id: "inc-" + crypto.randomUUID(),
      organizationId: orgId,
      alertId: newAlert.id,
      userName: user.name,
      userId: userId,
      mode: (req.body.mode || "standard") as any,
      status: "Open" as const,
      createdAt: newAlert.createdAt,
      assignedResponderId: assignedResp ? assignedResp.userId : undefined,
      assignedResponderName: assignedResp ? assignedResp.userName : undefined,
      actionsTaken: ["Alert received by automated gateway"],
      notes: req.body.notes || "SOS alert triggered via device interface.",
      gpsTrail: [{ latitude, longitude, timestamp: new Date().toISOString() }],
      timeline: [
        { message: "SOS alert triggered. Emergency channels activated.", timestamp: new Date().toISOString() }
      ]
    };
    incidents.push(newIncident);

    // Update the responder's shift state to 'Responding' (Phase 7)
    if (assignedResp) {
      assignedResp.state = "Responding";
      assignedResp.currentTask = "Emergency Response";
    }

    // Write Audit Log (Phase 11)
    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: orgId,
      userId,
      userName: user.name,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: new Date().toISOString(),
      details: `SOS Alarm triggered. Incident ${newIncident.id.slice(0, 8)} created for ${user.name} (${user.role}). Mode: ${newIncident.mode.toUpperCase()}`,
      ipAddress: "196.25.2.21"
    });

    res.status(201).json({
      alert: newAlert,
      events: alertEvents.filter(e => e.alertId === newAlert.id),
      incident: newIncident
    });
  });

  // Get alerts
  app.get("/api/alerts", (req, res) => {
    const orgId = req.query.orgId as string;
    let filteredAlerts = alerts;
    if (orgId) {
      filteredAlerts = alerts.filter(a => a.organizationId === orgId);
    }
    // Sort latest first
    filteredAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(filteredAlerts);
  });

  // Get alert events
  app.get("/api/alerts/:id/events", (req, res) => {
    const { id } = req.params;
    const events = alertEvents.filter(e => e.alertId === id);
    res.json(events);
  });

  // Resolve alert
  app.put("/api/alerts/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { resolvedBy } = req.body;

    const alert = alerts.find(a => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    alert.status = "resolved";
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy || "Operator Control";

    // Update Incident
    const incident = incidents.find(i => i.alertId === id);
    if (incident) {
      incident.status = "Resolved";
      incident.resolvedAt = alert.resolvedAt;
      incident.actionsTaken.push(`Marked Resolved by ${alert.resolvedBy}`);
      incident.timeline.push({
        message: `✅ Incident resolved by ${alert.resolvedBy}. Operations successfully closed.`,
        timestamp: new Date().toISOString()
      });
    }

    alertEvents.push({
      id: "evt-" + crypto.randomUUID(),
      alertId: id,
      type: "resolved",
      message: `✅ Alert marked RESOLVED by ${alert.resolvedBy}. Response operations closed.`,
      timestamp: new Date().toISOString()
    });

    // Write Audit Log
    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: alert.organizationId,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: new Date().toISOString(),
      details: `Alert ${alert.id.slice(0, 8)} successfully resolved by ${alert.resolvedBy}. Operations concluded.`,
      ipAddress: "196.25.2.22"
    });

    console.log(`[AUDIT] Alert ${id} resolved by ${alert.resolvedBy}`);
    res.json(alert);
  });

  // Update alert status (escalate)
  app.put("/api/alerts/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, operatorMessage } = req.body;

    if (!["active", "escalated", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const alert = alerts.find(a => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    alert.status = status;

    // Update Incident
    const incident = incidents.find(i => i.alertId === id);
    if (incident) {
      if (status === "escalated") {
        incident.status = "Escalated";
      } else if (status === "active") {
        incident.status = "Acknowledged";
      } else if (status === "resolved") {
        incident.status = "Resolved";
        incident.resolvedAt = new Date().toISOString();
      }
      if (operatorMessage) {
        incident.notes += ` | Operator Note: ${operatorMessage}`;
      }
      incident.timeline.push({
        message: `🚨 Incident status changed to ${incident.status} by Command Centre operator.`,
        timestamp: new Date().toISOString()
      });
    }

    alertEvents.push({
      id: "evt-" + crypto.randomUUID(),
      alertId: id,
      type: "status_changed",
      message: `🚨 Alert status updated to ${status.toUpperCase()}. Operator note: "${operatorMessage || 'No notes added'}"`,
      timestamp: new Date().toISOString()
    });

    // Write Audit Log
    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: alert.organizationId,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: new Date().toISOString(),
      details: `Alert ${alert.id.slice(0, 8)} status set to ${status.toUpperCase()}. Note: ${operatorMessage || 'None'}`,
      ipAddress: "196.25.2.22"
    });

    console.log(`[AUDIT] Alert ${id} status set to ${status}`);
    res.json(alert);
  });

  // --- HARDWARE / BLE INTEGRATION ENDPOINTS ---
  app.get("/api/hardware", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(hardwarePool.filter(h => h.organizationId === orgId));
    } else {
      res.json(hardwarePool);
    }
  });

  app.post("/api/hardware", (req, res) => {
    const { name, deviceId, orgId } = req.body;
    if (!name || !deviceId || !orgId) {
      return res.status(400).json({ error: "Missing hardware name, MAC address, or organization ID." });
    }

    // Verify org
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Target organization not found." });
    }

    // Check duplicates
    if (hardwarePool.some(h => h.deviceId.toLowerCase() === deviceId.toLowerCase())) {
      return res.status(400).json({ error: "This physical BLE button MAC address is already registered in the system." });
    }

    const newDevice: HardwareDevice = {
      id: "hw-" + crypto.randomUUID(),
      organizationId: orgId,
      name,
      deviceId,
      assignedUserId: null,
      batteryLevel: 100,
      connectionState: "disconnected",
      rssi: -75,
      mappedAction: "SOS",
      createdAt: new Date().toISOString()
    };

    hardwarePool.push(newDevice);
    console.log(`[AUDIT] BLE Device registered in Pool: ${name} (${deviceId})`);
    res.status(201).json(newDevice);
  });

  app.post("/api/hardware/assign", (req, res) => {
    const { deviceId, userId } = req.body;
    const device = hardwarePool.find(h => h.id === deviceId);
    if (!device) {
      return res.status(404).json({ error: "Hardware device not found." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Unassign user from other devices first to avoid mapping collusions
    hardwarePool.forEach(h => {
      if (h.assignedUserId === userId) h.assignedUserId = null;
    });

    device.assignedUserId = userId;
    console.log(`[AUDIT] Hardware ${device.name} assigned to user ${user.name}`);
    res.json(device);
  });

  app.post("/api/hardware/unassign", (req, res) => {
    const { deviceId } = req.body;
    const device = hardwarePool.find(h => h.id === deviceId);
    if (!device) {
      return res.status(404).json({ error: "Hardware device not found." });
    }
    const oldUser = device.assignedUserId;
    device.assignedUserId = null;
    console.log(`[AUDIT] Hardware ${device.name} unassigned from user ${oldUser}`);
    res.json(device);
  });

  app.delete("/api/hardware/:id", (req, res) => {
    const { id } = req.params;
    const idx = hardwarePool.findIndex(h => h.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Device not found." });
    }
    const dev = hardwarePool[idx];
    hardwarePool.splice(idx, 1);
    console.log(`[AUDIT] Hardware ${dev.name} removed from registry`);
    res.json({ success: true, message: "Device removed." });
  });

  // --- ESCALATION SIMULATOR SYSTEM LOGS ---
  app.get("/api/logs/sms", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(smsLogs.filter(l => l.orgId === orgId));
    } else {
      res.json(smsLogs);
    }
  });

  app.get("/api/logs/whatsapp", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(whatsappLogs.filter(l => l.orgId === orgId));
    } else {
      res.json(whatsappLogs);
    }
  });

  app.get("/api/logs/voice", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(voiceLogs.filter(l => l.orgId === orgId));
    } else {
      res.json(voiceLogs);
    }
  });

  // Update voice log status (for testing call loop state transitions)
  app.put("/api/logs/voice/:id", (req, res) => {
    const { id } = req.params;
    const { status, errorMessage } = req.body;
    const log = voiceLogs.find(l => l.id === id);
    if (!log) {
      return res.status(404).json({ error: "Voice log not found" });
    }
    log.status = status;
    if (errorMessage) log.errorMessage = errorMessage;

    // Handle cascading voice trigger on fail/no-answer
    if (["no-answer", "busy"].includes(status)) {
      const alert = alerts.find(a => a.id === log.alertId);
      if (alert) {
        const med = medicalProfiles[alert.userId];
        if (med && med.emergencyContacts && med.emergencyContacts.length > log.attemptNumber) {
          const nextContact = med.emergencyContacts[log.attemptNumber];
          const nextAttempt = log.attemptNumber + 1;

          const newCall = {
            id: "voice-log-" + crypto.randomUUID(),
            orgId: log.orgId,
            alertId: log.alertId,
            contactNumber: nextContact.phone,
            contactName: nextContact.name,
            attemptNumber: nextAttempt,
            method: "twilio" as const,
            status: "initiated" as const,
            initiatedAt: new Date().toISOString()
          };
          voiceLogs.push(newCall);

          alertEvents.push({
            id: "evt-" + crypto.randomUUID(),
            alertId: alert.id,
            type: "voice_call",
            message: `📞 Contact ${log.attemptNumber} (${log.contactName}) did not answer. Cascading escalation to Contact ${nextAttempt}: ${nextContact.name} (${nextContact.phone}).`,
            timestamp: new Date().toISOString()
          });
        } else {
          alertEvents.push({
            id: "evt-" + crypto.randomUUID(),
            alertId: alert.id,
            type: "voice_call",
            message: `🛑 Voice escalation chain completed. No further emergency contacts configured.`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } else if (status === "answered") {
      alertEvents.push({
        id: "evt-" + crypto.randomUUID(),
        alertId: log.alertId,
        type: "voice_call",
        message: `📞 Voice escalation ANSWERED by ${log.contactName}. Contact confirmed receipt of emergency coordinates.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(log);
  });

  // ==========================================
  // --- ENTERPRISE UPGRADE REST ENDPOINTS ---
  // ==========================================

  // --- INCIDENTS MANAGEMENT (Phase 6) ---
  app.get("/api/incidents", (req, res) => {
    const orgId = req.query.orgId as string;
    let filtered = incidents;
    if (orgId) {
      filtered = incidents.filter(i => i.organizationId === orgId);
    }
    // Sort latest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(filtered);
  });

  app.post("/api/incidents", (req, res) => {
    const { orgId, alertId, userName, userId, mode, status, notes, assignedResponderId, assignedResponderName } = req.body;
    const newIncident = {
      id: "inc-" + crypto.randomUUID(),
      organizationId: orgId || defaultOrgId,
      alertId: alertId || "manual-" + crypto.randomBytes(3).toString("hex"),
      userName: userName || "Unknown Member",
      userId: userId || "manual-user",
      mode: mode || "standard",
      status: status || "Open",
      createdAt: new Date().toISOString(),
      assignedResponderId,
      assignedResponderName,
      actionsTaken: ["Incident manually initialized in command centre"],
      notes: notes || "Manual incident dispatch.",
      gpsTrail: [],
      timeline: [{ message: "Incident record opened.", timestamp: new Date().toISOString() }]
    };
    incidents.push(newIncident);
    res.status(201).json(newIncident);
  });

  app.put("/api/incidents/:id", (req, res) => {
    const { id } = req.params;
    const { status, assignedResponderId, assignedResponderName, note, action, gpsUpdate } = req.body;

    const inc = incidents.find(i => i.id === id);
    if (!inc) {
      return res.status(404).json({ error: "Incident record not found." });
    }

    if (status) {
      inc.status = status;
      inc.timeline.push({
        message: `Status transitioned to ${status}.`,
        timestamp: new Date().toISOString()
      });
      // Log audit
      auditLogs.push({
        id: "audit-" + crypto.randomUUID(),
        organizationId: inc.organizationId,
        action: "INCIDENT_STATUS_CHANGE",
        category: "Alert",
        timestamp: new Date().toISOString(),
        details: `Incident ${inc.id.slice(0, 8)} transitioned to ${status}`,
        ipAddress: "196.25.1.50"
      });
    }

    if (assignedResponderId) {
      inc.assignedResponderId = assignedResponderId;
      inc.assignedResponderName = assignedResponderName || "Assigned Responder";
      inc.timeline.push({
        message: `Responder ${inc.assignedResponderName} dispatched to GPS trail coordinates.`,
        timestamp: new Date().toISOString()
      });
      inc.actionsTaken.push(`Responder ${inc.assignedResponderName} deployed`);
    }

    if (note) {
      inc.notes = (inc.notes ? inc.notes + " \n" : "") + note;
      inc.timeline.push({
        message: `Operator added dispatch logs: "${note}"`,
        timestamp: new Date().toISOString()
      });
    }

    if (action) {
      inc.actionsTaken.push(action);
      inc.timeline.push({
        message: `Action recorded: "${action}"`,
        timestamp: new Date().toISOString()
      });
    }

    if (gpsUpdate) {
      inc.gpsTrail.push({
        latitude: gpsUpdate.latitude,
        longitude: gpsUpdate.longitude,
        timestamp: new Date().toISOString()
      });
    }

    res.json(inc);
  });

  // --- SHIFT MANAGEMENT (Phase 7) ---
  app.get("/api/shifts", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(shifts.filter(s => s.organizationId === orgId));
    } else {
      res.json(shifts);
    }
  });

  app.post("/api/shifts", (req, res) => {
    const { userId, userName, role, organizationId, state, currentTask } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ error: "userId and userName are required to start shift" });
    }

    // Check if active shift already exists for this user
    const existing = shifts.find(s => s.userId === userId && !s.endedAt);
    if (existing) {
      return res.json(existing);
    }

    const newShift = {
      id: "shift-" + crypto.randomUUID(),
      organizationId: organizationId || defaultOrgId,
      userId,
      userName,
      role: role || "Responder",
      state: state || "Available",
      startedAt: new Date().toISOString(),
      currentTask: currentTask || "Patrol"
    };
    shifts.push(newShift);

    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: newShift.organizationId,
      userId,
      userName,
      action: "SHIFT_START",
      category: "Auth",
      timestamp: new Date().toISOString(),
      details: `${userName} (${role}) started active responder shift. Task: ${newShift.currentTask}`,
      ipAddress: "196.25.1.12"
    });

    res.status(201).json(newShift);
  });

  app.put("/api/shifts/:id", (req, res) => {
    const { id } = req.params;
    const { state, currentTask, endShift } = req.body;

    const shift = shifts.find(s => s.id === id);
    if (!shift) {
      return res.status(404).json({ error: "Shift record not found." });
    }

    if (endShift) {
      shift.endedAt = new Date().toISOString();
      shift.state = "Offline";
      auditLogs.push({
        id: "audit-" + crypto.randomUUID(),
        organizationId: shift.organizationId,
        userId: shift.userId,
        userName: shift.userName,
        action: "SHIFT_END",
        category: "Auth",
        timestamp: new Date().toISOString(),
        details: `${shift.userName} concluded responder shift. Duration calculated.`,
        ipAddress: "196.25.1.12"
      });
    } else {
      if (state) shift.state = state;
      if (currentTask) shift.currentTask = currentTask;
    }

    res.json(shift);
  });

  // --- GEOFENCING ENGINE (Phase 8) ---
  app.get("/api/geofences", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(geofences.filter(g => g.organizationId === orgId));
    } else {
      res.json(geofences);
    }
  });

  app.post("/api/geofences", (req, res) => {
    const { name, type, centerLat, centerLng, radiusMeters, orgId } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Missing geofence parameters" });
    }
    const newGeo = {
      id: "geo-" + crypto.randomUUID(),
      organizationId: orgId || defaultOrgId,
      name,
      type,
      centerLat: Number(centerLat),
      centerLng: Number(centerLng),
      radiusMeters: Number(radiusMeters) || 1000
    };
    geofences.push(newGeo);

    // Audit Log
    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: newGeo.organizationId,
      action: "GEOFENCE_CREATE",
      category: "Config",
      timestamp: new Date().toISOString(),
      details: `Created Geofence boundary [${newGeo.name}] - Type: ${newGeo.type} (${newGeo.radiusMeters}m radius)`,
      ipAddress: "196.25.3.1"
    });

    res.status(201).json(newGeo);
  });

  app.get("/api/geofences/alerts", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(geofenceAlerts.filter(g => g.organizationId === orgId));
    } else {
      res.json(geofenceAlerts);
    }
  });

  app.post("/api/geofences/alerts", (req, res) => {
    const { geofenceId, geofenceName, responderName, triggerType, message, orgId } = req.body;
    const newAlert = {
      id: "galt-" + crypto.randomUUID(),
      organizationId: orgId || defaultOrgId,
      geofenceId,
      geofenceName,
      responderName,
      triggerType,
      timestamp: new Date().toISOString(),
      message
    };
    geofenceAlerts.push(newAlert);

    // Also push to alertEvents for live visibility
    alertEvents.push({
      id: "evt-" + crypto.randomUUID(),
      alertId: "system-geofence",
      type: "geofence_breach",
      message: `🚷 [GEOFENCE BREACH] ${message}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newAlert);
  });

  // --- DEVICE HEARTBEAT ENGINE (Phase 4) ---
  app.get("/api/heartbeats", (req, res) => {
    const orgId = req.query.orgId as string;
    if (orgId) {
      res.json(heartbeats.filter(h => h.organizationId === orgId));
    } else {
      res.json(heartbeats);
    }
  });

  app.post("/api/heartbeats", (req, res) => {
    const { deviceId, batteryPercent, rssi, connectionStatus, latitude, longitude, orgId, userId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    // Update existing or create new
    let hb = heartbeats.find(h => h.deviceId === deviceId);
    if (!hb) {
      hb = {
        id: "hb-" + crypto.randomUUID(),
        deviceId,
        organizationId: orgId || defaultOrgId,
        userId: userId || "system",
        rssi: rssi || -70,
        batteryPercent: batteryPercent || 100,
        connectionStatus: connectionStatus || "Connected",
        latitude: latitude || -26.2041,
        longitude: longitude || 28.0473,
        lastSeen: new Date().toISOString()
      };
      heartbeats.push(hb);
    } else {
      hb.rssi = rssi || hb.rssi;
      hb.batteryPercent = batteryPercent || hb.batteryPercent;
      hb.connectionStatus = connectionStatus || hb.connectionStatus;
      hb.latitude = latitude || hb.latitude;
      hb.longitude = longitude || hb.longitude;
      hb.lastSeen = new Date().toISOString();
    }

    // Also sync back to hardwarePool connection state and battery
    const hw = hardwarePool.find(h => h.id === deviceId || h.deviceId === deviceId);
    if (hw) {
      hw.batteryLevel = hb.batteryPercent;
      hw.rssi = hb.rssi;
      hw.connectionState = (hb.connectionStatus === "Connected" || hb.connectionStatus === "Weak Signal") ? "connected" : "disconnected";
    }

    res.json(hb);
  });

  // --- SECURITY & AUDIT TRAIL LOGGING (Phase 11) ---
  app.get("/api/audit-logs", (req, res) => {
    const orgId = req.query.orgId as string;
    let filtered = auditLogs;
    if (orgId) {
      filtered = auditLogs.filter(a => a.organizationId === orgId);
    }
    // Sort latest first
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(filtered);
  });

  app.post("/api/audit-logs", (req, res) => {
    const { orgId, userId, userName, action, category, details } = req.body;
    const newLog = {
      id: "audit-" + crypto.randomUUID(),
      organizationId: orgId || defaultOrgId,
      userId,
      userName,
      action,
      category: category || "Config",
      timestamp: new Date().toISOString(),
      details: details || "System event occurred.",
      ipAddress: "196.25.1.1"
    };
    auditLogs.push(newLog);
    res.status(201).json(newLog);
  });

  // CSV Audit Export (Phase 11 Requirement)
  app.get("/api/audit-logs/export", (req, res) => {
    const orgId = req.query.orgId as string;
    let filtered = auditLogs;
    if (orgId) {
      filtered = auditLogs.filter(a => a.organizationId === orgId);
    }
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let csvContent = "ID,Timestamp,User,Action,Category,IP Address,Details\n";
    filtered.forEach(log => {
      csvContent += `"${log.id}","${log.timestamp}","${log.userName || 'System'}","${log.action}","${log.category}","${log.ipAddress || '127.0.0.1'}","${(log.details || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=safetylink-audit-trail.csv");
    res.status(200).send(csvContent);
  });

  // --- SUBSCRIPTION & LICENSING (Phase 12) ---
  app.get("/api/licensing/:orgId", (req, res) => {
    const { orgId } = req.params;
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Count statistics from state caches
    const activeUsers = users.filter(u => u.organizationId === orgId).length;
    const activeDevices = hardwarePool.filter(h => h.organizationId === orgId).length;
    const smsCount = smsLogs.filter(s => s.orgId === orgId).length;
    const whatsappCount = whatsappLogs.filter(w => w.orgId === orgId).length;
    const voiceCount = voiceLogs.filter(v => v.orgId === orgId).length;
    const storageEst = activeUsers * 12400 + activeDevices * 10240; // Simulated DB sizes

    // Plan limits mapping
    const planLimits = {
      Starter: { smsLimit: 100, waLimit: 50, voiceLimit: 25, devLimit: 10 },
      Professional: { smsLimit: 1000, waLimit: 500, voiceLimit: 250, devLimit: 100 },
      Enterprise: { smsLimit: 100000, waLimit: 50000, voiceLimit: 25000, devLimit: 1000 },
      Custom: { smsLimit: 9999999, waLimit: 9999999, voiceLimit: 9999999, devLimit: 99999 }
    };

    const currentPlan = (org.subscriptionPlan || "Enterprise") as "Starter" | "Professional" | "Enterprise" | "Custom";
    const limits = planLimits[currentPlan] || planLimits["Enterprise"];

    res.json({
      organizationId: orgId,
      name: org.name,
      plan: currentPlan,
      activeUsers,
      activeDevices,
      smsUsage: smsCount,
      smsLimit: limits.smsLimit,
      whatsappUsage: whatsappCount,
      whatsappLimit: limits.waLimit,
      voiceUsage: voiceCount,
      voiceLimit: limits.voiceLimit,
      storageUsageBytes: storageEst,
      monthlyActivityCount: smsCount + whatsappCount + voiceCount + alerts.length,
      expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0],
      licenseStatus: "Active",
      deviceLimit: limits.devLimit
    });
  });

  app.put("/api/licensing/:orgId", (req, res) => {
    const { orgId } = req.params;
    const { plan } = req.body;
    const org = organizations.find(o => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const oldPlan = org.subscriptionPlan;
    org.subscriptionPlan = plan;

    // Log administrative license upgrade (Phase 11)
    auditLogs.push({
      id: "audit-" + crypto.randomUUID(),
      organizationId: orgId,
      action: "LICENSE_PLAN_UPDATE",
      category: "License",
      timestamp: new Date().toISOString(),
      details: `Administrative license upgrade. Plan for ${org.name} changed from ${oldPlan} to ${plan}.`,
      ipAddress: "196.25.1.1"
    });

    res.json({ success: true, plan: org.subscriptionPlan });
  });

  // --- GEMINI INCIDENT REPORT ANALYSIS ENDPOINT ---
  app.post("/api/ai/analyze", async (req, res) => {
    const { alertId } = req.body;
    if (!alertId) {
      return res.status(400).json({ error: "alertId is required." });
    }

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    const events = alertEvents.filter(e => e.alertId === alertId);
    const user = users.find(u => u.id === alert.userId);
    const med = medicalProfiles[alert.userId];

    const incidentData = {
      incidentId: alert.id,
      triggerTime: alert.createdAt,
      status: alert.status,
      resolvedAt: alert.resolvedAt || "unresolved",
      resolvedBy: alert.resolvedBy || "N/A",
      member: {
        name: alert.userName,
        phone: user?.phone || "N/A",
        bloodType: med?.bloodType || "N/A",
        allergies: med?.allergies || "N/A",
        medications: med?.medications || "N/A"
      },
      events: events.map(e => `[${e.timestamp}] ${e.message}`)
    };

    const promptText = `
You are the Safety-Link Command Centre AI incident reviewer. Analyze the following emergency incident log and generate a professional incident debrief and analysis.
Format your output as clean, scannable Markdown.

Incident Details:
${JSON.stringify(incidentData, null, 2)}

Provide:
1. **Executive Summary**: A concise 2-sentence description of the event.
2. **Medical Risk Assessment**: Identify potential hazards or crucial steps based on the user's medical logs (blood type, allergies).
3. **Escalation Timeline Critique**: Evaluate the speed and effectiveness of the SMS, WhatsApp, and Voice calls.
4. **Actionable Recommendations**: Give 3 constructive steps the neighborhood watch/security operators can take to improve the response or prevent future issues.
`;

    const aiClient = getAI();

    if (!aiClient) {
      // Return simulated beautiful markdown report if API key is not configured
      const nearestCity = getClosestSouthAfricanCity(alert.latitude, alert.longitude);
      const simulatedReport = `
### 🚨 SAFETY-LINK SYSTEM INCIDENT ANALYSIS REPORT (SIMULATED)

**Incident ID**: \`${alertId.slice(0, 8)}\`
**Status**: **${alert.status.toUpperCase()}**
**Trigger Time**: ${new Date(alert.createdAt).toLocaleString()}

---

#### 1. Executive Summary
Emergency panic trigger registered for **${alert.userName}** in the **${nearestCity}** region. The system initiated an immediate multi-channel escalation chain, dispatching SMS, WhatsApp notifications, and queuing automated voice cascades to listed family contacts.

#### 2. Medical Risk Assessment
*   **Critical Blood Group**: ${incidentData.member.bloodType}
*   **Allergen Hazards**: ${incidentData.member.allergies || "None registered"}
*   **Active Medication**: ${incidentData.member.medications || "None registered"}
*   *Action Plan*: In the event of emergency ambulance response, operators must immediately pass this profile data directly to EMS personnel to avoid conflicting medication administration or allergic reactions.

#### 3. Escalation Timeline Critique
*   **Zero-Hour Broadcast**: Immediate WebSockets, push notifications, and SMS channels delivered alerts within 4 seconds.
*   **WhatsApp Dispatch**: Delivered to all listed family members.
*   **Voice Cascade**: Escalation delay functioned correctly. If the first contact fails to answer, the cascade continues to Contact 2 within 15 seconds.

#### 4. Actionable Operator Recommendations
1.  **Deploy Patrol Sector Unit**: Dispatch regional volunteer response vehicle to coordinates \`${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}\` immediately.
2.  **Verify Phone Line**: Attempt active callback to the member's device to verify if the panic trigger is accidental or ongoing.
3.  **Coordinate EMS Staging**: Keep ambulances on standby near the dispatch coordinates until patrol units verify the scene is safe for medical access.
`;
      return res.json({ analysis: simulatedReport });
    }

    try {
      console.log(`[AI] Dispatching incident analysis to Gemini...`);
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Failed to compile AI report: " + err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Safety-Link Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
