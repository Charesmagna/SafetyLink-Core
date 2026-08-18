import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';

export const AndroidWidgetSimulator: React.FC = () => {
  const { activeSOSState, bleDevices, userLocation, gpsAccuracy, triggerPanic, cancelSOS } = useAppStore();
  const [pulse, setPulse] = useState(false);
  const [time, setTime] = useState(new Date());

  const connectedDevice = bleDevices.find(d => d.connectionState === 'CONNECTED');
  const rssi = connectedDevice?.rssi ?? -99;
  const rssiBar = Math.max(0, Math.min(100, ((rssi + 100) / 60) * 100));
  const isActive = activeSOSState !== 'IDLE';

  useEffect(() => {
    const t = setInterval(() => { setTime(new Date()); setPulse(p => !p); }, 1000);
    return () => clearInterval(t);
  }, []);

  const batteryLevel = 78;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Android Home Screen Widget Preview</p>

      {/* Bento-Grid Glassmorphic Widget */}
      <div
        className="w-72 rounded-3xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.85) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: isActive
            ? '0 0 40px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.6)'
            : '0 0 30px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <img
              src="/Polish_20260620_014530309.jpg"
              alt="SafetyLink"
              className="w-6 h-6 rounded-full object-cover"
              style={{ mixBlendMode: 'luminosity', filter: 'brightness(1.3)' }}
            />
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest font-mono">SafetyLink</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {/* Battery */}
            <div className="flex items-center gap-1">
              <div className="w-6 h-3 border border-slate-500 rounded-sm relative overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${batteryLevel}%` }} />
              </div>
              <div className="w-0.5 h-1.5 bg-slate-500 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {/* SOS Button - spans 2 rows */}
          <div className="col-span-2 row-span-2 flex flex-col items-center justify-center relative">
            {/* Pulse rings */}
            {isActive && (
              <>
                <div className="absolute w-28 h-28 rounded-full border-2 border-red-500/30 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full border border-red-400/20 animate-pulse" />
              </>
            )}
            {!isActive && pulse && (
              <div className="absolute w-20 h-20 rounded-full border border-indigo-500/20 animate-pulse" />
            )}
            <button
              onClick={() => isActive ? cancelSOS() : triggerPanic('Widget SOS trigger')}
              className="w-20 h-20 rounded-full flex flex-col items-center justify-center font-black text-white transition-all active:scale-95 relative z-10"
              style={{
                background: isActive
                  ? 'radial-gradient(circle, #ef4444 0%, #b91c1c 70%)'
                  : 'radial-gradient(circle, #6366f1 0%, #4338ca 70%)',
                boxShadow: isActive
                  ? '0 0 24px rgba(239,68,68,0.7), inset 0 2px 4px rgba(255,255,255,0.2)'
                  : '0 0 20px rgba(99,102,241,0.5), inset 0 2px 4px rgba(255,255,255,0.15)',
              }}
            >
              <span className="text-2xl leading-none">{isActive ? '✕' : '🆘'}</span>
              <span className="text-[8px] font-black tracking-widest mt-0.5">{isActive ? 'CANCEL' : 'SOS'}</span>
            </button>
            <span className="text-[8px] font-mono text-slate-500 mt-2 tracking-wider">
              {isActive ? '⚡ ALERT ACTIVE' : 'HOLD TO TRIGGER'}
            </span>
          </div>

          {/* GPS Cell */}
          <div className="bg-slate-900/60 rounded-2xl p-2 flex flex-col gap-1 border border-slate-800/50">
            <span className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">GPS</span>
            <span className="text-[10px] font-bold text-emerald-400">
              {userLocation ? `${userLocation.lat.toFixed(3)}` : 'Acquiring'}
            </span>
            <span className="text-[8px] text-slate-500 font-mono">{gpsAccuracy || '±12m'}</span>
          </div>

          {/* BLE RSSI Cell */}
          <div className="bg-slate-900/60 rounded-2xl p-2 flex flex-col gap-1 border border-slate-800/50">
            <span className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">iTAG</span>
            <div className="flex items-end gap-0.5 h-4">
              {[25, 50, 75, 100].map((threshold, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${25 + i * 20}%`,
                    background: rssiBar >= threshold ? '#22d3ee' : 'rgba(99,102,241,0.2)',
                  }}
                />
              ))}
            </div>
            <span className="text-[8px] text-slate-500 font-mono">{rssi}dBm</span>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(99,102,241,0.1)' }}
        >
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-red-400 animate-pulse' : connectedDevice ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span className="text-[8px] font-mono text-slate-400">
              {isActive ? 'DISPATCHING' : connectedDevice ? `${connectedDevice.friendlyName}` : 'No Device'}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-500">TM Media Solutions</span>
        </div>
      </div>

      <p className="text-[7.5px] text-slate-600 font-mono text-center max-w-xs leading-relaxed">
        Material Design 3 Bento Widget · Glassmorphic · Live RSSI + GPS · Dynamic SOS pulse
      </p>
    </div>
  );
};
