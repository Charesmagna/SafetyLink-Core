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
  logo: '/logos/New SafetyLink Official Logo.svg',
  logoCdn: '/media/new_logos/logo_hq.png',
  logo3d: '/logos/New SafetyLink Official Logo.svg',
  logoKlev: '/media/new_logo/Kleva.svg',
  appSos: '/panic-button-smooth.png',
  appLogin: '/Polish_20260727_010938698.jpg',
  itagAll: '/multi-buttons-smooth.png',
  itagSingle: '/panic-button.png',
  itagBattery: '/buttons-only.jpg',
  dispatch: '/Polish_20260819_020134421.jpg',
  family: '/Polish_20260819_020007723.jpg',
  tactical: '/Polish_20260907_043403519.jpg',
  drone: '/Polish_20260819_020219883.jpg',
  controlRoom: '/Polish_20260727_023640262.jpg',
  banner: '/Polish_20260620_014530309.jpg',
  businessCard: '/Polish_20260620_014530309.jpg',
  dashboardDark: '/Screenshot_20260820_201927_com.aistudio.safetylink.vqnztp.jpg',
  estateTactical: '/Polish_20260907_043403519.jpg',
  estatePhoto: '/Polish_20260819_020134421-1.jpg',
  promoGraphic: '/Polish_20260620_014530309.jpg',
  mapDark: '/Screenshot_20260820_202202_com.aistudio.safetylink.vqnztp.jpg',
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
