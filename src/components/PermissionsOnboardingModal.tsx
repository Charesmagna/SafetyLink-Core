import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { Shield, MapPin, MessageSquare, Phone, Bluetooth, BatteryCharging, KeyRound, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { GeolocationService } from '../services/BaseService';
import { LocalNotificationService } from '../services/LocalNotificationService';

interface Props {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PermissionsOnboardingModal: React.FC<Props> = ({ forceOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [permissionStates, setPermissionStates] = useState({
    location: false,
    notifications: false,
    accessibility: false,
    battery: false,
    overlay: false,
  });

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Auto-open on initial launch if not yet configured
    const configured = localStorage.getItem('sl_permissions_configured_v2');
    if (!configured && native) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleGrantBasicPermissions = async () => {
    try {
      // 1. Location
      const locGranted = await GeolocationService.requestPermission();
      // 2. Notifications
      const notifGranted = await LocalNotificationService.requestPermission();

      // 3. Native Emergency Dispatch permissions if plugin available
      if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.EmergencyDispatch) {
        try {
          await (window as any).Capacitor.Plugins.EmergencyDispatch.requestPermissions();
        } catch (_) {}
      }

      setPermissionStates(prev => ({
        ...prev,
        location: locGranted,
        notifications: notifGranted,
      }));

      // Advance to Device Control / Accessibility
      setStep(2);
    } catch (err) {
      console.error('[Permissions] Basic request error:', err);
      setStep(2);
    }
  };

  const handleOpenAccessibility = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency) {
        await (window as any).Capacitor.Plugins.SafetyLinkEmergency.openAccessibilitySettings();
      } else {
        window.open('https://support.google.com/accessibility/android/answer/6006564', '_blank');
      }
      setPermissionStates(prev => ({ ...prev, accessibility: true }));
    } catch (err) {
      console.error('[Permissions] Accessibility open error:', err);
    }
  };

  const handleRequestBatteryExemption = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency) {
        await (window as any).Capacitor.Plugins.SafetyLinkEmergency.requestBatteryOptimizationExemption();
      }
      setPermissionStates(prev => ({ ...prev, battery: true }));
    } catch (err) {
      console.error('[Permissions] Battery exemption error:', err);
    }
  };

  const handleRequestOverlay = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency) {
        await (window as any).Capacitor.Plugins.SafetyLinkEmergency.requestOverlayPermission();
      }
      setPermissionStates(prev => ({ ...prev, overlay: true }));
    } catch (err) {
      console.error('[Permissions] Overlay error:', err);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('sl_permissions_configured_v2', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans"
        >
          {/* Header */}
          <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-mono tracking-wide uppercase">
                  SafetyLink Sentinel Setup
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Golden APK Device Control & Permission Binding
                </p>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-mono">
            {[
              { num: 1, title: 'Permissions' },
              { num: 2, title: 'Device Control' },
              { num: 3, title: 'Sentinel Power' },
            ].map(s => (
              <button
                key={s.num}
                onClick={() => setStep(s.num as any)}
                className={`flex-1 py-3 px-2 text-center font-bold border-b-2 transition-colors ${
                  step === s.num
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.num}. {s.title}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  SafetyLink requires core hardware permissions to dispatch live GPS coordinates and send automated carrier SMS when offline:
                </p>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <MapPin className="text-emerald-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">Fine & Background Location</h4>
                      <p className="text-[11px] text-slate-400">Emergency GPS coordinates sent to responders.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <MessageSquare className="text-blue-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">Emergency SMS (SmsManager)</h4>
                      <p className="text-[11px] text-slate-400">Direct carrier text dispatch to safety chain.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <Phone className="text-amber-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">Emergency Voice Dialer</h4>
                      <p className="text-[11px] text-slate-400">Instant direct phone line connection.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <Bluetooth className="text-indigo-400 shrink-0" size={18} />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white">Bluetooth LE & Nearby Devices</h4>
                      <p className="text-[11px] text-slate-400">Connects to your physical iTAG wearable panic tag.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGrantBasicPermissions}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Grant Emergency Permissions</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  <strong>Device Control & Accessibility:</strong> In the Golden SafetyLink build, giving SafetyLink Accessibility access allows hardware button interception (e.g. Volume buttons panic trigger) even when your phone is locked or inside your pocket:
                </p>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <KeyRound className="text-amber-400" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Accessibility Service Binding</h4>
                      <p className="text-[11px] text-slate-400">Detects rapid 3-click volume hardware panic triggers.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenAccessibility}
                    className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Open Accessibility Settings</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="text-purple-400" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Draw Over Locked Screen (Overlay)</h4>
                      <p className="text-[11px] text-slate-400">Wakes screen & displays 10s PIN disarm countdown.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestOverlay}
                    className="w-full py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Grant Display Over Other Apps</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Sentinel Power</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  <strong>Unrestricted Battery & Sentinel Watchdog:</strong> Android aggressive battery killers shut down Bluetooth background listeners after 10 minutes. Exempt SafetyLink so your iTAG stays connected 24/7:
                </p>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <BatteryCharging className="text-emerald-400" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Battery Optimization Exemption</h4>
                      <p className="text-[11px] text-slate-400">Guarantees 24/7 background iTAG beacon listening.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRequestBatteryExemption}
                    className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Exempt from Battery Optimization</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Private DNS Configuration</h4>
                      <p className="text-[11px] text-slate-400 font-mono">dns.safetylink.online (TLS Port 853)</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Finish Setup & Enter SafetyLink</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default PermissionsOnboardingModal;
