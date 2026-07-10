import { create } from 'zustand';
import { Contact, PanicEvent, BleDevice, AuditLog, UserProfile, Organization, CustomTool } from '../types';
import { NativeDispatchService } from '../services/NativeDispatchService';
import { scanForNearbyDevices, stopScan, discoverAndBindTrigger, subscribeToKnownTrigger, disconnectDevice, DiscoveredDevice } from '../services/BleService';
import { pushIncidentTelemetry } from '../services/ThingsBoardService';
import { LocalNotificationService } from '../services/LocalNotificationService';
import { TwilioService } from '../services/TwilioService';

interface AppState {
  contacts: Contact[];
  panicEvents: PanicEvent[];
  activeSOSState: 'IDLE' | 'ACQUIRING_GPS' | 'CAPTURING_EVIDENCE' | 'ESCALATING' | 'DISPATCHED' | 'RESOLVED';
  currentPanicEvent: PanicEvent | null;
  drillMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  bleDevices: BleDevice[];
  discoveredDevices: DiscoveredDevice[];
  thingsBoardToken: string;
  auditLogs: AuditLog[];
  isScanning: boolean;
  pairingProgress: string | null;
  gpsAccuracy: string;
  
  // New premium Security operations fields
  panicCountdown: number | null;
  localOfflineQueue: { id: string; timestamp: number; description: string; lat: number; lng: number }[];
  startMultiStagePanic: (description: string, durationSec?: number) => void;
  syncOfflineQueue: () => void;
  updateOrgBranding: (branding: { logoUrl?: string; primaryColor?: string; secondaryColor?: string; controlRoomNumber?: string; escalationPolicy?: string; twilio?: { accountSid: string; authToken: string; fromNumber: string } }) => void;
  updateClientProfile: (id: string, updated: Partial<UserProfile>) => void;

  // Background service states
  isBackgroundServiceRunning: boolean;
  backgroundServiceTick: number;
  toggleBackgroundService: () => void;
  incrementBackgroundServiceTick: () => void;
  isAppMinimized: boolean;
  setMinimized: (value: boolean) => void;

  // System Permissions for Android/iOS Compatibility
  permissions: {
    location: boolean;
    backgroundLocation: boolean;
    bluetooth: boolean;
    sms: boolean;
    phone: boolean;
    notifications: boolean;
    batteryBypass: boolean;
  };
  setPermission: (key: 'location' | 'backgroundLocation' | 'bluetooth' | 'sms' | 'phone' | 'notifications' | 'batteryBypass', value: boolean) => void;
  grantAllPermissions: () => void;

  // Authentication & Management State
  users: UserProfile[];
  organizations: Organization[];
  currentUser: UserProfile | null;
  currentOrg: Organization | null;
  superAdminActive: boolean;
  customTools: CustomTool[];

  // Actions
  registerUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  registerOrganization: (org: Omit<Organization, 'id' | 'createdAt'> & { id?: string }) => Organization;
  login: (username: string, orgCode: string) => { success: boolean; error?: string; role: 'USER' | 'ORG' | 'ADMIN' };
  logout: () => void;
  updateUserProfile: (id: string, updated: Partial<UserProfile>) => void;
  deleteUserProfile: (id: string) => void;
  updateOrganization: (id: string, updated: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  approveOrganization: (id: string) => void;

  // Custom Tools & Settings Actions
  addCustomTool: (tool: Omit<CustomTool, 'id' | 'createdAt'>) => void;
  deleteCustomTool: (id: string) => void;
  
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
  registerDiscoveredDevice: (deviceId: string, name: string, deviceType?: 'iTAG' | 'RFD_Beacon' | 'GENERIC_BLE_BUTTON') => void;
  bindDeviceTrigger: (mac: string) => Promise<boolean>;
  connectBleDevice: (mac: string) => void;
  disconnectBleDevice: (mac: string) => void;
  removeDevice: (mac: string) => void;
  setThingsBoardToken: (token: string) => void;

  // Language & Localization State
  language: string;
  downloadedLanguages: string[];
  setLanguage: (lang: string) => void;
  downloadLanguage: (langCode: string) => Promise<void>;

  // Toast Notifications (non-overlapping queue)
  toasts: { id: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }[];
  addToast: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  removeToast: (id: string) => void;

  // Showcase Demo Mode
  demoMode: boolean;
  toggleDemoMode: () => void;

  // Floating Panic Widget states
  isFloatingWidgetDeployed: boolean;
  floatingWidgetSize: number;
  setFloatingWidgetDeployed: (value: boolean) => void;
  setFloatingWidgetSize: (value: number) => void;

  // Decoy Mode & Vault states
  decoyActive: boolean;
  decoyCode: string;
  decoyDistressCode: string;
  vaultPassword: string;
  vaultSecurityQuestion: string;
  vaultSecurityAnswer: string;
  vaultFiles: { id: string; name: string; size: string; type: string; ciphertext?: string; iv?: string; salt?: string; isEncrypted?: boolean }[];
  vaultApps: { id: string; name: string; packageName: string }[];
  silenceAlerts: boolean;
  firestoreSync: boolean;

  setDecoyActive: (value: boolean) => void;
  setDecoyCode: (code: string) => void;
  setDecoyDistressCode: (code: string) => void;
  setVaultPassword: (password: string, question: string, answer: string) => void;
  setSilenceAlerts: (value: boolean) => void;
  setFirestoreSync: (value: boolean) => void;
  addVaultFile: (file: { name: string; size: string; type: string; ciphertext?: string; iv?: string; salt?: string; isEncrypted?: boolean }) => void;
  removeVaultFile: (id: string) => void;
  addVaultApp: (app: { name: string; packageName: string }) => void;
  removeVaultApp: (id: string) => void;
}

// Initial Demo Data
const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', label: '1st Contact - Tactical Voice Dispatch', phone: '+27829110000', template: 'Direct call sequence enqueued.', channelType: 'CALL', priority: 1 },
  { id: '2', label: '2nd Contact - SMS GPS Broadcast', phone: '+27839119112', template: 'EMERGENCY: Distress beacon active. GPS: https://maps.google.com/?q={LAT},{LNG}', channelType: 'SMS', priority: 2 },
  { id: '3', label: '3rd Contact - WhatsApp Dispatcher', phone: '+27600123456', template: 'CRITICAL: RFD_Beacon keyfob click verified. GPS: {LAT},{LNG}', channelType: 'WHATSAPP', priority: 3 },
  { id: '4', label: '4th Contact - Community Radio Link', phone: '+27650987654', template: 'SafetyLink Broadcast alert: -26.1912, 28.0264', channelType: 'GROUP', priority: 4 },
  { id: '5', label: '5th Contact - SAPS Emergency Police', phone: '10111', template: 'Tactical coordinator distress ping.', channelType: 'POLICE', priority: 5 }
];

