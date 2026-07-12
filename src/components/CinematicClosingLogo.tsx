import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';

interface CinematicClosingLogoProps {
  onComplete: () => void;
}

export const CinematicClosingLogo: React.FC<CinematicClosingLogoProps> = ({
  onComplete
}) => {
  // Stages: 'lock_start' | 'securing' | 'locked'
  const [stage, setStage] = useState<'lock_start' | 'securing' | 'locked'>('lock_start');

  useEffect(() => {
    // Stage 1: Lock starts, rings begin spinning rapidly
    const t1 = setTimeout(() => {
      setStage('securing');
      // Play a high-quality secure/lock beep sound if possible
      playLockBeep();
    }, 600);

    // Stage 2: Locked down complete at 1.8s
    const t2 = setTimeout(() => {
      setStage('locked');
    }, 1800);

    // Complete and minimize at 2.4s
    const t3 = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const playLockBeep = () => {
    if (typeof window !== 'undefined' && (window as any).AudioContext || (window as any).webkitAudioContext) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        
        // Sequence of two quick, secure tones
        const playTone = (freq: number, time: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          
          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(time);
          osc.stop(time + duration);
        };

        const now = ctx.currentTime;
        playTone(520, now, 0.12);
        playTone(390, now + 0.1, 0.18);
      } catch (e) {
        console.warn('Audio feedback failed:', e);
      }
    }
  };

  return (
    <div id="closing-logo-container" className="fixed inset-0 bg-[#07090e]/95 backdrop-blur-xl text-white flex flex-col items-center justify-center z-[99999] overflow-hidden select-none">
      
      {/* Grid Pattern and HUD crosshairs contracting */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 animate-pulse" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <motion.div 
          animate={{ scale: [1, 0.4, 0], opacity: [0.3, 0.1, 0] }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
          className="w-96 h-[1px] bg-red-500 absolute" 
        />
        <motion.div 
          animate={{ scale: [1, 0.4, 0], opacity: [0.3, 0.1, 0] }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
          className="h-96 w-[1px] bg-red-500 absolute" 
        />
        <motion.div 
          animate={{ scale: [1.2, 0.8, 0], opacity: [0.4, 0.2, 0] }}
          transition={{ duration: 1.8, ease: "easeIn" }}
          className="w-80 h-80 rounded-full border border-blue-400 absolute" 
        />
      </div>

      <motion.div
        animate={{
          scale: stage === 'locked' ? 0.3 : 1.0,
          opacity: stage === 'locked' ? 0 : 1,
          rotateZ: stage === 'securing' ? -15 : 0
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="relative flex flex-col items-center justify-center"
      >
        {/* Glowing rings contracting */}
        <div className="absolute w-48 h-48 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />

        {/* Outer 3D Vault Lock circle */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          
          {/* Animated mechanical crosshair brackets */}
          <motion.div 
            animate={{ 
              rotate: stage === 'securing' ? -180 : 0,
              scale: stage === 'securing' ? 0.85 : 1.0
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full flex items-center justify-center"
          >
            <div className="w-48 h-48 border border-slate-700/40 rounded-full" />
          </motion.div>

          <motion.div 
            animate={{ 
              rotate: stage === 'securing' ? 180 : 0,
              scale: stage === 'securing' ? 0.9 : 1.0
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute w-44 h-44 border border-dashed border-emerald-500/25 rounded-full" 
          />

          {/* Secure lock icon indicator overlay */}
          <AnimatePresence>
            {stage === 'securing' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] z-30"
              >
                <svg className="w-12 h-12 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Centered SafetyLink logo using the master transparent color matrix */}
          <motion.div
            animate={{
              scale: stage === 'securing' ? 0.75 : 1.0,
              opacity: stage === 'securing' ? 0.15 : 1.0,
              filter: stage === 'securing' 
                ? 'blur(4px) brightness(0.5)' 
                : 'blur(0px) brightness(1.0)'
            }}
            transition={{ duration: 0.8 }}
            className="z-10 flex items-center justify-center p-4 w-64 h-64"
          >
            <SafetyLinkLogo size={180} />
          </motion.div>
        </div>

        {/* Text descriptions */}
        <motion.div 
          animate={{ opacity: stage === 'locked' ? 0 : 1 }}
          className="text-center mt-6 space-y-1 z-10"
        >
          <span className="text-[10px] font-black tracking-[0.25em] text-slate-100 uppercase font-mono block">
            {stage === 'securing' ? 'SECURING CONSOLE...' : 'SAFETY LINK'}
          </span>
          <span className="text-[7px] font-bold text-slate-500 font-mono tracking-widest uppercase block">
            {stage === 'securing' ? 'PINNING PERSISTENT BACKGROUND LISTENERS' : 'POWERED BY TM MEDIA SOLUTIONS'}
          </span>
        </motion.div>
      </motion.div>

    </div>
  );
};
