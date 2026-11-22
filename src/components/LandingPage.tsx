import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';
import { Header } from './landing/Header';
import { Home } from './landing/Home';
import { UpdateBanner } from './UpdateBanner';
import type { UpdateInfo } from '../services/UpdateService';

// Code-split all non-initial landing routes & heavy media hubs so first load stays lean
const Hardware = lazy(() => import('./landing/Hardware').then((m) => ({ default: m.Hardware })));
const Pricing = lazy(() => import('./landing/Pricing').then((m) => ({ default: m.Pricing })));
const Platform = lazy(() => import('./landing/Platform').then((m) => ({ default: m.Platform })));
const UseCases = lazy(() => import('./landing/UseCases').then((m) => ({ default: m.UseCases })));
const Enterprise = lazy(() => import('./landing/Enterprise').then((m) => ({ default: m.Enterprise })));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const SafetyWareStore = lazy(() => import('./SafetyWareStore'));
const DownloadPage = lazy(() => import('./landing/DownloadPage').then((m) => ({ default: m.DownloadPage })));
const ContinuousTopologyOverview = lazy(() =>
  import('./landing/ContinuousTopologyOverview').then((m) => ({ default: m.ContinuousTopologyOverview }))
);
const MediaHub = lazy(() => import('./MediaHub').then((m) => ({ default: m.MediaHub })));

type Page = 'home' | 'hardware' | 'store' | 'download' | 'pricing' | 'platform' | 'usecases' | 'enterprise' | 'privacy' | 'payment-success';

interface LandingPageProps {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
}

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'home',       label: 'Home' },
  { id: 'platform',   label: 'Platform' },
  { id: 'hardware',   label: 'Hardware' },
  { id: 'store',      label: 'Store' },
  { id: 'download',   label: 'Download' },
  { id: 'usecases',   label: 'Use Cases' },
  { id: 'pricing',    label: 'Pricing' },
  { id: 'enterprise', label: 'Enterprise' },
];

const PageFallback = () => (
  <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: '#64748b' }}>
    Loading section...
  </div>
);

