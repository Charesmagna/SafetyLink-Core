import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Download, Sparkles, X, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { UpdateInfo, applyLiveUpdate, isAppBinary } from '../services/UpdateService';

interface UpdateBannerProps {
  updateInfo: UpdateInfo | null;
  onDismiss?: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ updateInfo, onDismiss }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isApp = isAppBinary();

  // If already dismissed for this version in this session, don't show
  useEffect(() => {
    if (updateInfo?.version) {
      try {
        const alreadyDismissed = sessionStorage.getItem(`sl_dismissed_update_${updateInfo.version}`);
        if (alreadyDismissed === 'true') {
          setDismissed(true);
        }
      } catch {}
    }
  }, [updateInfo?.version]);

  // Website mode: auto-dismiss after 18 seconds so it NEVER permanently stays afloat
  useEffect(() => {
    if (!isApp && updateInfo?.available && !dismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 18000);
      return () => clearTimeout(timer);
    }
  }, [isApp, updateInfo?.available, updateInfo?.version, dismissed]);

  if (!updateInfo?.available || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (updateInfo?.version) {
      try {
        sessionStorage.setItem(`sl_dismissed_update_${updateInfo.version}`, 'true');
      } catch {}
    }
    if (onDismiss) onDismiss();
  };

  const handleDownloadAndInstall = () => {
    if (updateInfo.apkUrl) {
      // In Android WebView / Capacitor, open system browser or trigger direct APK download
      if ((window as any).Capacitor) {
        window.open(updateInfo.apkUrl, '_system');
      } else {
        const a = document.createElement('a');
        a.href = updateInfo.apkUrl;
        a.download = `SafetyLink-v${updateInfo.version || 'latest'}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else if (updateInfo.exeUrl) {
      window.open(updateInfo.exeUrl, '_blank');
    }
  };

  const handleInstantLiveUpdate = async () => {
    setIsUpdating(true);
    try {
      await applyLiveUpdate(updateInfo.version);
    } catch (err) {
      console.error('Update failed:', err);
      setIsUpdating(false);
    }
  };

  // ── WEBSITE ONLY: Small Floating Download Latest Button (pops up on changes, never permanently stays afloat) ──
  if (!isApp) {
    return (
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            id="safetylink-floating-download-btn"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              padding: '8px 14px 8px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.6), 0 0 15px rgba(16, 185, 129, 0.3)',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#ffffff',
            }}
          >
            {/* Live pulse dot */}
            <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: '#34d399',
                  opacity: 0.75,
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: '#10b981',
                }}
              />
            </span>

            {/* Download Button */}
            <button
              onClick={() => {
                handleDownloadAndInstall();
                handleDismiss();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#34d399',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
              }}
              title={`Download Latest Build v${updateInfo.version}`}
            >
              <Download style={{ width: '15px', height: '15px', color: '#10b981' }} />
              <span>Download Latest</span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.18)',
                  color: '#a7f3d0',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              >
                v{updateInfo.version}
              </span>
            </button>

            {/* Quick Dismiss (Never permanently stays afloat) */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                marginLeft: '2px',
                transition: 'all 0.15s ease',
              }}
              title="Close (will not stay afloat)"
              aria-label="Dismiss update prompt"
            >
              <X style={{ width: '12px', height: '12px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── APP, APK, & EXE ONLY: Full Top Update Banner ──
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -70, opacity: 0 }}
        id="safetylink-update-banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999999,
          background: 'linear-gradient(90deg, #022c22 0%, #0f172a 50%, #022c22 100%)',
          borderBottom: '2px solid #10b981',
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
          padding: '12px 16px',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)',
                border: '1px solid rgba(16,185,129,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '-0.01em' }}>
                  SafetyLink Update Available: v{updateInfo.version}
                </span>
                <span
                  style={{
                    background: '#10b981',
                    color: '#022c22',
                    fontSize: '9px',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  NEW RELEASE
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                {updateInfo.releaseNotes || 'A newer version has been deployed with performance & security updates.'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Primary Action: Download APK on mobile/native */}
            {updateInfo.apkUrl && (
              <button
                onClick={handleDownloadAndInstall}
                id="btn-download-apk-update"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#10b981',
                  color: '#022c22',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                  transition: 'all .2s',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK (v{updateInfo.version})</span>
              </button>
            )}

            {updateInfo.exeUrl && (
              <button
                onClick={handleDownloadAndInstall}
                id="btn-download-exe-update"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0ea5e9',
                  color: '#022c22',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(14,165,233,0.3)',
                  transition: 'all .2s',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download EXE (v{updateInfo.version})</span>
              </button>
            )}

            <button
              onClick={handleInstantLiveUpdate}
              disabled={isUpdating}
              id="btn-apply-instant-update"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isUpdating ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Refreshing...' : 'Instant Sync'}</span>
            </button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
              title="Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
