import React from 'react';
const logoPolish = '/Polish_20260620_014530309.jpg';
import logoTransparent from './assets/logo_transparent.png';

// Global cache variable to avoid re-initializing and triggering onError flicker on every mount
let cachedLogoSrc: string | null = null;

interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  glowColor?: string;
}

/**
 * SafetyLink Official Custom Logo.
 * Displays the background-removed official branding logo from /logo_transparent.png,
 * providing crystal-clear, transparent visual execution for premium dark/light integrations
 * without messy edge blending. Includes optional micro-hover scale triggers, subtle
 * colored backing glows, and standard brand typography.
 */
export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ 
  size = 64, 
  showText = false, 
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.35)'
}) => {
  const [imgSrc, setImgSrc] = React.useState(cachedLogoSrc || logoPolish);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 group cursor-pointer select-none ${className}`}>
      {/* SVG Color Mask Filter to dynamically strip white background from logo */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="remove-white-bg-logo" colorInterpolationFilters="sRGB">
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

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background glowing rings */}
        <div 
          className="absolute inset-0 rounded-full bg-blue-500/10 blur-md group-hover:bg-blue-500/20 transition-all duration-500 animate-pulse" 
          style={{ opacity: 0.8 }}
        />
        
        {/* Crisp, transparent brand icon - with SVG color matrix filter to cut out white background */}
        <img
          src={imgSrc}
          alt="SafetyLink Official Logo"
          style={{ mixBlendMode: "screen", filter: `drop-shadow(0 0 10px ${glowColor}) brightness(1.15) contrast(1.05)` }}
          className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={() => {
            cachedLogoSrc = logoTransparent;
            setImgSrc(logoTransparent);
          }}
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
