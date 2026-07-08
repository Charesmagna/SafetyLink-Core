import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const PanicButton: React.FC = () => {
  const { activeSOSState, triggerPanic, cancelSOS, drillMode } = useAppStore();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Dynamic Device Detection & Layout Ergonomics state
  const [deviceInfo, setDeviceInfo] = useState({
    os: 'Detecting...',
    type: 'Evaluating...',
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667,
    isTouch: false,
  });
  const [buttonLocation, setButtonLocation] = useState<'default' | 'ergonomic-thumb' | 'ergonomic-left'>('default');

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent || '';
      let os = 'Desktop Platform';
      let type = 'Standard Terminal';
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

      if (/android/i.test(ua)) {
        os = 'Android Device';
        type = 'Handheld Node';
      } else if (/iPad|iPhone|iPod/.test(ua)) {
        os = 'iOS Device';
        type = 'Handheld Node';
      } else if (/Macintosh/i.test(ua)) {
        os = 'macOS Desktop';
      } else if (/Windows/i.test(ua)) {
        os = 'Windows Terminal';
      } else if (/Linux/i.test(ua)) {
        os = 'Linux Terminal';
      }

      if (window.innerWidth < 480) {
        type = 'Compact Mobile';
      } else if (window.innerWidth < 768) {
        type = 'Mobile Viewport';
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        type = 'Tablet Deck';
      }

      setDeviceInfo({
        os,
        type,
        width: window.innerWidth,
        height: window.innerHeight,
        isTouch,
      });

      // Proactively default to ergonomic thumb shift on actual compact mobile screens to assist single-handed use
      if (window.innerWidth < 480) {
        setButtonLocation('ergonomic-thumb');
      }
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (activeSOSState !== 'IDLE') return;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 1500, 1); // 1.5 seconds hold down
      setHoldProgress(progress);

      if (progress >= 1) {
        clearInterval(holdIntervalRef.current!);
        setIsHolding(false);
        setHoldProgress(0);
        triggerPanic("Critical panic beacon initiated manually via interactive mission-control cockpit trigger.");
      }
    }, 30);
  };

  const stopHolding = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="carbon-panel rounded-3xl p-6 shadow-2xl w-full max-w-md mx-auto relative overflow-hidden scanlines lens-flare-overlay"
    >
      {/* Absolute top neon signal guide lines */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-500 ${
        activeSOSState !== 'IDLE' 
          ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 neon-glow-red' 
          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 neon-glow-emerald'
      }`} />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 digital-grid opacity-15 pointer-events-none" />

      <div className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <SafetyLinkLogo 
            size={18} 
            glowColor={activeSOSState !== 'IDLE' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'} 
          />
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.25em] font-display">
            {activeSOSState !== 'IDLE' ? "TRANSMITTING DISTRESS SIGNAL" : "MISSION-CONTROL SOS ACTUATOR"}
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 max-w-[300px] mx-auto leading-relaxed">
          {activeSOSState === 'IDLE' 
            ? "Depress and hold central beacon for 1.5s to initiate sequential security escalation chain." 
            : "Emergency beacon actively transmitting real-time coordinates & ambient diagnostics."}
        </p>
      </div>

      {/* Orbital Actuator Stage */}
      <motion.div 
        animate={{
          x: buttonLocation === 'ergonomic-thumb' ? 22 : buttonLocation === 'ergonomic-left' ? -22 : 0,
          y: buttonLocation !== 'default' ? 10 : 0,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="relative flex items-center justify-center w-64 h-64 mx-auto my-2 z-10"
      >
        
        {/* Radar concentric sweep animations when active */}
        {activeSOSState !== 'IDLE' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.6, opacity: 1 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-full h-full rounded-full border border-red-500/25 bg-red-500/5"
            />
            <motion.div
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 2.0, repeat: Infinity, delay: 0.4, ease: "easeOut" }}
              className="absolute w-full h-full rounded-full border border-orange-500/15"
            />
          </div>
        )}

        {/* Electric Blue connectivity arcs around the button representing active mesh */}
        <div className="absolute inset-0 pointer-events-none rounded-full border border-blue-500/20 scale-110 border-dashed animate-[spin_45s_linear_infinite]" />
        <div className="absolute inset-2 pointer-events-none rounded-full border border-blue-400/10 scale-105" />

        {/* Circular progress path ring */}
        <svg className="absolute w-56 h-56 transform -rotate-90 pointer-events-none">
          <circle
            cx="112"
            cy="112"
            r="96"
            stroke="#1e293b"
            fill="none"
            strokeWidth="5"
          />
          {isHolding && (
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="#ef4444"
              fill="none"
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - holdProgress)}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* 3D Depth Actuator Ring */}
        <div className={`absolute w-48 h-48 rounded-full border transition-all duration-500 flex items-center justify-center ${
          activeSOSState !== 'IDLE'
            ? 'border-red-500/50 bg-red-950/30 shadow-[0_0_50px_rgba(239,68,68,0.45)] animate-glow-ring'
            : 'border-slate-800 bg-slate-950/70 shadow-[inset_0_4px_16px_rgba(0,0,0,0.85)]'
        }`}>
          
          {/* Animated central beacon trigger */}
          <button
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            onClick={() => {
              if (activeSOSState !== 'IDLE') {
                cancelSOS();
              }
            }}
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden select-none outline-none ${
              activeSOSState === 'IDLE'
                ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-950 hover:from-red-500 hover:to-red-900 shadow-[0_20px_45px_rgba(239,68,68,0.5),_inset_0_4px_6px_rgba(255,255,255,0.3),_inset_0_-4px_8px_rgba(0,0,0,0.7)] active:scale-95 border-2 border-red-500/40 hover:shadow-[0_0_55px_rgba(239,68,68,0.75)]'
                : 'bg-slate-950 border border-red-500/40 hover:bg-slate-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]'
            }`}
          >
            {/* Gloss sheen overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

            {activeSOSState === 'IDLE' ? (
              <>
                <motion.div 
                  animate={{ scale: isHolding ? [1, 1.15, 1] : 1 }}
                  transition={{ repeat: isHolding ? Infinity : 0, duration: 0.8 }}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1 text-white border border-white/10 shadow-inner"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <span className="text-white font-black text-2xl tracking-[0.1em] font-display">SOS</span>
                <span className="text-red-200 text-[9px] font-mono font-bold uppercase tracking-widest mt-0.5">
                  HOLD {isHolding ? `${Math.round((1.5 - holdProgress * 1.5) * 10) / 10}S` : "1.5S"}
                </span>
              </>
            ) : (
              <>
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center mb-1 text-red-500 border border-red-500/20 shadow-inner"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
                <span className="text-red-500 font-black text-base tracking-[0.1em] font-display">ACTIVE</span>
                <span className="text-slate-400 text-[8px] font-mono uppercase font-bold tracking-widest mt-1 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-800 hover:text-slate-200">
                  TAP CANCEL
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* SOS Status Steps display */}
      <AnimatePresence>
        {activeSOSState !== 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-4 p-4 bg-slate-950/60 rounded-2xl border border-red-500/20 font-mono text-[11px]"
          >
            <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-900 pb-1.5 mb-2.5">
              <span>SECURITY ROUTING PIPELINE</span>
              <span className="text-red-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                BROADCASTING
              </span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSOSState === 'ACQUIRING_GPS' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className={activeSOSState === 'ACQUIRING_GPS' ? 'text-amber-400 font-bold' : 'opacity-60 text-slate-400'}>
                    1. GPS Triangulation Lock
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">{activeSOSState === 'ACQUIRING_GPS' ? "WAITING" : "LOCKED"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeSOSState === 'ACQUIRING_GPS' ? 'bg-slate-800' :
                    activeSOSState === 'CAPTURING_EVIDENCE' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  <span className={activeSOSState === 'CAPTURING_EVIDENCE' ? 'text-amber-400 font-bold' : 'opacity-60 text-slate-400'}>
                    2. Audio Capture & Uplink
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">
                  {['IDLE', 'ACQUIRING_GPS'].includes(activeSOSState) ? "QUEUED" : activeSOSState === 'CAPTURING_EVIDENCE' ? "UPLINKING" : "COMPLETE"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    ['IDLE', 'ACQUIRING_GPS', 'CAPTURING_EVIDENCE'].includes(activeSOSState) ? 'bg-slate-800' :
                    activeSOSState === 'ESCALATING' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  <span className={activeSOSState === 'ESCALATING' ? 'text-amber-400 font-bold' : 'opacity-60 text-slate-400'}>
                    3. Sequential Alarm Dispatch
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">
                  {['IDLE', 'ACQUIRING_GPS', 'CAPTURING_EVIDENCE'].includes(activeSOSState) ? "QUEUED" : activeSOSState === 'ESCALATING' ? "SENDING" : "SENT"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeSOSState === 'DISPATCHED' ? 'bg-emerald-500 animate-pulse neon-glow-emerald' : 'bg-slate-800'}`} />
                  <span className={activeSOSState === 'DISPATCHED' ? 'text-emerald-400 font-bold' : 'opacity-60 text-slate-400'}>
                    4. Security Dispatch Dispatched
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">{activeSOSState === 'DISPATCHED' ? "EN-ROUTE" : "QUEUED"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ergonomic Device Telemetry & Grip Selector Cockpit Block */}
      <div className="mt-5 p-3.5 bg-slate-950/85 border border-slate-900 rounded-2xl text-left relative z-10 font-mono">
        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2">
          <span className="text-[9px] font-black text-blue-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            COCKPIT TELEMETRY & DEVICE GRIP
          </span>
          <span className="text-[7.5px] text-slate-500 uppercase">SYS-DIAG V1.4</span>
        </div>

        {/* Device properties list */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8.5px] text-slate-400 mb-2.5">
          <div className="flex justify-between border-b border-slate-900/30 pb-0.5">
            <span>Detected OS:</span>
            <span className="text-slate-200 font-bold">{deviceInfo.os}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/30 pb-0.5">
            <span>Viewport:</span>
            <span className="text-slate-200 font-bold">{deviceInfo.width}x{deviceInfo.height}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/30 pb-0.5 col-span-2">
            <span>Device Type:</span>
            <span className="text-slate-200 font-bold uppercase">{deviceInfo.type} ({deviceInfo.isTouch ? "TOUCH READY" : "CURSOR DRIVEN"})</span>
          </div>
        </div>

        {/* Hand Ergonomic Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">
            Single-Hand Touch Thumb Ergonomics:
          </span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setButtonLocation('ergonomic-left')}
              className={`py-1 rounded text-[8px] font-bold border uppercase transition-all ${
                buttonLocation === 'ergonomic-left'
                  ? 'bg-blue-650/80 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              👈 Left Hand
            </button>
            <button
              onClick={() => setButtonLocation('default')}
              className={`py-1 rounded text-[8px] font-bold border uppercase transition-all ${
                buttonLocation === 'default'
                  ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              🎯 Balanced
            </button>
            <button
              onClick={() => setButtonLocation('ergonomic-thumb')}
              className={`py-1 rounded text-[8px] font-bold border uppercase transition-all ${
                buttonLocation === 'ergonomic-thumb'
                  ? 'bg-blue-650/80 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Right Hand 👉
            </button>
          </div>
          <p className="text-[7.5px] text-slate-600 leading-normal mt-0.5">
            *Shift actuator position to match physical thumb sweep arc for immediate distress triggering in emergency conditions.
          </p>
        </div>
      </div>

      {/* Drill toggle block */}
      <div className="flex items-center justify-between w-full mt-5 pt-4 border-t border-slate-800/40 relative z-10">
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-300 font-display">
            {drillMode ? "SANDBOX SIMULATOR" : "LIVE SECURITY ARMED"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {drillMode ? "Simulated escalation nodes" : "Sequential escalation chain active"}
          </span>
        </div>
        <button
          onClick={() => useAppStore.getState().toggleDrillMode()}
          className={`px-3.5 py-1.5 rounded-full text-[9px] font-mono font-bold tracking-wider border uppercase transition-all duration-300 ${
            drillMode
              ? 'bg-slate-800/60 text-amber-400 border-amber-500/20 hover:bg-slate-800 hover:border-amber-400/40'
              : 'bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-950/40 hover:border-red-500/40'
          }`}
        >
          {drillMode ? "DRILL TEST" : "LIVE PROTOCOL"}
        </button>
      </div>
    </motion.div>
  );
};
