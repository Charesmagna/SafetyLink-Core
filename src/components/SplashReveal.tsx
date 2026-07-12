import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // 1. Solid presentation for 1.4 seconds
    const exitTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1400);

    // 2. Smoothly complete after fade-out transition concludes (400ms duration)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Immediate skip on click/tap for a high-efficiency user flow
  const handleSkip = () => {
    onComplete();
  };

  return (
    <div 
      id="splash-reveal-container" 
      onClick={handleSkip}
      className={`fixed inset-0 bg-[#06080c] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Premium subtle cybernetic grid backplate */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0" />
      
      {/* Background radial ambient glow with safety green / emerald hues */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,rgba(6,8,12,0.98)_100%)] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Centered Logo presentation stage */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1.0, opacity: 1 }}
        transition={{
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1], // Custom cinematic cubic-bezier ease
        }}
        className="relative flex flex-col items-center justify-center z-10 p-12 rounded-[2rem] bg-slate-950/60 border border-slate-900/40 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(16,185,129,0.05)]"
      >
        {/* Sweeping metallic light sheen reflection effect */}
        <motion.div
          animate={{ x: ['-150%', '250%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1.0,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none z-20"
        />

        {/* Scalable Vector high-fidelity Logo styled to match attached specifications */}
        <SafetyLinkLogo size={160} showText={true} />

        {/* Elegant, humble, POPIA-compliant platform tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.65, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 flex flex-col items-center gap-1 font-mono text-[9px] text-slate-400 tracking-[0.25em] uppercase font-bold"
        >
          <span>SEQUENTIAL EMERGENCY NETWORK</span>
          <span className="text-[7px] text-emerald-400/80 tracking-widest mt-0.5">● OFFLINE SECURE CONNECTED</span>
        </motion.div>
      </motion.div>

      {/* Tiny skip hint in corner */}
      <div className="absolute bottom-6 right-6 font-mono text-[8px] text-slate-600 tracking-widest uppercase">
        Tap to Skip
      </div>
    </div>
  );
};
