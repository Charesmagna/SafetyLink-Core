import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';

export const PanicButton: React.FC = () => {
  const { activeSOSState, triggerPanic, cancelSOS, drillMode } = useAppStore();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  const startHolding = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (activeSOSState !== 'IDLE') return;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 2000, 1); // 2 seconds hold down
      setHoldProgress(progress);

      if (progress >= 1) {
        clearInterval(holdIntervalRef.current!);
        setIsHolding(false);
        setHoldProgress(0);
        // Trigger alert
        triggerPanic("Critical panic beacon initiated manually via physical hold gesture.");
      }
    }, 50);
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
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      {/* Subtle top decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-60" />

      <div className="text-center mb-6">
        <h3 className="text-base font-black text-slate-100 tracking-tight flex items-center justify-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          EMERGENCY SOS BEACON
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
          {activeSOSState === 'IDLE' 
            ? "Press and hold the button for 2 seconds to alert response services." 
            : "SOS Distress broadcast is active. Signal is actively transmitting."}
        </p>
      </div>

      {/* Pulsing button container */}
      <div className="relative flex items-center justify-center w-60 h-60 my-2">
        {/* Animated Ripple Effects */}
        {activeSOSState !== 'IDLE' && (
          <>
            <div className="absolute w-52 h-52 rounded-full bg-red-600/25 animate-ping" />
            <div className="absolute w-44 h-44 rounded-full bg-red-600/40 animate-pulse" />
          </>
        )}

        {/* Circular holding tracker background */}
        <svg className="absolute w-52 h-52 transform -rotate-90">
          <circle
            cx="104"
            cy="104"
            r="88"
            className="stroke-slate-800/80 fill-transparent"
            strokeWidth="6"
          />
          {isHolding && (
            <circle
              cx="104"
              cy="104"
              r="88"
              className="stroke-red-500 fill-transparent transition-all duration-75"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - holdProgress)}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* The Actual Panic Button */}
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
          className={`absolute w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
            activeSOSState === 'IDLE'
              ? 'bg-gradient-to-br from-red-500 to-red-600 active:scale-95 text-slate-100 hover:shadow-red-500/20 hover:shadow-2xl'
              : 'bg-slate-950 border border-red-500/30'
          }`}
        >
          {activeSOSState === 'IDLE' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-1 text-white shadow-inner">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-100 font-black text-xl tracking-wider">SOS</span>
              <span className="text-red-200 text-[9px] font-mono font-bold uppercase tracking-widest mt-0.5">
                Hold 2s
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-1 text-red-500 animate-pulse">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-red-500 font-black text-lg tracking-wider">ACTIVE</span>
              <span className="text-slate-400 text-[9px] font-mono uppercase font-bold tracking-widest mt-1 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                Cancel
              </span>
            </>
          )}
        </button>
      </div>

      {/* SOS Status Steps display */}
      {activeSOSState !== 'IDLE' && (
        <div className="w-full mt-4 p-4 bg-slate-950/80 rounded-2xl border border-red-500/20 font-mono text-xs">
          <div className="flex justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 mb-2.5">
            <span>SEQUENCE PIPELINE</span>
            <span className="text-red-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              BROADCASTING
            </span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${activeSOSState === 'ACQUIRING_GPS' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={activeSOSState === 'ACQUIRING_GPS' ? 'text-orange-400 font-bold' : 'opacity-60 text-slate-400'}>
                1. GPS Triangulation Lock
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${
                activeSOSState === 'ACQUIRING_GPS' ? 'bg-slate-800' :
                activeSOSState === 'CAPTURING_EVIDENCE' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
              }`} />
              <span className={activeSOSState === 'CAPTURING_EVIDENCE' ? 'text-orange-400 font-bold' : 'opacity-60 text-slate-400'}>
                2. Live Ambient Audio Cache
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${
                ['IDLE', 'ACQUIRING_GPS', 'CAPTURING_EVIDENCE'].includes(activeSOSState) ? 'bg-slate-800' :
                activeSOSState === 'ESCALATING' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
              }`} />
              <span className={activeSOSState === 'ESCALATING' ? 'text-orange-400 font-bold' : 'opacity-60 text-slate-400'}>
                3. Sequential Alert Dispatch
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${activeSOSState === 'DISPATCHED' ? 'bg-green-500 animate-pulse' : 'bg-slate-800'}`} />
              <span className={activeSOSState === 'DISPATCHED' ? 'text-green-500 font-bold' : 'opacity-60 text-slate-400'}>
                4. Responder En-route (Sandton A1)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drill toggle block */}
      <div className="flex items-center justify-between w-full mt-5 pt-4 border-t border-slate-800/60">
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-slate-200">
            {drillMode ? "Sandbox Drill Active" : "LIVE EMERGENCY ARMED"}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {drillMode ? "Alert gates simulated locally" : "Will contact real armed responders"}
          </span>
        </div>
        <button
          onClick={() => useAppStore.getState().toggleDrillMode()}
          className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider border uppercase transition-colors ${
            drillMode
              ? 'bg-slate-800 text-orange-400 border-orange-500/20 hover:bg-slate-700'
              : 'bg-red-950/80 text-red-400 border-red-500/20 hover:bg-red-900'
          }`}
        >
          {drillMode ? "DRILL ON" : "LIVE MODE"}
        </button>
      </div>
    </div>
  );
};
