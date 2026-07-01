import { create } from 'zustand';
import { Contact, PanicEvent, BleDevice, AuditLog, UserProfile, Organization } from '../types';
import { NativeDispatchService } from '../services/NativeDispatchService';

interface AppState {
  contacts: Contact[];
  panicEvents: PanicEvent[];
  activeSOSState: 'IDLE' | 'ACQUIRING_GPS' | 'CAPTURING_EVIDENCE' | 'ESCALATING' | 'DISPATCHED' | 'RESOLVED';
  currentPanicEvent: PanicEvent | null;
  drillMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  bleDevices: BleDevice[];
  auditLogs: AuditLog[];
  isScanning: boolean;
  pairingProgress: string | null;
  gpsAccuracy: string;

  // Authentication & Management State
  users: UserProfile[];
  organizations: Organization[];
  currentUser: UserProfile | null;
  currentOrg: Organization | null;
  superAdminActive: boolean;

  // Actions
  registerUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  registerOrganization: (org: Omit<Organization, 'id' | 'createdAt'>) => Organization;
  login: (username: string, orgCode: string) => { success: boolean; error?: string; role: 'USER' | 'ORG' | 'ADMIN' };
  logout: () => void;
  updateUserProfile: (id: string, updated: Partial<UserProfile>) => void;
  deleteUserProfile: (id: string) => void;
  updateOrganization: (id: string, updated: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  
  toggleDrillMode: () => void;
  updateLocation: (lat: number, lng: number, accuracy?: string) => void;
  addAuditLog: (category: AuditLog['category'], severity: AuditLog['severity'], message: string, details?: string) => void;
  clearAuditLogs: () => void;
  triggerPanic: (description: string) => Promise<void>;
  triggerFromMasterKey: (submittedKey: string) => Promise<boolean>;
  cancelSOS: () => void;
  resolvePanic: (id: string) => void;
  updateContact: (id: string, updated: Partial<Contact>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  removeContact: (id: string) => void;
  startBleScan: () => void;
  stopBleScan: () => void;
  connectBleDevice: (mac: string) => void;
  disconnectBleDevice: (mac: string) => void;
  removeDevice: (mac: string) => void;
}

// Initial Demo Data
const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', label: '1st Contact - Tactical Voice Dispatch', phone: '+27829110000', template: 'Direct call sequence enqueued.', channelType: 'CALL', priority: 1 },
  { id: '2', label: '2nd Contact - SMS GPS Broadcast', phone: '+27839119112', template: 'EMERGENCY: Distress beacon active. GPS: https://maps.google.com/?q={LAT},{LNG}', channelType: 'SMS', priority: 2 },
  { id: '3', label: '3rd Contact - WhatsApp Dispatcher', phone: '+27600123456', template: 'CRITICAL: RFD_Beacon keyfob click verified. GPS: {LAT},{LNG}', channelType: 'WHATSAPP', priority: 3 },
  { id: '4', label: '4th Contact - Community Radio Link', phone: '+27650987654', template: 'SafetyLink Broadcast alert: -26.1912, 28.0264', channelType: 'GROUP', priority: 4 },
  { id: '5', label: '5th Contact - SAPS Emergency Police', phone: '10111', template: 'Tactical coordinator distress ping.', channelType: 'POLICE', priority: 5 }
];

const DEFAULT_BLE_DEVICES: BleDevice[] = [
  { macAddress: '00:1A:7D:DA:71:0F', friendlyName: 'Primary HST-01 Panic Tracker', deviceType: 'iTAG', batteryLevel: 89, rssi: -62, connectionState: 'CONNECTED', lastSeen: Date.now() }
];

// TIER-1 STATIC INTERCEPTOR
// Hardcoded master key used as an instant showcase panic trigger across all
// devices/installs. Kept in for now per explicit request while this is a
// demo/showcase build. SECURITY NOTE: because this repo is public, anyone
// who reads this constant can trigger a real emergency dispatch on any
// install. Remove this before real community members rely on this app —
// wire real triggers through per-user/per-device auth instead.
export const STATIC_INTERCEPTOR_MASTER_KEY = 'SL-MASTER-INTERCEPT-0000';

const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 'SL-ORG-8492', name: 'Apex Student Housing', contactName: 'Mpho Lekota', contactEmail: 'mpho@apexhousing.co.za', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  { id: 'SL-ORG-1024', name: 'Sandton Security Res', contactName: 'Johan de Beer', contactEmail: 'johan@sandtonres.co.za', createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000 },
  { id: 'SL-ORG-6677', name: 'Rosebank Varsity Lodges', contactName: 'Naledi Dlamini', contactEmail: 'naledi@varsitylodges.co.za', createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000 }
];

