import React, { useState } from 'react';
import { motion } from 'motion/react';

export const GlobalBackground: React.FC = () => {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#020408]">
      {videoError ? (
        <motion.div
          initial={{ scale: 1, opacity: 0.2 }}
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.35, 0.2]
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
            className="w-full h-full object-cover opacity-25 mix-blend-screen blur-[2px]"
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 w-full h-full opacity-45">
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          >
            <source src="/splash-video.mp4" type="video/mp4" />
          </video>
        </div>
      )}
      
      {/* Subtle cinematic gradient so text remains highly legible while splash video is clearly visible across all pages */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/30 to-slate-950/55 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,transparent_100%)] pointer-events-none" />
    </div>
  );
};
