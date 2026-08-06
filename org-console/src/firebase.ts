import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Same Firebase project as the Android APK
const firebaseConfig = {
  apiKey: "AIzaSyExample-replace-with-actual-key",
  authDomain: "safetylink-app.firebaseapp.com",
  projectId: "safetylink-app",
  storageBucket: "safetylink-app.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000000000000000"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
