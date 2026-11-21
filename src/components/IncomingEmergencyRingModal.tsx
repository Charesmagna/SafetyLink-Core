import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';

export const IncomingEmergencyRingModal: React.FC = () => {
  const { incomingEmergencyRing, dismissIncomingEmergencyRing, addAuditLog } = useAppStore();
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!incomingEmergencyRing) {
      setIsMuted(false);
      return;
    }

    const playRingPulse = () => {
      if (isMuted) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        // Dual-tone high-urgency emergency ring burst (0.9s)
        const tones = [
          { freq: 960, start: 0, dur: 0.22 },
          { freq: 1280, start: 0.24, dur: 0.22 },
          { freq: 960, start: 0.48, dur: 0.22 },
          { freq: 1280, start: 0.72, dur: 0.22 },
        ];
        tones.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.32, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);
        });
      } catch {
        // Browser may block autoplay before gesture; vibration still fires
      }

      try {
        if (navigator.vibrate) {
          navigator.vibrate([450, 200, 450, 200, 700]);
        }
      } catch {}
    };

    playRingPulse();
    intervalRef.current = window.setInterval(playRingPulse, 1750);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      try {
        if (navigator.vibrate) navigator.vibrate(0);
      } catch {}
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
        }
      } catch {}
    };
  }, [incomingEmergencyRing, isMuted]);

  const handleAcknowledge = () => {
    if (incomingEmergencyRing) {
      addAuditLog(
        'DISPATCH',
        'INFO',
        `Acknowledged Emergency Ring from ${incomingEmergencyRing.callerName}`,
        `Source: ${incomingEmergencyRing.source} • Location: ${incomingEmergencyRing.location}`
      );
    }
    dismissIncomingEmergencyRing();
  };

  const handleOpenMap = () => {
    if (!incomingEmergencyRing) return;
    if (typeof incomingEmergencyRing.lat === 'number' && typeof incomingEmergencyRing.lng === 'number') {
      const url = `https://maps.google.com/?q=${incomingEmergencyRing.lat},${incomingEmergencyRing.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'map' }));
    }
    dismissIncomingEmergencyRing();
  };

  return (
    <AnimatePresence>
      {incomingEmergencyRing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-5 text-white"
          data-testid="incoming-emergency-ring-modal"
        >
          {/* Pulsing perimeter rings */}
          <div className="relative flex flex-col items-center max-w-sm w-full bg-slate-950/90 border-2 border-red-500 rounded-3xl p-6 shadow-[0_0_90px_rgba(239,68,68,0.55)] text-center space-y-5">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-24 h-24 rounded-full bg-red-500/30 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-red-600 border-4 border-red-300 flex items-center justify-center text-3xl shadow-xl">
                🚨
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-[10px] font-mono font-black uppercase tracking-widest animate-pulse">
                INCOMING EMERGENCY RING • {incomingEmergencyRing.source}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white pt-1">
                {incomingEmergencyRing.callerName}
              </h2>
              {incomingEmergencyRing.callerNumber && (
                <p className="text-sm font-mono text-red-200 font-bold">
                  {incomingEmergencyRing.callerNumber}
                </p>
              )}
            </div>

            <div className="w-full bg-red-950/50 border border-red-500/30 rounded-2xl p-3.5 text-left space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-red-300 uppercase font-bold tracking-wider">
                Distress Location
              </div>
              <div className="text-slate-100 font-bold break-words">
                {incomingEmergencyRing.location || 'Live GPS coordinates transmitted'}
              </div>
              {typeof incomingEmergencyRing.lat === 'number' && typeof incomingEmergencyRing.lng === 'number' && (
                <div className="text-[10px] text-amber-300">
                  GPS: {incomingEmergencyRing.lat.toFixed(5)}, {incomingEmergencyRing.lng.toFixed(5)}
                </div>
              )}
              <div className="text-[10px] text-slate-400">
                Received at {new Date(incomingEmergencyRing.timestamp).toLocaleTimeString()}
              </div>
            </div>

            <div className="w-full space-y-2.5">
              {incomingEmergencyRing.callerNumber && (
                <a
                  href={`tel:${incomingEmergencyRing.callerNumber}`}
                  onClick={handleAcknowledge}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <span>📞</span>
                  <span>Call {incomingEmergencyRing.callerName.split(' ')[0]} Now</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenMap}
                  className="py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-mono font-bold text-[11px] uppercase tracking-wider transition-colors"
                >
                  🗺️ Open GPS
                </button>
                <button
                  type="button"
                  onClick={() => setIsMuted(m => !m)}
                  className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono font-bold text-[11px] uppercase tracking-wider transition-colors"
                >
                  {isMuted ? '🔊 Unmute' : '🔇 Mute Ring'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleAcknowledge}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 border border-red-400/40 text-white font-mono font-black text-xs uppercase tracking-widest transition-colors"
              >
                ✓ Acknowledge &amp; Silence Alarm
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
