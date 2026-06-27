var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_crypto = __toESM(require("crypto"), 1);
var organizations = [];
var users = [];
var medicalProfiles = {};
var hardwarePool = [];
var alerts = [];
var alertEvents = [];
var smsLogs = [];
var whatsappLogs = [];
var voiceLogs = [];
var incidents = [];
var shifts = [];
var geofences = [];
var heartbeats = [];
var auditLogs = [];
var geofenceAlerts = [];
var defaultOrgId = "org-sa-tactical-01";
var seedOrg = {
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
  createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1e3).toISOString()
};
organizations.push(seedOrg);
var responderUser1 = {
  id: "user-resp-01",
  organizationId: defaultOrgId,
  name: "Officer Sipho Dlamini",
  email: "sipho@gptactical.co.za",
  role: "Responder",
  status: "approved",
  phone: "+27 82 555 0192",
  bio: "Senior Field Responder - Johannesburg North Sector",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var responderUser2 = {
  id: "user-resp-02",
  organizationId: defaultOrgId,
  name: "Officer Jaco Botha",
  email: "jaco@gptactical.co.za",
  role: "Responder",
  status: "approved",
  phone: "+27 71 555 4912",
  bio: "Tactical Canine Unit - Midrand Sector",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var supervisorUser = {
  id: "user-sup-01",
  organizationId: defaultOrgId,
  name: "Dispatcher Leandra Naidoo",
  email: "leandra@gptactical.co.za",
  role: "Supervisor",
  status: "approved",
  phone: "+27 68 007 9911",
  bio: "Lead Command Centre Controller",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var standardMember = {
  id: "user-member-01",
  organizationId: defaultOrgId,
  name: "Tshilidzi Mukwevho",
  email: "tshilidzi.mukwevho54@gmail.com",
  role: "Member",
  status: "approved",
  phone: "+27 82 999 8888",
  bio: "SafetyLink Lead Developer",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
users.push(responderUser1, responderUser2, supervisorUser, standardMember);
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
var iTagDevice = {
  id: "hw-itag-01",
  organizationId: defaultOrgId,
  name: "iTAG Wearable Wristband (v2.1)",
  deviceId: "FF:E0:45:90:AB:12",
  assignedUserId: standardMember.id,
  batteryLevel: 94,
  connectionState: "connected",
  rssi: -58,
  mappedAction: "SOS",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
var keyfobDevice = {
  id: "hw-keyfob-02",
  organizationId: defaultOrgId,
  name: "SirenLink Keyfob (v3.0)",
  deviceId: "FF:E0:11:22:33:44",
  assignedUserId: responderUser1.id,
  batteryLevel: 88,
  connectionState: "connected",
  rssi: -72,
  mappedAction: "DRILL",
  createdAt: (/* @__PURE__ */ new Date()).toISOString()
};
hardwarePool.push(iTagDevice, keyfobDevice);
shifts.push(
  {
    id: "shift-01",
    organizationId: defaultOrgId,
    userId: responderUser1.id,
    userName: responderUser1.name,
    role: "Responder",
    state: "Available",
    startedAt: new Date(Date.now() - 4 * 3600 * 1e3).toISOString(),
    currentTask: "Patrol"
  },
  {
    id: "shift-02",
    organizationId: defaultOrgId,
    userId: responderUser2.id,
    userName: responderUser2.name,
    role: "Responder",
    state: "Busy",
    startedAt: new Date(Date.now() - 3 * 3600 * 1e3).toISOString(),
    currentTask: "Emergency Response"
  },
  {
    id: "shift-03",
    organizationId: defaultOrgId,
    userId: supervisorUser.id,
    userName: supervisorUser.name,
    role: "Supervisor",
    state: "Online",
    startedAt: new Date(Date.now() - 5 * 3600 * 1e3).toISOString(),
    currentTask: "Monitoring"
  }
);
geofences.push(
  {
    id: "geo-01",
    organizationId: defaultOrgId,
    name: "Lenasia Community Patrol Sector",
    type: "Community Zone",
    centerLat: -26.3085,
    centerLng: 27.8344,
    radiusMeters: 5e3
  },
  {
    id: "geo-02",
    organizationId: defaultOrgId,
    name: "Sandton CBD Safe Zone",
    type: "Patrol Zone",
    centerLat: -26.1076,
    centerLng: 28.0567,
    radiusMeters: 3e3
  },
  {
    id: "geo-03",
    organizationId: defaultOrgId,
    name: "Mitchells Plain Watch Boundary",
    type: "Community Zone",
    centerLat: -34.0485,
    centerLng: 18.6052,
    radiusMeters: 4e3
  }
);
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
    lastSeen: (/* @__PURE__ */ new Date()).toISOString()
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
    lastSeen: new Date(Date.now() - 90 * 1e3).toISOString()
  }
);
auditLogs.push(
  {
    id: "audit-01",
    organizationId: defaultOrgId,
    userId: supervisorUser.id,
    userName: supervisorUser.name,
    action: "API_CREDENTIAL_CHANGE",
    category: "Config",
    timestamp: new Date(Date.now() - 2 * 3600 * 1e3).toISOString(),
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
    timestamp: new Date(Date.now() - 1 * 3600 * 1e3).toISOString(),
    details: "Assigned iTAG wristband FF:E0:45:90:AB:12 to lead emergency contact.",
    ipAddress: "196.25.255.45"
  }
);
var seedAlertId = "alt-seed-sos-01";
var seedAlert = {
  id: seedAlertId,
  organizationId: defaultOrgId,
  userId: standardMember.id,
  userName: standardMember.name,
  latitude: -26.3085,
  longitude: 27.8344,
  status: "escalated",
  createdAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
  medicalSummary: "Blood: O+ | Allergies: Penicillin, Sulfonamides"
};
alerts.push(seedAlert);
alertEvents.push(
  {
    id: "evt-seed-1",
    alertId: seedAlertId,
    type: "trigger",
    message: "SOS Emergency alarm initiated by Tshilidzi Mukwevho near Lenasia, GP",
    timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString()
  },
  {
    id: "evt-seed-2",
    alertId: seedAlertId,
    type: "sms_sent",
    message: "SMS Alert dispatched via Twilio to primary contacts.",
    timestamp: new Date(Date.now() - 29 * 60 * 1e3).toISOString()
  },
  {
    id: "evt-seed-3",
    alertId: seedAlertId,
    type: "voice_call",
    message: "Twilio voice call failed with No-Answer. Cascading down to backup responders.",
    timestamp: new Date(Date.now() - 28 * 60 * 1e3).toISOString()
  }
);
incidents.push({
  id: "inc-" + import_crypto.default.randomUUID(),
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
    { latitude: -26.3085, longitude: 27.8344, timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString() },
    { latitude: -26.308, longitude: 27.8342, timestamp: new Date(Date.now() - 25 * 60 * 1e3).toISOString() }
  ],
  timeline: [
    { message: "SOS Alert received from GPS mobile tracker.", timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString() },
    { message: "Twilio SMS dispatches sent to primary contact.", timestamp: new Date(Date.now() - 29 * 60 * 1e3).toISOString() },
    { message: "Escalation initiated. Shift Responder Sipho Dlamini assigned.", timestamp: new Date(Date.now() - 25 * 60 * 1e3).toISOString() }
  ]
});
function generateOrgCode(prefix = "SL") {
  const hex = import_crypto.default.randomBytes(2).toString("hex").toUpperCase();
  const suffix = import_crypto.default.randomBytes(1).toString("hex").toUpperCase();
  return `${prefix}-${hex}-${suffix}`;
}
function getClosestSouthAfricanCity(lat, lng) {
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
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  let ai = null;
  function getAI() {
    if (!ai) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.warn("GEMINI_API_KEY is not defined. AI analysis functions will return simulated responses.");
        return null;
      }
      ai = new import_genai.GoogleGenAI({ apiKey: key });
    }
    return ai;
  }
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
  app.post("/api/organizations", (req, res) => {
    const { name, subscriptionPlan } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Organization name is required." });
    }
    const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "SL";
    const code = generateOrgCode(prefix);
    const newOrg = {
      id: "org-" + import_crypto.default.randomUUID(),
      name,
      code,
      subscriptionPlan: subscriptionPlan || "Enterprise",
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    organizations.push(newOrg);
    console.log(`[AUDIT] Organization created: ${name} (${code})`);
    res.status(201).json(newOrg);
  });
  app.put("/api/organizations/:id/credentials", (req, res) => {
    const { id } = req.params;
    const { twilioSid, twilioToken, whatsappPhoneId, whatsappToken, voiceEscalationNumbers } = req.body;
    const org = organizations.find((o) => o.id === id);
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
    const org = organizations.find((o) => o.code.toUpperCase() === code.toUpperCase());
    if (!org) {
      return res.status(404).json({ error: "Invalid organization code. Please verify and try again." });
    }
    if (org.status === "suspended") {
      return res.status(403).json({ error: "This organization is currently suspended." });
    }
    res.json(org);
  });
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, phone, role, orgCode } = req.body;
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ error: "Missing required registration parameters." });
    }
    let orgId = null;
    if (role !== "Platform Owner") {
      if (!orgCode) {
        return res.status(400).json({ error: "Organization code is required for registration." });
      }
      const org = organizations.find((o) => o.code.toUpperCase() === orgCode.toUpperCase());
      if (!org) {
        return res.status(404).json({ error: "Organization code not found." });
      }
      orgId = org.id;
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "User with this email already exists." });
    }
    const newUser = {
      id: "usr-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      name,
      email,
      role,
      phone,
      status: role === "Platform Owner" ? "approved" : "pending",
      // Default standard users to pending as required
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    users.push(newUser);
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
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    if (user.status === "pending") {
      return res.status(403).json({ error: "Your account is pending administrator approval." });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ error: "Your account has been suspended." });
    }
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
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({
      user,
      medicalProfile: medicalProfiles[userId] || null
    });
  });
  app.get("/api/users", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(users.filter((u) => u.organizationId === orgId));
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
    const user = users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    user.status = status;
    console.log(`[AUDIT] User status changed for ${user.name} to ${status}`);
    res.json(user);
  });
  app.put("/api/users/:id/profile", (req, res) => {
    const { id } = req.params;
    const { name, phone, bio, profilePhoto } = req.body;
    const user = users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== void 0) user.bio = bio;
    if (profilePhoto !== void 0) user.profilePhoto = profilePhoto;
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
    if (bloodType !== void 0) med.bloodType = bloodType;
    if (allergies !== void 0) med.allergies = allergies;
    if (medications !== void 0) med.medications = medications;
    if (notes !== void 0) med.notes = notes;
    if (emergencyContacts !== void 0) med.emergencyContacts = emergencyContacts;
    res.json(med);
  });
  app.post("/api/alerts", (req, res) => {
    const { userId, latitude, longitude, clientGeneratedId } = req.body;
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing alert location parameters." });
    }
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Alert user not found." });
    }
    const orgId = user.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: "User must belong to an organization to trigger an alert." });
    }
    const existingAlert = clientGeneratedId ? alerts.find((a) => a.id === clientGeneratedId) : null;
    if (existingAlert) {
      return res.json(existingAlert);
    }
    const med = medicalProfiles[userId];
    const medicalSummary = med ? `Blood: ${med.bloodType} | Allergies: ${med.allergies || "None"} | Meds: ${med.medications || "None"} | Contacts Count: ${med.emergencyContacts?.length || 0}` : "No medical information configured.";
    const newAlert = {
      id: clientGeneratedId || "alt-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      userId,
      userName: user.name,
      latitude,
      longitude,
      status: "active",
      medicalSummary,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    alerts.push(newAlert);
    const org = organizations.find((o) => o.id === orgId);
    const twilioGate = org?.twilioSid ? `Custom Org SID [${org.twilioSid.slice(0, 8)}...]` : "System Default Gate";
    const waGate = org?.whatsappPhoneId ? `Custom Meta ID [${org.whatsappPhoneId}]` : "System Default Meta API";
    alertEvents.push({
      id: "evt-" + import_crypto.default.randomUUID(),
      alertId: newAlert.id,
      type: "trigger",
      message: `SOS Emergency alarm initiated by ${user.name} at coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Multi-Tenant Isolation Code: ${org?.code || "DEFAULT"}.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const timestampStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      med.emergencyContacts.forEach((contact, idx) => {
        const waMsgId = "wa-sim-" + import_crypto.default.randomBytes(4).toString("hex");
        whatsappLogs.push({
          id: "wa-log-" + import_crypto.default.randomUUID(),
          orgId,
          alertId: newAlert.id,
          toNumber: contact.phone,
          status: "delivered",
          messageId: waMsgId,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        alertEvents.push({
          id: "evt-" + import_crypto.default.randomUUID(),
          alertId: newAlert.id,
          type: "whatsapp_sent",
          message: `\u{1F6A8} WhatsApp Alert dispatched via ${waGate} to ${contact.name} (${contact.phone}): "SAFETY-LINK: Member ${user.name} triggered SOS. Location: https://maps.google.com/?q=${latitude},${longitude}"`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    }
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      med.emergencyContacts.forEach((contact, idx) => {
        const smsMsgId = "sms-sim-" + import_crypto.default.randomBytes(4).toString("hex");
        smsLogs.push({
          id: "sms-log-" + import_crypto.default.randomUUID(),
          orgId,
          alertId: newAlert.id,
          toNumber: contact.phone,
          provider: "Twilio",
          status: "delivered",
          messageId: smsMsgId,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        alertEvents.push({
          id: "evt-" + import_crypto.default.randomUUID(),
          alertId: newAlert.id,
          type: "sms_sent",
          message: `\u{1F4AC} SMS Alert dispatched via ${twilioGate} to ${contact.name} (${contact.phone}): "Safety-Link Alert! ${user.name} needs help at ${latitude.toFixed(4)},${longitude.toFixed(4)}"`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    }
    if (med && med.emergencyContacts && med.emergencyContacts.length > 0) {
      const primaryContact = med.emergencyContacts[0];
      voiceLogs.push({
        id: "voice-log-" + import_crypto.default.randomUUID(),
        orgId,
        alertId: newAlert.id,
        contactNumber: primaryContact.phone,
        contactName: primaryContact.name,
        attemptNumber: 1,
        method: "twilio",
        status: "initiated",
        initiatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      alertEvents.push({
        id: "evt-" + import_crypto.default.randomUUID(),
        alertId: newAlert.id,
        type: "voice_call",
        message: `\u{1F4DE} Twilio Automated Voice escalation initiated for ${primaryContact.name} (${primaryContact.phone}). TwiML: Reading out emergency alarm.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      alertEvents.push({
        id: "evt-" + import_crypto.default.randomUUID(),
        alertId: newAlert.id,
        type: "voice_call",
        message: `\u26A0\uFE0F No emergency contacts available for voice escalation. Mobile client will prompt direct phone fallback.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const orgResponders = users.filter((u) => u.organizationId === orgId && ["Responder", "Supervisor", "Admin"].includes(u.role));
    if (orgResponders.length > 0) {
      const nearestCity = getClosestSouthAfricanCity(latitude, longitude);
      alertEvents.push({
        id: "evt-" + import_crypto.default.randomUUID(),
        alertId: newAlert.id,
        type: "fcm_broadcast",
        message: `\u{1F4F1} FCM Alert dispatched to ${orgResponders.length} active responders: "${user.name} triggered SOS near ${nearestCity}"`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    console.log(`[AUDIT] Emergency SOS Triggered! Alert: ${newAlert.id}, User: ${user.name}`);
    const assignedResp = shifts.find((s) => s.state === "Available" && s.role === "Responder");
    const newIncident = {
      id: "inc-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      alertId: newAlert.id,
      userName: user.name,
      userId,
      mode: req.body.mode || "standard",
      status: "Open",
      createdAt: newAlert.createdAt,
      assignedResponderId: assignedResp ? assignedResp.userId : void 0,
      assignedResponderName: assignedResp ? assignedResp.userName : void 0,
      actionsTaken: ["Alert received by automated gateway"],
      notes: req.body.notes || "SOS alert triggered via device interface.",
      gpsTrail: [{ latitude, longitude, timestamp: (/* @__PURE__ */ new Date()).toISOString() }],
      timeline: [
        { message: "SOS alert triggered. Emergency channels activated.", timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      ]
    };
    incidents.push(newIncident);
    if (assignedResp) {
      assignedResp.state = "Responding";
      assignedResp.currentTask = "Emergency Response";
    }
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      userId,
      userName: user.name,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `SOS Alarm triggered. Incident ${newIncident.id.slice(0, 8)} created for ${user.name} (${user.role}). Mode: ${newIncident.mode.toUpperCase()}`,
      ipAddress: "196.25.2.21"
    });
    res.status(201).json({
      alert: newAlert,
      events: alertEvents.filter((e) => e.alertId === newAlert.id),
      incident: newIncident
    });
  });
  app.get("/api/alerts", (req, res) => {
    const orgId = req.query.orgId;
    let filteredAlerts = alerts;
    if (orgId) {
      filteredAlerts = alerts.filter((a) => a.organizationId === orgId);
    }
    filteredAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(filteredAlerts);
  });
  app.get("/api/alerts/:id/events", (req, res) => {
    const { id } = req.params;
    const events = alertEvents.filter((e) => e.alertId === id);
    res.json(events);
  });
  app.put("/api/alerts/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { resolvedBy } = req.body;
    const alert = alerts.find((a) => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }
    alert.status = "resolved";
    alert.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    alert.resolvedBy = resolvedBy || "Operator Control";
    const incident = incidents.find((i) => i.alertId === id);
    if (incident) {
      incident.status = "Resolved";
      incident.resolvedAt = alert.resolvedAt;
      incident.actionsTaken.push(`Marked Resolved by ${alert.resolvedBy}`);
      incident.timeline.push({
        message: `\u2705 Incident resolved by ${alert.resolvedBy}. Operations successfully closed.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    alertEvents.push({
      id: "evt-" + import_crypto.default.randomUUID(),
      alertId: id,
      type: "resolved",
      message: `\u2705 Alert marked RESOLVED by ${alert.resolvedBy}. Response operations closed.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: alert.organizationId,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Alert ${alert.id.slice(0, 8)} successfully resolved by ${alert.resolvedBy}. Operations concluded.`,
      ipAddress: "196.25.2.22"
    });
    console.log(`[AUDIT] Alert ${id} resolved by ${alert.resolvedBy}`);
    res.json(alert);
  });
  app.put("/api/alerts/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, operatorMessage } = req.body;
    if (!["active", "escalated", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    const alert = alerts.find((a) => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }
    alert.status = status;
    const incident = incidents.find((i) => i.alertId === id);
    if (incident) {
      if (status === "escalated") {
        incident.status = "Escalated";
      } else if (status === "active") {
        incident.status = "Acknowledged";
      } else if (status === "resolved") {
        incident.status = "Resolved";
        incident.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (operatorMessage) {
        incident.notes += ` | Operator Note: ${operatorMessage}`;
      }
      incident.timeline.push({
        message: `\u{1F6A8} Incident status changed to ${incident.status} by Command Centre operator.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    alertEvents.push({
      id: "evt-" + import_crypto.default.randomUUID(),
      alertId: id,
      type: "status_changed",
      message: `\u{1F6A8} Alert status updated to ${status.toUpperCase()}. Operator note: "${operatorMessage || "No notes added"}"`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: alert.organizationId,
      action: "ALERT_STATUS_CHANGE",
      category: "Alert",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Alert ${alert.id.slice(0, 8)} status set to ${status.toUpperCase()}. Note: ${operatorMessage || "None"}`,
      ipAddress: "196.25.2.22"
    });
    console.log(`[AUDIT] Alert ${id} status set to ${status}`);
    res.json(alert);
  });
  app.get("/api/hardware", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(hardwarePool.filter((h) => h.organizationId === orgId));
    } else {
      res.json(hardwarePool);
    }
  });
  app.post("/api/hardware", (req, res) => {
    const { name, deviceId, orgId } = req.body;
    if (!name || !deviceId || !orgId) {
      return res.status(400).json({ error: "Missing hardware name, MAC address, or organization ID." });
    }
    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Target organization not found." });
    }
    if (hardwarePool.some((h) => h.deviceId.toLowerCase() === deviceId.toLowerCase())) {
      return res.status(400).json({ error: "This physical BLE button MAC address is already registered in the system." });
    }
    const newDevice = {
      id: "hw-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      name,
      deviceId,
      assignedUserId: null,
      batteryLevel: 100,
      connectionState: "disconnected",
      rssi: -75,
      mappedAction: "SOS",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    hardwarePool.push(newDevice);
    console.log(`[AUDIT] BLE Device registered in Pool: ${name} (${deviceId})`);
    res.status(201).json(newDevice);
  });
  app.post("/api/hardware/assign", (req, res) => {
    const { deviceId, userId } = req.body;
    const device = hardwarePool.find((h) => h.id === deviceId);
    if (!device) {
      return res.status(404).json({ error: "Hardware device not found." });
    }
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    hardwarePool.forEach((h) => {
      if (h.assignedUserId === userId) h.assignedUserId = null;
    });
    device.assignedUserId = userId;
    console.log(`[AUDIT] Hardware ${device.name} assigned to user ${user.name}`);
    res.json(device);
  });
  app.post("/api/hardware/unassign", (req, res) => {
    const { deviceId } = req.body;
    const device = hardwarePool.find((h) => h.id === deviceId);
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
    const idx = hardwarePool.findIndex((h) => h.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Device not found." });
    }
    const dev = hardwarePool[idx];
    hardwarePool.splice(idx, 1);
    console.log(`[AUDIT] Hardware ${dev.name} removed from registry`);
    res.json({ success: true, message: "Device removed." });
  });
  app.get("/api/logs/sms", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(smsLogs.filter((l) => l.orgId === orgId));
    } else {
      res.json(smsLogs);
    }
  });
  app.get("/api/logs/whatsapp", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(whatsappLogs.filter((l) => l.orgId === orgId));
    } else {
      res.json(whatsappLogs);
    }
  });
  app.get("/api/logs/voice", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(voiceLogs.filter((l) => l.orgId === orgId));
    } else {
      res.json(voiceLogs);
    }
  });
  app.put("/api/logs/voice/:id", (req, res) => {
    const { id } = req.params;
    const { status, errorMessage } = req.body;
    const log = voiceLogs.find((l) => l.id === id);
    if (!log) {
      return res.status(404).json({ error: "Voice log not found" });
    }
    log.status = status;
    if (errorMessage) log.errorMessage = errorMessage;
    if (["no-answer", "busy"].includes(status)) {
      const alert = alerts.find((a) => a.id === log.alertId);
      if (alert) {
        const med = medicalProfiles[alert.userId];
        if (med && med.emergencyContacts && med.emergencyContacts.length > log.attemptNumber) {
          const nextContact = med.emergencyContacts[log.attemptNumber];
          const nextAttempt = log.attemptNumber + 1;
          const newCall = {
            id: "voice-log-" + import_crypto.default.randomUUID(),
            orgId: log.orgId,
            alertId: log.alertId,
            contactNumber: nextContact.phone,
            contactName: nextContact.name,
            attemptNumber: nextAttempt,
            method: "twilio",
            status: "initiated",
            initiatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          voiceLogs.push(newCall);
          alertEvents.push({
            id: "evt-" + import_crypto.default.randomUUID(),
            alertId: alert.id,
            type: "voice_call",
            message: `\u{1F4DE} Contact ${log.attemptNumber} (${log.contactName}) did not answer. Cascading escalation to Contact ${nextAttempt}: ${nextContact.name} (${nextContact.phone}).`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        } else {
          alertEvents.push({
            id: "evt-" + import_crypto.default.randomUUID(),
            alertId: alert.id,
            type: "voice_call",
            message: `\u{1F6D1} Voice escalation chain completed. No further emergency contacts configured.`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
    } else if (status === "answered") {
      alertEvents.push({
        id: "evt-" + import_crypto.default.randomUUID(),
        alertId: log.alertId,
        type: "voice_call",
        message: `\u{1F4DE} Voice escalation ANSWERED by ${log.contactName}. Contact confirmed receipt of emergency coordinates.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json(log);
  });
  app.get("/api/incidents", (req, res) => {
    const orgId = req.query.orgId;
    let filtered = incidents;
    if (orgId) {
      filtered = incidents.filter((i) => i.organizationId === orgId);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(filtered);
  });
  app.post("/api/incidents", (req, res) => {
    const { orgId, alertId, userName, userId, mode, status, notes, assignedResponderId, assignedResponderName } = req.body;
    const newIncident = {
      id: "inc-" + import_crypto.default.randomUUID(),
      organizationId: orgId || defaultOrgId,
      alertId: alertId || "manual-" + import_crypto.default.randomBytes(3).toString("hex"),
      userName: userName || "Unknown Member",
      userId: userId || "manual-user",
      mode: mode || "standard",
      status: status || "Open",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      assignedResponderId,
      assignedResponderName,
      actionsTaken: ["Incident manually initialized in command centre"],
      notes: notes || "Manual incident dispatch.",
      gpsTrail: [],
      timeline: [{ message: "Incident record opened.", timestamp: (/* @__PURE__ */ new Date()).toISOString() }]
    };
    incidents.push(newIncident);
    res.status(201).json(newIncident);
  });
  app.put("/api/incidents/:id", (req, res) => {
    const { id } = req.params;
    const { status, assignedResponderId, assignedResponderName, note, action, gpsUpdate } = req.body;
    const inc = incidents.find((i) => i.id === id);
    if (!inc) {
      return res.status(404).json({ error: "Incident record not found." });
    }
    if (status) {
      inc.status = status;
      inc.timeline.push({
        message: `Status transitioned to ${status}.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      auditLogs.push({
        id: "audit-" + import_crypto.default.randomUUID(),
        organizationId: inc.organizationId,
        action: "INCIDENT_STATUS_CHANGE",
        category: "Alert",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        details: `Incident ${inc.id.slice(0, 8)} transitioned to ${status}`,
        ipAddress: "196.25.1.50"
      });
    }
    if (assignedResponderId) {
      inc.assignedResponderId = assignedResponderId;
      inc.assignedResponderName = assignedResponderName || "Assigned Responder";
      inc.timeline.push({
        message: `Responder ${inc.assignedResponderName} dispatched to GPS trail coordinates.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      inc.actionsTaken.push(`Responder ${inc.assignedResponderName} deployed`);
    }
    if (note) {
      inc.notes = (inc.notes ? inc.notes + " \n" : "") + note;
      inc.timeline.push({
        message: `Operator added dispatch logs: "${note}"`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (action) {
      inc.actionsTaken.push(action);
      inc.timeline.push({
        message: `Action recorded: "${action}"`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (gpsUpdate) {
      inc.gpsTrail.push({
        latitude: gpsUpdate.latitude,
        longitude: gpsUpdate.longitude,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json(inc);
  });
  app.get("/api/shifts", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(shifts.filter((s) => s.organizationId === orgId));
    } else {
      res.json(shifts);
    }
  });
  app.post("/api/shifts", (req, res) => {
    const { userId, userName, role, organizationId, state, currentTask } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ error: "userId and userName are required to start shift" });
    }
    const existing = shifts.find((s) => s.userId === userId && !s.endedAt);
    if (existing) {
      return res.json(existing);
    }
    const newShift = {
      id: "shift-" + import_crypto.default.randomUUID(),
      organizationId: organizationId || defaultOrgId,
      userId,
      userName,
      role: role || "Responder",
      state: state || "Available",
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      currentTask: currentTask || "Patrol"
    };
    shifts.push(newShift);
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: newShift.organizationId,
      userId,
      userName,
      action: "SHIFT_START",
      category: "Auth",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `${userName} (${role}) started active responder shift. Task: ${newShift.currentTask}`,
      ipAddress: "196.25.1.12"
    });
    res.status(201).json(newShift);
  });
  app.put("/api/shifts/:id", (req, res) => {
    const { id } = req.params;
    const { state, currentTask, endShift } = req.body;
    const shift = shifts.find((s) => s.id === id);
    if (!shift) {
      return res.status(404).json({ error: "Shift record not found." });
    }
    if (endShift) {
      shift.endedAt = (/* @__PURE__ */ new Date()).toISOString();
      shift.state = "Offline";
      auditLogs.push({
        id: "audit-" + import_crypto.default.randomUUID(),
        organizationId: shift.organizationId,
        userId: shift.userId,
        userName: shift.userName,
        action: "SHIFT_END",
        category: "Auth",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        details: `${shift.userName} concluded responder shift. Duration calculated.`,
        ipAddress: "196.25.1.12"
      });
    } else {
      if (state) shift.state = state;
      if (currentTask) shift.currentTask = currentTask;
    }
    res.json(shift);
  });
  app.get("/api/geofences", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(geofences.filter((g) => g.organizationId === orgId));
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
      id: "geo-" + import_crypto.default.randomUUID(),
      organizationId: orgId || defaultOrgId,
      name,
      type,
      centerLat: Number(centerLat),
      centerLng: Number(centerLng),
      radiusMeters: Number(radiusMeters) || 1e3
    };
    geofences.push(newGeo);
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: newGeo.organizationId,
      action: "GEOFENCE_CREATE",
      category: "Config",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Created Geofence boundary [${newGeo.name}] - Type: ${newGeo.type} (${newGeo.radiusMeters}m radius)`,
      ipAddress: "196.25.3.1"
    });
    res.status(201).json(newGeo);
  });
  app.get("/api/geofences/alerts", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(geofenceAlerts.filter((g) => g.organizationId === orgId));
    } else {
      res.json(geofenceAlerts);
    }
  });
  app.post("/api/geofences/alerts", (req, res) => {
    const { geofenceId, geofenceName, responderName, triggerType, message, orgId } = req.body;
    const newAlert = {
      id: "galt-" + import_crypto.default.randomUUID(),
      organizationId: orgId || defaultOrgId,
      geofenceId,
      geofenceName,
      responderName,
      triggerType,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message
    };
    geofenceAlerts.push(newAlert);
    alertEvents.push({
      id: "evt-" + import_crypto.default.randomUUID(),
      alertId: "system-geofence",
      type: "geofence_breach",
      message: `\u{1F6B7} [GEOFENCE BREACH] ${message}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.status(201).json(newAlert);
  });
  app.get("/api/heartbeats", (req, res) => {
    const orgId = req.query.orgId;
    if (orgId) {
      res.json(heartbeats.filter((h) => h.organizationId === orgId));
    } else {
      res.json(heartbeats);
    }
  });
  app.post("/api/heartbeats", (req, res) => {
    const { deviceId, batteryPercent, rssi, connectionStatus, latitude, longitude, orgId, userId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });
    let hb = heartbeats.find((h) => h.deviceId === deviceId);
    if (!hb) {
      hb = {
        id: "hb-" + import_crypto.default.randomUUID(),
        deviceId,
        organizationId: orgId || defaultOrgId,
        userId: userId || "system",
        rssi: rssi || -70,
        batteryPercent: batteryPercent || 100,
        connectionStatus: connectionStatus || "Connected",
        latitude: latitude || -26.2041,
        longitude: longitude || 28.0473,
        lastSeen: (/* @__PURE__ */ new Date()).toISOString()
      };
      heartbeats.push(hb);
    } else {
      hb.rssi = rssi || hb.rssi;
      hb.batteryPercent = batteryPercent || hb.batteryPercent;
      hb.connectionStatus = connectionStatus || hb.connectionStatus;
      hb.latitude = latitude || hb.latitude;
      hb.longitude = longitude || hb.longitude;
      hb.lastSeen = (/* @__PURE__ */ new Date()).toISOString();
    }
    const hw = hardwarePool.find((h) => h.id === deviceId || h.deviceId === deviceId);
    if (hw) {
      hw.batteryLevel = hb.batteryPercent;
      hw.rssi = hb.rssi;
      hw.connectionState = hb.connectionStatus === "Connected" || hb.connectionStatus === "Weak Signal" ? "connected" : "disconnected";
    }
    res.json(hb);
  });
  app.get("/api/audit-logs", (req, res) => {
    const orgId = req.query.orgId;
    let filtered = auditLogs;
    if (orgId) {
      filtered = auditLogs.filter((a) => a.organizationId === orgId);
    }
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(filtered);
  });
  app.post("/api/audit-logs", (req, res) => {
    const { orgId, userId, userName, action, category, details } = req.body;
    const newLog = {
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: orgId || defaultOrgId,
      userId,
      userName,
      action,
      category: category || "Config",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: details || "System event occurred.",
      ipAddress: "196.25.1.1"
    };
    auditLogs.push(newLog);
    res.status(201).json(newLog);
  });
  app.get("/api/audit-logs/export", (req, res) => {
    const orgId = req.query.orgId;
    let filtered = auditLogs;
    if (orgId) {
      filtered = auditLogs.filter((a) => a.organizationId === orgId);
    }
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    let csvContent = "ID,Timestamp,User,Action,Category,IP Address,Details\n";
    filtered.forEach((log) => {
      csvContent += `"${log.id}","${log.timestamp}","${log.userName || "System"}","${log.action}","${log.category}","${log.ipAddress || "127.0.0.1"}","${(log.details || "").replace(/"/g, '""')}"
`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=safetylink-audit-trail.csv");
    res.status(200).send(csvContent);
  });
  app.get("/api/licensing/:orgId", (req, res) => {
    const { orgId } = req.params;
    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }
    const activeUsers = users.filter((u) => u.organizationId === orgId).length;
    const activeDevices = hardwarePool.filter((h) => h.organizationId === orgId).length;
    const smsCount = smsLogs.filter((s) => s.orgId === orgId).length;
    const whatsappCount = whatsappLogs.filter((w) => w.orgId === orgId).length;
    const voiceCount = voiceLogs.filter((v) => v.orgId === orgId).length;
    const storageEst = activeUsers * 12400 + activeDevices * 10240;
    const planLimits = {
      Starter: { smsLimit: 100, waLimit: 50, voiceLimit: 25, devLimit: 10 },
      Professional: { smsLimit: 1e3, waLimit: 500, voiceLimit: 250, devLimit: 100 },
      Enterprise: { smsLimit: 1e5, waLimit: 5e4, voiceLimit: 25e3, devLimit: 1e3 },
      Custom: { smsLimit: 9999999, waLimit: 9999999, voiceLimit: 9999999, devLimit: 99999 }
    };
    const currentPlan = org.subscriptionPlan || "Enterprise";
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
      expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1e3).toISOString().split("T")[0],
      licenseStatus: "Active",
      deviceLimit: limits.devLimit
    });
  });
  app.put("/api/licensing/:orgId", (req, res) => {
    const { orgId } = req.params;
    const { plan } = req.body;
    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }
    const oldPlan = org.subscriptionPlan;
    org.subscriptionPlan = plan;
    auditLogs.push({
      id: "audit-" + import_crypto.default.randomUUID(),
      organizationId: orgId,
      action: "LICENSE_PLAN_UPDATE",
      category: "License",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Administrative license upgrade. Plan for ${org.name} changed from ${oldPlan} to ${plan}.`,
      ipAddress: "196.25.1.1"
    });
    res.json({ success: true, plan: org.subscriptionPlan });
  });
  app.post("/api/ai/analyze", async (req, res) => {
    const { alertId } = req.body;
    if (!alertId) {
      return res.status(400).json({ error: "alertId is required." });
    }
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found." });
    }
    const events = alertEvents.filter((e) => e.alertId === alertId);
    const user = users.find((u) => u.id === alert.userId);
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
      events: events.map((e) => `[${e.timestamp}] ${e.message}`)
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
      const nearestCity = getClosestSouthAfricanCity(alert.latitude, alert.longitude);
      const simulatedReport = `
### \u{1F6A8} SAFETY-LINK SYSTEM INCIDENT ANALYSIS REPORT (SIMULATED)

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
        contents: promptText
      });
      res.json({ analysis: response.text });
    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Failed to compile AI report: " + err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Safety-Link Full-Stack Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
