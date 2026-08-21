// SafetyLink Branding Configuration
// Assets served from Google Drive public folder
// Replace drive URLs with hosted CDN URLs when ready

const DRIVE_BASE = 'https://drive.google.com/uc?export=view&id=';
const FOLDER_ID = '1l78cZjsK9RFFsr4DNqYwhK4swg8SIbmW';

// To get a file ID: open file in Drive -> share -> copy link -> extract ID from URL
// Format: https://drive.google.com/file/d/FILE_ID/view

export const Brand = {
  // Primary logo — use in: web nav, EXE header, APK settings screen
  primaryLogo: `/media/new_logo/New_SafetyLink_Official_Logo.svg`,

  // Umbrella logo (TM Media Solutions) — use in: web footer, legal pages
  umbrellaLogo: `/media/new_logo/New_SafetyLink_Official_Logo.svg`,

  // 3D animation — use in: web hero background, APK splash screen  
  animation3d: `/media/videos/SafetyLink 3D Animation Logo.mp4`,

  // App launcher icon — APK home screen icon
  launcherIcon: `/media/new_logo/New_SafetyLink_Official_Logo.svg`,

  // Notification icon — Android status bar icon during panic
  notificationIcon: `/media/app_icon/notification_icon.png`,

  // Admin panel logo — EXE header, web dashboard header
  adminLogo: `/media/new_logo/New_SafetyLink_Official_Logo.svg`,

  // Architecture diagrams — web "How it Works" and "Tech" sections
  architectureDiagram: `/media/images/Safety_Response_System_Architecture.png`,
  anatomyDiagram: `/media/images/Emergency_System_Architecture_Anatomy.png`,

  // K'lev.ai partner logo — web partners/powered-by section
  klevLogo: `/media/klev_ai_logo.png`,

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
