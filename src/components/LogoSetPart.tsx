import React from 'react';
import slLogoSet from '../assets/images/sl_logoset.jpeg';

export type LogoPartType = 'main' | 'accent' | 'mascot' | 'badge';

interface LogoSetPartProps {
  part: LogoPartType;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl' | '2xl' | 'none';
  showBorder?: boolean;
}

export const LogoSetPart: React.FC<LogoSetPartProps> = ({
  part,
  size = 40,
  className = '',
  rounded = 'xl',
  showBorder = true
}) => {
  // Map positions within the 2x2 collage grid
  // 'main' (top-left): top: 0, left: 0
  // 'accent' (top-right): top: 0, left: -100%
  // 'mascot' (bottom-left): top: -100%, left: 0
  // 'badge' (bottom-right): top: -100%, left: -100%
  
  let top = '0%';
  let left = '0%';
  
  if (part === 'accent') {
    left = '-100%';
  } else if (part === 'mascot') {
    top = '-100%';
  } else if (part === 'badge') {
    top = '-100%';
    left = '-100%';
  }

  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    none: 'rounded-none'
  };

  return (
    <div 
      className={`relative overflow-hidden select-none shrink-0 ${roundedClasses[rounded]} ${
        showBorder ? 'border border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-slate-950' : ''
      } ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src={slLogoSet}
        alt={`SafetyLink Asset ${part}`}
        className="absolute max-w-none transition-transform duration-300 pointer-events-none"
        style={{
          width: size * 2,
          height: size * 2,
          top,
          left,
          maxWidth: 'none',
          maxHeight: 'none'
        }}
      />
    </div>
  );
};
