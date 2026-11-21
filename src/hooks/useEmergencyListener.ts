import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SafetyLinkEmergency, type NativePanicStatusEvent } from '../services/NativeDispatchService';
import { useAppStore } from '../utils/store';

export { SafetyLinkEmergency };
export const SafetyLinkBridge = SafetyLinkEmergency;

export function useEmergencyListener(onStatusChange: (info: NativePanicStatusEvent) => void) {
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let lastStatusTickAt = 0;

    // Primary listener for native PanicService status transitions & real DispatchResult
    const panicListener = SafetyLinkEmergency.addListener('onPanicStatusChange', (info: NativePanicStatusEvent) => {
      lastStatusTickAt = Date.now();
      console.warn('[SafetyLinkEmergency] NATIVE PANIC STATUS:', info);
      callbackRef.current(info);
    });

    // Legacy alias listener only triggers if primary didn't emit for the same event
    const legacyListener = (SafetyLinkEmergency as any).addListener('onPanicEvent', (info: NativePanicStatusEvent) => {
      if (Date.now() - lastStatusTickAt < 250) return;
      console.warn('[SafetyLinkEmergency] LEGACY PANIC EVENT:', info);
      callbackRef.current(info);
    });

    const timeoutListener = (SafetyLinkEmergency as any).addListener('onSafetyTimeoutTriggered', (info: any) => {
      const mins = Number(info?.minutes) || 15;
      useAppStore.getState().startWatchMeTimer(mins);
      useAppStore.getState().addToast(`⏱️ Safety Walk Timer armed (${mins} min) via iTAG`, 'info');
    });

    const customActionListener = (SafetyLinkEmergency as any).addListener('onCustomButtonAction', (info: any) => {
      const action = String(info?.action || '').toUpperCase();
      const store = useAppStore.getState();
      if (action === 'CHECK_IN_SAFE') {
        store.checkInSafe();
      } else if (action === 'VOICE_LIZZY') {
        store.openLizzyCompanion('voice');
      } else if (action === 'SHARE_GPS_PING') {
        const loc = store.userLocation;
        const coordText = loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'Acquiring GPS';
        store.addAuditLog('GPS', 'INFO', 'iTAG Native GPS Snapshot Shared', coordText);
        store.addToast(`📍 Live GPS pinned via iTAG (${coordText})`, 'success');
      }
    });

    return () => {
      panicListener.then((listener: any) => listener?.remove?.()).catch(() => {});
      legacyListener.then((listener: any) => listener?.remove?.()).catch(() => {});
      timeoutListener.then((listener: any) => listener?.remove?.()).catch(() => {});
      customActionListener.then((listener: any) => listener?.remove?.()).catch(() => {});
    };
  }, []);

  const startNativeScanner = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await SafetyLinkEmergency.startBleService();
      } catch (e) {
        console.warn('[useEmergencyListener] startBleService note:', e);
      }
    }
  };

  return { startNativeScanner };
}