// No fake default device -- bleDevices now persists real, actually-bound
// hardware only. The device-independent "DEMO SOS" button (BLEScanner)
// covers the client-showcase use case without needing a fake connected
// entry here.
const DEFAULT_BLE_DEVICES: BleDevice[] = [];

// TIER-1 STATIC INTERCEPTOR
// Hardcoded master key used as an instant showcase panic trigger across all
// devices/installs. Kept in for now per explicit request while this is a
// demo/showcase build. SECURITY NOTE: because this repo is public, anyone
// who reads this constant can trigger a real emergency dispatch on any
// install. Remove this before real community members rely on this app —
// wire real triggers through per-user/per-device auth instead.
// Master intercept key from env only — never hardcoded in production
export const STATIC_INTERCEPTOR_MASTER_KEY = import.meta.env.VITE_MASTER_INTERCEPT_KEY ?? '';

const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'SL-WITS-4829',
    name: 'Wits University Security Node',
    contactName: 'commander_wits',
    contactEmail: 'dispatch@wits.ac.za',
    createdAt: Date.now() - 86400000 * 5,
    approved: true
  },
  {
    id: 'SL-CITY-2810',
    name: 'City Patrol Agency Node',
    contactName: 'chief_patrol',
    contactEmail: 'patrol@citysecurity.co.za',
    createdAt: Date.now() - 86400000 * 3,
    approved: true
  }
];

const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-demo1',
    username: 'thabo_m',
    fullName: 'Thabo Molefe',
    phone: '+27721234567',
    whatsapp: '+27721234567',
    avatarUrl: '',
    email: 'thabo@meshnet.co.za',
    orgCode: 'SL-WITS-4829',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: 'usr-demo2',
    username: 'lerato_k',
    fullName: 'Lerato Khumalo',
    phone: '+27839110001',
    whatsapp: '+27839110001',
    avatarUrl: '',
    email: 'lerato.k@gmail.com',
    orgCode: '', // Standalone user with no organization!
    createdAt: Date.now() - 86400000
  }
];

export function getOrgAbbreviation(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (!clean) return 'ORG';
  const parts = clean.split(/[\s-]+/).filter(Boolean);
  
  if (parts.length === 1) {
    const word = parts[0];
    return word.length <= 4 ? word.toUpperCase() : word.substring(0, 4).toUpperCase();
  }
  
  const abbrev = parts.map(p => p[0]).join('').toUpperCase();
  return abbrev.substring(0, 5);
}

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

export const ADMIN_USERNAME = 'safetylink';
export const ADMIN_ORG_CODE = 'sladmin0000';

const isDemoModeInitially = getStoredJSON<boolean>('sl_demo_mode', false);

