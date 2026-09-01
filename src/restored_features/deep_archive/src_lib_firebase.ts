import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// The firebase-applet-config.json file contains exactly what we need

const app = !getApps().length ? initializeApp({
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  measurementId: firebaseConfig.measurementId
}) : getApp();

// Since the DB is on a custom database ID, we initialize it properly
export const db = initializeFirestore(app, { 
    
    experimentalForceLongPolling: true,
    
    localCache: memoryLocalCache()
  }, (firebaseConfig as any).firestoreDatabaseId || "(default)");
export const auth = getAuth(app);
