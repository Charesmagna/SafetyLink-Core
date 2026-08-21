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
  html_url: string;
  body: string;
  apkUrl: string | null;
  published_at: string;
}

export const UpdateBanner: React.FC = () => {
  const [release, setRelease] = useState<Release | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
        html_url: data.html_url,
        body: data.body || '',
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
    setShowModal(false);
  };

  const handleDismiss = () => {
    if (release) localStorage.setItem(DISMISSED_KEY, release.tag_name);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleDownload = () => {
    if (release?.apkUrl) {
      window.open(release.apkUrl, '_blank');
    } else if (release?.html_url) {
      window.open(release.html_url, '_blank');
    }
  };

  return (
    <>
      {/* Top banner */}
      <AnimatePresence>
        {showBanner && release && !showModal && (
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
              <div className="min-w-0">
                <span className="font-bold font-mono text-xs">
                  Update {release.tag_name} available
                </span>
                <span className="text-emerald-200 text-xs ml-2 hidden sm:inline truncate">
                  {release.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-emerald-900 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider hover:bg-emerald-50 transition-colors"
              >
                View
              </button>
              <button
                onClick={handleDownload}
                className="bg-emerald-900/60 border border-emerald-400/40 text-white px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider hover:bg-emerald-900 transition-colors"
              >
                Install
              </button>
              <button onClick={handleSnooze} className="p-1 hover:bg-black/20 rounded-full transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full update modal */}
      <AnimatePresence>
        {showModal && release && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="w-full max-w-md bg-[#131720] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-black font-mono text-lg tracking-wide">NEW UPDATE</h2>
                    <p className="text-emerald-200 text-xs font-mono">{release.tag_name} · SafetyLink Core</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold font-mono text-sm">{release.name}</p>
                    <p className="text-gray-400 text-xs font-mono mt-0.5">
                      Current: v{CURRENT_VERSION} → New: {release.tag_name}
                    </p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono px-2.5 py-1 rounded-full font-bold">
                    STABLE
                  </span>
                </div>

                {release.body && (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-5 max-h-40 overflow-y-auto">
                    <p className="text-gray-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {release.body.slice(0, 600)}{release.body.length > 600 ? '...' : ''}
                    </p>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5">
                  <p className="text-amber-300 text-xs font-mono leading-relaxed">
                    ⚠️ Installing the update will not delete your data. Your contacts, settings and org membership are preserved.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black font-mono text-sm py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {release.apkUrl ? 'Download & Install APK' : 'Open Release Page'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSnooze}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-mono text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors"
                    >
                      Remind Tomorrow
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-mono text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors"
                    >
                      Skip This Version
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
