import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/index.css'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary tabName="SafetyLink">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
