import { onSnapshot, collection, query, where, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore } from '../utils/store';
import { PanicEvent, UserProfile, Organization } from '../types';

let initialized = false;

export const initFirebaseSync = () => {
  if (initialized) return;
  initialized = true;

  console.log('[FirebaseSyncService] Initializing Real-Time Cloud Sync...');

  // 1. Listen for Panic Events from Firestore
  const panicsRef = collection(db, 'panicEvents');
  onSnapshot(panicsRef, (snapshot) => {
    const cloudPanics = snapshot.docs.map(doc => doc.data() as PanicEvent);
    
    // We update local store if cloud has different data
    const localPanics = useAppStore.getState().panicEvents;
    const merged = [...localPanics];
    let changed = false;

    cloudPanics.forEach(cp => {
      const idx = merged.findIndex(p => p.id === cp.id);
      if (idx === -1) {
        merged.push(cp);
        changed = true;
      } else {
        // Simple resolution sync
        if (merged[idx].status !== cp.status || merged[idx].responderAssigned !== cp.responderAssigned) {
          merged[idx] = cp;
          changed = true;
        }
      }
    });

    if (changed) {
       useAppStore.setState({ panicEvents: merged });
       // Assuming local storage is handled by Zustand middleware or manually, 
       // but wait, store.ts handles localStorage manually in actions. 
       // We can just call set() which updates React, but we also should sync localStorage.
       localStorage.setItem('sl_panics', JSON.stringify(merged));
    }
  }, (error) => {
    console.warn('[FirebaseSyncService] PanicEvents sync error:', error.message);
  });

  // 2. Listen for Users (For dispatch and team rosters)
  const usersRef = collection(db, 'users');
  onSnapshot(usersRef, (snapshot) => {
    const cloudUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
    const localUsers = useAppStore.getState().users;
    
    // Only update if there's a difference (simplistic check to prevent infinite loops)
    if (cloudUsers.length !== localUsers.length) {
       useAppStore.setState({ users: cloudUsers });
       localStorage.setItem('sl_users', JSON.stringify(cloudUsers));
    }
  }, (error) => {
    console.warn('[FirebaseSyncService] Users sync error:', error.message);
  });

  // 3. Listen for Organizations
  const orgsRef = collection(db, 'organizations');
  onSnapshot(orgsRef, (snapshot) => {
    const cloudOrgs = snapshot.docs.map(doc => doc.data() as Organization);
    const localOrgs = useAppStore.getState().organizations;
    if (cloudOrgs.length !== localOrgs.length) {
       useAppStore.setState({ organizations: cloudOrgs });
       localStorage.setItem('sl_organizations', JSON.stringify(cloudOrgs));
    }
  }, (error) => {
    console.warn('[FirebaseSyncService] Organizations sync error:', error.message);
  });

  // 4. One-way Sync from Local to Cloud (Subscription to Zustand)
  useAppStore.subscribe((state, prevState) => {
    // Sync new panics
    if (state.panicEvents.length > prevState.panicEvents.length) {
      const newPanic = state.panicEvents[state.panicEvents.length - 1];
      setDoc(doc(db, 'panicEvents', newPanic.id), newPanic).catch(console.error);
    }
    
    // Sync new/updated users (Basic implementation: checking for new registrations)
    if (state.users.length > prevState.users.length) {
      const newUser = state.users[state.users.length - 1];
      setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);
    }

    // Sync new/updated orgs
    if (state.organizations.length > prevState.organizations.length) {
      const newOrg = state.organizations[state.organizations.length - 1];
      setDoc(doc(db, 'organizations', newOrg.id), newOrg).catch(console.error);
    }
  });
};
