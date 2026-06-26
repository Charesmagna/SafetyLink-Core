// SafetyLink Enterprise Types (Phases 1 - 15)

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  restricted: boolean;
  name: string;
  key: "gps" | "backgroundGps" | "bluetooth" | "notification" | "call" | "battery" | "foregroundService" | "alarm";
  description: string;
}

export interface DeviceHeartbeat {
  id: string;
  deviceId: string;
  organizationId: string;
  userId: string;
  rssi: number;
  batteryPercent: number;
  connectionStatus: "Connected" | "Weak Signal" | "Out of Range" | "Offline" | "Fault";
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export type SOSMode = 
  | "standard" 
  | "silent" 
  | "medical" 
  | "fire" 
  | "tactical" 
  | "welfare";

export interface SOSConfig {
  mode: SOSMode;
  label: string;
  icon: string;
  escalationSteps: string[];
  template: string;
  analyticsCategory: string;
  color: string;
}

export type IncidentStatus = 
  | "Open" 
  | "Acknowledged" 
  | "Responder Assigned" 
  | "Responding" 
  | "Escalated" 
  | "Resolved" 
  | "Closed";

export interface IncidentAuditRecord {
  id: string;
  incidentId: string;
  status: IncidentStatus;
  changedBy: string;
  message: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  alertId: string;
  userName: string;
  userId: string;
  mode: SOSMode;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt?: string;
  assignedResponderId?: string;
  assignedResponderName?: string;
  actionsTaken: string[];
  notes: string;
  gpsTrail: Array<{ latitude: number; longitude: number; timestamp: string }>;
  timeline: Array<{ message: string; timestamp: string }>;
}

export type ResponderState = 
  | "Available" 
  | "Busy" 
  | "Responding" 
  | "Offline" 
  | "Off Duty";

export type SupervisorState = 
  | "Online" 
  | "Monitoring" 
  | "Unavailable";

export interface Shift {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  role: "Responder" | "Supervisor";
  state: ResponderState | SupervisorState;
  startedAt: string;
  endedAt?: string;
  currentTask: "Patrol" | "Break" | "Emergency Response" | "Monitoring" | "Idle";
}

export interface Geofence {
  id: string;
  organizationId: string;
  name: string;
  type: "Patrol Zone" | "Estate" | "School" | "Community Zone" | "Restricted";
  centerLat: number;
  centerLng: number;
  radiusMeters: number; // in meters
}

export interface GeofenceAlert {
  id: string;
  organizationId: string;
  geofenceId: string;
  geofenceName: string;
  responderName: string;
  triggerType: "exit" | "enter" | "unexpected_movement";
  timestamp: string;
  message: string;
}

export interface OfflineQueueItem {
  id: string;
  type: "alert" | "gps_update" | "hardware_event";
  payload: any;
  retryCount: number;
  queuedAt: string;
  status: "pending" | "failed";
}

export interface PushNotificationChannelSettings {
  channelId: string;
  name: string;
  enabled: boolean;
  sound: "default" | "siren" | "chime" | "silent";
  vibration: boolean;
  priority: "high" | "default" | "low";
  silentModeOverride: boolean;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userName?: string;
  action: string;
  category: "Auth" | "Hardware" | "Config" | "Alert" | "License";
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface LicensingMetrics {
  organizationId: string;
  plan: "Starter" | "Professional" | "Enterprise" | "Custom";
  activeUsers: number;
  activeDevices: number;
  smsUsage: number;
  whatsappUsage: number;
  voiceUsage: number;
  storageUsageBytes: number;
  monthlyActivityCount: number;
  expiryDate: string;
  licenseStatus: "Active" | "Expired" | "Suspended" | "Trial";
}
