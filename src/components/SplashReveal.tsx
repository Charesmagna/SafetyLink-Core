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
      className={`fixed inset-0 w-screen h-screen bg-[#000000] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out m-0 p-0 border-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, border: 'none', background: '#000000' }}
    >
      {/* Blurred background image fallback if video fails */}
      {videoError && (
        <img
          src="/safetylink-shield.jpg"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 z-0 animate-pulse"
        />
      )}

      {/* Main Video: 100% full screen edge-to-edge */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden m-0 p-0 border-none">
        <video
          autoPlay
          muted
          playsInline
          onEnded={handleComplete}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover m-0 p-0 border-none"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
