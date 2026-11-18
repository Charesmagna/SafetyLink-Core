import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SafetyLinkEmergency, type NativePanicStatusEvent } from '../services/NativeDispatchService';

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

    return () => {
      panicListener.then((listener: any) => listener?.remove?.()).catch(() => {});
      legacyListener.then((listener: any) => listener?.remove?.()).catch(() => {});
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
