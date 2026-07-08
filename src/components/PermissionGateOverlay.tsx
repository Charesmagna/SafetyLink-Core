import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';

export const PermissionGateOverlay: React.FC = () => {
  const { permissions, setPermission, grantAllPermissions } = useAppStore();
  const [isVisible, setIsVisible] = useState(() => {
    // Show if any key permission is not yet granted
    const allKeys: (keyof typeof permissions)[] = ['location', 'backgroundLocation', 'bluetooth', 'sms', 'phone', 'notifications', 'batteryBypass'];
    return allKeys.some(k => !permissions[k]);
  });

  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(false);
  const [agreementProfile, setAgreementProfile] = useState<'SECURED' | 'DISPUTED' | null>(null);
  const [disputeConfirmation, setDisputeConfirmation] = useState<boolean>(false);

  if (!isVisible) return null;

  const handleGrantAll = () => {
    grantAllPermissions();
    setHasAgreedTerms(true);
    setAgreementProfile('SECURED');
    setIsVisible(false);
  };

  const handleApplyPolicy = () => {
    if (agreementProfile === 'SECURED') {
      grantAllPermissions();
      setIsVisible(false);
    } else if (agreementProfile === 'DISPUTED') {
      if (!disputeConfirmation) {
        alert("Please confirm the liability waiver for the disputed restricted mode to proceed.");
        return;
      }
      setIsVisible(false);
    } else {
      alert("Please select either Option A (Secured) or Option B (Disputed) to proceed.");
    }
  };

  const permissionList = [
    {
      key: 'location' as const,
      title: 'High-Precision Precise GPS Location',
      desc: 'Enables high-accuracy satellite-based telemetry. Essential for central dispatch teams to locate you instantly in a tactical emergency.',
      icon: '🛰️',
    },
    {
      key: 'backgroundLocation' as const,
      title: 'Always-On Background Location',
      desc: 'Allows SafetyLink to query your coordinates even when the app is minimized or your phone screen is locked. Absolute requirement for continuous safety.',
      icon: '🔄',
    },
    {
      key: 'bluetooth' as const,
      title: 'Bluetooth Near-Devices Sharing',
      desc: 'Required to continuously scan for, bind with, and receive clicks from physical iTAG wireless keyfobs and BLE panic hardware.',
      icon: '📟',
    },
    {
      key: 'sms' as const,
      title: 'SMS Dispatch Gateway Authorization',
      desc: 'Authorizes SafetyLink to automatically broadcast critical SOS messages with live GPS links to your sequential emergency contact chain.',
      icon: '💬',
    },
    {
      key: 'phone' as const,
      title: 'Direct Call Dialing & Telephony',
      desc: 'Allows SafetyLink to automatically trigger a direct voice patch call to tactical dispatchers and the closest armed response team.',
      icon: '📞',
    },
    {
      key: 'notifications' as const,
      title: 'Persistent Status Bar Notifications',
      desc: 'Enables a locked, permanent notification panel displaying live system connectivity status and instant panic triggers on your home screen.',
      icon: '🔔',
    },
    {
      key: 'batteryBypass' as const,
      title: 'Ignore Battery & Power Optimization',
      desc: 'Prevents Android and iOS battery savers from putting SafetyLink to sleep, ensuring background loops remain active forever in critical moments.',
      icon: '🔋',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto font-mono select-none" id="permission-gate-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-[#0c0f17] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 relative">
            <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Compatibility Set
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner animate-pulse">
                🛡️
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black text-slate-100 tracking-wide uppercase">
                  System Security & Permissions Setup
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Confirm authorizations to ensure 100% background stability and hardware binding.
                </p>
              </div>
            </div>
          </div>

          {/* Body List */}
          <div className="p-6 space-y-4 max-h-[240px] overflow-y-auto divide-y divide-slate-800/40 pr-3 scrollbar-thin">
            {permissionList.map((perm) => {
              const isGranted = permissions[perm.key];
              return (
                <div key={perm.key} className={`flex items-start gap-3 pt-3.5 first:pt-0 ${isGranted ? 'opacity-90' : 'opacity-100'}`}>
                  {/* Icon indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                    isGranted 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    {perm.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-black text-slate-100 uppercase tracking-wide">
                        {perm.title}
                      </span>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                        isGranted 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                      }`}>
                        {isGranted ? 'GRANTED' : 'REQUIRED'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                      {perm.desc}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => setPermission(perm.key, !isGranted)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 border relative ${
                      isGranted 
                        ? 'bg-emerald-500/20 border-emerald-500/40' 
                        : 'bg-slate-950 border-slate-850'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-200 ${
                      isGranted 
                        ? 'translate-x-5 bg-emerald-400' 
                        : 'translate-x-0 bg-slate-600'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Interactive Agree vs Dispute Selector */}
          <div className="p-5 border-t border-b border-slate-800 bg-slate-950/40 space-y-4">
            <span className="text-[9.5px] font-black text-slate-300 block text-left uppercase tracking-wider">
              📝 SYSTEM BACKGROUND OPERATION TERMS & DISPUTE SELECTOR
            </span>

            {/* Selector Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option A: Fully Authorized */}
              <button
                type="button"
                onClick={() => {
                  setAgreementProfile('SECURED');
                  setHasAgreedTerms(true);
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  agreementProfile === 'SECURED'
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  agreementProfile === 'SECURED' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 text-[10px]' : 'border-slate-700 text-transparent'
                }`}>
                  {agreementProfile === 'SECURED' && "✓"}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide block">OPTION A: FULLY SECURED KEEP-ALIVE SYSTEM (RECOMMENDED)</span>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                    Grants all background location, battery bypass, and iTAG BLE permissions. Requests system 'Wake Lock' to prevent deep sleep CPU hibernation.
                  </p>
                </div>
              </button>

              {/* Option B: Dispute Agreement */}
              <button
                type="button"
                onClick={() => {
                  setAgreementProfile('DISPUTED');
                  setHasAgreedTerms(false);
                }}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  agreementProfile === 'DISPUTED'
                    ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  agreementProfile === 'DISPUTED' ? 'border-red-400 bg-red-500/20 text-red-400 text-[10px]' : 'border-slate-700 text-transparent'
                }`}>
                  {agreementProfile === 'DISPUTED' && "✓"}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wide block">OPTION B: DISPUTE BACKGROUND CALIBRATION AGREEMENT</span>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                    Refuse high-accuracy background tracking. The system operates strictly as a foreground task. Suspend execution when minimized.
                  </p>
                </div>
              </button>
            </div>

            {/* Terms Content Box */}
            <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-2xl text-left">
              <span className="text-[8.5px] font-black text-red-400 block uppercase tracking-wider mb-1.5">
                ⚠️ Background Liability Waver & T&Cs:
              </span>
              <p className="text-[9px] text-slate-300 leading-relaxed font-semibold font-mono">
                SafetyLink requires geographic/cal permissions to function as intended, failure to accept, we will not be held responsible for any inconvenience because the app isn't running in the background as soon as i press home button it totally gets silent completly and when I open I con again it starts over from registration/login page.
              </p>

              {/* Conditional checkboxes */}
              {agreementProfile === 'SECURED' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-500/10">
                  <input
                    id="agree-sec-checkbox"
                    type="checkbox"
                    checked={hasAgreedTerms}
                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="agree-sec-checkbox" className="text-[8.5px] text-slate-200 font-black uppercase select-none cursor-pointer tracking-wider">
                    I acknowledge and agree to authorize full geographic/cal systems
                  </label>
                </div>
              )}

              {agreementProfile === 'DISPUTED' && (
                <div className="space-y-2.5 mt-3 pt-3 border-t border-red-500/10">
                  <div className="flex items-start gap-2">
                    <input
                      id="dispute-chk"
                      type="checkbox"
                      checked={disputeConfirmation}
                      onChange={(e) => setDisputeConfirmation(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="dispute-chk" className="text-[8.5px] text-red-300 font-black uppercase select-none cursor-pointer tracking-wider leading-relaxed">
                      I understand SafetyLink will go completely silent when minimized. I dispute geographic/cal permissions and waive all developer liabilities.
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/50 space-y-3">
            <button
              onClick={handleGrantAll}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10.5px] uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-950/30 transition-all border border-emerald-500/20"
            >
              🚀 Grant All & Agree to Terms (Recommended)
            </button>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setAgreementProfile('DISPUTED');
                  setHasAgreedTerms(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-[9.5px] font-bold uppercase tracking-wider transition-all border ${
                  agreementProfile === 'DISPUTED' ? 'bg-red-950/40 border-red-500/30 text-red-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Dispute Agreement
              </button>
              <button
                onClick={handleApplyPolicy}
                className={`flex-1 py-2.5 font-bold text-[9.5px] uppercase tracking-wider rounded-xl transition-all ${
                  (agreementProfile === 'SECURED' && hasAgreedTerms) || (agreementProfile === 'DISPUTED' && disputeConfirmation)
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/20'
                    : 'bg-slate-950 text-slate-600 border border-slate-900/60 cursor-not-allowed'
                }`}
              >
                Apply Selection
              </button>
            </div>

            <p className="text-[8px] text-center text-slate-500 leading-relaxed font-mono pt-1">
              * SafetyLink uses persistent background channels. No private user telemetry is sold or broadcast to external networks.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