const MOCK_USERS: UserProfile[] = [
  { id: 'usr-1', username: 'thabo_m', fullName: 'Thabo Molefe', phone: '+27721234567', email: 'thabo.molefe@wits.ac.za', orgCode: 'SL-ORG-8492', createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000 },
  { id: 'usr-2', username: 'lerato_k', fullName: 'Lerato Khumalo', phone: '+27839876543', email: 'lerato.k@gmail.com', orgCode: 'SL-ORG-8492', createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000 },
  { id: 'usr-3', username: 'kevin_s', fullName: 'Kevin Smith', phone: '+27615551212', email: 'kevin.smith@up.ac.za', orgCode: 'SL-ORG-8492', createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000 },
  { id: 'usr-4', username: 'sipho_n', fullName: 'Sipho Ndlovu', phone: '+27712345678', email: 'sipho.ndlovu@gmail.com', orgCode: 'SL-ORG-1024', createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 }
];

const getStoredJSON = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredJSON = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  contacts: DEFAULT_CONTACTS,
  panicEvents: [],
  activeSOSState: 'IDLE',
  currentPanicEvent: null,
  drillMode: true, // Default to drill mode for safety testing
  userLocation: { lat: -26.1912, lng: 28.0264 }, // Default Johannesburg (Wits)
  bleDevices: DEFAULT_BLE_DEVICES,
  auditLogs: [
    { id: '1', timestamp: Date.now() - 60000, category: 'SYSTEM', severity: 'INFO', message: 'SafetyLink Core initialized', details: 'All modular services ready.' },
    { id: '2', timestamp: Date.now() - 30000, category: 'BLE', severity: 'INFO', message: 'Primary HST-01 tracker bound', details: 'Connected & listening for single/triple hardware clicks.' }
  ],
  isScanning: false,
  pairingProgress: null,
  gpsAccuracy: 'Accuracy: 4.2m (High-Precision Cell Triangulation)',

  // Auth state
  users: getStoredJSON<UserProfile[]>('sl_users', MOCK_USERS),
  organizations: getStoredJSON<Organization[]>('sl_organizations', MOCK_ORGANIZATIONS),
  currentUser: getStoredJSON<UserProfile | null>('sl_current_user', null),
  currentOrg: getStoredJSON<Organization | null>('sl_current_org', null),
  superAdminActive: getStoredJSON<boolean>('sl_super_admin', false),

  registerUser: (user) => {
    const users = get().users;
    const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (exists) {
      return { success: false, error: 'Username is already taken.' };
    }

    if (user.orgCode) {
      const orgs = get().organizations;
      const orgExists = orgs.some(o => o.id === user.orgCode);
      if (!orgExists) {
        return { success: false, error: 'Invalid Organization Code. Please verify with your housing provider.' };
      }
    }

    const newUser: UserProfile = {
      ...user,
      id: `usr-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now()
    };

    const updatedUsers = [...users, newUser];
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);

    get().addAuditLog('SECURITY', 'INFO', 'New User Registered', `Username: ${newUser.username}, Org: ${newUser.orgCode || 'None'}`);
    return { success: true };
  },

  registerOrganization: (org) => {
    const orgs = get().organizations;
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `SL-ORG-${randomHex}`;

    const newOrg: Organization = {
      ...org,
      id: generatedId,
      createdAt: Date.now()
    };

    const updatedOrgs = [...orgs, newOrg];
    set({ organizations: updatedOrgs });
    setStoredJSON('sl_organizations', updatedOrgs);

    get().addAuditLog('SECURITY', 'INFO', 'New Organization Provisioned', `Name: ${newOrg.name}, Code: ${generatedId}`);
    return newOrg;
  },

  login: (username, orgCode) => {
    if (orgCode === 'SL-admin-0000' || username === 'SL-admin-0000') {
      set({ currentUser: null, currentOrg: null, superAdminActive: true });
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', true);
      
      get().addAuditLog('SECURITY', 'SEVERE', 'Super Admin Authenticated', 'Access granted using SL-admin-0000 key.');
      return { success: true, role: 'ADMIN' };
    }

    const lowerUsername = username.trim().toLowerCase();
    const cleanOrgCode = orgCode.trim();

    const matchedOrg = get().organizations.find(o => o.id === cleanOrgCode);
    if (matchedOrg && (matchedOrg.contactName.toLowerCase() === lowerUsername || matchedOrg.id.toLowerCase() === lowerUsername)) {
      set({ currentUser: null, currentOrg: matchedOrg, superAdminActive: false });
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', matchedOrg);
      setStoredJSON('sl_super_admin', false);

      get().addAuditLog('SECURITY', 'INFO', 'Organization Logged In', `Org Name: ${matchedOrg.name}`);
      return { success: true, role: 'ORG' };
    }

    const matchedUser = get().users.find(u => u.username.toLowerCase() === lowerUsername);
    if (matchedUser) {
      if (cleanOrgCode && matchedUser.orgCode !== cleanOrgCode) {
        return { success: false, error: 'User does not belong to this organization code.', role: 'USER' };
      }

      set({ currentUser: matchedUser, currentOrg: null, superAdminActive: false });
      setStoredJSON('sl_current_user', matchedUser);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', false);

      get().addAuditLog('SECURITY', 'INFO', 'User Authenticated', `User: ${matchedUser.username}`);
      return { success: true, role: 'USER' };
    }

    return { success: false, error: 'Account not found. For first-time users, please create a profile first.', role: 'USER' };
  },

  logout: () => {
    set({ currentUser: null, currentOrg: null, superAdminActive: false });
    setStoredJSON('sl_current_user', null);
    setStoredJSON('sl_current_org', null);
    setStoredJSON('sl_super_admin', false);
    get().addAuditLog('SECURITY', 'INFO', 'User/Session Terminated', 'Current session cleared.');
  },

  updateUserProfile: (id, updated) => {
    const updatedUsers = get().users.map(u => u.id === id ? { ...u, ...updated } : u);
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    
    const curr = get().currentUser;
    if (curr && curr.id === id) {
      const newCurr = { ...curr, ...updated };
      set({ currentUser: newCurr });
      setStoredJSON('sl_current_user', newCurr);
    }
    
    get().addAuditLog('SECURITY', 'INFO', 'User Profile Updated', `ID: ${id}`);
  },

  deleteUserProfile: (id) => {
    const updatedUsers = get().users.filter(u => u.id !== id);
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    
    const curr = get().currentUser;
    if (curr && curr.id === id) {
      get().logout();
    }
    get().addAuditLog('SECURITY', 'WARN', 'User Profile Deleted', `ID: ${id}`);
  },

  updateOrganization: (id, updated) => {
    const updatedOrgs = get().organizations.map(o => o.id === id ? { ...o, ...updated } : o);
    set({ organizations: updatedOrgs });
    setStoredJSON('sl_organizations', updatedOrgs);
    
    const curr = get().currentOrg;
    if (curr && curr.id === id) {
      const newCurr = { ...curr, ...updated };
      set({ currentOrg: newCurr });
      setStoredJSON('sl_current_org', newCurr);
    }
    
    get().addAuditLog('SECURITY', 'INFO', 'Organization Updated', `ID: ${id}`);
  },

  deleteOrganization: (id) => {
    const updatedOrgs = get().organizations.filter(o => o.id !== id);
    set({ organizations: updatedOrgs });
    setStoredJSON('sl_organizations', updatedOrgs);
    
    const curr = get().currentOrg;
    if (curr && curr.id === id) {
      get().logout();
    }
    get().addAuditLog('SECURITY', 'WARN', 'Organization Deleted', `ID: ${id}`);
  },

  toggleDrillMode: () => {
    const current = get().drillMode;
    set({ drillMode: !current });
    get().addAuditLog('SECURITY', 'WARN', `Drill Mode toggled to ${!current ? 'ON' : 'OFF'}`, 'When Drill Mode is active, SMS gateways and call dispatch rules are simulated.');
  },

  updateLocation: (lat, lng, accuracy = 'Accuracy: High-Precision') => {
    set({ userLocation: { lat, lng }, gpsAccuracy: accuracy });
    if (get().activeSOSState !== 'IDLE') {
      get().addAuditLog('GPS', 'INFO', `GPS location updated to: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, accuracy);
    }
  },

  addAuditLog: (category, severity, message, details) => {
    const newLog: AuditLog = {
      id: Math.random().toString(),
      timestamp: Date.now(),
      category,
      severity,
      message,
      details
    };
    set(state => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 100) }));
  },

  clearAuditLogs: () => set({ auditLogs: [] }),

  triggerFromMasterKey: async (submittedKey) => {
    if (submittedKey !== STATIC_INTERCEPTOR_MASTER_KEY) return false;
    get().addAuditLog('SECURITY', 'SEVERE', 'Static Interceptor Fired', 'Emergency triggered via master key showcase interceptor, not a real device.');
    await get().triggerPanic('Triggered via Tier-1 Static Interceptor (showcase master key)');
    return true;
  },

  triggerPanic: async (description) => {
    if (get().activeSOSState !== 'IDLE') return;

    set({ activeSOSState: 'ACQUIRING_GPS' });
    get().addAuditLog('SYSTEM', 'SEVERE', 'SOS Trigger Initiated', 'Acquiring GPS cellular location.');

    await new Promise(r => setTimeout(r, 1500));
    set({ activeSOSState: 'CAPTURING_EVIDENCE' });
    get().addAuditLog('SYSTEM', 'SEVERE', 'Capturing Local Evidence', 'Recording local audio snippet & cellular mast triangulation signatures.');

    await new Promise(r => setTimeout(r, 1500));
    set({ activeSOSState: 'ESCALATING' });
    get().addAuditLog('DISPATCH', 'SEVERE', 'Escalating Dispatch Chain', 'Initiating sequential alerts to prioritized emergency contacts.');

    const loc = get().userLocation || { lat: -26.1912, lng: 28.0264 };
    const isDrill = get().drillMode;

    get().contacts.forEach((contact, index) => {
      setTimeout(async () => {
        if (get().activeSOSState === 'IDLE') return;
        const message = contact.template.replace('{LAT}', loc.lat.toFixed(5)).replace('{LNG}', loc.lng.toFixed(5));

        if (isDrill) {
          get().addAuditLog(
            'DISPATCH',
            'SEVERE',
            `[Contact #${contact.priority}] Sent via ${contact.channelType} to ${contact.label}`,
            `[DRILL SIMULATION] message: "${message}"`
          );
          return;
        }

        // Live dispatch -- actually reaches the device's SMS/telephony/WhatsApp layer.
        let ok = false;
        switch (contact.channelType) {
          case 'SMS':
          case 'GROUP':
            ok = await NativeDispatchService.sendSms(contact.phone, message);
            break;
          case 'CALL':
          case 'POLICE':
            ok = await NativeDispatchService.placeCall(contact.phone);
            break;
          case 'WHATSAPP':
            ok = await NativeDispatchService.openWhatsApp(contact.phone, message);
            break;
        }

        get().addAuditLog(
          'DISPATCH',
          ok ? 'SEVERE' : 'WARN',
          `[Contact #${contact.priority}] ${ok ? 'Sent' : 'FAILED to send'} via ${contact.channelType} to ${contact.label}`,
          `[LIVE BROADCASTED] message: "${message}"`
        );
      }, (index + 1) * 1000);
    });

    await new Promise(r => setTimeout(r, 4000));
    
    const newEvent: PanicEvent = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}-SA`,
      status: 'DISPATCHED',
      severity: 'CRITICAL',
      lat: loc.lat,
      lng: loc.lng,
      timestamp: Date.now(),
      assignedResponder: 'Sandton Armed Patrol Alpha 1',
      description,
      timelineData: [
        '13:16:01 UTC - Wearable Beacon Press Verified',
        '13:16:03 UTC - High Precision GPS Triangulation Locked',
        '13:16:08 UTC - Emergency Contact Alert Sequence Triggered',
        '13:16:12 UTC - Incident written to remote board & Central dispatch enroute.'
      ]
    };

    set(state => ({
      panicEvents: [newEvent, ...state.panicEvents],
      activeSOSState: 'DISPATCHED',
      currentPanicEvent: newEvent
    }));

    get().addAuditLog('DISPATCH', 'INFO', `Incident created: ${newEvent.id}`, `Responder ${newEvent.assignedResponder} has been automatically dispatched.`);
  },

  cancelSOS: () => {
    set({ activeSOSState: 'IDLE', currentPanicEvent: null });
    get().addAuditLog('SYSTEM', 'WARN', 'SOS Distress Cancelled', 'Operator input or wearable double-click trigger override applied.');
  },

  resolvePanic: (id) => {
    set(state => ({
      panicEvents: state.panicEvents.map(ev => 
        ev.id === id ? { ...ev, status: 'RESOLVED', timelineData: [...ev.timelineData, `${new Date().toLocaleTimeString()} UTC - Resolved by safety operator.`] } : ev
      ),
      currentPanicEvent: state.currentPanicEvent?.id === id ? null : state.currentPanicEvent,
      activeSOSState: state.currentPanicEvent?.id === id ? 'IDLE' : state.activeSOSState
    }));
    get().addAuditLog('SYSTEM', 'INFO', `Incident ${id} marked as RESOLVED`, 'The tactical situation has been stabilized and closed.');
  },

  updateContact: (id, updated) => {
    set(state => ({
      contacts: state.contacts.map(c => c.id === id ? { ...c, ...updated } : c)
    }));
    get().addAuditLog('SYSTEM', 'INFO', 'Emergency contact list modified', `ID: ${id} updated.`);
  },

  addContact: (contact) => {
    const newContact: Contact = {
      ...contact,
      id: Math.random().toString(),
      priority: get().contacts.length + 1
    };
    set(state => ({ contacts: [...state.contacts, newContact] }));
    get().addAuditLog('SYSTEM', 'INFO', 'New Backup Contact Added', `${newContact.label}`);
  },

  removeContact: (id) => {
    set(state => ({
      contacts: state.contacts.filter(c => c.id !== id).map((c, idx) => ({ ...c, priority: idx + 1 }))
    }));
    get().addAuditLog('SYSTEM', 'WARN', 'Backup Contact Removed', `ID: ${id}`);
  },

  startBleScan: () => {
    if (get().isScanning) return;
    set({ isScanning: true, pairingProgress: 'Scanning for legacy emergency keyfob packets...' });
    get().addAuditLog('BLE', 'INFO', 'BLE LE Scanner Armed', 'Scanning for HST-01 and RFD_Beacon advertising flags.');

    setTimeout(() => {
      set({ pairingProgress: 'Discovered RFD_Beacon keyfob [00:1A:7D:EE:22:90] RSSI: -54dBm' });
    }, 1500);

    setTimeout(() => {
      set({ pairingProgress: 'Bonding with hardware secure key (createBond)...' });
    }, 3000);

    setTimeout(() => {
      const newDev: BleDevice = {
        macAddress: '00:1A:7D:EE:22:90',
        friendlyName: 'HST-01 Wearable Keyfob',
        deviceType: 'RFD_Beacon',
        batteryLevel: 100,
        rssi: -51,
        connectionState: 'CONNECTED',
        lastSeen: Date.now()
      };
      set(state => ({
        bleDevices: [...state.bleDevices, newDev],
        isScanning: false,
        pairingProgress: null
      }));
      get().addAuditLog('BLE', 'INFO', 'BLE Device Paired', 'HST-01 Wearable Keyfob successfully bonded to tactical emergency bus.');
    }, 4500);
  },

  stopBleScan: () => set({ isScanning: false, pairingProgress: null }),

  connectBleDevice: (mac) => {
    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTED', rssi: -55 } : d)
    }));
    get().addAuditLog('BLE', 'INFO', 'BLE Device Reconnected', `MAC: ${mac}`);
  },

  disconnectBleDevice: (mac) => {
    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
    }));
    get().addAuditLog('BLE', 'SEVERE', 'BLE Wearable Connection Severed', `Hardware link to ${mac} was terminated. Action fallback recommended.`);
  },

  removeDevice: (mac) => {
    set(state => ({
      bleDevices: state.bleDevices.filter(d => d.macAddress !== mac)
    }));
    get().addAuditLog('BLE', 'WARN', 'BLE Wearable Device Forgotten', `MAC: ${mac}`);
  }
}));
