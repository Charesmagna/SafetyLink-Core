import React from 'react';
// Use the bundled transparent PNG that ships with the app.
// The .gitattributes binary marker ensures it is never corrupted by git text normalisation.
import logoTransparent from './assets/logo_transparent.png';

interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  glowColor?: string;
}

/**
 * SafetyLink Official Logo
 *
 * Renders the transparent PNG logo with an optional animated glow ring.
 * Used across: splash screen, notification shade, header, drawer header,
 * auth screen, and footer.
 *
 * The logo PNG is tracked in .gitattributes as a binary file so git never
 * applies line-ending normalisation and the PNG header stays intact.
 */
export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({
  size = 64,
  showText = false,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.35)',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 group cursor-pointer select-none ${className}`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Ambient glow ring */}
        <div
          className="absolute inset-0 rounded-full bg-blue-500/10 blur-md group-hover:bg-blue-500/20 transition-all duration-500 animate-pulse"
          style={{ opacity: 0.8 }}
        />

        {/* Official transparent logo – binary PNG, never corrupted */}
        <img
          src={logoTransparent}
          alt="SafetyLink"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: `drop-shadow(0 0 10px ${glowColor})`,
          }}
          className="transition-all duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback: hide broken image icon and show a shield emoji placeholder
            const img = e.currentTarget;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent && !parent.querySelector('.logo-fallback')) {
              const fallback = document.createElement('span');
              fallback.className = 'logo-fallback text-blue-400 select-none';
              fallback.style.fontSize = `${size * 0.6}px`;
              fallback.style.lineHeight = '1';
              fallback.textContent = '🛡️';
              parent.appendChild(fallback);
            }
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
