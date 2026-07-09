export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  avatarUrl?: string;
  email: string;
  orgCode: string; // empty or matches Organization.id
  createdAt: number;
  // Premium customer profile extensions for Security Operations
  accountNumber?: string;
  medicalInfo?: string;
  riskNotes?: string;
  assignedResponseOfficer?: string;
  preferredHospital?: string;
  homeAddress?: string;
  emergencyContactsList?: string; // custom contact numbers comma-separated
}

export interface Organization {
  id: string; // e.g. SL-ORG-XXXX
  name: string;
  contactName: string;
  contactEmail: string;
  createdAt: number;
  approved?: boolean; // pending approval if false
  // Professional branding and control room configurations
  logoUrl?: string;
  primaryColor?: string; // hex
  secondaryColor?: string; // hex
  controlRoomNumber?: string;
  escalationPolicy?: string;
  // Live analytics counters
  monthlyAlerts?: number;
  falseAlarms?: number;
  averageResponseTimeSec?: number;
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface CustomTool {
  id: string;
  title: string;
  description: string;
  type: 'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET';
  targetValue: string; // phone number, template message, or resource link
  targetOrgId?: string; // undefined means globally pushed by Super Admin
  createdAt: number;
}

export interface Contact {
  id: string;
  label: string;
  phone: string;
  template: string;
  channelType: 'CALL' | 'SMS' | 'WHATSAPP' | 'GROUP' | 'POLICE';
  priority: number;
}

export interface PanicEvent {
  id: string;
  status: 'IDLE' | 'ACQUIRING_GPS' | 'CAPTURING_EVIDENCE' | 'ESCALATING' | 'DISPATCHED' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lat: number;
  lng: number;
  timestamp: number;
  assignedResponder?: string;
  description: string;
  timelineData: string[];
}

export interface BleDevice {
  macAddress: string;
  friendlyName: string;
  deviceType: 'iTAG' | 'RFD_Beacon' | 'GENERIC_BLE_BUTTON';
  batteryLevel: number;
  rssi: number;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastSeen: number;
  /** GATT service/characteristic actually discovered to carry press
   *  notifications on THIS specific device -- not assumed from a vendor
   *  UUID, found live during the bonding wizard. Undefined until bound. */
  triggerServiceUuid?: string;
  triggerCharacteristicUuid?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  category: 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY';
  severity: 'INFO' | 'WARN' | 'SEVERE';
  message: string;
  details?: string;
}
