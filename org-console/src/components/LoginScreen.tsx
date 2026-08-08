import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from 'firebase/auth';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (user: User, orgId: string, orgName: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !orgCode) { setError('All fields are required.'); return; }
    setLoading(true);
    setError('');

    try {
      // 1. Sign in with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2. Look up the org in Firestore — try both 'organisations' and 'organizations' collections
      const orgCodeUpper = orgCode.trim().toUpperCase();
      let orgData: Record<string, unknown> | null = null;
      let orgName = orgCodeUpper;

      // Try by document ID first
      for (const colName of ['organisations', 'organizations']) {
        const snap = await getDoc(doc(db, colName, orgCodeUpper));
        if (snap.exists()) {
          orgData = snap.data() as Record<string, unknown>;
          orgName = (orgData.name as string) || orgCodeUpper;
          break;
        }
      }

      // Try by 'id' field if not found by doc ID
      if (!orgData) {
        for (const colName of ['organisations', 'organizations']) {
          const q = query(collection(db, colName), where('id', '==', orgCodeUpper));
          const snap = await getDocs(q);
          if (!snap.empty) {
            orgData = snap.docs[0].data() as Record<string, unknown>;
            orgName = (orgData.name as string) || orgCodeUpper;
            break;
          }
        }
      }

      // 3. Verify user belongs to this org
      if (orgData) {
        const adminEmails: string[] = (orgData.adminEmails as string[]) || [];
        const contactEmail = (orgData.contactEmail as string) || '';
        const adminUids: string[] = (orgData.adminUids as string[]) || [];

        const isAdmin = adminUids.includes(cred.user.uid) ||
          adminEmails.includes(email.toLowerCase()) ||
          contactEmail.toLowerCase() === email.toLowerCase();

        if (!isAdmin) {
          await auth.signOut();
          setError('You are not registered as an admin of this organisation.');
          setLoading(false);
          return;
        }
      } else {
        // Org not found in Firestore — check if user profile has this orgCode
        const userQuery = query(collection(db, 'users'), where('uid', '==', cred.user.uid));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          const userOrgCode = (userData.orgCode as string || '').toUpperCase();
          if (userOrgCode !== orgCodeUpper) {
            await auth.signOut();
            setError('Organisation ID not found or you are not a member.');
            setLoading(false);
            return;
          }
          orgName = orgCodeUpper;
        } else {
          await auth.signOut();
          setError('Organisation ID not found. Check your org code from the SafetyLink app.');
          setLoading(false);
          return;
        }
      }

      onLogin(cred.user, orgCodeUpper, orgName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Invalid email or password.');
      } else {
        setError(msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sl-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sl-red/10 border border-sl-red/30 rounded-2xl mb-4">
            <Shield className="w-10 h-10 text-sl-red" />
          </div>
          <h1 className="text-2xl font-bold text-white">SafetyLink</h1>
          <p className="text-slate-400 text-sm mt-1">Organisation Console</p>
        </div>

        <div className="bg-sl-panel border border-sl-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your organisation</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Organisation ID</label>
              <input type="text" value={orgCode} onChange={e => setOrgCode(e.target.value.toUpperCase())}
                placeholder="e.g. SL-ACME-1234"
                className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@yourorg.com"
                className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-sl-red hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2">
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-6">
            Your Organisation ID is shown in the SafetyLink mobile app after registration.
          </p>
        </div>
        <p className="text-center text-xs text-slate-700 mt-6">SafetyLink Org Console · TM Media Solutions</p>
      </div>
    </div>
  );
}