export function LandingPage({ onLogin, onRegisterUser, onRegisterOrg }: LandingPageProps) {
  const { globalTheme } = useAppStore();
  const [page, setPage] = useState<Page>('home');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showMediaVault, setShowMediaVault] = useState(false);
  const [allowAmbientVideo, setAllowAmbientVideo] = useState(false);
  const isLight = globalTheme !== 'dark';

  // Respect prefers-reduced-motion and Save-Data before streaming background video
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const saveData = (navigator as any)?.connection?.saveData === true;
    if (!reducedMotion && !saveData) {
      setAllowAmbientVideo(true);
    }
  }, []);

  // Only check native OTA updates inside the Android APK
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    import('../services/UpdateService')
      .then(({ checkForUpdate }) => checkForUpdate())
      .then((info) => {
        if (info && info.available) {
          setUpdateInfo(info);
        }
      })
      .catch(() => {});
  }, []);

  // Optional Cloudflare Web Analytics beacon (loads only when VITE_CF_ANALYTICS_TOKEN is configured)
  useEffect(() => {
    const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN;
    if (!cfToken || document.getElementById('cf-web-analytics')) return;
    const script = document.createElement('script');
    script.id = 'cf-web-analytics';
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: cfToken }));
    document.body.appendChild(script);
  }, []);

  // Sync with browser hash for direct links
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (NAV_ITEMS.find((n) => n.id === hash) || hash === 'privacy' || hash === 'payment-success') {
        setPage(hash);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
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
    <div
      className={`min-h-screen font-sans relative overflow-x-hidden transition-colors ${
        isLight ? 'bg-white text-slate-900' : 'bg-[#020617] text-white'
      }`}
    >
      {/* Ambient Continuous Logo-Video Backdrop (skipped on prefers-reduced-motion / Save-Data) */}
      {allowAmbientVideo && (
        <div
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
          style={{ opacity: isLight ? 0.05 : 0.14 }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'cover',
            }}
          >
            <source src="/splash-video.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Over-the-Air Update Notification (Restricted to APK) */}
      <UpdateBanner updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />

      {/* Top Navigation */}
      <Header
        onLogin={onLogin}
        onRegisterOrg={onRegisterOrg}
        onNavigate={(p: any) => navigate(p)}
        activePage={page}
      />

      {/* Page Content */}
      <main className="relative z-10">
        {page === 'home' && <Home {...sharedProps} />}
        <Suspense fallback={<PageFallback />}>
          {page === 'hardware'   && <Hardware   {...sharedProps} />}
          {page === 'store'      && <SafetyWareStore />}
          {page === 'download'   && <DownloadPage {...sharedProps} />}
          {page === 'pricing'    && <Pricing    {...sharedProps} />}
          {page === 'platform'   && <Platform   {...sharedProps} />}
          {page === 'usecases'   && <UseCases   {...sharedProps} />}
          {page === 'enterprise' && <Enterprise {...sharedProps} />}
          {page === 'privacy'    && <PrivacyPolicy />}
        </Suspense>
        {page === 'payment-success' && (
          <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px' }}>
            <h1 style={{ fontSize: '32px', color: '#059669', fontWeight: 900, marginBottom: '12px' }}>Payment Successful</h1>
            <p style={{ color: '#475569', marginBottom: '24px' }}>Your SafetyLink subscription has been activated.</p>
            <button onClick={() => navigate('home')} style={{ padding: '12px 24px', background: '#059669', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Return to Home
            </button>
          </div>
        )}
      </main>

      {/* Continuous Topology Overview (Lazy-Loaded) */}
      <section className="relative z-10" style={{ padding: '0 20px', maxWidth: '1240px', margin: '48px auto 0' }}>
        <Suspense fallback={null}>
          <ContinuousTopologyOverview activePage={page} />
        </Suspense>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t px-6 py-10 text-center space-y-4 mt-12 ${
          isLight ? 'bg-emerald-50/40 border-emerald-100 text-slate-700' : 'bg-slate-950/80 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className="hover:text-emerald-600 transition-colors uppercase tracking-wider font-semibold cursor-pointer"
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
          <a href="mailto:info@safetylink.online" className="text-emerald-700 hover:text-emerald-600 font-semibold">info@safetylink.online</a>
          <a href="tel:0816738186" className="text-emerald-700 hover:text-emerald-600 font-semibold">Dispatch: 081 673 8186</a>
          <a href="tel:+27680079911" className="text-emerald-700 hover:text-emerald-600 font-semibold">Cell: +27 68 007 9911</a>
          <button onClick={() => navigate('privacy')} className="hover:text-emerald-600 font-semibold underline cursor-pointer">
            Privacy Policy &amp; POPIA
          </button>
          <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-600 font-semibold">
            WhatsApp Support
          </a>
        </div>

        <div className={`max-w-2xl mx-auto p-3 rounded-xl border text-[11px] leading-relaxed ${
          isLight ? 'bg-white border-emerald-100 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <strong>POPIA Compliance Notice (Act 4 of 2013):</strong> SafetyLink processes personal information and emergency GPS coordinates solely for life-safety dispatch and authorized command-center coordination. Operated by <strong>TM Media Solutions (Pty) Ltd</strong> (Reg: 2018/500191/07), Johannesburg, Gauteng, South Africa.
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-widest opacity-80">
          <span>© TM Media Solutions (Pty) Ltd · Reg 2018/500191/07 · safetylink.online</span>
          {onLogin && (
            <button
              type="button"
              onClick={onLogin}
              aria-label="Open SafetyLink Portal"
              className={`w-5 h-5 rounded border text-[9px] font-black transition-colors cursor-pointer ${
                isLight ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              P
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMediaVault(true)}
            aria-label="Media Vault"
            className={`w-5 h-5 rounded flex items-center justify-center text-[11px] leading-none transition-opacity opacity-50 hover:opacity-100 cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-emerald-700' : 'text-slate-500 hover:text-emerald-400'
            }`}
          >
            ☾
          </button>
        </div>
      </footer>

      {showMediaVault && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-6xl my-4">
            <Suspense fallback={<PageFallback />}>
              <MediaHub ownerMode onClose={() => setShowMediaVault(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
