import { setupDeepLinks } from './utils/DeepLinkHandler';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalFooter } from './components/GlobalFooter'
import OneSignal from 'react-onesignal'
import './styles/index.css'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("A new version of SafetyLink is available. Reload to update?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("SafetyLink is ready to work offline.");
  },
});



// Global Fetch Interceptor for Trial Lock
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && data.code === 'TRIAL_EXPIRED') {
        window.dispatchEvent(new Event('trial_expired'));
      }
    } catch (e) {
      // Ignore JSON parse errors for non-JSON responses
    }
    return response;
  }
});

const initOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: "e7c4fd21-764f-465d-b98f-c44f4489662e",
      allowLocalhostAsSecureOrigin: true,
    });
    console.log('[OneSignal] Initialized successfully');
  } catch (err) {
    console.warn('[OneSignal] Initialization failed (Web push may not be configured):', err);
  }
};

initOneSignal();

// Request background wake lock via cordova-plugin-powermanagement upon application boot
const acquireWakeLock = () => {
  const powerManagement = (window as any).powerManagement;
  if (powerManagement) {
    powerManagement.acquire(
      () => console.log('[PowerManagement] Successfully acquired wake lock keep-alive'),
      (err: any) => console.error('[PowerManagement] Failed to acquire wake lock:', err)
    );
    if (typeof powerManagement.setDimOn === 'function') {
      powerManagement.setDimOn(false,
        () => console.log('[PowerManagement] Disabled screen dimming successfully'),
        (err: any) => console.warn('[PowerManagement] Could not set screen dimming off:', err)
      );
    }
  } else {
    console.log('[PowerManagement] PowerManagement plugin not active or running in web sandbox mode.');
  }
};

document.addEventListener('deviceready', acquireWakeLock, false);
// Fallback for immediate invocation or web simulation testing
setTimeout(acquireWakeLock, 1500);

setupDeepLinks();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary tabName="SafetyLink">
      <App />
      <GlobalFooter />
    </ErrorBoundary>
  </React.StrictMode>,
)
