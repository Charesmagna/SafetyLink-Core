import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { ShieldAlert, Volume2, VolumeX, AlertTriangle, Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

/**
 * ForcedCountdownOverlay (Canonical Single Emergency Countdown)
 *
 * Replaces duplicate countdown overlays. Synced strictly to store.panicCountdown
 * and native PanicService state. Enforces PIN + Duress PIN verification when
 * userPin is set, manages wakeLock, audio siren, haptics, and direct route presets.
 */
export const ForcedCountdownOverlay: React.FC = () => {
  const {
    panicCountdown,
    cancelSOS,
    userLocation,
    currentUser,
    silenceAlerts,
    userPin,
    duressPin,
  } = useAppStore();

  const setSilenceAlerts = useAppStore((state) => state.setSilenceAlerts);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const hasConfiguredPin = Boolean(userPin && userPin.trim().length >= 4);

  const requestScreenWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
      }
      if (Capacitor.isNativePlatform()) {
        import('../services/NativeDispatchService')
          .then(({ NativeDispatchService }) => NativeDispatchService.forceUnlockAndWake())
          .catch(() => {});
      }
    } catch (err) {
      console.warn('SafetyLink WakeLock failed:', err);
    }
  };

  const releaseScreenWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const triggerHapticFeedback = async () => {
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        const hapticsModule = await import('@capacitor/haptics');
        await hapticsModule.Haptics.vibrate({ duration: 400 });
      } catch {
        navigator.vibrate?.([200, 100, 200]);
      }
    } else {
      navigator.vibrate?.([200, 100, 200]);
    }
  };

  const startSirenOscillator = () => {
    if (silenceAlerts) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;

      const sweepInterval = setInterval(() => {
        if (!oscillatorRef.current || !audioContextRef.current) {
          clearInterval(sweepInterval);
          return;
        }
        const now = audioContextRef.current.currentTime;
        oscillatorRef.current.frequency.setValueAtTime(440, now);
        oscillatorRef.current.frequency.linearRampToValueAtTime(880, now + 0.4);
        oscillatorRef.current.frequency.linearRampToValueAtTime(440, now + 0.8);
      }, 800);

      return () => clearInterval(sweepInterval);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  const stopSirenOscillator = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    if (panicCountdown !== null) {
      setShowPinPad(hasConfiguredPin);
      setPinInput('');
      setPinError(false);
      requestScreenWakeLock();
      startSirenOscillator();
    } else {
      stopSirenOscillator();
      releaseScreenWakeLock();
      setPinInput('');
      setPinError(false);
    }

    return () => {
      stopSirenOscillator();
      releaseScreenWakeLock();
    };
  }, [panicCountdown, silenceAlerts, hasConfiguredPin]);

  useEffect(() => {
    if (panicCountdown !== null) {
      triggerHapticFeedback();
    }
  }, [panicCountdown]);

  const handleDisarmClick = () => {
    if (hasConfiguredPin) {
      setShowPinPad(true);
    } else {
      cancelSOS();
    }
  };

  const handlePinKey = (digit: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);

    if (next.length === 4) {
      if (next === userPin) {
        cancelSOS();
        useAppStore.getState().addToast('SOS Disarmed cleanly with PIN.', 'info');
      } else if (duressPin && next === duressPin) {
        // Silent Duress Trap: appear disarmed in overlay UI while immediately firing backend + native dispatch silently
        useAppStore.setState({ panicCountdown: null });
        useAppStore.getState().addAuditLog('SECURITY', 'SEVERE', 'DURESS PIN TRIGGERED', 'Appear cancelled to coercive actor while executing silent SOS dispatch.');
        useAppStore.getState().triggerPanic('DURESS PIN ENTERED — Silent Coercion Escalation', true);
      } else {
        setPinError(true);
        navigator.vibrate?.([250, 100, 250]);
        setTimeout(() => {
          setPinInput('');
          setPinError(false);
        }, 550);
      }
    }
  };

  if (panicCountdown === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="forced-countdown-overlay-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-between p-6 text-center select-none overflow-y-auto"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="absolute inset-0 bg-radial-at-c from-red-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 digital-grid opacity-20 pointer-events-none" />

        {/* Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/40 border border-red-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider font-mono">
              Critical SOS Pending
            </span>
          </div>

          <button
            id="forced-overlay-mute-toggle"
            onClick={() => setSilenceAlerts(!silenceAlerts)}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors cursor-pointer"
            title="Mute siren feedback"
          >
            {silenceAlerts ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />
            )}
          </button>
        </div>

        {/* Central Countdown Display */}
        <div className="flex flex-col items-center justify-center gap-4 z-10 my-auto py-3">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/30 filter blur-sm"
            />
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-2 rounded-full bg-red-950/40 border-2 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.25)]"
            />

            <button
              id="forced-disarm-trigger"
              type="button"
              onClick={handleDisarmClick}
              className="absolute inset-5 rounded-full bg-red-650 hover:bg-red-500 border border-red-400/30 flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.4)] cursor-pointer focus:outline-none"
            >
              <span className="text-6xl font-black font-mono leading-none tracking-tight">
                {panicCountdown}
              </span>
              <span className="text-[7.5px] font-mono font-extrabold tracking-[0.15em] text-red-100 mt-1.5 uppercase">
                {hasConfiguredPin ? '🔐 PIN TO DISARM' : '🛑 TAP TO DISARM'}
              </span>
            </button>
          </div>

          <div className="text-center space-y-1 max-w-sm">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide font-mono">
              Emergency Sequence Initiated
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed px-4">
              Broadcasting GPS telemetry & dispatching SMS/Call/Server alerts in{' '}
              <span className="font-mono text-red-400 font-bold">{panicCountdown}s</span>.
            </p>
          </div>

          {/* Unified PIN & Duress PIN Pad when Safety PIN is configured */}
          {showPinPad && hasConfiguredPin && (
            <div className="w-full max-w-xs bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 z-20 shadow-2xl">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 uppercase font-bold text-slate-200">
                  <Lock className="w-3 h-3 text-amber-400" /> Enter 4-Digit Safety PIN
                </span>
                {pinError && <span className="text-red-400 font-bold">INVALID PIN</span>}
              </div>
              <div className={`flex justify-center gap-3 ${pinError ? 'animate-bounce' : ''}`}>
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 ${
                      pinInput.length > idx
                        ? pinError
                          ? 'bg-red-500 border-red-400'
                          : 'bg-emerald-400 border-emerald-400'
                        : 'border-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((key, i) =>
                  key === '' ? (
                    <div key={i} />
                  ) : key === 'DEL' ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPinInput((p) => p.slice(0, -1))}
                      className="h-10 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                    >
                      DEL
                    </button>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePinKey(key)}
                      className="h-10 rounded-lg bg-slate-950 border border-slate-800 text-base font-bold text-white hover:bg-slate-800 active:bg-red-600 cursor-pointer"
                    >
                      {key}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Presets & GPS Bar */}
        <div className="w-full max-w-md space-y-3 z-10 shrink-0">
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest block text-center">
              ⚡ DIRECT PRESET ESCALATION ROUTES
            </span>

            <div className="grid grid-cols-1 gap-1.5 text-left max-h-[160px] overflow-y-auto pr-1">
              {(
                currentUser?.customPresets || [
                  { id: 'preset-hijack', name: 'Car Accident / Hijacked', icon: '🚗', route: 'Default Routing' },
                  { id: 'preset-security', name: 'Security / Command Room Link', icon: '🏢', route: 'Control Room' },
                  { id: 'preset-medical', name: 'Medical / Trauma Emergency', icon: '🩺', route: 'Medical Dispatch' },
                ]
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  id={preset.id}
                  onClick={() => {
                    cancelSOS();
                    useAppStore
                      .getState()
                      .addAuditLog('DISPATCH', 'SEVERE', 'Preset Triggered: ' + preset.name, `Immediate route to ${preset.route} initiated.`);
                    useAppStore.getState().triggerPanic(`${preset.name}: Emergency routing to ${preset.route}`, true);
                  }}
                  className="p-2 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-left transition-all hover:border-slate-500/40 group cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-[10px] font-extrabold text-slate-300 font-mono">
                      {preset.icon} {preset.name}
                    </div>
                    <div className="text-[8px] font-mono text-slate-500 truncate">Route: {preset.route}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-slate-900/85 border border-slate-800 rounded-xl space-y-0.5">
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>GIS GPS Telemetry</span>
              <span className="text-amber-400 animate-pulse font-bold">Armed & Polling</span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 font-mono flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>
                {userLocation ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}` : 'Acquiring high-precision lock...'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[9px] text-slate-500 justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-sans leading-normal">Hardware Lock-Screen Wake & Native PanicService Sync Active.</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
