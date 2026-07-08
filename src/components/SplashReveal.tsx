import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import logoTransparent from './assets/logo_transparent.png';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'black' | 'pulse' | 'assemble' | 'emblem' | 'grid' | 'zoom'>('black');
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // High-fidelity Speech Synthesis boot check
  const speakStatus = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const text = "Safety-Link Online. GPS online. Bluetooth online. Mesh online. Emergency Services Ready.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        utterance.volume = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural')));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error or blocked by browser gesture permissions:", e);
      }
    }
  };

  useEffect(() => {
    // 4.0 seconds total cinematic flow:
    // 0ms: Black screen
    // 400ms: Soft blue light appears, digital grid forms (pulse stage)
    // 1000ms: Safety-Link logo assembles with metallic reflection (assemble stage)
    // 1800ms: Safety-Link emblem forms & AI Voice Trigger (emblem stage)
    // 2800ms: System boot logs feed on-screen (grid stage)
    // 3500ms: Cinematic camera zoom-out (zoom stage)
    // 4000ms: Complete and transition to dashboard

    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setBootLogs(prev => [...prev, msg]);
      }, delay);
    };

    const t1 = setTimeout(() => {
      setStage('pulse');
    }, 400);

    const t2 = setTimeout(() => {
      setStage('assemble');
    }, 1000);

    const t3 = setTimeout(() => {
      setStage('emblem');
      speakStatus();
    }, 1800);

    const t4 = setTimeout(() => {
      setStage('grid');
    }, 2850);

    // Feed on-screen military-style diagnostics ticker
    addLog("⚡ INITIALIZING SECURE HARDWARE STACK...", 500);
    addLog("📡 SATELLITE COCKPIT LINK: ACTIVE", 1100);
    addLog("🔑 SAFETYLINK ACTIVE CONNECTION KEEPALIVE: ONLINE", 1700);
    addLog("📟 BLE PORT SUBSCRIPTION [0xFFE0]: RUNNING", 2300);
    addLog("🚨 ESCALATION CHAIN MATRIX: ARMED", 2950);
    addLog("🌐 SAFETYLINK CORE COOPERATIVE: ONLINE", 3300);

    const t5 = setTimeout(() => {
      setStage('zoom');
    }, 3500);

    const t6 = setTimeout(() => {
      onCompleteRef.current();
    }, 4000);

    // Pre-trigger voice listings
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  // Glass shards starting coordinates & rotation
  const shards = [
    { x: -180, y: -180, r: -45, delay: 0 },
    { x: 180, y: -180, r: 45, delay: 0.04 },
    { x: -180, y: 180, r: -135, delay: 0.06 },
    { x: 180, y: 180, r: 135, delay: 0.02 },
    { x: 0, y: -220, r: 180, delay: 0.05 },
    { x: 0, y: 220, r: 0, delay: 0.01 },
    { x: -220, y: 0, r: 90, delay: 0.07 },
    { x: 220, y: 0, r: -90, delay: 0.03 },
  ];

  return (
    <div id="splash-reveal-container" className="fixed inset-0 bg-[#07090e] text-white flex flex-col items-center justify-center z-[99999] overflow-hidden select-none">
      
      {/* SVG Color Mask Filter to dynamically strip white background from logo.png */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="remove-white-bg" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                -2 -2 -2 3 -0.1
              "
            />
          </filter>
        </defs>
      </svg>

      {/* Cinematic Ambient Blue Backlight */}
      <AnimatePresence>
        {stage !== 'black' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: stage === 'zoom' ? 0 : 0.8, scale: stage === 'zoom' ? 1.6 : 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,rgba(59,130,246,0.16)_50%,transparent_100%)] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Grid Pattern and HUD crosshairs */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-96 h-[1px] bg-blue-500 absolute" />
        <div className="h-96 w-[1px] bg-blue-500 absolute" />
        <div className="w-80 h-80 rounded-full border border-blue-400 absolute animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* Diagnostic Ticker Logs overlay */}
      <div className="absolute bottom-10 left-8 right-8 max-w-sm font-mono text-[7.5px] text-slate-500 text-left space-y-1 pointer-events-none z-50">
        <AnimatePresence>
          {bootLogs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <span className="text-emerald-500 font-extrabold">●</span>
              <span className="font-semibold text-slate-400 tracking-wider">{log}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Camera zoom applied to emblem container */}
      <motion.div
        animate={{
          scale: stage === 'zoom' ? 1.08 : 1.0,
          opacity: stage === 'zoom' ? 0 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="relative flex items-center justify-center w-80 h-80"
      >
        
        {/* Dynamic Pulse Wavefronts */}
        <AnimatePresence>
          {['pulse', 'assemble'].includes(stage) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.2, opacity: 1, border: '4px solid rgba(59, 130, 246, 0.7)' }}
                animate={{ scale: 3.2, opacity: 0, border: '1px solid rgba(59, 130, 246, 0.0)' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.25)]"
              />
              <motion.div
                initial={{ scale: 0.2, opacity: 0.8, border: '2px dashed rgba(16, 185, 129, 0.7)' }}
                animate={{ scale: 3.8, opacity: 0, border: '1px dashed rgba(16, 185, 129, 0.0)' }}
                transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full"
              />
            </div>
          )}
        </AnimatePresence>

        {/* Cinematic Shards assembling */}
        <AnimatePresence>
          {['pulse', 'assemble'].includes(stage) && (
            <div className="absolute inset-0 flex items-center justify-center">
              {shards.map((sh, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: sh.x, y: sh.y, rotate: sh.r, opacity: 0, scale: 0.2 }}
                  animate={{ x: 0, y: 0, rotate: 0, opacity: 0.9, scale: 1 }}
                  exit={{ scale: 1.15, opacity: 0, filter: 'blur(6px)' }}
                  transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 15,
                    delay: sh.delay,
                  }}
                  className="absolute w-14 h-14 bg-slate-900/40 border border-slate-800 rounded-xl backdrop-blur-lg shadow-2xl"
                  style={{
                    clipPath: idx % 2 === 0 
                      ? 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' 
                      : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Premium metal SafetyLink Emblem forming */}
        <AnimatePresence>
          {['emblem', 'grid', 'zoom'].includes(stage) && (
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{
                type: 'spring',
                stiffness: 110,
                damping: 12,
              }}
              className="relative p-8 rounded-full bg-slate-950/60 border border-slate-800 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_60px_rgba(59,130,246,0.2)] flex items-center justify-center overflow-hidden"
            >
              {/* Metallic sheen sweep */}
              <motion.div
                animate={{
                  x: ['-150%', '250%'],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
              />

              <div className="relative w-32 h-32 flex items-center justify-center">
                <img
                  src={logoTransparent}
                  alt="SafetyLink"
                  style={{ filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.45))' }}
                  className="w-28 h-28 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = logoTransparent;
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
