import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WebUserApp from './pages/WebUserApp';

export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'webapp';

export interface Session {
  token: string;
  orgId: string;
  orgName: string;
  email: string;
}

export default function App() {
  const [page, setPage] = useState<Page>('webapp');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const stored = localStorage.getItem('sl_session');
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch (_) {}
    }

    if (path === '/login') setPage('login');
    else if (path === '/signup') setPage('signup');
    else if (path === '/dashboard') setPage('dashboard');
    else setPage('webapp');

    window.onpopstate = () => {
      const p = window.location.pathname;
      if (p === '/login') setPage('login');
      else if (p === '/signup') setPage('signup');
      else if (p === '/dashboard') setPage('dashboard');
      else setPage('webapp');
    };
  }, []);

  const nav = (p: Page) => {
    setPage(p);
    window.history.pushState({}, '', p === 'webapp' ? '/' : `/${p}`);
  };

  const login = (s: Session) => {
    setSession(s);
    localStorage.setItem('sl_session', JSON.stringify(s));
    nav('dashboard');
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('sl_session');
    nav('webapp');
  };

  if (page === 'dashboard') {
    if (!session) { nav('login'); return null; }
    return <Dashboard session={session} onLogout={logout} />;
  }

  if (page === 'webapp') {
    return <WebUserApp onLogin={() => nav('login')} />;
  }

  if (page === 'login' || page === 'signup') {
    return <Login mode={page} onLogin={login} onBack={() => nav('webapp')} onSwitch={(m) => nav(m)} />;
  }

  return <WebUserApp onLogin={() => nav('login')} />;
}
