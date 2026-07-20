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
    setDecoyActive,
    userLocation
  } = useAppStore();

  const [tapState, setTapState] = useState<'IDLE' | 'AWAITING' | 'MENU'>('IDLE');
  const [localCountdown, setLocalCountdown] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(1);
  const bleDevices = useAppStore(state => state.bleDevices || []);
  const bluetoothConnected = bleDevices.some((d: any) => d.connectionState === 'CONNECTED');
  
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tapState === 'AWAITING' && localCountdown !== null) {
      if (localCountdown > 0) {
        timer = setTimeout(() => setLocalCountdown(localCountdown - 1), 1000);
      } else {
        // 10 seconds elapsed, no second tap -> deploy
        setTapState('IDLE');
        setLocalCountdown(null);
        startMultiStagePanic("Emergency distress activated via floating widget auto-deploy.", 0);
        addToast("SOS Deployed automatically from floating widget.", "error");
      }
    }
    return () => clearTimeout(timer);
  }, [tapState, localCountdown, startMultiStagePanic, addToast]);

  // Auto-close menu after 10 seconds of inactivity
  useEffect(() => {
    if (tapState === 'MENU') {
      const timer = setTimeout(() => setTapState('IDLE'), 10000);
      return () => clearTimeout(timer);
    }
  }, [tapState, floatingWidgetSize, opacity, silenceAlerts, decoyActive]);

  if (!isFloatingWidgetDeployed) return null;

  const isSOSActive = activeSOSState !== 'IDLE';
  const isCountdownActive = panicCountdown !== null;

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(15);

    if (isSOSActive || isCountdownActive) {
      cancelSOS();
      setTapState('IDLE');
      addToast("SOS Distress sequence aborted.", "warn");
      return;
    }

    if (tapState === 'IDLE') {
      // First tap
      setTapState('AWAITING');
      setLocalCountdown(10);
    } else if (tapState === 'AWAITING') {
      // Second tap -> open menu
      setTapState('MENU');
      setLocalCountdown(null);
    } else if (tapState === 'MENU') {
      // Third tap -> close menu
      setTapState('IDLE');
    }
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

            {/* Awaiting Second Tap */}
            {tapState === 'AWAITING' && !isCountdownActive && !isSOSActive && (
              <div className="absolute inset-0 bg-amber-500/95 flex flex-col items-center justify-center font-black text-slate-900 text-[10px] uppercase tracking-wider text-center p-1 leading-none animate-pulse">
                <span>TAP</span>
                <span>AGAIN</span>
                <span className="text-[7px] mt-0.5 opacity-80 font-bold">for menu</span>
                <span className="text-xl mt-0.5">{localCountdown}</span>
              </div>
            )}

            {/* Default logo with subtle rotation */}
            {tapState !== 'AWAITING' && !isCountdownActive && !isSOSActive && (
              <img
                src="/media/new_logo/New_SafetyLink_Official_Logo.svg"
                onError={(e) => {
                  // Fallback if custom logo fails to load
                  (e.target as HTMLImageElement).src = '/media/new_logo/New_SafetyLink_Official_Logo.svg';
                }}
                alt="SL"
                referrerPolicy="no-referrer"
                className="w-[75%] h-[75%] rounded-full object-cover pointer-events-none drop-shadow-md select-none transition-transform hover:scale-105"
              />
            )}
          </div>
        </div>

        {/* Floating slider helper tooltip & Mini Menu */}
        <AnimatePresence>
          {tapState === 'MENU' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-2.5 w-52 text-left z-50 pointer-events-auto backdrop-blur-xl"
            >
              {/* Mini Menu Info */}
              <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-900">
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>STATUS:</span>
                  <span className={bluetoothConnected ? "text-emerald-400" : "text-slate-500"}>{bluetoothConnected ? "CONNECTED" : "DISCONNECTED"}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>ACTIVITY:</span>
                  <span className="text-slate-300">PATROL / MONITOR</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono font-black text-slate-400">
                  <span>LOCATION:</span>
                  <span className="text-blue-400 truncate max-w-[90px] text-right">
                    {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'SYNCING...'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setTapState('IDLE');
                    startMultiStagePanic("Manual trigger from widget menu", 0);
                  }}
                  className="w-full py-2 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/40 hover:text-red-100 rounded text-[10px] font-black tracking-widest uppercase transition-colors"
                >
                  DEPLOY SOS NOW
                </button>
              </div>

              <div className="space-y-1 mt-1">
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

              <div className="text-[8px] text-center text-slate-500 font-mono italic leading-none pt-1">
                Tap widget again to close
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
