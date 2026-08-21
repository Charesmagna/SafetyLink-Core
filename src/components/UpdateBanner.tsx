import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const UpdateBanner: React.FC = () => {
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const CURRENT_VERSION = 'v1.1.0';

  useEffect(() => {
    // Only show in standalone modes (PWA, APK, EXE)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window as any).Capacitor?.isNativePlatform() || navigator.userAgent.toLowerCase().includes('electron');
    if (!isStandalone) return;

    const checkUpdates = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest');
        const data = await response.json();
        
        if (data.tag_name && data.tag_name !== CURRENT_VERSION) {
          // Compare versions loosely
          if (data.tag_name.localeCompare(CURRENT_VERSION) > 0) {
            setLatestRelease(data);
            setShowBanner(true);
          }
        }
      } catch (e) {
        console.error("Failed to check for updates", e);
      }
    };
    
    // Delay check so it doesn't block startup
    setTimeout(checkUpdates, 3000);
  }, []);

  return (
    <AnimatePresence>
      {showBanner && latestRelease && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999999] bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-2xl border-b border-emerald-500/50 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold font-mono text-sm">Update Available: {latestRelease.tag_name}</h4>
              <p className="text-xs text-emerald-100 opacity-90">{latestRelease.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a 
              href={latestRelease.html_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 sm:flex-none text-center bg-white text-emerald-900 px-4 py-1.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider hover:bg-emerald-50 transition-colors shadow-lg"
              onClick={() => setShowBanner(false)}
            >
              Update Now
            </a>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-1.5 hover:bg-black/20 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
