import React from 'react';
// We use safetylink_logo_main.png as the fallback for TM Media Solutions logo until the user uploads it


export type LogoPartType = 'main' | 'accent' | 'mascot' | 'badge';

interface LogoSetPartProps {
  part?: LogoPartType;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl' | '2xl' | 'none';
  showBorder?: boolean;
}

export const LogoSetPart: React.FC<LogoSetPartProps> = ({
  size = 40,
  className = '',
  rounded = 'xl',
  showBorder = true
}) => {
  const roundedClasses = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    none: 'rounded-none'
  };

  return (
    <div 
      className={`relative overflow-hidden select-none shrink-0 flex items-center justify-center ${roundedClasses[rounded]} ${
        showBorder ? 'border border-slate-800/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-white' : ''
      } ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src="/media/new_logo/New_SafetyLink_Official_Logo.svg"
        alt="SafetyLink Logo"
        className="w-full h-full object-contain pointer-events-none p-1"
      />
    </div>
  );
};
