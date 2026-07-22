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

interface VideoAsset {
  title: string;
  filename: string;
  path: string;
  description: string;
}

const MEDIA_MANIFEST: VideoAsset[] = [
  {
    title: "Inside the SafetyLink Emergency Ecosystem",
    filename: "Inside_the_SafetyLink_Emergency_Ecosystem.mp4",
    path: "/assets/video/Inside_the_SafetyLink_Emergency_Ecosystem.mp4",
    description: "Full architectural walk-through showing real-time GPS coordinate logging and responder console updates."
  },
  {
    title: "Emergency Workflow Automation Architecture",
    filename: "How_SafetyLink_Automates_Emergency_Responses.mp4",
    path: "/assets/video/How_SafetyLink_Automates_Emergency_Responses.mp4",
    description: "Technical operational demonstration of native Android PanicService background survival threads."
  },
  {
    title: "Cinematic Logo Smash - 3D Vault Assembly",
    filename: "SafetyLink 3D Animation Logo.mp4",
    path: "/assets/video/SafetyLink 3D Animation Logo.mp4",
    description: "High-fidelity wide-format identity clip deployed across auth gateways and dashboard backdrops."
  }
];

export const MediaHub: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-6" style={{ backgroundColor: tokens.colors.graphiteBlack }}>
      <div className="mb-4">
        <h2 style={{ fontSize: tokens.typography.sizes.xl, color: tokens.colors.slate100 }}>System Verification Gallery</h2>
        <p style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.slate400 }}>Mission-critical visual telemetry guides and software tutorials.</p>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pr-2">
        {MEDIA_MANIFEST.map((clip, index) => (
          <div 
            key={index} 
            className="rounded-xl flex flex-col overflow-hidden border transition-all duration-300"
            style={{ 
              backgroundColor: tokens.colors.charcoal,
              borderColor: tokens.colors.slate800,
              boxShadow: tokens.shadows.md
            }}
          >
            <div className="relative aspect-video w-full bg-black">
              <video 
                src={clip.path} 
                controls 
                preload="metadata"
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <span className="text-emerald-500 uppercase tracking-wider font-mono mb-1" style={{ fontSize: tokens.typography.sizes.xs }}>
                {clip.filename}
              </span>
              <h3 className="font-semibold mb-2" style={{ fontSize: tokens.typography.sizes.md, color: tokens.colors.white }}>
                {clip.title}
              </h3>
              <p className="flex-grow" style={{ fontSize: tokens.typography.sizes.sm, color: tokens.colors.slate300 }}>
                {clip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
