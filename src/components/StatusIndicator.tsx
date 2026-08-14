import React from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';

export const StatusIndicator: React.FC = () => {
  const { bleDevices, activeSOSState } = useAppStore();

  const isBleConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const isSosBeaconActive = activeSOSState !== 'IDLE';

  const metrics = [
    {
      label: 'BLE LINK',
      value: isBleConnected ? 'LINKED' : 'TERMINATED',
      status: isBleConnected ? 'OK' : 'ERR',
      colorClass: isBleConnected ? 'bg-emerald-500 neon-glow-emerald' : 'bg-red-500 neon-glow-red',
      textColor: isBleConnected ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'GNSS LOCK',
      value: isSosBeaconActive ? 'HPE LOCK' : 'SECURE LOCK',
      status: 'OK',
      colorClass: 'bg-emerald-500 neon-glow-emerald',
      textColor: 'text-emerald-400',
    },
    {
      label: 'SOS SECURE',
      value: isSosBeaconActive ? 'BROADCASTING' : 'STANDBY',
      status: isSosBeaconActive ? 'DISTRESS' : 'SECURE',
      colorClass: isSosBeaconActive ? 'bg-red-500 neon-glow-red animate-ping' : 'bg-emerald-500 neon-glow-emerald',
      textColor: isSosBeaconActive ? 'text-red-400' : 'text-emerald-400',
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto font-mono text-[10px] font-bold">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="glass-panel rounded-2xl p-3 flex flex-col justify-between h-18 shadow-xl relative overflow-hidden"
        >
          {/* Subtle inside glow */}
          <div className="absolute top-0 right-0 p-1.5 opacity-30 text-[8px] font-black text-slate-500 uppercase">
            {m.status}
          </div>

          <span className="text-[8px] text-slate-500 uppercase tracking-widest font-display">{m.label}</span>
          
          <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.colorClass}`} />
            <span className={`truncate ${m.textColor} text-[11px] font-black uppercase tracking-wide`}>
              {m.value}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
