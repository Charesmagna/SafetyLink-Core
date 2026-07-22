import React, { useState } from 'react';

// Using a simplified token object for this isolated component
const tokens = {
  colors: {
    slate100: '#f1f5f9',
  }
};

interface FailSafeLogoProps {
  dimensions?: number;
  className?: string;
}

export const FailSafeLogo: React.FC<FailSafeLogoProps> = ({ dimensions = 68, className = '' }) => {
  const [useBackup, setUseBackup] = useState(false);

  if (useBackup) {
    return (
      <svg 
        version="1.0" 
        xmlns="http://www.w3.org/2000/svg" 
        width={`${dimensions}px`} 
        height="auto" 
        viewBox="0 0 600 327" 
        preserveAspectRatio="xMidYMid meet"
        className={`animate-pulse ${className}`}
      >
        <g transform="translate(0.000000,327.000000) scale(0.100000,-0.100000)" fill={tokens.colors.slate100} stroke="none">
          {/* Fail-safe vectorized corporate shield matching dark graphite canvas parameters */}
          <path d="M3880 3263 c-19 -2 -135 -17 -257 -33 -121 -17 -225 -30 -230 -30 -4 -1 28 -34 72 -75 l80 -75 -224 -221 c-122 -121 -221 -221 -220 -223..."/>
          <path d="M2919 3068 c-194 -139 -395 -221 -627 -259 -37 -5 -70 -15 -74 -22 -12 -18 -10 -390 3 -487..."/>
          {/* Simplified fallback path for visual presence */}
          <path d="M 300 20 L 500 100 L 500 250 C 500 350 300 450 300 450 C 300 450 100 350 100 250 L 100 100 Z" fill="none" stroke="#10b981" strokeWidth="20" strokeLinejoin="round" transform="scale(6, 6) translate(-150, -50)"/>
          <circle cx="3000" cy="1500" r="300" fill="#3b82f6"/>
        </g>
      </svg>
    );
  }

  return (
    <img
      src="/assets/images/Polish_20260620_014530309.jpg"
      alt="SafetyLink Canonical Identity"
      style={{ width: `${dimensions}px`, objectFit: 'contain' }}
      onError={() => {
        console.warn('Primary asset failed to resolve. Swapping to native vector engine.');
        setUseBackup(true);
      }}
      className={className}
    />
  );
};
