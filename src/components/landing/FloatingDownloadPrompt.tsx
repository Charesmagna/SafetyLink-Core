import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X, ChevronLeft } from 'lucide-react';
import { useReleaseChannels } from '../../hooks/useReleaseChannels';

interface FloatingDownloadPromptProps {
  onOpenHub?: () => void;
}

export const FloatingDownloadPrompt: React.FC<FloatingDownloadPromptProps> = ({ onOpenHub }) => {
  const channels = useReleaseChannels();
  const [expanded, setExpanded] = useState(false);
  const [userClosedOnce, setUserClosedOnce] = useState(false);
  const [pulseAttention, setPulseAttention] = useState(false);

  const apkUrl = channels.stable.apkUrl;
  const stableTag = channels.stable.version;
  const stableBuild = channels.stable.buildNumber ? `#${channels.stable.buildNumber}` : 'main';

  // Gently peek open once after 5.5s on landing visit, then periodically pulse the edge shield tab
  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      if (!userClosedOnce) {
        setExpanded(true);
      }
    }, 5500);

    const periodicPeek = window.setInterval(() => {
      setPulseAttention(true);
      window.setTimeout(() => setPulseAttention(false), 3200);
    }, 28000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(periodicPeek);
    };
  }, [userClosedOnce]);

  const handleCollapse = () => {
    setExpanded(false);
    setUserClosedOnce(true);
  };

  return (
    <div className="fixed right-0 bottom-20 sm:bottom-8 z-[950] flex items-end justify-end pointer-events-none">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="download-card"
            initial={{ x: 120, opacity: 0, scale: 0.92, rotateY: -12 }}
            animate={{ x: 0, opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ x: 140, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-auto mr-3 sm:mr-5 w-[295px] sm:w-[318px] rounded-2xl overflow-hidden bg-white/95 dark:bg-[#0b1830]/95 backdrop-blur-2xl border border-emerald-500/35 dark:border-emerald-400/30 shadow-[0_24px_60px_rgba(2,6,23,0.35),0_0_28px_rgba(16,185,129,0.22)] text-left"
          >
            {/* Luminous Emerald Top Edge */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-1.5 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0"
                  >
                    <img
                      src="/logos/Safety_Link_Logo_Transparent.png"
                      alt="SafetyLink Shield"
                      className="w-full h-full object-contain drop-shadow"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </motion.div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      SafetyLink APK · v1 Stable
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      {stableTag} · Build {stableBuild} (main)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCollapse}
                  aria-label="Minimize download drawer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <a
                href={apkUrl}
                download={`SafetyLink-v1-${stableTag}.apk`}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 no-underline transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Smartphone size={16} className="shrink-0" />
                  <span className="truncate text-xs font-extrabold leading-tight">
                    Download Stable v1 ({stableTag})
                  </span>
                </span>
                <Download size={15} className="shrink-0" />
              </a>

              {onOpenHub && (
                <button
                  type="button"
                  onClick={() => {
                    handleCollapse();
                    onOpenHub();
                  }}
                  className="w-full py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-center"
                >
                  More versions &amp; platforms →
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Half-Stripe Glass Shield Edge Tab */
          <motion.button
            key="download-edge-tab"
            type="button"
            onClick={() => setExpanded(true)}
            initial={{ x: 60, opacity: 0 }}
            animate={{
              x: pulseAttention ? -6 : 0,
              opacity: 1,
            }}
            exit={{ x: 60, opacity: 0 }}
            whileHover={{ x: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            aria-label={`Download SafetyLink Stable v1 APK ${stableTag}`}
            className={`pointer-events-auto flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-l-2xl bg-white/95 dark:bg-[#0b1830]/95 backdrop-blur-xl border border-r-0 border-emerald-500/45 shadow-[0_12px_32px_rgba(2,6,23,0.28),0_0_20px_rgba(16,185,129,0.25)] text-slate-900 dark:text-white cursor-pointer group ${
              pulseAttention ? 'ring-2 ring-emerald-400/60' : ''
            }`}
          >
            <ChevronLeft size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 p-1 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <img
                src="/logos/Safety_Link_Logo_Transparent.png"
                alt="SafetyLink Shield"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-extrabold leading-none">APK v1 Stable</div>
              <div className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">{stableTag}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
