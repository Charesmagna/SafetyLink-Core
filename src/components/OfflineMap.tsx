import React from 'react';
import { useAppStore } from '../utils/store';

export const OfflineMap: React.FC = () => {
  const { userLocation, gpsAccuracy, activeSOSState } = useAppStore();

  const mockIncidents = [
    { name: 'Wits Campus Collapsed Student', lat: -26.1912, lng: 28.0264, status: 'DISPATCHED' },
    { name: 'Sandton Armed Heist', lat: -26.1044, lng: 28.0526, status: 'ACTIVE' },
    { name: 'Table Mountain Ridge Rescue', lat: -33.9628, lng: 18.4252, status: 'RESOLVED' }
  ];

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500 opacity-60" />

      <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
        <div className="text-left">
          <h3 className="text-base font-black text-slate-100 tracking-tight font-mono">
            TACTICAL MAP
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Offline cached environment
          </p>
        </div>
        <span className="text-[8px] font-mono font-extrabold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full uppercase animate-pulse">
          TILES IN-CACHE
        </span>
      </div>

      {/* Map visual panel (High fidelity container rendering offline grid & trackers) */}
      <div className="relative w-full h-64 bg-slate-950/80 border border-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between p-4 font-mono">
        {/* Abstract radar sweeps or crosshairs overlaying the representation */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        {/* High-tech custom radar interface instead of standard online Leaflet canvas to guarantee offline compatibility & visual perfection */}
        <div className="relative z-10 w-full flex justify-between text-[9px] text-slate-500 border-b border-slate-900 pb-2">
          <span>COORDS: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}</span>
          <span className="text-blue-400 font-bold">{gpsAccuracy}</span>
        </div>

        {/* Tactical target representation representing Johannesburg Area */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing radar circles */}
            <div className="absolute inset-0 rounded-full border border-slate-800/60 animate-ping opacity-25" />
            <div className="absolute w-24 h-24 rounded-full border border-slate-800/40" />
            <div className="absolute w-12 h-12 rounded-full border border-slate-800/20" />
            
            {/* Center crosshairs */}
            <div className="absolute w-full h-px bg-slate-800/50" />
            <div className="absolute h-full w-px bg-slate-800/50" />

            {/* Active User Target Dot */}
            <div className={`absolute w-3.5 h-3.5 rounded-full flex items-center justify-center ${activeSOSState !== 'IDLE' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>

            <span className="absolute -top-5 text-[8px] font-bold text-slate-300 tracking-wider bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded shadow">
              MY BEACON (GP-LOC-01)
            </span>
          </div>
        </div>

        {/* Map legend footer */}
        <div className="relative z-10 bg-slate-900/90 border border-slate-800/60 p-2 rounded-xl flex justify-between items-center text-[9px]">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Stable</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-slate-400">Incident active</span>
            </div>
          </div>
          <span className="text-slate-500">Offline Leaflet v1.9</span>
        </div>
      </div>

      {/* List of simulated nearby incidents */}
      <div className="space-y-2 text-left">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Nearby Emergency Operations
        </span>
        <div className="grid grid-cols-1 gap-2 font-mono text-[10px]">
          {mockIncidents.map((incident, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-950/70 rounded-xl border border-slate-900 hover:border-slate-800">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-slate-200 font-bold">{incident.name}</span>
                <span className="text-[9px] text-slate-500 font-mono">Coords: {incident.lat}, {incident.lng}</span>
              </div>
              <span className={`px-2 py-0.5 text-[8px] rounded-full font-extrabold tracking-wider ${
                incident.status === 'ACTIVE' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                incident.status === 'DISPATCHED' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' :
                'bg-slate-900 border border-slate-800 text-slate-400'
              }`}>
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
