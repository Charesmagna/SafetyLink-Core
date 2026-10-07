export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  avatarUrl?: string;
  email: string;
  orgCode: string;
  createdAt: number;
  accountNumber?: string;
  medicalInfo?: string;
  riskNotes?: string;
  assignedResponseOfficer?: string;
  preferredHospital?: string;
  homeAddress?: string;
  workAddress?: string;
  emergencyContactsList?: string;
  pendingOrgCode?: string;
  role?: UserRole;
  pendingRole?: UserRole;
  medicalProfile?: MedicalProfile;
  ntfy?: { topic: string; serverUrl: string };
  ownCloud?: { serverUrl: string; username: string; token: string; folder: string };
  sensorStream?: { udpHost: string; udpPort: number; enabled: boolean };
  personalControlRoom?: string;
  securityCompany?: string;
  customPresets?: Array<{ id: string; name: string; route: string; icon: string; }>;
  referredByCode?: string;
  fcmToken?: string;
  liveSmsEnabled?: boolean;
  subscriptionStatus?: 'active' | 'trial' | 'locked';
}

export type UserRole =
  | 'Community Member'
  | 'Guard'
  | 'Responder'
  | 'Dispatcher'
  | 'Control Room Operator'
  | 'Organization Administrator';

export const USER_ROLES: UserRole[] = [
  'Community Member',
  'Guard',
  'Responder',
  'Dispatcher',
  'Control Room Operator',
  'Organization Administrator',
];

export interface MedicalProfile {
  bloodGroup: string;
  allergies: string;
  medications: string;
  doctorName: string;
  doctorPhone: string;
  medicalAidName: string;
  medicalAidNumber: string;
  conditions: string;
  emergencyNotes: string;
  emergencyContacts: { name: string; phone: string; relation: string }[];
}

export type EmergencyProfileType =
  | 'Medical'
  | 'Hijacking'
  | 'Vehicle Accident'
  | 'Fire'
  | 'Domestic Violence'
  | 'Clock In'
  | 'Clock Out'
  | 'Guard Patrol'
  | 'Custom';

export interface EmergencyProfile {
  id: string;
  name: string;
  type: EmergencyProfileType;
  icon: string;
  color: string;
  smsRecipients: string[];
  pushRecipients: string[];
  callList: string[];
  whatsappRecipients: string[];
  includeGPS: boolean;
  notifyOrganization: boolean;
  silentMode: boolean;
  aiSummaryEnabled: boolean;
  customMessage?: string;
}

export interface SafetyModules {
  beacon: boolean;
  vision: boolean;
  dispatch: boolean;
  fleet: boolean;
  community: boolean;
  medical: boolean;
  guardianAI: boolean;
  vault: boolean;
  access: boolean;
}

export const DEFAULT_SAFETY_MODULES: SafetyModules = {
  beacon: true,
  vision: false,
  dispatch: false,
  fleet: false,
  community: false,
  medical: true,
  guardianAI: false,
  vault: true,
  access: false,
};

export const DEFAULT_EMERGENCY_PROFILES: EmergencyProfile[] = [
  { id: 'ep-medical',   name: 'Medical Emergency',  type: 'Medical',           icon: '🏥', color: '#ef4444', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: true  },
  { id: 'ep-hijack',    name: 'Hijacking',           type: 'Hijacking',         icon: '🚗', color: '#f97316', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: true,  aiSummaryEnabled: true  },
  { id: 'ep-accident',  name: 'Vehicle Accident',    type: 'Vehicle Accident',  icon: '💥', color: '#f59e0b', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: true  },
  { id: 'ep-fire',      name: 'Fire',                type: 'Fire',              icon: '🔥', color: '#dc2626', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: false },
  { id: 'ep-domestic',  name: 'Domestic Violence',   type: 'Domestic Violence', icon: '🛡️', color: '#7c3aed', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: true,  aiSummaryEnabled: false },
  { id: 'ep-clockin',   name: 'Clock In',            type: 'Clock In',          icon: '✅', color: '#10b981', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: false },
  { id: 'ep-clockout',  name: 'Clock Out',           type: 'Clock Out',         icon: '🔒', color: '#6b7280', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: false },
  { id: 'ep-patrol',    name: 'Guard Patrol',        type: 'Guard Patrol',      icon: '👮', color: '#3b82f6', smsRecipients: [], pushRecipients: [], callList: [], whatsappRecipients: [], includeGPS: true,  notifyOrganization: true,  silentMode: false, aiSummaryEnabled: false },
];

