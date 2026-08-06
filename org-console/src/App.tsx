import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setOrgId(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-sl-dark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-sl-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">SafetyLink Org Console</p>
      </div>
    </div>
  );

  if (!user || !orgId) return <LoginScreen onLogin={(u, id) => { setUser(u); setOrgId(id); }} />;

  return <Dashboard user={user} orgId={orgId} onLogout={() => { auth.signOut(); setOrgId(null); }} />;
}
