import React from 'react';

// We use safetylink_logo_main.png as the fallback for TM Media Solutions logo until the user uploads it
export type LogoPartType = 'main' | 'accent' | 'mascot' | 'badge';

interface LogoSetPartProps {
  part?: LogoPartType;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl' | '2xl' | 'none';
  showBorder?: boolean;
  variant?: 'official' | 'hq_dark' | 'hq_light' | 'transparent';
}

export const LogoSetPart: React.FC<LogoSetPartProps> = ({
  size = 40,
  className = '',
  rounded = 'xl',
  showBorder = true,
  variant = 'official'
}) => {
  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    none: 'rounded-none'
  };

  const logoSrc = variant === 'hq_dark' 
    ? '/media/new_logos/logo_hq.png'
    : variant === 'hq_light'
    ? '/media/new_logos/logo_hq_1.png'
    : '/logos/New SafetyLink Official Logo.svg';

  return (
    <div 
      className={`relative overflow-hidden select-none shrink-0 flex items-center justify-center ${roundedClasses[rounded]} ${
        showBorder ? 'border border-emerald-500/20 shadow-[0_4px_16px_rgba(0,0,0,0.6)] bg-slate-900/60 backdrop-blur-md' : ''
      } ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src={logoSrc}
        alt="SafetyLink Logo"
        className="w-full h-full object-contain pointer-events-none p-1 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
        onError={(e) => {
          const imgEl = e.currentTarget as HTMLImageElement;
          imgEl.src = '/media/new_logos/logo_hq.png';
        }}
      />
    </div>
  );
};
