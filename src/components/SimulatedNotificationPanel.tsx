import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { Settings, BellOff, EyeOff } from 'lucide-react';

export const SimulatedNotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    
    bleDevices,
    userLocation,
    floatingWidgetSize,
    setFloatingWidgetSize,
    decoyActive,
    setDecoyActive,
    silenceAlerts,
    setSilenceAlerts
  } = useAppStore();

  const [opacity, setOpacity] = useState(1.0); // local UI state for opacity
  
  
  const bluetoothConnected = bleDevices.some(d => d.connectionState === 'CONNECTED');

  return (
    <>
      {/* Swipe Handle Trigger */}
      <div 
        className="fixed top-0 left-0 right-0 h-4 z-[999999] flex items-start justify-center group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-12 h-1 bg-slate-500/50 rounded-full mt-1 group-hover:bg-slate-400 transition-colors" />
      </div>

      {/* Notification Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999999] pointer-events-auto flex flex-col"
          >
            {/* Background Blur */}
            <div 
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel Content */}
            <div className="relative w-full bg-slate-900 border-b border-slate-700 shadow-2xl rounded-b-3xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Status Bar Header */}
              <div className="px-6 pt-4 pb-2 flex justify-between items-center bg-slate-950">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Notification Center</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>

              {/* SafetyLink Foreground Service Notification */}
              <div className="p-4 mx-2 mt-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500">
                    <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SL" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-200">SafetyLink Security Engine</h4>
                    <p className="text-[10px] text-emerald-400 font-mono tracking-wider">● FOREGROUND SERVICE ACTIVE</p>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Bluetooth Link</span>
                      <span className={bluetoothConnected ? "text-blue-400 text-xs font-mono" : "text-slate-500 text-xs font-mono"}>
                        {bluetoothConnected ? "SECURED" : "DISCONNECTED"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Location</span>
                      <span className="text-emerald-400 text-xs font-mono truncate">
                        {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "ACQUIRING..."}
                      </span>
                    </div>
                  </div>

                  {/* Widget Controls (Moved from Floating Widget) */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h5 className="text-[9px] text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Settings className="w-3 h-3" /> Widget Controls
                    </h5>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>SIZE: {floatingWidgetSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="48"
                        max="200"
                        value={floatingWidgetSize}
                        onChange={(e) => setFloatingWidgetSize(Number(e.target.value))}
                        className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>OPACITY: {Math.round(opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.0"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Toggle Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => setSilenceAlerts(!silenceAlerts)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors ${
                          silenceAlerts 
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <BellOff className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Silent SOS</span>
                      </button>
                      <button
                        onClick={() => setDecoyActive(!decoyActive)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-colors ${
                          decoyActive 
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <EyeOff className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Decoy Mode</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Handle */}
              <div className="h-6 flex items-center justify-center cursor-pointer pb-2" onClick={() => setIsOpen(false)}>
                <div className="w-12 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
