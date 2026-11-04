import React, { useState, useEffect } from 'react';
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
    if (NAV_ITEMS.find(n => n.id === hash) || hash === 'payment-success' || hash === 'privacy') setPage(hash);
  }, []);

  const navigate = (p: Page) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sharedProps = {
    onLogin: onLogin || (() => {}),
    onRegisterOrg: onRegisterOrg || (() => {}),
    onRegisterUser: onRegisterUser || (() => {}),
    navigate: (p: string) => navigate(p as Page),
    onNavigate: (p: string) => navigate(p as Page),
  };

  return (
    <div className="safetylink-public-site min-h-screen bg-[#020617] text-white font-sans relative overflow-x-hidden">
      {/* Public-site motion is intentionally kept inside the home hero.
          This avoids stacking multiple full-screen videos behind every page,
          reduces mobile data use, and keeps product content readable. */}
      <UpdateBanner updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />

      <Header
        onLogin={onLogin}
        onRegisterOrg={onRegisterOrg}
        onNavigate={(p: any) => navigate(p)}
        activePage={page}
      />

      <main id="main-content" className="relative z-[1]">
        {page === 'home'       && <Home       {...sharedProps} />}
        {page === 'hardware'   && <Hardware   {...sharedProps} />}
        {page === 'store'      && <SafetyWareStore />}
        {page === 'download'   && <DownloadPage {...sharedProps} />}
        {page === 'pricing'    && <Pricing    {...sharedProps} />}
        {page === 'platform'   && <Platform   {...sharedProps} />}
        {page === 'usecases'   && <UseCases   {...sharedProps} />}
        {page === 'enterprise' && <Enterprise {...sharedProps} />}
        {page === 'privacy'    && <PrivacyPolicy />}
        {page === 'payment-success' && (
          <section className="min-h-[70vh] flex items-center justify-center flex-col px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-emerald-400 mb-4">Payment Successful</h1>
            <p className="text-slate-300 mb-6">Your subscription status is being confirmed.</p>
            <button
              onClick={() => navigate('home')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Return to SafetyLink
            </button>
          </section>
        )}
      </main>

      <section className="relative z-[1] px-5 sm:px-6 max-w-[1240px] mx-auto mt-12 md:mt-16">
        <ContinuousTopologyOverview activePage={page} />
      </section>

      <footer className="relative z-[1] border-t border-slate-800/80 px-5 sm:px-6 py-10 text-center space-y-5 mt-12 bg-slate-950/70">
        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-slate-400">
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className="hover:text-emerald-300 transition-colors uppercase tracking-wider"
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs">
          <a href="mailto:info@safetylink.online" className="text-sky-400 hover:text-sky-300">info@safetylink.online</a>
          <button onClick={() => navigate('privacy')} className="text-slate-400 hover:text-slate-200">Privacy Policy</button>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">WhatsApp Support</a>
          <a href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Updates Channel</a>
          <a href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Community</a>
          <a href="https://www.facebook.com/share/1D8xnzfY8T/" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">Facebook</a>
        </div>
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          © TM Media Solutions · Reg 2018/500191/07 · safetylink.online
        </p>
      </footer>
    </div>
  );
}
