import { getR2StreamUrl } from './r2Assets';

export interface R2MediaItem {
  id: string;
  title: string;
  category: 'motion-logo' | 'explainer' | 'blueprint' | 'tactical' | 'hardware' | 'ambient';
  type: 'video' | 'image' | 'audio';
  src: string;
  fallbackSrc?: string;
  tag?: string;
  description?: string;
}

// Full catalogue of high-value streaming media from R2 bucket
export const R2_MEDIA_VAULT: R2MediaItem[] = [
  // ── Motion Logos & 3D Brand Identifiers ──
  {
    id: 'logo-3d-anim',
    title: 'SafetyLink 3D Motion Logo',
    category: 'motion-logo',
    type: 'video',
    src: getR2StreamUrl('SafetyLink 3D Animation Logo.mp4'),
    fallbackSrc: '/splash-video.mp4',
    tag: '3D Motion Brand',
    description: 'Autonomous spatial mesh safety ring motion logo.'
  },
  {
    id: 'logo-ecosystem-short',
    title: 'SafetyLink Offline-First Brand Loop',
    category: 'motion-logo',
    type: 'video',
    src: getR2StreamUrl('SafetyLink__Offline-First.mp4'),
    tag: 'Motion Identity',
    description: 'Resilient emergency communications mark.'
  },
  {
    id: 'brand-official-vector',
    title: 'SafetyLink Official Vector Mark',
    category: 'motion-logo',
    type: 'image',
    src: '/logos/New SafetyLink Official Logo.svg',
    tag: 'Official Emblem',
    description: 'High-contrast emerald safety node emblem.'
  },

  // ── Cinematic Explainer Videos ──
  {
    id: 'vid-automates',
    title: 'How SafetyLink Automates Emergency Responses',
    category: 'explainer',
    type: 'video',
    src: getR2StreamUrl('How_SafetyLink_Automates_Emergency_Responses.mp4'),
    tag: 'Automated Response',
    description: 'Multi-tiered response triggers, instant voice dispatch, and guard routing.'
  },
  {
    id: 'vid-offline-ecosystem',
    title: 'Inside the Offline-First Emergency Ecosystem',
    category: 'explainer',
    type: 'video',
    src: getR2StreamUrl('Inside_SafetyLink_s_Offline-First_Emergency_Ecosystem.mp4'),
    tag: 'Mesh Network',
    description: 'Decentralized store-and-forward protocols and local mesh survival.'
  },
  {
    id: 'vid-escalation-pipelines',
    title: 'How Emergency Escalation Pipelines Work',
    category: 'explainer',
    type: 'video',
    src: getR2StreamUrl('How_Emergency_Escalation_Pipelines_Work.mp4'),
    tag: 'Escalation Pipeline',
    description: 'Sequential failovers: Push -> BLE -> SMS/USSD -> VAPI AI voice agent.'
  },
  {
    id: 'vid-hardware-lineup',
    title: 'New Emergency Hardware Lineup',
    category: 'hardware',
    type: 'video',
    src: getR2StreamUrl('SafetyLink_s_New_Emergency_Hardware_Lineup.mp4'),
    tag: 'Hardware Lineup',
    description: 'BLE keyfobs, wearable panic buttons, and rugged solar beacon anchors.'
  },
  {
    id: 'vid-reliability-gap',
    title: 'Standard Panic Apps vs. SafetyLink Mesh',
    category: 'explainer',
    type: 'video',
    src: getR2StreamUrl('The_Reliability_Gap__Standard_Panic_Apps_vs.mp4'),
    tag: 'Reliability Comparison',
    description: 'Why standard cloud panic buttons fail when power or cell grids drop.'
  },
  {
    id: 'vid-ecosystem-full',
    title: 'SafetyLink Core Emergency Ecosystem',
    category: 'explainer',
    type: 'video',
    src: getR2StreamUrl('SafetyLink_Ecosystem.mp4'),
    tag: 'Global Architecture',
    description: 'Complete platform walkthrough from distress trigger to tactical dispatch.'
  },
  {
    id: 'vid-petal-cyber',
    title: 'High-Velocity Spatial Telemetry',
    category: 'ambient',
    type: 'video',
    src: getR2StreamUrl('petal_20260906_213751.mp4'),
    tag: 'Cyber Telemetry',
    description: 'Real-time telemetry and network mesh activity stream.'
  },
  {
    id: 'vid-petal-radar',
    title: 'Grid Sensor Sweep & Beacon Proximity',
    category: 'ambient',
    type: 'video',
    src: getR2StreamUrl('petal_20260720_022023.mp4'),
    tag: 'Beacon Sweep',
    description: 'Continuous background scanning loop across 2.4GHz channels.'
  },

  // ── Blueprints & Architectural Diagrams ──
  {
    id: 'blueprint-architecture-anatomy',
    title: 'System Architecture Anatomy & Relay Matrix',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('Emergency_System_Architecture_Anatomy.png'),
    tag: 'Anatomy Blueprint',
    description: 'Layered diagram showing edge sensor drivers, local SQLite cache, and cloud gateway.'
  },
  {
    id: 'blueprint-platform-overview',
    title: 'Emergency Response Platform Architecture',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png'),
    tag: 'Architecture Overview',
    description: 'Full network topology from student/resident keyfob to central command room.'
  },
  {
    id: 'blueprint-mesh-overview',
    title: 'Emergency Mesh Platform Overview',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('Emergency_Mesh_Platform_Overview.png'),
    tag: 'Mesh Topology',
    description: 'Decentralized peer-to-peer relay structure without single points of failure.'
  },
  {
    id: 'blueprint-system-architecture',
    title: 'Safety Response System Architecture',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('Emergency_Response_System_Architecture.png'),
    tag: 'System Architecture',
    description: 'Subsystem routing: panic ingestion, Pusher real-time, Twilio SMS, and Cloudflare Worker.'
  },
  {
    id: 'blueprint-universal-resilience',
    title: 'Universal Resilience Comparison Sheet',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('SafetyLink_Universal_Resilience_Comparison.png'),
    tag: 'Resilience Benchmark',
    description: 'Matrix comparing SafetyLink mesh vs. conventional alarm monitoring.'
  },
  {
    id: 'blueprint-security-ecosystem',
    title: 'Security Ecosystem Comparison Sheet',
    category: 'blueprint',
    type: 'image',
    src: getR2StreamUrl('Security_Ecosystem_Comparison_Sheet.png'),
    tag: 'Ecosystem Matrix',
    description: 'Feature comparison of lone-worker, estate, campus, and industrial safety modes.'
  },

  // ── Tactical & Incident Response Visuals ──
  {
    id: 'tactical-drone-patrol',
    title: 'Rapid Patrol & Tactical Dispatch Grid',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('Gemini_Generated_Image_td9rg6td9rg6td9r.png'),
    tag: 'Tactical Grid',
    description: 'Active geo-fence incident perimeter and responding guard telemetry.'
  },
  {
    id: 'tactical-command-deck',
    title: 'Command Deck High-Density Telemetry',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('IMG_20260914_221811.png'),
    tag: 'Command Deck',
    description: 'Multi-screen dispatch dashboard tracking incidents and fleet vehicles.'
  },
  {
    id: 'tactical-spatial-network',
    title: 'Spatial Sensor Network & Indoor Trilateration',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('IMG_20260914_223311.png'),
    tag: 'Spatial Triangulation',
    description: 'Multilevel indoor position coordinates computed via RSSI weighting.'
  },
  {
    id: 'tactical-dispatch-center',
    title: 'Central Incident Control Operations',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('Polish_20260809_161140255.png'),
    tag: 'Dispatch Operations',
    description: 'Live incident queue and multi-channel notification console.'
  },
  {
    id: 'tactical-estate-perimeter',
    title: 'Residential Estate & Gated Community Perimeter',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('Gemini_Generated_Image_1eu4fz1eu4fz1eu4.png'),
    tag: 'Estate Perimeter',
    description: 'Perimeter fence telemetry and family emergency network integration.'
  },
  {
    id: 'tactical-corporate-muster',
    title: 'Corporate Campus & Muster Point Safety Grid',
    category: 'tactical',
    type: 'image',
    src: getR2StreamUrl('Gemini_Generated_Image_41892s41892s4189.png'),
    tag: 'Enterprise Campus',
    description: 'Automated staff headcount and stairwell emergency beacons.'
  },

  // ── Hardware Peripherals & Teardowns ──
  {
    id: 'hw-itag-teardown',
    title: 'HST-01 Wearable Panic Tag Component Teardown',
    category: 'hardware',
    type: 'image',
    src: getR2StreamUrl('Polish_20260819_020134421.jpg'),
    tag: 'Hardware Teardown',
    description: 'Internal circuit board, nRF52 BLE transmitter, piezo alarm, and CR2032 bay.'
  },
  {
    id: 'hw-rugged-beacon',
    title: 'Rugged Fixed Mesh Relay Assembly',
    category: 'hardware',
    type: 'image',
    src: getR2StreamUrl('Polish_20260907_043403519.jpg'),
    tag: 'Industrial Beacon',
    description: 'High-gain external antenna for stairwells, basements, and mining shafts.'
  },
  {
    id: 'hw-macro-trigger',
    title: 'Ergonomic Wearable Distress Switch',
    category: 'hardware',
    type: 'image',
    src: getR2StreamUrl('Polish_20260907_010722614.jpg'),
    tag: 'Tactile Switch',
    description: 'Blind-activation tactile momentary button prevents false positives.'
  },
  {
    id: 'hw-limx-autonomous',
    title: 'Autonomous Mobile Patrol & Sensor Carrier',
    category: 'hardware',
    type: 'image',
    src: getR2StreamUrl('limx dynamics.jpg'),
    tag: 'Robotic Node',
    description: 'Mobile mesh extender for perimeter patrol and hazmat reconnaissance.'
  },
  {
    id: 'hw-field-beacon-close',
    title: 'Sub-GHz Mesh Relay Antenna & Enclosure',
    category: 'hardware',
    type: 'image',
    src: getR2StreamUrl('IMG_20260907_040700.jpg'),
    tag: 'Outdoor Enclosure',
    description: 'Weatherproof IP68 casing for perimeter poles and school rooftops.'
  }
];

