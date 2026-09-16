import React from 'react';

// Minimal non-intrusive footer — only shows on web, hidden on native app
export const GlobalFooter: React.FC = () => {
  // Don't render at all inside the native Android/iOS app
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[999]">
      <div className="text-[8px] font-mono text-slate-600/60 text-center py-1 px-2 bg-slate-950/30 backdrop-blur-sm">
        © TM Media Solutions · Reg 2018/500191/07 ·{' '}
        <a href="https://safetylink.online" className="pointer-events-auto text-slate-500 hover:text-slate-400 transition-colors" target="_blank" rel="noopener noreferrer">
          safetylink.online
        </a>
      </div>
    </div>
  );
};
