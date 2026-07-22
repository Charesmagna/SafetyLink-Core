import { SLShieldLogo } from "./SLShieldLogo";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { Wifi, WifiOff, Bluetooth, RefreshCw } from 'lucide-react';

export const FloatingPanicWidget: React.FC = () => {
  const {
    activeSOSState,
    bleDevices,
    isSurvivalMode,
    startMultiStagePanic,
    panicCountdown,
    isFloatingWidgetDeployed,
    setFloatingWidgetDeployed
  } = useAppStore();
  
  const isSOSActive = activeSOSState !== 'IDLE';
  const bluetoothConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');
  const isCountdownActive = panicCountdown !== null;
  const isOfflineMode = false; // Mocking offline mode since it doesn't exist in AppStore
  
  const [position, setPosition] = useState({ x: 10, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // If survival mode activated, auto-deploy the widget
    if (isSurvivalMode && !isFloatingWidgetDeployed) {
      setFloatingWidgetDeployed(true);
    }
  }, [isSurvivalMode, isFloatingWidgetDeployed, setFloatingWidgetDeployed]);

  if (!isFloatingWidgetDeployed) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      dragRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      if (dragRef.current) {
        dragRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  return (
    <div
      className="fixed z-[99999] pointer-events-auto"
      style={{
        left: `${Math.max(0, Math.min(window.innerWidth - 250, position.x))}px`,
        top: `${Math.max(0, Math.min(window.innerHeight - 60, position.y))}px`,
        touchAction: 'none'
      }}
    >
      <motion.div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`flex items-center gap-3 p-2 rounded-full shadow-2xl backdrop-blur-xl border ${
          isSOSActive 
            ? 'bg-red-950/80 border-red-500/50' 
            : isCountdownActive
            ? 'bg-amber-950/80 border-amber-500/50'
            : 'bg-slate-900/90 border-slate-700/50'
        }`}
      >
        {/* Logo on the left */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-700 bg-black flex items-center justify-center">
          <SLShieldLogo />
        </div>

        {/* Status Icons */}
        <div className="flex items-center gap-2 px-1">
          {/* Connectivity Status */}
          {isOfflineMode ? (
            <WifiOff className="w-5 h-5 text-amber-500/80" strokeWidth={2.5} />
          ) : (
            <Wifi className="w-5 h-5 text-emerald-400/80" strokeWidth={2.5} />
          )}

          {/* Bluetooth Status */}
          <Bluetooth 
            className={`w-5 h-5 ${bluetoothConnected ? 'text-blue-400' : 'text-slate-500'} ${!bluetoothConnected && 'opacity-50'}`} 
            strokeWidth={2.5} 
          />

          {/* Auto-Reconnect */}
          <button onClick={() => console.log('Reconnecting...')} className="active:scale-90 transition-transform">
            <RefreshCw className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
          </button>
        </div>

        {/* SOS Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isSOSActive && !isCountdownActive) {
              startMultiStagePanic("Manual trigger from strip widget", 0);
            }
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${
            isSOSActive
              ? 'bg-red-600 animate-pulse text-white'
              : isCountdownActive
              ? 'bg-amber-500 animate-pulse text-black font-black text-sm'
              : 'bg-red-500 hover:bg-red-400 text-white active:scale-95'
          }`}
        >
          {isCountdownActive ? (
            <span>{panicCountdown}</span>
          ) : (
            <span className="font-black text-[10px] tracking-tighter">SOS</span>
          )}
        </button>
      </motion.div>
    </div>
  );
};
