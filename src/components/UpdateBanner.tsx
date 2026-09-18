import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Download, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { UpdateInfo, applyLiveUpdate } from '../services/UpdateService';

interface UpdateBannerProps {
  updateInfo: UpdateInfo | null;
  onDismiss?: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ updateInfo, onDismiss }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!updateInfo?.available || dismissed) {
    return null;
  }

  const handleLiveUpdate = async () => {
    setIsUpdating(true);
    try {
      await applyLiveUpdate(updateInfo.version);
    } catch (err) {
      console.error('Update failed:', err);
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        id="safetylink-update-banner"
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/40 shadow-2xl px-4 py-2.5 text-white"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Info */}
          <div className="flex items-center gap-2.5 text-slate-200 text-center sm:text-left">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <span>SafetyLink v{updateInfo.version} Available</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[10px] font-mono">
                  OTA Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {updateInfo.releaseNotes || 'Security enhancements, telemetry, and live sync updates.'}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLiveUpdate}
              disabled={isUpdating}
              id="btn-apply-live-update"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Applying Update...' : 'Update Now (Instant)'}</span>
            </button>

            {updateInfo.apkUrl && (
              <a
                href={updateInfo.apkUrl}
                target="_blank"
                rel="noreferrer"
                id="btn-download-apk-fallback"
                className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium text-[11px]"
              >
                <Download className="w-3 h-3" />
                <span>Download Raw APK</span>
              </a>
            )}

            <button
              onClick={() => {
                setDismissed(true);
                if (onDismiss) onDismiss();
              }}
              aria-label="Dismiss banner"
              className="p-1 text-slate-400 hover:text-white rounded transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
