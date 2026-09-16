export interface Product {
  slug: string;
  name: string;
  category: string;
  price: number; // ZAR
  description: string;
  imageUrl?: string;
  affiliateUrl: string;
}

export const STORE_PRODUCTS: Product[] = [
  {
    slug: 'itag-hst-01',
    name: 'SafetyLink iTAG BLE Panic Button (HST-01)',
    category: 'Power & Sensors',
    price: 150,
    description: 'Entry-level BLE panic button for the SafetyLink Mesh. Instantly pairs with your mobile app for discreet one-press distress signaling.',
    affiliateUrl: 'https://safetylink.online/#hardware'
  },
  {
    slug: 'poe-security-camera',
    name: '4MP 2K QHD Dome POE Security Camera',
    category: 'Security Cameras',
    price: 579,
    description: 'Industrial-grade IP66 weatherproof dome camera. 2K QHD resolution with full-color night vision and AI human detection. Perfect for NVR integration.',
    affiliateUrl: 'https://temu.to/k/el0b3xc6t0f'
  },
  {
    slug: 'dual-lens-wifi-camera',
    name: 'Dual Lens WiFi Security Camera Outdoor',
    category: 'Security Cameras',
    price: 606,
    description: 'Wireless outdoor PTZ with dual lens. Auto-tracking, full-color night vision, and two-way audio. IP65 rated.',
    affiliateUrl: 'https://temu.to/k/ekgzj2xr5ta'
  },
  {
    slug: 'devo-8mp-ultra-hd',
    name: '8MP Ultra HD POE IP Security Camera',
    category: 'Security Cameras',
    price: 1147,
    description: 'Ultra HD 8MP camera for warehouse & factory surveillance. H.265 compression, full-color night vision, POE compatible.',
    affiliateUrl: 'https://temu.to/k/elzcawnjmc4'
  },
  {
    slug: 'dummy-security-camera',
    name: 'Solar Dummy Security Camera',
    category: 'Security Cameras',
    price: 229,
    description: 'Cost-effective visual deterrent. Solar-powered flashing red LED. Simulated surveillance system for indoor/outdoor use.',
    affiliateUrl: 'https://temu.to/k/e0ctlyiljv9'
  },
  {
    slug: 'rfid-combination-lock',
    name: 'Electronic Combination Lock (IC/RFID)',
    category: 'Access Control',
    price: 321,
    description: 'Keyless entry lock with touch keypad and IC Card/RFID support. Ideal for lockers, wardrobes, and office cabinets.',
    affiliateUrl: 'https://temu.to/k/e6txf0k7l5g'
  },
  {
    slug: 'wall-mounted-key-box',
    name: 'Wall Mounted Key Box',
    category: 'Access Control',
    price: 410,
    description: 'Waterproof combination lock box. Large capacity for spare house keys. Durable outdoor construction.',
    affiliateUrl: 'https://temu.to/k/ezdhmk0ra6i'
  },
  {
    slug: 'nfc-drawer-lock',
    name: 'NFC Intelligent Drawer Cabinet Lock',
    category: 'Access Control',
    price: 221,
    description: 'Invisible installation (no drill). Supports NFC phone unlocking and card swiping. Secures desks and bedside tables.',
    affiliateUrl: 'https://temu.to/k/e4i99xflv5z'
  },
  {
    slug: 'tactical-cargo-pants',
    name: 'Tactical Cargo Pants (Multi-Pocket)',
    category: 'Tactical Gear',
    price: 404,
    description: 'Durable, wear-resistant cargo pants with multi-pocket design. All-season professional style for responders.',
    affiliateUrl: 'https://temu.to/k/eu1emsrx8vt'
  },
  {
    slug: 'tactical-boots',
    name: 'Lightweight Breathable Tactical Boots',
    category: 'Tactical Gear',
    price: 729,
    description: 'All-season ankle support boots. Shock absorption and anti-slip sole suitable for outdoor operations.',
    affiliateUrl: 'https://temu.to/k/ee990l2ymxu'
  },
  {
    slug: 'tactical-vest',
    name: 'Adjustable Tactical Vest',
    category: 'Tactical Gear',
    price: 480,
    description: 'Breathable lightweight utility vest. Adjustable Molle system for carrying comms and gear.',
    affiliateUrl: 'https://temu.to/k/eeqt64qkh4x'
  },
  {
    slug: 'security-scanner-wand',
    name: 'Handheld Security Body Scanner Wand',
    category: 'Tactical Gear',
    price: 215,
    description: 'Portable metal detector with adjustable sensitivity. Includes battery. Essential for access control checkpoints.',
    affiliateUrl: 'https://temu.to/k/e4idrvtembu'
  },
  {
    slug: 'high-vis-vest',
    name: 'High Visibility Security Vest',
    category: 'Tactical Gear',
    price: 302,
    description: '9-pocket reflective safety vest. ANSI/ISEA compliant for night-time patrols and emergency response.',
    affiliateUrl: 'https://temu.to/k/ewqmqljcya7'
  },
  {
    slug: '1080p-dash-cam',
    name: '1080P Full HD Dash Cam DVR',
    category: 'Vehicle Security',
    price: 967,
    description: 'Center console LCD car DVR. 170° wide angle, WDR night vision, and 24h parking monitor.',
    affiliateUrl: 'https://temu.to/k/eizle52sdxr'
  },
  {
    slug: 'anti-theft-car-system',
    name: '12V Car Anti-Theft System',
    category: 'Vehicle Security',
    price: 684,
    description: 'Keyless entry system with one-button start, remote engine start/stop, and central locking integration.',
    affiliateUrl: 'https://temu.to/k/e10mpbfygg3'
  },
  {
    slug: 'solar-magnetic-reverse-cam',
    name: 'Solar-Charge Backup Camera System',
    category: 'Vehicle Security',
    price: 3485,
    description: 'HD1080P DVR 7" IPS Monitor. Rechargeable solar magnetic camera, 3-minute installation for trailers/trucks.',
    affiliateUrl: 'https://temu.to/k/ea8cwd0thjs'
  },
  {
    slug: 'solar-panel-kit',
    name: 'Portable Solar Panel Kit',
    category: 'Power & Sensors',
    price: 385,
    description: 'Portable USB solar charger with controller. Lightweight aluminum construction for off-grid operations.',
    affiliateUrl: 'https://temu.to/k/edmjjxtxx8f'
  },
  {
    slug: 'solar-charge-controller',
    name: '100A Solar Charge Controller',
    category: 'Power & Sensors',
    price: 160,
    description: '12V/24V compatible smart charge controller for managing backup battery banks.',
    affiliateUrl: 'https://temu.to/k/ek7ktzoz8br'
  },
  {
    slug: 'solar-sound-alarm',
    name: 'Solar Powered Sound & Light Alarm',
    category: 'Power & Sensors',
    price: 356,
    description: '129dB outdoor security alert. Red/Blue strobe lights and motion detection. Weatherproof design.',
    affiliateUrl: 'https://temu.to/k/eihyzcvoerz'
  },
  {
    slug: 'wireless-alarm-system',
    name: 'Wireless Security Alarm System',
    category: 'Power & Sensors',
    price: 335,
    description: 'Infrared motion detector integrated with remote controller. Versatile home/office perimeter security.',
    affiliateUrl: 'https://temu.to/k/e442a2s83in'
  },
  {
    slug: 'smoke-fire-detector',
    name: 'Smoke Alarm Fire Detector',
    category: 'Power & Sensors',
    price: 140,
    description: 'Independent photoelectric sensor detector. High sensitivity sound and light alarm for early warning.',
    affiliateUrl: 'https://temu.to/k/eouhn5zuwkm'
  }
];
