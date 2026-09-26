import React from 'react';
import { OfflineMap } from './OfflineMap';

export const GeospatialAnalytics: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">// Geospatial Telemetry & Analytics</h3>
          <p className="text-xs text-slate-400">Live spatial triangulation and regional incident cluster heatmaps</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          MESH ACTIVE
        </span>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-800 min-h-[360px]">
        <OfflineMap />
      </div>
    </div>
  );
};
