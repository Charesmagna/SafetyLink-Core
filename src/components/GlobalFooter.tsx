import React, { useState, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';

const MediaHub = lazy(() => import('./MediaHub').then((m) => ({ default: m.MediaHub })));

// Minimal non-intrusive footer — only shows on web, hidden on native app
export const GlobalFooter: React.FC = () => {
  const [showMediaVault, setShowMediaVault] = useState(false);
  const globalTheme = useAppStore((s) => s.globalTheme);
  const isDark = globalTheme === 'dark';

  // Don't render at all inside the native Android/iOS app
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const handleOpenPortal = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = 'preview';
    window.dispatchEvent(new CustomEvent('sl-open-preview'));
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[999]">
        <div
          className={`relative flex items-center justify-center text-[9px] font-mono text-center py-1 px-3 backdrop-blur-md border-t transition-colors ${
            isDark
              ? 'bg-slate-950/85 text-slate-400 border-slate-800/80'
              : 'bg-white/85 text-slate-600 border-emerald-100/80'
          }`}
        >
          <span>
            © TM Media Solutions · Reg 2018/500191/07 · POPIA Compliant ·{' '}
            <a
              href="https://safetylink.online"
              className={`pointer-events-auto transition-colors ${
                isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-600'
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              safetylink.online
            </a>
          </span>
          <div className="pointer-events-auto absolute right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowMediaVault(true)}
              aria-label="Media Vault"
              className="w-4 h-4 rounded flex items-center justify-center text-[10px] leading-none text-slate-400 opacity-60 hover:opacity-100 hover:text-emerald-400 transition-all cursor-pointer"
            >
              ☾
            </button>
            <a
              href="#preview"
              onClick={handleOpenPortal}
              aria-label="Open App Portal"
              className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              P
            </a>
          </div>
        </div>
      </div>

      {showMediaVault && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex items-start justify-center pointer-events-auto">
          <div className="w-full max-w-6xl my-4">
            <Suspense fallback={<div className="p-8 text-center text-sm font-mono text-emerald-400">Loading Media Vault...</div>}>
              <MediaHub ownerMode onClose={() => setShowMediaVault(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
};

