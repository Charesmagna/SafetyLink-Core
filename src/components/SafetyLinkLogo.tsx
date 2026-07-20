import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';



interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  glowColor?: string;
  interactiveHud?: boolean;
  forceMode?: 'auto' | 'admin' | 'patrol' | 'school' | 'corporate' | 'gov' | 'family' | 'emergency';
}

export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ 
  size = 140, 
  showText: _showText = true, 
  className = '',
  glowColor,
  interactiveHud: _interactiveHud = false,
  forceMode = 'auto'
}) => {
  const { currentUser, currentOrg, superAdminActive, activeSOSState } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine active theme scheme based on forceMode or global context for the underlying glow aura
  const getActiveScheme = (): 'admin' | 'patrol' | 'school' | 'corporate' | 'gov' | 'family' | 'emergency' => {
    if (forceMode !== 'auto') return forceMode;
    if (activeSOSState !== 'IDLE') return 'emergency';
    if (superAdminActive || currentUser?.username === 'SL-admin-0000') return 'admin';

    if (currentOrg) {
      const name = currentOrg.name.toLowerCase();
      if (name.includes('school') || name.includes('university') || name.includes('college') || name.includes('academy')) return 'school';
      if (name.includes('patrol') || name.includes('security') || name.includes('police') || name.includes('dispatch') || name.includes('guard')) return 'patrol';
      if (name.includes('corp') || name.includes('office') || name.includes('manufacturing') || name.includes('lone')) return 'corporate';
      if (name.includes('gov') || name.includes('utility') || name.includes('municipal') || name.includes('public')) return 'gov';
    }
    return 'family';
  };

  const activeScheme = getActiveScheme();

  // Core glow profiles for backplates, keeping the main logo cohesive with system states
  const glowProfiles = {
    admin: { glow: glowColor || 'rgba(245, 158, 11, 0.4)', primary: '#f59e0b' },
    patrol: { glow: glowColor || 'rgba(217, 119, 6, 0.4)', primary: '#d97706' },
    school: { glow: glowColor || 'rgba(16, 185, 129, 0.4)', primary: '#10b981' },
    corporate: { glow: glowColor || 'rgba(59, 130, 246, 0.4)', primary: '#3b82f6' },
    gov: { glow: glowColor || 'rgba(249, 115, 22, 0.4)', primary: '#f97316' },
    family: { glow: glowColor || 'rgba(16, 185, 129, 0.35)', primary: '#10b981' }, // Defaults to green to align with branding
    emergency: { glow: glowColor || 'rgba(239, 68, 68, 0.75)', primary: '#ef4444' }
  };

  const profile = glowProfiles[activeScheme];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    setTilt({ 
      x: (mouseY / (rect.height / 2)) * -10, 
      y: (mouseX / (rect.width / 2)) * 10 
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-1 select-none">
      {/* Subtle 3D Floating interactive container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        className={`relative flex items-center justify-center transition-all duration-300 ${className}`}
        style={{
          width: size * 1.6,
          height: size,
          perspective: 1000,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Elegant HUD corner brackets on active hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute inset-x-0 -inset-y-3 rounded-2xl border border-emerald-500/10 bg-slate-950/20 backdrop-blur-[1px] pointer-events-none z-0 shadow-[inset_0_0_15px_rgba(16,185,129,0.02)]"
              style={{ transform: 'translateZ(-15px)' }}
            >
              <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-emerald-500/30 rounded-tl" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-emerald-500/30 rounded-tr" />
              <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-emerald-500/30 rounded-bl" />
              <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-emerald-500/30 rounded-br" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Backplate Aura Glow */}
        <div 
          className="absolute rounded-full transition-all duration-500" 
          style={{ 
            width: size * 0.9,
            height: size * 0.9,
            background: `radial-gradient(circle, ${profile.glow} 0%, rgba(0,0,0,0) 70%)`,
            opacity: isHovered ? 0.9 : 0.45,
            filter: 'blur(24px)',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(-40px)`,
            transformStyle: 'preserve-3d',
            pointerEvents: 'none'
          }}
        />

        {/* 3D Moving Premium Metal Logo */}
        <motion.div
          animate={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0px)`
          }}
          transition={{ type: 'spring', stiffness: 250, damping: 28 }}
          className="relative w-full h-full flex items-center justify-center select-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Slices or displays the high-fidelity branding logo, swapping conditionally during emergency panic states */}
          <img
            src="/media/new_logo/New_SafetyLink_Official_Logo.svg"
            alt="SafetyLink Logo"
            className="w-full h-full object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)]"
          />
        </motion.div>
      </div>
    </div>
  );
};
