import React, { useEffect, useState, useRef } from 'react';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const completed = useRef(false);

  useEffect(() => {
    // Max-timeout fallback of 5 seconds to ensure user is never stuck
    const fallbackTimer = setTimeout(() => {
      handleComplete();
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleComplete = () => {
    if (completed.current) return;
    completed.current = true;
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500); // Wait for fadeout animation to complete
  };

  // Immediate skip on click/tap
  const handleSkip = () => {
    if (completed.current) return;
    completed.current = true;
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
      {/* Blurred background video that fills the screen */}
      <video
        autoPlay
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 z-0"
      >
        <source src="/media/petal_20260720_023729.mp4" type="video/mp4" />
      </video>

      {/* Startup Animation Video - centered and object-contain (not cropped) in 16:9 */}
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] aspect-video z-10 shadow-2xl flex items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          onEnded={handleComplete}
          onError={handleComplete}
          className="w-full h-full object-contain"
        >
          <source src="/media/petal_20260720_023729.mp4" type="video/mp4" />
        </video>
      </div>

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
