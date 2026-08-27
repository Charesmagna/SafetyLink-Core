import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const CURRENT_VERSION: string = import.meta.env.VITE_APP_VERSION || '1.1.0';
const GITHUB_RELEASES_API = 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest';
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const SNOOZE_KEY = 'sl_update_snoozed_until';
const DISMISSED_KEY = 'sl_update_dismissed_version';

function parseSemver(tag: string): [number, number, number] {
  const clean = tag.replace(/^v/, '');
  const parts = clean.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function isNewer(remote: string, current: string): boolean {
  const [rMaj, rMin, rPat] = parseSemver(remote);
  const [cMaj, cMin, cPat] = parseSemver(current);
  if (rMaj !== cMaj) return rMaj > cMaj;
  if (rMin !== cMin) return rMin > cMin;
  return rPat > cPat;
}

function getApkUrl(release: any): string | null {
  if (!release?.assets?.length) return null;
  const asset = release.assets.find((a: any) =>
    a.name.toLowerCase().endsWith('.apk') && a.name.toLowerCase().includes('signed')
  ) || release.assets.find((a: any) => a.name.toLowerCase().endsWith('.apk'));
  return asset?.browser_download_url || null;
}

interface Release {
  tag_name: string;
  name: string;
  apkUrl: string | null;
  published_at: string;
}

export const UpdateBanner: React.FC = () => {
  const [release, setRelease] = useState<Release | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const checkUpdates = useCallback(async () => {
    try {
      const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
      if (snoozedUntil && Date.now() < parseInt(snoozedUntil)) return;

      const res = await fetch(GITHUB_RELEASES_API, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.tag_name) return;

      if (!isNewer(data.tag_name, CURRENT_VERSION)) return;

      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === data.tag_name) return;

      setRelease({
        tag_name: data.tag_name,
        name: data.name,
        apkUrl: getApkUrl(data),
        published_at: data.published_at,
      });
      setShowBanner(true);
    } catch (_) {
      // silent
    }
  }, []);

  useEffect(() => {
    // Only show in installed/native contexts
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    if (!isNative && !isPWA && !isElectron) return;

    const timer = setTimeout(checkUpdates, 4000);
    const interval = setInterval(checkUpdates, CHECK_INTERVAL_MS);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [checkUpdates]);

  const handleSnooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setShowBanner(false);
  };

  const handleDismiss = () => {
    if (release) localStorage.setItem(DISMISSED_KEY, release.tag_name);
    setShowBanner(false);
  };

  const handleDownload = () => {
    if (release?.apkUrl) {
      window.location.href = release.apkUrl;
    }
  };

  if (!release?.apkUrl) return null; // Don't show if there's no APK download available

  return (
    <>
      <AnimatePresence>
        {showBanner && release && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[9999999] bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-white shadow-2xl border-b border-emerald-400/40 px-4 py-2.5 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 bg-white/20 p-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="font-bold font-mono text-xs">
                  New Update Available
                </span>
                <span className="text-emerald-200 text-[10px] hidden sm:block truncate uppercase font-mono">
                  Version {release.tag_name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="bg-white text-emerald-900 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Download Now
              </button>
              <button onClick={handleSnooze} className="p-1 hover:bg-black/20 rounded-full transition-colors">
                <svg className="w-4 h-4 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
