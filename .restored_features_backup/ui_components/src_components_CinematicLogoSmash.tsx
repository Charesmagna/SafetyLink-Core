import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import slLogoMain from '../assets/safetylink-metallic.svg';

interface CinematicLogoSmashProps {
  onAnimationEnd?: () => void;
  size?: number;
}

export const CinematicLogoSmash: React.FC<CinematicLogoSmashProps> = ({ 
  onAnimationEnd, 
  size = 180 
}) => {
  // Stages: 'vault' | 'transport' | 'smash' | 'final'
  const [stage, setStage] = useState<'vault' | 'transport' | 'smash' | 'final'>('vault');
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number; r: number; scale: number; speed: number; angle: number }>>([]);

  useEffect(() => {
    // Stage 1: Vault is spinning
    // Stage 2: Vault starts transforming / transporting at 1.5s
    const t1 = setTimeout(() => {
      setStage('transport');
    }, 1500);

    // Stage 3: Smash on shield at 2.8s
    const t2 = setTimeout(() => {
      setStage('smash');
      triggerSparks();
    }, 2800);

    // Stage 4: Settling to final assembled slow zoom at 3.5s
    const t3 = setTimeout(() => {
      setStage('final');
      if (onAnimationEnd) onAnimationEnd();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const triggerSparks = () => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 200;
      arr.push({
        id: i,
        x: 0,
        y: 0,
        r: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.4,
        speed: speed,
        angle: angle
      });
    }
    setSparks(arr);
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none overflow-hidden" style={{ width: size * 1.5, height: size * 1.5 }}>
      {/* SVG filter for removing white background */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="remove-white-bg-smash" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                -3 -3 -3 4.5 -0.15
              "
            />
          </filter>
        </defs>
      </svg>

      {/* Sparks emitter layer */}
      <AnimatePresence>
        {stage === 'smash' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {sparks.map((sp) => (
              <motion.div
                key={sp.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: sp.scale }}
                animate={{ 
                  x: Math.cos(sp.angle) * sp.speed, 
                  y: Math.sin(sp.angle) * sp.speed - 30, // Gravity pull downwards
                  opacity: 0,
                  scale: 0.1 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: sp.id % 2 === 0 
                    ? 'radial-gradient(circle, #fbbf24 0%, rgba(251,191,36,0) 70%)' 
                    : 'radial-gradient(circle, #34d399 0%, rgba(52,211,153,0) 70%)',
                  boxShadow: '0 0 8px #fbbf24'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic Stages */}
      <div className="relative flex items-center justify-center w-full h-full">
        
        {/* STAGE 1: The 3D Vault */}
        {stage === 'vault' && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateX: 45, rotateY: -45 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotateX: [45, 15, 30], 
              rotateY: [-45, 45, -15],
              rotateZ: [0, 10, 0]
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-28 h-28 bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-slate-700 rounded-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.3)] z-10"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Vault Wheel Details */}
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-500 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
              <div className="w-8 h-8 rounded-full border-4 border-slate-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              </div>
            </div>
            {/* Front Label */}
            <div className="absolute bottom-2 text-[7.5px] font-mono text-slate-500 font-bold tracking-widest uppercase">
              SL-VAULT
            </div>
          </motion.div>
        )}

        {/* STAGE 2: The Chain Transport */}
        {stage === 'transport' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Dematerializing Vault beam */}
            <motion.div 
              initial={{ height: 10, opacity: 0 }}
              animate={{ height: [10, 140, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
              className="absolute w-40 bg-gradient-to-t from-blue-500/20 via-emerald-500/40 to-transparent blur-md rounded-full"
            />
            
            {/* Cascading chain link links */}
            <motion.div
              initial={{ y: -180, scale: 0.5, opacity: 0 }}
              animate={{ y: 0, scale: 1.2, opacity: [0, 1, 1, 0.8] }}
              transition={{ duration: 1.2, ease: "easeIn" }}
              className="flex flex-col items-center justify-center z-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]"
            >
              {/* Green chain links coming down rapidly */}
              <svg className="w-16 h-16 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-[7.5px] font-mono text-emerald-300 font-bold uppercase tracking-widest mt-2 animate-pulse">
                MESH LINKING...
              </span>
            </motion.div>
          </div>
        )}

        {/* STAGE 3: The Smash on Shield */}
        {stage === 'smash' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Shield outline shockwave */}
            <motion.div
              initial={{ scale: 0.1, opacity: 1, border: '4px solid #ef4444' }}
              animate={{ scale: 2.2, opacity: 0, border: '1px solid rgba(239,68,68,0)' }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-32 h-32 rounded-full z-0 bg-red-500/10"
            />

            {/* Glowing Shield receiving smash */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 50 }}
              animate={{ scale: 1.0, opacity: 1, y: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 260, 
                damping: 14, 
                mass: 0.8
              }}
              className="z-10 text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.9)]"
            >
              <svg className="w-24 h-24 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </motion.div>
          </div>
        )}

        {/* STAGE 4: Slow Motion Zoom Out & Final Assembled Logo */}
        {stage === 'final' && (
          <motion.div
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1.0, opacity: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} // Elegant slow zoom out
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Glowing rings */}
            <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 blur-xl animate-pulse pointer-events-none" />
            
            {/* Official Brand Logo */}
            <div className="relative w-44 h-44 flex items-center justify-center p-2">
              <img
                src={slLogoMain}
                alt="SafetyLink"
                className="w-full h-full object-contain rounded-xl"
                style={{ filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.7))' }}
              />
            </div>
            
            <span className="text-[10px] font-black tracking-[0.25em] text-slate-100 uppercase font-mono mt-1">
              SAFETY LINK
            </span>
            <span className="text-[6.5px] font-bold text-slate-500 font-mono tracking-widest uppercase mt-0.5">
              POWERED BY TM MEDIA SOLUTIONS
            </span>
          </motion.div>
        )}

      </div>
    </div>
  );
};
