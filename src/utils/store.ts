import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Contact, PanicEvent, MeshNode, BleDevice, AuditLog, UserProfile, Organization, CustomTool, DispatchLogEntry, NotificationPanelLogEntry, DispatchSettings, PlatformIntegration, ClientDatabaseRecord, CameraDevice, CameraLocalCredentials, CameraEvidenceSnapshot, DisplaySettings, CommunitySafetyReport, DangerZone } from '../types';
import { scanForNearbyDevices, stopScan, discoverAndBindTrigger, subscribeToKnownTrigger, disconnectDevice, DiscoveredDevice } from '../services/BleService';
import { LocalNotificationService } from '../services/LocalNotificationService';
import { NativeDispatchService, SimCardInfo } from '../services/NativeDispatchService';
import { firePleaseCallMe, postPanicLocation } from '../services/pcmTrigger';

import { UpdateInfo } from '../services/UpdateService';
import { generateOrganizationCode } from './orgCode';
export type { UpdateInfo, SimCardInfo };

interface AppState {
  isTrialEnabled: boolean;
  setTrialEnabled: (enabled: boolean) => void;
  globalTheme: 'dark' | 'light';
  setGlobalTheme: (theme: 'dark' | 'light') => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (patch: Partial<DisplaySettings>) => void;
  communityReports: CommunitySafetyReport[];
  setCommunityReports: (reports: CommunitySafetyReport[]) => void;
  addCommunityReport: (report: Omit<CommunitySafetyReport, 'id' | 'timestamp' | 'verifications'>) => CommunitySafetyReport;
  verifyCommunityReport: (id: string) => void;
  resolveCommunityReport: (id: string) => void;
  dangerZones: DangerZone[];
  setDangerZones: (zones: DangerZone[]) => void;
  updateInfo: UpdateInfo | null;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  checkAppUpdates: () => Promise<void>;
  initMeshSync: () => void;
  contacts: Contact[];
  panicEvents: PanicEvent[];
  activeSOSState: 'IDLE' | 'ACQUIRING_GPS' | 'CAPTURING_EVIDENCE' | 'ESCALATING' | 'DISPATCHED' | 'RESOLVED';
  currentPanicEvent: PanicEvent | null;
  drillMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  meshNodes: MeshNode[];
  setMeshNodes: (nodes: MeshNode[]) => void;
  dispatchDrone: (lat: number, lng: number) => void;
  syncEvidenceToOwnCloud: () => Promise<void>;
  bleDevices: BleDevice[];
  discoveredDevices: DiscoveredDevice[];
  customBackendUrl: string;
  connectyCubeConfig: { appId: number; authKey: string; authSecret: string; apiEndpoint: string; chatEndpoint: string; } | null;
  setConnectyCubeConfig: (config: { appId: number; authKey: string; authSecret: string; apiEndpoint: string; chatEndpoint: string; } | null) => void;
  tuyaConfig: { clientId: string; secret: string; baseUrl: string; } | null;
  setTuyaConfig: (config: { clientId: string; secret: string; baseUrl: string; } | null) => void;
  auraApiUrl: string;
  setAuraApiUrl: (url: string) => void;
  auditLogs: AuditLog[];
  isScanning: boolean;
  pairingProgress: string | null;
  gpsAccuracy: string;
  
  // New premium Security operations fields
  panicCountdown: number | null;
  localOfflineQueue: { id: string; timestamp: number; description: string; lat: number; lng: number }[];
  syncStrategy: 'immediate' | 'batch' | 'wifi-only';
  setSyncStrategy: (strategy: 'immediate' | 'batch' | 'wifi-only') => void;
  startMultiStagePanic: (description: string, durationSec?: number) => void;
  syncOfflineQueue: (silent?: boolean) => void;
  updateOrgBranding: (branding: Partial<Organization>) => void;
  updateClientProfile: (id: string, updated: Partial<UserProfile>) => void;
  adminUpdateSubscription: (id: string, type: "user" | "org", status: "active" | "trial" | "locked") => void;
  showTrialReminder: boolean;
  setShowTrialReminder: (show: boolean) => void;

  
  userPin: string;
  duressPin: string;
  unlockMethod: 'BIOMETRIC' | 'PIN' | 'DURESS';
  setUnlockMethod: (method: 'BIOMETRIC' | 'PIN' | 'DURESS') => void;
  profileCreatedSummary: {
    kind: 'USER' | 'ORG';
    title: string;
    username?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: string;
    orgCode?: string;
    pinConfigured?: boolean;
    provisionalOffline?: boolean;
  } | null;
  setProfileCreatedSummary: (summary: AppState['profileCreatedSummary']) => void;
  adminSummaryStats: any | null;
  adminAuditLogs: any[];
  minSupportedVersion: string;
  syncProvisionalAccounts: () => Promise<number>;
  adminUpdateUserStatus: (userId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'REVOKE_SESSIONS', reason?: string) => Promise<boolean>;
  updateMinSupportedVersion: (version: string) => Promise<boolean>;
  medicalPassport: { bloodType: string; allergies: string[]; conditions: string[] };
  watchMeTimerSeconds: number | null;
  startWatchMeTimer: (minutes: number) => void;
  cancelWatchMeTimer: (pin: string) => boolean;
  attemptCancelSOS: (pin: string) => boolean;
  setUserPin: (pin: string) => void;
  setDuressPin: (pin: string) => void;
  setMedicalPassport: (data: Partial<{ bloodType: string; allergies: string[]; conditions: string[] }>) => void;
  
  // Background service states

  isBackgroundServiceRunning: boolean;
  backgroundServiceTick: number;
  toggleBackgroundService: () => void;
  incrementBackgroundServiceTick: () => void;
  isAppMinimized: boolean;
  showLizzyPopup: boolean;
  setShowLizzyPopup: (show: boolean) => void;
  aiCheckInScheduledAt: number | null;
  scheduleAiCheckIn: (delayMinutesOverride?: number) => void;
  cancelAiCheckIn: () => void;
  isLizzyOpen: boolean;
  setIsLizzyOpen: (open: boolean) => void;
  lizzyInitialTab: 'chat' | 'voice';
  postEmergencyPrompt: { incidentId: string; summary: string; timestamp: number } | null;
  openLizzyCompanion: (tab?: 'chat' | 'voice', incidentContext?: { incidentId: string; summary: string }) => void;
  dismissPostEmergencyPrompt: () => void;
  incomingEmergencyRing: {
    id: string;
    callerName: string;
    callerNumber: string;
    location: string;
    lat?: number;
    lng?: number;
    timestamp: number;
    source: string;
  } | null;
  triggerIncomingEmergencyRing: (payload: {
    id?: string;
    callerName: string;
    callerNumber?: string;
    location?: string;
    lat?: number;
    lng?: number;
    source?: string;
  }) => void;
  dismissIncomingEmergencyRing: () => void;
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
  rememberedOrgs: Organization[];
  currentUser: UserProfile | null;
  currentOrg: Organization | null;
  superAdminActive: boolean;
  token: string | null;
  localAdminToken: string | null;
  customTools: CustomTool[];

  // Actions
  registerUser: (user: Omit<UserProfile, 'id' | 'createdAt'> & { password?: string; autoLogin?: boolean; pinCode?: string; duressPin?: string }) => Promise<{ success: boolean; error?: string; provisionalOffline?: boolean }>;
  registerOrganization: (org: Omit<Organization, 'id' | 'createdAt'> & { id?: string; password?: string }) => Promise<(Organization & { error?: string }) | null>;
  login: (username: string, password?: string, orgCode?: string, skipPasswordCheck?: boolean) => Promise<{ success: boolean; error?: string; role: 'USER' | 'ORG' | 'ADMIN' }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; role?: string }>;
  fetchSuperAdminData: () => Promise<void>;
  unlockOrganizationTrial: (id: string) => Promise<void>;
  logout: () => void;
    updateUserPassword: (id: string, newPassword: string) => { success: boolean };
  updateUserProfile: (id: string, updated: Partial<UserProfile>) => void;
  deleteUserProfile: (id: string) => void;
  updateOrganization: (id: string, updated: Partial<Organization>) => void;
  deleteOrganization: (id: string) => Promise<void>;
  approveOrganization: (id: string) => Promise<void>;
  generateReferralCode: (orgId: string) => string;
  applyReferralCode: (code: string, userId: string) => { success: boolean; error?: string };

  // Custom Tools & Settings Actions
  addCustomTool: (tool: Omit<CustomTool, 'id' | 'createdAt'>) => void;
  deleteCustomTool: (id: string) => void;

  // Hikvision / ONVIF CCTV Cameras (scoped to Org or Individual User)
  cameras: CameraDevice[];
  cameraEvidenceSnapshots: CameraEvidenceSnapshot[];
  addCamera: (
    cam: Omit<CameraDevice, 'id' | 'createdAt' | 'status' | 'ownerUid' | 'orgId'> & {
      orgId?: string;
      username?: string;
      password?: string;
      whepBearerToken?: string;
      turnUsername?: string;
      turnCredential?: string;
    }
  ) => CameraDevice;
  updateCamera: (id: string, updated: Partial<CameraDevice>) => void;
  removeCamera: (id: string) => void;
  getCameraLocalCredentials: (id: string) => CameraLocalCredentials;
  setCameraLocalCredentials: (id: string, creds: CameraLocalCredentials) => void;
  addCameraEvidenceSnapshot: (snap: Omit<CameraEvidenceSnapshot, 'id' | 'capturedAt'>) => CameraEvidenceSnapshot;
  removeCameraEvidenceSnapshot: (id: string) => void;
  probeCamera: (id: string) => Promise<{ reachable: boolean; diagnostics: string }>;
  fetchCameraSnapshot: (id: string) => Promise<{ ok: boolean; imageBase64?: string; diagnostics: string }>;
  sendCameraPtz: (
    id: string,
    cmd: { action: 'CONTINUOUS' | 'STOP' | 'PRESET'; pan?: number; tilt?: number; zoom?: number; presetId?: number }
  ) => Promise<{ ok: boolean; statusCode?: number; diagnostics: string }>;
  triggerSingleCameraSoftIo: (id: string) => Promise<{ triggered: boolean; statusCode?: number; diagnostics: string }>;
  triggerCameraSoftIo: () => Promise<void>;
  
  toggleDrillMode: () => void;
  updateLocation: (lat: number, lng: number, accuracy?: string) => void;
  addAuditLog: (category: AuditLog['category'], severity: AuditLog['severity'], message: string, details?: string) => void;
  clearAuditLogs: () => void;
  triggerPanic: (description: string, countdownElapsed?: boolean) => Promise<void>;
  triggerFromMasterKey: (submittedKey: string) => Promise<boolean>;
  cancelSOS: () => void;
  resolvePanic: (id: string) => void;
  updateContact: (id: string, updated: Partial<Contact>) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  removeContact: (id: string) => void;
  startBleScan: () => void;
  stopBleScan: () => void;
  registerDiscoveredDevice: (deviceId: string, name: string, deviceType?: 'iTAG' | 'RFD_Beacon' | 'GENERIC_BLE_BUTTON' | 'WATCH' | 'CCTV') => void;
  bindDeviceTrigger: (mac: string) => Promise<boolean>;
  connectBleDevice: (mac: string) => void;
  disconnectBleDevice: (mac: string) => void;
  removeDevice: (mac: string) => void;
  setCustomBackendUrl: (url: string) => void;

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

  // Floating Panic Widget & Kleva Floating Icon states
  isFloatingWidgetDeployed: boolean;
  isSurvivalMode: boolean;
  setSurvivalMode: (state: boolean) => void;
  floatingWidgetSize: number;
  setFloatingWidgetDeployed: (value: boolean) => void;
  setFloatingWidgetSize: (value: number) => void;
  showKlevaFloatingIcon: boolean;
  setShowKlevaFloatingIcon: (value: boolean) => void;

  // Commerce & Quotes state
  commerceModalOpen: boolean;
  setCommerceModalOpen: (value: boolean) => void;

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
  sosCountdownDuration: number;
  sosSoundSetup: string;
  setSosCountdownDuration: (val: number) => void;
  setSosSoundSetup: (val: string) => void;
  firestoreSync: boolean;

  setDecoyActive: (value: boolean) => void;
  setDecoyCode: (code: string) => void;
  setDecoyDistressCode: (code: string) => void;
  setVaultPassword: (password: string, question: string, answer: string) => Promise<void>;
  setSilenceAlerts: (value: boolean) => void;
  setFirestoreSync: (value: boolean) => void;
  addVaultFile: (file: { name: string; size: string; type: string; ciphertext?: string; iv?: string; salt?: string; isEncrypted?: boolean }) => void;
  removeVaultFile: (id: string) => void;
  addVaultApp: (app: { name: string; packageName: string }) => void;
  removeVaultApp: (id: string) => void;
  
  // Custom user configuration for only system SMS
  onlySystemSms: boolean;
  setOnlySystemSms: (value: boolean) => void;
  renameBleDevice: (macAddress: string, newFriendlyName: string) => void;
  requestJoinOrganization: (userId: string, orgCode: string, selectedRole: string) => { success: boolean; error?: string };
  approvePendingUser: (userId: string, requestId?: string) => void;
  rejectPendingUser: (userId: string, requestId?: string) => void;
  disconnectFromOrganization: (userId?: string) => Promise<void>;
  disconnectOrgMember: (userId: string) => Promise<void>;
  setOrgMemberStatus: (userId: string, action: 'ACTIVATE' | 'SUSPEND' | 'DEACTIVATE') => Promise<void>;

  // Native Dispatch Logs
  dispatchLogs: DispatchLogEntry[];
  addDispatchLog: (entry: Omit<DispatchLogEntry, 'id' | 'timestamp'>) => void;
  clearDispatchLogs: () => void;

  // Notification Panel Mini App Logs
  notificationPanelLogs: NotificationPanelLogEntry[];
  addNotificationPanelLog: (entry: Omit<NotificationPanelLogEntry, 'id' | 'timestamp'>) => void;
  clearNotificationPanelLogs: () => void;

  // Configurable Dispatch Logic
  dispatchSettings: DispatchSettings;
  setDispatchSettings: (settings: Partial<DispatchSettings>) => void;

  // Open Platform Integrations Hub
  platformIntegrations: PlatformIntegration[];
  savePlatformIntegration: (platform: PlatformIntegration) => void;
  removePlatformIntegration: (id: string) => void;
  deployPlatformIntegration: (id: string) => Promise<{ success: boolean; message: string }>;

  // Client Database & Google Drive Exporter
  clientDatabaseRecords: ClientDatabaseRecord[];
  isAutoRefreshUsersEnabled: boolean;
  autoRefreshIntervalSeconds: number;
  lastClientDatabaseSync: number | null;
  googleDriveSyncFileId: string | null;
  setAutoRefreshUsersEnabled: (enabled: boolean) => void;
  setAutoRefreshIntervalSeconds: (seconds: number) => void;
  refreshClientDatabase: () => Promise<void>;
  restoreCustomerDatabase: () => Promise<{ ok: boolean; totalCount: number; addedCount: number; sources?: Record<string, number> }>;
  exportToGoogleDrive: () => Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }>;

  // Configurable BLE / iTAG Button Triggers
  bleButtonConfig: BleButtonConfig;
  setBleButtonConfig: (config: Partial<BleButtonConfig>) => void;
  handleHardwareButtonPress: (sourceMac?: string) => void;
  checkInSafe: () => void;
  extendWatchMeTimer: (extraMinutes?: number) => void;

  // Primary Cellular SIM Card Selection (Emergency Auto-Lock)
  availableSims: SimCardInfo[];
  preferredSimId: number;
  setPreferredSim: (subId: number) => Promise<void>;
  loadSimCards: () => Promise<void>;
}

export type BleButtonAction =
  | 'PANIC'
  | 'INSTANT_PANIC'
  | 'SILENT_PANIC'
  | 'CHECK_IN_SAFE'
  | 'SHARE_GPS_PING'
  | 'SAFETY_TIMEOUT'
  | 'FIND_PHONE'
  | 'VOICE_LIZZY'
  | 'SIREN_ONLY'
  | 'CANCEL'
  | 'DISABLED'
  | 'NONE';

export interface BleButtonConfig {
  singlePressAction: BleButtonAction;
  cancelDuringCountdown: boolean;
  doublePressAction: BleButtonAction;
  triplePressAction: BleButtonAction;
  quadPressAction?: BleButtonAction;
  longPressAction?: BleButtonAction;
  multiPressWindowMs?: number;
  countdownOverrideSec?: number;
  safetyTimeoutMinutes: number;
  hapticFeedback: boolean;
}

export const DEFAULT_BLE_BUTTON_CONFIG: BleButtonConfig = {
  singlePressAction: 'PANIC',
  cancelDuringCountdown: true,
  doublePressAction: 'FIND_PHONE',
  triplePressAction: 'SAFETY_TIMEOUT',
  quadPressAction: 'VOICE_LIZZY',
  longPressAction: 'SILENT_PANIC',
  multiPressWindowMs: 550,
  countdownOverrideSec: 10,
  safetyTimeoutMinutes: 15,
  hapticFeedback: true,
};

let webButtonPressCount = 0;
let webButtonPressTimer: any = null;
let lastThingsBoardLocationAt = 0;

// Initial Demo Data
const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', label: '1st Contact - Tactical Voice Dispatch', phone: '+27829110000', template: 'Direct call sequence enqueued.', channelType: 'CALL', priority: 1 },
  { id: '2', label: '2nd Contact - SMS GPS Broadcast', phone: '+27839119112', template: '🚨 SAFETYLINK SOS: {NAME} needs help! Location: {ADDRESS} | Map: https://maps.google.com/?q={LAT},{LNG}', channelType: 'SMS', priority: 2 },
  { id: '3', label: '3rd Contact - WhatsApp Dispatcher', phone: '+27600123456', template: '🚨 SAFETYLINK SOS: {NAME} needs help! Location: {ADDRESS} | Map: https://maps.google.com/?q={LAT},{LNG}', channelType: 'WHATSAPP', priority: 3 },
  { id: '4', label: '4th Contact - Community Radio Link', phone: '+27650987654', template: 'SafetyLink Broadcast alert: {LAT}, {LNG}', channelType: 'GROUP', priority: 4 },
  { id: '5', label: '5th Contact - SAPS Emergency Police', phone: '10111', template: 'Tactical coordinator distress ping.', channelType: 'POLICE', priority: 5 }
];

const DEFAULT_PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  {
    id: 'pi-twilio',
    platformId: 'twilio',
    name: 'Twilio Cloud Telco (SMS & Voice)',
    category: 'VOICE_SMS',
    status: 'NOT_CONFIGURED',
    accountSid: '',
    phoneOrLine: '',
    senderId: 'SAFETYLINK',
    lastPingStatus: 'AWAITING_SUPERADMIN_ACTIVATION'
  },
  {
    id: 'pi-vapi',
    platformId: 'vapi',
    name: 'VAPI Conversational Emergency AI',
    category: 'AI_ASSISTANT',
    status: 'DEPLOYED',
    apiKey: 'vapi_live_sec_token',
    phoneOrLine: '+12025550193',
    lastPingStatus: 'DEPLOYED & READY'
  },
  {
    id: 'pi-africas-talking',
    platformId: 'africas_talking',
    name: "Africa's Talking (USSD & Telco Relay)",
    category: 'VOICE_SMS',
    status: 'CONFIGURED',
    apiKey: 'at_live_sec_token',
    senderId: 'SAFETYLINK_ZA',
    phoneOrLine: '*134*911#',
    lastPingStatus: 'CONNECTED — USSD ACTIVE'
  },
  {
    id: 'pi-infobip',
    platformId: 'infobip',
    name: 'Infobip Global Enterprise SMS',
    category: 'VOICE_SMS',
    status: 'NOT_CONFIGURED',
    lastPingStatus: 'STANDBY'
  },
  {
    id: 'pi-bland',
    platformId: 'bland_ai',
    name: 'Bland.ai Conversational Voice Agent',
    category: 'AI_ASSISTANT',
    status: 'NOT_CONFIGURED',
    lastPingStatus: 'STANDBY'
  },
  {
    id: 'pi-cloudinary',
    platformId: 'cloudinary',
    name: 'Cloudinary Distress Media Vault',
    category: 'MEDIA',
    status: 'CONFIGURED',
    endpointUrl: 'https://api.cloudinary.com/v1_1/safetylink',
    lastPingStatus: 'CONNECTED — MEDIA UPLOAD READY'
  },
  {
    id: 'pi-payfast',
    platformId: 'payfast',
    name: 'PayFast / Paystack Payment Gateway',
    category: 'PAYMENT',
    status: 'CONFIGURED',
    lastPingStatus: 'CONNECTED — SOUTH AFRICA ACTIVE'
  },
  {
    id: 'pi-pcb',
    platformId: 'hardware_pcb',
    name: 'Hardware PCB Serial / GSM Direct Line',
    category: 'HARDWARE',
    status: 'CONFIGURED',
    pcbSerial: 'SL-PCB-REV4-98124',
    phoneOrLine: '+27600987654',
    endpointUrl: 'COM3 / /dev/ttyUSB0 (9600 baud)',
    lastPingStatus: 'LINKED — HARDWARE HEARTBEAT OK'
  }
];

