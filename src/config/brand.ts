// SafetyLink Branding Configuration
// Assets served from Google Drive public folder
// Replace drive URLs with hosted CDN URLs when ready


// To get a file ID: open file in Drive -> share -> copy link -> extract ID from URL
// Format: https://drive.google.com/file/d/FILE_ID/view

export const Brand = {
  // Primary logo — use in: web nav, EXE header, APK settings screen
  primaryLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`,

  // Umbrella logo (TM Media Solutions) — use in: web footer, legal pages
  umbrellaLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`,

  // 3D animation — use in: web hero background, APK splash screen  
  animation3d: `https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310213/Now_I_need_the_d_animation_lo.mp4`,

  // App launcher icon — APK home screen icon
  launcherIcon: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`,

  // Notification icon — Android status bar icon during panic
  notificationIcon: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`,

  // Admin panel logo — EXE header, web dashboard header
  adminLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png`,

  // Architecture diagrams — web "How it Works" and "Tech" sections
  architectureDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`,
  anatomyDiagram: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg`,

  // K'lev.ai partner logo — web partners/powered-by section
  klevLogo: `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png`,

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
