import React from 'react';
import { motion } from 'motion/react';

export const GlowingHeartBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 bg-[#020204] overflow-hidden select-none pointer-events-none">
      {/* 3D Dark Hall Corridor Perspective */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020204] via-[#05060b] to-[#010102]" />
      
      {/* Perspective Grid Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden opacity-20">
        <div 
          className="w-[200%] h-[200%] -left-1/2 absolute border-t border-slate-800"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(75deg) translateY(-50px)',
            transformOrigin: 'top center',
          }}
        />
      </div>

      {/* Corridor Wall structural lines (Depth perspective) */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black via-transparent to-transparent opacity-60">
        <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0" />
        <div className="absolute left-24 top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0" />
      </div>
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black via-transparent to-transparent opacity-60">
        <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0" />
        <div className="absolute right-24 top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0" />
      </div>

      {/* Halogen Lights on Hall Ceiling */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-20 opacity-30">
        <div className="w-4 h-1 bg-red-500/50 rounded-full blur-[2px]" />
        <div className="w-4 h-1 bg-blue-500/50 rounded-full blur-[2px]" />
        <div className="w-4 h-1 bg-emerald-500/50 rounded-full blur-[2px]" />
      </div>

      {/* Floating dust particles */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: Math.random() * 100 + '%', 
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.2 + 0.1 
            }}
            animate={{ 
              y: ['0%', '-30%', '0%'],
              x: ['0%', '10%', '0%'],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 8 + Math.random() * 10, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: Math.random() * 5
            }}
            className="absolute w-1.5 h-1.5 rounded-full bg-red-500/40 blur-[1px]"
          />
        ))}
      </div>

      {/* ECG Heartbeat Pulse Line - Looped Perfectly */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <svg className="w-full h-48 text-emerald-500/40" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ecg-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(16,185,129,0)" />
              <stop offset="50%" stopColor="rgba(16,185,129,1)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 0 100 L 250 100 L 270 60 L 290 140 L 310 100 L 450 100 L 470 120 L 490 20 L 510 180 L 530 100 L 550 110 L 570 100 L 750 100 L 770 70 L 790 130 L 810 100 L 1000 100"
            fill="none"
            stroke="url(#ecg-glow)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ strokeDasharray: 1200, strokeDashoffset: 1200 }}
            animate={{ strokeDashoffset: [1200, -1200] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </svg>
      </div>

      {/* Centered Glowing 3D realistic heart */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Soft Radial Ambient Backlight for the heart */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1.05, 1.25, 1],
            opacity: [0.6, 0.9, 0.7, 1.0, 0.6],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.15, 0.25, 0.45, 1]
          }}
          className="absolute w-80 h-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.25)_0%,rgba(239,68,68,0.06)_45%,transparent_70%)] blur-2xl"
        />

        {/* Realistic SVG 3D Heart with shadows and reflection mappings */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1.05, 1.22, 1],
            rotate: [0, -1, 1, -1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
            times: [0, 0.15, 0.25, 0.45, 1]
          }}
          className="relative w-48 h-48 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)] flex items-center justify-center"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}
          >
            <defs>
              {/* 3D Gradient for Heart Chamber */}
              <radialGradient id="heart3d" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="35%" stopColor="#e60000" />
                <stop offset="70%" stopColor="#990000" />
                <stop offset="100%" stopColor="#4a0000" />
              </radialGradient>

              {/* 3D Gradient for Aorta and Arteries */}
              <linearGradient id="arteryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6666" />
                <stop offset="50%" stopColor="#b30000" />
                <stop offset="100%" stopColor="#330000" />
              </linearGradient>

              {/* 3D Gradient for Pulmonary Blue Artery */}
              <linearGradient id="pulmonaryBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>

              {/* Inner shadow/specular highlights mask */}
              <filter id="specular-highlight">
                <feSpecularLighting result="specOut" specularExponent="20" lightingColor="#ffffff">
                  <fePointLight x="40" y="30" z="80" />
                </feSpecularLighting>
                <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
              </filter>
            </defs>

            {/* Pulmonary Artery (Blue Node) */}
            <path
              d="M 46,24 C 44,14 55,14 53,24 Z"
              fill="url(#pulmonaryBlue)"
              stroke="#1e3a8a"
              strokeWidth="0.5"
            />
            <path
              d="M 52,24 C 50,15 59,16 57,25 Z"
              fill="url(#pulmonaryBlue)"
              stroke="#1e3a8a"
              strokeWidth="0.5"
            />

            {/* Aorta Arch (Red Main Tube) */}
            <path
              d="M 38,28 C 34,10 52,8 50,22"
              fill="none"
              stroke="url(#arteryGlow)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 42,12 L 42,6"
              fill="none"
              stroke="url(#arteryGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 47,13 L 49,7"
              fill="none"
              stroke="url(#arteryGlow)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Vena Cava (Right tube) */}
            <path
              d="M 64,28 C 64,18 70,18 70,35"
              fill="none"
              stroke="url(#pulmonaryBlue)"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Left and Right Ventricle / Atrium Muscle Body */}
            <path
              d="M 50,30 
                 C 20,24 14,48 30,68 
                 C 40,78 48,88 50,90 
                 C 52,88 60,78 70,68 
                 C 86,48 80,24 50,30 Z"
              fill="url(#heart3d)"
              stroke="#4a0000"
              strokeWidth="1"
            />

            {/* Specular Highlight Streak for Realistic 3D Wet look */}
            <path
              d="M 32,38 C 24,44 22,54 30,62"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.35"
              style={{ filter: 'blur(1px)' }}
            />
            <path
              d="M 66,38 C 72,44 74,54 68,62"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.2"
              style={{ filter: 'blur(1px)' }}
            />

            {/* Cardiac veins & Coronary arteries detail paths */}
            <path
              d="M 50,30 Q 44,45 36,54"
              fill="none"
              stroke="#ff9999"
              strokeWidth="0.8"
              opacity="0.4"
            />
            <path
              d="M 50,30 Q 56,48 64,58"
              fill="none"
              stroke="#ff9999"
              strokeWidth="0.8"
              opacity="0.3"
            />
            <path
              d="M 36,54 Q 38,62 44,72"
              fill="none"
              stroke="#990000"
              strokeWidth="0.6"
              opacity="0.5"
            />
            <path
              d="M 50,52 Q 46,65 50,80"
              fill="none"
              stroke="#ff6666"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </svg>
        </motion.div>
      </div>

      {/* Atmospheric Ambient Smoke/Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 mix-blend-overlay" />
    </div>
  );
};
