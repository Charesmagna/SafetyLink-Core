import React, { useState, useEffect } from 'react';
import { ASSETS } from '../utils/cloudinary';
import { Header } from './landing/Header';
import { Home } from './landing/Home';
import { Hardware } from './landing/Hardware';
import { Pricing } from './landing/Pricing';
import { Platform } from './landing/Platform';
import { UseCases } from './landing/UseCases';
import { Enterprise } from './landing/Enterprise';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import SafetyWareStore from './SafetyWareStore';

type Page = 'home' | 'hardware' | 'store' | 'pricing' | 'platform' | 'usecases' | 'enterprise' | 'privacy' | 'payment-success';

interface LandingPageProps {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
}

const NAV_ITEMS: { id: Page; label: string; emoji: string }[] = [
  { id: 'home',       label: 'Home',        emoji: '🛡️' },
  { id: 'platform',   label: 'Platform',    emoji: '📱' },
  { id: 'hardware',   label: 'Hardware',    emoji: '📡' },
  { id: 'store',      label: 'Store',       emoji: '🛒' },
  { id: 'usecases',   label: 'Use Cases',   emoji: '🎯' },
  { id: 'pricing',    label: 'Pricing',     emoji: '💎' },
  { id: 'enterprise', label: 'Enterprise',  emoji: '🏢' },
];

export function LandingPage({ onLogin, onRegisterUser, onRegisterOrg }: LandingPageProps) {
  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync with browser hash for direct links
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page;
    if (NAV_ITEMS.find(n => n.id === hash) || hash === 'payment-success') setPage(hash as Page);
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    setMenuOpen(false);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sharedProps = { onLogin: onLogin || (() => {}), onRegisterOrg: onRegisterOrg || (() => {}), onRegisterUser: onRegisterUser || (() => {}), navigate };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative">

      {/* ── Top Nav ── */}
      <Header
        onLogin={onLogin}
        onRegisterOrg={onRegisterOrg}
        onNavigate={(p: any) => navigate(p)}
        activePage={page}
      />

      {/* ── Page Content ── */}
      <div>
        {page === 'home'       && <Home       {...sharedProps} />}
        {page === 'hardware'   && <Hardware   {...sharedProps} />}
        {page === 'store'      && <SafetyWareStore />}
        {page === 'pricing'    && <Pricing    {...sharedProps} />}
        {page === 'platform'   && <Platform   {...sharedProps} />}
        {page === 'usecases'   && <UseCases   {...sharedProps} />}
        {page === 'enterprise' && <Enterprise {...sharedProps} />}
        {page === 'privacy'    && <PrivacyPolicy />}
        {page === 'payment-success' && <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}><h1 style={{ fontSize: '32px', color: '#10b981', marginBottom: '16px' }}>Payment Successful!</h1><p style={{ color: '#94a3b8', marginBottom: '24px' }}>Your subscription has been activated.</p><button onClick={() => navigate('home')} style={{ padding: '12px 24px', background: '#0f172a', color: 'white', borderRadius: '8px' }}>Return to Home</button></div>}
      </div>

      <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '60px auto 0' }}>
        <img src={ASSETS.banner} alt="SafetyLink Global Protection Network" style={{ width: '100%', borderRadius: '16px', border: '1px solid #1e293b' }} />
      </div>
      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center space-y-3 mt-12">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 font-mono">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} className="hover:text-slate-300 transition-colors uppercase tracking-wider">{n.label}</button>
          ))}
        </div>
        <div className="flex justify-center gap-6 text-xs">
          <a href="mailto:support@safetylink.online" className="text-blue-400 hover:text-blue-300 font-mono">support@safetylink.online</a>
          <button onClick={() => navigate('privacy')} className="text-slate-400 hover:text-slate-300 font-mono">Privacy Policy</button>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp</a>
        </div>
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">© TM Media Solutions · Reg 2018/500191/07 · safetylink.online</p>
      </footer>
    </div>
  );
}
