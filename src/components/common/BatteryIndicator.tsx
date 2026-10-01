import React, { useState, useEffect } from 'react';
import { NativeDispatchService, DeviceBatteryStatus } from '../../services/NativeDispatchService';

interface BatteryIndicatorProps {
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  theme = 'dark',
  compact = false,
}) => {
  const [battery, setBattery] = useState<DeviceBatteryStatus>({
    level: 100,
    isCharging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
    isSupported: true,
  });

  useEffect(() => {
    // Initial fetch from hardware bridge or browser battery API
    NativeDispatchService.getDeviceBattery().then(setBattery).catch(() => {});

    // Listen to real-time events from hardware / battery API
    const unsubscribe = NativeDispatchService.subscribeBatteryUpdates((status) => {
      setBattery(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const { level, isCharging, isSupported } = battery;

  if (!isSupported && level < 0) {
    return null;
  }

  // Determine indicator color based on charge status & level
  const getBatteryColor = () => {
    if (isCharging) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (level <= 15) return 'text-red-500 border-red-500/50 bg-red-500/15 animate-pulse';
    if (level <= 30) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return theme === 'light'
      ? 'text-slate-700 border-slate-300 bg-slate-100'
      : 'text-slate-300 border-slate-700 bg-slate-900/60';
  };

  const getBarFillColor = () => {
    if (isCharging) return '#10b981'; // Emerald 500
    if (level <= 15) return '#ef4444'; // Red 500
    if (level <= 30) return '#f59e0b'; // Amber 500
    return theme === 'light' ? '#334155' : '#10b981';
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold tracking-wider select-none transition-all shadow-sm ${getBatteryColor()}`}
      title={`Device Battery: ${level}%${isCharging ? ' (Charging)' : ''}`}
    >
      {/* Battery Icon with dynamic fill bar and terminal cap */}
      <div className="relative flex items-center">
        {/* Main battery shell */}
        <div
          className={`w-5 h-2.5 rounded-[3px] border p-0.5 flex items-center ${
            theme === 'light' ? 'border-slate-500' : 'border-slate-400'
          }`}
        >
          {/* Inner capacity level fill */}
          <div
            className="h-full rounded-[1.5px] transition-all duration-500 ease-out"
            style={{
              width: `${Math.max(8, Math.min(100, level))}%`,
              backgroundColor: getBarFillColor(),
            }}
          />
        </div>
        {/* Positive terminal nipple */}
        <div
          className={`w-[2px] h-1.5 rounded-r-[1px] ml-[0.5px] ${
            theme === 'light' ? 'bg-slate-500' : 'bg-slate-400'
          }`}
        />

        {/* Charging Lightning Bolt Icon */}
        {isCharging && (
          <span className="absolute -top-1 -right-1 text-[9px] leading-none text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]">
            ⚡
          </span>
        )}
      </div>

      {/* Numerical percentage display */}
      {!compact && (
        <span className="leading-none text-[10px] font-semibold">
          {level}%
        </span>
      )}
    </div>
  );
};
