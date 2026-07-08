import React from 'react';
import logoTransparent from './assets/logo_transparent.png';

interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  glowColor?: string;
}

/**
 * SafetyLink Official Logo - white background removed, transparent PNG.
 * Used across: splash screen, header, drawer header, auth screen, footer.
 */
export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ 
  size = 64, 
  showText = false, 
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.35)'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 group cursor-pointer select-none ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background glowing rings */}
        <div 
          className="absolute inset-0 rounded-full bg-blue-500/10 blur-md group-hover:bg-blue-500/20 transition-all duration-500 animate-pulse" 
          style={{ opacity: 0.8 }}
        />
        
        {/* Transparent logo - white BG already removed */}
        <img
          src={logoTransparent}
          alt="SafetyLink Official Logo"
          style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
          className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-center">
          <span className="text-[11px] font-black tracking-[0.25em] text-slate-100 uppercase font-mono">
            SAFETY LINK
          </span>
          <span className="text-[7px] font-bold text-slate-500 font-mono tracking-widest uppercase mt-0.5">
            POWERED BY TM MEDIA SOLUTIONS
          </span>
        </div>
      )}
    </div>
  );
};
