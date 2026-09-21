import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Download, Sparkles, X, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
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

  const isNative = Capacitor.isNativePlatform();

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
            {/* Primary Action: Download APK on mobile/native, or both on web */}
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

            {!isNative && (
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
                <span>{isUpdating ? 'Refreshing...' : 'Instant Web Sync'}</span>
              </button>
            )}

            {/* Dismiss button */}
            <button
              onClick={() => {
                setDismissed(true);
                if (onDismiss) onDismiss();
              }}
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
