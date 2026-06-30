export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  orgCode: string; // empty or matches Organization.id
  createdAt: number;
}

export interface Organization {
  id: string; // e.g. SL-ORG-XXXX
  name: string;
  contactName: string;
  contactEmail: string;
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
  deviceType: 'iTAG' | 'RFD_Beacon';
  batteryLevel: number;
  rssi: number;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastSeen: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  category: 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY';
  severity: 'INFO' | 'WARN' | 'SEVERE';
  message: string;
  details?: string;
}
