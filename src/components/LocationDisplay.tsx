import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';

export const LocationDisplay: React.FC = () => {
  const { userLocation, gpsAccuracy } = useAppStore();
  const [satelliteCount, setSatelliteCount] = useState(12);

  useEffect(() => {
    // Simulate satellite tracking variation
    const interval = setInterval(() => {
      setSatelliteCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next >= 8 && next <= 16 ? next : prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const latStr = userLocation ? userLocation.lat.toFixed(6) : "-26.191200";
  const lngStr = userLocation ? userLocation.lng.toFixed(6) : "28.026400";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-4 w-full max-w-md mx-auto flex items-center justify-between font-mono text-xs relative overflow-hidden"
    >
      {/* Background glow lines */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-teal-400 to-emerald-500 opacity-80" />

      <div className="flex flex-col gap-1.5 text-left relative z-10">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] font-display flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          Live Space-Segment Telemetry
        </span>
        <div className="flex flex-col gap-0.5 font-bold font-mono text-[13px] text-slate-100 tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px]">LAT:</span>
            <span className="text-blue-400">{latStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[10px]">LNG:</span>
            <span className="text-teal-400">{lngStr}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between h-full gap-2 text-right relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="inline-block text-[8px] font-black text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(52,211,153,0.15)]">
            GNSS LOCK
          </span>
        </div>
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
            <span className="text-slate-500 text-[8px] uppercase">Sats:</span>
            <span>{satelliteCount} active</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center justify-end gap-1.5">
            <span>Acc:</span>
            <span className="text-emerald-400 font-bold">{gpsAccuracy}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
