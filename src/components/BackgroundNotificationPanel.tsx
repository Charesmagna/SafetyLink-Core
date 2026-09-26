import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';

export const BackgroundNotificationPanel: React.FC = () => {
  const {
    isBackgroundServiceRunning,
    backgroundServiceTick,
    incrementBackgroundServiceTick,
    userLocation,
    bleDevices,
    thingsBoardToken,
    activeSOSState,
    triggerPanic,
    addAuditLog,
    isAppMinimized,
    setMinimized
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(98);
  const [networkLatency, setNetworkLatency] = useState(42);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Time & Battery drift simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const batteryTimer = setInterval(() => {
      setBatteryLevel(prev => (prev > 15 ? prev - 1 : 99));
    }, 120000); // 2 mins

    const latencyTimer = setInterval(() => {
      setNetworkLatency(prev => {
        const delta = Math.floor((Math.random() - 0.5) * 10);
        const next = prev + delta;
        return next > 20 && next < 150 ? next : prev;
      });
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(batteryTimer);
      clearInterval(latencyTimer);
    };
  }, []);

  // Set up a background service tick worker trigger
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (isBackgroundServiceRunning) {
        incrementBackgroundServiceTick();
      }
    }, 4000);
    return () => clearInterval(tickInterval);
  }, [isBackgroundServiceRunning, incrementBackgroundServiceTick]);

  const isBleConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const isGpsLocked = !!userLocation;
  const isServerConnected = !!thingsBoardToken;

  // Format background thread execution time
  const formatTickTime = (ticks: number) => {
    const totalSec = ticks * 4;
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full relative z-[100] font-mono select-none" id="background-telemetry-panel">
      {/* 1. Slim Android-style Top Status Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950/95 border-b border-slate-900/60 py-1.5 px-4 flex justify-between items-center text-[9px] font-bold text-slate-400 cursor-pointer hover:bg-slate-900/60 transition-all shadow-sm"
      >
        {/* Left indicators */}
        <div className="flex items-center gap-2">
          {isBackgroundServiceRunning ? (
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SERVICE ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>SERVICE PAUSED</span>
            </div>
          )}
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 uppercase">Tick: #{backgroundServiceTick}</span>
        </div>

        {/* Center: Expand Handle indicator */}
        <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <span>{isOpen ? '▲ Collapse System Notification' : '▼ Expand Status Notification'}</span>
        </div>

        {/* Right Status Icons */}
        <div className="flex items-center gap-2 text-[8px]">
          {/* BLE icon */}
          <span className={`flex items-center ${isBleConnected ? 'text-blue-400' : 'text-slate-600'}`} title="Bluetooth Wearables Link">
            📟 {isBleConnected ? 'OK' : 'OFF'}
          </span>
          {/* GNSS icon */}
          <span className={`flex items-center ${isGpsLocked ? 'text-teal-400' : 'text-slate-600'}`} title="Space GNSS Coordinates">
            🛰️ {isGpsLocked ? 'GPS' : 'SEARCH'}
          </span>
          {/* ThingsBoard icon */}
          <span className={`flex items-center ${isServerConnected ? 'text-emerald-400' : 'text-slate-600'}`} title="ThingsBoard Cloud Token">
            ☁️ {isServerConnected ? 'TB' : 'OFF'}
          </span>
          <span className="text-slate-600">|</span>
          {/* Battery */}
          <span className="flex items-center gap-0.5 text-slate-300">
            🔋 {batteryLevel}%
          </span>
          {/* Time */}
          <span className="text-slate-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        </div>
      </div>

      {/* 2. Expandable OS Notification Shade Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark blur backing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[98]"
            />

            {/* Actual Notification shade drawer */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.05 }}
              className="absolute left-0 right-0 bg-slate-950/98 backdrop-blur-2xl border-b border-slate-800 shadow-2xl z-[99] max-w-md mx-auto rounded-b-[24px] overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Dashboard-style Status Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className={`p-2 rounded-xl border text-center ${isBackgroundServiceRunning ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}>
                    <span className="text-[7.5px] text-slate-500 uppercase block font-bold">SERVICE</span>
                    <span className="text-[10px] font-black">{isBackgroundServiceRunning ? 'RUNNING' : 'STOPPED'}</span>
                  </div>
                  
                  <div className={`p-2 rounded-xl border text-center ${isBleConnected ? 'bg-blue-950/20 border-blue-500/20 text-blue-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span className="text-[7.5px] text-slate-500 uppercase block font-bold">BLE LINK</span>
                    <span className="text-[10px] font-black">{isBleConnected ? 'LINKED' : 'OFFLINE'}</span>
                  </div>

                  <div className={`p-2 rounded-xl border text-center ${isGpsLocked ? 'bg-teal-950/20 border-teal-500/20 text-teal-400' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
                    <span className="text-[7.5px] text-slate-500 uppercase block font-bold">GNSS LOCK</span>
                    <span className="text-[10px] font-black">{isGpsLocked ? 'HPE GPS' : 'SEARCH'}</span>
                  </div>

                  <div className={`p-2 rounded-xl border text-center ${isServerConnected ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                    <span className="text-[7.5px] text-slate-500 uppercase block font-bold">GATEWAY</span>
                    <span className="text-[10px] font-black">{networkLatency} ms</span>
                  </div>
                </div>

                {/* Constant Foreground Notification Card */}
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-left relative overflow-hidden shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[12px] font-black text-slate-100 uppercase tracking-wider font-mono">
                        🛡️ SafetyLink Active
                      </span>
                    </div>
                    <span className="text-[8px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-500">
                      FOREGROUND SERVICE
                    </span>
                  </div>

                  {/* System Status Indicators List */}
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500 uppercase">BLE Link Status</span>
                      <span className={`font-black ${isBleConnected ? 'text-blue-400' : 'text-slate-400'}`}>
                        {isBleConnected ? '● CONNECTED' : '○ STANDBY (iTAG Scanning)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500 uppercase">GPS Location</span>
                      <span className={`font-black ${isGpsLocked ? 'text-teal-400' : 'text-amber-500'}`}>
                        {isGpsLocked ? '● LOCKED (HPE GNSS)' : '○ ACQUIRING SATELLITES'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded-lg border border-slate-900">
                      <span className="text-slate-500 uppercase">Monitoring Engine</span>
                      <span className={`font-black ${isBackgroundServiceRunning ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isBackgroundServiceRunning ? '● ACTIVE (STICKY)' : '○ SUSPENDED'}
                      </span>
                    </div>
                  </div>

                  {/* Real-time telemetry sub-dump */}
                  {isBackgroundServiceRunning && (
                    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-2.5 font-mono text-[8px] text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>THREAD DURATION:</span>
                        <span className="text-slate-300 font-bold">{formatTickTime(backgroundServiceTick)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LATENCY METRICS:</span>
                        <span className="text-indigo-400 font-bold">{networkLatency} ms (WITS-NODE-GATEWAY)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GPS VALUE:</span>
                        <span className="text-blue-400 font-bold">
                          {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'ACQUIRING...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Android Style Notification Action Panel */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={async () => {
                        setIsOpen(false);
                        await triggerPanic('SOS emergency broadcast activated from persistent Android notification widget.');
                      }}
                      disabled={activeSOSState !== 'IDLE'}
                      className="py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono font-black text-[9px] uppercase tracking-wider rounded-xl transition-all border border-red-500/20 shadow-md text-center"
                    >
                      🆘 SOS
                    </button>

                    <button
                      onClick={() => {
                        addAuditLog('BLE', 'INFO', 'Initiated manual BLE Reconnect sweep from notification widget', 'Scanning GATT characteristics for bound iTAG keyfobs.');
                      }}
                      className="py-2.5 bg-slate-950 hover:bg-slate-900 text-blue-400 border border-slate-800 rounded-xl font-mono font-black text-[9px] uppercase tracking-wider transition-all text-center"
                    >
                      🔄 Reconnect
                    </button>

                    <button
                      onClick={() => {
                        setMinimized(false);
                        setIsOpen(false);
                      }}
                      className="py-2.5 bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono font-black text-[9px] uppercase tracking-wider transition-all text-center"
                    >
                      📱 Open
                    </button>
                  </div>
                </div>

                {/* Simulated Device minimize / restore control */}
                <button
                  onClick={() => {
                    setMinimized(!isAppMinimized);
                    setIsOpen(false);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span>{isAppMinimized ? '📱 RESTORE SAFETYLINK FULL CONSOLE' : '📳 EXIT CONSOLE TO BACKGROUND'}</span>
                  <span className="text-xs">⚡</span>
                </button>

                {/* Quick Diagnostics Info */}
                <div className="flex justify-between items-center text-[8.5px] text-slate-500 px-1 pt-1 border-t border-slate-900">
                  <span>WAKE LOCKS: ENGAGED</span>
                  <span>CPU LOAD: 2.1%</span>
                  <span>SQLite DB: SYNCED</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
