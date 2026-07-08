import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { ConsolidatedStatus } from './ConsolidatedStatus';
import { 
  Smartphone, 
  Wifi, 
  Signal, 
  RefreshCw, 
  MapPin, 
  Radio, 
  ChevronDown,
  Navigation
} from 'lucide-react';

export const SimulatedDesktop: React.FC = () => {
  const { 
    isBackgroundServiceRunning, 
    backgroundServiceTick,
    userLocation,
    bleDevices,
    thingsBoardToken,
    addAuditLog,
    setMinimized
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [gpsRefreshing, setGpsRefreshing] = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagStep, setDiagStep] = useState<number>(0);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isIntegrityOpen, setIsIntegrityOpen] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 65 && startY < 300) {
      window.dispatchEvent(new CustomEvent('open-notification-shade'));
      setStartY(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startY === null) return;
    const currentY = e.clientY;
    const diff = currentY - startY;
    if (diff > 65 && startY < 300) {
      window.dispatchEvent(new CustomEvent('open-notification-shade'));
      setStartY(null);
    }
  };

  const handleMouseUp = () => {
    setStartY(null);
  };

  const hasBleConnection = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const hasGps = !!userLocation;
  const hasGateway = !!thingsBoardToken;

  // Manual Ping simulation
  const handlePingGateway = () => {
    if (pinging) return;
    setPinging(true);
    setPingResult('PINGING...');
    addAuditLog('SYSTEM', 'INFO', 'Manual gateway ping initiated', 'Sending simulated IoT telemetry heartbeat packet.');

    setTimeout(() => {
      setPinging(false);
      const latency = Math.floor(Math.random() * 30) + 20;
      setPingResult(`STABLE (${latency}ms)`);
      addAuditLog('SYSTEM', 'INFO', `Gateway ping complete`, `Response received in ${latency}ms.`);
    }, 1200);
  };

  // GPS force-refresh simulation
  const handleForceGps = () => {
    if (gpsRefreshing) return;
    setGpsRefreshing(true);
    addAuditLog('SYSTEM', 'INFO', 'Forcing GPS telemetry refresh', 'Triggering high-precision cell trilateration refresh.');
    
    setTimeout(() => {
      setGpsRefreshing(false);
      addAuditLog('SYSTEM', 'INFO', 'GPS coordinates synchronized', 'Aquired high-precision lock.');
    }, 1500);
  };

  // SMS dispatch test simulation
  const handleSmsTest = () => {
    if (smsTesting) return;
    setSmsTesting(false);
    setSmsTesting(true);
    addAuditLog('DISPATCH', 'INFO', 'SMS backup channel handshake initialized', 'Queueing test GSM payload to backup dispatch sequencers.');

    setTimeout(() => {
      setSmsTesting(false);
      addAuditLog('DISPATCH', 'INFO', 'SMS backup test delivered', 'Handshake confirmed by Vodacom/MTN cell tower: +27829110000.');
    }, 1800);
  };

  // Global diagnostics sweep
  const runDiagnostics = () => {
    if (diagnosticsRunning) return;
    setDiagnosticsRunning(true);
    setDiagStep(1);
    setDiagnosticLogs(['[0.0s] ⚡ STARTING GLOBAL SAFETYLINK CONNECTIVITY DIAGNOSTIC...']);
    addAuditLog('SYSTEM', 'INFO', 'Connectivity diagnostics started', 'Running full diagnostic sweep from background notification bar.');

    setTimeout(() => {
      setDiagStep(2);
      setDiagnosticLogs(prev => [...prev, `[0.6s] 📟 SCANNING BLE CHANNEL (2.4GHz)... Paired devices: ${bleDevices.length}`]);
    }, 600);

    setTimeout(() => {
      setDiagStep(3);
      setDiagnosticLogs(prev => [...prev, `[1.2s] 🛰️ CORRELATING SATELLITE GNSS FEED... Locks: ${hasGps ? 'ACTIVE (12 SAT)' : 'ACQUIRING'}`]);
    }, 1200);

    setTimeout(() => {
      setDiagStep(4);
      setDiagnosticLogs(prev => [...prev, `[1.8s] ☁️ PINGING THINGSBOARD MQTT BROKER... Token: ${hasGateway ? 'VALID' : 'MISSING'}`]);
    }, 1800);

    setTimeout(() => {
      setDiagStep(5);
      setDiagnosticLogs(prev => [...prev, '[2.4s] ⚡ BACKUP GSM SEQUENCER DISPATCH STATUS: STANDBY']);
    }, 2400);

    setTimeout(() => {
      setDiagStep(6);
      setDiagnosticLogs(prev => [...prev, '✨ DIAGNOSTICS COMPLETE: ALL CONNECTIVITY PATHS STABLE.']);
      addAuditLog('SYSTEM', 'INFO', 'Connectivity diagnostics completed', 'All connectivity channels (BLE, GPS, MQTT, GSM) tested and verified.');
    }, 3000);
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-950 font-mono text-left relative select-none" 
      style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #020617 70%)' }} 
      id="simulated-desktop-viewport"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Dynamic wallpaper glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.03)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(59,130,246,0.03)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-md mx-auto w-full p-5 space-y-6 flex flex-col justify-between min-h-[calc(100vh-32px)]">
        
        {/* Giant Lockscreen / Desktop Header */}
        <div className="text-center py-6 space-y-2 select-none relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold text-slate-100 tracking-tight drop-shadow-lg"
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </motion.div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span>📅 {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">DEVICE LOCKED 🔒</span>
          </div>
        </div>

        {/* PERSISTENT SYSTEM NOTIFICATION / MINI APP BAR (The requested feature) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="bg-slate-900/90 backdrop-blur-xl border-2 border-slate-800 rounded-[28px] overflow-hidden shadow-2xl relative z-20"
        >
          {/* Header of the notification tray */}
          <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <SafetyLinkLogo size={20} glowColor={isBackgroundServiceRunning ? '#10b981' : '#ef4444'} />
              <div>
                <span className="text-[10px] font-black text-slate-100 uppercase tracking-wider block">SafetyLink Mini App</span>
                <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-bold">Connectivity Keep-Alive</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[7.5px] bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-widest font-mono uppercase">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Mini App Content */}
          <div className="p-4 space-y-4">
            {/* Real-time Status Bars */}
            <div className="grid grid-cols-4 gap-2 text-center text-slate-300">
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between items-center h-16">
                <span className="text-[7px] text-slate-500 uppercase font-black block">BLE Device</span>
                <Radio className={`w-4 h-4 ${hasBleConnection ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-[8px] font-extrabold ${hasBleConnection ? 'text-blue-400' : 'text-slate-500'}`}>
                  {hasBleConnection ? 'OK' : 'DISCONNECTED'}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between items-center h-16">
                <span className="text-[7px] text-slate-500 uppercase font-black block">GNSS Locks</span>
                <MapPin className={`w-4 h-4 ${hasGps ? 'text-teal-400' : 'text-slate-600'}`} />
                <span className={`text-[8px] font-extrabold ${hasGps ? 'text-teal-400' : 'text-slate-500'}`}>
                  {hasGps ? 'GPS ACTIVE' : 'SEARCHING'}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between items-center h-16">
                <span className="text-[7px] text-slate-500 uppercase font-black block">IoT Gateway</span>
                <Wifi className={`w-4 h-4 ${hasGateway ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className={`text-[8px] font-extrabold ${hasGateway ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasGateway ? 'MQTT UP' : 'OFF'}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between items-center h-16">
                <span className="text-[7px] text-slate-500 uppercase font-black block">GSM Network</span>
                <Signal className="w-4 h-4 text-amber-400" />
                <span className="text-[8px] font-extrabold text-amber-400">MTN-SA OK</span>
              </div>
            </div>

            {/* Simulated Live Connectivity Tests & Diagnostic Module */}
            <div className="bg-slate-950/70 border border-slate-850 p-3 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">⚡ Immediate Actions</span>
                <button 
                  onClick={runDiagnostics}
                  disabled={diagnosticsRunning}
                  className="text-[8px] font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white border border-blue-500/20 px-2 py-0.5 rounded-lg transition-all"
                >
                  {diagnosticsRunning ? 'RUNNING SWEEP...' : 'RUN FULL SWEEP'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={handlePingGateway}
                  disabled={pinging}
                  className="py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[8.5px] rounded-xl text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin text-blue-400' : 'text-slate-500'}`} />
                  <span>{pingResult || 'Ping Gateway'}</span>
                </button>

                <button
                  onClick={handleForceGps}
                  disabled={gpsRefreshing}
                  className="py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[8.5px] rounded-xl text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1"
                >
                  <Navigation className={`w-3 h-3 ${gpsRefreshing ? 'animate-bounce text-teal-400' : 'text-slate-500'}`} />
                  <span>{gpsRefreshing ? 'Syncing...' : 'Sync GPS'}</span>
                </button>

                <button
                  onClick={handleSmsTest}
                  disabled={smsTesting}
                  className="py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[8.5px] rounded-xl text-slate-300 hover:text-white transition-all text-center flex items-center justify-center gap-1"
                >
                  <Smartphone className={`w-3 h-3 ${smsTesting ? 'animate-pulse text-amber-400' : 'text-slate-500'}`} />
                  <span>{smsTesting ? 'Testing...' : 'Test SMS Link'}</span>
                </button>
              </div>

              {/* Diagnostics output area */}
              {(diagnosticsRunning || diagnosticLogs.length > 0) && (
                <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl font-mono text-[7px] text-slate-400 space-y-1.5 leading-normal max-h-24 overflow-y-auto">
                  {diagnosticLogs.map((log, index) => (
                    <div key={index} className={log.includes('✨') ? 'text-emerald-400 font-bold' : log.includes('⚡') ? 'text-blue-400' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))}
                  {diagnosticsRunning && diagStep < 6 && (
                    <div className="flex items-center gap-1.5 text-blue-400 animate-pulse font-bold">
                      <span className="w-1 h-1.5 bg-blue-500 inline-block animate-ping rounded" />
                      <span>EVALUATING SENSORS... STEP {diagStep}/5</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Status indicators & Return Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-1 text-[8.5px] text-slate-500 font-bold uppercase">
                <span>Thread Service Loop:</span>
                <span className={isBackgroundServiceRunning ? 'text-emerald-400' : 'text-red-400'}>
                  {isBackgroundServiceRunning ? `ONLINE (TICK #${backgroundServiceTick})` : 'SUSPENDED'}
                </span>
              </div>

              <button
                onClick={() => setMinimized(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-white text-slate-950 font-black text-[9px] rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-black/40 flex items-center gap-1"
              >
                <span>OPEN FULL CONSOLE</span>
                <span>⚡</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* GRID OF LAUNCHER APPS (For high immersive design) */}
        <div className="grid grid-cols-5 gap-4 py-4 px-1 relative z-10 select-none">
          {/* Main SafetyLink Re-enter launcher */}
          <button
            onClick={() => setMinimized(false)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all relative">
              <SafetyLinkLogo size={28} />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-white">
                1
              </span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              SafetyLink
            </span>
          </button>

          {/* App 2: Consolidated Status Checklist */}
          <button
            onClick={() => setIsIntegrityOpen(true)}
            className="flex flex-col items-center gap-1.5 group animate-pulse"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 flex items-center justify-center shadow-lg transition-all relative">
              <span className="text-xl sm:text-2xl">📊</span>
              {/* New notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 border border-slate-950 rounded-full flex items-center justify-center text-[7.5px] font-black text-white">
                29
              </span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-black text-blue-400 group-hover:text-blue-300 uppercase tracking-wider text-center truncate max-w-[55px]">
              Integrity
            </span>
          </button>

          {/* Simulated App 3: Guard Monitor */}
          <button className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-85 transition-opacity">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl">🚨</span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center truncate max-w-[55px]">
              Dispatch
            </span>
          </button>

          {/* Simulated App 4: BLE Beacons */}
          <button className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-85 transition-opacity">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl">📟</span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center truncate max-w-[55px]">
              BLE Hub
            </span>
          </button>

          {/* Simulated App 5: Settings */}
          <button className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-85 transition-opacity">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] bg-slate-900 border border-slate-850 flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl">⚙️</span>
            </div>
            <span className="text-[8px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-wider text-center truncate max-w-[55px]">
              Settings
            </span>
          </button>
        </div>

        {/* Desktop Footer Instruction */}
        <div className="text-center pb-4 text-slate-500 font-bold select-none relative z-10">
          <div className="flex items-center justify-center gap-1 text-[8.5px] uppercase tracking-widest">
            <ChevronDown className="w-3.5 h-3.5 text-slate-600 animate-bounce" />
            <span>Swipe down or pull status bar for system settings</span>
          </div>
        </div>

      </div>

      {/* Global Consolidated Status overlay */}
      <ConsolidatedStatus isOpen={isIntegrityOpen} onClose={() => setIsIntegrityOpen(false)} />

    </div>
  );
};
