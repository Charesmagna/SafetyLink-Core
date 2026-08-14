import React, { useState, useEffect } from 'react';

export const FirstLaunchDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('sl_disclaimer_accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sl_disclaimer_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999999] bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-200 select-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        {/* Shield Icon / Logo Placeholder */}
        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-100 font-mono">
            SafetyLink Core
          </h2>
          
          <div className="w-12 h-0.5 bg-red-500/50 mx-auto rounded-full" />
          
          <div className="space-y-4 text-[11px] leading-relaxed text-slate-400 font-mono text-justify">
            <p className="font-bold text-center text-slate-300">
              © 2026 TM Media Solutions. All rights reserved.
            </p>
            <p>
              SafetyLink is proprietary software. Unauthorised copying, reverse engineering, redistribution, or recreation of this application or its concepts is strictly prohibited.
            </p>
            <p className="text-center">
              By continuing you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>
        </div>

        <button
          onClick={handleAccept}
          className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-emerald-500/50 py-3.5 px-6 rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-lg "
        >
          I Understand & Accept
        </button>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-800 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-800 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-800 pointer-events-none" />
    </div>
  );
};
