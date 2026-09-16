import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Battery, RefreshCw, X, ChevronRight } from 'lucide-react';

export const DeviceAlertOverlay: React.FC = () => {
  const { bleDevices, connectBleDevice } = useAppStore();
  const [snoozedMacs, setSnoozedMacs] = useState<Record<string, number>>({});

  // Scan for active critical devices:
  // 1. Connection state is DISCONNECTED
  // 2. Battery level is 20% or lower
  const criticalDevices = bleDevices.filter((d) => {
    // If it was snoozed within the last 5 minutes, do not show alert
    const snoozeTime = snoozedMacs[d.macAddress];
    if (snoozeTime && Date.now() - snoozeTime < 5 * 60 * 1000) {
      return false;
    }

    const isDisconnected = d.connectionState === 'DISCONNECTED';
    const isLowBattery = d.batteryLevel <= 20;

    return isDisconnected || isLowBattery;
  });

  if (criticalDevices.length === 0) return null;

  const handleSnooze = (macAddress: string) => {
    setSnoozedMacs((prev) => ({
      ...prev,
      [macAddress]: Date.now(),
    }));
  };

  return (
    <AnimatePresence>
      <div 
        id="device-alert-overlay"
        className="fixed inset-x-0 top-16 z-[9000] p-4 flex flex-col items-center pointer-events-none"
      >
        <div className="w-full max-w-md flex flex-col gap-3">
          {criticalDevices.map((device) => {
            const isDisconnected = device.connectionState === 'DISCONNECTED';
            const isLowBattery = device.batteryLevel <= 20;

            return (
              <motion.div
                key={device.macAddress}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="pointer-events-auto bg-slate-950/95 border border-amber-500/30 shadow-[0_12px_40px_rgba(245,158,11,0.15)] rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md relative overflow-hidden"
              >
                {/* Visual Accent Glow */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                    {isDisconnected ? <WifiOff className="w-5 h-5 animate-pulse" /> : <Battery className="w-5 h-5 text-amber-500" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest leading-none">
                        Hardware Sentinel Alert
                      </span>
                      <button
                        onClick={() => handleSnooze(device.macAddress)}
                        className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                        title="Snooze warning (5m)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <h4 className="text-xs font-extrabold text-slate-100 mt-1 uppercase font-mono tracking-tight flex items-center gap-1.5">
                      {device.friendlyName}
                    </h4>
                    
                    <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                      MAC: {device.macAddress}
                    </p>

                    <p className="text-[11px] text-slate-300 leading-relaxed mt-2 font-sans">
                      {isDisconnected && isLowBattery ? (
                        <>Wearable is <span className="text-red-400 font-bold font-mono">OFFLINE</span> with a critical battery level (<span className="text-red-400 font-bold font-mono">{device.batteryLevel}%</span>). Urgent attention required.</>
                      ) : isDisconnected ? (
                        <>Bound physical button is <span className="text-amber-400 font-bold font-mono">DISCONNECTED</span>. Panic trigger signal is inactive.</>
                      ) : (
                        <>Device battery is low (<span className="text-amber-400 font-bold font-mono">{device.batteryLevel}%</span>). Please replace the CR2032 lithium cell soon.</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-900/60 pt-3">
                  {isDisconnected ? (
                    <button
                      onClick={() => connectBleDevice(device.macAddress)}
                      className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-mono font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>RECONNECT KEY</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-3 bg-slate-900/60 rounded-xl text-[9px] font-mono font-bold text-slate-400 flex items-center gap-2">
                      <Battery className="w-4 h-4 text-amber-500" />
                      <span>Level: {device.batteryLevel}% (Low)</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleSnooze(device.macAddress)}
                    className="py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-300 text-[10px] font-mono font-black rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>SNOOZE 5M</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatePresence>
  );
};
