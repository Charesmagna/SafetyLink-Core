// SafetyLink Core Store (Zustand) - with performance fixes integrated
import { create } from 'zustand';
import { cleanupFirebaseSync } from '../services/FirebaseSyncService';
import { fetchWithTimeout } from '../services/FetchService';
import { geolocationService } from '../services/GeolocationService';
import { storageCache } from '../services/StorageService';
import { hasMeshNodeChanges, mergeMeshNodes } from '../services/MeshDiffService';
import { bleScanner } from '../services/BleService';

// Admin access code
export const ADMIN_ORG_CODE = 'SAFELINK-ADMIN';

// Storage helpers with cache layer (FIX #4)
const getStoredJSON = <T,>(key: string, fallback: T): T => {
  return storageCache.get(key, fallback);
};

const setStoredJSON = (key: string, data: any) => {
  storageCache.set(key, data);
};

export interface MeshNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'SECURE' | 'ACTIVE' | 'DISPATCHED';
  type: string;
  battery: number;
}

export interface AppState {
  // Auth state
  currentUser: any | null;
  currentOrg: any | null;
  superAdminActive: boolean;
  token: string | null;
  language: string;
  
  // Location & tracking
  userLocation: { lat: number; lng: number } | null;
  gpsAccuracy: string;
  meshNodes: MeshNode[];
  bleDevices: any[];
  
  // SOS state
  activeSOSState: 'IDLE' | 'ARMED' | 'TRIGGERED';
  drillMode: boolean;
  
  // UI state
  isScanning: boolean;
  pairingProgress: string | null;
  discoveredDevices: any[];
  customBackendUrl: string;
  
  // Actions
  logout: () => void;
  triggerPanic: (description: string) => Promise<void>;
  setMeshNodes: (nodes: MeshNode[]) => void;
  startBleScan: () => void;
  stopBleScan: () => void;
  updateLocation: (lat: number, lng: number, accuracy: string) => void;
  addAuditLog: (category: string, level: string, title: string, desc: string) => void;
  setLanguage: (lang: string) => void;
  connectBleDevice: (mac: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Default state
  currentUser: getStoredJSON('sl_current_user', null),
  currentOrg: getStoredJSON('sl_current_org', null),
  superAdminActive: getStoredJSON('sl_super_admin', false),
  token: getStoredJSON('sl_jwt_token', null),
  language: getStoredJSON('sl_language', 'en'),
  userLocation: getStoredJSON('sl_user_location', null),
  gpsAccuracy: '±0m',
  meshNodes: getStoredJSON('sl_mesh_nodes', []),
  bleDevices: getStoredJSON('sl_ble_devices', []),
  activeSOSState: 'IDLE',
  drillMode: false,
  isScanning: false,
  pairingProgress: null,
  discoveredDevices: [],
  customBackendUrl: import.meta.env.VITE_API_URL || 'https://api.safetylink.online',

  // FIX #1: Proper logout with cleanup
  logout: () => {
    cleanupFirebaseSync();
    geolocationService.unsubscribeAll?.();
    bleScanner.stopScan();
    storageCache.clear();
    
    set({ currentUser: null, currentOrg: null, superAdminActive: false, token: null });
    setStoredJSON('sl_current_user', null);
    setStoredJSON('sl_current_org', null);
    setStoredJSON('sl_super_admin', false);
    setStoredJSON('sl_jwt_token', null);
    get().addAuditLog('SECURITY', 'INFO', 'Session Terminated', 'User logged out. Resources cleaned up.');
  },

  // FIX #2: Panic trigger with fetch timeout
  triggerPanic: async (description) => {
    if (get().activeSOSState !== 'IDLE') return;
    
    const loc = get().userLocation || { lat: 0, lng: 0 };
    const isDrill = get().drillMode;
    
    set({ activeSOSState: 'TRIGGERED' });
    
    if (!isDrill) {
      try {
        const res = await fetchWithTimeout(`${get().customBackendUrl}/api/panic/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: get().currentUser?.id || 'SL-U-DEMO',
            latitude: loc.lat,
            longitude: loc.lng,
            description,
            isDrill
          }),
          timeout: 10000
        });
        
        if (res.ok) {
          get().addAuditLog('DISPATCH', 'INFO', 'SUCCESS', 'Panic alert dispatched.');
        }
      } catch (e) {
        get().addAuditLog('DISPATCH', 'WARN', 'FAILED', String(e));
      }
    }
    
    set({ activeSOSState: 'IDLE' });
  },

  // FIX #5: Smart diffing for mesh nodes
  setMeshNodes: (nodes) => {
    const current = get().meshNodes;
    
    if (!hasMeshNodeChanges(current, nodes)) {
      return; // Skip if no actual changes
    }
    
    const merged = mergeMeshNodes(
      current.filter(n => n.type !== 'RESPONDER'),
      nodes
    );
    
    setStoredJSON('sl_mesh_nodes', merged);
    set({ meshNodes: merged });
  },

  // FIX #9: BLE scan with proper cleanup
  startBleScan: () => {
    if (get().isScanning) return;
    set({ isScanning: true, pairingProgress: 'Scanning...', discoveredDevices: [] });
    
    bleScanner.startScan(
      (found) => {
        set(state => {
          if (state.discoveredDevices.some(d => d.deviceId === found.deviceId)) return state;
          return { discoveredDevices: [...state.discoveredDevices, found].sort((a, b) => b.rssi - a.rssi) };
        });
      },
      15000
    ).catch((err) => {
      set({ isScanning: false, pairingProgress: null });
      get().addAuditLog('BLE', 'SEVERE', 'Scan Failed', err.message);
    });
  },

  stopBleScan: () => {
    bleScanner.stopScan();
    set({ isScanning: false, pairingProgress: null });
  },

  updateLocation: (lat, lng, accuracy) => {
    const location = { lat, lng };
    setStoredJSON('sl_user_location', location);
    set({ userLocation: location, gpsAccuracy: accuracy });
  },

  addAuditLog: (category, level, title, desc) => {
    console.log(`[${category}:${level}] ${title}:`, desc);
  },

  setLanguage: (lang) => {
    setStoredJSON('sl_language', lang);
    set({ language: lang });
  },

  connectBleDevice: async (mac) => {
    console.log('Connecting to BLE device:', mac);
    // Implementation handled by native bridge
  }
}));
