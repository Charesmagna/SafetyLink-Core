import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC06WXrGbgpEX8vqcm8fBZO4Y8ydeCHQak",
  authDomain: "gen-lang-client-0219152839.firebaseapp.com",
  projectId: "gen-lang-client-0219152839",
  storageBucket: "gen-lang-client-0219152839.firebasestorage.app",
  messagingSenderId: "959744621631",
  appId: "1:959744621631:web:d35e21192dd383687c4c8a",
  databaseId: "ai-studio-safetylinkcore-eba1fe74-5070-40bf-b7fa-4d20c299bf48"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-safetylinkcore-eba1fe74-5070-40bf-b7fa-4d20c299bf48");