export interface Organization {
  id: string;
  name: string;
  code?: string;
  orgCode?: string;
  contactName: string;
  contactEmail: string;
  createdAt: number;
  approved?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  controlRoomNumber?: string;
  escalationPolicy?: string;
  monthlyAlerts?: number;
  falseAlarms?: number;
  averageResponseTimeSec?: number;
  ntfy?: { topic: string; serverUrl: string };
  ownCloud?: { serverUrl: string; username: string; token: string; folder: string };
  sensorStream?: { udpHost: string; udpPort: number; enabled: boolean };
  referralCode?: string;
  referralCount?: number;
  subscriptionStatus?: 'active' | 'trial' | 'locked';
}

export interface CustomTool {
  id: string;
  title: string;
  description: string;
  type: 'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET';
  targetValue: string;
  targetOrgId?: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  label: string;
  name?: string;
  phone: string;
  relation?: string;
  template?: string;
  channelType?: 'CALL' | 'SMS' | 'WHATSAPP' | 'GROUP' | 'POLICE';
  priority: number;
  triggerTypes?: EmergencyProfileType[];
}

export interface PanicEvent {
  id: string;
  status: 'IDLE' | 'ACQUIRING_GPS' | 'CAPTURING_EVIDENCE' | 'ESCALATING' | 'DISPATCHED' | 'RESOLVED' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lat: number;
  lng: number;
  timestamp: number;
  assignedResponder?: string;
  description: string;
  timelineData: string[];
  profileUsed?: string;
}

export interface MeshNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'SECURE' | 'ACTIVE' | 'DISPATCHED' | 'OFFLINE';
  type: 'PATROL' | 'SAFE_ZONE' | 'RESPONDER' | 'DRONE' | 'CAMERA';
  distance?: number;
  battery?: number;
}

export interface BleDevice {
  macAddress: string;
  friendlyName: string;
  deviceType: 'iTAG' | 'RFD_Beacon' | 'GENERIC_BLE_BUTTON' | 'WATCH' | 'CCTV';
  batteryLevel: number;
  rssi: number;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastSeen: number;
  triggerServiceUuid?: string;
  triggerCharacteristicUuid?: string;
  color?: string;
  icon?: string;
  lastTestResult?: 'PASS' | 'FAIL' | null;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  category: 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY';
  severity: 'INFO' | 'WARN' | 'SEVERE';
  message: string;
  details?: string;
}

export interface DispatchLogEntry {
  id: string;
  timestamp: number;
  channel: 'USSD' | 'SMS' | 'VOICE_CALL' | 'WHATSAPP' | 'TWILIO' | 'VAPI' | 'AFRICAS_TALKING' | 'NOTIFICATION_MINI_APP';
  target: string;
  status: 'QUEUED' | 'SENT' | 'INITIATED' | 'FAILED' | 'DELIVERED';
  unitId: string;
  incidentId?: string;
  coordinates?: { lat: number; lng: number };
  details?: string;
}

export interface NotificationPanelLogEntry {
  id: string;
  timestamp: number;
  action: 'SOS' | 'WATCH_ME' | 'BLE_STATUS' | 'SYNC' | 'CHECK_IN' | 'SOUND_LOCATION' | 'AI_LIZZIE';
  status: 'TRIGGERED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'COMPLETED';
  details: string;
  coordinates?: { lat: number; lng: number };
}

export interface DispatchSettings {
  countdownDuration: number;
  countdownOverlayEnabled: boolean;
  dispatchPreset: 'STRICT_OFFLINE' | 'VIP_TWILIO_CLOUD' | 'SMS_ONLY' | 'CUSTOM';
  mapProvider: 'GOOGLE_MAPS' | 'OPENSTREETMAP' | 'MAPBOX' | 'OFFLINE_GIS_VECTOR' | 'HYBRID_SATELLITE';
  customChannels?: string[];
}

export interface PlatformIntegration {
  id: string;
  platformId: 'twilio' | 'vapi' | 'africas_talking' | 'infobip' | 'bland_ai' | 'cloudinary' | 'payfast' | 'hardware_pcb' | 'custom_api';
  name: string;
  category: 'VOICE_SMS' | 'AI_ASSISTANT' | 'MEDIA' | 'PAYMENT' | 'HARDWARE';
  status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'DEPLOYED' | 'ERROR';
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string;
  phoneOrLine?: string;
  endpointUrl?: string;
  pcbSerial?: string;
  senderId?: string;
  deployedAt?: number;
  lastPingStatus?: string;
  configParams?: Record<string, string>;
}

export interface ClientDatabaseRecord {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  email: string;
  orgId: string;
  orgName: string;
  role: string;
  subscriptionTier: 'active' | 'trial' | 'locked';
  lastSeen: number;
  location?: { lat: number; lng: number; address?: string };
  hardwareBeaconId?: string;
  batteryLevel?: number;
  source: 'APP_USER' | 'SERVER_FETCH' | 'ADMIN_INSERT' | 'DRIVE_SYNC';
  extraFields?: Record<string, any>;
}

