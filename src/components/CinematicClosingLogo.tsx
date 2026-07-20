import React, { useEffect, useState } from 'react';


interface CinematicClosingLogoProps {
  onComplete: () => void;
}

export const CinematicClosingLogo: React.FC<CinematicClosingLogoProps> = ({
  onComplete
}) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
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
    }, 500);
  };

  return (
    <div id="closing-logo-container" className={`fixed inset-0 bg-[#020408] text-white flex flex-col items-center justify-center z-[99999] overflow-hidden select-none transition-opacity duration-500 ease-out ${
      fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Video Background */}
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleComplete}
        className="absolute inset-0 w-full h-full object-contain z-10"
      >
        <source src="/petal_20260720_023729.mp4" type="video/mp4" />
      </video>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40 animate-pulse z-0" />
      
      {/* Footer Text */}
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-1.5 font-mono text-[9px] text-slate-400/70 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none">
        <span>SECURING CONSOLE...</span>
        <span className="text-[7px] text-emerald-400/60 tracking-widest mt-0.5">PINNING PERSISTENT BACKGROUND LISTENERS</span>
      </div>
    </div>
  );
};
