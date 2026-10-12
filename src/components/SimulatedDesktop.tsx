import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { AndroidWidgetSimulator } from './AndroidWidgetSimulator';
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

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-950 font-mono text-left relative" style={{ backgroundImage: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #020617 70%)' }} id="simulated-desktop-viewport">
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

        {/* Native Android Hardware Status Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-slate-400 font-mono text-[9px] relative z-20">
          <div className="flex items-center gap-2">
            <SafetyLinkLogo size={16} glowColor={isBackgroundServiceRunning ? '#10b981' : '#ef4444'} />
            <span className="font-bold text-slate-200">SAFETYLINK RESILIENT CORE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isBackgroundServiceRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`font-mono text-[8px] font-black tracking-widest ${isBackgroundServiceRunning ? 'text-emerald-400' : 'text-red-400'}`}>
              {isBackgroundServiceRunning ? 'MESH ACTIVE' : 'PAUSED'}
            </span>
          </div>
        </div>

        {/* ANDROID HOME SCREEN WIDGET (Big Red Button Forced out to Home Screen) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="relative z-20"
        >
          <AndroidWidgetSimulator />
        </motion.div>

        {/* GRID OF LAUNCHER APPS (For high immersive design) */}
        <div className="grid grid-cols-5 gap-3.5 py-4 px-1.5 relative z-10 select-none">
          {/* Main SafetyLink Re-enter launcher */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'home' }));
              setMinimized(false);
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all relative">
              <SafetyLinkLogo size={28} />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border border-slate-950 rounded-full flex items-center justify-center text-[7.5px] font-black text-white">
                1
              </span>
            </div>
            <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              SafetyLink
            </span>
          </button>

          {/* Simulated App 2: Guard Monitor / Dispatch */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'contacts' }));
              setMinimized(false);
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all">
              <span className="text-xl">🚨</span>
            </div>
            <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              Dispatch
            </span>
          </button>

          {/* Simulated App 3: BLE Beacons */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'ble' }));
              setMinimized(false);
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all">
              <span className="text-xl">📟</span>
            </div>
            <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              BLE Hub
            </span>
          </button>

          {/* Simulated App 4: Chaos Sandbox */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'subsystems' }));
              setMinimized(false);
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all relative">
              <span className="text-xl animate-pulse">💻</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
            </div>
            <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              Chaos
            </span>
          </button>

          {/* Simulated App 5: Settings */}
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('sl-switch-tab', { detail: 'settings' }));
              setMinimized(false);
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-center shadow-lg transition-all">
              <span className="text-xl">⚙️</span>
            </div>
            <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-wider text-center group-hover:text-white truncate max-w-[55px]">
              Settings
            </span>
          </button>
        </div>

        {/* Desktop Footer Instruction */}
        <div className="text-center pb-4 text-slate-500 font-bold select-none relative z-10">
          <div className="flex items-center justify-center gap-1 text-[8.5px] uppercase tracking-widest text-slate-600">
            <span>SafetyLink Native Mobile Engine • Background Protected</span>
          </div>
        </div>

      </div>
    </div>
  );
};
