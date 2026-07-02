import React from 'react';

interface SafetyLinkLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SafetyLinkLogo: React.FC<SafetyLinkLogoProps> = ({ 
  className = '', 
  size = 48, 
  showText = false 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Deep Slate Shield Background */}
        <path 
          d="M256 48C180 80 96 112 96 112V240C96 348 160 416 256 464C352 416 416 348 416 240V112C416 112 332 80 256 48Z" 
          fill="#1e293b" 
          stroke="#334155" 
          strokeWidth="12"
          strokeLinejoin="round"
        />
        
        {/* Dark Blue Shield Core Accent */}
        <path 
          d="M256 72C192 100 120 128 120 128V232C120 320 172 384 256 428C340 384 392 320 392 232V128C392 128 320 100 256 72Z" 
          fill="#0f172a" 
        />

        {/* Integrated Green Chain Link with Upward/Rightward Arrow */}
        <g stroke="#10b981" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round">
          {/* Lower Loop of Chain */}
          <path d="M190 320C170 300 170 260 190 240L230 200" />
          
          {/* Middle Connecting Link */}
          <path d="M230 282L282 230" />
          
          {/* Upper Loop of Chain */}
          <path d="M282 230C302 210 338 210 358 230C378 250 378 286 358 306L306 358" />
          
          {/* Chain crossing link line */}
          <path d="M206 336C226 356 262 356 282 336L322 296" />
        </g>

        {/* Arrow Pointing Upwards and Rightwards representing Escalation and Rescue */}
        <path 
          d="M320 150L380 150L380 210M380 150L250 280" 
          stroke="#10b981" 
          strokeWidth="28" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col text-left select-none">
          <span className="text-base font-black tracking-wider text-slate-100 uppercase font-mono leading-none flex items-center">
            SAFETY LINK
          </span>
          <span className="text-[8px] font-bold text-slate-400 font-mono tracking-widest leading-normal">
            TM Media Solutions
          </span>
        </div>
      )}
    </div>
  );
};
