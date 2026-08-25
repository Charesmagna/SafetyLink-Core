import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

type Page = 'landing' | 'login' | 'signup' | 'dashboard';
type User = { uid: string; email: string };

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from token
    const token = localStorage.getItem('sl_token');
    const org = localStorage.getItem('sl_org');
    if (token && org) {
      try {
        const orgData = JSON.parse(org);
        setUser({ uid: orgData.code, email: '' });
        setOrgId(orgData.code);
        setOrgName(orgData.name);
        setPage('dashboard');
      } catch {}
    }
    setLoading(false);

    const path = window.location.pathname;
    if (path === '/login') setPage('login');
    else if (path === '/signup') setPage('signup');
    else if (path === '/dashboard') setPage('dashboard');
    else setPage('landing');

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setOrgId(null); setOrgName(''); }
      setLoading(false);
    });
    return unsub;
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    window.history.pushState({}, '', p === 'landing' ? '/' : `/${p}`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-sl-dark">
      <div className="w-12 h-12 border-4 border-sl-red border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (page === 'dashboard' && user && orgId) {
    return <Dashboard user={user} orgId={orgId} orgName={orgName}
      onLogout={() => { auth.signOut(); setOrgId(null); navigate('landing'); }} />;
  }

  if (page === 'login' || page === 'signup') {
    return <LoginScreen
      mode={page}
      onLogin={(u, id, name) => { setUser(u); setOrgId(id); setOrgName(name); navigate('dashboard'); }}
      onBack={() => navigate('landing')}
      onSwitchMode={(m) => navigate(m)} />;
  }

  return <LandingPage onOrgLogin={() => navigate('login')} onOrgSignup={() => navigate('signup')} />;
}
