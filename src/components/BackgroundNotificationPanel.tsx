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
    addNotificationPanelLog,
    isAppMinimized,
    setMinimized,
    startWatchMeTimer,
    watchMeTimerSeconds,
    cancelWatchMeTimer,
    setShowLizzyPopup,
    syncOfflineQueue,
    addToast
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(98);
  const [networkLatency, setNetworkLatency] = useState(42);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundBeepActive, setSoundBeepActive] = useState(false);
  const [watchPickerOpen, setWatchPickerOpen] = useState(false);

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

                  {/* Android Style Notification Mini-App Grid (User Golden Spec: 7 Core Quick Actions) */}
                  <div className="space-y-2 pt-1 border-t border-slate-850">
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 px-0.5">
                      <span className="text-slate-400 font-bold tracking-wider">NOTIFICATION MINI-APP ACTIONS</span>
                      <span className="text-emerald-400">● LIVE PULL-DOWN SHADE</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 font-mono text-[8.5px]">
                      {/* 1. 🔴 SOS Button */}
                      <button
                        onClick={async () => {
                          setIsOpen(false);
                          addNotificationPanelLog({
                            action: 'SOS',
                            status: 'TRIGGERED',
                            details: 'Emergency SOS activated from Android Notification Panel Mini-App.',
                            coordinates: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
                          });
                          await triggerPanic('SOS emergency broadcast activated from persistent Android notification shade.');
                        }}
                        disabled={activeSOSState !== 'IDLE'}
                        className="py-2.5 col-span-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/30 shadow-lg text-center flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <span className="text-sm">🔴</span>
                        <span>{activeSOSState !== 'IDLE' ? 'SOS ACTIVE' : 'SOS PANIC'}</span>
                      </button>

                      {/* 2. ⏱ Watch Me Button */}
                      <button
                        onClick={() => {
                          if (watchMeTimerSeconds !== null) {
                            cancelWatchMeTimer('0000');
                            addNotificationPanelLog({
                              action: 'WATCH_ME',
                              status: 'COMPLETED',
                              details: 'Watch Me timer cancelled from Notification Panel.'
                            });
                            addToast('Watch Me timer cancelled.', 'info');
                          } else {
                            setWatchPickerOpen(!watchPickerOpen);
                          }
                        }}
                        className={`py-2 col-span-2 rounded-xl border font-bold text-center flex items-center justify-center gap-1 transition-all ${
                          watchMeTimerSeconds !== null 
                            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse' 
                            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-amber-400'
                        }`}
                      >
                        <span className="text-xs">⏱</span>
                        <span>
                          {watchMeTimerSeconds !== null
                            ? `WATCH: ${Math.floor(watchMeTimerSeconds / 60)}m ${watchMeTimerSeconds % 60}s`
                            : 'WATCH ME TIME'}
                        </span>
                      </button>

                      {/* 3. 📶 BLE / Hardware Status */}
                      <button
                        onClick={() => {
                          addNotificationPanelLog({
                            action: 'BLE_STATUS',
                            status: 'ACKNOWLEDGED',
                            details: `Hardware query from notification panel: ${isBleConnected ? 'Connected to BLE Keyfob' : 'Scanning iTAG'}`
                          });
                          addAuditLog('BLE', 'INFO', 'Manual BLE status verified from notification panel mini-app', 'GATT link refreshed.');
                          addToast(isBleConnected ? 'BLE Beacon Connected & Responsive' : 'BLE in passive scanning mode', 'info');
                        }}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-blue-400 flex flex-col items-center justify-center gap-0.5 text-center"
                      >
                        <span className="text-xs">📶</span>
                        <span className="text-[7.5px] font-black uppercase">{isBleConnected ? 'LINKED' : 'BLE STAT'}</span>
                      </button>

                      {/* 4. 🔄 Sync Button */}
                      <button
                        onClick={() => {
                          syncOfflineQueue(false);
                          addNotificationPanelLog({
                            action: 'SYNC',
                            status: 'COMPLETED',
                            details: 'Force offline queue and server telemetry synchronization requested.'
                          });
                          addToast('SafetyLink offline database synced with server.', 'success');
                        }}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-teal-400 flex flex-col items-center justify-center gap-0.5 text-center"
                      >
                        <span className="text-xs">🔄</span>
                        <span className="text-[7.5px] font-black uppercase">SYNC NOW</span>
                      </button>

                      {/* 5. ✅ Check-in Button */}
                      <button
                        onClick={() => {
                          const coords = userLocation ? `[${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}]` : 'GPS Acquiring';
                          addNotificationPanelLog({
                            action: 'CHECK_IN',
                            status: 'COMPLETED',
                            details: `User safe check-in at ${coords}`,
                            coordinates: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
                          });
                          addAuditLog('SECURITY', 'INFO', 'Safe Check-In Ping', `Logged check-in at coordinates ${coords}`);
                          addToast(`✅ Check-in recorded at ${coords}`, 'success');
                        }}
                        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-emerald-400 flex flex-col items-center justify-center gap-0.5 text-center"
                      >
                        <span className="text-xs">✅</span>
                        <span className="text-[7.5px] font-black uppercase">CHECK-IN</span>
                      </button>

                      {/* 6. 📍 Sound Location Button */}
                      <button
                        onClick={() => {
                          setSoundBeepActive(true);
                          addNotificationPanelLog({
                            action: 'SOUND_LOCATION',
                            status: 'DISPATCHED',
                            details: 'Audible acoustic locator tone triggered on paired hardware and phone speaker.'
                          });
                          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
                          try {
                            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            osc.type = 'triangle';
                            osc.frequency.setValueAtTime(880, ctx.currentTime);
                            osc.connect(ctx.destination);
                            osc.start();
                            osc.stop(ctx.currentTime + 1.2);
                          } catch (e) {
                            console.warn('Audio play failed', e);
                          }
                          addToast('📍 Sound location alarm playing on phone and paired tag', 'warn');
                          setTimeout(() => setSoundBeepActive(false), 2000);
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all ${
                          soundBeepActive
                            ? 'bg-amber-600 text-white border-amber-400 animate-bounce'
                            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-amber-400'
                        }`}
                      >
                        <span className="text-xs">📍</span>
                        <span className="text-[7.5px] font-black uppercase">SOUND LOC</span>
                      </button>

                      {/* 7. 🤖 AI Lizzie Voice Chat Button */}
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setShowLizzyPopup(true);
                          addNotificationPanelLog({
                            action: 'AI_LIZZIE',
                            status: 'TRIGGERED',
                            details: 'Lizzie voice assistant activated via Notification Panel Mini-App.'
                          });
                          addToast('Launching AI Lizzie Voice Interface...', 'info');
                        }}
                        className="py-2.5 col-span-4 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      >
                        <span className="text-sm">🤖</span>
                        <span>AI LIZZIE VOICE CHAT OVERLAY</span>
                      </button>
                    </div>

                    {/* Quick Watch Me Preset Selector Drawer */}
                    {watchPickerOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <span className="text-[8px] text-slate-400 font-bold uppercase">ARM WATCH ME:</span>
                        <div className="flex gap-1.5">
                          {[5, 10, 15, 30].map(mins => (
                            <button
                              key={mins}
                              onClick={() => {
                                startWatchMeTimer(mins);
                                setWatchPickerOpen(false);
                                addNotificationPanelLog({
                                  action: 'WATCH_ME',
                                  status: 'TRIGGERED',
                                  details: `Watch Me safety timer armed for ${mins} minutes.`
                                });
                                addToast(`Watch Me active for ${mins} mins. Auto-panic if unacknowledged.`, 'warn');
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[8px] font-black"
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
