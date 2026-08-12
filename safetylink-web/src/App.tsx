import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WebUserApp from './pages/WebUserApp';
import Landing from './pages/Landing';
import { ShieldAlert } from 'lucide-react';

export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'webapp';

export interface Session {
  token: string;
  orgId: string;
  orgName: string;
  email: string;
}

const TrialLockOverlay = () => (
  <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
    <div className="max-w-md w-full bg-red-950/40 border-2 border-red-500/50 rounded-2xl p-8 text-center shadow-[0_0_100px_rgba(220,38,38,0.2)]">
      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-black mb-4 tracking-tight">System Locked</h1>
      <p className="text-slate-300 text-lg mb-8 leading-relaxed">
        Your 30-day SafetyLink trial has concluded. The system has automatically locked your organization's access.
      </p>
      <div className="bg-black/40 p-4 rounded-xl text-sm text-slate-400 font-mono mb-8">
        ERROR CODE: TRIAL_EXPIRED
      </div>
      <a href="mailto:sales@safetylink.online" className="inline-block bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl transition-colors w-full">
        Contact Sales to Unlock
      </a>
    </div>
  </div>
);

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    const handleTrialExpired = () => setTrialExpired(true);
    window.addEventListener('trial_expired', handleTrialExpired);
    return () => window.removeEventListener('trial_expired', handleTrialExpired);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    const stored = localStorage.getItem('sl_session');
    
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch (_) {}
    }
    
    if (path === '/login') setPage('login');
    else if (path === '/signup') setPage('signup');
    else if (path === '/dashboard') setPage('dashboard');
    else if (path === '/app') setPage('webapp');
    else setPage('landing');

    window.onpopstate = () => {
      const p = window.location.pathname;
      if (p === '/login') setPage('login');
      else if (p === '/signup') setPage('signup');
      else if (p === '/dashboard') setPage('dashboard');
      else if (p === '/app') setPage('webapp');
      else setPage('landing');
    };
  }, []);

  const nav = (p: Page) => {
    setPage(p);
    let route = '/';
    if (p === 'login') route = '/login';
    else if (p === 'signup') route = '/signup';
    else if (p === 'dashboard') route = '/dashboard';
    else if (p === 'webapp') route = '/app';
    window.history.pushState({}, '', route);
  };

  const login = (s: Session) => {
    setSession(s);
    localStorage.setItem('sl_session', JSON.stringify(s));
    nav('dashboard');
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('sl_session');
    nav('landing');
  };

  if (trialExpired) return <TrialLockOverlay />;

  if (page === 'dashboard') {
    if (!session) { nav('login'); return null; }
    return <Dashboard session={session} onLogout={logout} />;
  }

  if (page === 'webapp') {
    return <WebUserApp onBack={() => nav('landing')} onLogin={() => nav('login')} />;
  }

  if (page === 'login' || page === 'signup') {
    return <Login mode={page} onLogin={login} onBack={() => nav('landing')} onSwitch={(m) => nav(m)} />;
  }

  // Default is landing
  return <Landing onLogin={() => nav('login')} onSignup={() => nav('signup')} onLaunchWeb={() => nav('webapp')} />;
}
