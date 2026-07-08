import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const BackgroundNotificationPanel: React.FC = () => {
  const {
    isBackgroundServiceRunning,
    toggleBackgroundService,
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

  // Listen to custom window events for top-to-down swipe triggers
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen(prev => !prev);
    
    window.addEventListener('open-notification-shade', handleOpen);
    window.addEventListener('close-notification-shade', handleClose);
    window.addEventListener('toggle-notification-shade', handleToggle);
    
    return () => {
      window.removeEventListener('open-notification-shade', handleOpen);
      window.removeEventListener('close-notification-shade', handleClose);
      window.removeEventListener('toggle-notification-shade', handleToggle);
    };
  }, []);

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
                <div className="bg-slate-900/90 border border-slate-800/85 rounded-2xl p-4 text-left relative overflow-hidden shadow-lg">
                  {/* Subtle watermarked title inside card */}
                  <div className="absolute top-2 right-3 text-[7.5px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    Ongoing Service
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Floating active shield icon */}
                    <div className="shrink-0">
                      <SafetyLinkLogo 
                        size={36} 
                        glowColor={isBackgroundServiceRunning ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-wide">
                          SafetyLink Active Connection (Service ID: 8801)
                        </h4>
                        <p className="text-[9.5px] text-slate-400 font-mono leading-relaxed mt-0.5">
                          {isBackgroundServiceRunning 
                            ? 'Actively polling background location telemetry & listening for bound BLE keyfob gestures.'
                            : 'Background thread is paused. Wearable hardware gestures will NOT trigger dispatch!'}
                        </p>
                      </div>

                      {/* Real-time telemetry dump */}
                      {isBackgroundServiceRunning && (
                        <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-2.5 font-mono text-[8px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>THREAD STATE:</span>
                            <span className="text-emerald-400 font-bold">ACTIVE (RUNNING_STICKY)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TOTAL TICK TIME:</span>
                            <span className="text-slate-300 font-bold">{formatTickTime(backgroundServiceTick)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GPS COORDINATES:</span>
                            <span className="text-blue-400 font-bold">
                              {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'ACQUIRING...'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>HARDWARE LINK LOG:</span>
                            <div className="flex flex-col gap-1 w-full max-w-[200px] text-right">
                              {bleDevices.length > 0 ? (
                                bleDevices.map(d => (
                                  <div key={d.macAddress} className="text-[7px] text-slate-300 leading-none truncate font-bold uppercase">
                                    {d.friendlyName.substring(0, 10)} [{d.macAddress.replace(/:/g, '').substring(0, 4)}] • <span className={d.connectionState === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-500'}>{d.connectionState}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[7.5px] text-slate-500 italic">No active iTAG bound</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Control buttons inside notification card */}
                      <div className="flex gap-2.5 pt-1.5">
                        <button
                          onClick={() => {
                            toggleBackgroundService();
                            addAuditLog(
                              'SYSTEM',
                              'INFO',
                              isBackgroundServiceRunning ? 'Background Service Suspended' : 'Background Service Resumed',
                              'Operator action triggered via constant status notification card.'
                            );
                          }}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                            isBackgroundServiceRunning
                              ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isBackgroundServiceRunning ? '🛑 Stop Monitoring' : '▶️ Resume Monitoring'}
                        </button>
                        
                        <button
                          onClick={async () => {
                            setIsOpen(false);
                            await triggerPanic('Immediate emergency dispatch activated from persistent background notification panel.');
                          }}
                          disabled={activeSOSState !== 'IDLE'}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-white border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          🚨 Instant Panic
                        </button>
                      </div>
                    </div>
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
