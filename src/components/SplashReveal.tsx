import React, { useEffect, useState, useRef } from 'react';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [videoError, setVideoError] = useState(false);

  // Failsafe in case video doesn't play or end properly
  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, 6000); // Max wait time of 6 seconds
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
      className={`fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Blurred background image fallback if video fails */}
      {videoError && (
        <img
          src="/safetylink-shield.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 z-0 animate-pulse"
        />
      )}

      {/* Main Video */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          onEnded={handleComplete}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover mix-blend-screen"
        >
          <source src="/splash-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Overlay secure networks branding label at the bottom of the screen */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 font-mono text-[9px] text-slate-400/70 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none animate-pulse">
        <span>SEQUENTIAL EMERGENCY NETWORK</span>
        <span className="text-[7px] text-emerald-400/60 tracking-widest mt-0.5">● SECURE HANDSHAKE ESTABLISHED</span>
      </div>
    </div>
  );
};
