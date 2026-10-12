// Cloudinary assets centralized configuration
const CLOUD = 'qcp4fx2v';
const IMG_BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;
const VID_BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

export const img = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${IMG_BASE}/${transforms}/${publicId}`;

export const vid = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${VID_BASE}/${transforms}/${publicId}`;

export const ASSETS = {
  // Use verified transparent SafetyLink logo asset
  logo: '/logos/Safety_Link_Logo_Transparent.png',
  logoSvg: '/logos/New SafetyLink Official Logo.svg',
  logoTransparent: '/logos/Safety_Link_Logo_Transparent.png',
  logoDark: '/logos/Safety_Link_Logo_Black.png',
  logoCdn: '/logos/Safety_Link_Logo_Transparent.png',
  logo3d: '/logos/Safety_Link_Logo_Transparent.png',
  logoKlev: '/media/kleva_logo/Kleva.svg',
  appSos: '/api/r2/stream/Safetylink/Cat%20with%20a%20button.png',
  appLogin: '/api/r2/stream/Safetylink/Polish_20260819_014832026.jpg',
  itagAll: '/api/r2/stream/Safetylink/HST-01-Anti-Lost-Finder-PRODUCT.jpg',
  itagSingle: '/api/r2/stream/Safetylink/31DP9Fqk0wL._AC_.jpg',
  itagBattery: '/api/r2/stream/Safetylink/Polish_20260819_020007723.jpg',
  dispatch: '/api/r2/stream/Safetylink/Polish_20260819_020134421.jpg',
  family: '/api/r2/stream/Safetylink/Polish_20260819_020007723.jpg',
  tactical: '/api/r2/stream/Safetylink/Polish_20260907_043403519.jpg',
  drone: '/api/r2/stream/Safetylink/Polish_20260819_020219883.jpg',
  controlRoom: '/api/r2/stream/Safetylink/Polish_20260711_034127538.jpg',
  banner: '/api/r2/stream/Safetylink/Emergency_Response_Platform_Architecture_Overview.png',
  businessCard: '/logos/Safety_Link_Logo_Transparent.png',
  dashboardDark: '/api/r2/stream/Safetylink/IMG_20260914_221811.png',
  estateTactical: '/api/r2/stream/Safetylink/Polish_20260907_043403519.jpg',
  estatePhoto: '/api/r2/stream/Safetylink/Polish_20260819_020134421.jpg',
  promoGraphic: '/api/r2/stream/Safetylink/Emergency_Mesh_Platform_Overview.png',
  mapDark: '/api/r2/stream/Safetylink/Polish_20260809_035827088.png',
};

export const USE_CASE_VIDEOS = [
  { id: 'Why', title: 'Why SafetyLink?', desc: 'The story behind the platform', poster: ASSETS.logo },
  { id: 'Okay_now_for_the_next_scene', title: 'Family Protection', desc: 'How SafetyLink protects your household', poster: ASSETS.family },
  { id: 'Government_use_case_senario', title: 'Government Use Case', desc: 'Municipal and public safety deployment', poster: ASSETS.dispatch },
  { id: 'Neighbourhood_watch_security_c', title: 'Neighbourhood Watch', desc: 'Community security network in action', poster: ASSETS.tactical },
  { id: 'drone_dispatch_tracking_crimin', title: 'Drone Dispatch', desc: 'Aerial response to active incidents', poster: ASSETS.drone },
  { id: 'Show_the_uses_in_school_and_wo', title: 'Schools & Workplaces', desc: 'Protecting learners and employees', poster: ASSETS.controlRoom },
  { id: 'Old_people_scenario_alone_at_h', title: 'Elderly at Home', desc: 'Watch-Me Timer proactive protection', poster: ASSETS.family },
  { id: 'SafetyLink_vision_when_ble_is', title: 'BLE iTAG in Action', desc: 'How the keyfob triggers an alert', poster: ASSETS.itagAll },
  { id: 'Now_let_s_show_how_kids_would', title: 'Children & Schools', desc: 'Smart school safety deployment', poster: ASSETS.estateTactical },
  { id: 'K_s_south_Africa_so_multirac', title: 'Multilingual SA', desc: 'All 11 South African languages', poster: ASSETS.family },
  { id: 'Now_I_need_the_d_animation_lo', title: 'Investor Pitch', desc: 'SafetyLink business overview', poster: ASSETS.banner },
];