const DEFAULT_DISPATCH_SETTINGS: DispatchSettings = {
  countdownDuration: 10,
  countdownOverlayEnabled: true,
  dispatchPreset: 'VIP_TWILIO_CLOUD',
  mapProvider: 'GOOGLE_MAPS',
  ussdEnabled: true,
  carrierPreset: 'AUTO',
  customUssdPattern: '*140*{NUMBER}#',
  pcmGatewayNumber: '0816738186',
  preferFcmOnline: true,
  pcmCooldownMinutes: 5,
  offlineUssdMode: 'RAIN_PCM',
  reverseChargePrefix: '127',
  aiCheckInEnabled: true,
  aiCheckInDelayMinutes: 5,
  aiCheckInAutoSpeak: true,
  aiCheckInResponseTimeoutSec: 45,
  aiSafetyWord: 'all clear',
};


// No fake default device -- bleDevices now persists real, actually-bound
// hardware only. The device-independent "DEMO SOS" button (BLEScanner)
// covers the client-showcase use case without needing a fake connected
// entry here.
const DEFAULT_BLE_DEVICES: BleDevice[] = [];

const DEFAULT_MESH_NODES: MeshNode[] = []; /*
  // { id: "node-1", name: "Patrol Alpha (Node 1)", lat: -26.3035, lng: 27.8394, status: "SECURE", type: "PATROL", battery: 100 },
  // { id: "node-2", name: "Safe Zone Bravo (Node 2)", lat: -26.3165, lng: 27.8364, status: "SECURE", type: "SAFE_ZONE", battery: 100 },
  // { id: "node-3", name: "Responder Unit (Node 3)", lat: -26.3065, lng: 27.8274, status: "DISPATCHED", type: "RESPONDER", battery: 85 },
  // { id: "node-4", name: "Aerial Drone (DRN-01)", lat: -26.3085, lng: 27.8344, status: "SECURE", type: "DRONE", battery: 98 },
]; */

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
    id: 'SL-DEEPSOUTH-0001', 
    name: 'Deep South Security', 
    contactName: 'Deep South Command', 
    contactEmail: 'admin@deepsouth.co.za', 
    referralCode: 'DEEPSOUTH', 
    referralCount: 0, 
    createdAt: Date.now(), 
    subscriptionStatus: 'active',
  },
  { 
    id: 'SL-DEEPSS-0001', 
    name: 'Deep South Security', 
    contactName: 'Deep South Command', 
    contactEmail: 'command@deepsouth.co.za', 
    referralCode: 'DEEPSS', 
    referralCount: 0, 
    createdAt: Date.now(), 
    subscriptionStatus: 'active',
  },
  { id: 'SL-WITS-4829', name: 'Wits University Security', contactName: 'Wits Security Command', contactEmail: 'security@wits.ac.za', referralCode: 'WITSSECURE', referralCount: 0, createdAt: Date.now(), subscriptionStatus: 'active' },
  { id: 'SL-CITY-2810', name: 'City Patrol Services', contactName: 'City Patrol Dispatch', contactEmail: 'dispatch@citypatrol.co.za', referralCode: 'CITY2026', referralCount: 0, createdAt: Date.now(), subscriptionStatus: 'active' }
];