// Helper to filter items by category
export const getMediaByCategory = (category: R2MediaItem['category']) => {
  return R2_MEDIA_VAULT.filter((item) => item.category === category);
};

// Continuous background cycling playlist (combines videos and high-res posters)
export const BACKGROUND_CYCLE_PLAYLIST: R2MediaItem[] = [
  R2_MEDIA_VAULT.find((i) => i.id === 'vid-automates')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'blueprint-architecture-anatomy')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'vid-offline-ecosystem')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'tactical-drone-patrol')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'vid-escalation-pipelines')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'hw-itag-teardown')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'vid-hardware-lineup')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'blueprint-mesh-overview')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'logo-3d-anim')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'tactical-command-deck')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'vid-reliability-gap')!,
  R2_MEDIA_VAULT.find((i) => i.id === 'hw-rugged-beacon')!
].filter(Boolean);

// ── ROTATING R2 MEDIA ENGINE HOOKS (100+ ASSETS) ──
import { useState, useEffect } from 'react';

/**
 * Hook to continuously rotate through an array of media items/URLs every intervalMs.
 * If an item fails to load (onError), it automatically advances to the next item so no broken box appears.
 */
export function useRotatingMedia<T>(items: T[], intervalMs = 8000, enabled = true) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || !items || items.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [items, intervalMs, enabled]);

  const next = () => setIndex((prev) => (prev + 1) % (items.length || 1));
  const prev = () => setIndex((prev) => (prev - 1 + (items.length || 1)) % (items.length || 1));
  const handleMediaError = () => {
    // Automatically skip forward to avoid showing broken media
    next();
  };

  const currentItem = items && items.length > 0 ? items[index % items.length] : null;

  return {
    currentItem,
    currentIndex: index,
    totalCount: items?.length || 0,
    next,
    prev,
    setIndex,
    handleMediaError,
  };
}

