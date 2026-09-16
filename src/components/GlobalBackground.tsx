import React from 'react';
import { motion } from 'framer-motion';

export const GlobalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#020408]">
      <motion.div
        initial={{ scale: 1, opacity: 0.15 }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="absolute inset-0 w-full h-full"
      >
        <img 
          src="/safetylink-shield.jpg" 
          alt="SafetyLink Shield Background" 
          className="w-full h-full object-cover opacity-20 mix-blend-screen blur-[2px]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_100%)] pointer-events-none" />
    </div>
  );
};
