import React from 'react';

interface LogoSetPartProps {
  part?: 'main' | 'accent' | 'badge';
  size?: number;
  rounded?: string;
  showBorder?: boolean;
}

export const LogoSetPart: React.FC<LogoSetPartProps> = ({
  part = 'main',
  size = 48,
  rounded = 'xl',
  showBorder = true,
}) => {
  const roundedClass = `rounded-${rounded}`;
  return (
    <div 
      className={`inline-flex items-center justify-center overflow-hidden bg-slate-950/60 ${showBorder ? 'border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : ''} ${roundedClass}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logos/New SafetyLink Official Logo.svg"
        alt="SafetyLink Brand Logo"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/panic-button-smooth.png';
        }}
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
};
