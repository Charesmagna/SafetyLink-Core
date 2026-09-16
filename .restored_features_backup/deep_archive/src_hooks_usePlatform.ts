import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export const isNative = Capacitor.isNativePlatform();
export const isWeb = !isNative;
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// Hook for responsive web vs mobile layout
export function usePlatform() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isNative,           // Running in Capacitor (Android/iOS)
    isWeb,              // Running in browser
    isMobile,           // Screen width < 768px
    isDesktop: !isMobile,
    platform,
    // Feature flags based on platform
    canUseBLE: isNative,           // BLE only works natively
    canUseNativeSMS: isNative,     // Native SMS only on device
    canVibrate: isNative || ('vibrate' in navigator),
    canUseGeolocation: true,       // Both native GPS and browser geolocation
    showSidebar: isWeb && !isMobile, // Sidebar on web desktop
    showBottomNav: isNative || isMobile, // Bottom nav on mobile/native
  };
}
