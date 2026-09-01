import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const setupDeepLinks = () => {
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      console.log('App opened with URL:', event.url);
      
      // Example: safetylink://dispatch/sos or https://safetylink.online/dispatch/sos
      if (event.url.includes('/dispatch/sos')) {
        // Force navigation to the active SOS mode
        // This will trigger the global store update or navigation router
        window.dispatchEvent(new CustomEvent('safetylink:sos-trigger'));
      }
    });
  }
};
