
import img1 from '../assets/images/regenerated_image_1784546645212.png';
import img2 from '../assets/images/regenerated_image_1787314665815.jpg';
import img3 from '../assets/images/regenerated_image_1787314961487.jpg';
import img4 from '../assets/images/regenerated_image_1787314967610.jpg';
import img5 from '../assets/images/regenerated_image_1787314983102.jpg';
import img6 from '../assets/images/regenerated_image_1787314967610.jpg';
import img7 from '../assets/images/regenerated_image_1787314665815.jpg';
import img8 from '../assets/images/Polish_20260620_014530309.jpg';
import img9 from '../assets/images/sl_ui_template.jpeg';

// Cloudinary assets centralized configuration
const CLOUD = 'qcp4fx2v';
const IMG_BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;
const VID_BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

export const img = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${IMG_BASE}/${transforms}/${publicId}`;

export const vid = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${VID_BASE}/${transforms}/${publicId}`;

export const ASSETS = {
  logo: img8,
  logo3d: img1,
  logoKlev: img1,
  appSos: img6,
  appLogin: img6,
  itagAll: img7,
  itagSingle: img7,
  itagBattery: img7,
  dispatch: img2,
  family: img3,
  tactical: img4,
  drone: img5,
  controlRoom: img2,
  banner: img9,
  businessCard: img9,
  dashboardDark: img2,
  estateTactical: img4,
  estatePhoto: img3,
  promoGraphic: img1,
};

export const USE_CASE_VIDEOS = [
  { id: 'Why', title: 'Why SafetyLink?', desc: 'The story behind the platform', poster: img1 },
  { id: 'Okay_now_for_the_next_scene', title: 'Family Protection', desc: 'How SafetyLink protects your household', poster: img3 },
  { id: 'Government_use_case_scenario', title: 'Government Use Case', desc: 'Municipal and public safety deployment', poster: img4 },
  { id: 'Neighbourhood_watch_security_c', title: 'Neighbourhood Watch', desc: 'Community security network in action', poster: img3 },
  { id: 'drone_dispatch_tracking_crimin', title: 'Drone Dispatch', desc: 'Aerial response to active incidents', poster: img5 },
  { id: 'Show_the_uses_in_school_and_wo', title: 'Schools & Workplaces', desc: 'Protecting learners and employees', poster: img1 },
  { id: 'Old_people_scenario_alone_at_h', title: 'Elderly at Home', desc: 'Watch-Me Timer proactive protection', poster: img3 },
  { id: 'SafetyLink_vision_when_ble_is', title: 'BLE iTAG in Action', desc: 'How the keyfob triggers an alert', poster: img7 },
  { id: 'Now_let_s_show_how_kids_would', title: 'Children & Schools', desc: 'Smart school safety deployment', poster: img4 },
  { id: 'K_s_south_Africa_so_multirac', title: 'Multilingual SA', desc: 'All 11 South African languages', poster: img3 },
  { id: 'Pitch_deck', title: 'Investor Pitch', desc: 'SafetyLink business overview', poster: img9 },
];
