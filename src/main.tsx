import { setupDeepLinks } from './utils/DeepLinkHandler';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalFooter } from './components/GlobalFooter'
import OneSignal from 'react-onesignal'
import { Capacitor } from '@capacitor/core'
import './styles/index.css'

// Only register service worker on web — not inside Android WebView
if (!Capacitor.isNativePlatform()) {
  // @ts-ignore
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() { updateSW(true); },
      onOfflineReady() { console.log('SafetyLink is ready to work offline.'); },
    });
  }).catch(() => {});
}

// OneSignal — web push only
if (!Capacitor.isNativePlatform()) {
  OneSignal.init({
    appId: 'e7c4fd21-764f-465d-b98f-c44f4489662e',
    allowLocalhostAsSecureOrigin: true,
  }).catch(() => {});
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

// Deep links init after render
setupDeepLinks();

// Check for updates immediately on every app open — runs before login
import('./services/UpdateService').then(({ checkForUpdate }) => {
  checkForUpdate().then(info => {
    if (info.available) {
      useAppStore.getState().setUpdateInfo(info);
    }
  }).catch(() => {});
}).catch(() => {});

