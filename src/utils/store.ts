// Updated store.ts with performance fixes integrated
// This is a partial update showing the key changes:

import { create } from 'zustand';
import { cleanupFirebaseSync } from '../services/FirebaseSyncService';
import { fetchWithTimeout } from '../services/FetchService';
import { geolocationService } from '../services/GeolocationService';
import { storageCache } from '../services/StorageService';
import { hasMeshNodeChanges, mergeMeshNodes } from '../services/MeshDiffService';
import { bleScanner } from '../services/BleService';

// Replace old getStoredJSON with cache-backed version
const getStoredJSON = <T,>(key: string, fallback: T): T => {
  return storageCache.get(key, fallback);
};

const setStoredJSON = (key: string, data: any) => {
  storageCache.set(key, data);
};

// Updated logout to properly clean up
export const useAppStore = create<AppState>((set, get) => ({
  // ... existing state ...
  
  logout: () => {
    // FIX #1: Clean up Firestore listeners
    cleanupFirebaseSync();
    
    // Clean up geolocation service
    geolocationService.unsubscribeAll?.();
    
    // Clean up BLE scanner
    bleScanner.stopScan();
    
    // Clear storage cache
    storageCache.clear();
    
    set({ currentUser: null, currentOrg: null, superAdminActive: false, token: null });
    setStoredJSON('sl_current_user', null);
    setStoredJSON('sl_current_org', null);
    setStoredJSON('sl_super_admin', false);
    setStoredJSON('sl_jwt_token', null);
    get().addAuditLog('SECURITY', 'INFO', 'User/Session Terminated', 'Current session cleared with resource cleanup.');
  },
  
  // Updated triggerPanic to use FIX #2: fetch timeout
  triggerPanic: async (description) => {
    if (get().activeSOSState !== 'IDLE') return;
    
    const loc = get().userLocation || { lat: 0, lng: 0 };
    const isDrill = get().drillMode;
    
    // ... existing offline queue logic ...
    
    if (!isDrill) {
      try {
        // FIX #2: Use timeout-protected fetch
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
          timeout: 10000 // 10 second timeout
        });
        
        if (res.ok) {
          get().addAuditLog('DISPATCH', 'INFO', 'DATA MODE SUCCESS', 'Request completed within timeout.');
        }
      } catch (e) {
        get().addAuditLog('DISPATCH', 'WARN', 'DATA MODE FAILED', String(e));
      }
    }
  },
  
  // Updated setMeshNodes with FIX #5: smart diffing
  setMeshNodes: (nodes) => {
    const current = get().meshNodes;
    
    // Only update if nodes actually changed
    if (!hasMeshNodeChanges(current, nodes)) {
      return; // Skip render if no changes
    }
    
    const merged = mergeMeshNodes(
      current.filter(n => n.type !== 'RESPONDER'),
      nodes
    );
    
    localStorage.setItem('sl_mesh_nodes', JSON.stringify(merged));
    set({ meshNodes: merged });
  },
  
  // Updated startBleScan with FIX #9: proper cleanup
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
      get().addAuditLog('BLE', 'SEVERE', 'BLE Scan Failed', err.message);
    });
  },
  
  stopBleScan: () => {
    bleScanner.stopScan();
    set({ isScanning: false, pairingProgress: null });
  }
}));
