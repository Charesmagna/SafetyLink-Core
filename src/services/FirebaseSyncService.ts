import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore } from '../utils/store';

let firestoreUnsubscribe: (() => void) | null = null;

/**
 * FIX #1: Firestore Listener Memory Leak
 * Properly manages listener lifecycle to prevent memory leaks on logout.
 * Previously: Listeners were created but never unsubscribed.
 * Now: Returns unsubscribe function that MUST be called on logout.
 */
export const initFirebaseSync = () => {
  const state = useAppStore.getState();
  
  // Clean up any existing listener first
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }
  
  if (!state.currentUser?.id) return;
  
  try {
    const q = query(collection(db, 'users'), where('orgCode', '==', state.currentUser.orgCode || ''));
    
    firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
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
      
      const currentState = useAppStore.getState();
      const localNodes = currentState.meshNodes.filter(n => n.type !== 'RESPONDER');
      useAppStore.setState({ meshNodes: [...localNodes, ...nodes] });
    }, (error) => {
      console.warn('[FirebaseSync] Listener error:', error);
    });
  } catch (err) {
    console.error('[FirebaseSync] Failed to initialize:', err);
  }
};

/**
 * Cleanup function - MUST be called on logout
 */
export const cleanupFirebaseSync = () => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }
};
