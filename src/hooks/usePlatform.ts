import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function usePlatform() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isAndroid = platform === 'android';
  const isIos = platform === 'ios';
  const isWeb = !isNative;

  return {
    isWeb,
    isNative,
    isMobile,
    isAndroid,
    isIos,
    showSidebar: !isMobile && isWeb,
    showBottomNav: isMobile,
    canUseBLE: isNative || (typeof navigator !== 'undefined' && 'bluetooth' in navigator),
    platform
  };
}
