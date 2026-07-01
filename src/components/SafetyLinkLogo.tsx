import React from 'react';

interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
}

/**
 * SafetyLink official brand mark (public/logo.png). Used across AuthScreen,
 * the main App header, and OrgDashboard.
 */
export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ size = 48, showText = false }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.png"
        width={size}
        height={size}
        alt="SafetyLink logo"
        className="object-contain"
      />
      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-base font-black tracking-wider text-slate-100 uppercase font-mono">
            SAFETY LINK
          </span>
          <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest">
            TM Media Solutions
          </span>
        </div>
      )}
    </div>
  );
};
