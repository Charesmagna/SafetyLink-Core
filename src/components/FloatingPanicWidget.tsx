import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';

export const FloatingPanicWidget: React.FC = () => {
  const {
    currentUser,
    isFloatingWidgetDeployed,
    setFloatingWidgetDeployed,
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
  const lastTapRef = useRef<number>(0);

  // Auto-close control slider after 10 seconds of inactivity
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showControls, floatingWidgetSize, opacity, silenceAlerts, decoyActive]);

  // Never show floating SOS button on public website or before a user has an active profile
  const hasActiveProfile = Boolean(
    currentUser &&
      (currentUser.id || currentUser.username) &&
      (currentUser.fullName || currentUser.phone || currentUser.email)
  );

  if (!isFloatingWidgetDeployed || !hasActiveProfile) return null;

  const isSOSActive = activeSOSState !== 'IDLE';
  const isCountdownActive = panicCountdown !== null;

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const prevTap = lastTapRef.current;

    if (navigator.vibrate) {
      navigator.vibrate(now - prevTap < DOUBLE_TAP_DELAY ? [40, 20, 40] : 20);
    }

    if (now - prevTap < DOUBLE_TAP_DELAY) {
      setShowControls((prev) => !prev);
      e.stopPropagation();
    } else {
      setTimeout(() => {
        const doubleTapped = Date.now() - lastTapRef.current < DOUBLE_TAP_DELAY && lastTapRef.current !== now;
        if (!doubleTapped) {
          if (isCountdownActive || isSOSActive) {
            cancelSOS();
            addToast("SOS Distress sequence aborted via floating shortcut.", "warn");
          } else {
            startMultiStagePanic("Emergency distress activated via movable floating SOS button.", 10);
            addToast("SOS Countdown initiated! You have 10 seconds to abort.", "warn");
          }
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const sosFontSize = Math.max(15, Math.round(floatingWidgetSize * 0.28));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <motion.div
        ref={widgetRef}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={{ x: window.innerWidth - floatingWidgetSize - 24, y: window.innerHeight - floatingWidgetSize - 130 }}
        style={{
          width: floatingWidgetSize,
          height: floatingWidgetSize,
          opacity,
        }}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none"
        onClick={handleTap}
        aria-label="Floating Emergency SOS Button"
        data-testid="floating-sos-button"
      >
        {/* Red Emergency Halo Rings */}
        <AnimatePresence>
          {(isCountdownActive || isSOSActive) ? (
            <div className="absolute -inset-2 rounded-full bg-red-600/45 animate-ping pointer-events-none" />
          ) : (
            <div className="absolute -inset-1 rounded-full bg-red-600/25 animate-pulse pointer-events-none" />
          )}
        </AnimatePresence>

        {/* Outer crisp circular frame */}
        <div className="absolute inset-0 rounded-full bg-red-950/70 border-2 border-white/90 shadow-[0_8px_28px_rgba(220,38,38,0.65)] flex items-center justify-center p-1">
          {/* Core Bright Red Emergency SOS Medallion */}
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
              isSOSActive
                ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-900 border border-red-200/80 text-white animate-pulse'
                : isCountdownActive
                ? 'bg-gradient-to-br from-amber-500 via-red-600 to-red-800 border border-amber-200 text-white animate-pulse'
                : 'bg-gradient-to-br from-red-500 via-red-600 to-red-800 border border-red-300/70 text-white shadow-inner'
            }`}
          >
            {/* Subtle top glossy highlight for classic emergency button depth */}
            <div className="absolute inset-x-1.5 top-0.5 h-1/3 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

            {/* Countdown timer overlay */}
            {isCountdownActive && (
              <div className="relative z-10 flex flex-col items-center justify-center font-mono font-black text-white drop-shadow">
                <span className="text-[9px] uppercase tracking-widest opacity-90 leading-none">SOS</span>
                <span className="text-xl leading-none mt-0.5 tabular-nums">{panicCountdown}</span>
              </div>
            )}

            {/* Active SOS display */}
            {isSOSActive && !isCountdownActive && (
              <div className="relative z-10 flex flex-col items-center justify-center font-black text-white uppercase tracking-wider drop-shadow">
                <span className="text-[8px] tracking-widest text-red-100 leading-none">ACTIVE</span>
                <span style={{ fontSize: `${sosFontSize}px` }} className="leading-none mt-0.5">SOS</span>
              </div>
            )}

            {/* Default Unmistakable RED Floating SOS Label */}
            {!isCountdownActive && !isSOSActive && (
              <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
                <span
                  style={{ fontSize: `${sosFontSize}px` }}
                  className="font-black tracking-[0.08em] text-white leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]"
                >
                  SOS
                </span>
                <span className="text-[7px] font-mono font-bold uppercase tracking-[0.18em] text-red-100/90 mt-0.5 leading-none">
                  ALERT
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Double-tap floating controls popover */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-slate-950/95 border border-red-500/30 rounded-2xl shadow-2xl flex flex-col gap-2.5 w-48 text-left z-50 pointer-events-auto backdrop-blur-xl"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>SOS SIZE: {floatingWidgetSize}px</span>
                </div>
                <input
                  type="range"
                  min="52"
                  max="120"
                  value={floatingWidgetSize}
                  onChange={(e) => setFloatingWidgetSize(Number(e.target.value))}
                  className="w-full accent-red-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>OPACITY: {Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-red-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono font-black pt-1 border-t border-slate-900">
                <span className="text-slate-400">SILENT SOS:</span>
                <button
                  type="button"
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

              <div className="flex justify-between items-center text-[9px] font-mono font-black">
                <span className="text-slate-400">DECOY MODE:</span>
                <button
                  type="button"
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

              <button
                type="button"
                onClick={() => {
                  setFloatingWidgetDeployed(false);
                  setShowControls(false);
                  addToast('Floating SOS hidden. Re-enable anytime in Settings or the side menu.', 'info');
                }}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-[9px] font-mono font-black text-red-300 uppercase tracking-wider transition-colors"
              >
                Hide Floating SOS
              </button>

              <div className="text-[8px] text-center text-slate-500 font-mono italic leading-none">
                Double-tap SOS to close controls
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
