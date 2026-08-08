import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from 'firebase/auth';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface Props {
  mode: 'login' | 'signup';
  onLogin: (user: User, orgId: string, orgName: string) => void;
  onBack: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

export default function LoginScreen({ mode, onLogin, onBack, onSwitchMode }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgNameInput] = useState('');
  const [contactName, setContactName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !orgCode) { setError('All fields are required.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const orgCodeUpper = orgCode.trim().toUpperCase();
      let foundOrgName = orgCodeUpper;

      // Check org in Firestore
      for (const col of ['organisations', 'organizations']) {
        const snap = await getDoc(doc(db, col, orgCodeUpper));
        if (snap.exists()) {
          const data = snap.data();
          foundOrgName = data.name || orgCodeUpper;
          const adminUids: string[] = data.adminUids || [];
          const adminEmails: string[] = data.adminEmails || [];
          const isAdmin = adminUids.includes(cred.user.uid) || adminEmails.includes(email.toLowerCase()) || data.contactEmail?.toLowerCase() === email.toLowerCase();
          if (!isAdmin) { await auth.signOut(); setError('You are not an admin of this organisation.'); setLoading(false); return; }
          onLogin(cred.user, orgCodeUpper, foundOrgName);
          return;
        }
      }

      // Check user profile for orgCode
      const uSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (uSnap.exists()) {
        const ud = uSnap.data();
        if ((ud.orgCode || '').toUpperCase() === orgCodeUpper) {
          onLogin(cred.user, orgCodeUpper, ud.orgName || orgCodeUpper);
          return;
        }
      }

      await auth.signOut();
      setError('Organisation ID not found or you are not a member.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.includes('invalid-credential') || msg.includes('wrong-password') ? 'Invalid email or password.' : msg.replace('Firebase: ','').replace(/\(.*\)/,'').trim());
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !orgName || !contactName) { setError('All fields are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const abbrev = orgName.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4) || 'ORG';
      const num = Math.floor(1000 + Math.random() * 9000);
      const generatedOrgCode = `SL-${abbrev}-${num}`;

      await setDoc(doc(db, 'organisations', generatedOrgCode), {
        id: generatedOrgCode, name: orgName, contactName,
        contactEmail: email.toLowerCase(), adminUids: [uid],
        adminEmails: [email.toLowerCase()], createdAt: Date.now(), approved: true,
      });

      await setDoc(doc(db, 'users', uid), {
        uid, email: email.toLowerCase(), username: contactName, displayName: contactName,
        role: 'Organization Administrator', orgCode: generatedOrgCode,
        orgId: generatedOrgCode, orgName, createdAt: Date.now(), lastSeen: Date.now(),
      });

      onLogin(cred.user, generatedOrgCode, orgName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg.includes('email-already-in-use') ? 'An account with this email already exists.' : msg.replace('Firebase: ','').replace(/\(.*\)/,'').trim());
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-sl-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sl-red/10 border border-sl-red/30 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-sl-red" />
          </div>
          <h1 className="text-xl font-bold text-white">SafetyLink</h1>
          <p className="text-slate-400 text-sm mt-1">Organisation Portal</p>
        </div>

        <div className="bg-sl-panel border border-sl-border rounded-2xl p-8">
          <div className="flex rounded-lg bg-black/30 p-1 mb-6">
            <button onClick={() => onSwitchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode==='login' ? 'bg-sl-red text-white' : 'text-slate-400 hover:text-white'}`}>
              Sign In
            </button>
            <button onClick={() => onSwitchMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode==='signup' ? 'bg-sl-red text-white' : 'text-slate-400 hover:text-white'}`}>
              Register Org
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-300 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Organisation Name</label>
                  <input type="text" value={orgName} onChange={e => setOrgNameInput(e.target.value)} placeholder="e.g. Acme Security Services"
                    className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Your Full Name</label>
                  <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith"
                    className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                </div>
              </>
            )}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Organisation ID</label>
                <input type="text" value={orgCode} onChange={e => setOrgCode(e.target.value.toUpperCase())} placeholder="e.g. SL-ACME-1234"
                  className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm font-mono" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourorg.com"
                className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-black/40 border border-sl-border rounded-lg px-4 py-3 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-sl-red hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2">
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign In' : 'Create Organisation')}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 text-center mt-4">
              After registering, your Organisation ID will be shown on the dashboard. Share it with your field users so they can join your org on the mobile app.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">SafetyLink · TM Media Solutions · Gauteng, South Africa</p>
      </div>
    </div>
  );
}
