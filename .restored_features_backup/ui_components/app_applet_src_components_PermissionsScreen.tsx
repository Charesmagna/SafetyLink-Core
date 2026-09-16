import React from 'react';

interface PermissionsScreenProps {
  onComplete: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans text-slate-200">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        
        <div className="w-20 h-20 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white">Welcome to SafetyLink</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            SafetyLink helps you quickly notify trusted contacts and share critical information during emergencies.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 text-left shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
          
          <div className="flex gap-3 items-start">
            <span className="text-xl">💬</span>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-white text-sm">SMS & Calling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Allow SafetyLink to send SMS alerts and place emergency phone calls on your behalf when you trigger an SOS.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="text-xl">📍</span>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-white text-sm">Location Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Required to securely broadcast your coordinates to your responders during an active crisis.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="text-xl">📸</span>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-white text-sm">Photo & Audio Capture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used to silently gather background evidence during a triggered SOS session.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm pt-6 space-y-3">
          <button 
            onClick={onComplete}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold tracking-wide transition-colors"
          >
            GRANT PERMISSIONS
          </button>
          <button 
            onClick={onComplete}
            className="w-full py-4 bg-transparent text-slate-500 hover:text-slate-300 rounded-2xl font-bold tracking-wide transition-colors text-sm"
          >
            ABOUT PRIVACY
          </button>
        </div>

      </div>
    </div>
  );
};
