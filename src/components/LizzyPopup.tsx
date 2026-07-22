import React from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const LizzyPopup: React.FC = () => {
  const { showLizzyPopup, setShowLizzyPopup, startMultiStagePanic, resolvePanic, currentPanicEvent } = useAppStore();

  const handleRestart = () => {
    setShowLizzyPopup(false);
    startMultiStagePanic('Lizzy verified continuation of distress.');
  };

  const handleResolve = () => {
    if (currentPanicEvent?.id) {
      resolvePanic(currentPanicEvent.id);
    }
    setShowLizzyPopup(false);
  };

  return (
    <AnimatePresence>
      {showLizzyPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-purple-500/50 shadow-2xl shadow-purple-500/20 rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
            
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
              <span className="text-3xl">💜</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Lizzy from SafetyLink</h2>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              "Hi, it's Lizzy. Are you okay? Did help arrive?"
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                <ShieldAlert size={18} />
                Restart Panic
              </button>
              
              <button
                onClick={handleResolve}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-3.5 rounded-xl transition-colors"
              >
                <CheckCircle2 size={18} />
                I'm Okay
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
