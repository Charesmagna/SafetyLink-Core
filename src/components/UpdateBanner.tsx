import React from 'react';
import { useAppStore } from '../utils/store';
import { openDownloadUrl } from '../services/UpdateService';
import { DownloadCloud, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export const UpdateBanner: React.FC = () => {
  const { updateInfo } = useAppStore();
  const [dismissed, setDismissed] = React.useState(false);

  if (!updateInfo || !updateInfo.available || dismissed) {
    return null;
  }

  const isAndroid = Capacitor.getPlatform() === 'android';
  const isWeb = Capacitor.getPlatform() === 'web';
  const isWindows = typeof window !== 'undefined' && window.navigator.userAgent.includes('Windows');

  let downloadUrl = updateInfo.apkUrl;
  let platformName = 'Android APK';
  
  if (isWeb && isWindows && updateInfo.exeUrl) {
    downloadUrl = updateInfo.exeUrl;
    platformName = 'Windows EXE';
  } else if (isWeb && !isWindows) {
    downloadUrl = updateInfo.apkUrl; // default to APK for non-Windows web users
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-900 border-b border-emerald-500 text-emerald-100 px-4 py-2 flex flex-col sm:flex-row items-center justify-between shadow-lg shadow-emerald-900/50">
      <div className="flex items-center gap-3 mb-2 sm:mb-0 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
        <DownloadCloud size={16} className="text-emerald-400 animate-pulse" />
        <span>Update Available: v{updateInfo.version}</span>
      </div>
      <div className="flex items-center gap-4">
        {downloadUrl && (
          <button
            onClick={() => openDownloadUrl(downloadUrl!)}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold font-mono text-[9px] sm:text-[10px] uppercase tracking-wider rounded transition-colors flex items-center gap-2"
          >
            <span>Download {platformName}</span>
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-emerald-400 hover:text-white transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
