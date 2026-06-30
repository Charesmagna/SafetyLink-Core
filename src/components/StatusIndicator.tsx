import React from 'react';
import { useAppStore } from '../utils/store';

export const StatusIndicator: React.FC = () => {
  const { bleDevices, activeSOSState } = useAppStore();

  const isBleConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const isSosBeaconActive = activeSOSState !== 'IDLE';

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto font-mono text-[11px] font-bold">
      {/* BLE Wearables Node */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between h-16 shadow">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">BLE STATUS</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${isBleConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-slate-100 truncate">
            {isBleConnected ? "WEARABLE LINKED" : "LINK TERMINATED"}
          </span>
        </div>
      </div>

      {/* Geolocation Lock Node */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between h-16 shadow">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">GNSS RECEIVER</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-slate-100">
            {isSosBeaconActive ? "HPE LOCK INITIATED" : "STABLE LOCK"}
          </span>
        </div>
      </div>

      {/* Dispatch Gateway state */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between h-16 shadow">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">SOS BEACON</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${isSosBeaconActive ? 'bg-error animate-pulse' : 'bg-green-500'}`} />
          <span className={`truncate ${isSosBeaconActive ? 'text-error animate-pulse' : 'text-slate-100'}`}>
            {isSosBeaconActive ? "ALERT BROADCAST" : "MONITORING IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
};
