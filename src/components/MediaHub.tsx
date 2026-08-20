import React from 'react';

// Using a simplified local token map for this component
const tokens = {
  colors: {
    slate100: '#f1f5f9',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate800: '#1e293b',
    charcoal: '#121826',
    graphiteBlack: '#07090e',
    white: '#ffffff',
  },
  typography: {
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      xl: '1.25rem',
    }
  },
  shadows: {
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  }
};

export const MediaHub: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-0 relative" style={{ backgroundColor: tokens.colors.graphiteBlack }}>
      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none z-10 bg-gradient-to-b from-[#07090e] via-[#07090e]/80 to-transparent">
        <h2 style={{ fontSize: tokens.typography.sizes.xl, color: tokens.colors.slate100 }} className="font-bold">System Verification Gallery</h2>
        <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.slate400 }}>Mission-critical visual telemetry guides and software tutorials mounted directly from secure cloud drive.</p>
      </div>
      
      <div className="flex-1 w-full h-full pt-24">
        {/* We use an embedded folder view from Google Drive to bypass the need for Google Cloud API keys */}
        <iframe 
          src="https://drive.google.com/embeddedfolderview?id=1l78cZjsK9RFFsr4DNqYwhK4swg8SIbmW#list"
          className="w-full h-full border-0"
          title="SafetyLink Media Hub"
          allow="autoplay"
        ></iframe>
      </div>
    </div>
  );
};
