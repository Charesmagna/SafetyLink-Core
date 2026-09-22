// SafetyLink Branding Configuration
// Assets served from Google Drive public folder
// Replace drive URLs with hosted CDN URLs when ready


// To get a file ID: open file in Drive -> share -> copy link -> extract ID from URL
// Format: https://drive.google.com/file/d/FILE_ID/view

export const Brand = {
  // Primary logo — use in: web nav, EXE header, APK settings screen
  primaryLogo: `/logos/New SafetyLink Official Logo.svg`,
  fallbackLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/Polish_20260620_014530309`,

  // Umbrella logo (TM Media Solutions) — use in: web footer, legal pages
  umbrellaLogo: `/logos/New SafetyLink Official Logo.svg`,

  // 3D animation — use in: web hero background, APK splash screen  
  animation3d: `/api/r2/stream/Safetylink/SafetyLink%203D%20Animation%20Logo.mp4`,

  // App launcher icon — APK home screen icon
  launcherIcon: `/Icons/icon-512.png`,

  // Notification icon — Android status bar icon during panic
  notificationIcon: `/Icons/icon-512.png`,

  // Admin panel logo — EXE header, web dashboard header
  adminLogo: `/logos/New SafetyLink Official Logo.svg`,

  // Architecture diagrams — web "How it Works" and "Tech" sections
  architectureDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`,
  anatomyDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`,

  // K'lev.ai partner logo — web partners/powered-by section
  klevLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/q_auto,f_auto/K_leva`,

  // App name and tagline
  appName: 'SafetyLink',
  tagline: 'Real-time safety. Always on.',
  company: 'TM Media Solutions',
  website: 'https://safetylink.online',

  // Colors
  colors: {
    primary: '#00ff88',      // emerald green - armed/safe state
    danger: '#ff3b3b',       // red - distress/panic state  
    warning: '#f59e0b',      // amber - GIS/location
    dark: '#020617',         // near-black - background
    surface: '#0f172a',      // dark slate - cards
    text: '#f8fafc',         // near-white - primary text
  },

  // Fonts
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
};

export default Brand;
