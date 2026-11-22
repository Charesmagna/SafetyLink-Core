// Migration: Clear any legacy cached sl_decoy_active
try {
  if (localStorage.getItem('sl_decoy_migrated_v2') !== 'true') {
    localStorage.removeItem('sl_decoy_active');
    localStorage.setItem('sl_decoy_migrated_v2', 'true');
  }
} catch {}
import { setupDeepLinks } from './utils/DeepLinkHandler';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalFooter } from './components/GlobalFooter'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { useAppStore } from './utils/store'
import './styles/index.css'

// Tier 1 Google Maps Platform quota & auth error detector (Case A Demo Key defense)
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};
const _origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  _origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

// OneSignal — lazy-loaded on production web origin only (never blocks first paint or spams localhost)
if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname.endsWith('safetylink.online')) {
  window.setTimeout(() => {
    import('react-onesignal')
      .then(({ default: OneSignal }) =>
        OneSignal.init({
          appId: 'e7c4fd21-764f-465d-b98f-c44f4489662e',
          allowLocalhostAsSecureOrigin: false,
        })
      )
      .catch(() => {});
  }, 4000);
}

// Wake lock — Cordova plugin, native only
if (Capacitor.isNativePlatform()) {
  const acquireWakeLock = () => {
    const pm = (window as any).powerManagement;
    if (pm) {
      pm.acquire(
        () => console.log('[WakeLock] acquired'),
        (err: any) => console.warn('[WakeLock] failed:', err)
      );
    }
  };
  document.addEventListener('deviceready', acquireWakeLock, false);
  setTimeout(acquireWakeLock, 1500);
}

// Mount React first — nothing blocks render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary tabName="SafetyLink">
      <App />
      <GlobalFooter />
    </ErrorBoundary>
  </React.StrictMode>,
);
(window as any).__sl_mounted = true;
if (Capacitor.isNativePlatform()) {
  SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
}

// Deep links init after render
try {
  setupDeepLinks();
} catch (e) {
  console.warn('DeepLinks init error:', e);
}

// Start Fleet Telemetry & OTA update checks only on native APK or authenticated sessions
const initialState = useAppStore.getState();
const shouldRunAppServices =
  Capacitor.isNativePlatform() ||
  Boolean(initialState.currentUser || initialState.currentOrg || initialState.superAdminActive);

if (shouldRunAppServices) {
  import('./services/FleetService')
    .then(({ startFleetTelemetry }) => {
      startFleetTelemetry();
    })
    .catch(() => {});

  import('./services/UpdateService')
    .then(({ checkForUpdate }) => {
      checkForUpdate()
        .then((info) => {
          if (info.available) {
            useAppStore.getState().setUpdateInfo(info as any);
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