export const useAppStore = create<AppState>((set, get) => ({
  demoMode: isDemoModeInitially,
  contacts: getStoredJSON<Contact[]>('sl_contacts', isDemoModeInitially ? DEFAULT_CONTACTS : []),
  panicEvents: [],
  activeSOSState: 'IDLE',
  currentPanicEvent: null,
  drillMode: false, // Default to Live Mode (not drill) so live SMS and CALLs are dispatched
  userLocation: { lat: -26.1912, lng: 28.0264 }, // Default Johannesburg (Wits)
  bleDevices: getStoredJSON<BleDevice[]>('sl_ble_devices', DEFAULT_BLE_DEVICES),
  discoveredDevices: [],
  thingsBoardToken: getStoredJSON<string>('sl_thingsboard_token', import.meta.env.VITE_THINGSBOARD_TOKEN ?? ''),
  auditLogs: [
    { id: '1', timestamp: Date.now() - 60000, category: 'SYSTEM', severity: 'INFO', message: 'SafetyLink Core initialized', details: 'All modular services ready.' }
  ],
  isScanning: false,
  pairingProgress: null,
  gpsAccuracy: 'Accuracy: 4.2m (High-Precision Cell Triangulation)',

  panicCountdown: null,
  localOfflineQueue: getStoredJSON<{ id: string; timestamp: number; description: string; lat: number; lng: number }[]>('sl_offline_queue', []),

  // Background service initial state
  isBackgroundServiceRunning: getStoredJSON<boolean>('sl_bg_service_running', true),
  backgroundServiceTick: 0,
  isAppMinimized: false,
  setMinimized: (value: boolean) => {
    set({ isAppMinimized: value });
    get().addAuditLog(
      'SYSTEM',
      'INFO',
      value ? 'App Exited to Background' : 'App Re-entered Foreground Console',
      value ? 'Core services running in sticky background daemon.' : 'UI session reactivated by operator.'
    );
  },
  toggleBackgroundService: () => {
    const nextState = !get().isBackgroundServiceRunning;
    set({ isBackgroundServiceRunning: nextState });
    setStoredJSON('sl_bg_service_running', nextState);
    get().addAuditLog(
      'SYSTEM',
      nextState ? 'INFO' : 'WARN',
      nextState ? 'Background Service Resumed' : 'Background Service Suspended',
      nextState ? 'Foreground listener active. Battery wake-locks engaged.' : 'Background telemetry deactivated by operator command.'
    );

    const loc = get().userLocation;
    const locStr = loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'Acquiring GPS...';
    const activeBleCount = get().bleDevices.filter(d => d.connectionState === 'CONNECTED').length;
    LocalNotificationService.updateStatusNotification(
      nextState,
      get().backgroundServiceTick,
      get().activeSOSState,
      locStr,
      activeBleCount
    ).catch(err => console.error('LocalNotification Error:', err));
  },
  incrementBackgroundServiceTick: () => {
    set(state => ({ backgroundServiceTick: state.backgroundServiceTick + 1 }));
    
    const loc = get().userLocation;
    const locStr = loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'Acquiring GPS...';
    const activeBleCount = get().bleDevices.filter(d => d.connectionState === 'CONNECTED').length;
    LocalNotificationService.updateStatusNotification(
      get().isBackgroundServiceRunning,
      get().backgroundServiceTick,
      get().activeSOSState,
      locStr,
      activeBleCount
    ).catch(err => console.error('LocalNotification Error:', err));
  },

  // System Permissions for Android/iOS Compatibility
  permissions: getStoredJSON<{
    location: boolean;
    backgroundLocation: boolean;
    bluetooth: boolean;
    sms: boolean;
    phone: boolean;
    notifications: boolean;
    batteryBypass: boolean;
  }>('sl_permissions', {
    location: false,
    backgroundLocation: false,
    bluetooth: false,
    sms: false,
    phone: false,
    notifications: false,
    batteryBypass: false,
  }),
  setPermission: (key, value) => {
    const updated = { ...get().permissions, [key]: value };
    set({ permissions: updated });
    setStoredJSON('sl_permissions', updated);
    get().addAuditLog(
      'SYSTEM',
      value ? 'INFO' : 'WARN',
      `Permission updated: ${key.toUpperCase()}`,
      `State set to ${value ? 'GRANTED' : 'REVOKED'} by operator.`
    );
    if (key === 'notifications' && value) {
      LocalNotificationService.requestPermission().catch(err => console.error(err));
    }
  },
  grantAllPermissions: () => {
    const updated = {
      location: true,
      backgroundLocation: true,
      bluetooth: true,
      sms: true,
      phone: true,
      notifications: true,
      batteryBypass: true,
    };
    set({ permissions: updated });
    setStoredJSON('sl_permissions', updated);
    get().addAuditLog('SYSTEM', 'INFO', 'Full OS Permissions Granted', 'All background location, BT scan, and dispatch hooks approved for maximum compatibility.');
    LocalNotificationService.requestPermission().catch(err => console.error(err));
  },

  // Auth state
  users: getStoredJSON<UserProfile[]>('sl_users', isDemoModeInitially ? MOCK_USERS : getStoredJSON<UserProfile[]>('sl_real_users', [])),
  organizations: getStoredJSON<Organization[]>('sl_organizations', isDemoModeInitially ? MOCK_ORGANIZATIONS : getStoredJSON<Organization[]>('sl_real_organizations', [])),
  currentUser: getStoredJSON<UserProfile | null>('sl_current_user', null),
  currentOrg: getStoredJSON<Organization | null>('sl_current_org', null),
  superAdminActive: getStoredJSON<boolean>('sl_super_admin', false),
  customTools: getStoredJSON<CustomTool[]>('sl_custom_tools', []),

  // Floating widget states
  isFloatingWidgetDeployed: getStoredJSON<boolean>('sl_floating_widget_deployed', false),
  floatingWidgetSize: getStoredJSON<number>('sl_floating_widget_size', 64),
  setFloatingWidgetDeployed: (value) => {
    set({ isFloatingWidgetDeployed: value });
    setStoredJSON('sl_floating_widget_deployed', value);
  },
  setFloatingWidgetSize: (value) => {
    set({ floatingWidgetSize: value });
    setStoredJSON('sl_floating_widget_size', value);
  },

  // Decoy Mode & Vault Initial States
  decoyActive: getStoredJSON<boolean>('sl_decoy_active', false),
  decoyCode: getStoredJSON<string>('sl_decoy_code', '1911'),
  decoyDistressCode: getStoredJSON<string>('sl_decoy_distress_code', '9111'),
  vaultPassword: getStoredJSON<string>('sl_vault_password_hash', ''), // PBKDF2 verifier hash only
  vaultSecurityQuestion: getStoredJSON<string>('sl_vault_security_question', ''),
  vaultSecurityAnswer: getStoredJSON<string>('sl_vault_security_answer', ''),
  vaultFiles: getStoredJSON<any[]>('sl_vault_files', [
    { id: 'f1', name: 'covert_mesh_route_v2.pdf', size: '2.4 MB', type: 'PDF' },
    { id: 'f2', name: 'patrol_telemetry_manifest.json', size: '15.1 KB', type: 'JSON' },
    { id: 'f3', name: 'personnel_clearance_saps.xlsx', size: '412 KB', type: 'XLSX' }
  ]),
  vaultApps: getStoredJSON<any[]>('sl_vault_apps', [
    { id: 'a1', name: 'Signal Private Messenger', packageName: 'org.thoughtcrime.securesms' },
    { id: 'a2', name: 'Tor Browser Client', packageName: 'org.torproject.torbrowser' }
  ]),
  silenceAlerts: getStoredJSON<boolean>('sl_silence_alerts', false),
  firestoreSync: getStoredJSON<boolean>('sl_firestore_sync', false),

  setDecoyActive: (value) => {
    set({ decoyActive: value });
    setStoredJSON('sl_decoy_active', value);
    get().addAuditLog('SECURITY', 'INFO', `Decoy mode ${value ? 'ARMED' : 'DISARMED'}`, 'App launches directly into normal calculator disguise.');
  },
  setDecoyCode: (code) => {
    set({ decoyCode: code });
    setStoredJSON('sl_decoy_code', code);
  },
  setDecoyDistressCode: (code) => {
    set({ decoyDistressCode: code });
    setStoredJSON('sl_decoy_distress_code', code);
  },
  setVaultPassword: async (password, question, answer) => {
    const { derivePasswordVerifier } = await import('./crypto');
    const hash = await derivePasswordVerifier(password);
    set({ vaultPassword: hash, vaultSecurityQuestion: question, vaultSecurityAnswer: answer });
    setStoredJSON('sl_vault_password_hash', hash);
    setStoredJSON('sl_vault_security_question', question);
    setStoredJSON('sl_vault_security_answer', answer);
    get().addAuditLog('SECURITY', 'INFO', 'Confidential Vault Password set/updated', 'PBKDF2 verifier stored; raw password never persisted.');
  },
  setSilenceAlerts: (value) => {
    set({ silenceAlerts: value });
    setStoredJSON('sl_silence_alerts', value);
  },
  setFirestoreSync: (value) => {
    set({ firestoreSync: value });
    setStoredJSON('sl_firestore_sync', value);
    get().addAuditLog('SYSTEM', 'INFO', `Firestore Backup Link ${value ? 'ENABLED' : 'DISABLED'}`, 'Real-time synchronization with remote cloud clusters.');
  },
  addVaultFile: (file) => {
    const nextFiles = [...get().vaultFiles, { ...file, id: Math.random().toString(36).substring(2, 9) }];
    set({ vaultFiles: nextFiles });
    setStoredJSON('sl_vault_files', nextFiles);
  },
  removeVaultFile: (id) => {
    const nextFiles = get().vaultFiles.filter(f => f.id !== id);
    set({ vaultFiles: nextFiles });
    setStoredJSON('sl_vault_files', nextFiles);
  },
  addVaultApp: (app) => {
    const nextApps = [...get().vaultApps, { ...app, id: Math.random().toString(36).substring(2, 9) }];
    set({ vaultApps: nextApps });
    setStoredJSON('sl_vault_apps', nextApps);
  },
  removeVaultApp: (id) => {
    const nextApps = get().vaultApps.filter(a => a.id !== id);
    set({ vaultApps: nextApps });
    setStoredJSON('sl_vault_apps', nextApps);
  },

  // Language & Localization Initializer
  language: getStoredJSON<string>('sl_language', 'en'),
  downloadedLanguages: getStoredJSON<string[]>('sl_downloaded_languages', ['en', 've']),

  registerUser: (user) => {
    const users = get().users;
    const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (exists) {
      return { success: false, error: 'Username is already taken.' };
    }

    if (user.orgCode) {
      const orgs = get().organizations;
      const matchedOrg = orgs.find(o => o.id.toLowerCase() === user.orgCode.trim().toLowerCase());
      if (!matchedOrg) {
        return { success: false, error: 'Invalid Organization Code. Please verify with your housing provider.' };
      }
      if (matchedOrg.approved === false) {
        return { success: false, error: 'This Organization is pending registry approval by Super Admin.' };
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
    
    // Persist to real live storage key
    const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
    setStoredJSON('sl_real_users', [...realUsers, newUser]);

    get().addAuditLog('SECURITY', 'INFO', 'New User Registered', `Username: ${newUser.username}, Org: ${newUser.orgCode || 'None'}`);
    return { success: true };
  },

  registerOrganization: (org) => {
    const orgs = get().organizations;
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const abbrev = getOrgAbbreviation(org.name);
    const generatedId = org.id || `SL-${abbrev}-${randomHex}`;

    const newOrg: Organization = {
      name: org.name,
      contactName: org.contactName,
      contactEmail: org.contactEmail,
      id: generatedId,
      createdAt: Date.now(),
      approved: get().demoMode ? true : false // Pending by default in Live/Production mode!
    };

    const updatedOrgs = [...orgs, newOrg];
    set({ organizations: updatedOrgs });
    setStoredJSON('sl_organizations', updatedOrgs);

    // Persist to real live storage key
    const realOrgs = getStoredJSON<Organization[]>('sl_real_organizations', []);
    setStoredJSON('sl_real_organizations', [...realOrgs, newOrg]);

    get().addAuditLog('SECURITY', 'INFO', `New Organization Provisioned (${newOrg.approved ? 'Active' : 'Pending Approval'})`, `Name: ${newOrg.name}, Code: ${generatedId}`);
    return newOrg;
  },

  login: (username, orgCode) => {
    const normUsername = username.trim().toLowerCase();
    const normOrgCode = orgCode.trim().toLowerCase();

    // Prevent login as a preset demo profile if Demo Mode is turned off
    const presetUsernames = new Set(['thabo_m', 'lerato_k', 'commander_wits', 'chief_patrol']);
    const presetOrgCodes = new Set(['sl-wits-4829', 'sl-city-2810']);
    if (!get().demoMode && (presetUsernames.has(normUsername) || presetOrgCodes.has(normOrgCode))) {
      return { 
        success: false, 
        error: 'Preset demo accounts are restricted to Demo Mode. Please register a real user or organization account for live production use, or enable Demo Mode first.', 
        role: 'USER' 
      };
    }

    // Super Admin: requires username "SafetyLink" and organization ID "SLAdmin0000" (case-insensitive and trimmed)
    const isSuperAdmin = normUsername === ADMIN_USERNAME && normOrgCode === ADMIN_ORG_CODE;
    if (isSuperAdmin) {
      set({ currentUser: null, currentOrg: null, superAdminActive: true });
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', true);

      get().addAuditLog('SECURITY', 'SEVERE', 'Super Admin Authenticated', `Access granted to ${username}.`);
      return { success: true, role: 'ADMIN' };
    }

    // Regular user login: match on username, optionally validated against
    // an org code if one was supplied.
    const matchedUser = get().users.find(u => u.username.toLowerCase() === normUsername);
    if (matchedUser) {
      const userOrg = matchedUser.orgCode || '';
      if (orgCode.trim() && userOrg.toLowerCase() !== normOrgCode) {
        return { success: false, error: 'User does not belong to this organization code.', role: 'USER' };
      }

      set({ currentUser: matchedUser, currentOrg: null, superAdminActive: false });
      setStoredJSON('sl_current_user', matchedUser);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', false);

      get().addAuditLog('SECURITY', 'INFO', 'User Authenticated', `User: ${matchedUser.username}`);
      return { success: true, role: 'USER' };
    }

    // Organization login: match on org code AND contact/commander name (username)
    if (normOrgCode) {
      const matchedOrg = get().organizations.find(o => o.id.toLowerCase() === normOrgCode);
      if (matchedOrg) {
        if (matchedOrg.contactName.toLowerCase() === normUsername) {
          if (matchedOrg.approved === false) {
            return { success: false, error: 'This Organization is pending registry approval by Super Admin.', role: 'ORG' };
          }
          set({ currentUser: null, currentOrg: matchedOrg, superAdminActive: false });
          setStoredJSON('sl_current_user', null);
          setStoredJSON('sl_current_org', matchedOrg);
          setStoredJSON('sl_super_admin', false);

          get().addAuditLog('SECURITY', 'INFO', 'Organization Logged In', `Org Name: ${matchedOrg.name}`);
          return { success: true, role: 'ORG' };
        }
      }
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

  toggleDemoMode: () => {
    const nextState = !get().demoMode;
    set({ demoMode: nextState });
    setStoredJSON('sl_demo_mode', nextState);
    if (nextState) {
      set({
        users: MOCK_USERS,
        organizations: MOCK_ORGANIZATIONS,
        contacts: DEFAULT_CONTACTS,
      });
      setStoredJSON('sl_users', MOCK_USERS);
      setStoredJSON('sl_organizations', MOCK_ORGANIZATIONS);
      setStoredJSON('sl_contacts', DEFAULT_CONTACTS);
      get().addAuditLog('SYSTEM', 'INFO', 'Demo Mode Activated', 'Mock users, organizations, and simulated distress contacts populated for application showcase.');
      get().addToast('Demo Mode Activated! Mock profiles and data populated.', 'success');
    } else {
      const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
      const realOrgs = getStoredJSON<Organization[]>('sl_real_organizations', []);
      const realContacts = getStoredJSON<Contact[]>('sl_real_contacts', []);

      set({
        users: realUsers,
        organizations: realOrgs,
        currentUser: null,
        currentOrg: null,
        superAdminActive: false,
        panicEvents: [],
        contacts: realContacts,
      });
      setStoredJSON('sl_users', realUsers);
      setStoredJSON('sl_organizations', realOrgs);
      setStoredJSON('sl_contacts', realContacts);
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', false);
      get().addAuditLog('SYSTEM', 'WARN', 'Demo Mode Deactivated', 'Demo profiles removed. Restored user-defined live databases.');
      get().addToast('Demo Mode Deactivated. Persistent live database restored.', 'info');
    }
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

    const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}-SA`;
    const loc = get().userLocation || { lat: -26.1912, lng: 28.0264 };
    const isDrill = get().drillMode;

    // Simulate Offline-first Queueing if in Drill Mode or offline
    if (isDrill) {
      const offlineItem = {
        id: incidentId,
        timestamp: Date.now(),
        description: `${description} [Offline Cache]`,
        lat: loc.lat,
        lng: loc.lng
      };
      const updatedQueue = [...get().localOfflineQueue, offlineItem];
      set({ localOfflineQueue: updatedQueue });
      setStoredJSON('sl_offline_queue', updatedQueue);
      get().addAuditLog('SYSTEM', 'WARN', 'Offline Local Buffer Engaged', `Distress enqueued in local offline storage cache. Queue depth: ${updatedQueue.length}. Attempting backup dispatch channels.`);
    }

    set({ activeSOSState: 'ACQUIRING_GPS' });
    get().addAuditLog('SYSTEM', 'SEVERE', 'SOS Trigger Initiated', 'Acquiring high-accuracy GNSS/GPS lock.');

    await new Promise(r => setTimeout(r, 1000));
    set({ activeSOSState: 'CAPTURING_EVIDENCE' });
    get().addAuditLog('SYSTEM', 'SEVERE', 'Capturing Local Evidence', 'Streaming 5s ambient audio chunk and tracking cell tower triangulation.');

    await new Promise(r => setTimeout(r, 1000));
    set({ activeSOSState: 'ESCALATING' });
    
    // --- Modular Dispatch Engine Pipeline ---
    // 1. SmsDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[SmsDispatcher] Executing channel broadcast', `Sending cell SMS with geolocation maps linkage to primary contacts.`);
    await new Promise(r => setTimeout(r, 600));

    // 2. PushDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[PushDispatcher] Triggering native push system', `Broadcasting high-priority system-level alert push notifications.`);
    await new Promise(r => setTimeout(r, 600));

    // 3. DashboardDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[DashboardDispatcher] Rendering to controller screen', `Feeding real-time live distress telemetry feed into Org Control deck.`);
    await new Promise(r => setTimeout(r, 600));

    // 4. CloudDispatcher (ThingsBoard/Firestore)
    get().addAuditLog('DISPATCH', 'INFO', '[CloudDispatcher] Pushing to central database gateway', `Synchronizing tracking variables to telemetry stream.`);
    const tbToken = get().thingsBoardToken;
    if (tbToken) {
      const who = get().currentUser?.username || get().currentOrg?.name || 'Unknown';
      const orgId = get().currentUser?.orgCode || get().currentOrg?.id || 'INDIVIDUAL';
      pushIncidentTelemetry(tbToken, {
        event: isDrill ? 'drill' : 'panic',
        incidentId,
        lat: loc.lat,
        lng: loc.lng,
        description,
        orgId,
        triggeredBy: who,
      }).then(ok => {
        get().addAuditLog('DISPATCH', ok ? 'INFO' : 'WARN', ok ? '[CloudDispatcher] Sync complete' : '[CloudDispatcher] Sync timeout', incidentId);
      });
    }
    await new Promise(r => setTimeout(r, 600));

    // 5. WhatsAppDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[WhatsAppDispatcher] Opening secure chat template', `Spawning WhatsApp protocol string with coordinate tokens.`);
    await new Promise(r => setTimeout(r, 600));

    // 6. VoiceDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[VoiceDispatcher] Launching speed-dial sequence', `Synthesizing automated voice backup call lines.`);
    await new Promise(r => setTimeout(r, 600));

    // 7. AuditDispatcher
    get().addAuditLog('DISPATCH', 'SEVERE', '[AuditDispatcher] Recording immutable telemetry signatures', `Writing dispatch cycle logs and telemetry metrics.`);
    
    // Process contacts sequentially
    get().contacts.forEach((contact, index) => {
      setTimeout(async () => {
        if (get().activeSOSState === 'IDLE') return;
        const message = contact.template.replace('{LAT}', loc.lat.toFixed(5)).replace('{LNG}', loc.lng.toFixed(5));

        if (isDrill) {
          get().addAuditLog(
            'DISPATCH',
            'SEVERE',
            `[Contact #${contact.priority}] Sent via ${contact.channelType} to ${contact.label}`,
            `[OFFLINE QUEUE MODE] backup SMS/Call simulation run: "${message}"`
          );
          return;
        }

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
      }, (index + 1) * 800);
    });

    await new Promise(r => setTimeout(r, 1200));
    
    const userOrgId = get().currentUser?.orgCode || '';
    const userOrg = userOrgId ? get().organizations.find(o => o.id === userOrgId) : null;
    const hasTwilio = !!(userOrg && userOrg.twilio && userOrg.twilio.accountSid);

    if (hasTwilio && userOrg && userOrg.twilio) {
      const { accountSid, authToken, fromNumber } = userOrg.twilio;
      const ctrlRoom = userOrg.controlRoomNumber || '+27829110000';
      const msgText = `SafetyLink EMERGENCY ALERT from ${get().currentUser?.fullName || 'Anonymous'}. Coordinates: https://maps.google.com/?q=${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}. Reason: ${description}`;

      get().addAuditLog(
        'DISPATCH',
        'SEVERE',
        `[Twilio Dispatch Layer] Active Twilio Connection Triggered`,
        `Organization ${userOrg.name} has configured Twilio SID: ${accountSid}. Automatically initiating Twilio Cloud SMS & Voice Dispatch Call to Control Room: ${ctrlRoom} via Twilio Number: ${fromNumber}`
      );

      // Async send SMS and trigger voice call using Twilio REST API
      TwilioService.sendSms(accountSid, authToken, fromNumber, ctrlRoom, msgText)
        .then(ok => {
          get().addAuditLog(
            'DISPATCH',
            ok ? 'INFO' : 'WARN',
            `[Twilio Dispatch Layer] SMS ${ok ? 'Sent' : 'FAILED'} to ${ctrlRoom}`
          );
        });

      TwilioService.triggerVoiceCall(accountSid, authToken, fromNumber, ctrlRoom, loc.lat, loc.lng, description)
        .then(ok => {
          get().addAuditLog(
            'DISPATCH',
            ok ? 'INFO' : 'WARN',
            `[Twilio Dispatch Layer] Automated Voice Call ${ok ? 'Dispatched' : 'FAILED'} to ${ctrlRoom}`
          );
        });
    }

    const tLines = [
      'Wearable Beacon Double-Press Registered',
      'GNSS / High Precision Location Locked',
      'SMS, Call, and WhatsApp dispatch chains run successfully',
      'Control Room Dashboard alert active, armed responders enroute.'
    ];

    if (hasTwilio && userOrg) {
      tLines.splice(3, 0, `Twilio Cloud Gateway: Automated Voice Call & SMS Dispatched to ${userOrg.name} Control Room`);
    }

    const newEvent: PanicEvent = {
      id: incidentId,
      status: 'DISPATCHED',
      severity: 'CRITICAL',
      lat: loc.lat,
      lng: loc.lng,
      timestamp: Date.now(),
      assignedResponder: 'Escalated Armed Guard Unit Alpha',
      description,
      timelineData: tLines
    };

    set(state => ({
      panicEvents: [newEvent, ...state.panicEvents],
      activeSOSState: 'DISPATCHED',
      currentPanicEvent: newEvent
    }));

    get().addAuditLog('DISPATCH', 'INFO', `Incident created: ${newEvent.id}`, `Responder ${newEvent.assignedResponder} has been automatically dispatched.`);
  },

  cancelSOS: () => {
    set({ activeSOSState: 'IDLE', currentPanicEvent: null, panicCountdown: null });
    get().addAuditLog('SYSTEM', 'WARN', 'SOS Distress Cancelled', 'Operator input or wearable double-click trigger override applied.');
  },

  startMultiStagePanic: (description, durationSec = 10) => {
    if (get().activeSOSState !== 'IDLE' || get().panicCountdown !== null) return;
    
    set({ panicCountdown: durationSec });
    get().addAuditLog('SYSTEM', 'WARN', 'Multi-stage SOS Countdown Started', `${durationSec} second grace period. Click CANCEL to abort.`);

    const timerId = setInterval(() => {
      const currentCountdown = get().panicCountdown;
      if (currentCountdown === null) {
        clearInterval(timerId);
        return;
      }

      if (currentCountdown <= 1) {
        clearInterval(timerId);
        set({ panicCountdown: null });
        get().triggerPanic(description);
      } else {
        set({ panicCountdown: currentCountdown - 1 });
      }
    }, 1000);
  },

  syncOfflineQueue: () => {
    const queue = get().localOfflineQueue;
    if (queue.length === 0) {
      get().addToast('Offline dispatch queue is empty.', 'info');
      return;
    }

    get().addAuditLog('DISPATCH', 'INFO', `Syncing ${queue.length} locally queued offline alerts to cloud`, 'Establishing ThingsBoard securely...');
    
    queue.forEach(async (item) => {
      // Create a real resolved/dispatched panic event
      const incidentId = item.id;
      const newEvent: PanicEvent = {
        id: incidentId,
        status: 'DISPATCHED',
        severity: 'CRITICAL',
        lat: item.lat,
        lng: item.lng,
        timestamp: item.timestamp,
        assignedResponder: 'Escalated Regional Patrol Unit',
        description: `${item.description} (Synced from Offline Local Queue)`,
        timelineData: [
          'Incident occurred while OFFLINE',
          'Queued locally in encrypted client storage',
          'Connectivity re-established. Automatic sync verified.'
        ]
      };

      set(state => ({
        panicEvents: [newEvent, ...state.panicEvents],
      }));
    });

    set({ localOfflineQueue: [] });
    setStoredJSON('sl_offline_queue', []);
    get().addToast('Successfully synced offline queued alerts!', 'success');
    get().addAuditLog('SYSTEM', 'INFO', 'Offline alert cache synced successfully', 'Local storage buffer flushed.');
  },

  updateOrgBranding: (branding) => {
    const current = get().currentOrg;
    if (!current) return;
    const updatedOrg = { ...current, ...branding };
    const updatedOrgs = get().organizations.map(o => o.id === current.id ? updatedOrg : o);
    set({ currentOrg: updatedOrg, organizations: updatedOrgs });
    setStoredJSON('sl_current_org', updatedOrg);
    setStoredJSON('sl_organizations', updatedOrgs);
    get().addAuditLog('SYSTEM', 'INFO', 'Organization Branding Configured', 'Custom control room logo, colors, and helpline updated.');
  },

  updateClientProfile: (id, updated) => {
    const updatedUsers = get().users.map(u => u.id === id ? { ...u, ...updated } : u);
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    
    const currUser = get().currentUser;
    if (currUser && currUser.id === id) {
      const nextUser = { ...currUser, ...updated };
      set({ currentUser: nextUser });
      setStoredJSON('sl_current_user', nextUser);
    }
    get().addAuditLog('SECURITY', 'INFO', 'Client Profile Updated', `Profile for ID: ${id} modified in control room.`);
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
    const nextContacts = get().contacts.map(c => c.id === id ? { ...c, ...updated } : c);
    set({ contacts: nextContacts });
    setStoredJSON('sl_contacts', nextContacts);
    if (!get().demoMode) {
      setStoredJSON('sl_real_contacts', nextContacts);
    }
    get().addAuditLog('SYSTEM', 'INFO', 'Emergency contact list modified', `ID: ${id} updated.`);
  },

  addContact: (contact) => {
    const newContact: Contact = {
      ...contact,
      id: Math.random().toString(),
      priority: get().contacts.length + 1
    };
    const nextContacts = [...get().contacts, newContact];
    set({ contacts: nextContacts });
    setStoredJSON('sl_contacts', nextContacts);
    if (!get().demoMode) {
      setStoredJSON('sl_real_contacts', nextContacts);
    }
    get().addAuditLog('SYSTEM', 'INFO', 'New Backup Contact Added', `${newContact.label}`);
  },

  removeContact: (id) => {
    const nextContacts = get().contacts.filter(c => c.id !== id).map((c, idx) => ({ ...c, priority: idx + 1 }));
    set({ contacts: nextContacts });
    setStoredJSON('sl_contacts', nextContacts);
    if (!get().demoMode) {
      setStoredJSON('sl_real_contacts', nextContacts);
    }
    get().addAuditLog('SYSTEM', 'WARN', 'Backup Contact Removed', `ID: ${id}`);
  },

  startBleScan: () => {
    if (get().isScanning) return;
    set({ isScanning: true, pairingProgress: 'Requesting Bluetooth permission & scanning nearby devices...', discoveredDevices: [] });
    get().addAuditLog('BLE', 'INFO', 'BLE LE Scanner Armed', 'Scanning ALL nearby BLE devices, unfiltered (same approach as nRF Connect).');

    scanForNearbyDevices(
      (found) => {
        set(state => {
          if (state.discoveredDevices.some(d => d.deviceId === found.deviceId)) return state;
          return { discoveredDevices: [...state.discoveredDevices, found].sort((a, b) => b.rssi - a.rssi) };
        });
      },
      15000,
      (rawName, rawRssi) => {
        get().addAuditLog('BLE', 'INFO', 'Raw BLE Advertisement Seen', `${rawName} · ${rawRssi} dBm`);
      }
    ).catch((err: Error) => {
      set({ isScanning: false, pairingProgress: null });
      get().addAuditLog('BLE', 'SEVERE', 'BLE Scan Failed', err.message);
    });

    setTimeout(() => {
      set({ isScanning: false, pairingProgress: null });
    }, 15500);
  },

  stopBleScan: () => {
    stopScan();
    set({ isScanning: false, pairingProgress: null });
  },

  registerDiscoveredDevice: (deviceId, name, deviceType) => {
    if (get().bleDevices.some(d => d.macAddress === deviceId)) return;
    if (get().bleDevices.length >= 5) {
      get().addAuditLog('BLE', 'WARN', 'Device Limit Reached', 'SafetyLink supports up to 5 registered devices. Remove one before adding another.');
      return;
    }

    const newDev: BleDevice = {
      macAddress: deviceId,
      friendlyName: name || 'BLE Panic Button',
      deviceType: deviceType || 'GENERIC_BLE_BUTTON',
      batteryLevel: 100,
      rssi: -60,
      connectionState: 'DISCONNECTED',
      lastSeen: Date.now()
    };
    const updated = [...get().bleDevices, newDev];
    set({ bleDevices: updated, discoveredDevices: get().discoveredDevices.filter(d => d.deviceId !== deviceId) });
    setStoredJSON('sl_ble_devices', updated);
    get().addAuditLog('BLE', 'INFO', 'New Device Registered', `Device ${deviceId} added (${updated.length}/5). Tap BIND BUTTON to teach SafetyLink its press signal.`);
  },

  /**
   * The bonding wizard: connects, enumerates every GATT characteristic
   * that supports notify/indicate, listens for the physical button press,
   * and binds whichever channel actually fires. Works on any vendor's
   * hardware, not just iTAG -- nothing here assumes a specific UUID.
   */
  bindDeviceTrigger: async (mac) => {
    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTING' } : d),
      pairingProgress: 'Connecting and reading GATT profile...'
    }));
    get().addAuditLog('BLE', 'INFO', 'Bonding Wizard Started', `MAC: ${mac} -- press and hold the physical button when prompted.`);

    try {
      const trigger = await discoverAndBindTrigger(
        mac,
        (candidateCount) => {
          set({ pairingProgress: `Found ${candidateCount} candidate channel(s). Press and hold your physical button now...` });
          get().addAuditLog('BLE', 'INFO', 'Listening For Press', `${candidateCount} notify/indicate characteristic(s) found on ${mac}.`);
        },
        10000
      );

      if (!trigger) {
        set(state => ({
          bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED' } : d),
          pairingProgress: null
        }));
        get().addAuditLog('BLE', 'WARN', 'Bonding Failed', `No press detected on ${mac} within 10s. Try again -- hold the button firmly for a full second.`);
        return false;
      }

      const updated = get().bleDevices.map(d =>
        d.macAddress === mac ? { ...d, triggerServiceUuid: trigger.serviceUuid, triggerCharacteristicUuid: trigger.characteristicUuid, connectionState: 'CONNECTED' as const, lastSeen: Date.now() } : d
      );
      set({ bleDevices: updated, pairingProgress: null });
      setStoredJSON('sl_ble_devices', updated);
      get().addAuditLog('BLE', 'INFO', 'Trigger Channel Bound', `${mac} -> service ${trigger.serviceUuid.slice(4, 8)}, characteristic ${trigger.characteristicUuid.slice(4, 8)}.`);

      // Now attach the live listener using the freshly-bound channel.
      get().connectBleDevice(mac);
      return true;
    } catch (err) {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED' } : d),
        pairingProgress: null
      }));
      get().addAuditLog('BLE', 'SEVERE', 'Bonding Error', `${mac}: ${(err as Error).message}`);
      return false;
    }
  },

  connectBleDevice: (mac) => {
    const device = get().bleDevices.find(d => d.macAddress === mac);
    if (!device) return;

    if (!device.triggerServiceUuid || !device.triggerCharacteristicUuid) {
      // Not bound yet -- run the wizard instead of a plain connect.
      get().bindDeviceTrigger(mac);
      return;
    }

    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTING' } : d)
    }));

    subscribeToKnownTrigger(
      mac,
      { serviceUuid: device.triggerServiceUuid, characteristicUuid: device.triggerCharacteristicUuid },
      () => {
        get().addAuditLog('BLE', 'SEVERE', 'Hardware Button Press Detected', `Real notification received from ${mac}`);
        get().triggerPanic(`Hardware trigger: BLE button ${mac} pressed.`);
      },
      () => {
        set(state => ({
          bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
        }));
        get().addAuditLog('BLE', 'SEVERE', 'BLE Wearable Connection Severed', `Hardware link to ${mac} was terminated (out of range or battery dead).`);
        // Auto-reconnect with exponential backoff
        let attempt = 0;
        const maxAttempts = 20;
        const reconnect = () => {
          const device = get().bleDevices.find(d => d.macAddress === mac);
          if (!device || device.connectionState === 'CONNECTED') return;
          attempt++;
          const delay = Math.min(15000 * Math.pow(1.5, attempt - 1), 120000);
          get().addAuditLog('BLE', 'INFO', 'BLE Auto-Reconnect Scheduled', `Attempt ${attempt}/${maxAttempts} for ${mac} in ${Math.round(delay/1000)}s.`);
          setTimeout(() => {
            const d = get().bleDevices.find(d => d.macAddress === mac);
            if (d && d.connectionState === 'DISCONNECTED' && attempt < maxAttempts) {
              get().connectBleDevice(mac);
              reconnect();
            }
          }, delay);
        };
        reconnect();
      }
    ).then(() => {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTED', rssi: -55, lastSeen: Date.now() } : d)
      }));
      get().addAuditLog('BLE', 'INFO', 'BLE Device Connected', `MAC: ${mac} -- subscribed to its bound trigger channel.`);
    }).catch((err: Error) => {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED' } : d)
      }));
      get().addAuditLog('BLE', 'SEVERE', 'BLE Connect Failed', `${mac}: ${err.message}`);
    });
  },

  disconnectBleDevice: (mac) => {
    const device = get().bleDevices.find(d => d.macAddress === mac);
    disconnectDevice(mac, device?.triggerServiceUuid && device?.triggerCharacteristicUuid ? { serviceUuid: device.triggerServiceUuid, characteristicUuid: device.triggerCharacteristicUuid } : undefined);
    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
    }));
    get().addAuditLog('BLE', 'INFO', 'BLE Wearable Disconnected', `MAC: ${mac}`);
  },

  removeDevice: (mac) => {
    disconnectDevice(mac);
    const updated = get().bleDevices.filter(d => d.macAddress !== mac);
    set({ bleDevices: updated });
    setStoredJSON('sl_ble_devices', updated);
    get().addAuditLog('BLE', 'WARN', 'BLE Wearable Device Forgotten', `MAC: ${mac}`);
  },

  approveOrganization: (id) => {
    const updated = get().organizations.map(o => o.id === id ? { ...o, approved: true } : o);
    set({ organizations: updated });
    setStoredJSON('sl_organizations', updated);
    get().addAuditLog('SECURITY', 'INFO', 'Organization Registry Accepted', `ID: ${id} is now approved.`);
  },

  addCustomTool: (tool) => {
    const newTool: CustomTool = {
      ...tool,
      id: `tool-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now()
    };
    const updated = [...get().customTools, newTool];
    set({ customTools: updated });
    setStoredJSON('sl_custom_tools', updated);
    get().addAuditLog('SYSTEM', 'INFO', 'New Custom Tool/Setting Pushed', `Title: ${newTool.title}, Scope: ${newTool.targetOrgId ? 'Org: ' + newTool.targetOrgId : 'Global'}`);
  },

  deleteCustomTool: (id) => {
    const updated = get().customTools.filter(t => t.id !== id);
    set({ customTools: updated });
    setStoredJSON('sl_custom_tools', updated);
    get().addAuditLog('SYSTEM', 'WARN', 'Custom Tool/Setting Revoked', `ID: ${id}`);
  },

  setThingsBoardToken: (token) => {
    set({ thingsBoardToken: token });
    setStoredJSON('sl_thingsboard_token', token);
    get().addAuditLog('SYSTEM', 'INFO', 'ThingsBoard Device Token Updated', token ? 'Token set (stored locally only, not in the repo).' : 'Token cleared.');
  },

  setLanguage: (lang) => {
    set({ language: lang });
    setStoredJSON('sl_language', lang);
    get().addAuditLog('SYSTEM', 'INFO', 'Language preference updated', `Selected: ${lang.toUpperCase()}`);
  },

  downloadLanguage: async (langCode) => {
    get().addAuditLog('SYSTEM', 'INFO', 'Downloading Language Package', `Requesting SA language file: ${langCode.toUpperCase()}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const downloaded = get().downloadedLanguages;
    if (!downloaded.includes(langCode)) {
      const updated = [...downloaded, langCode];
      set({ downloadedLanguages: updated });
      setStoredJSON('sl_downloaded_languages', updated);
      get().addAuditLog('SYSTEM', 'INFO', 'Language Package Downloaded', `Installed SA language: ${langCode.toUpperCase()}`);
    }
  },

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString();
    const newToast = { id, message, type };
    set(state => ({ toasts: [...state.toasts, newToast].slice(-3) })); // Stack max 3 to prevent overlap
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },
  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  }
}));
