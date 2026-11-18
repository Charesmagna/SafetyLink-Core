import React from 'react';
import { Capacitor } from '@capacitor/core';

// Minimal non-intrusive footer — only shows on web, hidden on native app
export const GlobalFooter: React.FC = () => {
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
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[999]">
      <div className="relative flex items-center justify-center text-[8px] font-mono text-slate-600/80 text-center py-1 px-3 bg-white/80 dark:bg-slate-950/60 backdrop-blur-sm border-t border-emerald-100/60">
        <span>
          © TM Media Solutions · Reg 2018/500191/07 · POPIA Compliant ·{' '}
          <a
            href="https://safetylink.online"
            className="pointer-events-auto text-emerald-700 hover:text-emerald-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            safetylink.online
          </a>
        </span>
        <a
          href="#preview"
          onClick={handleOpenPortal}
          aria-label="P"
          className="pointer-events-auto absolute right-3 w-4 h-4 rounded flex items-center justify-center text-[9px] font-black text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          P
        </a>
      </div>
    </div>
  );
};
