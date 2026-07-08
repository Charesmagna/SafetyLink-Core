import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const AndroidWidgetSimulator: React.FC = () => {
  const { triggerPanic, addAuditLog, activeSOSState, userLocation } = useAppStore();
  
  const userLat = userLocation?.lat ?? -26.1912;
  const userLng = userLocation?.lng ?? 28.0264;
  const coordString = `[${userLat.toFixed(5)}, ${userLng.toFixed(5)}]`;
  
  // Widget states
  const [countdown, setCountdown] = useState<number | null>(null);
  const isArmed = true;
  const [showNotificationAlert, setShowNotificationAlert] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // 10-second disarm timer logic
  useEffect(() => {
    if (countdown === 0) {
      setCountdown(null);
      executeRealPanic();
      return;
    }

    if (countdown === null) return;

    const interval = setInterval(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const executeRealPanic = async () => {
    addAuditLog('DISPATCH', 'SEVERE', 'Widget 10s grace period expired. Broadcasting SOS!', 'Transmitting cellular telemetry');
    
    // Simulate Capacitor Local Notifications payload
    triggerLocalNotification('SafetyLink Emergency Dispatch Active', 'DISTRESS BEACON BROADCASTED SEQUENTIALLY TO APEX HOUSING RESPONDERS!');

    try {
      await triggerPanic('Emergency SOS triggered from Capacitor Android Home Widget.');
    } catch (e) {
      console.error(e);
    }
  };

  const triggerLocalNotification = (title: string, body: string) => {
    setNotificationMsg(`${title}: ${body}`);
    setShowNotificationAlert(true);
    // Auto-dim notification after 6 seconds
    setTimeout(() => {
      setShowNotificationAlert(false);
    }, 6000);
  };

  const handleWidgetTrigger = () => {
    if (!isArmed) {
      triggerLocalNotification('Widget Error', 'SafetyLink widget is disarmed. Please open main console to authenticate.');
      return;
    }
    if (activeSOSState !== 'IDLE') {
      triggerLocalNotification('Broadcast Status', 'An active emergency beacon is already transmitting.');
      return;
    }
    
    // Start 10 seconds disarm countdown
    setCountdown(10);
    addAuditLog('SYSTEM', 'WARN', 'SOS triggered from Home Screen Widget', '10-second disarm grace period started');
    
    // Fire immediate Capacitor notification warning
    triggerLocalNotification(
      'SafetyLink Widget Triggered',
      'EMERGENCY SOS enqueued! You have 10 seconds to disarm.'
    );
  };

  const handleDisarmGrace = () => {
    setCountdown(null);
    addAuditLog('BLE', 'INFO', 'Widget SOS disarmed by user during 10s grace period', 'Coordinated broadcast enqueuer stopped.');
    triggerLocalNotification('SOS Aborted', 'Emergency broadcast sequence successfully disarmed.');
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 text-left space-y-4 shadow relative overflow-hidden">
      {/* Capacitor Notification Badge Popup Simulation */}
      <AnimatePresence>
        {showNotificationAlert && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 bg-slate-900/95 border border-purple-500/30 text-slate-100 rounded-2xl p-4 shadow-2xl z-[999999] max-w-sm mx-auto flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-base">
              🔔
            </div>
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] font-black font-mono text-purple-400 uppercase tracking-widest block">Capacitor Notification Relay</span>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">{notificationMsg}</p>
            </div>
            <button
              onClick={() => setShowNotificationAlert(false)}
              className="text-slate-500 hover:text-slate-300 font-mono text-xs font-bold pl-1 uppercase"
            >
              Dim
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 10-second Urgent Disarm Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 z-[999999] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Pulsing hazard glow backing */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] animate-pulse" />

            <div className="max-w-md w-full space-y-8 z-10">
              <div className="space-y-2">
                <span className="inline-block text-[10px] font-black font-mono bg-red-950/40 border border-red-500/20 text-red-400 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  ⚠️ CAPACITOR LAUNCHER SOS WARNING ⚠️
                </span>
                <h3 className="text-xl font-black font-mono uppercase tracking-wide text-slate-100">
                  Transmitting GPS Coordinates in
                </h3>
              </div>

              {/* Huge pulsating countdown timer */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-dashed border-red-500/25"
                />
                <div className="w-40 h-40 rounded-full bg-slate-900 border border-red-500/40 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.25)] relative">
                  <span className="text-6xl font-black font-mono text-red-500 tracking-tighter">
                    {countdown}s
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed px-6 font-mono">
                  Distress payload ready. Transmitting location <span className="text-amber-400 font-bold">{coordString}</span> to student housing responders, and emergency call sequencers.
                </p>

                <button
                  onClick={handleDisarmGrace}
                  className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs rounded-2xl uppercase tracking-wider shadow-lg shadow-emerald-900/30 border border-emerald-500/20 hover:scale-102 transition-all"
                >
                  🛑 DISARM SOS (CANCEL BROADCAST)
                </button>
                
                <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Any interaction or pressing disarm stops escalation
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Authentic Home Screen Widget Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <SafetyLinkLogo size={18} glowColor="rgba(239, 68, 68, 0.4)" />
          <h2 className="text-xs font-black tracking-widest font-mono uppercase text-slate-100">
            SafetyLink Home Screen Widget
          </h2>
        </div>
        <span className="text-[8px] font-mono font-black px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded uppercase">
          Direct SOS
        </span>
      </div>

      {/* The Widget Body, rendered directly as a clean high-contrast card */}
      <div className="flex flex-col items-center justify-center py-4 space-y-4 relative">
        {/* High contrast SOS widget button */}
        <motion.button
          onClick={handleWidgetTrigger}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-28 h-28 rounded-full bg-gradient-to-b from-red-600 to-red-800 border-4 border-slate-950 shadow-[0_10px_25px_rgba(220,38,38,0.4)] flex items-center justify-center flex-col gap-1 cursor-pointer group hover:brightness-110 transition-all"
        >
          {/* Glowing pulse rings */}
          {isArmed && (
            <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
          )}
          <span className="text-2xl font-black font-mono text-white tracking-wide">
            SOS
          </span>
          <span className="text-[7px] font-mono font-black text-red-200 uppercase tracking-widest">
            TAP TO LAUNCH
          </span>
        </motion.button>

        <div className="text-center space-y-0.5 font-mono">
          <span className="text-[9.5px] font-black text-slate-300 uppercase">Interactive Widget Gateway</span>
          <p className="text-[8px] text-slate-500 uppercase leading-relaxed max-w-xs">
            Uplink: Active • Delay: 10s Grace Period
          </p>
        </div>
      </div>
    </div>
  );
};
