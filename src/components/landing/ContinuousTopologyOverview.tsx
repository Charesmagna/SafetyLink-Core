import React, { useState, useEffect } from 'react';
import { Layers, Maximize2, Shield, Radio, Cpu, RefreshCw, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { R2_MEDIA, getR2StreamUrl } from '../../utils/r2Assets';

interface ContinuousTopologyOverviewProps {
  activePage: string;
}

interface TopologyDiagramItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  imageSrc: string;
  technicalDetails: string[];
}

const PAGE_TOPOLOGY_MAP: Record<string, TopologyDiagramItem[]> = {
  home: [
    {
      id: 'global-network',
      title: 'SafetyLink Multi-Tier Mesh & Voice Dispatch Architecture',
      tag: 'Global Ecosystem',
      description: 'End-to-end failover topology: Physical BLE SOS button -> Multi-path repeater nodes -> Edge cellular gateways -> Live VAPI voice dispatch & guard telemetry.',
      imageSrc: R2_MEDIA.architecture.responseOverview,
      technicalDetails: [
        'Store-and-forward SQLite offline queue',
        'Direct USSD/SMS fallback transmission',
        'Sub-second BLE beacon discovery (0.32s avg)',
        'Autonomous geo-fencing failover loop'
      ]
    },
    {
      id: 'mesh-platform',
      title: 'Decentralized Hardware Mesh Interconnect',
      tag: 'Autonomous Mesh',
      description: 'Zero-cloud dependency mesh relay connecting fixed beacon anchors, moving guard vehicles, and wearable panic remotes.',
      imageSrc: R2_MEDIA.architecture.meshPlatformOverview,
      technicalDetails: [
        'Frequency: 2.4GHz BLE + Sub-GHz LoRa',
        'Hop-limit: 7 hops without latency decay',
        'AES-256 encrypted payload packets',
        'Battery lifespan: 18-24 months per beacon'
      ]
    },
    {
      id: 'system-anatomy',
      title: 'System Architecture Anatomy & Relay Matrix',
      tag: 'Deep Technical Blueprint',
      description: 'Internal module wiring showing the separation between edge device drivers, local offline caches, and cloud bridge sync.',
      imageSrc: R2_MEDIA.architecture.systemAnatomy,
      technicalDetails: [
        'Non-blocking background location poller',
        'Capacitor native bridge with push fallback',
        'Zero-trust cryptographic node verification',
        'Automated responder incident assignment'
      ]
    }
  ],
  hardware: [
    {
      id: 'hardware-teardown',
      title: 'HST-01 Wearable Panic Tag Micro-Architecture',
      tag: 'HST-01 Tag',
      description: 'Internal components: Waterproof tactile momentary switch, low-power CR2032 power cell, Nordic Semiconductor nRF52 BLE SoC, and high-decibel piezo buzzer.',
      imageSrc: R2_MEDIA.hardware.itagTeardown,
      technicalDetails: [
        'IP67 water and dust resistance rating',
        'Recessed panic switch prevents false positives',
        'Continuous ping interval: 1000ms idle / 200ms panic',
        'Weight: 8.4 grams'
      ]
    },
    {
      id: 'rugged-beacon',
      title: 'Industrial Fixed Mesh Relay Node Assembly',
      tag: 'Fixed Relay Node',
      description: 'Heavy-duty wall-mounted beacon anchor designed for parking garages, school stairwells, mines, and load-shedding zones.',
      imageSrc: R2_MEDIA.hardware.ruggedBeacon,
      technicalDetails: [
        'Solar + Supercapacitor dual backup',
        'Omnidirectional 5dBi gain antenna',
        'Surge protection up to 6kV',
        'Real-time temperature & battery telemetry'
      ]
    },
    {
      id: 'itag-macro',
      title: 'Ergonomic Wearable Form Factor',
      tag: 'Field Hardware',
      description: 'Tactile lanyard and keyring enclosure designed for single-motion blind panic triggers under extreme duress.',
      imageSrc: R2_MEDIA.hardware.itagMacro,
      technicalDetails: [
        'High-contrast safety ring indicator',
        'Braille tactile confirmation pip',
        'Drop-tested up to 3 meters on concrete',
        'Non-allergenic polycarbonate chassis'
      ]
    }
  ],
  platform: [
    {
      id: 'platform-control',
      title: 'Autonomous Dispatch & Multitenant Console Topology',
      tag: 'Command Deck',
      description: 'Live operations center topology connecting emergency operators, fleet vehicles, private security response units, and municipal services.',
      imageSrc: R2_MEDIA.platform.dispatchControl,
      technicalDetails: [
        'Sub-100ms multi-node live sync via Pusher/WS',
        'Interactive Leaflet GIS mapping with live GPS trails',
        'One-click incident escalation & broadcast',
        'Encrypted evidentiary voice & video playback'
      ]
    },
    {
      id: 'telemetry-grid',
      title: 'High-Density Spatial Sensor Grid & RSSI Triangulation',
      tag: 'Spatial GIS',
      description: 'Indoor multi-floor beacon positioning with weighted RSSI trilateration for pinpointing distress calls in multi-story buildings.',
      imageSrc: R2_MEDIA.platform.networkGrid,
      technicalDetails: [
        'Triangulation accuracy: ±1.8 meters indoor',
        'Floor-level vertical z-index resolution',
        'Automated nearest-responder routing',
        'Offline building schematics caching'
      ]
    }
  ],
  usecases: [
    {
      id: 'corporate-campus',
      title: 'Enterprise Campus & Muster Point Verification Topology',
      tag: 'Enterprise Safety',
      description: 'Automated staff headcount, panic tracking in remote stairwells, and lone-worker check-in sequences.',
      imageSrc: R2_MEDIA.usecases.corporateCampus,
      technicalDetails: [
        'Seamless integration with turnstiles & access cards',
        'Automated lone-worker inactivity alerts',
        'Floor marshal command tablet synchronization',
        'OSHA compliance automated reporting'
      ]
    },
    {
      id: 'estate-community',
      title: 'Residential Estate & Gated Community Security Network',
      tag: 'Estate Mesh',
      description: 'Perimeter fence telemetry, resident wearable SOS remotes, rapid gate security notification, and armed patrol dispatch.',
      imageSrc: R2_MEDIA.usecases.estateCommunity,
      technicalDetails: [
        'Zero false alarm dual-tap sequence',
        'Direct gate guard intercom buzzer bridge',
        'Family alert ring simultaneously notified',
        'Works during complete cellular grid outages'
      ]
    }
  ]
};

