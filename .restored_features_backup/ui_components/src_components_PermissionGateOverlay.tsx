import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../utils/store';
import { ShieldAlert, Check, X } from 'lucide-react';

export const PermissionGateOverlay: React.FC = () => {
  const { permissions, grantAllPermissions } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const skip = localStorage.getItem('sl_skip_permissions') === 'true';
    if (!skip) {
      const allKeys: (keyof typeof permissions)[] = ['location', 'backgroundLocation', 'bluetooth', 'sms', 'phone', 'notifications', 'batteryBypass'];
      const needsPermissions = allKeys.some(k => !permissions[k]);
      setIsVisible(needsPermissions);
    }
  }, [permissions]);

  if (!isVisible) return null;

  const handleGrantAll = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn("Permission request failed", e);
    }
    grantAllPermissions();
    setIsVisible(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem('sl_skip_permissions', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
          
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
              <ShieldAlert className="w-8 h-8 text-blue-400" />
            </div>
            
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-slate-100 font-display">System Setup</h2>
              <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                SafetyLink requires location and notification permissions to function correctly in the background during emergencies. 
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800 space-y-3">
            <button
              onClick={handleGrantAll}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Activate & Grant Permissions
            </button>
            <button
              onClick={handleNeverShow}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Skip & Never Show Again
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
