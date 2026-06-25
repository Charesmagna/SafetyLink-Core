export interface Organization {
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

export interface User {
  id: string;
  organizationId: string | null;
  name: string;
  email: string;
  role: string; // Member, Responder, Supervisor, Admin, Owner
  status: "pending" | "approved" | "suspended";
  phone: string;
  bio?: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface MedicalProfile {
  userId: string;
  bloodType: string;
  allergies: string;
  medications: string;
  notes: string;
  emergencyContacts: Array<{ name: string; relationship: string; phone: string }>;
}

export interface HardwareDevice {
  id: string;
  organizationId: string;
  name: string;
  deviceId: string;
  assignedUserId: string | null;
  batteryLevel: number;
  connectionState: "connected" | "disconnected" | "scanning";
  rssi: number;
  mappedAction: "SOS" | "DRILL" | "CHECK_IN" | "CANCEL";
  createdAt: string;
}

export interface Alert {
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

export interface AlertEvent {
  id: string;
  alertId: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface SMSLog {
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

export interface WhatsAppLog {
  id: string;
  orgId: string;
  alertId: string;
  toNumber: string;
  status: "delivered" | "failed";
  messageId: string;
  sentAt: string;
}

export interface VoiceLog {
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

export type ViewTab = "simulator" | "command-centre" | "owner-dashboard" | "ble-simulator" | "integration-logs";