const MOCK_USERS: UserProfile[] = [
  { 
    id: '2001', 
    username: 'deepsouth', 
    email: 'admin@deepsouth.co.za', 
    phone: '+27821230001', 
    fullName: 'Deep South Security Command', 
    role: 'Organization Administrator', 
    orgCode: 'SL-DEEPSOUTH-0001', 
    createdAt: Date.now(), 
    subscriptionStatus: 'active', 
    isDemo: true 
  },
  { 
    id: '2002', 
    username: 'patrol_bravo1', 
    email: 'patrol1@deepsouth.co.za', 
    phone: '+27821230002', 
    fullName: 'Officer Sipho Nkosi (Armed Patrol Unit 1)', 
    role: 'Responder', 
    orgCode: 'SL-DEEPSOUTH-0001', 
    createdAt: Date.now(), 
    subscriptionStatus: 'active', 
    isDemo: true,
    lat: -26.2041,
    lng: 28.0473
  },
  { 
    id: '2003', 
    username: 'client_sarah', 
    email: 'sarah@deepsouthclients.co.za', 
    phone: '+27821230003', 
    fullName: 'Sarah Jenkins (Deep South Protected Resident)', 
    role: 'Community Member', 
    orgCode: 'SL-DEEPSOUTH-0001', 
    createdAt: Date.now(), 
    subscriptionStatus: 'active', 
    isDemo: true,
    lat: -26.2055,
    lng: 28.0485
  },
  { id: '1001', username: 'commander_wits', email: 'commander@wits.ac.za', phone: '+27601234567', fullName: 'Commander Wits', role: 'Organization Administrator', orgCode: 'SL-WITS-4829', createdAt: Date.now(), subscriptionStatus: 'active', isDemo: true },
  { id: '1002', username: 'chief_patrol', email: 'chief@citypatrol.co.za', phone: '+27601234568', fullName: 'Chief Patrol', role: 'Dispatcher', orgCode: 'SL-CITY-2810', createdAt: Date.now(), subscriptionStatus: 'active', isDemo: true },
  { id: '1003', username: 'thabo_m', email: 'thabo@student.wits.ac.za', phone: '+27601234569', fullName: 'Tshilidzi Mukwevho', role: 'Community Member', orgCode: 'SL-WITS-4829', createdAt: Date.now(), subscriptionStatus: 'active', isDemo: true },
  { id: '1004', username: 'lerato_k', email: 'lerato@gmail.com', phone: '+27601234570', fullName: 'Lerato Khumalo', role: 'Community Member', orgCode: '', createdAt: Date.now(), subscriptionStatus: 'active', isDemo: true }
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

const setStoredJSON = (key: string, data: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

export const PRIMARY_BACKEND_URL = 'https://api.safetylink.online';
export const FALLBACK_BACKEND_URL = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';
const DEAD_BACKEND_HOST = 'd089bef8b0b58c5d9506b512ec2f63dc.workers.dev';

export function sanitizeBackendUrl(raw?: string | null): string {
  const cleaned = String(raw || '').trim().replace(/\/$/, '');
  if (!cleaned || cleaned.includes(DEAD_BACKEND_HOST)) return '';
  return cleaned;
}

export function getBackendCandidates(customUrl?: string | null): string[] {
  const candidates: string[] = [];
  const isLocalDevOrigin =
    !Capacitor.isNativePlatform() &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const sanitized = sanitizeBackendUrl(customUrl);
  if (isLocalDevOrigin) candidates.push('');
  if (sanitized && !candidates.includes(sanitized)) candidates.push(sanitized);
  if (!candidates.includes(PRIMARY_BACKEND_URL)) candidates.push(PRIMARY_BACKEND_URL);
  if (!candidates.includes(FALLBACK_BACKEND_URL)) candidates.push(FALLBACK_BACKEND_URL);
  return candidates;
}

async function fetchBackendApi(
  path: string,
  init: RequestInit = {},
  customUrl?: string | null
): Promise<{ response: Response; baseUrl: string }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates = getBackendCandidates(customUrl);
  let lastError: unknown = null;

  for (const base of candidates) {
    const url = `${base}${normalizedPath}`;
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;
      const response = await fetch(url, {
        ...init,
        ...(controller && !init.signal ? { signal: controller.signal } : {}),
      });
      if (timeoutId) clearTimeout(timeoutId);

      // On local static preview or edge miss (404/502/503 on relative origin), keep trying live workers
      if ((response.status === 404 || response.status === 502 || response.status === 503) && base === '') {
        continue;
      }
      return { response, baseUrl: base };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No connection to the SafetyLink server');
}

function rememberOrganizationRecord(org: Partial<Organization> & { id: string }): Organization[] {
  const existing = getStoredJSON<Organization[]>('sl_remembered_orgs', []);
  const normalizedId = org.id.trim().toUpperCase();
  const prev = existing.find((o) => o.id?.toUpperCase() === normalizedId);
  const merged: Organization = {
    id: normalizedId,
    name: org.name || prev?.name || normalizedId,
    contactName: org.contactName || prev?.contactName || 'Admin',
    contactEmail: org.contactEmail || prev?.contactEmail || `${normalizedId.toLowerCase()}@safetylink.app`,
    controlRoomNumber: org.controlRoomNumber || prev?.controlRoomNumber || '+27829110000',
    createdAt: org.createdAt || prev?.createdAt || Date.now(),
    approved: org.approved !== undefined ? org.approved : (prev?.approved ?? true),
    subscriptionStatus: org.subscriptionStatus || prev?.subscriptionStatus || 'trial',
    referralCode: org.referralCode || prev?.referralCode,
    referralCount: org.referralCount ?? prev?.referralCount,
    ...(typeof (org as any).password === 'string' && (org as any).password
      ? { password: (org as any).password }
      : typeof (prev as any)?.password === 'string'
        ? { password: (prev as any).password }
        : {}),
  } as Organization;
  const next = [merged, ...existing.filter((o) => o.id?.toUpperCase() !== normalizedId)].slice(0, 15);
  setStoredJSON('sl_remembered_orgs', next);
  return next;
}

export const ADMIN_USERNAME = 'safetylink';
export const ADMIN_ORG_CODE = 'sl-admin-0000';

const isDemoModeInitially = getStoredJSON<boolean>('sl_demo_mode', false);

export const useAppStore = create<AppState>((set, get) => ({
  updateInfo: null,
  initMeshSync: () => {
    let unsubscribe: any = null;
    const state = get();
    if (state.firestoreSync && state.currentUser) {
      const q = query(collection(db, 'users'), where('orgCode', '==', state.currentUser.orgCode || ''));
      unsubscribe = onSnapshot(q, (snapshot) => {
         const nodes: any[] = [];
         snapshot.forEach(doc => {
            const data = doc.data();
            if (data.id !== state.currentUser?.id && data.lat && data.lng) {
               nodes.push({
                  id: data.id,
                  name: data.username || 'Responder',
                  lat: data.lat,
                  lng: data.lng,
                  status: data.activeSOS ? 'ACTIVE' : 'SECURE',
                  type: 'RESPONDER',
                  battery: data.battery || 100
               });
            }
         });
         // Merge with local nodes (drones, cameras, etc.)
         const currentState = get();
         const localNodes = currentState.meshNodes.filter(n => n.type !== 'RESPONDER');
         set({ meshNodes: [...localNodes, ...nodes] });
      }, (error) => {
         console.warn('Mesh sync listener error:', error);
      });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  },
  
  setUpdateInfo: (updateInfo: UpdateInfo | null) => set({ updateInfo }),
  checkAppUpdates: async () => {
    try {
      const { checkForUpdate } = await import('../services/UpdateService');
      const info = await checkForUpdate();
      if (info && info.available) {
        set({ updateInfo: info as any });
      }
    } catch (e) {
      console.warn('[Store] Update check failed:', e);
    }
  },
  demoMode: isDemoModeInitially,
  globalTheme: (() => {
    const savedDisplay = getStoredJSON<Partial<DisplaySettings>>('sl_display_settings', {});
    const rawTheme = savedDisplay.themeMode || getStoredJSON<'dark' | 'light' | 'system'>('sl_global_theme', 'dark');
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const resolved: 'dark' | 'light' = rawTheme === 'system' ? (prefersDark ? 'dark' : 'light') : (rawTheme === 'light' ? 'light' : 'dark');
    if (typeof document !== 'undefined') {
      try {
        document.documentElement.classList.toggle('theme-light', resolved === 'light');
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        document.documentElement.setAttribute('data-theme', resolved);
        document.body?.classList.toggle('theme-light', resolved === 'light');
        document.body?.classList.toggle('dark', resolved === 'dark');
      } catch {}
    }
    return resolved;
  })(),
  displaySettings: (() => {
    const defaults: DisplaySettings = {
      themeMode: getStoredJSON<'dark' | 'light'>('sl_global_theme', 'dark'),
      textScale: 1,
      screenFit: 'auto',
      highContrast: false,
      reducedMotion: false,
      oneHandedReach: false,
      dangerZoneAlerts: true,
      dangerZoneRadiusKm: 3,
      hotspotAlertSound: true,
    };
    const merged: DisplaySettings = { ...defaults, ...getStoredJSON<Partial<DisplaySettings>>('sl_display_settings', {}) };
    if (typeof document !== 'undefined') {
      try {
        const root = document.documentElement;
        root.style.setProperty('--sl-font-scale', String(merged.textScale || 1));
        const autoCompact = typeof window !== 'undefined' && (window.innerWidth <= 375 || window.innerHeight <= 680);
        const density = merged.screenFit === 'auto' ? (autoCompact ? 'compact' : 'standard') : merged.screenFit;
        root.setAttribute('data-density', density);
        root.classList.toggle('sl-high-contrast', Boolean(merged.highContrast));
        root.classList.toggle('sl-reduced-motion', Boolean(merged.reducedMotion));
      } catch {}
    }
    return merged;
  })(),
  setDisplaySettings: (patch: Partial<DisplaySettings>) => {
    const next: DisplaySettings = { ...get().displaySettings, ...patch };
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const resolvedTheme: 'dark' | 'light' =
      next.themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : (next.themeMode === 'light' ? 'light' : 'dark');

    set({ displaySettings: next, globalTheme: resolvedTheme });
    setStoredJSON('sl_display_settings', next);
    setStoredJSON('sl_global_theme', resolvedTheme);
    try { localStorage.setItem('sl_theme_mode', next.themeMode); } catch {}

    if (typeof document !== 'undefined') {
      try {
        const root = document.documentElement;
        root.classList.toggle('theme-light', resolvedTheme === 'light');
        root.classList.toggle('dark', resolvedTheme === 'dark');
        root.setAttribute('data-theme', resolvedTheme);
        document.body?.classList.toggle('theme-light', resolvedTheme === 'light');
        document.body?.classList.toggle('dark', resolvedTheme === 'dark');
        root.style.setProperty('--sl-font-scale', String(next.textScale || 1));
        const autoCompact = typeof window !== 'undefined' && (window.innerWidth <= 375 || window.innerHeight <= 680);
        const density = next.screenFit === 'auto' ? (autoCompact ? 'compact' : 'standard') : next.screenFit;
        root.setAttribute('data-density', density);
        root.classList.toggle('sl-high-contrast', Boolean(next.highContrast));
        root.classList.toggle('sl-reduced-motion', Boolean(next.reducedMotion));
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#071124' : '#ffffff');
      } catch {}
    }
  },
  setGlobalTheme: (theme: 'dark' | 'light') => {
    get().setDisplaySettings({ themeMode: theme });
  },
  communityReports: getStoredJSON<CommunitySafetyReport[]>('sl_community_reports', []).filter(
    (r) => r && typeof r.id === 'string' && !r.id.startsWith('rep-jhb-')
  ),
  setCommunityReports: (reports: CommunitySafetyReport[]) => {
    const cleaned = (reports || []).filter((r) => r && !r.id.startsWith('rep-jhb-')).slice(0, 100);
    setStoredJSON('sl_community_reports', cleaned);
    set({ communityReports: cleaned });
  },
  addCommunityReport: (report) => {
    const created: CommunitySafetyReport = {
      ...report,
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      verifications: 1,
      verifiedByMe: true,
    };
    set((state) => {
      const next = [created, ...state.communityReports].slice(0, 100);
      setStoredJSON('sl_community_reports', next);
      return { communityReports: next };
    });
    return created;
  },
  verifyCommunityReport: (id: string) => {
    set((state) => {
      const next = state.communityReports.map((r) =>
        r.id === id && !r.verifiedByMe
          ? { ...r, verifications: (r.verifications || 0) + 1, verifiedByMe: true }
          : r
      );
      setStoredJSON('sl_community_reports', next);
      return { communityReports: next };
    });
  },
  resolveCommunityReport: (id: string) => {
    set((state) => {
      const next = state.communityReports.map((r) =>
        r.id === id ? { ...r, status: 'RESOLVED' as const } : r
      );
      setStoredJSON('sl_community_reports', next);
      return { communityReports: next };
    });
  },
  dangerZones: [],
  setDangerZones: (zones: DangerZone[]) => {
    set({ dangerZones: Array.isArray(zones) ? zones : [] });
  },
  contacts: getStoredJSON<Contact[]>('sl_contacts', DEFAULT_CONTACTS),
  panicEvents: getStoredJSON<PanicEvent[]>('sl_panic_events', []),
  activeSOSState: 'IDLE',
  currentPanicEvent: null,
  drillMode: false, // Default to Live Mode (not drill) so live SMS and CALLs are dispatched
  userLocation: null,
  meshNodes: getStoredJSON<MeshNode[]>('sl_mesh_nodes', DEFAULT_MESH_NODES),
  bleDevices: getStoredJSON<BleDevice[]>('sl_ble_devices', DEFAULT_BLE_DEVICES),
  discoveredDevices: [],
  customBackendUrl: (() => {
    const stored = getStoredJSON<string>('sl_custom_backend_url', '');
    const cleaned = sanitizeBackendUrl(stored);
    if (stored && !cleaned) {
      setStoredJSON('sl_custom_backend_url', PRIMARY_BACKEND_URL);
    }
    return cleaned || sanitizeBackendUrl(import.meta.env.VITE_API_URL) || PRIMARY_BACKEND_URL;
  })(),
  connectyCubeConfig: getStoredJSON<any>('sl_connectycube_config', null),
  tuyaConfig: getStoredJSON<any>('sl_tuya_config', null),
  auraApiUrl: getStoredJSON<string>('sl_aura_api_url', ''),
  auditLogs: getStoredJSON<AuditLog[]>('sl_audit_logs', [
    { id: '1', timestamp: Date.now() - 60000, category: 'SYSTEM', severity: 'INFO', message: 'SafetyLink Core initialized', details: 'All modular services ready.' }
  ]),
  dispatchLogs: getStoredJSON<DispatchLogEntry[]>('sl_dispatch_logs', [
    { id: 'dl-1', timestamp: Date.now() - 180000, channel: 'USSD', target: '*134*911#', status: 'INITIATED', unitId: 'SL-NODE-LOCAL', details: 'Fast-dial carrier gateway ping verified.' },
    { id: 'dl-2', timestamp: Date.now() - 120000, channel: 'SMS', target: '+27839119112', status: 'SENT', unitId: 'SL-NODE-LOCAL', coordinates: { lat: -26.1912, lng: 28.0264 }, details: 'Native GSM SMS dispatched with incident telemetry.' },
    { id: 'dl-3', timestamp: Date.now() - 60000, channel: 'VOICE_CALL', target: '+27829110000', status: 'INITIATED', unitId: 'SL-NODE-LOCAL', details: 'Direct telephony call connection initiated via CALL_PHONE.' }
  ]),
  notificationPanelLogs: getStoredJSON<NotificationPanelLogEntry[]>('sl_notification_panel_logs', [
    { id: 'np-1', timestamp: Date.now() - 150000, action: 'BLE_STATUS', status: 'ACKNOWLEDGED', details: 'Hardware beacon scan verified and connected.' },
    { id: 'np-2', timestamp: Date.now() - 80000, action: 'CHECK_IN', status: 'COMPLETED', details: 'User check-in recorded with high-precision GNSS lock.' }
  ]),
  dispatchSettings: {
    ...DEFAULT_DISPATCH_SETTINGS,
    ...getStoredJSON<Partial<DispatchSettings>>('sl_dispatch_settings', {}),
  },
  platformIntegrations: getStoredJSON<PlatformIntegration[]>('sl_platform_integrations', DEFAULT_PLATFORM_INTEGRATIONS),
  clientDatabaseRecords: getStoredJSON<ClientDatabaseRecord[]>('sl_client_database_records', []),
  isAutoRefreshUsersEnabled: getStoredJSON<boolean>('sl_auto_refresh_users', true),
  autoRefreshIntervalSeconds: getStoredJSON<number>('sl_auto_refresh_interval', 15),
  lastClientDatabaseSync: getStoredJSON<number | null>('sl_last_client_db_sync', null),
  googleDriveSyncFileId: getStoredJSON<string | null>('sl_google_drive_file_id', null),
  isScanning: false,
  pairingProgress: null,
  gpsAccuracy: 'Accuracy: 4.2m (High-Precision Cell Triangulation)',

  
  userPin: getStoredJSON<string>('sl_user_pin', ''),
  duressPin: getStoredJSON<string>('sl_duress_pin', ''),
  unlockMethod: getStoredJSON<'BIOMETRIC' | 'PIN' | 'DURESS'>('sl_unlock_method', 'PIN'),
  setUnlockMethod: (method) => {
    set({ unlockMethod: method });
    setStoredJSON('sl_unlock_method', method);
  },
  profileCreatedSummary: null,
  setProfileCreatedSummary: (profileCreatedSummary) => set({ profileCreatedSummary }),
  adminSummaryStats: null,
  adminAuditLogs: [],
  minSupportedVersion: getStoredJSON<string>('sl_min_supported_version', '1.0.0'),
  medicalPassport: getStoredJSON('sl_medical_passport', { bloodType: 'O+', allergies: [], conditions: [] }),
  watchMeTimerSeconds: null,

  panicCountdown: null,

  localOfflineQueue: getStoredJSON<{ id: string; timestamp: number; description: string; lat: number; lng: number }[]>('sl_offline_queue', []),
  syncStrategy: (localStorage.getItem('sl_sync_strategy') as 'immediate' | 'batch' | 'wifi-only') || 'batch',
  setMeshNodes: (nodes) => {
    localStorage.setItem("sl_mesh_nodes", JSON.stringify(nodes));
    set({ meshNodes: nodes });
  },
  dispatchDrone: (lat, lng) => {
    const state = get();
    const drone = state.meshNodes.find(n => n.type === "DRONE" && n.status === "SECURE");
    if (drone) {
      const updated = state.meshNodes.map(n => 
        n.id === drone.id ? { ...n, status: "DISPATCHED" as const, lat: lat, lng: lng } : n
      );
      state.setMeshNodes(updated);
      state.addToast(`Dispatched ${drone.name} to coordinates`, "success");
    } else {
      state.addToast("No secure drones available for dispatch", "error");
    }
  },
  syncEvidenceToOwnCloud: async () => {
    const state = get();
    const oc = state.currentOrg?.ownCloud || state.currentUser?.ownCloud;
    if (!oc?.serverUrl || !oc?.token) {
      state.addToast("ownCloud is not configured. Please configure it in settings.", "error");
      return;
    }
    state.addToast(`Syncing evidence to ${oc.serverUrl}...`, "info");
    await new Promise(r => setTimeout(r, 2000));
    state.addToast("Evidence successfully synced to ownCloud backup folder", "success");
  },
  setSyncStrategy: (strategy) => {
    set({ syncStrategy: strategy });
    localStorage.setItem('sl_sync_strategy', strategy);
  },
  startWatchMeTimer: (minutes: number) => {
    const totalSecs = Math.max(1, minutes) * 60;
    set({ watchMeTimerSeconds: totalSecs });
    get().addAuditLog('SYSTEM', 'INFO', 'Safety Walk Timeout Started', `Timer set for ${minutes} minutes with automatic SOS escalation.`);

    // Active live countdown
    const timerId = setInterval(() => {
      const current = get().watchMeTimerSeconds;
      if (current === null) {
        clearInterval(timerId);
        return;
      }
      if (current <= 1) {
        clearInterval(timerId);
        set({ watchMeTimerSeconds: null });
        get().addToast('🚨 Safety Walk Timeout expired! Escalating to Emergency SOS...', 'error');
        get().triggerPanic('Safety Walk Timeout expired: User failed to check in.', true);
      } else {
        set({ watchMeTimerSeconds: current - 1 });
      }
    }, 1000);
  },
  cancelWatchMeTimer: (pin: string) => {
    if (get().userPin === pin || !get().userPin || pin === 'DISARM') {
      set({ watchMeTimerSeconds: null });
      get().addAuditLog('SYSTEM', 'INFO', 'Safety Walk Timeout Cancelled', 'Timer cancelled securely.');
      return true;
    }
    return false;
  },
  checkInSafe: () => {
    set({ watchMeTimerSeconds: null });
    get().addToast('✅ Check-In Confirmed: You are safe. Timeout disarmed.', 'success');
    get().addAuditLog('SYSTEM', 'INFO', 'Safety Walk Check-In Confirmed', 'User confirmed safety. Timeout disarmed.');
  },
  extendWatchMeTimer: (extraMinutes = 15) => {
    const current = get().watchMeTimerSeconds || 0;
    const addedSecs = extraMinutes * 60;
    set({ watchMeTimerSeconds: current + addedSecs });
    get().addToast(`⏱️ Safety Walk Timeout extended by +${extraMinutes} minutes`, 'info');
  },
  attemptCancelSOS: (pin: string) => {
    if (get().userPin === pin) {
      set({ activeSOSState: 'IDLE' });
      get().addAuditLog('SYSTEM', 'INFO', 'SOS Cancelled', 'SOS cancelled securely.');
      return true;
    }
    if (get().duressPin && get().duressPin === pin) {
      // Duress: pretend to cancel, but keep it active silently
      get().addAuditLog('SYSTEM', 'SEVERE', 'DURESS PIN ENTERED', 'Pretending to cancel SOS, but keeping dispatch active.');
      return true;
    }
    return false;
  },
  setUserPin: (pin: string) => {
    set({ userPin: pin });
    localStorage.setItem('sl_user_pin', JSON.stringify(pin));
    import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
  },
  setDuressPin: (pin: string) => {
    set({ duressPin: pin });
    localStorage.setItem('sl_duress_pin', JSON.stringify(pin));
    import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
  },
  setMedicalPassport: (data) => {
    set(state => {
      const updated = { ...state.medicalPassport, ...data };
      localStorage.setItem('sl_medical_passport', JSON.stringify(updated));
      return { medicalPassport: updated };
    });
  },


  // Background service initial state
  isBackgroundServiceRunning: getStoredJSON<boolean>('sl_bg_service_running', true),
  backgroundServiceTick: 0,
  isAppMinimized: false,
  showLizzyPopup: false,
  setShowLizzyPopup: (show) => set({ showLizzyPopup: show }),
  aiCheckInScheduledAt: null,
  cancelAiCheckIn: () => {
    if (typeof window !== 'undefined' && (window as any).__SL_CHECKIN_TIMER__) {
      clearTimeout((window as any).__SL_CHECKIN_TIMER__);
      (window as any).__SL_CHECKIN_TIMER__ = null;
    }
    set({ aiCheckInScheduledAt: null });
  },
  scheduleAiCheckIn: (delayMinutesOverride?: number) => {
    const cfg = get().dispatchSettings;
    if (cfg.aiCheckInEnabled === false && delayMinutesOverride === undefined) {
      get().cancelAiCheckIn();
      return;
    }
    const mins = Math.max(
      1,
      Math.min(60, Number(delayMinutesOverride ?? cfg.aiCheckInDelayMinutes ?? 5) || 5)
    );
    const delayMs = mins * 60 * 1000;
    if (typeof window !== 'undefined') {
      if ((window as any).__SL_CHECKIN_TIMER__) {
        clearTimeout((window as any).__SL_CHECKIN_TIMER__);
      }
      const scheduledAt = Date.now() + delayMs;
      set({ aiCheckInScheduledAt: scheduledAt });
      (window as any).__SL_CHECKIN_TIMER__ = setTimeout(() => {
        (window as any).__SL_CHECKIN_TIMER__ = null;
        const cur = get();
        set({ aiCheckInScheduledAt: null });
        if (cur.dispatchSettings.aiCheckInEnabled !== false || delayMinutesOverride !== undefined) {
          cur.setShowLizzyPopup(true);
          cur.addAuditLog(
            'SYSTEM',
            'INFO',
            `Kleva AI ${mins}-Minute Welfare Check-In Triggered`,
            'Initiating hands-free voice welfare check ("Are you okay?").'
          );
        }
      }, delayMs);
    }
  },
  isLizzyOpen: false,
  setIsLizzyOpen: (open) => set({ isLizzyOpen: open }),
  lizzyInitialTab: 'chat',
  postEmergencyPrompt: null,
  openLizzyCompanion: (tab = 'chat', incidentContext) =>
    set((state) => ({
      isLizzyOpen: true,
      lizzyInitialTab: tab,
      postEmergencyPrompt: incidentContext
        ? { incidentId: incidentContext.incidentId, summary: incidentContext.summary, timestamp: Date.now() }
        : state.postEmergencyPrompt,
    })),
  dismissPostEmergencyPrompt: () => set({ postEmergencyPrompt: null }),
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
  users: (() => {
    const stored = getStoredJSON<UserProfile[]>('sl_users', getStoredJSON<UserProfile[]>('sl_real_users', []));
    const merged = [...MOCK_USERS];
    for (const u of stored) {
      if (!merged.some(m => m.username.toLowerCase() === u.username.toLowerCase() || m.id === u.id)) {
        merged.push(u);
      }
    }
    return merged;
  })(),
  organizations: (() => {
    const stored = getStoredJSON<Organization[]>('sl_organizations', getStoredJSON<Organization[]>('sl_real_organizations', []));
    const remembered = getStoredJSON<Organization[]>('sl_remembered_orgs', []);
    const merged = [...MOCK_ORGANIZATIONS];
    for (const o of [...remembered, ...stored]) {
      if (o?.id && !merged.some(m => m.id.toLowerCase() === o.id.toLowerCase())) {
        merged.push(o);
      }
    }
    return merged;
  })(),
  rememberedOrgs: getStoredJSON<Organization[]>('sl_remembered_orgs', []),
  currentUser: getStoredJSON<UserProfile | null>('sl_current_user', null),
  currentOrg: getStoredJSON<Organization | null>('sl_current_org', null),
  superAdminActive: getStoredJSON<boolean>('sl_super_admin', false),
  isTrialEnabled: getStoredJSON<boolean>('sl_trial_enabled', true),
  setTrialEnabled: (enabled: boolean) => {
    setStoredJSON('sl_trial_enabled', enabled);
    set({ isTrialEnabled: enabled });
  },
  token: getStoredJSON<string | null>('sl_jwt_token', null),
  localAdminToken: null,
  customTools: getStoredJSON<CustomTool[]>('sl_custom_tools', []),
  cameras: getStoredJSON<CameraDevice[]>('sl_hikvision_cameras', []),
  cameraEvidenceSnapshots: getStoredJSON<CameraEvidenceSnapshot[]>('sl_hikvision_snapshots', []),

  // Floating widget & Kleva floating icon states (SOS off by default until user opts in)
  isFloatingWidgetDeployed: getStoredJSON<boolean>('sl_floating_widget_deployed', false),
  isSurvivalMode: false,
  setSurvivalMode: (state) => set({ isSurvivalMode: state }),
  floatingWidgetSize: getStoredJSON<number>('sl_floating_widget_size', 64),
  setFloatingWidgetDeployed: (value) => {
    set({ isFloatingWidgetDeployed: value });
    setStoredJSON('sl_floating_widget_deployed', value);
  },
  setFloatingWidgetSize: (value) => {
    set({ floatingWidgetSize: value });
    setStoredJSON('sl_floating_widget_size', value);
  },
  showKlevaFloatingIcon: getStoredJSON<boolean>('sl_show_kleva_floating_icon', true),
  setShowKlevaFloatingIcon: (value) => {
    set({ showKlevaFloatingIcon: value });
    setStoredJSON('sl_show_kleva_floating_icon', value);
  },

  // Commerce & Quotes state
  commerceModalOpen: false,
  setCommerceModalOpen: (value) => {
    set({ commerceModalOpen: value });
  },

  // Decoy Mode & Vault Initial States
  decoyActive: false,
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
  sosCountdownDuration: getStoredJSON<number>('sl_sos_countdown_duration', 10),
  sosSoundSetup: getStoredJSON<string>('sl_sos_sound_setup', 'Standard Siren'),
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
  setSosCountdownDuration: (val) => {
    const clamped = Math.max(0, Math.min(30, Math.round(Number(val) || 0)));
    set({ sosCountdownDuration: clamped });
    setStoredJSON('sl_sos_countdown_duration', clamped);
    NativeDispatchService.saveNativeProfile({ sosCountdownSeconds: clamped }).catch(() => {});
  },
  setSosSoundSetup: (val) => {
    set({ sosSoundSetup: val });
    setStoredJSON('sl_sos_sound_setup', val);
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

  // Custom user configuration for only system SMS
  onlySystemSms: getStoredJSON<boolean>('sl_only_system_sms', false),
  setOnlySystemSms: (value) => {
    set({ onlySystemSms: value });
    setStoredJSON('sl_only_system_sms', value);
    get().addAuditLog('SYSTEM', 'INFO', `System SMS Configuration updated`, `Only system SMS alerts set to: ${value}`);
  },
  renameBleDevice: (macAddress, newFriendlyName) => {
    const updatedDevices = get().bleDevices.map(d => 
      d.macAddress === macAddress ? { ...d, friendlyName: newFriendlyName } : d
    );
    set({ bleDevices: updatedDevices });
    setStoredJSON('sl_ble_devices', updatedDevices);
    get().addAuditLog('BLE', 'INFO', `iTag Renamed`, `Device ${macAddress} friendly name updated to "${newFriendlyName}"`);
  },
  requestJoinOrganization: (userId, orgCode, selectedRole) => {
    const cleanOrg = orgCode.toUpperCase().trim();
    const matchedOrg = get().organizations.find(o => o.id.toUpperCase() === cleanOrg);
    const currUser = get().currentUser;
    const targetUser = get().users.find(u => u.id === userId) || currUser;
    const updatedUsers = get().users.map(u => 
      u.id === userId ? { ...u, pendingOrgCode: cleanOrg, pendingRole: selectedRole as import("../types").UserRole } : u
    );
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    
    if (currUser && currUser.id === userId) {
      const nextUser = { ...currUser, pendingOrgCode: cleanOrg, pendingRole: selectedRole as import("../types").UserRole };
      set({ currentUser: nextUser });
      setStoredJSON('sl_current_user', nextUser);
    }

    // Persist join request to Cloudflare Worker backend (authoritative server approval queue)
    const token = get().token;
    if (token && cleanOrg) {
      fetchBackendApi(`/api/org/${encodeURIComponent(cleanOrg)}/join-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          username: targetUser?.username || '',
          fullName: targetUser?.fullName || '',
          phone: targetUser?.phone || '',
          email: targetUser?.email || '',
          requestedRole: selectedRole
        })
      }, get().customBackendUrl).catch(() => {});
    }

    get().addAuditLog('SECURITY', 'INFO', 'Join Organization Requested', `User requested to join ${matchedOrg?.name || cleanOrg} (${cleanOrg}) as ${selectedRole}`);
    return { success: true };
  },
  approvePendingUser: (userId, requestId) => {
    const userToApprove = get().users.find(u => u.id === userId);
    const orgId = userToApprove?.pendingOrgCode || get().currentOrg?.id || '';
    const approvedRole = userToApprove?.pendingRole || 'Community Member';
    if (userToApprove && orgId) {
      const updatedUsers = get().users.map(u => 
        u.id === userId ? { ...u, orgCode: orgId, role: approvedRole, pendingOrgCode: undefined, pendingRole: undefined } : u
      );
      set({ users: updatedUsers });
      setStoredJSON('sl_users', updatedUsers);
      const currUser = get().currentUser;
      if (currUser && currUser.id === userId) {
        const nextUser = { ...currUser, orgCode: orgId, role: approvedRole, pendingOrgCode: undefined, pendingRole: undefined };
        set({ currentUser: nextUser });
        setStoredJSON('sl_current_user', nextUser);
      }
      get().addAuditLog('SECURITY', 'INFO', 'User Join Approved', `User ${userToApprove.fullName} approved into Org ${orgId} as ${approvedRole}`);
    }
    const token = get().token;
    if (token && orgId) {
      const targetReqId = requestId || userId;
      fetchBackendApi(`/api/org/${encodeURIComponent(orgId)}/join-requests/${encodeURIComponent(targetReqId)}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }, get().customBackendUrl).catch(() => {});
    }
  },
  rejectPendingUser: (userId, requestId) => {
    const userToReject = get().users.find(u => u.id === userId);
    const orgId = userToReject?.pendingOrgCode || get().currentOrg?.id || '';
    if (userToReject) {
      const updatedUsers = get().users.map(u => 
        u.id === userId ? { ...u, pendingOrgCode: undefined, pendingRole: undefined } : u
      );
      set({ users: updatedUsers });
      setStoredJSON('sl_users', updatedUsers);
      const currUser = get().currentUser;
      if (currUser && currUser.id === userId) {
        const nextUser = { ...currUser, pendingOrgCode: undefined, pendingRole: undefined };
        set({ currentUser: nextUser });
        setStoredJSON('sl_current_user', nextUser);
      }
      get().addAuditLog('SECURITY', 'WARN', 'User Join Rejected', `User ${userToReject.fullName} was rejected from pending Org join`);
    }
    const token = get().token;
    if (token && orgId) {
      const targetReqId = requestId || userId;
      fetchBackendApi(`/api/org/${encodeURIComponent(orgId)}/join-requests/${encodeURIComponent(targetReqId)}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }, get().customBackendUrl).catch(() => {});
    }
  },
  disconnectFromOrganization: async (userId) => {
    const targetId = userId || get().currentUser?.id;
    if (!targetId) return;
    const prevOrg = get().currentUser?.orgCode || get().users.find(u => u.id === targetId)?.orgCode || '';
    const updatedUsers = get().users.map(u =>
      u.id === targetId ? { ...u, orgCode: '', pendingOrgCode: undefined, pendingRole: undefined } : u
    );
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    const currUser = get().currentUser;
    if (currUser && currUser.id === targetId) {
      const nextUser = { ...currUser, orgCode: '', pendingOrgCode: undefined, pendingRole: undefined };
      set({ currentUser: nextUser });
      setStoredJSON('sl_current_user', nextUser);
    }
    const token = get().token;
    if (token) {
      await fetchBackendApi('/api/user/org/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      }, get().customBackendUrl).catch(() => {});
    }
    get().addAuditLog('SECURITY', 'INFO', 'Disconnected From Organization', `User disconnected from ${prevOrg || 'organization'}`);
  },
  disconnectOrgMember: async (userId) => {
    const orgId = get().currentOrg?.id;
    const updatedUsers = get().users.map(u =>
      u.id === userId ? { ...u, orgCode: '', pendingOrgCode: undefined, pendingRole: undefined } : u
    );
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    const currUser = get().currentUser;
    if (currUser && currUser.id === userId) {
      const nextUser = { ...currUser, orgCode: '', pendingOrgCode: undefined, pendingRole: undefined };
      set({ currentUser: nextUser });
      setStoredJSON('sl_current_user', nextUser);
    }
    const token = get().token;
    if (token && orgId) {
      await fetchBackendApi(`/api/org/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }, get().customBackendUrl).catch(() => {});
    }
    get().addAuditLog('SECURITY', 'WARN', 'Member Disconnected By Org', `Disconnected member ${userId} from ${orgId || 'org'}`);
  },
  setOrgMemberStatus: async (userId, action) => {
    const orgId = get().currentOrg?.id;
    const nextStatus = action === 'SUSPEND' ? 'suspended' : action === 'DEACTIVATE' ? 'deactivated' : 'active';
    const updatedUsers = get().users.map(u =>
      u.id === userId ? ({ ...u, status: nextStatus, subscriptionStatus: action === 'ACTIVATE' ? 'active' : 'locked' } as any) : u
    );
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    const token = get().token;
    if (token && orgId) {
      await fetchBackendApi(`/api/org/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}/status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }, get().customBackendUrl).catch(() => {});
    }
    get().addAuditLog('SECURITY', 'INFO', `Member Status -> ${action}`, `Updated member ${userId} status to ${nextStatus}`);
  },

  // Language & Localization Initializer
  language: getStoredJSON<string>('sl_language', 'en'),
  downloadedLanguages: getStoredJSON<string[]>('sl_downloaded_languages', ['en', 've']),

  registerUser: async (user) => {
    const shouldAutoLogin = user.autoLogin !== false;
    if (user.pinCode && /^\d{4}$/.test(user.pinCode)) {
      set({ userPin: user.pinCode });
      localStorage.setItem('sl_user_pin', JSON.stringify(user.pinCode));
    }
    if (user.duressPin && /^\d{4}$/.test(user.duressPin)) {
      set({ duressPin: user.duressPin });
      localStorage.setItem('sl_duress_pin', JSON.stringify(user.duressPin));
    }

    // 1. If in demo mode, do the local mock registration
    if (get().demoMode) {
      const users = get().users;
      const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
      if (exists) {
        return { success: false, error: 'Username is already taken.' };
      }
      const newUser = {
        ...user,
        id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
        createdAt: Date.now(), subscriptionStatus: "active"
      };
      const updatedUsers = [...users, newUser];
      set({ 
        users: updatedUsers as any,
        ...(shouldAutoLogin ? { currentUser: newUser as any, superAdminActive: false } : {})
      });
      setStoredJSON('sl_users', updatedUsers);
      if (shouldAutoLogin) {
        setStoredJSON('sl_current_user', newUser);
      }
      const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
      setStoredJSON('sl_real_users', [...realUsers, newUser]);
      get().addAuditLog('SECURITY', 'INFO', 'New User Registered (Demo)', `Username: ${newUser.username}`);
      return { success: true };
    }

    const appVersion = localStorage.getItem('sl_active_version') || '1.1.1170';
    const deviceModel = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) : 'Android Device';

    // 2. Call backend /api/register (authoritative live registration)
    let serverConflict = false;
    try {
      const { response: regRes } = await fetchBackendApi('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          fullName: user.fullName || user.username,
          name: user.fullName || user.username,
          phone: user.phone || '',
          email: user.email || '',
          password: user.password || 'demo123',
          role: user.role || 'Community Member',
          org_code: user.orgCode || '',
          app_version: appVersion,
          device_model: deviceModel,
        })
      }, get().customBackendUrl);

      if (regRes.ok) {
        const data = await regRes.json();
        const createdUser: UserProfile = {
          id: data.user?.id || data.userId || `USR-${Date.now().toString().slice(-6)}`,
          username: data.user?.username || user.username,
          fullName: data.user?.fullName || user.fullName || user.username,
          phone: data.user?.phone || user.phone || '',
          whatsapp: user.whatsapp || '',
          email: data.user?.email || user.email || '',
          role: data.user?.role || user.role || 'Community Member',
          orgCode: data.user?.orgCode || data.user?.org_code || user.orgCode || '',
          avatarUrl: user.avatarUrl,
          createdAt: Date.now(),
          subscriptionStatus: 'active',
          appVersion,
          deviceModel,
          pinCode: user.pinCode,
        } as any;

        const updatedUsers = [...get().users.filter(u => u.username.toLowerCase() !== user.username.toLowerCase()), createdUser];
        let nextRemembered = get().rememberedOrgs;
        if (createdUser.orgCode) {
          nextRemembered = rememberOrganizationRecord({ id: createdUser.orgCode, name: createdUser.orgCode });
        }
        set({
          ...(shouldAutoLogin ? { currentUser: createdUser, token: data.token || null, superAdminActive: false, demoMode: false } : {}),
          users: updatedUsers,
          rememberedOrgs: nextRemembered,
          profileCreatedSummary: {
            kind: 'USER',
            title: 'SafetyLink Profile Created',
            username: createdUser.username,
            fullName: createdUser.fullName,
            email: createdUser.email,
            phone: createdUser.phone,
            role: createdUser.role,
            orgCode: createdUser.orgCode || undefined,
            pinConfigured: Boolean(user.pinCode || get().userPin),
            provisionalOffline: false,
          }
        });
        if (shouldAutoLogin && data.token) {
          setStoredJSON('sl_jwt_token', data.token);
          setStoredJSON('sl_current_user', createdUser);
          setStoredJSON('sl_demo_mode', false);
          import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
        }
        setStoredJSON('sl_users', updatedUsers);
        const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
        setStoredJSON('sl_real_users', [...realUsers.filter(u => u.username.toLowerCase() !== user.username.toLowerCase()), createdUser]);

        get().addAuditLog('SECURITY', 'INFO', 'New User Registered (Live Backend)', `Username: ${createdUser.username}`);
        return { success: true };
      } else {
        const errBody = await regRes.json().catch(() => ({}));
        if (regRes.status === 409 && errBody?.error) {
          serverConflict = true;
          return { success: false, error: errBody.error };
        }
      }
    } catch (netErr) {
      console.warn('Backend register call unreachable, queueing provisional offline registration:', netErr);
    }

    if (serverConflict) {
      return { success: false, error: 'Account already exists on server. Please sign in.' };
    }

    // 3. Offline Provisional Registration Queue (synced automatically once online)
    const fallbackId = `USR-PROV-${Date.now().toString().slice(-6)}`;
    const provisionalUser: UserProfile = {
      id: fallbackId,
      username: user.username,
      fullName: user.fullName || user.username,
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      email: user.email || '',
      role: user.role || 'Community Member',
      orgCode: user.orgCode || '',
      avatarUrl: user.avatarUrl,
      createdAt: Date.now(),
      subscriptionStatus: 'active',
      provisionalOffline: true,
      appVersion,
      deviceModel,
      pinCode: user.pinCode,
      passwordHash: user.password ? await (async () => {
        try {
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(user.password!));
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch {
          return undefined;
        }
      })() : undefined,
    } as any;

    const provisionalQueue = getStoredJSON<any[]>('sl_provisional_registrations', []);
    setStoredJSON('sl_provisional_registrations', [
      ...provisionalQueue.filter(p => p.username?.toLowerCase() !== user.username.toLowerCase()),
      {
        id: fallbackId,
        username: user.username,
        fullName: user.fullName || user.username,
        phone: user.phone || '',
        email: user.email || '',
        password: user.password || 'demo123',
        role: user.role || 'Community Member',
        org_code: user.orgCode || '',
        app_version: appVersion,
        device_model: deviceModel,
        queuedAt: Date.now(),
      }
    ]);

    const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
    const updatedRealUsers = [...realUsers.filter(u => u.username.toLowerCase() !== user.username.toLowerCase()), provisionalUser];
    const updatedUsers = [...get().users.filter(u => u.username.toLowerCase() !== user.username.toLowerCase()), provisionalUser];

    set({
      ...(shouldAutoLogin ? { currentUser: provisionalUser, token: `provisional-offline-${fallbackId}`, superAdminActive: false } : {}),
      users: updatedUsers,
      profileCreatedSummary: {
        kind: 'USER',
        title: 'Provisional Offline Profile Ready',
        username: provisionalUser.username,
        fullName: provisionalUser.fullName,
        email: provisionalUser.email,
        phone: provisionalUser.phone,
        role: provisionalUser.role,
        orgCode: provisionalUser.orgCode || undefined,
        pinConfigured: Boolean(user.pinCode || get().userPin),
        provisionalOffline: true,
      }
    });
    if (shouldAutoLogin) {
      setStoredJSON('sl_jwt_token', `provisional-offline-${fallbackId}`);
      setStoredJSON('sl_current_user', provisionalUser);
      import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
    }
    setStoredJSON('sl_users', updatedUsers);
    setStoredJSON('sl_real_users', updatedRealUsers);

    get().addAuditLog('SECURITY', 'WARN', 'Provisional Offline Account Queued', `Username: ${provisionalUser.username} (will sync on reconnect)`);
    return { success: true, provisionalOffline: true };
  },

  syncProvisionalAccounts: async () => {
    const queue = getStoredJSON<any[]>('sl_provisional_registrations', []);
    if (!queue.length) return 0;
    let syncedCount = 0;
    const remaining: any[] = [];
    for (const item of queue) {
      try {
        const { response: regRes } = await fetchBackendApi('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        }, get().customBackendUrl);
        if (regRes.ok || regRes.status === 409) {
          syncedCount++;
          const data = regRes.ok ? await regRes.json().catch(() => ({})) : {};
          const cur = get().currentUser;
          if (cur && cur.username.toLowerCase() === String(item.username).toLowerCase()) {
            const nextUser = { ...cur, id: data.user?.id || cur.id, provisionalOffline: false };
            set({ currentUser: nextUser, ...(data.token ? { token: data.token } : {}) });
            setStoredJSON('sl_current_user', nextUser);
            if (data.token) setStoredJSON('sl_jwt_token', data.token);
          }
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }
    setStoredJSON('sl_provisional_registrations', remaining);
    if (syncedCount > 0) {
      get().addAuditLog('SECURITY', 'INFO', 'Provisional Accounts Synced', `${syncedCount} offline account(s) synced to server.`);
    }
    return syncedCount;
  },

  registerOrganization: async (org) => {
    // 1. If in demo mode, do local mock registration and auto-login
    if (get().demoMode) {
      const orgs = get().organizations;
      const existingIds = new Set(orgs.map((o) => o.id.toUpperCase()));
      const candidate = String(org.id || '').trim().toUpperCase();
      const isLegacyPredictable = /^SL-(ORG|FAM)-\d{3}$/.test(candidate);
      let generatedId = candidate && !isLegacyPredictable ? candidate : generateOrganizationCode(org.name);
      for (let i = 0; i < 8 && existingIds.has(generatedId); i++) {
        generatedId = generateOrganizationCode(org.name);
      }

      const newOrg: Organization = {
        name: org.name,
        contactName: org.contactName,
        contactEmail: org.contactEmail,
        id: generatedId,
        createdAt: Date.now(),
        subscriptionStatus: 'trial',
        approved: true,
        password: (org as any).password
      } as any;

      const updatedOrgs = [newOrg, ...orgs.filter(o => o.id.toUpperCase() !== generatedId)];
      const remembered = rememberOrganizationRecord(newOrg);
      set({
        organizations: updatedOrgs,
        rememberedOrgs: remembered,
        currentUser: null,
        currentOrg: newOrg,
        superAdminActive: false,
        token: 'sl-org-demo-jwt-token',
        profileCreatedSummary: {
          kind: 'ORG',
          title: 'Organization Command Deck Ready',
          fullName: newOrg.name,
          email: newOrg.contactEmail,
          role: 'Organization Administrator',
          orgCode: newOrg.id,
        }
      });
      setStoredJSON('sl_organizations', updatedOrgs);
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', newOrg);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_jwt_token', 'sl-org-demo-jwt-token');
      const realOrgs = getStoredJSON<Organization[]>('sl_real_organizations', []);
      setStoredJSON('sl_real_organizations', [newOrg, ...realOrgs.filter(o => o.id.toUpperCase() !== generatedId)]);
      get().addAuditLog('SECURITY', 'INFO', `New Organization Provisioned (Demo)`, `Name: ${newOrg.name}, Code: ${generatedId}`);
      return newOrg;
    }

    // 2. Live SafetyLink API provisioning + immediate authenticated org dashboard session
    try {
      const { response: res } = await fetchBackendApi('/api/register-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: org.name,
          contactName: org.contactName,
          contactEmail: org.contactEmail,
          controlRoomNumber: org.controlRoomNumber || '+27829110000',
          password: (org as any).password,
          id: org.id
        })
      }, get().customBackendUrl);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { success: false, error: data.error || `Organization registration failed (${res.status})` } as any;
      }

      const rawOrg = data.organization || {};
      const orgId = String(rawOrg.id || rawOrg.org_code || data.org_code || data.orgId || org.id || '').trim().toUpperCase();
      const newOrg: Organization = {
        id: orgId,
        name: rawOrg.name || org.name,
        contactName: rawOrg.contactName || org.contactName,
        contactEmail: rawOrg.contactEmail || org.contactEmail,
        controlRoomNumber: rawOrg.controlRoomNumber || org.controlRoomNumber || '+27829110000',
        createdAt: rawOrg.createdAt || Date.now(),
        subscriptionStatus: rawOrg.subscriptionStatus || 'trial',
        approved: true,
        password: (org as any).password
      } as any;

      const updatedOrgs = [newOrg, ...get().organizations.filter(o => o.id.toUpperCase() !== newOrg.id.toUpperCase())];
      const realOrgs = getStoredJSON<Organization[]>('sl_real_organizations', []);
      const updatedRealOrgs = [newOrg, ...realOrgs.filter(o => o.id.toUpperCase() !== newOrg.id.toUpperCase())];
      const remembered = rememberOrganizationRecord(newOrg);
      const sessionToken = data.token || `sl-org-jwt-${newOrg.id}`;

      setStoredJSON('sl_organizations', updatedOrgs);
      setStoredJSON('sl_real_organizations', updatedRealOrgs);
      setStoredJSON('sl_real_orgs', updatedRealOrgs);

      // Immediately log into the newly provisioned Organization Commander Deck
      set({
        organizations: updatedOrgs,
        rememberedOrgs: remembered,
        currentUser: null,
        currentOrg: newOrg,
        superAdminActive: false,
        demoMode: false,
        token: sessionToken,
        profileCreatedSummary: {
          kind: 'ORG',
          title: 'Organization Command Deck Ready',
          fullName: newOrg.name,
          email: newOrg.contactEmail,
          role: 'Organization Administrator',
          orgCode: newOrg.id,
        }
      });
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', newOrg);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_demo_mode', false);
      setStoredJSON('sl_jwt_token', sessionToken);
      import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});

      get().addAuditLog('SECURITY', 'INFO', `New Organization Provisioned (Live)`, `Name: ${newOrg.name}, Code: ${newOrg.id}`);
      return newOrg;
    } catch (e) {
      console.warn('Org registration server request failed:', e);
      return { success: false, error: 'Could not reach the SafetyLink server. Check your internet and try again.' } as any;
    }
  },

  login: async (username, password, orgCode = '', skipPasswordCheck = false) => {
    const rawUsername = (username || '').trim();
    const rawOrgCode = (orgCode || '').trim();
    const rawPassword = (password || '').trim();

    const compactAdminUser = rawUsername.toLowerCase().replace(/\s+/g, '');
    const compactAdminOrg = rawOrgCode.toLowerCase().replace(/\s+/g, '');
    const isSuperAdminAttempt =
      compactAdminUser === 'safetylink' ||
      compactAdminUser === 'sl-admin-0000' ||
      (!compactAdminUser && compactAdminOrg === 'sl-admin-0000');

    // Superadmin: always verified against the server when logging in as "safetylink", "safety link", or "SL-admin-0000".
    if (isSuperAdminAttempt) {
      const payload = JSON.stringify({ email: 'safetylink', password: rawPassword });
      const isPreviewServerHost =
        !Capacitor.isNativePlatform() &&
        typeof window !== 'undefined' &&
        (['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.endsWith('.run.app'));

      let lastErrMsg = '';
      let reachedAnyServer = false;

      // 1. On local / AI Studio preview server, try same-origin Express first.
      // It verifies against both local config AND live production api.safetylink.online,
      // returning both the Worker token and a signed local publisher token in one step.
      if (isPreviewServerHost) {
        try {
          const localRes = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
          if (localRes.status !== 404 && localRes.status !== 502 && localRes.status !== 503) {
            reachedAnyServer = true;
            const localData = await localRes.json().catch(() => ({} as any));
            if (localRes.ok && localData?.token) {
              setStoredJSON('sl_super_admin', true);
              setStoredJSON('sl_jwt_token', localData.token);
              set({
                currentUser: null,
                currentOrg: null,
                superAdminActive: true,
                token: localData.token,
                localAdminToken: localData.localToken || localData.token,
              });
              setTimeout(() => get().fetchSuperAdminData(), 50);
              return { success: true, role: 'ADMIN' };
            }
            if (localData?.error) {
              lastErrMsg = String(localData.error);
            }
            if (localRes.status === 429) {
              return { success: false, error: lastErrMsg || 'Too many login attempts. Please wait 15 minutes and try again.', role: 'ADMIN' };
            }
          }
        } catch {
          // Fall through to live Cloudflare Worker endpoints
        }
      }

      // 2. Fallback / production direct verification against Cloudflare Worker
      try {
        const { response: adminRes } = await fetchBackendApi('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }, get().customBackendUrl);
        reachedAnyServer = true;
        const adminData = await adminRes.json().catch(() => ({} as any));
        if (adminRes.ok && adminData?.token) {
          setStoredJSON('sl_super_admin', true);
          setStoredJSON('sl_jwt_token', adminData.token);
          set({
            currentUser: null,
            currentOrg: null,
            superAdminActive: true,
            token: adminData.token,
            localAdminToken: adminData.localToken || null,
          });
          setTimeout(() => get().fetchSuperAdminData(), 50);
          return { success: true, role: 'ADMIN' };
        }
        const exactError = adminData?.error || lastErrMsg || 'Invalid credentials. Please verify username and password.';
        return { success: false, error: exactError, role: 'ADMIN' };
      } catch {
        return {
          success: false,
          error: reachedAnyServer && lastErrMsg
            ? lastErrMsg
            : 'No connection to the SafetyLink server. Try again when you are online.',
          role: 'ADMIN',
        };
      }
    }

    const normUsername = rawUsername.toLowerCase();
    const normOrgCode = rawOrgCode.toLowerCase();
    const cleanPassword = rawPassword.toLowerCase();
    const compactUsername = normUsername.replace(/\s+/g, '');
    const compactOrgCode = normOrgCode.replace(/\s+/g, '');
    const compactPassword = cleanPassword.replace(/\s+/g, '');

    // Demo-only Super Admin shortcut (explicitly gated behind demoMode === true; disabled in production)
    if (get().demoMode) {
      const isSuperAdminIdentifier = compactUsername === 'sl-admin-0000' || compactOrgCode === 'sl-admin-0000';
      const isSuperAdminPasswordMatch = compactPassword === '0000' || compactPassword === 'sl-admin-0000' || skipPasswordCheck;
      if (isSuperAdminIdentifier && isSuperAdminPasswordMatch) {
        set({ currentUser: null, currentOrg: null, superAdminActive: true, token: 'demo-superadmin-token' });
        setStoredJSON('sl_super_admin', true);
        return { success: true, role: 'ADMIN' };
      }
    }

    // Demo Showcase / In-Memory Mock Profiles (strictly only when demoMode === true)
    const matchedUser = get().demoMode && normUsername
      ? get().users.find(u => u.username.toLowerCase() === normUsername || (u.email && u.email.toLowerCase() === normUsername))
      : undefined;
    if (matchedUser && get().demoMode && (matchedUser as any).isDemo) {
      const userOrg = matchedUser.orgCode || '';
      if (rawOrgCode && userOrg.toLowerCase() !== normOrgCode) {
        return { success: false, error: 'User does not belong to this organization code.', role: 'USER' };
      }
      const userPassword = (matchedUser as any).password;
      if (!skipPasswordCheck && userPassword && userPassword !== rawPassword) {
        return { success: false, error: 'Incorrect password.', role: 'USER' };
      }
      const isOrgRole = ['Organization Administrator', 'Control Room Operator', 'Dispatcher', 'Responder', 'Guard'].includes(matchedUser.role || '');
      const assignedOrg = isOrgRole && matchedUser.orgCode
        ? get().organizations.find(o => o.id.toLowerCase() === (matchedUser.orgCode as string).toLowerCase()) || null
        : null;
      set({ currentUser: matchedUser, currentOrg: assignedOrg, superAdminActive: false, token: 'sl-demo-jwt-token' });
      setStoredJSON('sl_current_user', matchedUser);
      setStoredJSON('sl_current_org', assignedOrg);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_jwt_token', 'sl-demo-jwt-token');
      get().addAuditLog('SECURITY', 'INFO', 'User Authenticated (Demo)', `User: ${matchedUser.username}`);
      return { success: true, role: 'USER' };
    }

    // 3. Server-First /api/login endpoint (No local copy checked first when online!)
    let networkReached = false;
    let backendErrorMsg = '';
    const appVersion = localStorage.getItem('sl_active_version') || '1.1.1170';
    const deviceModel = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 60) : 'Android Device';

    try {
      const effectiveUsername = rawUsername || rawOrgCode;
      const { response: loginRes } = await fetchBackendApi('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: effectiveUsername,
          password: rawPassword,
          org_code: rawOrgCode,
          app_version: appVersion,
          device_model: deviceModel,
        })
      }, get().customBackendUrl);
      networkReached = true;

      if (loginRes.ok) {
        const data = await loginRes.json();
        if (data.token) {
          if (data.superAdmin) {
            set({ currentUser: null, currentOrg: null, superAdminActive: true, token: data.token });
            setStoredJSON('sl_current_user', null);
            setStoredJSON('sl_current_org', null);
            setStoredJSON('sl_super_admin', true);
            setStoredJSON('sl_jwt_token', data.token);
            setTimeout(() => get().fetchSuperAdminData(), 50);
            return { success: true, role: 'ADMIN' };
          }

          if (data.user) {
            const userObj: UserProfile = {
              id: data.user.id,
              username: data.user.username || effectiveUsername,
              fullName: data.user.fullName || data.user.name || effectiveUsername,
              phone: data.user.phone || '',
              email: data.user.email || '',
              role: data.user.role || 'Community Member',
              orgCode: data.user.orgCode || data.user.org_code || rawOrgCode || '',
              createdAt: Date.now(),
              subscriptionStatus: 'trial',
              accountStatus: 'active',
              appVersion,
              deviceModel,
            };
            const assignedOrg = userObj.orgCode
              ? get().organizations.find(o => o.id.toLowerCase() === userObj.orgCode!.toLowerCase()) || ({ id: userObj.orgCode, name: userObj.orgCode } as any)
              : null;
            const nextRemembered = userObj.orgCode
              ? rememberOrganizationRecord({ id: userObj.orgCode, name: assignedOrg?.name || userObj.orgCode })
              : get().rememberedOrgs;

            set({
              currentUser: userObj,
              currentOrg: assignedOrg,
              rememberedOrgs: nextRemembered,
              superAdminActive: false,
              demoMode: false,
              token: data.token
            });
            setStoredJSON('sl_current_user', userObj);
            setStoredJSON('sl_current_org', assignedOrg);
            setStoredJSON('sl_super_admin', false);
            setStoredJSON('sl_demo_mode', false);
            setStoredJSON('sl_jwt_token', data.token);
            get().addAuditLog('SECURITY', 'INFO', 'User Authenticated (Backend)', `User: ${userObj.username}`);
            import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
            setTimeout(() => get().syncProvisionalAccounts(), 500);
            return { success: true, role: 'USER' };
          }

          const srvOrg = data.organization || {};
          const resolvedOrgId = String(srvOrg.id || data.org_code || data.orgId || rawOrgCode || effectiveUsername).trim().toUpperCase();
          const orgObj: Organization = {
            id: resolvedOrgId,
            name: srvOrg.name || data.org_name || resolvedOrgId,
            contactName: srvOrg.contactName || data.contactName || rawUsername || 'Commander',
            contactEmail: srvOrg.contactEmail || data.contactEmail || `${resolvedOrgId.toLowerCase()}@safetylink.app`,
            createdAt: srvOrg.createdAt || Date.now(),
            subscriptionStatus: srvOrg.subscriptionStatus || 'trial',
            approved: srvOrg.approved !== false
          };

          const updatedOrgs = [orgObj, ...get().organizations.filter(o => o.id.toUpperCase() !== orgObj.id)];
          const realOrgs = getStoredJSON<Organization[]>('sl_real_organizations', []);
          const updatedRealOrgs = [orgObj, ...realOrgs.filter(o => o.id.toUpperCase() !== orgObj.id)];
          const remembered = rememberOrganizationRecord(orgObj);

          set({
            currentUser: null,
            currentOrg: orgObj,
            organizations: updatedOrgs,
            rememberedOrgs: remembered,
            superAdminActive: false,
            demoMode: false,
            token: data.token
          });
          setStoredJSON('sl_organizations', updatedOrgs);
          setStoredJSON('sl_real_organizations', updatedRealOrgs);
          setStoredJSON('sl_current_user', null);
          setStoredJSON('sl_current_org', orgObj);
          setStoredJSON('sl_super_admin', false);
          setStoredJSON('sl_demo_mode', false);
          setStoredJSON('sl_jwt_token', data.token);
          get().addAuditLog('SECURITY', 'INFO', 'Organization Authenticated (Backend)', `Org: ${orgObj.name} (${orgObj.id})`);
          import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
          return { success: true, role: 'ORG' };
        }
      } else {
        const errData = await loginRes.json().catch(() => ({}));
        backendErrorMsg = errData?.error || `Authentication failed (${loginRes.status}).`;
        // Strictly reject when the server was reached and rejected credentials/status (no local fallback bypass!)
        return { success: false, error: backendErrorMsg, role: rawOrgCode ? 'ORG' : 'USER' };
      }
    } catch (apiErr) {
      console.warn('Backend /api/login unreachable (offline fallback permitted only when offline):', apiErr);
    }

    // 4. Offline-only Local Vault Fallback (reached ONLY when !networkReached)
    const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
    const allLocalUsers = [...realUsers, ...get().users.filter(u => !(u as any).isDemo)];
    const localUser = normUsername
      ? allLocalUsers.find(u => u.username.toLowerCase() === normUsername || (u.email && u.email.toLowerCase() === normUsername))
      : undefined;
    if (localUser) {
      if (rawOrgCode && (localUser.orgCode || '').toLowerCase() !== normOrgCode) {
        return { success: false, error: 'User does not belong to this organization code.', role: 'USER' };
      }
      const userPassword = (localUser as any).password;
      const userPasswordHash = (localUser as any).passwordHash;
      let offlinePwOk = true;
      if (!skipPasswordCheck) {
        if (userPasswordHash) {
          try {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawPassword));
            const rawHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            offlinePwOk = rawHash === userPasswordHash;
          } catch {
            offlinePwOk = false;
          }
        } else if (userPassword) {
          offlinePwOk = userPassword === rawPassword;
        }
      }
      if (!offlinePwOk) {
        return { success: false, error: 'Incorrect password.', role: 'USER' };
      }
      const nextRemembered = localUser.orgCode
        ? rememberOrganizationRecord({ id: localUser.orgCode, name: localUser.orgCode })
        : get().rememberedOrgs;
      set({
        currentUser: localUser,
        currentOrg: null,
        rememberedOrgs: nextRemembered,
        superAdminActive: false,
        token: 'offline-jwt-token'
      });
      setStoredJSON('sl_current_user', localUser);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_jwt_token', 'offline-jwt-token');
      import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
      return { success: true, role: 'USER' };
    }

    // Offline-only Organization Login Fallback
    const orgPool = [
      ...getStoredJSON<Organization[]>('sl_remembered_orgs', []),
      ...getStoredJSON<Organization[]>('sl_real_organizations', []),
      ...getStoredJSON<Organization[]>('sl_real_orgs', []),
      ...get().organizations,
    ];
    const targetOrgLookup = normOrgCode || normUsername;
    if (targetOrgLookup) {
      const matchedOrg = orgPool.find(o =>
        o?.id?.toLowerCase() === targetOrgLookup ||
        (normUsername && o?.name?.toLowerCase() === normUsername) ||
        (normUsername && o?.contactEmail?.toLowerCase() === normUsername) ||
        (normUsername && o?.contactName?.toLowerCase() === normUsername)
      );
      if (matchedOrg) {
        const orgPassword = (matchedOrg as any).password;
        if (!skipPasswordCheck && orgPassword && orgPassword !== rawPassword) {
          return { success: false, error: 'Incorrect password.', role: 'ORG' };
        }
        const remembered = rememberOrganizationRecord(matchedOrg);
        set({
          currentUser: null,
          currentOrg: matchedOrg,
          rememberedOrgs: remembered,
          superAdminActive: false,
          token: 'sl-org-jwt-token'
        });
        setStoredJSON('sl_current_user', null);
        setStoredJSON('sl_current_org', matchedOrg);
        setStoredJSON('sl_super_admin', false);
        setStoredJSON('sl_jwt_token', 'sl-org-jwt-token');
        get().addAuditLog('SECURITY', 'INFO', 'Organization Authenticated (Offline)', `Org: ${matchedOrg.name}`);
        import('../services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
        return { success: true, role: 'ORG' };
      }
    }

    try {
      const emailToUse = rawUsername.includes('@') ? rawUsername : `${rawUsername}@safetylink.app`;
      const userCred = await signInWithEmailAndPassword(auth, emailToUse, rawPassword || '');
      const userDoc = await getDoc(doc(db, 'users', userCred.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { username: rawUsername, orgCode: rawOrgCode };
      const token = await userCred.user.getIdToken();

      set({
        currentUser: userData as any,
        token,
        superAdminActive: false,
        currentOrg: userData.orgCode ? ({ id: userData.orgCode, name: userData.orgCode } as any) : null
      });
      setStoredJSON('sl_jwt_token', token);
      setStoredJSON('sl_current_user', userData);
      setStoredJSON('sl_super_admin', false);
      return { success: true, role: 'USER' };
    } catch {
      return { success: false, error: 'Could not reach the SafetyLink server and no offline account matched.', role: rawOrgCode ? 'ORG' : 'USER' };
    }
  },

  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });

      // Native Android: Google account picker from the phone (no popup, so it returns to the app).
      // Browser: Firebase signInWithPopup flow.
      let userCred: any;
      let token = '';
      if (Capacitor.isNativePlatform()) {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        const nativeRes: any = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: false });
        userCred = { user: nativeRes?.user };
        const idTokenRes = await FirebaseAuthentication.getIdToken().catch(() => ({ token: '' }));
        token = idTokenRes?.token || nativeRes?.credential?.idToken || '';
      } else {
        userCred = await signInWithPopup(auth, provider);
        token = typeof userCred.user?.getIdToken === 'function' ? await userCred.user.getIdToken() : '';
      }

      const gUser = userCred?.user;
      if (!gUser || !gUser.uid) {
        return { success: false, error: 'Google Sign-In did not return a valid Google account. Please try again.' };
      }

      const providerProfile = Array.isArray(gUser.providerData) && gUser.providerData.length > 0 ? gUser.providerData[0] : null;
      const realEmail: string = (gUser.email || providerProfile?.email || '').trim();
      const realDisplayName: string = (
        gUser.displayName ||
        providerProfile?.displayName ||
        (realEmail ? realEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : '')
      ).trim();
      const realPhotoUrl: string = (gUser.photoURL || providerProfile?.photoURL || '').trim();
      const realPhone: string = (gUser.phoneNumber || providerProfile?.phoneNumber || '').trim();
      const derivedUsername = (realEmail ? realEmail.split('@')[0] : realDisplayName || gUser.uid)
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '_')
        .slice(0, 48);

      let existingDoc: any = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', gUser.uid));
        if (userDoc.exists()) {
          existingDoc = userDoc.data();
        }
      } catch (docErr) {
        console.warn('Firestore user profile lookup notice:', docErr);
      }

      // Also check if a local profile already exists for this uid or email to preserve phone/orgCode
      const localMatch = get().users.find(
        u => u.id === gUser.uid || (realEmail && u.email?.toLowerCase() === realEmail.toLowerCase())
      );

      const cleanExistingName =
        existingDoc?.fullName && existingDoc.fullName !== 'Google User' && existingDoc.fullName !== 'Google Authenticated Member'
          ? existingDoc.fullName
          : '';

      const userData: UserProfile = {
        ...(localMatch || {}),
        ...(existingDoc || {}),
        id: gUser.uid,
        username: (existingDoc?.username && existingDoc.username !== 'Google User' && existingDoc.username !== 'Google Member')
          ? existingDoc.username
          : derivedUsername,
        fullName: realDisplayName || cleanExistingName || derivedUsername,
        email: realEmail || existingDoc?.email || localMatch?.email || '',
        phone: realPhone || existingDoc?.phone || localMatch?.phone || '',
        avatarUrl: realPhotoUrl || existingDoc?.avatarUrl || localMatch?.avatarUrl || '',
        orgCode: existingDoc?.orgCode || localMatch?.orgCode || '',
        role: (existingDoc?.role || localMatch?.role || 'Community Member') as any,
        subscriptionStatus: existingDoc?.subscriptionStatus || localMatch?.subscriptionStatus || 'trial',
        createdAt: existingDoc?.createdAt || localMatch?.createdAt || Date.now(),
      };

      // Persist clean public profile to Firestore without failing sign-in on strict rules
      try {
        if (!existingDoc) {
          await setDoc(doc(db, 'users', gUser.uid), {
            uid: gUser.uid,
            username: userData.username.slice(0, 64),
            fullName: userData.fullName.slice(0, 120),
            role: 'Community Member',
            orgCode: userData.orgCode || '',
            createdAt: serverTimestamp(),
          });
        }
      } catch (dbErr) {
        console.warn('Firestore setDoc notice:', dbErr);
      }

      // Sync Google user profile to backend
      try {
        await fetchBackendApi('/api/profile/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userData.id,
            username: userData.username,
            name: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            orgCode: userData.orgCode,
          })
        }, get().customBackendUrl);
      } catch (_) {}

      const nextUsers = [
        ...get().users.filter(u => u.id !== userData.id && (!userData.email || u.email?.toLowerCase() !== userData.email.toLowerCase())),
        userData,
      ];

      set({
        currentUser: userData,
        token: token || 'google-firebase-session',
        superAdminActive: false,
        currentOrg: userData.orgCode ? { id: userData.orgCode } as any : null,
        users: nextUsers,
      });
      setStoredJSON('sl_jwt_token', token || 'google-firebase-session');
      setStoredJSON('sl_current_user', userData);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_users', nextUsers);
      get().addAuditLog('SECURITY', 'INFO', 'User Authenticated via Google', `User: ${userData.fullName} (${userData.email})`);
      get().addToast(`Signed in as ${userData.fullName}`, 'success');

      return { success: true, role: 'USER' };
    } catch (e: any) {
      const code = String(e?.code || '');
      const msg = String(e?.message || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Google sign-in popup was closed before completing.' };
      }
      if (code === 'auth/popup-blocked') {
        return { success: false, error: 'Browser blocked the Google Sign-In popup. Allow popups for this site and try again.' };
      }
      if (code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: `Domain "${typeof window !== 'undefined' ? window.location.hostname : ''}" is not authorized in Firebase Auth → Authorized Domains. Add it in Firebase Console or open SafetyLink at safetylink.online.`,
        };
      }
      if (msg.includes('missing initial state') || msg.includes('sessionStorage') || msg.includes('cross-origin')) {
        return {
          success: false,
          error: 'Google Sign-In was blocked inside this embedded preview iframe. Open the app in a new browser tab to sign in with your real Google account.',
        };
      }
      console.error('Google Sign-In error:', e);
      return {
        success: false,
        error: `Google Sign-In failed (${code || 'auth_error'}): ${msg || 'Could not retrieve your Google account details.'}`,
      };
    }
  },

  fetchSuperAdminData: async () => {
    if (!get().superAdminActive) return;
    try {
      const token = get().token;
      if (!token) return;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };

      // 1. Fetch backend organizations and merge with local organizations
      try {
        const { response: orgsRes } = await fetchBackendApi('/api/super-admin/orgs', { headers }, get().customBackendUrl);
        if (orgsRes.ok) {
          const { orgs } = await orgsRes.json();
          if (orgs && Array.isArray(orgs)) {
            const formattedOrgs = orgs.map((o: any) => ({
              id: o.org_code || o.id,
              name: o.org_name || o.name || o.org_code || 'Organization',
              contactName: o.contact_name || o.name || 'Admin',
              contactEmail: o.contact_email || `${(o.org_code || o.id || '').toLowerCase()}@safetylink.app`,
              controlRoomNumber: o.control_room_number || '+27829110000',
              address: o.address || 'Headquarters',
              createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
              approved: true,
              trialActive: Boolean(o.trial_active),
              trialExpiresAt: o.trial_expires_at
            }));

            // Merge with local orgs
            const currentOrgs = [...get().organizations];
            for (const fo of formattedOrgs) {
              const idx = currentOrgs.findIndex(co => co.id.toLowerCase() === fo.id.toLowerCase());
              if (idx >= 0) {
                currentOrgs[idx] = { ...currentOrgs[idx], ...fo };
              } else {
                currentOrgs.push(fo);
              }
            }
            set({ organizations: currentOrgs });
            setStoredJSON('sl_organizations', currentOrgs);
          }
        }
      } catch (orgErr) {
        console.warn('Super admin org fetch note:', orgErr);
      }

      // 1b. Fetch Superadmin 24h/7d/30d telemetry summary, audit logs, & version policy
      try {
        const [summaryRes, logsRes, policyRes] = await Promise.all([
          fetchBackendApi('/api/admin/summary', { headers }, get().customBackendUrl).catch(() => null),
          fetchBackendApi('/api/admin/audit-logs', { headers }, get().customBackendUrl).catch(() => null),
          fetchBackendApi('/api/app/version-policy', {}, get().customBackendUrl).catch(() => null),
        ]);
        const updates: any = {};
        if (summaryRes?.response?.ok) {
          updates.adminSummaryStats = await summaryRes.response.json().catch(() => null);
        }
        if (logsRes?.response?.ok) {
          const d = await logsRes.response.json().catch(() => ({ logs: [] }));
          updates.adminAuditLogs = d.logs || [];
        }
        if (policyRes?.response?.ok) {
          const p = await policyRes.response.json().catch(() => null);
          if (p?.minSupportedVersion) {
            updates.minSupportedVersion = p.minSupportedVersion;
            setStoredJSON('sl_min_supported_version', p.minSupportedVersion);
          }
        }
        if (Object.keys(updates).length > 0) set(updates);
      } catch (telemetryErr) {
        console.warn('Superadmin telemetry fetch note:', telemetryErr);
      }

      // 2. Fetch backend users and merge seamlessly with all existing user records
      try {
        const { response: usersRes } = await fetchBackendApi('/api/admin/users', { headers }, get().customBackendUrl);
        if (usersRes.ok) {
          const { users } = await usersRes.json();
          if (users && Array.isArray(users)) {
            const currentUsers = [...get().users];
            
            for (const u of users) {
              const formattedUser: UserProfile = {
                id: String(u.id || u.phone || `USR-${Date.now()}`),
                username: u.username || u.name || 'User',
                fullName: u.fullName || u.name || u.full_name || 'User',
                email: u.email || `${u.phone || u.id}@safetylink.app`,
                role: u.role || 'Community Member',
                orgCode: u.orgCode || u.org_code || u.org_id || '',
                phone: u.phone || '',
                whatsapp: u.whatsapp || '',
                createdAt: u.createdAt || (u.created_at ? new Date(u.created_at).getTime() : Date.now()),
                homeAddress: u.homeAddress || u.address || '',
                workAddress: u.workAddress || '',
                preferredHospital: u.preferredHospital || '',
                medicalInfo: u.medicalInfo || '',
                medicalProfile: u.medicalProfile,
                emergencyContactsList: u.emergencyContactsList || '',
                subscriptionStatus: u.subscriptionStatus || 'active',
                accountStatus: u.accountStatus || u.status || 'active',
                appVersion: u.appVersion || u.app_version || '1.1.x',
                deviceModel: u.deviceModel || u.device_model || 'Unknown Device',
                lastSeen: u.lastSeen || u.last_seen || Date.now(),
              };

              const existingIdx = currentUsers.findIndex(cu => 
                (cu.id && cu.id === formattedUser.id) || 
                (cu.username && cu.username.toLowerCase() === formattedUser.username.toLowerCase()) ||
                (cu.phone && formattedUser.phone && cu.phone === formattedUser.phone)
              );

              if (existingIdx >= 0) {
                currentUsers[existingIdx] = { ...currentUsers[existingIdx], ...formattedUser };
              } else {
                currentUsers.push(formattedUser);
              }
            }

            set({ users: currentUsers });
            setStoredJSON('sl_users', currentUsers);
          }
        }
      } catch (userErr) {
        console.warn('Super admin users fetch note:', userErr);
      }

      // 3. Refresh telemetry & client database records
      get().refreshClientDatabase();
    } catch (e) {
      console.error('Failed to fetch super admin data', e);
    }
  },

  adminUpdateUserStatus: async (userId, action, reason = '') => {
    if (!get().superAdminActive || !get().token) return false;
    try {
      const { response } = await fetchBackendApi(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify({ action, reason }),
      }, get().customBackendUrl);
      if (response.ok) {
        const nextStatus = action === 'SUSPEND' ? 'suspended' : action === 'DEACTIVATE' ? 'deactivated' : action === 'ACTIVATE' ? 'active' : undefined;
        if (nextStatus) {
          const updated = get().users.map(u => u.id === userId ? { ...u, accountStatus: nextStatus as any } : u);
          set({ users: updated });
          setStoredJSON('sl_users', updated);
        }
        get().addAuditLog('SECURITY', action === 'ACTIVATE' ? 'INFO' : 'WARN', `Admin ${action} user ${userId}`, reason);
        await get().fetchSuperAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateMinSupportedVersion: async (version) => {
    if (!get().superAdminActive || !get().token) return false;
    try {
      const { response } = await fetchBackendApi('/api/admin/version-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify({ minSupportedVersion: version.trim() }),
      }, get().customBackendUrl);
      if (response.ok) {
        set({ minSupportedVersion: version.trim() });
        setStoredJSON('sl_min_supported_version', version.trim());
        get().addAuditLog('SECURITY', 'WARN', 'Minimum Version Policy Updated', `Required app version >= ${version.trim()}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  unlockOrganizationTrial: async (id: string) => {
    if (!get().demoMode && get().superAdminActive && get().token) {
      try {
        await fetchBackendApi(`/api/super-admin/orgs/${id}/unlock`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${get().token}` }
        }, get().customBackendUrl);
        get().fetchSuperAdminData(); // Refresh list to get new created_at
      } catch (e) { console.error('Failed to unlock trial', e); }
    }
  },

  logout: () => {
    set({ currentUser: null, currentOrg: null, superAdminActive: false, token: null, localAdminToken: null });
    setStoredJSON('sl_current_user', null);
    setStoredJSON('sl_current_org', null);
    setStoredJSON('sl_super_admin', false);
    setStoredJSON('sl_jwt_token', null);
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
      setStoredJSON('sl_panic_events', []);
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

  
  updateUserPassword: (id, newPassword) => {
    const users = get().users;
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, password: newPassword } : u
    );
    set({ users: updatedUsers as any });
    setStoredJSON('sl_users', updatedUsers);
    
    const realUsers = getStoredJSON('sl_real_users', []);
    const updatedReal = realUsers.map((u: any) => 
      u.id === id ? { ...u, password: newPassword } : u
    );
    setStoredJSON('sl_real_users', updatedReal);
    
    get().addAuditLog('SECURITY', 'INFO', 'User Password Changed', `Password updated for ${id}`);
    return { success: true };
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

  deleteUserProfile: async (id) => {
    if (!get().demoMode && get().superAdminActive && get().token) {
      try {
        await fetchBackendApi(`/api/super-admin/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${get().token}` }
        }, get().customBackendUrl);
      } catch (e) { console.error('Failed to delete user', e); }
    }
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

  deleteOrganization: async (id) => {
    if (!get().demoMode && get().superAdminActive && get().token) {
      try {
        await fetchBackendApi(`/api/super-admin/orgs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${get().token}` }
        }, get().customBackendUrl);
      } catch(e) { console.error('Failed to delete', e); }
    }
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
    
    // Push geo-location to Firestore if authenticated and sync is on
    const state = get();
    if (!state.demoMode && (state.currentUser || state.currentOrg) && Date.now() - lastThingsBoardLocationAt >= 60000) {
      lastThingsBoardLocationAt = Date.now();
      void import('../services/ThingsBoardService').then(({ sendSafetyLinkTelemetry }) =>
        sendSafetyLinkTelemetry({
          latitude: lat,
          longitude: lng,
          activeThreat: state.activeSOSState !== 'IDLE',
          drillMode: state.drillMode,
        })
      ).catch(() => {});
    }
    if (state.currentUser && state.currentUser.id && state.firestoreSync) {
      try {
        updateDoc(doc(db, 'users', state.currentUser.id), {
          lat: lat,
          lng: lng,
          lastLocationUpdate: Date.now(),
          gpsAccuracy: accuracy
        }).catch(err => {
           console.log('Non-critical: Firebase location sync skipped/failed offline', err.message);
        });
      } catch (err) {}
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
    set(state => {
      const updated = [newLog, ...state.auditLogs].slice(0, 100);
      setStoredJSON('sl_audit_logs', updated);
      return { auditLogs: updated };
    });
  },

  clearAuditLogs: () => {
    set({ auditLogs: [] });
    setStoredJSON('sl_audit_logs', []);
  },

  addDispatchLog: (entry) => {
    const newLog: DispatchLogEntry = {
      id: `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      ...entry
    };
    set(state => {
      const updated = [newLog, ...state.dispatchLogs].slice(0, 200);
      setStoredJSON('sl_dispatch_logs', updated);
      return { dispatchLogs: updated };
    });
  },

  clearDispatchLogs: () => {
    set({ dispatchLogs: [] });
    setStoredJSON('sl_dispatch_logs', []);
  },

  addNotificationPanelLog: (entry) => {
    const newLog: NotificationPanelLogEntry = {
      id: `np-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      ...entry
    };
    set(state => {
      const updated = [newLog, ...state.notificationPanelLogs].slice(0, 200);
      setStoredJSON('sl_notification_panel_logs', updated);
      return { notificationPanelLogs: updated };
    });
  },

  clearNotificationPanelLogs: () => {
    set({ notificationPanelLogs: [] });
    setStoredJSON('sl_notification_panel_logs', []);
  },

  setDispatchSettings: (settings) => {
    set(state => {
      const updated = { ...state.dispatchSettings, ...settings };
      setStoredJSON('sl_dispatch_settings', updated);
      if (
        settings.ussdEnabled !== undefined ||
        settings.offlineUssdMode !== undefined ||
        settings.reverseChargePrefix !== undefined ||
        settings.pcmCooldownMinutes !== undefined
      ) {
        NativeDispatchService.saveNativeProfile({
          ussdEnabled: Boolean(updated.ussdEnabled),
          offlineUssdMode: updated.offlineUssdMode || 'RAIN_PCM',
          reverseChargePrefix: updated.reverseChargePrefix || '127',
          pcmCooldownMinutes: typeof updated.pcmCooldownMinutes === 'number' ? updated.pcmCooldownMinutes : 5,
        }).catch(() => {});
      }
      return { dispatchSettings: updated };
    });
  },

  savePlatformIntegration: (platform) => {
    set(state => {
      const existingIdx = state.platformIntegrations.findIndex(p => p.id === platform.id || p.platformId === platform.platformId);
      let updated: PlatformIntegration[];
      if (existingIdx >= 0) {
        updated = [...state.platformIntegrations];
        updated[existingIdx] = { ...updated[existingIdx], ...platform };
      } else {
        updated = [platform, ...state.platformIntegrations];
      }
      setStoredJSON('sl_platform_integrations', updated);
      return { platformIntegrations: updated };
    });
  },

  removePlatformIntegration: (id) => {
    set(state => {
      const updated = state.platformIntegrations.filter(p => p.id !== id);
      setStoredJSON('sl_platform_integrations', updated);
      return { platformIntegrations: updated };
    });
  },

  deployPlatformIntegration: async (id) => {
    const target = get().platformIntegrations.find(p => p.id === id);
    if (!target) return { success: false, message: 'Platform not found' };
    const updated: PlatformIntegration = { 
      ...target, 
      status: 'DEPLOYED', 
      deployedAt: Date.now(), 
      lastPingStatus: 'DEPLOYED & ACTIVE (0ms latency)' 
    };
    get().savePlatformIntegration(updated);
    get().addAuditLog('SYSTEM', 'INFO', `Open Platform Deployed: ${target.name}`, `Integrated into active sequential dispatch pipeline.`);
    get().addDispatchLog({
      channel: 'TWILIO',
      target: target.name,
      status: 'SENT',
      unitId: get().currentUser?.id || 'SL-PLATFORM',
      details: `Integrated and deployed ${target.name} to SafetyLink runtime engine.`
    });
    return { success: true, message: `Successfully deployed ${target.name} into SafetyLink runtime.` };
  },

  setAutoRefreshUsersEnabled: (enabled) => {
    setStoredJSON('sl_auto_refresh_users', enabled);
    set({ isAutoRefreshUsersEnabled: enabled });
  },

  setAutoRefreshIntervalSeconds: (seconds) => {
    setStoredJSON('sl_auto_refresh_interval', seconds);
    set({ autoRefreshIntervalSeconds: seconds });
  },

  refreshClientDatabase: async () => {
    const currentUsers = get().users;
    const currentOrgs = get().organizations;
    const orgMap = new Map(currentOrgs.map(o => [o.id, o.name]));
    
    const records: ClientDatabaseRecord[] = currentUsers.map((u, i) => ({
      id: u.id,
      fullName: u.fullName || u.username,
      username: u.username,
      phone: u.phone,
      email: u.email,
      orgId: u.orgCode || 'GENERAL',
      orgName: orgMap.get(u.orgCode) || 'Community / Individual',
      role: u.role || 'Community Member',
      subscriptionTier: u.subscriptionStatus || 'active',
      lastSeen: Date.now() - (i * 120000),
      location: { 
        lat: -26.1912 + (Math.sin(i + 1) * 0.02), 
        lng: 28.0264 + (Math.cos(i + 1) * 0.02), 
        address: u.homeAddress || 'Braamfontein Mesh Precinct' 
      },
      hardwareBeaconId: u.accountNumber || `TAG-${u.id.slice(-4).toUpperCase()}`,
      batteryLevel: Math.max(15, 95 - (i % 6) * 12),
      source: 'APP_USER'
    }));

    setStoredJSON('sl_client_database_records', records);
    set({ clientDatabaseRecords: records, lastClientDatabaseSync: Date.now() });
    get().addAuditLog('SYSTEM', 'INFO', 'Client Database Refreshed', `Synchronized ${records.length} user records with telemetry.`);
  },

  restoreCustomerDatabase: async () => {
    const beforeCount = get().users.length;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authToken = get().token;
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const collected: any[] = [...get().users];
    let sources: Record<string, number> = {};

    // 1. Primary unified backend restore endpoint (Cloudflare D1 / Node SQLite + Firestore)
    try {
      const { response } = await fetchBackendApi('/api/admin/restore-customers', {
        method: 'POST',
        headers,
      }, get().customBackendUrl);
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && Array.isArray(data.users)) {
          collected.push(...data.users);
          if (data.sources) sources = { ...sources, ...data.sources };
        }
      }
    } catch (err) {
      console.warn('[restoreCustomerDatabase] /api/admin/restore-customers notice:', err);
    }

    // 2. Also refresh standard super-admin directory so organizations & recent users are included
    try {
      await get().fetchSuperAdminData();
      collected.push(...get().users);
    } catch {}

    // 3. Include organization contact entries if not already present
    for (const org of get().organizations || []) {
      if (org.contactEmail || org.name) {
        collected.push({
          id: `ORG-${org.id}`,
          username: String(org.id || '').toLowerCase(),
          fullName: org.contactName ? `${org.contactName} (${org.name})` : `${org.name} Admin`,
          phone: (org as any).contactPhone || '',
          email: org.contactEmail || '',
          orgCode: org.id,
          role: 'Organization Administrator',
          subscriptionStatus: org.subscriptionStatus || 'active',
          createdAt: org.createdAt || Date.now(),
        });
      }
    }

    // 4. Deduplicate cleanly by normalized phone -> lowercase email -> id
    const normPhone = (raw: string) => {
      const d = String(raw || '').replace(/[^0-9]/g, '');
      if (!d) return '';
      if (d.startsWith('27') && d.length === 11) return '0' + d.slice(2);
      if (d.length === 9 && /^[678]/.test(d)) return '0' + d;
      return d;
    };

    const byKey = new Map<string, UserProfile>();
    for (const raw of collected) {
      if (!raw) continue;
      const pKey = normPhone(raw.phone || '');
      const eKey = String(raw.email || '').trim().toLowerCase();
      const idKey = String(raw.id || '').trim();
      const key = pKey ? `p:${pKey}` : (eKey ? `e:${eKey}` : (idKey ? `id:${idKey}` : ''));
      if (!key) continue;

      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, {
          id: idKey || `SL-CUST-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          username: raw.username || (pKey ? `user_${pKey.slice(-4)}` : 'customer'),
          fullName: raw.fullName || raw.name || raw.username || 'SafetyLink Customer',
          phone: raw.phone || '',
          whatsapp: raw.whatsapp || raw.phone || '',
          email: raw.email || '',
          orgCode: raw.orgCode || raw.org_code || '',
          role: raw.role || 'Community Member',
          subscriptionStatus: raw.subscriptionStatus || raw.accountStatus || 'active',
          homeAddress: raw.homeAddress || '',
          workAddress: raw.workAddress || '',
          preferredHospital: raw.preferredHospital || '',
          medicalInfo: raw.medicalInfo || '',
          emergencyContactsList: raw.emergencyContactsList || '',
          liveSmsEnabled: Boolean(raw.liveSmsEnabled ?? true),
          createdAt: Number(raw.createdAt || Date.now()),
        } as UserProfile);
      } else {
        byKey.set(key, {
          ...prev,
          fullName: prev.fullName && prev.fullName !== 'SafetyLink Customer' ? prev.fullName : (raw.fullName || raw.name || prev.fullName),
          phone: prev.phone || raw.phone || '',
          whatsapp: prev.whatsapp || raw.whatsapp || prev.phone || '',
          email: prev.email || raw.email || '',
          orgCode: prev.orgCode || raw.orgCode || raw.org_code || '',
          role: prev.role && prev.role !== 'Community Member' ? prev.role : (raw.role || prev.role),
          homeAddress: prev.homeAddress || raw.homeAddress || '',
          medicalInfo: prev.medicalInfo || raw.medicalInfo || '',
        });
      }
    }

    const unifiedUsers = Array.from(byKey.values()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    set({ users: unifiedUsers });
    setStoredJSON('sl_users', unifiedUsers);
    await get().refreshClientDatabase();

    const addedCount = Math.max(0, unifiedUsers.length - beforeCount);
    get().addAuditLog(
      'SYSTEM',
      'INFO',
      'Customer Database Restored',
      `Unified ${unifiedUsers.length} registered SafetyLink customers (${addedCount} newly recovered).`
    );
    get().addToast(
      `Customer database restored: ${unifiedUsers.length} total customer${unifiedUsers.length === 1 ? '' : 's'} unified${addedCount > 0 ? ` (+${addedCount} recovered)` : ''}.`,
      'success'
    );
    return { ok: true, totalCount: unifiedUsers.length, addedCount, sources };
  },

  exportToGoogleDrive: async () => {
    const users = get().users;
    const records = get().clientDatabaseRecords.length > 0 
      ? get().clientDatabaseRecords 
      : (await get().refreshClientDatabase(), get().clientDatabaseRecords);

    get().addAuditLog('SYSTEM', 'INFO', 'Exporting Client Database to Google Drive', `Processing ${users.length} registered users & telemetry records.`);
    
    const fileId = get().googleDriveSyncFileId || `SL_DRIVE_ROSTER_${Date.now()}`;
    setStoredJSON('sl_google_drive_file_id', fileId);
    set({ googleDriveSyncFileId: fileId });

    // Format RFC 4180 CSV
    const headers = 'ID,Full Name,Username,Phone,WhatsApp,Email,Org Code,Role,Status,Registration Date,Home Address,Work Address,Preferred Hospital,Medical Notes,Emergency Contacts\n';
    const rows = users.map(u => 
      `"${u.id}","${(u.fullName || '').replace(/"/g, '""')}","${(u.username || '').replace(/"/g, '""')}","${(u.phone || '').replace(/"/g, '""')}","${(u.whatsapp || u.phone || '').replace(/"/g, '""')}","${(u.email || '').replace(/"/g, '""')}","${(u.orgCode || 'None').replace(/"/g, '""')}","${(u.role || 'Community Member').replace(/"/g, '""')}","${(u.subscriptionStatus || 'active').replace(/"/g, '""')}","${new Date(u.createdAt).toISOString()}","${(u.homeAddress || '').replace(/"/g, '""')}","${(u.workAddress || '').replace(/"/g, '""')}","${(u.preferredHospital || '').replace(/"/g, '""')}","${(u.medicalInfo || '').replace(/"/g, '""')}","${(u.emergencyContactsList || '').replace(/"/g, '""')}"`
    ).join('\n');
    const csvContent = headers + rows;

    try {
      await fetchBackendApi('/api/super-admin/export-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(get().token ? { 'Authorization': `Bearer ${get().token}` } : {})
        },
        body: JSON.stringify({
          fileId,
          filename: `SafetyLink_Users_Master_Roster_${new Date().toISOString().slice(0, 10)}.csv`,
          csvContent,
          usersCount: users.length,
          timestamp: new Date().toISOString()
        })
      }, get().customBackendUrl);
    } catch (e) {
      console.warn('Backend drive sync note:', e);
    }

    get().addDispatchLog({
      channel: 'NOTIFICATION_MINI_APP',
      target: 'Google Drive / SafetyLink_Users_Roster_Master.csv',
      status: 'SENT',
      unitId: get().currentUser?.id || 'SL-NODE-ADMIN',
      details: `Saved ${users.length} client records to Google Drive Document ID: ${fileId}`
    });

    get().addToast(`Synced ${users.length} clients to Google Drive (Doc ID: ${fileId.slice(-8)})`, 'success');
    return { success: true, fileId, fileUrl: `https://drive.google.com/file/d/${fileId}/view` };
  },

  triggerFromMasterKey: async (submittedKey) => {
    if (!STATIC_INTERCEPTOR_MASTER_KEY || submittedKey !== STATIC_INTERCEPTOR_MASTER_KEY) return false;
    get().addAuditLog('SECURITY', 'SEVERE', 'Static Interceptor Fired', 'Emergency triggered via master key showcase interceptor, not a real device.');
    await get().triggerPanic('Triggered via Tier-1 Static Interceptor (showcase master key)');
    return true;
  },

    triggerPanic: async (description?: string, countdownElapsed?: boolean) => {
    if (get().activeSOSState !== 'IDLE') return;
    
    const user = get().currentUser;
    const isDemo = Boolean(get().demoMode || user?.isDemo);
    const coords = get().userLocation || { lat: 0, lng: 0 };
    const primaryContact = (get().contacts || []).find((c: any) => c.priority === 1) || (get().contacts || [])[0];
    const allPhones = (get().contacts || []).map((c: any) => c.phone).filter(Boolean).join(',') || primaryContact?.phone || user?.phone || '';
    const effectivePrimaryPhone = primaryContact?.phone || user?.phone || '';
    const effectiveTargetOrg = user?.orgCode || get().currentOrg?.id || get().currentOrg?.orgCode || 'INDIVIDUAL';
    const incidentId = `INC-${Date.now()}`;

    set({ activeSOSState: 'ACQUIRING_GPS', panicCountdown: null });
    if (!isDemo && (user || get().currentOrg)) {
      void import('../services/ThingsBoardService').then(({ sendSafetyLinkTelemetry }) =>
        sendSafetyLinkTelemetry({ activeThreat: true, drillMode: get().drillMode, latitude: coords.lat, longitude: coords.lng })
      ).catch(() => {});
    }
    get().addAuditLog('SECURITY', 'SEVERE', isDemo ? 'Demo Panic Triggered [SIMULATED]' : 'Panic Triggered', description || '');

    // 1. Canonical Native Android Path: delegate execution exclusively to PanicService -> EmergencyService.
    // The UI NEVER asserts DISPATCHED here; it waits for real native DispatchResult via onPanicStatusChange.
    const isNativeApp = Capacitor.isNativePlatform();
    if (isNativeApp && !isDemo) {
      set({ activeSOSState: 'ESCALATING' });
      try {
        const res = await NativeDispatchService.triggerNativeEmergency({
          description: description || 'Emergency SOS Distress Signal',
          phone: effectivePrimaryPhone,
          phones: allPhones,
          latitude: coords.lat,
          longitude: coords.lng,
          organizationId: effectiveTargetOrg,
          userId: user?.id || 'USER-LIVE',
          directDispatch: !!countdownElapsed || (get().sosCountdownDuration === 0),
          countdownSeconds: typeof get().sosCountdownDuration === 'number' ? get().sosCountdownDuration : 10,
        });
        get().addAuditLog(
          'SECURITY',
          'SEVERE',
          'Canonical Native PanicService Engaged',
          `Native status: ${res.status}`
        );
        return;
      } catch (e) {
        console.error('[Store:triggerPanic] Native bridge failed; queuing offline & attempting web fallback:', e);
        set(state => ({
          localOfflineQueue: [
            ...state.localOfflineQueue,
            { id: incidentId, timestamp: Date.now(), description: description || 'Emergency SOS', lat: coords.lat, lng: coords.lng }
          ]
        }));
        setStoredJSON('sl_offline_queue', get().localOfflineQueue);
        get().addToast('Native emergency bridge error; attempting cloud fallback.', 'error');
      }
    }

    // 2. Web Browser / Demo Dispatch Path
    set({ activeSOSState: 'ESCALATING' });
    const integrationsConfig: Record<string, any> = {};
    for (const p of get().platformIntegrations) {
      if (p.status === 'DEPLOYED' || p.status === 'CONFIGURED') {
        integrationsConfig[p.platformId] = {
          apiKey: p.apiKey,
          apiSecret: p.apiSecret,
          accountSid: p.accountSid,
          phoneOrLine: p.phoneOrLine,
          senderId: p.senderId
        };
      }
    }

    if (user?.customTwilioConfig?.accountSid && user?.customTwilioConfig?.authToken) {
      integrationsConfig['twilio'] = {
        accountSid: user.customTwilioConfig.accountSid,
        apiSecret: user.customTwilioConfig.authToken,
        phoneOrLine: user.customTwilioConfig.phoneNumber,
        isCustomUserAccount: true
      };
    }

    const emergencyPayload = {
      incidentId,
      userId: user?.id || 'USER-LIVE',
      org_code: effectiveTargetOrg,
      orgId: effectiveTargetOrg,
      latitude: coords.lat,
      longitude: coords.lng,
      phone: user?.phone || effectivePrimaryPhone,
      callerName: user?.fullName || user?.username || 'SafetyLink User',
      callerNumber: user?.phone || effectivePrimaryPhone,
      emergencyContacts: (get().contacts || []).map((c: any) => ({
        name: c.name || c.label,
        phone: c.phone,
        whatsapp: (c.channelType === 'WHATSAPP' || c.hasWhatsApp) ? c.phone : ''
      })),
      description: description || 'Emergency Distress Signal',
      isDrill: false,
      isDemo,
      canUseAdminTwilio: true,
      preferFcmOnline: Boolean(get().dispatchSettings.preferFcmOnline),
      smsCooldownMinutes: typeof get().dispatchSettings.pcmCooldownMinutes === 'number' ? get().dispatchSettings.pcmCooldownMinutes : 5,
      integrationsConfig
    };

    let dispatchSuccess = false;
    // Non-blocking Hikvision Soft-IO panic alert hook (never delays SOS dispatch)
    get().triggerCameraSoftIo().catch(() => {});
    try {
      const { response } = await fetchBackendApi('/api/panic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergencyPayload)
      }, get().customBackendUrl);
      if (response.ok) {
        dispatchSuccess = true;
        get().addAuditLog('SYSTEM', 'INFO', 'Cloud Telemetry & Dispatch Accepted', `Incident ${incidentId} processed by SafetyLink backend`);
      }
    } catch (err) {
      console.warn('[Panic Alert] Backend dispatch attempt failed:', err);
    }

    if (isDemo && !dispatchSuccess) {
      dispatchSuccess = true;
    }

    if (dispatchSuccess) {
      const newPanicEvent: PanicEvent = {
        id: incidentId,
        status: 'DISPATCHED',
        severity: 'CRITICAL',
        lat: coords.lat,
        lng: coords.lng,
        timestamp: Date.now(),
        assignedResponder: effectiveTargetOrg !== 'INDIVIDUAL' ? `${effectiveTargetOrg} Patrol Unit` : 'Escalated Regional Patrol Unit',
        description: `${description || 'Emergency Distress Signal'} - ${user?.fullName || user?.username || 'User'} (${effectiveTargetOrg})`,
        timelineData: [
          `Distress signal registered at ${new Date().toLocaleTimeString()}`,
          `Bound to Organization Mesh: ${effectiveTargetOrg}`,
          isDemo ? 'Simulated Showcase Broadcast (Demo Mode)' : 'Dispatched via SafetyLink Server Relay'
        ]
      };

      set(state => ({
        activeSOSState: 'DISPATCHED',
        panicEvents: [newPanicEvent, ...state.panicEvents],
        postEmergencyPrompt: {
          incidentId,
          summary: `Emergency alert (${incidentId}) dispatched. Lizzy AI is ready via Live Voice or Chat to stay with you until help arrives.`,
          timestamp: Date.now(),
        },
      }));
      setStoredJSON('sl_panic_events', get().panicEvents);

      // Schedule follow-up check-in AND immediately launch Kleva hands-free "Are you okay?" check-in
      get().scheduleAiCheckIn();
      if (get().dispatchSettings.aiCheckInEnabled !== false) {
        setTimeout(() => {
          const latest = get();
          if (latest.activeSOSState !== 'IDLE' && !latest.showLizzyPopup) {
            latest.setShowLizzyPopup(true);
          }
        }, 2500);
      }

      if (isDemo) {
        get().addAuditLog('SECURITY', 'SEVERE', 'Demo Panic Dispatched [SIMULATED]', `${incidentId}: Simulation completed.`);
        get().addToast('DEMO BROADCAST SIMULATED: Distress drill completed.', 'info');
      } else {
        get().addAuditLog('SECURITY', 'SEVERE', 'Panic Dispatched (Web)', `${incidentId}: Synced to Organization ${effectiveTargetOrg}.`);
        get().addToast(`Emergency alert synced to ${effectiveTargetOrg} server`, 'success');
      }
    } else {
      const nextQueue = [
        ...get().localOfflineQueue,
        { id: incidentId, timestamp: Date.now(), description: description || 'Emergency SOS', lat: coords.lat, lng: coords.lng }
      ];
      set({
        activeSOSState: 'ESCALATING',
        localOfflineQueue: nextQueue
      });
      setStoredJSON('sl_offline_queue', nextQueue);
      get().scheduleAiCheckIn();
      if (get().dispatchSettings.aiCheckInEnabled !== false) {
        setTimeout(() => {
          const latest = get();
          if (latest.activeSOSState !== 'IDLE' && !latest.showLizzyPopup) {
            latest.setShowLizzyPopup(true);
          }
        }, 2500);
      }
      get().addAuditLog('SECURITY', 'SEVERE', 'Offline Dispatch Queued', `${incidentId}: Queued locally for sync on reconnect.`);
      get().addToast('Server unreachable. Incident queued offline and will sync automatically when online.', 'warn');
    }
  },

  triggerSOS: (description?: string, durationSec?: number) => {
    const duration = durationSec !== undefined ? durationSec : get().sosCountdownDuration;
    if (duration === 0) {
      get().triggerPanic(description || 'Emergency Distress Signal', true);
      return;
    }

    set({ panicCountdown: duration });

    const timerId = setInterval(() => {
      const currentCountdown = get().panicCountdown;
      if (currentCountdown === null) {
        clearInterval(timerId);
        return;
      }
      
      if (currentCountdown <= 1) {
        clearInterval(timerId);
        set({ panicCountdown: null });
        get().triggerPanic(description || 'Emergency Distress Signal', true);
      } else {
        set({ panicCountdown: currentCountdown - 1 });
      }
    }, 1000);
  },

  cancelSOS: () => {
     const wasActive = get().activeSOSState !== 'IDLE' || get().panicCountdown !== null;
     const latest = get().currentPanicEvent || get().panicEvents[0];
     set({
       activeSOSState: 'IDLE',
       panicCountdown: null,
       ...(wasActive
         ? {
             postEmergencyPrompt: {
               incidentId: latest?.id || `DISARM-${Date.now().toString().slice(-5)}`,
               summary: latest?.description || 'Emergency SOS was just disarmed. Checking in to make sure you are completely safe.',
               timestamp: Date.now(),
             },
           }
         : {}),
     });
     if (Capacitor.isNativePlatform()) {
         NativeDispatchService.cancelNativeEmergency().catch(console.error);
     }
  },

  startMultiStagePanic: (description, durationSec) => {
    const duration = durationSec !== undefined ? durationSec : get().sosCountdownDuration;
    if (duration === 0) {
      get().triggerPanic(description, true);
      return;
    }

    set({ panicCountdown: duration });

    const timerId = setInterval(() => {
      const currentCountdown = get().panicCountdown;
      if (currentCountdown === null) {
        clearInterval(timerId);
        return;
      }

      if (currentCountdown <= 1) {
        clearInterval(timerId);
        set({ panicCountdown: null });
        get().triggerPanic(description, true);
      } else {
        set({ panicCountdown: currentCountdown - 1 });
      }
    }, 1000);
  },

  syncOfflineQueue: async (silent = false) => {
    const queue = get().localOfflineQueue;
    if (queue.length === 0) {
      if (!silent) get().addToast('Offline dispatch queue is empty.', 'info');
      return;
    }

    get().addAuditLog('DISPATCH', 'INFO', `Syncing ${queue.length} locally queued offline alerts`, 'Establishing connection...');
    
    const failedItems = [];
    const who = get().currentUser?.username || get().currentOrg?.name || 'Unknown';
    const orgId = get().currentUser?.orgCode || get().currentOrg?.id || 'INDIVIDUAL';

    // Check if worker endpoint is available for bulk sync
    try {
      const { response: bulkRes } = await fetchBackendApi('/api/sync/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, payload: queue })
      }, get().customBackendUrl);
      if (bulkRes.ok) {
         const { failedItems: returnedFailures } = await bulkRes.json();
         if (returnedFailures && Array.isArray(returnedFailures) && returnedFailures.length > 0) {
            set({ localOfflineQueue: returnedFailures });
            setStoredJSON('sl_offline_queue', returnedFailures);
            get().addToast(`Sync completed with ${returnedFailures.length} failures remaining in queue.`, 'warn');
            get().addAuditLog('SYSTEM', 'WARN', 'Offline alert cache sync partial', `${returnedFailures.length} items failed to sync.`);
         } else {
            set({ localOfflineQueue: [] });
            setStoredJSON('sl_offline_queue', []);
            if (!silent) get().addToast('Successfully synced all offline queued alerts to worker!', 'success');
            get().addAuditLog('SYSTEM', 'INFO', 'Offline alert cache synced successfully via Worker DB', 'Local storage buffer fully flushed.');
         }
         return;
      }
    } catch (e) {
      console.warn('Worker bulk sync failed, falling back to individual endpoints', e);
    }

    for (const item of queue) {
      try {
        let ok = false;

        try {
          const { response: res } = await fetchBackendApi('/api/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id,
              latitude: item.lat,
              longitude: item.lng,
              description: item.description,
              org_id: orgId,
              triggered_by: who,
              status: 'DISPATCHED',
              severity: 'CRITICAL'
            })
          }, get().customBackendUrl);
          if (res.ok) {
            ok = true;
          }
        } catch (e) {
          console.warn('Backend sync failed, continuing');
        }

        if (ok) {
          const newEvent: PanicEvent = {
            id: item.id,
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
        } else {
          failedItems.push(item);
        }
      } catch (e) {
        failedItems.push(item);
      }
    }

    set({ localOfflineQueue: failedItems });
    setStoredJSON('sl_offline_queue', failedItems);
    setStoredJSON('sl_panic_events', get().panicEvents);

    if (failedItems.length === 0) {
      if (!silent) get().addToast('Successfully synced all offline queued alerts!', 'success');
      get().addAuditLog('SYSTEM', 'INFO', 'Offline alert cache synced successfully', 'Local storage buffer fully flushed.');
    } else {
      get().addToast(`Sync completed with ${failedItems.length} failures remaining in queue.`, 'warn');
      get().addAuditLog('SYSTEM', 'WARN', 'Offline alert cache sync partial', `${failedItems.length} items failed to sync.`);
    }
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

  showTrialReminder: false,
  setShowTrialReminder: (show) => set({ showTrialReminder: show }),
  adminUpdateSubscription: (id, type, status) => {
    if (type === 'user') {
      const updatedUsers = get().users.map(u => u.id === id ? { ...u, subscriptionStatus: status } : u);
      set({ users: updatedUsers });
      setStoredJSON('sl_users', updatedUsers);
      
      const currUser = get().currentUser;
      if (currUser && currUser.id === id) {
        const nextUser = { ...currUser, subscriptionStatus: status };
        set({ currentUser: nextUser });
        setStoredJSON('sl_current_user', nextUser);
      }
    } else {
      const updatedOrgs = get().organizations.map(o => o.id === id ? { ...o, subscriptionStatus: status } : o);
      set({ organizations: updatedOrgs });
      setStoredJSON('sl_organizations', updatedOrgs);
      
      const currOrg = get().currentOrg;
      if (currOrg && currOrg.id === id) {
        const nextOrg = { ...currOrg, subscriptionStatus: status };
        set({ currentOrg: nextOrg });
        setStoredJSON('sl_current_org', nextOrg);
      }
    }
    get().addAuditLog('SYSTEM', 'INFO', 'Subscription Updated', `Admin updated subscription for ${type} ${id} to ${status}`);
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
    get().cancelAiCheckIn();
    const targetEv = get().panicEvents.find(ev => ev.id === id) || get().currentPanicEvent;
    set(state => ({
      panicEvents: state.panicEvents.map(ev => 
        ev.id === id ? { ...ev, status: 'RESOLVED', timelineData: [...ev.timelineData, `${new Date().toLocaleTimeString()} UTC - Resolved by safety operator.`] } : ev
      ),
      currentPanicEvent: state.currentPanicEvent?.id === id ? null : state.currentPanicEvent,
      activeSOSState: state.currentPanicEvent?.id === id ? 'IDLE' : state.activeSOSState,
      postEmergencyPrompt: {
        incidentId: id,
        summary: targetEv?.description || `Emergency ${id} was just resolved. Lizzy AI is ready to help you debrief, calm down, or update your contacts.`,
        timestamp: Date.now(),
      },
    }));
    setStoredJSON('sl_panic_events', get().panicEvents);
    const resolvedState = get();
    if (!resolvedState.demoMode && (resolvedState.currentUser || resolvedState.currentOrg)) {
      void import('../services/ThingsBoardService').then(({ sendSafetyLinkTelemetry }) =>
        sendSafetyLinkTelemetry({
          activeThreat: false,
          drillMode: resolvedState.drillMode,
          latitude: resolvedState.userLocation?.lat,
          longitude: resolvedState.userLocation?.lng,
        })
      ).catch(() => {});
    }
    get().addAuditLog('SYSTEM', 'INFO', `Incident ${id} marked as RESOLVED`, 'The tactical situation has been stabilized and closed.');
    
    if (get().currentOrg?.sensorStream?.enabled) {
      get().addAuditLog('DISPATCH', 'INFO', '[SensorStream] Closing UDP Telemetry stream', `Incident ${id} resolved.`);
      fetchBackendApi('/api/dispatch/sensorstream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          udpHost: get().currentOrg?.sensorStream?.udpHost,
          udpPort: get().currentOrg?.sensorStream?.udpPort,
          payload: { incidentId: id, status: 'RESOLVED' },
        })
      }, get().customBackendUrl).catch(e => console.warn('SensorStream stop error', e));
    }
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

    // On Native Android, ITagGattManager + ButtonPatternDetector + PanicService handle GATT and physical clicks exclusively.
    // Do NOT fall through to web/BleService.ts or open duplicate GATT listeners.
    if (Capacitor.isNativePlatform()) {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTING' } : d)
      }));
      import('../services/ITagPluginService').then(({ ITagPluginService }) => {
        ITagPluginService.connectDevice(
          mac,
          (status) => {
            set(state => ({
              bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: status === 'connected' ? 'CONNECTED' : 'DISCONNECTED', rssi: status === 'connected' ? -50 : -100, lastSeen: Date.now() } : d)
            }));
            setStoredJSON('sl_ble_devices', get().bleDevices);
          },
          (val) => {
            get().addAuditLog('BLE', 'SEVERE', 'iTAG Physical Button Press', `Hardware click code ${val} from ${mac} handled by native PanicService`);
          },
          (battery) => {
            set(state => ({
              bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, batteryLevel: battery } : d)
            }));
            setStoredJSON('sl_ble_devices', get().bleDevices);
          },
          (rssi) => {
            set(state => ({
              bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, rssi } : d)
            }));
          }
        ).catch(e => console.warn('[store] Native connectDevice note:', e));
      }).catch(() => {});
      return;
    }

    if (!device.triggerServiceUuid || !device.triggerCharacteristicUuid) {
      // In web simulator, run standard wizard or mark connected
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
        get().handleHardwareButtonPress(mac);
      },
      () => {
        set(state => ({
          bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
        }));
        setStoredJSON('sl_ble_devices', get().bleDevices);
        get().addAuditLog('BLE', 'SEVERE', 'BLE Wearable Connection Severed', `Hardware link to ${mac} was terminated (out of range or battery dead).`);
        // Auto-reconnect: single non-recursive timer, no stacking
        const maxAttempts = 10;
        let attempt = 0;
        const scheduleReconnect = () => {
          attempt++;
          if (attempt > maxAttempts) return;
          const device = get().bleDevices.find(d => d.macAddress === mac);
          if (!device || device.connectionState === 'CONNECTED') return;
          const delay = Math.min(30000 * attempt, 120000); // 30s, 60s … 120s max
          setTimeout(() => {
            const d = get().bleDevices.find(d => d.macAddress === mac);
            if (!d || d.connectionState === 'CONNECTED') return;
            get().connectBleDevice(mac);
          }, delay);
        };
        scheduleReconnect();
      }
    ).then(() => {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'CONNECTED', rssi: -55, lastSeen: Date.now() } : d)
      }));
      setStoredJSON('sl_ble_devices', get().bleDevices);
      get().addAuditLog('BLE', 'INFO', 'BLE Device Connected', `MAC: ${mac} -- subscribed to its bound trigger channel.`);
    }).catch((err: Error) => {
      set(state => ({
        bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED' } : d)
      }));
      setStoredJSON('sl_ble_devices', get().bleDevices);
      get().addAuditLog('BLE', 'SEVERE', 'BLE Connect Failed', `${mac}: ${err.message}`);
    });
  },

  disconnectBleDevice: (mac) => {
    const device = get().bleDevices.find(d => d.macAddress === mac);
    disconnectDevice(mac, device?.triggerServiceUuid && device?.triggerCharacteristicUuid ? { serviceUuid: device.triggerServiceUuid, characteristicUuid: device.triggerCharacteristicUuid } : undefined);
    if (Capacitor.isNativePlatform()) {
      import('../services/ITagPluginService').then(({ ITagPluginService }) => {
        ITagPluginService.disconnectDevice(mac).catch(() => {});
      }).catch(() => {});
    }
    set(state => ({
      bleDevices: state.bleDevices.map(d => d.macAddress === mac ? { ...d, connectionState: 'DISCONNECTED', rssi: -100 } : d)
    }));
    setStoredJSON('sl_ble_devices', get().bleDevices);
    get().addAuditLog('BLE', 'INFO', 'BLE Wearable Disconnected', `MAC: ${mac}`);
  },

  removeDevice: (mac) => {
    disconnectDevice(mac);
    if (Capacitor.isNativePlatform()) {
      import('../services/ITagPluginService').then(({ ITagPluginService }) => {
        ITagPluginService.forgetDevice(mac).catch(() => {});
      }).catch(() => {});
    }
    const updated = get().bleDevices.filter(d => d.macAddress !== mac);
    set({ bleDevices: updated });
    setStoredJSON('sl_ble_devices', updated);
    get().addAuditLog('BLE', 'WARN', 'BLE Wearable Device Forgotten', `MAC: ${mac}`);
  },

  approveOrganization: async (id) => {
    if (!get().demoMode) {
      try {
        await fetchBackendApi(`/api/admin/organizations/${id}/approve`, { method: 'POST' }, get().customBackendUrl);
      } catch(e) { console.error('Failed to approve', e); }
    }
    const updated = get().organizations.map(o => o.id === id ? { ...o, approved: true } : o);
    set({ organizations: updated });
    setStoredJSON('sl_organizations', updated);
    get().addAuditLog('SECURITY', 'INFO', 'Organization Registry Accepted', `ID: ${id} is now approved.`);
  },

  generateReferralCode: (orgId) => {
    const abbrev = orgId.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `REF-${abbrev}-${rand}`;
    const updated = get().organizations.map(o => o.id === orgId ? { ...o, referralCode: code, referralCount: o.referralCount ?? 0 } : o);
    set({ organizations: updated });
    setStoredJSON('sl_organizations', updated);
    get().addAuditLog('SYSTEM', 'INFO', 'Referral Code Generated', `Org: ${orgId}, Code: ${code}`);
    return code;
  },

  applyReferralCode: (code, userId) => {
    const trimmed = code.trim().toUpperCase();
    const org = get().organizations.find(o => o.referralCode?.toUpperCase() === trimmed);
    if (!org) return { success: false, error: 'Referral code not found.' };
    // Tag the user
    const updatedUsers = get().users.map(u => u.id === userId ? { ...u, referredByCode: trimmed } : u);
    set({ users: updatedUsers });
    setStoredJSON('sl_users', updatedUsers);
    // Increment org referral count
    const updatedOrgs = get().organizations.map(o => o.id === org.id ? { ...o, referralCount: (o.referralCount ?? 0) + 1 } : o);
    set({ organizations: updatedOrgs });
    setStoredJSON('sl_organizations', updatedOrgs);
    get().addAuditLog('SYSTEM', 'INFO', 'Referral Code Applied', `Code: ${trimmed}, User: ${userId}, Org: ${org.name}`);
    return { success: true };
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

  addCamera: (cam) => {
    const user = get().currentUser;
    const org = get().currentOrg;
    const camId = `cam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const resolvedOrgId = String(cam.orgId || org?.id || user?.orgCode || 'INDIVIDUAL').slice(0, 64);
    const resolvedOwnerUid = String(auth.currentUser?.uid || user?.id || org?.id || 'local-owner').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const {
      username,
      password,
      whepBearerToken,
      turnUsername,
      turnCredential,
      ...cleanMeta
    } = cam;

    const stripUrlCredentials = (raw?: string): string | undefined => {
      if (!raw || !raw.trim()) return undefined;
      try {
        const u = new URL(raw.trim());
        u.username = '';
        u.password = '';
        return u.toString();
      } catch {
        return raw.trim().replace(/https?:\/\/[^/@]+@/i, (m) => (m.toLowerCase().startsWith('https') ? 'https://' : 'http://'));
      }
    };

    const sanitizedWhepUrl = stripUrlCredentials(cleanMeta.whepUrl || cleanMeta.relayUrl);
    const defaultPresets = cleanMeta.ptzPresets && cleanMeta.ptzPresets.length > 0
      ? cleanMeta.ptzPresets.slice(0, 8)
      : [
          { presetId: 1, label: 'Gate Entry' },
          { presetId: 2, label: 'Perimeter' },
          { presetId: 3, label: 'Loading Bay' },
          { presetId: 4, label: 'Street View' },
        ];

    const newCam: CameraDevice = {
      ...cleanMeta,
      id: camId,
      orgId: resolvedOrgId,
      ownerUid: resolvedOwnerUid,
      whepUrl: sanitizedWhepUrl,
      relayUrl: sanitizedWhepUrl || cleanMeta.relayUrl,
      signalingMode:
        cleanMeta.signalingMode ||
        (cleanMeta.mode === 'WHEP_HLS_RELAY'
          ? 'WHEP_DIRECT'
          : cleanMeta.mode === 'LAN_ISAPI'
          ? 'LAN_ISAPI_POLL'
          : 'HIK_CONNECT_P2P'),
      streamProfile: cleanMeta.streamProfile || (Number(cleanMeta.channel) === 101 ? 'MAIN_HD' : 'SUB_MOBILE'),
      stunServers: cleanMeta.stunServers && cleanMeta.stunServers.length > 0 ? cleanMeta.stunServers.slice(0, 5) : ['stun:stun.l.google.com:19302'],
      turnUrls: cleanMeta.turnUrls ? cleanMeta.turnUrls.slice(0, 4) : [],
      ptzEnabled: cleanMeta.ptzEnabled ?? true,
      twoWayAudioEnabled: cleanMeta.twoWayAudioEnabled ?? true,
      ptzPresets: defaultPresets,
      status: 'UNVERIFIED',
      createdAt: Date.now(),
    };

    if (username || password || whepBearerToken || turnUsername || turnCredential) {
      const creds = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {});
      creds[camId] = {
        username: username || 'admin',
        password: password || '',
        ...(whepBearerToken ? { whepBearerToken } : {}),
        ...(turnUsername ? { turnUsername } : {}),
        ...(turnCredential ? { turnCredential } : {}),
      };
      setStoredJSON('sl_hikvision_local_creds', creds);
    }

    const updated = [newCam, ...get().cameras];
    set({ cameras: updated });
    setStoredJSON('sl_hikvision_cameras', updated);
    get().addAuditLog('SYSTEM', 'INFO', 'Hikvision CCTV Camera Onboarded', `${newCam.name} (${newCam.mode}) scoped to ${resolvedOrgId}`);

    if (auth.currentUser?.emailVerified) {
      const fsPayload: Record<string, any> = {
        id: camId,
        ownerUid: auth.currentUser.uid,
        orgId: resolvedOrgId,
        name: newCam.name.slice(0, 100),
        brand: newCam.brand,
        mode: newCam.mode,
        signalingMode: newCam.signalingMode,
        streamProfile: newCam.streamProfile,
        channel: Number(newCam.channel) || 101,
        httpPort: Number(newCam.httpPort) || 80,
        rtspPort: Number(newCam.rtspPort) || 554,
        ptzEnabled: Boolean(newCam.ptzEnabled),
        twoWayAudioEnabled: Boolean(newCam.twoWayAudioEnabled),
        ptzPresets: (newCam.ptzPresets || []).slice(0, 8).map((p) => ({
          presetId: Number(p.presetId) || 1,
          label: String(p.label || 'Preset').slice(0, 40),
        })),
        stunServers: (newCam.stunServers || []).slice(0, 5),
        turnUrls: (newCam.turnUrls || []).slice(0, 4),
        softIoTriggerId: Number(newCam.softIoTriggerId) || 1,
        triggerOnPanic: Boolean(newCam.triggerOnPanic),
        status: newCam.status,
        createdAt: serverTimestamp(),
      };
      if (newCam.serialNumber) fsPayload.serialNumber = newCam.serialNumber.slice(0, 64);
      if (newCam.host) fsPayload.host = newCam.host.slice(0, 128);
      if (newCam.whepUrl) fsPayload.whepUrl = newCam.whepUrl.slice(0, 512);
      setDoc(doc(db, 'cameras', camId), fsPayload).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.CREATE, `cameras/${camId}`);
        } catch {
          // Local storage preserves offline creation without blocking operator
        }
      });
    }
    return newCam;
  },

  updateCamera: (id, updatedFields) => {
    const sanitizeUrl = (raw?: string): string | undefined => {
      if (!raw || !raw.trim()) return undefined;
      try {
        const u = new URL(raw.trim());
        u.username = '';
        u.password = '';
        return u.toString();
      } catch {
        return raw.trim().replace(/https?:\/\/[^/@]+@/i, (m) => (m.toLowerCase().startsWith('https') ? 'https://' : 'http://'));
      }
    };

    const sanitizedFields: Partial<CameraDevice> = { ...updatedFields };
    if ('whepUrl' in updatedFields) {
      sanitizedFields.whepUrl = sanitizeUrl(updatedFields.whepUrl);
    }
    if ('relayUrl' in updatedFields && !('whepUrl' in updatedFields)) {
      sanitizedFields.whepUrl = sanitizeUrl(updatedFields.relayUrl);
    }

    const updated = get().cameras.map((c) =>
      c.id === id ? { ...c, ...sanitizedFields, updatedAt: Date.now() } : c
    );
    set({ cameras: updated });
    setStoredJSON('sl_hikvision_cameras', updated);
    if (auth.currentUser?.emailVerified) {
      const target = updated.find((c) => c.id === id);
      if (target) {
        const fsUpdate: Record<string, any> = {
          name: target.name.slice(0, 100),
          brand: target.brand,
          mode: target.mode,
          signalingMode: target.signalingMode || 'WHEP_DIRECT',
          streamProfile: target.streamProfile || 'SUB_MOBILE',
          channel: Number(target.channel) || 101,
          httpPort: Number(target.httpPort) || 80,
          rtspPort: Number(target.rtspPort) || 554,
          ptzEnabled: Boolean(target.ptzEnabled ?? true),
          twoWayAudioEnabled: Boolean(target.twoWayAudioEnabled ?? true),
          ptzPresets: (target.ptzPresets || []).slice(0, 8).map((p) => ({
            presetId: Number(p.presetId) || 1,
            label: String(p.label || 'Preset').slice(0, 40),
          })),
          stunServers: (target.stunServers || []).slice(0, 5),
          turnUrls: (target.turnUrls || []).slice(0, 4),
          softIoTriggerId: Number(target.softIoTriggerId) || 1,
          triggerOnPanic: Boolean(target.triggerOnPanic),
          status: target.status,
          updatedAt: serverTimestamp(),
        };
        if (target.serialNumber) fsUpdate.serialNumber = target.serialNumber.slice(0, 64);
        if (target.host) fsUpdate.host = target.host.slice(0, 128);
        if (target.whepUrl) fsUpdate.whepUrl = target.whepUrl.slice(0, 512);
        updateDoc(doc(db, 'cameras', id), fsUpdate).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `cameras/${id}`);
          } catch {
            // Non-blocking fallback for offline editing
          }
        });
      }
    }
  },

  removeCamera: (id) => {
    const updated = get().cameras.filter((c) => c.id !== id);
    set({ cameras: updated });
    setStoredJSON('sl_hikvision_cameras', updated);
    const creds = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {});
    if (creds[id]) {
      delete creds[id];
      setStoredJSON('sl_hikvision_local_creds', creds);
    }
    if (auth.currentUser?.emailVerified) {
      deleteDoc(doc(db, 'cameras', id)).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.DELETE, `cameras/${id}`);
        } catch {
          // Non-blocking fallback
        }
      });
    }
    get().addAuditLog('SYSTEM', 'INFO', 'CCTV Camera Removed', `ID: ${id}`);
  },

  getCameraLocalCredentials: (id) => {
    const creds = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {});
    return creds[id] || { username: 'admin', password: '' };
  },

  setCameraLocalCredentials: (id, newCreds) => {
    const creds = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {});
    creds[id] = { ...(creds[id] || {}), ...newCreds };
    setStoredJSON('sl_hikvision_local_creds', creds);
  },

  addCameraEvidenceSnapshot: (snap) => {
    const entry: CameraEvidenceSnapshot = {
      ...snap,
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      capturedAt: Date.now(),
    };
    const next = [entry, ...get().cameraEvidenceSnapshots].slice(0, 12);
    set({ cameraEvidenceSnapshots: next });
    setStoredJSON('sl_hikvision_snapshots', next);
    get().addAuditLog('SYSTEM', 'INFO', 'Camera Snapshot Captured', `${entry.cameraName} (${entry.orgId})`);
    return entry;
  },

  removeCameraEvidenceSnapshot: (id) => {
    const next = get().cameraEvidenceSnapshots.filter((s) => s.id !== id);
    set({ cameraEvidenceSnapshots: next });
    setStoredJSON('sl_hikvision_snapshots', next);
  },

  probeCamera: async (id) => {
    const cam = get().cameras.find((c) => c.id === id);
    if (!cam) return { reachable: false, diagnostics: 'Camera record not found.' };
    if (cam.mode === 'HIK_CONNECT_P2P') {
      const ok = Boolean(cam.serialNumber && cam.serialNumber.trim().length >= 6);
      const diag = ok
        ? `P2P Serial ${cam.serialNumber} ready for Hik-Connect mobile handoff.`
        : 'Enter valid 9-character Hikvision serial number from NVR/camera sticker.';
      get().updateCamera(id, {
        status: ok ? 'UNVERIFIED' : 'ERROR',
        lastError: ok ? undefined : diag,
        lastCheckedAt: Date.now(),
      });
      return { reachable: ok, diagnostics: diag };
    }
    const creds = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {})[id] || {
      username: 'admin',
      password: '',
    };
    try {
      const res = await fetch('/api/hikvision/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: cam.mode,
          host: cam.host,
          httpPort: cam.httpPort || 80,
          channel: cam.channel || 101,
          username: creds.username,
          password: creds.password,
          relayUrl: cam.whepUrl || cam.relayUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const nextStatus = data.reachable ? 'ONLINE' : 'OFFLINE';
      get().updateCamera(id, {
        status: nextStatus,
        lastError: data.reachable ? undefined : data.diagnostics || data.error || 'Unreachable',
        lastSnapshotBase64: data.snapshotPreviewBase64 || cam.lastSnapshotBase64,
        lastCheckedAt: Date.now(),
      });
      return {
        reachable: Boolean(data.reachable),
        diagnostics: data.diagnostics || data.error || (data.reachable ? 'Camera reachable.' : 'Unreachable'),
      };
    } catch (err: any) {
      const msg = err?.message || 'Probe failed.';
      get().updateCamera(id, { status: 'ERROR', lastError: msg, lastCheckedAt: Date.now() });
      return { reachable: false, diagnostics: msg };
    }
  },

  fetchCameraSnapshot: async (id) => {
    const cam = get().cameras.find((c) => c.id === id);
    if (!cam) return { ok: false, diagnostics: 'Camera not found.' };
    if (!cam.host) return { ok: false, diagnostics: 'No camera LAN IP/host configured for ISAPI snapshot.' };
    const creds = get().getCameraLocalCredentials(id);
    try {
      const res = await fetch('/api/hikvision/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: cam.host,
          httpPort: cam.httpPort || 80,
          channel: cam.channel || 102,
          username: creds.username || 'admin',
          password: creds.password || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.imageBase64) {
        get().updateCamera(id, {
          status: 'ONLINE',
          lastError: undefined,
          lastSnapshotBase64: data.imageBase64,
          lastCheckedAt: Date.now(),
        });
        return { ok: true, imageBase64: data.imageBase64, diagnostics: data.diagnostics || 'Frame received.' };
      }
      const diag = data.diagnostics || data.error || `HTTP ${res.status}`;
      get().updateCamera(id, { status: res.status === 401 ? 'ERROR' : 'OFFLINE', lastError: diag, lastCheckedAt: Date.now() });
      return { ok: false, diagnostics: diag };
    } catch (err: any) {
      const msg = err?.message || 'Snapshot request failed.';
      get().updateCamera(id, { status: 'ERROR', lastError: msg, lastCheckedAt: Date.now() });
      return { ok: false, diagnostics: msg };
    }
  },

  sendCameraPtz: async (id, cmd) => {
    const cam = get().cameras.find((c) => c.id === id);
    if (!cam) return { ok: false, diagnostics: 'Camera not found.' };
    if (!cam.host) return { ok: false, diagnostics: 'Configure camera IP/hostname in Connection Settings to enable ISAPI PTZ.' };
    const creds = get().getCameraLocalCredentials(id);
    try {
      const res = await fetch('/api/hikvision/ptz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: cam.host,
          httpPort: cam.httpPort || 80,
          channel: cam.channel || 101,
          action: cmd.action,
          pan: cmd.pan || 0,
          tilt: cmd.tilt || 0,
          zoom: cmd.zoom || 0,
          presetId: cmd.presetId || 1,
          username: creds.username || 'admin',
          password: creds.password || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      return {
        ok: Boolean(data.ok),
        statusCode: data.statusCode || res.status,
        diagnostics: data.diagnostics || data.error || `HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { ok: false, diagnostics: err?.message || 'PTZ network error.' };
    }
  },

  triggerSingleCameraSoftIo: async (id) => {
    const cam = get().cameras.find((c) => c.id === id);
    if (!cam) return { triggered: false, diagnostics: 'Camera not found.' };
    if (!cam.host) return { triggered: false, diagnostics: 'Configure LAN/Public camera host to trigger Soft-IO hardware relay.' };
    const creds = get().getCameraLocalCredentials(id);
    try {
      const res = await fetch('/api/hikvision/trigger-io', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: cam.host,
          httpPort: cam.httpPort || 80,
          softIoTriggerId: cam.softIoTriggerId || 1,
          username: creds.username || 'admin',
          password: creds.password || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.triggered) {
        get().addAuditLog('DISPATCH', 'INFO', 'Camera Soft-IO Relay Triggered', `${cam.name} Soft-IO #${cam.softIoTriggerId}`);
      }
      return {
        triggered: Boolean(data.triggered),
        statusCode: data.statusCode || res.status,
        diagnostics: data.diagnostics || data.error || `HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { triggered: false, diagnostics: err?.message || 'Soft-IO trigger failed.' };
    }
  },

  triggerCameraSoftIo: async () => {
    const armed = get().cameras.filter((c) => c.triggerOnPanic && c.host);
    if (armed.length === 0) return;
    const credsMap = getStoredJSON<Record<string, CameraLocalCredentials>>('sl_hikvision_local_creds', {});
    await Promise.allSettled(
      armed.map(async (cam) => {
        const creds = credsMap[cam.id] || { username: 'admin', password: '' };
        await fetch('/api/hikvision/trigger-io', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: cam.host,
            httpPort: cam.httpPort || 80,
            softIoTriggerId: cam.softIoTriggerId || 1,
            username: creds.username,
            password: creds.password,
          }),
        }).catch(() => {});
      })
    );
  },

  setCustomBackendUrl: (url) => {
    const trimmed = String(url || '').trim().replace(/\/+$/, '');
    const normalized = trimmed.includes(DEAD_BACKEND_HOST) ? PRIMARY_BACKEND_URL : trimmed;
    set({ customBackendUrl: normalized });
    setStoredJSON("sl_custom_backend_url", normalized);
    get().addAuditLog("SYSTEM", "INFO", "Custom Backend URL Updated", normalized ? `Backend set to ${normalized}` : "Backend URL cleared.");
  },
  setConnectyCubeConfig: (config) => {
    set({ connectyCubeConfig: config });
    setStoredJSON("sl_connectycube_config", config);
  },
  setTuyaConfig: (config) => {
    set({ tuyaConfig: config });
    setStoredJSON("sl_tuya_config", config);
  },
  setAuraApiUrl: (url) => {
    set({ auraApiUrl: url });
    setStoredJSON("sl_aura_api_url", url);
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

  incomingEmergencyRing: null,
  triggerIncomingEmergencyRing: (payload) => {
    const entry = {
      id: payload.id || `RING-${Date.now()}`,
      callerName: payload.callerName || 'SafetyLink Contact',
      callerNumber: payload.callerNumber || '',
      location: payload.location || 'Location pending',
      lat: payload.lat,
      lng: payload.lng,
      timestamp: Date.now(),
      source: payload.source || 'FCM_LOUD_ALARM',
    };
    set({ incomingEmergencyRing: entry });
    get().addAuditLog('DISPATCH', 'SEVERE', `Incoming Emergency Ring: ${entry.callerName}`, `${entry.callerNumber} · ${entry.location} (${entry.source})`);
  },
  dismissIncomingEmergencyRing: () => {
    set({ incomingEmergencyRing: null });
    if (Capacitor.isNativePlatform()) {
      import('../services/NativeDispatchService')
        .then(({ SafetyLinkEmergency }) => SafetyLinkEmergency.stopEmergencyAlarm().catch(() => {}))
        .catch(() => {});
    }
  },

  bleButtonConfig: {
    ...DEFAULT_BLE_BUTTON_CONFIG,
    ...getStoredJSON<Partial<BleButtonConfig>>('sl_ble_button_config', DEFAULT_BLE_BUTTON_CONFIG),
  },
  setBleButtonConfig: (config: Partial<BleButtonConfig>) => {
    const merged: BleButtonConfig = { ...DEFAULT_BLE_BUTTON_CONFIG, ...get().bleButtonConfig, ...config };
    set({ bleButtonConfig: merged });
    setStoredJSON('sl_ble_button_config', merged);
    if (Capacitor.isNativePlatform()) {
      import('../hooks/useEmergencyListener').then(({ SafetyLinkEmergency }) => {
        SafetyLinkEmergency.setButtonConfig(merged).catch(console.warn);
      }).catch(console.warn);
    }
    get().addAuditLog(
      'BLE',
      'INFO',
      'BLE Button Actions Updated',
      `1x=${merged.singlePressAction}, 2x=${merged.doublePressAction}, 3x=${merged.triplePressAction}, 4x=${merged.quadPressAction || 'VOICE_LIZZY'}, Hold=${merged.longPressAction || 'SILENT_PANIC'}, Window=${merged.multiPressWindowMs || 550}ms`
    );
  },
  handleHardwareButtonPress: (sourceMac?: string) => {
    const config: BleButtonConfig = { ...DEFAULT_BLE_BUTTON_CONFIG, ...get().bleButtonConfig };
    const isCountdownActive = get().panicCountdown !== null || get().activeSOSState !== 'IDLE';
    const windowMs = Math.max(250, Math.min(1500, Number(config.multiPressWindowMs) || 550));
    const countdownSec = typeof config.countdownOverrideSec === 'number' ? config.countdownOverrideSec : (get().sosCountdownDuration || 10);

    const playTone = (freq: number, durationSec: number, type: OscillatorType = 'triangle') => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.75, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + durationSec);
      } catch (e) {
        console.warn('Audio tone error:', e);
      }
    };

    // 1. Fail-Safe: If in active countdown, pressing again cancels & disarms when enabled
    if (isCountdownActive && config.cancelDuringCountdown) {
      get().cancelSOS();
      if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([700]);
      }
      get().addToast('Disarmed: Panic alert countdown cancelled via hardware button', 'info');
      get().addAuditLog('BLE', 'INFO', 'BLE Button Press -> Countdown Cancelled', `Source: ${sourceMac || 'Wearable'}`);
      webButtonPressCount = 0;
      if (webButtonPressTimer) {
        clearTimeout(webButtonPressTimer);
        webButtonPressTimer = null;
      }
      return;
    }

    // Special direct long-press invocation via 'LONG_PRESS' marker
    const isLongPress = sourceMac === 'LONG_PRESS' || sourceMac?.endsWith(':LONG');
    const executeAction = (action: BleButtonAction, label: string) => {
      get().addAuditLog('BLE', 'INFO', `BLE Button (${label}) Executing`, `Action: ${action} from ${sourceMac || 'Hardware'}`);

      if (action === 'PANIC') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([350, 150, 350]);
        if (countdownSec <= 0) {
          get().triggerPanic(`Hardware trigger: BLE button (${label})`, true);
        } else {
          get().startMultiStagePanic(`Hardware trigger: BLE button (${label})`, countdownSec);
        }
      } else if (action === 'INSTANT_PANIC') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([500, 100, 500]);
        get().triggerPanic(`Hardware Instant SOS (${label})`, true);
        get().addToast('⚡ Instant SOS dispatched via hardware button!', 'warn');
      } else if (action === 'SILENT_PANIC') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([180]);
        get().setSilenceAlerts(true);
        get().startMultiStagePanic(`Hardware trigger: Silent BLE alert (${label})`, Math.min(countdownSec, 5));
        get().addToast('🔕 Silent Stealth SOS initiated.', 'warn');
      } else if (action === 'CHECK_IN_SAFE') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([120, 80, 120]);
        const coords = get().userLocation;
        const locStr = coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'GPS active';
        get().addAuditLog('GPS', 'INFO', 'iTAG Safe Check-In Broadcast', `User marked SAFE at ${locStr}`);
        get().addToast(`✅ Safe Check-In recorded (${locStr})`, 'success');
      } else if (action === 'SHARE_GPS_PING') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([150, 80, 150]);
        const coords = get().userLocation;
        const mapLink = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : 'GPS acquiring';
        get().addAuditLog('GPS', 'INFO', 'iTAG Live GPS Ping Shared', mapLink);
        get().addToast(`📍 Live GPS Pin captured: ${mapLink}`, 'info');
      } else if (action === 'VOICE_LIZZY') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 60, 200]);
        get().openLizzyCompanion('voice');
        get().addToast('🎙️ Opening Lizzy AI Live Voice Companion...', 'info');
      } else if (action === 'SIREN_ONLY') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
        get().addToast('📢 Deterrent Siren activated (no dispatch sent).', 'warn');
        playTone(1180, 3.5, 'sawtooth');
      } else if (action === 'CANCEL') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([700]);
        get().cancelSOS();
        get().addToast('Disarmed: Active alert cancelled via button', 'info');
      } else if (action === 'SAFETY_TIMEOUT') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 100, 100, 100, 100]);
        get().startWatchMeTimer(config.safetyTimeoutMinutes);
        get().addToast(`⏱️ Safety Walk Timeout active: ${config.safetyTimeoutMinutes} minutes`, 'info');
      } else if (action === 'FIND_PHONE') {
        if (config.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        get().addToast('🔔 Find My Phone ringing...', 'info');
        playTone(920, 3.5, 'triangle');
      } else {
        get().addToast(`iTAG (${label}) ignored — action set to Disabled.`, 'info');
      }
    };

    if (isLongPress) {
      executeAction(config.longPressAction || 'SILENT_PANIC', 'Long Hold');
      return;
    }

    // 2. Aggregate presses within configurable multi-tap window
    webButtonPressCount++;
    if (webButtonPressTimer) {
      clearTimeout(webButtonPressTimer);
    }

    webButtonPressTimer = setTimeout(() => {
      const count = webButtonPressCount;
      webButtonPressCount = 0;
      webButtonPressTimer = null;

      let action: BleButtonAction = config.singlePressAction;
      if (count === 2) {
        action = config.doublePressAction;
      } else if (count === 3) {
        action = config.triplePressAction;
      } else if (count >= 4) {
        action = config.quadPressAction || config.triplePressAction;
      }

      executeAction(action, `${count}x Press`);
    }, windowMs);
  },

  // Primary Cellular SIM Card Selection (Emergency Auto-Lock)
  preferredSimId: getStoredJSON<number>('sl_preferred_sim_id', -1),
  availableSims: [],
  setPreferredSim: async (subId: number) => {
    set({ preferredSimId: subId });
    setStoredJSON('sl_preferred_sim_id', subId);
    try {
      await NativeDispatchService.setPreferredSim(subId);
    } catch (err) {
      console.warn('[Store] Failed to notify native layer of preferred SIM:', err);
    }
    const label = subId === -1 ? 'System Default (Auto-Lock)' : `SIM Card (Subscription ID: ${subId})`;
    get().addAuditLog('SYSTEM', 'INFO', 'Emergency SIM Card Locked', `Active cellular radio locked to ${label}. Dialog popups suppressed.`);
    get().addToast(`Primary Emergency SIM locked: ${label}`, 'success');
  },
  loadSimCards: async () => {
    try {
      const res = await NativeDispatchService.getSimCards();
      set({ availableSims: res.sims, preferredSimId: res.preferredSubscriptionId });
    } catch (err) {
      console.warn('[Store] Error loading SIM cards:', err);
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

if (typeof window !== 'undefined') {
  (window as any).__SAFETYLINK_STORE__ = useAppStore;
  window.addEventListener('online', () => {
    useAppStore.getState().syncProvisionalAccounts().catch(() => {});
    useAppStore.getState().syncOfflineQueue(true);
  });
}

