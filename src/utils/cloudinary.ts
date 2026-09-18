// Cloudinary assets centralized configuration
const CLOUD = 'qcp4fx2v';
const IMG_BASE = `https://res.cloudinary.com/${CLOUD}/image/upload`;
const VID_BASE = `https://res.cloudinary.com/${CLOUD}/video/upload`;

export const img = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${IMG_BASE}/${transforms}/${publicId}`;

export const vid = (publicId: string, transforms = 'q_auto,f_auto') =>
  `${VID_BASE}/${transforms}/${publicId}`;

export const ASSETS = {
  // Use the verified brand logo: Polish_20260818_074430308
  logo: img('Polish_20260818_074430308'),
  logo3d: img('Polish_20260818_074430308'),
  logoKlev: img('K_leva'),
  appSos: img('Gemini_Generated_Image_ohoz6sohoz6sohoz'), // using one of the generated images from previous grep
  appLogin: img('main-sample'),
  itagAll: img('image_1786374730511'),
  itagSingle: img('image_1786374730511'),
  itagBattery: img('image_1786374730511'),
  dispatch: img('Gemini_Generated_Image_59psss59psss59ps'),
  family: img('Gemini_Generated_Image_48euet48euet48eu'),
  tactical: img('Gemini_Generated_Image_td9rg6td9rg6td9r'),
  drone: img('Gemini_Generated_Image_283s3m283s3m283s'),
  controlRoom: img('Gemini_Generated_Image_waguavwaguavwagu'),
  banner: img('sl_ui_template'),
  businessCard: img('sl_ui_template'),
  dashboardDark: img('Gemini_Generated_Image_s8bl6ps8bl6ps8bl'),
  estateTactical: img('Gemini_Generated_Image_td9rg6td9rg6td9r'),
  estatePhoto: img('1785107409613'),
  promoGraphic: img('sl_ui_template'),
  mapDark: img('sl_ui_template'),
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
