import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { UpdateInfo, applyLiveUpdate } from '../services/UpdateService';

interface UpdateBannerProps {
  updateInfo: UpdateInfo | null;
  onDismiss?: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ updateInfo, onDismiss }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!updateInfo?.available || dismissed) return null;

  const isNative = Capacitor.isNativePlatform();

  const handleUpdate = async () => {
    if (isNative && updateInfo.apkUrl) {
      window.open(updateInfo.apkUrl, '_system');
    } else {
      setIsUpdating(true);
      try {
        await applyLiveUpdate(updateInfo.version);
      } catch {
        setIsUpdating(false);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          zIndex: 999999,
          background: 'rgba(2, 44, 34, 0.96)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '280px',
          backdropFilter: 'blur(12px)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Green dot indicator */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 8px #10b981',
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }} />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, lineHeight: 1.3 }}>
            Update available
          </div>
          <div style={{ color: '#6ee7b7', fontSize: '10px', marginTop: '1px' }}>
            v{updateInfo.version}
          </div>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          style={{
            background: '#10b981',
            color: '#022c22',
            border: 'none',
            borderRadius: '7px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: isUpdating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          {isUpdating
            ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
            : <Download size={11} />}
          {isUpdating ? 'Updating' : 'Update'}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
