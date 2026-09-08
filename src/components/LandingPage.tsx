import React, { useState, useEffect } from 'react';
import { Home } from './landing/Home';
import { Hardware } from './landing/Hardware';
import { Pricing } from './landing/Pricing';
import { Platform } from './landing/Platform';
import { UseCases } from './landing/UseCases';
import { Enterprise } from './landing/Enterprise';

type Page = 'home' | 'hardware' | 'pricing' | 'platform' | 'usecases' | 'enterprise';

interface LandingPageProps {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
}

const NAV_ITEMS: { id: Page; label: string; emoji: string }[] = [
  { id: 'home',       label: 'Home',        emoji: '🛡️' },
  { id: 'platform',   label: 'Platform',    emoji: '📱' },
  { id: 'hardware',   label: 'Hardware',    emoji: '📡' },
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
    if (NAV_ITEMS.find(n => n.id === hash)) setPage(hash);
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
      <nav className="fixed top-0 left-0 right-0 z-[9999] bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('home')} className="flex items-center gap-2.5">
          <img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/Safety_Link_Logo_Black.png" alt="SafetyLink" className="h-8 w-8 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          <span className="font-black text-white tracking-wider text-sm uppercase font-mono">SafetyLink</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all ${
                page === n.id ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              {n.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onLogin} className="hidden md:flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
            Open App
          </button>
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            {menuOpen
              ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/95 backdrop-blur-xl pt-20 px-6 flex flex-col gap-2">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all border ${
                page === n.id
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}>
              <span className="text-2xl">{n.emoji}</span>
              <span className="font-black uppercase tracking-wider text-sm font-mono">{n.label}</span>
            </button>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={onLogin} className="bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all">
              Login
            </button>
            <button onClick={onRegisterUser} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all">
              Register
            </button>
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <div className="pt-14">
        {page === 'home'       && <Home       {...sharedProps} />}
        {page === 'hardware'   && <Hardware   {...sharedProps} />}
        {page === 'pricing'    && <Pricing    {...sharedProps} />}
        {page === 'platform'   && <Platform   {...sharedProps} />}
        {page === 'usecases'   && <UseCases   {...sharedProps} />}
        {page === 'enterprise' && <Enterprise {...sharedProps} />}
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
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp</a>
        </div>
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">© TM Media Solutions · Reg 2018/500191/07 · safetylink.online</p>
      </footer>
    </div>
  );
}
