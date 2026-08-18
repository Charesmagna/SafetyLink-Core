const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/\/media\/new_logo\/New_SafetyLink_Official_Logo\.svg/g, '/Polish_20260620_014530309.jpg');
html = html.replace(/type="image\/svg\+xml"/g, 'type="image/jpeg"');
fs.writeFileSync('index.html', html);

// 2. Update LogoSetPart.tsx
const logoTsx = `import React from 'react';

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
      className={\`relative overflow-hidden shrink-0 flex items-center justify-center \${roundedClasses[rounded]} \${
        showBorder ? 'border border-slate-700/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-slate-900/50 backdrop-blur-sm' : ''
      } \${className}\`} 
      style={{ 
        width: size, 
        height: size,
        maskImage: showBorder ? 'none' : 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: showBorder ? 'none' : 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent mix-blend-overlay z-10 pointer-events-none" />
      <img
        src="/Polish_20260620_014530309.jpg"
        alt="SafetyLink Logo"
        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
        style={{
           mixBlendMode: 'lighten'
        }}
      />
    </div>
  );
};
`;
fs.writeFileSync('src/components/LogoSetPart.tsx', logoTsx);

// 3. Update vite.config.ts
let vite = fs.readFileSync('vite.config.ts', 'utf8');
vite = vite.replace(/official_safetylink_logo\.svg/g, 'Polish_20260620_014530309.jpg');
fs.writeFileSync('vite.config.ts', vite);
