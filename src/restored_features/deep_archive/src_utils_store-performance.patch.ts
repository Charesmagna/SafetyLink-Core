/**
 * PERFORMANCE FIXES FOR STORE
 * Apply these changes to src/utils/store.ts to fix:
 * 1. Firestore listener memory leak
 * 2. localStorage parse-on-access overhead
 * 3. Inefficient mesh node array reconstruction
 */

// FIX #1: Replace getStoredJSON with cached version
const storageCacheMap = new Map<string, any>();

const getStoredJSON = <T>(key: string, fallback: T): T => {
  // Check cache first
  if (storageCacheMap.has(key)) {
    return storageCacheMap.get(key);
  }
  
  try {
    const item = localStorage.getItem(key);
    const result = item ? JSON.parse(item) : fallback;
    // Cache the parsed result
    storageCacheMap.set(key, result);
    return result;
  } catch {
    return fallback;
  }
};

const setStoredJSON = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Update cache immediately
    storageCacheMap.set(key, data);
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

// FIX #2: Replace initMeshSync with proper cleanup
export const useAppStore = create<AppState>((set, get) => {
  let unsubscribe: (() => void) | null = null;

  return {
    // ... other fields
    initMeshSync: () => {
      // Cleanup previous subscription if it exists
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const state = get();
      if (state.firestoreSync && state.currentUser) {
        const q = query(
          collection(db, 'users'),
          where('orgCode', '==', state.currentUser.orgCode || '')
        );
        
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const nodes: any[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.id !== state.currentUser?.id && data.lat && data.lng) {
                nodes.push({
                  id: data.id,
                  name: data.username || 'Responder',
                  lat: data.lat,
                  lng: data.lng,
                  status: data.activeSOS ? 'ACTIVE' : 'SECURE',
                  type: 'RESPONDER',
                  battery: data.battery || 100,
                });
              }
            });

            const currentState = get();
            const localNodes = currentState.meshNodes.filter(
              (n) => n.type !== 'RESPONDER'
            );

            // FIX #3: Use diffing to only update if mesh nodes changed
            const newMeshNodes = [...localNodes, ...nodes];
            if (JSON.stringify(newMeshNodes) !== JSON.stringify(currentState.meshNodes)) {
              set({ meshNodes: newMeshNodes });
            }
          },
          (error) => {
            console.warn('Mesh sync listener error:', error);
            // Cleanup on error
            if (unsubscribe) {
              unsubscribe();
              unsubscribe = null;
            }
          }
        );
      }

      // Return cleanup function
      return () => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      };
    },

    // Add logout cleanup
    logout: () => {
      // Cleanup any active listeners
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      set({
        currentUser: null,
        currentOrg: null,
        superAdminActive: false,
        token: null,
      });
      setStoredJSON('sl_current_user', null);
      setStoredJSON('sl_current_org', null);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_jwt_token', null);
      get().addAuditLog(
        'SECURITY',
        'INFO',
        'User/Session Terminated',
        'Current session cleared.'
      );
    },
  };
});
