import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { Lock, ShieldAlert, X, AlertTriangle, Volume2, VolumeX } from 'lucide-react';


export const PanicButton: React.FC = () => {
  
  const [showCancelPin, setShowCancelPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  
  const { 
    activeSOSState, attemptCancelSOS, drillMode, 
    panicCountdown, startMultiStagePanic, auditLogs,
    watchMeTimerSeconds, startWatchMeTimer, cancelWatchMeTimer,
    silenceAlerts, setSilenceAlerts
  } = useAppStore();
  
  const [showWatchMe, setShowWatchMe] = useState(false);
  const [watchMeMinutes, setWatchMeMinutes] = useState(30);
  const [showWatchMeCancel, setShowWatchMeCancel] = useState(false);
  const [watchMePin, setWatchMePin] = useState('');


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
      const progress = Math.min(elapsed / 1500, 1); // 1.5 seconds hold down
      setHoldProgress(progress);

      if (progress >= 1) {
        clearInterval(holdIntervalRef.current!);
        setIsHolding(false);
        setHoldProgress(0);
        startMultiStagePanic("Critical panic beacon initiated manually via interactive mission-control cockpit trigger.");
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

  // Vibrate and trigger screen wake / keyguard bypass simulation when countdown starts
  useEffect(() => {
    if (panicCountdown !== null) {
      import('../services/NativeDispatchService').then(({ NativeDispatchService }) => {
        NativeDispatchService.triggerVibration();
        NativeDispatchService.forceUnlockAndWake();
      });
    }
  }, [panicCountdown]);

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
          x: 0,
          y: 0,
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
          
          
      {/* Cancellation PIN Modal */}
      <AnimatePresence>
        {showCancelPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
            >
              <div className="bg-red-900/40 p-4 text-center border-b border-red-500/30">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2 animate-pulse" />
                <h3 className="text-white font-bold text-lg tracking-wide uppercase">Cancel Emergency</h3>
                <p className="text-slate-300 text-sm mt-1">Enter your secure PIN to stand down responders.</p>
              </div>

              <div className="p-6 text-center">
                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-mono font-bold transition-all ${
                        pinError ? 'bg-red-500/20 border-2 border-red-500 text-red-400' :
                        pinInput.length > i ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border-2 border-slate-700 text-slate-500'
                      }`}
                    >
                      {pinInput.length > i ? '*' : '-'}
                    </div>
                  ))}
                </div>

                {pinError && (
                  <p className="text-red-500 text-sm font-medium mb-4 animate-bounce">
                    Incorrect PIN. Try again.
                  </p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        if (pinInput.length < 4) {
                          setPinError(false);
                          const newPin = pinInput + num;
                          setPinInput(newPin);
                          if (newPin.length === 4) {
                            setTimeout(() => {
                              const success = attemptCancelSOS(newPin);
                              if (success) {
                                setShowCancelPin(false);
                              } else {
                                setPinError(true);
                                setPinInput('');
                              }
                            }, 300);
                          }
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl py-4 rounded-xl border border-slate-700/50 active:scale-95 transition-all focus:outline-none"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowCancelPin(false);
                      setPinInput('');
                    }}
                    className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 font-medium py-4 rounded-xl active:scale-95 transition-all focus:outline-none flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      if (pinInput.length < 4) {
                        setPinError(false);
                        const newPin = pinInput + '0';
                        setPinInput(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            const success = attemptCancelSOS(newPin);
                            if (success) {
                              setShowCancelPin(false);
                            } else {
                              setPinError(true);
                              setPinInput('');
                            }
                          }, 300);
                        }
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl py-4 rounded-xl border border-slate-700/50 active:scale-95 transition-all focus:outline-none"
                  >
                    0
                  </button>
                  <button
                    onClick={() => setPinInput(pinInput.slice(0, -1))}
                    className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 font-medium py-4 rounded-xl active:scale-95 transition-all focus:outline-none text-sm uppercase tracking-wider"
                  >
                    DEL
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Animated central beacon trigger */}
          <button
            onMouseDown={startHolding}
            onMouseUp={stopHolding}
            onMouseLeave={stopHolding}
            onTouchStart={startHolding}
            onTouchEnd={stopHolding}
            
            onClick={() => {
              if (activeSOSState !== 'IDLE') {
                setShowCancelPin(true);
                setPinInput('');
                setPinError(false);
              }
            }}

            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden select-none outline-none ${
              activeSOSState === 'IDLE'
                ? 'glossy-sos-btn active:scale-95'
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

      {/* Recent Activity Log Engine */}
      <div className="mt-5 p-3.5 bg-slate-950/85 border border-slate-900 rounded-2xl text-left relative z-10 font-mono hidden">
        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2">
          <span className="text-[9px] font-black text-blue-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            NOTIFICATION GHOST ENGINE
          </span>
          <span className="text-[7.5px] text-slate-500 uppercase">EVENTS LOG</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {auditLogs && auditLogs.length > 0 ? (
            auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex flex-col gap-0.5 pb-2 border-b border-slate-900/40 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[8.5px] font-bold uppercase ${
                    log.severity === 'SEVERE' ? 'text-red-400' :
                    log.severity === 'WARN' ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {log.message}
                  </span>
                  <span className="text-[7.5px] text-slate-600">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 truncate leading-relaxed">
                  {log.details}
                </p>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-[9px] text-slate-600">
              No recent events
            </div>
          )}
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
        <div className="flex items-center gap-2">
          {activeSOSState === 'IDLE' && panicCountdown === null && (
            <button
              onClick={() => startMultiStagePanic("Manual fast-tap testing alert")}
              className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/20 rounded-full text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider"
            >
              ⏳ Test 5s
            </button>
          )}
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
          <button
            onClick={() => setSilenceAlerts(!silenceAlerts)}
            className={`px-3 py-1.5 rounded-full flex items-center justify-center border transition-all duration-300 ${
              silenceAlerts 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}
            title={silenceAlerts ? "Silent Alerts Active" : "Audible Alerts Active"}
          >
            {silenceAlerts ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>


      {/* Watch-Me Timer Component */}
      <div className="mt-6 relative z-10">
        {watchMeTimerSeconds !== null ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 backdrop-blur-md flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Watch-Me</p>
                <p className="text-white font-mono text-lg">
                  {Math.floor(watchMeTimerSeconds / 60).toString().padStart(2, '0')}:
                  {(watchMeTimerSeconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowWatchMeCancel(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700"
            >
              Cancel
            </button>
          </motion.div>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWatchMe(true)}
            className="w-full bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <Lock className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-slate-200 text-sm font-bold tracking-wide">Watch-Me Timer</p>
                <p className="text-slate-500 text-[10px] uppercase">Proactive protection</p>
              </div>
            </div>
            <div className="text-slate-600 group-hover:text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </motion.button>
        )}
      </div>

      {/* Watch-Me Setup Modal */}
      <AnimatePresence>
        {showWatchMe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Watch-Me Timer</h3>
                    <p className="text-slate-400 text-sm">Proactive emergency switch</p>
                  </div>
                  <button onClick={() => setShowWatchMe(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                </div>
                
                <p className="text-slate-300 text-sm mb-6">
                  If this timer reaches zero before you cancel it, SafetyLink will automatically dispatch responders to your last known location.
                </p>

                <div className="flex items-center justify-center gap-6 mb-8">
                  <button 
                    onClick={() => setWatchMeMinutes(Math.max(5, watchMeMinutes - 5))}
                    className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                  >
                    -
                  </button>
                  <div className="text-center w-20">
                    <span className="text-4xl font-mono font-bold text-white">{watchMeMinutes}</span>
                    <span className="text-slate-500 text-xs block uppercase mt-1">Minutes</span>
                  </div>
                  <button 
                    onClick={() => setWatchMeMinutes(Math.min(120, watchMeMinutes + 5))}
                    className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    startWatchMeTimer(watchMeMinutes);
                    setShowWatchMe(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  Start Protection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watch-Me Cancel PIN Modal */}
      <AnimatePresence>
        {showWatchMeCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl relative"
            >
              <h3 className="text-white font-bold text-lg mb-2">Cancel Watch-Me</h3>
              <p className="text-slate-400 text-sm mb-6">Enter PIN to stop the timer.</p>
              
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-mono font-bold ${watchMePin.length > i ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-2 border-slate-700 text-slate-500'}`}>
                    {watchMePin.length > i ? '*' : '-'}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (watchMePin.length < 4) {
                        const newPin = watchMePin + num;
                        setWatchMePin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            if (cancelWatchMeTimer(newPin)) {
                              setShowWatchMeCancel(false);
                              setWatchMePin('');
                            } else {
                              setWatchMePin('');
                            }
                          }, 300);
                        }
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl py-4 rounded-xl border border-slate-700/50"
                  >
                    {num}
                  </button>
                ))}
                <button onClick={() => { setShowWatchMeCancel(false); setWatchMePin(''); }} className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 py-4 rounded-xl"><X className="w-6 h-6 mx-auto" /></button>                <button onClick={() => {                   if (watchMePin.length < 4) {                        const newPin = watchMePin + '0';                        setWatchMePin(newPin);                        if (newPin.length === 4) {                          setTimeout(() => {                            if (cancelWatchMeTimer(newPin)) {                              setShowWatchMeCancel(false);                              setWatchMePin('');                            } else {                              setWatchMePin('');                            }                          }, 300);                        }                      }                }} className="bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl py-4 rounded-xl border border-slate-700/50">0</button>                <button onClick={() => setWatchMePin(watchMePin.slice(0, -1))} className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 py-4 rounded-xl text-sm font-bold">DEL</button>              </div>            </motion.div>          </motion.div>        )}      </AnimatePresence>


    </motion.div>
  );
};
