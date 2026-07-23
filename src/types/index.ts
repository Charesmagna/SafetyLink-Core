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
  moya?: { turnApiToken?: string; enabled?: boolean };
  twilio?: { accountSid: string; authToken: string; fromNumber: string };
  ntfy?: { topic: string; serverUrl: string };
  ownCloud?: { serverUrl: string; username: string; token: string; folder: string };
  sensorStream?: { udpHost: string; udpPort: number; enabled: boolean };
  personalControlRoom?: string;
  securityCompany?: string;
  customPresets?: Array<{ id: string; name: string; route: string; icon: string; }>;
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
  twilio?: { accountSid: string; authToken: string; fromNumber: string };
  ntfy?: { topic: string; serverUrl: string };
  ownCloud?: { serverUrl: string; username: string; token: string; folder: string };
  sensorStream?: { udpHost: string; udpPort: number; enabled: boolean };
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
  phone: string;
  template: string;
  channelType: 'CALL' | 'SMS' | 'WHATSAPP' | 'GROUP' | 'POLICE';
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
