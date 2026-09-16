import React, { useEffect, useState } from 'react';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Hold splash for 3.5 seconds
    const timer = setTimeout(() => {
      handleComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500); // Wait for fadeout animation
  };

  return (
    <div 
      id="splash-reveal-container" 
      onClick={handleComplete}
      className={`fixed inset-0 bg-[#020408] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Blurred background image that fills the screen */}
      <img
        src="/safetylink-shield.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 z-0 animate-pulse"
      />

      {/* Main Logo Image with animation */}
      <div className="relative z-10 w-full max-w-sm px-8">
        <img
          src="/safetylink-shield.jpg"
          alt="SafetyLink Shield"
          className="w-full h-auto drop-shadow-2xl mix-blend-screen scale-90 animate-[pulse_2s_ease-in-out_infinite]"
        />
      </div>

      {/* Cybernetic background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,rgba(2,4,8,0.95)_100%)] pointer-events-none z-0" />

      {/* Overlay secure networks branding label at the bottom of the screen */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 font-mono text-[9px] text-slate-400/70 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none animate-pulse">
        <span>SEQUENTIAL EMERGENCY NETWORK</span>
        <span className="text-[7px] text-emerald-400/60 tracking-widest mt-0.5">● SECURE HANDSHAKE ESTABLISHED</span>
      </div>
    </div>
  );
};
