import { useEffect } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';

// 1. Register the custom plugin we built in Kotlin with a web fallback
export const SafetyLinkBridge = registerPlugin<any>('SafetyLinkBridge', {
  web: {
    async addListener(eventName: string, _listenerFunc: any) {
      console.log(`[SafetyLinkBridge Web] Mock addListener called for ${eventName}`);
      return { remove: async () => {} };
    },
    async toggleFloatingWidget(options: { enable: boolean }) { console.log('[SafetyLinkBridge Web] Mock toggleFloatingWidget', options); },
    async checkOverlayPermission() { return { granted: true }; },
    async requestOverlayPermission() { return { granted: true }; },
    async startBleService() {
      console.log(`[SafetyLinkBridge Web] Mock startBleService called`);
    }
  }
});

export function useEmergencyListener(triggerCountdown: () => void) {
  useEffect(() => {
    // 2. Add the listener for the hardware trigger
    const panicListener = SafetyLinkBridge.addListener('onPanicEvent', (info: any) => {
      console.warn("CRITICAL: HARDWARE PANIC TRIGGERED", info);
      
      // 3. Trigger your UI changes (Start the 10-second countdown)
      triggerCountdown();
    });

    // Cleanup listener on unmount
    return () => {
      panicListener.then((listener: any) => listener?.remove?.());
    };
  }, [triggerCountdown]);

  // Optional: Function to start the native service from a UI button
  const startNativeScanner = async () => {
    if (Capacitor.isNativePlatform()) {
      await SafetyLinkBridge.startBleService();
    } else {
      console.log('startBleService not supported on web');
    }
  };

  return { startNativeScanner };
}
