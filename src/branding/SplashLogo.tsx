import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

const logoPolish = '/media/polish-logo.jpg';

interface SplashLogoProps {
  onComplete: () => void;
}

/**
 * SafetyLink Cinematic Premium Launch Sequence.
 * Features:
 * - Deep dark tactical space background with an industrial grid system.
 * - Soft green ambient glow & volumetric radial lighting behind the official logo.
 * - Gentle drifting particle field representing active safety-mesh sensor nodes.
 * - Bold, military-grade monospaced typography with pristine tracking.
 * - Smooth fade-in, hold, subtle heartbeat pulse, and elegant fade-out transitions.
 * - Complete absence of cheap spinners, flat 3D effects, or raw CSS color matrices.
 */
export const SplashLogo: React.FC<SplashLogoProps> = ({ onComplete }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate a subtle tactical particle field representing safety-mesh network nodes
    const generatedParticles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x
      y: Math.random() * 100, // percentage y
      size: Math.random() * 2 + 1, // 1px to 3px
      delay: Math.random() * 1.5
    }));
    setParticles(generatedParticles);

    // Timing sequence: 2.7s total duration
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      id="cinematic-splash-launchpad" 
      className="fixed inset-0 bg-[#040609] flex flex-col items-center justify-center z-[999999] overflow-hidden select-none"
    >
      {/* 1. Subtle industrial cross-grid overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50"
      />

      {/* 2. Soft volumetric green ambient lighting */}
      <div 
        className="absolute w-[450px] h-[450px] rounded-full bg-emerald-950/15 blur-[120px] pointer-events-none mix-blend-screen"
        style={{ transform: 'translate3d(0,0,0)' }}
      />
      <div 
        className="absolute w-[180px] h-[180px] rounded-full bg-emerald-500/5 blur-[60px] pointer-events-none mix-blend-screen"
        style={{ transform: 'translate3d(0,0,0)' }}
      />

      {/* 3. Drifting sensor particle field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: `${p.y}%` }}
            animate={{ 
              opacity: [0, 0.4, 0.4, 0],
              y: [`${p.y}%`, `${p.y - 12}%`],
            }}
            transition={{
              duration: 2.8,
              delay: p.delay,
              ease: "easeInOut",
              repeat: 0
            }}
            className="absolute rounded-full bg-emerald-400"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      {/* 4. Core Branding Container with Staggered Entrance & Pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: [0, 1, 1, 1, 0],
          scale: [0.95, 1, 1.02, 1, 0.96]
        }}
        transition={{
          duration: 2.8,
          times: [0, 0.25, 0.5, 0.85, 1],
          ease: "easeInOut"
        }}
        className="relative flex flex-col items-center justify-center gap-8"
      >
        {/* Vector Logo Holder */}
        <div className="relative flex items-center justify-center w-64 h-64">
          {/* Subtle concentric shockwave pulsing ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.6, opacity: [0, 0.2, 0] }}
            transition={{
              duration: 2.0,
              delay: 0.4,
              ease: "easeOut"
            }}
            className="absolute inset-0 rounded-full border border-emerald-500/20"
          />

          {/* Clean Master Brand Icon Image */}
          <img 
            src={logoPolish} 
            alt="SafetyLink Official Logo" 
            className="w-48 h-48 object-contain transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Tactical Monospaced Typography */}
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, letterSpacing: "0.15em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="text-base font-black text-slate-100 uppercase font-mono tracking-[0.3em]"
          >
            SAFETY LINK
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.6 }}
            className="text-[7.5px] font-bold text-slate-500 font-mono tracking-[0.25em] uppercase"
          >
            POWERED BY TM MEDIA SOLUTIONS
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};
