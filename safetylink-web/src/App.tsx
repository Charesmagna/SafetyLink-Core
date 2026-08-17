
import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import RealApp from '../../src/App';
import { useAppStore } from '../../src/utils/store';

export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'webapp';

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login' || path === '/signup' || path === '/dashboard' || path === '/app') {
      setPage(path.substring(1) as Page);
    } else {
      setPage('landing');
    }

    window.onpopstate = () => {
      const p = window.location.pathname;
      if (p === '/login' || p === '/signup' || p === '/dashboard' || p === '/app') {
        setPage(p.substring(1) as Page);
      } else {
        setPage('landing');
      }
    };
  }, []);

  const nav = (p: Page) => {
    setPage(p);
    const route = p === 'landing' ? '/' : '/' + p;
    window.history.pushState({}, '', route);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[999999] bg-black flex items-center justify-center">
        <video 
          src="/media/SafetyLink_3D_Animation_Logo.mp4" 
          autoPlay 
          muted 
          playsInline 
          onEnded={() => setShowSplash(false)} 
          onError={() => setShowSplash(false)} 
          className="absolute inset-0 w-full h-full object-contain" 
        />
      </div>
    );
  }

  if (page !== 'landing') {
    // Render the real cross-platform application (which includes AuthScreen, OrgDashboard, etc.)
    return <div className="h-screen w-screen overflow-hidden"><RealApp /></div>;
  }

  // Default is landing
  return <Landing onLogin={() => nav('login')} onSignup={() => nav('login')} onLaunchWeb={() => nav('webapp')} />;
}
