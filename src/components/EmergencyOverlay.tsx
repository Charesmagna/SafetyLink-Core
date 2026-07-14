import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { ShieldAlert, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export const EmergencyOverlay: React.FC = () => {
  const { activeSOSState, cancelSOS, triggerPanic, userLocation } = useAppStore();
  
  const [countdown, setCountdown] = useState<number>(5);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [wakeLock, setWakeLock] = useState<any>(null);
  
  const countdownTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // 1. Android 15 & API 35 Screen Unlock / Keep Awake Triggers
  const requestScreenWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('SafetyLink WakeLock: Screen pinned successfully.');
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

  // 2. Continuous Haptics & Vibration Triggers (Capacitor Native vs. Web fallback)
  const triggerHapticFeedback = async () => {
    if (Capacitor.isPluginAvailable('Haptics')) {
      try {
        const hapticsModule = await import('@capacitor/haptics');
        await hapticsModule.Haptics.vibrate({ duration: 400 });
      } catch (err) {
        navigator.vibrate?.([200, 100, 200]);
      }
    } else {
      navigator.vibrate?.([200, 100, 200]);
    }
  };

  // 3. Audio Alarm Synthesizer (Siren pitch oscillations)
  const startSirenOscillator = () => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      // Siren pitch modulation
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 1.0);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      oscillatorRef.current = osc;

      // Periodically sweep frequency to simulate a real emergency vehicle siren
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
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // 4. Initialization & State Synchronization Loop
  useEffect(() => {
    if (activeSOSState === 'ACQUIRING_GPS') {
      // Trigger instant WakeLock and begin 5-second countdown sequence
      requestScreenWakeLock();
      setCountdown(5);
      triggerHapticFeedback();
      startSirenOscillator();

      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            // Trigger actual critical distress protocol on countdown expiration
            triggerPanic("SafetyLink high-priority countdown expired. Automatic dispatch triggered.");
            return 0;
          }
          triggerHapticFeedback();
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear all bindings if the SOS process is canceled or resolved
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      stopSirenOscillator();
      releaseScreenWakeLock();
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      stopSirenOscillator();
      releaseScreenWakeLock();
    };
  }, [activeSOSState, isAudioMuted]);

  if (activeSOSState !== 'ACQUIRING_GPS') return null;

  return (
    <AnimatePresence>
      <div 
        id="emergency-overlay-container"
        className="fixed inset-0 z-[20000] flex flex-col items-center justify-between p-6 bg-slate-950/95 backdrop-blur-xl font-mono text-white select-none"
      >
        {/* Subtle Background Glow Elements */}
        <div className="absolute inset-0 bg-radial-at-c from-red-600/15 via-transparent to-transparent pointer-events-none" />
        
        {/* Header Indicator Deck */}
        <div className="w-full max-w-md flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/40 border border-red-500/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Critical SOS Pending</span>
          </div>
          
          <button
            id="emergency-mute-toggle"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-full transition-colors cursor-pointer"
            title="Mute siren feedback"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />}
          </button>
        </div>

        {/* Central Display: Countdown Circle */}
        <div className="flex flex-col items-center justify-center gap-6 z-10 my-auto">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Countdown Animated SVG Circle */}
            <svg className="absolute w-44 h-44 countdown-circle-svg" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-800 fill-none stroke-[6]"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-red-500 fill-none stroke-[6] countdown-circle-bar"
              />
            </svg>
            
            {/* Centered Large Digits */}
            <motion.div 
              key={countdown}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-extrabold text-red-500 font-mono tracking-tight select-none z-10"
            >
              {countdown}
            </motion.div>
          </div>

          <div className="text-center space-y-2 max-w-sm">
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">Emergency Trigger Active</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans px-4">
              Sending real-time telemetry, GPS coordinates, and initiating automatic sequence dispatcher in <span className="font-mono text-red-400 font-bold">{countdown}s</span>.
            </p>
          </div>
        </div>

        {/* Telemetry and Action Controls Deck */}
        <div className="w-full max-w-md space-y-5 z-10">
          {/* Real-time coordinates */}
          <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>GIS GPS Satellites</span>
              <span className="text-amber-400">Armed & Polling</span>
            </div>
            <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>
                {userLocation ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}` : 'Acquiring high-precision lock...'}
              </span>
            </div>
          </div>

          {/* Large Tactile Disarm Button (48px Touch target compatible) */}
          <button
            id="emergency-cancel-trigger"
            onClick={() => {
              cancelSOS();
              useAppStore.getState().addToast("Tactical safety sequence disarmed.", "success");
              useAppStore.getState().addAuditLog('SECURITY', 'INFO', 'Emergency Manually Disarmed', 'Operator tapped disarm button on overlay.');
            }}
            className="w-full py-4.5 bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-2xl transition-all active:scale-[0.97]"
          >
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span>TAP TO DISARM DISPATCH</span>
          </button>

          {/* Warning Footer info */}
          <div className="flex items-start gap-2 text-[9px] text-slate-500 leading-normal font-sans text-center justify-center">
            <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Android 15 (API 35) Boot Lock & Keyguard Overlay active. System SMS priority.</span>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
