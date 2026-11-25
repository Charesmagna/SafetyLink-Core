import { getR2StreamUrl } from './r2Assets';

// Cloudinary assets centralized configuration
const CLOUD = 'qcp4fx2v';
const IMG_BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;
const VID_BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

export const img = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${IMG_BASE}/${transforms}/${publicId}`;

export const vid = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${VID_BASE}/${transforms}/${publicId}.mp4`;

/** Extracts an instant HD frame thumbnail directly from any verified Cloudinary video. */
export const vidPoster = (publicId: string, transforms = 'so_1,w_960,q_auto,f_jpg') =>
  `${VID_BASE}/${transforms}/${publicId}.jpg`;

export const ASSETS = {
  // Universal verified transparent SafetyLink logo asset
  logo: '/logos/Safety_Link_Logo_Transparent.png',
  logoSvg: '/logos/New SafetyLink Official Logo.svg',
  logoTransparent: '/logos/Safety_Link_Logo_Transparent.png',
  logoDark: '/logos/Safety_Link_Logo_Black.png',
  logoCdn: '/logos/Safety_Link_Logo_Transparent.png',
  logo3d: '/logos/Safety_Link_Logo_Transparent.png',
  logoKlev: '/media/kleva_logo/Kleva.svg',
  appSos: getR2StreamUrl('Cat with a button.png'),
  appLogin: getR2StreamUrl('Polish_20260819_014832026.jpg'),
  itagAll: getR2StreamUrl('HST-01-Anti-Lost-Finder-PRODUCT.jpg'),
  itagSingle: getR2StreamUrl('31DP9Fqk0wL._AC_.jpg'),
  itagBattery: getR2StreamUrl('Polish_20260819_020007723.jpg'),
  dispatch: getR2StreamUrl('Polish_20260819_020134421.jpg'),
  family: getR2StreamUrl('Polish_20260819_020007723.jpg'),
  tactical: getR2StreamUrl('Polish_20260907_043403519.jpg'),
  drone: getR2StreamUrl('Polish_20260819_020219883.jpg'),
  controlRoom: getR2StreamUrl('Polish_20260711_034127538.jpg'),
  banner: getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png'),
  businessCard: '/logos/Safety_Link_Logo_Transparent.png',
  dashboardDark: getR2StreamUrl('IMG_20260914_221811.png'),
  estateTactical: getR2StreamUrl('Polish_20260907_043403519.jpg'),
  estatePhoto: getR2StreamUrl('Polish_20260819_020134421.jpg'),
  promoGraphic: getR2StreamUrl('Emergency_Mesh_Platform_Overview.png'),
  mapDark: getR2StreamUrl('Polish_20260809_035827088.png'),
};

/** All verified HTTP 200 OK visual action videos hosted on Cloudinary. */
export const ACTION_VIDEOS = {
  familyProtection: 'Okay_now_for_the_next_scene_',
  governmentDispatch: 'Government_use_case_senario',
  neighbourhoodWatch: 'Neighbourhood_watch_security_c',
  droneDispatch: 'drone_dispatch_tracking_crimin',
  schoolsAndWorkplaces: 'Show_the_uses_in_school_and_wo',
  elderlyAtHome: 'Old_people_scenario_alone_at_h',
  bleItagAction: 'SafetyLink_vision_when_ble_is',
  childrenAndSchools: 'Now_let_s_show_how_kids_would',
  liveActionShowcase: 'Make_this_come_to_life',
  brand3dMotion: 'Now_I_need_the_d_animation_lo',
  fieldTacticalReel: 'petal_20260727_180314',
  whySafetyLink: 'Why',
  investorPitch: 'Pitch_deck',
} as const;

export const USE_CASE_VIDEOS = [
  { id: ACTION_VIDEOS.familyProtection,     tag: 'FAMILY SOS',      title: 'Family Protection',       desc: 'How SafetyLink protects your household in real time' },
  { id: ACTION_VIDEOS.governmentDispatch,   tag: 'PUBLIC SAFETY',   title: 'Government Use Case',     desc: 'Municipal and public safety deployment across South Africa' },
  { id: ACTION_VIDEOS.neighbourhoodWatch,   tag: 'COMMUNITY',       title: 'Neighbourhood Watch',     desc: 'Community security network and estate patrols in action' },
  { id: ACTION_VIDEOS.droneDispatch,        tag: 'AERIAL PURSUIT',  title: 'Drone Dispatch',          desc: 'Autonomous aerial response tracking active incidents' },
  { id: ACTION_VIDEOS.schoolsAndWorkplaces, tag: 'CAMPUS & OFFICE', title: 'Schools & Workplaces',    desc: 'Protecting learners, teachers, and corporate employees' },
  { id: ACTION_VIDEOS.elderlyAtHome,        tag: 'ELDER CARE',      title: 'Elderly at Home',         desc: 'Watch-Me Timer and one-tap proactive home protection' },
  { id: ACTION_VIDEOS.bleItagAction,        tag: 'BLE HARDWARE',    title: 'BLE iTAG in Action',      desc: 'How a pocket Bluetooth keyfob triggers an instant alert' },
  { id: ACTION_VIDEOS.childrenAndSchools,   tag: 'SCHOOL SAFETY',   title: 'Children & Schools',      desc: 'Smart school perimeter and parent escalation deployment' },
  { id: ACTION_VIDEOS.liveActionShowcase,   tag: 'LIVE ACTION',     title: 'SafetyLink in Motion',    desc: 'End-to-end distress trigger to responder arrival' },
  { id: ACTION_VIDEOS.fieldTacticalReel,    tag: 'FIELD OPS',       title: 'Tactical Field Response', desc: 'On-the-ground mobile telemetry and dispatch flow' },
  { id: ACTION_VIDEOS.whySafetyLink,        tag: 'MISSION',         title: 'Why SafetyLink?',         desc: 'The story behind South Africa’s resilient safety network' },
  { id: ACTION_VIDEOS.investorPitch,        tag: 'OVERVIEW',        title: 'SafetyLink Overview',     desc: 'Complete ecosystem and commercial platform overview' },
];
