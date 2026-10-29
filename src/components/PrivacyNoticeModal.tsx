import React, { useState, useEffect } from 'react';

export const PrivacyNoticeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem('sl_privacy_acknowledged');
    if (!acknowledged) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sl_privacy_acknowledged', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-left">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              SafetyLink Privacy & Critical Permissions Notice
            </h3>
            <p className="text-[10px] text-slate-400">Google Play Sensitive Permissions & Data Safety Disclosure</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 max-h-72 overflow-y-auto pr-1">
          <p className="text-[11px] leading-relaxed text-slate-300">
            SafetyLink is an emergency distress network. To protect your life during distress without reliance on active internet or screen interaction, the app requests:
          </p>

          <div className="space-y-2">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2.5">
              <span className="text-emerald-400 text-sm">📍</span>
              <div>
                <strong className="text-emerald-400 text-[11px] block">Precise Background Location</strong>
                <span className="text-[10px] text-slate-400">
                  Transmits GPS coordinates only during active panic alerts or configured check-in timers to dispatch responders and emergency contacts.
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2.5">
              <span className="text-cyan-400 text-sm">✉️</span>
              <div>
                <strong className="text-cyan-400 text-[11px] block">Direct SMS Dispatch (SEND_SMS)</strong>
                <span className="text-[10px] text-slate-400">
                  Sends distress text messages via cellular radio when data/WiFi is absent or unreachable.
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2.5">
              <span className="text-amber-400 text-sm">📞</span>
              <div>
                <strong className="text-amber-400 text-[11px] block">Emergency Telephony (CALL_PHONE)</strong>
                <span className="text-[10px] text-slate-400">
                  Dials primary priority responder circuits and carrier USSD PCM channels without interrupting user focus.
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2.5">
              <span className="text-indigo-400 text-sm">🔘</span>
              <div>
                <strong className="text-indigo-400 text-[11px] block">Bluetooth Low Energy (iTAG Keyfob)</strong>
                <span className="text-[10px] text-slate-400">
                  Maintains continuous wireless sentinel connection with your physical distress hardware button.
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic">
            Zero telemetry or tracking data is sold or shared with advertisers. All incident coordinates remain encrypted and organization-scoped.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[9px] text-slate-500">Google Play Compliant v2</span>
          <button
            type="button"
            onClick={handleAccept}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
