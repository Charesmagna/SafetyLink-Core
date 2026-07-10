import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';

export const FloatingPanicWidget: React.FC = () => {
  const {
    isFloatingWidgetDeployed,
    floatingWidgetSize,
    setFloatingWidgetSize,
    panicCountdown,
    activeSOSState,
    startMultiStagePanic,
    cancelSOS,
    addToast,
    silenceAlerts,
    setSilenceAlerts,
    decoyActive,
    setDecoyActive
  } = useAppStore();

  const [showControls, setShowControls] = useState(false);
  const [opacity, setOpacity] = useState(1);
  
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-close control slider after 10 seconds of inactivity to allow enough time for toggles
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showControls, floatingWidgetSize, opacity, silenceAlerts, decoyActive]);

  if (!isFloatingWidgetDeployed) return null;

  const isSOSActive = activeSOSState !== 'IDLE';
  const isCountdownActive = panicCountdown !== null;

  // Handle single tap or double tap
  let lastTap = 0;
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // Simulate tactile haptic vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(now - lastTap < DOUBLE_TAP_DELAY ? [40, 20, 40] : 15);
    }

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap -> Toggle sizing controls
      setShowControls(!showControls);
      e.stopPropagation();
    } else {
      // Single tap -> Trigger / Cancel SOS
      setTimeout(() => {
        const doubleTapped = Date.now() - lastTap < DOUBLE_TAP_DELAY;
        if (!doubleTapped) {
          if (isCountdownActive || isSOSActive) {
            cancelSOS();
            addToast("SOS Distress sequence aborted via floating shortcut.", "warn");
          } else {
            startMultiStagePanic("Emergency distress activated via movable Home Screen floating panic widget.", 10);
            addToast("SOS Countdown initiated! You have 10 seconds to abort.", "warn");
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap = now;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <motion.div
        ref={widgetRef}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={{ x: window.innerWidth - floatingWidgetSize - 32, y: window.innerHeight - floatingWidgetSize - 120 }}
        style={{
          width: floatingWidgetSize,
          height: floatingWidgetSize,
          opacity: opacity,
        }}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none"
        onClick={handleTap}
      >
        {/* Breathing ambient indicator rings */}
        <AnimatePresence>
          {(isCountdownActive || isSOSActive) ? (
            <div className="absolute inset-0 rounded-full bg-red-600/30 animate-ping" />
          ) : (
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
          )}
        </AnimatePresence>

        <div className="absolute inset-0 rounded-full bg-slate-950/45 border-2 border-slate-900/30 backdrop-blur-md flex items-center justify-center p-0.5 shadow-2xl">
          {/* Main button layout */}
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-350 ${
              isSOSActive
                ? 'bg-red-600 border border-red-500 text-white'
                : isCountdownActive
                ? 'bg-amber-500 border border-amber-400 text-black animate-pulse'
                : 'bg-emerald-500 border border-emerald-400 text-white'
            }`}
          >
            {/* Countdown timer overlay */}
            {isCountdownActive && (
              <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center font-mono font-black text-amber-400">
                <span className="text-[10px] uppercase tracking-wider scale-75 opacity-75">SOS</span>
                <span className="text-lg leading-none">{panicCountdown}</span>
              </div>
            )}

            {/* Active SOS display */}
            {isSOSActive && !isCountdownActive && (
              <div className="absolute inset-0 bg-red-700 flex flex-col items-center justify-center font-bold text-white text-[9px] uppercase tracking-wider animate-pulse">
                <span>ACTIVE</span>
                <span>SOS</span>
              </div>
            )}

            {/* Default logo with subtle rotation */}
            {!isCountdownActive && !isSOSActive && (
              <img
                src="/Polish_20260620_014530309.jpg"
                onError={(e) => {
                  // Fallback if custom logo fails to load
                  (e.target as HTMLImageElement).src = '/Polish_20260620_014530309.jpg';
                }}
                alt="SL"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover pointer-events-none drop-shadow-md select-none transition-transform hover:scale-105"
              />
            )}
          </div>
        </div>

        {/* Floating slider helper tooltip */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-2.5 w-48 text-left z-50 pointer-events-auto backdrop-blur-xl"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>WIDGET SIZE: {floatingWidgetSize}px</span>
                </div>
                <input
                  type="range"
                  min="48"
                  max="140"
                  value={floatingWidgetSize}
                  onChange={(e) => setFloatingWidgetSize(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>OPACITY: {Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono font-black pt-1 border-t border-slate-900">
                <span className="text-slate-400">SILENT SOS:</span>
                <button
                  onClick={() => {
                    setSilenceAlerts(!silenceAlerts);
                    if (navigator.vibrate) navigator.vibrate(20);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase ${
                    silenceAlerts ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {silenceAlerts ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono font-black pb-1">
                <span className="text-slate-400">DECOY MODE:</span>
                <button
                  onClick={() => {
                    setDecoyActive(!decoyActive);
                    if (navigator.vibrate) navigator.vibrate(20);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase ${
                    decoyActive ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {decoyActive ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>

              <div className="text-[8px] text-center text-slate-500 font-mono italic leading-none">
                Double-tap shortcut to hide options
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
