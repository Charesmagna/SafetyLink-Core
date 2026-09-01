import React from 'react';
import { Icon } from './Icon';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  iconColor?: string; // e.g. "currentColor" or a specific hex
  textColor?: string; // text class, e.g. "text-slate-100"
}

/**
 * SafetyLink Official Logo Component.
 * Integrates the official vector icon with crisp military-grade branding typography.
 * Implements strict layout constraints to ensure no cropping, stretching, or upscaling occurs.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 48,
  showText = false,
  className = '',
  iconColor = '#ffffff',
  textColor = 'text-slate-100'
}) => {
  return (
    <div 
      className={`flex items-center gap-3 select-none ${className}`}
    >
      {/* Icon Wrapper ensuring perfect aspect ratio preservation */}
      <div 
        className="flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <Icon 
          size={size} 
          color={iconColor} 
          className="object-contain w-full h-full"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left justify-center">
          <span className={`text-xs font-black tracking-[0.25em] ${textColor} uppercase font-mono leading-none`}>
            SAFETY LINK
          </span>
          <span className="text-[6.5px] font-bold text-slate-500 font-mono tracking-widest uppercase mt-1 leading-none">
            POWERED BY TM MEDIA SOLUTIONS
          </span>
        </div>
      )}
    </div>
  );
};
