import React from 'react';
import { useAppStore } from '../utils/store';

export const LocationDisplay: React.FC = () => {
  const { userLocation, gpsAccuracy } = useAppStore();

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md mx-auto font-mono text-xs">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          LIVE HIGH-PRECISION GPS TELEMETRY
        </span>
        <div className="flex gap-4 text-slate-200 font-bold font-mono">
          <span>LAT: {userLocation ? userLocation.lat.toFixed(6) : "-26.191200"}</span>
          <span>LNG: {userLocation ? userLocation.lng.toFixed(6) : "28.026400"}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span className="text-[9px] font-extrabold text-secondary uppercase bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20">
          RT-GNSS ACTIVE
        </span>
        <span className="text-[9px] text-slate-400 mt-1">{gpsAccuracy}</span>
      </div>
    </div>
  );
};
