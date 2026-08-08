import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || undefined);

export interface FirebaseLoginResult {
  success: boolean;
  error?: string;
  uid?: string;
  email?: string;
  orgCode?: string;
  orgName?: string;
  role?: string;
}

export async function firebaseLogin(email: string, password: string): Promise<FirebaseLoginResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Look up user profile in Firestore
    let userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      // Try by email
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) userDoc = snap.docs[0];
    }

    if (userDoc && userDoc.exists()) {
      const data = userDoc.data();
      // Update lastSeen
      try { await updateDoc(userDoc.ref, { lastSeen: Date.now() }); } catch (_) {}
      return {
        success: true,
        uid,
        email,
        orgCode: data.orgCode || data.orgId || '',
        orgName: data.orgName || '',
        role: data.role || 'User'
      };
    }

    return { success: true, uid, email, role: 'User' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
      return { success: false, error: 'Invalid email or password.' };
    }
    return { success: false, error: msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim() };
  }
}

export async function firebaseRegisterUser(
  email: string, 
  password: string, 
  username: string,
  role: string,
  orgCode?: string
): Promise<FirebaseLoginResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      uid,
      email: email.toLowerCase(),
      username,
      displayName: username,
      role,
      orgCode: orgCode || '',
      orgId: orgCode || '',
      createdAt: Date.now(),
      lastSeen: Date.now(),
      sosActive: false,
    });

    return { success: true, uid, email, role, orgCode };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    if (msg.includes('email-already-in-use')) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    return { success: false, error: msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim() };
  }
}

export async function firebaseRegisterOrg(
  email: string,
  password: string,
  orgName: string,
  contactName: string,
  orgCode?: string
): Promise<{ success: boolean; error?: string; orgId?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const abbrev = orgName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedOrgCode = orgCode || `SL-${abbrev}-${randomNum}`;

    // Create org document
    await setDoc(doc(db, 'organisations', generatedOrgCode), {
      id: generatedOrgCode,
      name: orgName,
      contactName,
      contactEmail: email.toLowerCase(),
      adminUids: [uid],
      adminEmails: [email.toLowerCase()],
      createdAt: Date.now(),
      approved: true,
    });

    // Create user profile
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: email.toLowerCase(),
      username: contactName,
      displayName: contactName,
      role: 'Organization Administrator',
      orgCode: generatedOrgCode,
      orgId: generatedOrgCode,
      orgName,
      createdAt: Date.now(),
      lastSeen: Date.now(),
    });

    return { success: true, orgId: generatedOrgCode };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return { success: false, error: msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim() };
  }
}

export async function firebaseLogout() {
  await signOut(auth);
}

export { auth, db };