export const ContinuousTopologyOverview: React.FC<ContinuousTopologyOverviewProps> = ({ activePage }) => {
  const diagrams = PAGE_TOPOLOGY_MAP[activePage] || PAGE_TOPOLOGY_MAP.home;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Reset or adjust index when activePage changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activePage]);

  // Auto-cycle through diagrams every 10 seconds if not hovered/paused
  useEffect(() => {
    if (!isAutoCycling || diagrams.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % diagrams.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isAutoCycling, diagrams.length]);

  const current = diagrams[selectedIndex] || diagrams[0];

  return (
    <div 
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsAutoCycling(false)}
      onMouseLeave={() => setIsAutoCycling(true)}
    >
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2 font-mono text-xs text-emerald-400 uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>// CONTINUOUS TOPOLOGY OVERVIEW • {activePage.toUpperCase()} SECTION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Tab & Cycle Selectors */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {diagrams.map((d, idx) => (
              <button
                key={d.id}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  idx === selectedIndex
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedIndex((prev) => (prev - 1 + diagrams.length) % diagrams.length)}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Previous diagram"
              aria-label="Previous diagram"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedIndex((prev) => (prev + 1) % diagrams.length)}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title="Next diagram"
              aria-label="Next diagram"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram Viewer */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 group">
        <div className="relative min-h-[320px] max-h-[580px] flex items-center justify-center overflow-hidden">
          <img
            key={current.imageSrc}
            src={current.imageSrc}
            alt={current.title}
            className="w-full h-auto max-h-[580px] object-contain transition-transform duration-700 group-hover:scale-[1.01]"
          />
        </div>

        {/* Technical Spec Strip overlay */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
            {current.technicalDetails.map((detail, i) => (
              <div key={i} className="flex items-start gap-1.5 text-slate-300 font-mono">
                <span className="text-emerald-400 font-bold shrink-0">›</span>
                <span className="leading-snug">{detail}</span>
              </div>
            ))}
          </div>

          <a
            href={current.imageSrc}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 hover:scale-105"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Inspect Full HD Blueprint</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
};
