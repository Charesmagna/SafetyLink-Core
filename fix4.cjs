const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const HARDWARE_CATALOG = `const HARDWARE_CATALOG: HardwareProduct[] = [
  { id: 'prod-cam-2pack', name: '2-Pack Wireless WiFi Cameras', description: 'Dual-view system for small apartments and indoor monitoring.', priceZAR: 950, category: 'BaseStation', icon: '📹' },
  { id: 'prod-cam-4pack', name: '4-Pack Wireless WiFi Cameras', description: 'Perimeter package for full residential properties or small businesses.', priceZAR: 1650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-pulse', name: 'RFD BLE Beacon (SafetyLink Pulse)', description: 'Long-range safety beacon for personal distress tracking.', priceZAR: 450, category: 'Wearable', icon: '🔘' },
  { id: 'prod-doorlock', name: 'Smart Fingerprint Door Lock', description: 'Smart access control lock with fingerprint and remote access.', priceZAR: 1150, category: 'BaseStation', icon: '🔒' },
  { id: 'prod-elderly-watch', name: 'Elderly SOS Watch GPS Tracking Wristband', description: 'GPS tracking watch with emergency SOS button.', priceZAR: 850, category: 'Wearable', icon: '⌚' },
  { id: 'prod-gps-tracker', name: 'GPS Smart Tracker Anti-Loss Device (Bluetooth)', description: 'Bluetooth anti-loss device for keys and personal items.', priceZAR: 220, category: 'Wearable', icon: '📍' },
  { id: 'prod-smart-ring', name: 'Smart Ring Set (Includes Zikr Ring & 99 Beads)', description: 'Discreet smart ring for subtle emergency triggering.', priceZAR: 150, category: 'Wearable', icon: '💍' },
  { id: 'prod-2day-cam', name: '2 Days Security Camera System Kit (4 Channel 1080p)', description: 'Complete 4-channel security camera kit.', priceZAR: 2650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-hikvision', name: 'Hikvision Original CCTV Camera (Mini Bullet)', description: 'High-quality mini bullet CCTV camera by Hikvision.', priceZAR: 2950, category: 'BaseStation', icon: '📹' },
  { id: 'prod-wifi-cam', name: 'Security Wi-Fi Camera Night Vision (360° View)', description: '360° view Wi-Fi camera with night vision.', priceZAR: 380, category: 'BaseStation', icon: '📹' },
  { id: 'prod-mobile-dvr', name: 'Mobile DVR (4G, GPS, WiFi, AI)', description: 'Mobile digital video recorder with 4G and GPS capabilities.', priceZAR: 1950, category: 'BaseStation', icon: '📼' },
  { id: 'prod-dash-cam', name: 'Dash Cam X30 (GPS Video Driving Recorder)', description: 'Dash camera for driving recording and GPS tracking.', priceZAR: 1050, category: 'Wearable', icon: '🚗' },
  { id: 'prod-cam-detector', name: 'Smart Hidden Camera Detector', description: 'Detector for finding hidden cameras and listening devices.', priceZAR: 280, category: 'Wearable', icon: '🔍' },
  { id: 'prod-power-station', name: 'S81MAX Portable Power Station (120W, 30000mAh)', description: 'Portable power station for backup power.', priceZAR: 490, category: 'BaseStation', icon: '🔋' },
  { id: 'prod-remote-switch', name: 'Wireless Remote Control Switch (DC 85V-256V 30A)', description: 'Wireless remote control switch for power automation.', priceZAR: 300, category: 'BaseStation', icon: '🔌' },
  { id: 'prod-solar-alarm', name: 'Solar Motion Sensor Alarm (No Wires)', description: 'Solar-powered motion sensor alarm.', priceZAR: 320, category: 'BaseStation', icon: '☀️' },
  { id: 'prod-lamp-holder', name: 'Human Infrared Sensing Lamp Holder', description: 'Lamp holder with human infrared sensing.', priceZAR: 95, category: 'BaseStation', icon: '💡' },
  { id: 'prod-guard-tour', name: 'RFID Security Patrol Guard Tour System', description: 'RFID guard tour system for security patrols.', priceZAR: 3850, category: 'Relay', icon: '👮' },
  { id: 'prod-molle-jacket', name: 'Tactical Protective Molle Jacket', description: 'Tactical protective jacket for security personnel.', priceZAR: 2900, category: 'Wearable', icon: '🦺' },
  { id: 'prod-pepper-spray', name: 'Maximum Strength Pepper Spray (with UV Dye)', description: 'Maximum strength pepper spray with UV marking dye.', priceZAR: 110, category: 'Wearable', icon: '🌶️' },
  { id: 'prod-drone-box', name: 'DJI Dock 2 Automated Station', description: 'Drone-in-a-box solution for automated perimeter overwatch.', priceZAR: 125000, category: 'Drone', icon: '🚁' },
  { id: 'prod-tethered', name: 'Tethered Overwatch System', description: 'Continuous power aerial overwatch platform.', priceZAR: 85000, category: 'Drone', icon: '🛸' },
];`;

code = code.replace(/const HARDWARE_CATALOG: HardwareProduct\[\] = \[[\s\S]*?\];/, HARDWARE_CATALOG);
fs.writeFileSync('src/components/LandingPage.tsx', code);
