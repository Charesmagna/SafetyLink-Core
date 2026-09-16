import React from 'react';

export const SLShieldLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="text-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Background Dark Shield */}
      <path d="M 50 5 L 90 20 L 90 50 C 90 75 50 95 50 95 C 50 95 10 75 10 50 L 10 20 Z" fill="url(#shield-grad)" stroke="#64748b" strokeWidth="2" />
      {/* Inner Metallic Border */}
      <path d="M 50 12 L 82 25 L 82 50 C 82 70 50 86 50 86 C 50 86 18 70 18 50 L 18 25 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
      
      {/* Central "SL" letters */}
      <text x="50" y="62" fontFamily="monospace" fontSize="36" fontWeight="bold" textAnchor="middle" fill="url(#text-grad)" filter="url(#glow)">SL</text>
      
      {/* Sparks */}
      <circle cx="25" cy="30" r="1.5" fill="#f59e0b" filter="url(#glow)" />
      <circle cx="75" cy="40" r="2" fill="#fbbf24" filter="url(#glow)" />
      <circle cx="30" cy="70" r="1" fill="#f59e0b" filter="url(#glow)" />
      <circle cx="65" cy="80" r="1.5" fill="#f59e0b" filter="url(#glow)" />
    </svg>
  );
};
