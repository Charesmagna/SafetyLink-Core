import React, { useEffect, useState } from 'react';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Max-timeout fallback of 8 seconds to ensure user is never stuck
    const fallbackTimer = setTimeout(() => {
      handleComplete();
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500); // Wait for fadeout animation to complete
  };

  // Immediate skip on click/tap
  const handleSkip = () => {
    onComplete();
  };

  return (
    <div 
      id="splash-reveal-container" 
      onClick={handleSkip}
      className={`fixed inset-0 bg-[#020408] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Startup Animation Video - centered and object-contain (not cropped) */}
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleComplete}
        className="absolute inset-0 w-full h-full object-contain z-10"
      >
        <source src="/petal_20260720_023729.mp4" type="video/mp4" />
      </video>

      {/* Cybernetic background decoration behind the video */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,rgba(2,4,8,0.95)_100%)] pointer-events-none z-0" />

      {/* Overlay secure networks branding label at the bottom of the screen */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 font-mono text-[9px] text-slate-400/70 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none">
        <span>SEQUENTIAL EMERGENCY NETWORK</span>
        <span className="text-[7px] text-emerald-400/60 tracking-widest mt-0.5">● OFFLINE SECURE CONNECTED</span>
      </div>

      {/* Tiny skip hint in corner */}
      <div className="absolute bottom-6 right-6 font-mono text-[8px] text-slate-600 tracking-widest uppercase z-20">
        Tap to Skip
      </div>
    </div>
  );
};
