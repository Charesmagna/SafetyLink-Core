import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { useAppStore } from '../utils/store';

import slide1 from '../assets/images/safetylink_officer_phone_1783207722148.jpg';
import slide2 from '../assets/images/safetylink_team_tablet_1783207733837.jpg';
import slide3 from '../assets/images/regenerated_image_1783360733591.jpg';
import slide4 from '../assets/images/safetylink_control_center_1783424754132.jpg';
import slide5 from '../assets/images/safetylink_campus_patrol_1783424770332.jpg';

interface VideoClip {
  id: string;
  title: string;
  duration: string;
  description: string;
  category: 'WALKTHROUGH' | 'HARDWARE' | 'COMMAND' | 'OFFLINE';
  coverSlide: string;
  accentColor: string;
}

export const MediaHub: React.FC = () => {
  const { addAuditLog } = useAppStore();
  const [activeClip, setActiveClip] = useState<VideoClip | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const driveFolderUrl = "https://drive.google.com/drive/folders/1ydc2nblVZd1f9DNQWN9gZ7e_TebppMFD?usp=sharing";

  const clips: VideoClip[] = [
    {
      id: 'clip-1',
      title: 'SafetyLink Core System & SOS Dispatch',
      duration: '0:45',
      description: 'A walkthrough demonstrating physical panic triggers, GPS lock mechanisms, and local escalation chains.',
      category: 'WALKTHROUGH',
      coverSlide: slide1,
      accentColor: '#ef4444' // Red
    },
    {
      id: 'clip-2',
      title: 'Wearable iTAG BLE Bonding Guide',
      duration: '1:12',
      description: 'Simple instructions to configure generic iTAG hardware buttons via GATT-characteristic auto-discovery.',
      category: 'HARDWARE',
      coverSlide: slide2,
      accentColor: '#10b981' // Emerald
    },
    {
      id: 'clip-3',
      title: 'Security Command Center Deck SOP',
      duration: '2:05',
      description: 'Operational protocols for Dispatchers handling emergency panic states, managing responder squads, and pushing custom tools.',
      category: 'COMMAND',
      coverSlide: slide4,
      accentColor: '#8b5cf6' // Purple
    },
    {
      id: 'clip-4',
      title: 'Load-Shedding & Offline Grid GIS Recovery',
      duration: '1:50',
      description: 'Standard operating procedures under complete network loss using preloaded geo-cache maps.',
      category: 'OFFLINE',
      coverSlide: slide5,
      accentColor: '#f59e0b' // Amber
    }
  ];

  const logoAssets = [
    { name: 'Dark Mode High-Contrast Logo (JPG)', size: '256KB', type: 'JPG' },
    { name: 'Clean Transparent Vector Asset (PNG)', size: '112KB', type: 'PNG' },
    { name: 'Cooperative TM Media Solution Banner (PNG)', size: '420KB', type: 'PNG' }
  ];

  // Slide slideshow loop for the local card backgrounds
  const mediaSlides = [slide1, slide2, slide4, slide5, slide3];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mediaSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [mediaSlides.length]);

  const handleSimulatePlay = (clip: VideoClip) => {
    setActiveClip(clip);
    addAuditLog('SYSTEM', 'INFO', `Simulated playback of informational clip: ${clip.title}`);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 text-left space-y-5 shadow relative overflow-hidden">
      {/* Cinematic Background Image Slideshow on the entire MediaHub card backdrop for high-fidelity ambient feel */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.14 }} // Subtle 14% opacity for optimal component contrast
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={mediaSlides[currentSlide]}
              alt="Media Ambient Slide"
              className="w-full h-full object-cover filter brightness-[0.4] saturate-[0.8]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 digital-grid opacity-[0.04]" />
      </div>

      {/* Header section with brand partnership indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <SafetyLinkLogo size={22} glowColor="rgba(245, 158, 11, 0.4)" />
          <div>
            <h2 className="text-xs font-black tracking-widest font-mono uppercase text-slate-100 flex items-center gap-1.5">
              🎓 SAFETY LINK MEDIA LIBRARY
            </h2>
            <p className="text-[7.5px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">
              Powered by TM Media Solutions
            </p>
          </div>
        </div>

        <a
          href={driveFolderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-mono text-[9px] font-black rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>📂</span>
          <span>Open G-Drive Clips Folder</span>
        </a>
      </div>

      <p className="text-[11px] font-sans text-slate-400 leading-relaxed relative z-10">
        Review core instructional video clips, deployment webinars, and official brand assets provided in cooperation with <strong className="text-amber-400 font-mono">TM Media Solutions</strong>. Download official materials directly to maintain compliance and uniform visual identification.
      </p>

      {/* Grid of video clips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="group relative bg-slate-950/85 border border-slate-900 hover:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all overflow-hidden"
          >
            {/* Dynamic Card Mini-slideshow: a background overlay displaying the coverSlide with smooth hover animations */}
            <div className="absolute inset-0 z-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
              <img
                src={clip.coverSlide}
                alt={clip.title}
                className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.2] scale-105 group-hover:scale-100 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-950/50" />
            </div>

            <div className="space-y-1.5 relative z-10">
              <div className="flex items-center justify-between">
                <span
                  className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase border tracking-wider"
                  style={{
                    color: clip.accentColor,
                    borderColor: `${clip.accentColor}30`,
                    backgroundColor: `${clip.accentColor}10`
                  }}
                >
                  {clip.category}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-black">⏱️ {clip.duration}</span>
              </div>
              <h3 className="text-[11px] font-bold text-slate-100 group-hover:text-amber-400 transition-colors leading-snug">
                {clip.title}
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                {clip.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 relative z-10 pt-1.5">
              <button
                onClick={() => handleSimulatePlay(clip)}
                className="py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-[8.5px] font-mono font-bold rounded-lg uppercase tracking-wider border border-slate-800 transition-colors"
              >
                🎬 Play Stream
              </button>
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 bg-slate-900/40 hover:bg-slate-900 hover:border-amber-500/30 text-amber-400 text-[8.5px] font-mono font-bold rounded-lg uppercase tracking-wider border border-slate-900 text-center transition-all"
              >
                📥 Direct Drive
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Brand assets panel */}
      <div className="bg-slate-950/65 border border-slate-900 rounded-2xl p-4 space-y-3 relative z-10 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-amber-500/2 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs">📐</span>
            <h3 className="text-[10px] font-black uppercase text-slate-200 tracking-wider font-mono">
              Official Brand Identity & Logos
            </h3>
          </div>
          <span className="text-[7.5px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
            Drive Assets Linked
          </span>
        </div>

        <div className="space-y-2 relative z-10">
          {logoAssets.map((asset, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2.5 bg-slate-900/40 border border-slate-900/60 rounded-xl text-[9.5px] hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{asset.type === 'JPG' ? '🖼️' : '📐'}</span>
                <div className="text-left font-mono">
                  <p className="font-extrabold text-slate-300">{asset.name}</p>
                  <p className="text-[8px] text-slate-500">File size: {asset.size} // Media Standard</p>
                </div>
              </div>
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-mono text-[8.5px] font-bold rounded border border-amber-500/15 transition-all uppercase tracking-wider"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Simulated High-Fidelity Video Playback Modal Overlay */}
      <AnimatePresence>
        {activeClip && (
          <div className="fixed inset-0 bg-slate-950/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative overflow-hidden"
            >
              {/* Animated Slideshow Backdrop behind the video modal container */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08] select-none">
                <img
                  src={activeClip.coverSlide}
                  alt={activeClip.title}
                  className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.1]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveClip(null)}
                className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all z-50 text-xs"
              >
                ✕
              </button>

              <div className="space-y-1 relative z-10">
                <span className="text-[8px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  🎥 Live Stream Simulator
                </span>
                <h3 className="text-xs font-black uppercase text-slate-100 font-mono tracking-wider pt-1">
                  {activeClip.title}
                </h3>
              </div>

              {/* Simulated High-Fidelity Video Feed Container */}
              <div className="relative aspect-video bg-black rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between p-3.5 select-none z-10">
                {/* Background clip image with moving scanning lines */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={activeClip.coverSlide}
                    alt={activeClip.title}
                    className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.2] saturate-[0.85] scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Dynamic digital grids */}
                  <div className="absolute inset-0 digital-grid opacity-20" />
                  <div className="absolute inset-0 scanlines opacity-30" />
                  <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80" />
                </div>

                {/* HUD Top metrics */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-red-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[8px] font-mono font-black text-red-400 uppercase tracking-widest">LIVE STREAMING</span>
                  </div>
                  <div className="bg-black/60 px-2 py-1 rounded-md text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">
                    SRC: TM_MEDIA_NODE_001
                  </div>
                </div>

                {/* Center play icon or loading sequence */}
                <div className="flex flex-col items-center justify-center relative z-10 flex-1 space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl animate-pulse cursor-pointer hover:scale-105 transition-transform shadow-lg">
                    ▶
                  </div>
                  <span className="text-[9px] font-mono text-slate-300 font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-md">
                    Click to load 1080p stream
                  </span>
                </div>

                {/* HUD Bottom status bar */}
                <div className="flex justify-between items-center relative z-10 text-[7.5px] font-mono text-slate-500 uppercase tracking-wider bg-black/40 px-2.5 py-1.5 rounded-xl">
                  <span>TM Media Secure Player v1.2</span>
                  <span>FPS: 60.0 // BITRATE: 4.8MBPS</span>
                  <span className="text-amber-400">DEC: HEVC</span>
                </div>
              </div>

              {/* Informational description */}
              <div className="space-y-3 relative z-10 text-left">
                <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
                  This clip covers the operational protocols, layout specifications, and deployment criteria for our active campus grids. To download the actual pristine video file to your local computer, open the official Drive Folder link.
                </p>

                <div className="grid grid-cols-2 gap-3.5">
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-[10px] font-mono font-black rounded-xl uppercase tracking-wider text-center transition-all shadow"
                  >
                    📥 Download Original Video
                  </a>
                  <button
                    onClick={() => setActiveClip(null)}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-mono font-black rounded-xl uppercase tracking-wider transition-colors border border-slate-850"
                  >
                    Close Player
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
