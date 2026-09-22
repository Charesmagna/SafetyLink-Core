import React, { useState, useEffect } from 'react';
import { ASSETS } from '../utils/cloudinary';
import { R2_MEDIA } from '../utils/r2Assets';
import { Header } from './landing/Header';
import { Home } from './landing/Home';
import { Hardware } from './landing/Hardware';
import { Pricing } from './landing/Pricing';
import { Platform } from './landing/Platform';
import { UseCases } from './landing/UseCases';
import { Enterprise } from './landing/Enterprise';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import SafetyWareStore from './SafetyWareStore';
import { DownloadPage } from './landing/DownloadPage';
import { ContinuousTopologyOverview } from './landing/ContinuousTopologyOverview';
import { UpdateBanner } from './UpdateBanner';
import { checkForUpdate, UpdateInfo } from '../services/UpdateService';

type Page = 'home' | 'hardware' | 'store' | 'download' | 'pricing' | 'platform' | 'usecases' | 'enterprise' | 'privacy' | 'payment-success';

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
  { id: 'download',   label: 'Download',    emoji: '⬇️' },
  { id: 'usecases',   label: 'Use Cases',   emoji: '🎯' },
  { id: 'pricing',    label: 'Pricing',     emoji: '💎' },
  { id: 'enterprise', label: 'Enterprise',  emoji: '🏢' },
];

export function LandingPage({ onLogin, onRegisterUser, onRegisterOrg }: LandingPageProps) {
  const [page, setPage] = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Check for updates on mount (will only render banner in APK)
  useEffect(() => {
    checkForUpdate().then((info) => {
      if (info && info.available) {
        setUpdateInfo(info);
      }
    }).catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-transparent text-white font-sans relative">
      {/* ── Over-the-Air Update Notification (Restricted to APK) ── */}
      <UpdateBanner updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />

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
        {page === 'download'   && <DownloadPage {...sharedProps} />}
        {page === 'pricing'    && <Pricing    {...sharedProps} />}
        {page === 'platform'   && <Platform   {...sharedProps} />}
        {page === 'usecases'   && <UseCases   {...sharedProps} />}
        {page === 'enterprise' && <Enterprise {...sharedProps} />}
        {page === 'privacy'    && <PrivacyPolicy />}
        {page === 'payment-success' && <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}><h1 style={{ fontSize: '32px', color: '#10b981', marginBottom: '16px' }}>Payment Successful!</h1><p style={{ color: '#94a3b8', marginBottom: '24px' }}>Your subscription has been activated.</p><button onClick={() => navigate('home')} style={{ padding: '12px 24px', background: '#0f172a', color: 'white', borderRadius: '8px' }}>Return to Home</button></div>}
      </div>

      {/* ── CONTINUOUS TOPOLOGY OVERVIEW (PAGE-ADAPTIVE) ── */}
      <section style={{ padding: '0 20px', maxWidth: '1240px', margin: '70px auto 0' }}>
        <ContinuousTopologyOverview activePage={page} />
      </section>
      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center space-y-3 mt-12">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 font-mono">
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} className="hover:text-slate-300 transition-colors uppercase tracking-wider">{n.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <a href="mailto:info@safetylink.online" className="text-blue-400 hover:text-blue-300 font-mono">✉️ info@safetylink.online</a>
          <button onClick={() => navigate('privacy')} className="text-slate-400 hover:text-slate-300 font-mono">Privacy Policy</button>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp Support (+27 68 009 911)</a>
          <a href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">📢 Channel</a>
          <a href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">👥 Community Group</a>
          <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 font-mono">📘 Facebook</a>
        </div>
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">© TM Media Solutions · Reg 2018/500191/07 · safetylink.online</p>
      </footer>
    </div>
  );
}
