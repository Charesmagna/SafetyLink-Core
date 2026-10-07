import { useEffect } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

// 1. Register the canonical custom plugin with web fallback
export const SafetyLinkEmergency = registerPlugin<any>('SafetyLinkEmergency', {
  web: {
    async addListener(eventName: string, _listenerFunc: any) {
      console.log(`[SafetyLinkEmergency Web] Mock addListener called for ${eventName}`);
      return { remove: async () => {} };
    },
    async toggleFloatingWidget(options: { enable: boolean }) { console.log('[SafetyLinkEmergency Web] Mock toggleFloatingWidget', options); },
    async checkOverlayPermission() { return { granted: true }; },
    async requestOverlayPermission() { return { granted: true }; },
    async startBleService() {
      console.log(`[SafetyLinkEmergency Web] Mock startBleService called`);
    }
  }
});

export const SafetyLinkBridge = SafetyLinkEmergency;

export function useEmergencyListener(triggerCountdown: () => void) {
  useEffect(() => {
    // 2. Add the listener for the hardware trigger
    const panicListener = SafetyLinkEmergency.addListener('onPanicStatusChange', (info: any) => {
      console.warn("CRITICAL: HARDWARE/NATIVE PANIC STATUS CHANGE", info);
      if (info?.status === 'TRIGGERED' || info?.status === 'COUNTDOWN') {
        triggerCountdown();
      }
    });

    const legacyListener = SafetyLinkEmergency.addListener('onPanicEvent', (info: any) => {
      console.warn("CRITICAL: HARDWARE PANIC TRIGGERED", info);
      triggerCountdown();
    });

    // Cleanup listener on unmount
    return () => {
      panicListener.then((listener: any) => listener?.remove?.());
      legacyListener.then((listener: any) => listener?.remove?.());
    };
  }, [triggerCountdown]);

  // Function to start the native sentinel service from a UI button
  const startNativeScanner = async () => {
    if (Capacitor.isNativePlatform()) {
      await SafetyLinkEmergency.startBleService();
    } else {
      console.log('startBleService not supported on web');
    }
  };

  return { startNativeScanner };
}
