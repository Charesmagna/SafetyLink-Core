import React from 'react';

interface SafetyLinkLogoProps {
  size?: number;
  showText?: boolean;
}

/**
 * SafetyLink brand mark: a slate shield with an emerald interlinked chain
 * crossing into an upward escalation arrow. Used across AuthScreen, the
 * main App header, and OrgDashboard.
 */
export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ size = 48, showText = false }) => {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SafetyLink logo"
      >
        {/* Shield */}
        <path
          d="M32 4L54 12V28C54 43 45 54.5 32 60C19 54.5 10 43 10 28V12L32 4Z"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* Interlinked chain */}
        <circle cx="24" cy="26" r="6" fill="none" stroke="#10b981" strokeWidth="3.5" />
        <circle cx="34" cy="34" r="6" fill="none" stroke="#10b981" strokeWidth="3.5" />
        {/* Escalation arrow */}
        <path
          d="M30 42L44 28M44 28H34M44 28V38"
          stroke="#34d399"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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
