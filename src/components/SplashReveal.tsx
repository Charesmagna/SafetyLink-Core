import React, { useEffect, useState, useRef } from 'react';
import { R2_MEDIA_VAULT } from '../utils/continuousMediaEngine';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [videoError, setVideoError] = useState(false);
  const completedRef = useRef(false);

  // Use the verified 3D Motion Logo from R2 with local fallback
  const motionLogo = R2_MEDIA_VAULT.find((m) => m.id === 'logo-3d-anim');
  const videoSrc = motionLogo?.src || '/splash-video.mp4';

  const handleComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  // Safe timeout to prevent indefinite blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, 4800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      id="splash-reveal-container" 
      onClick={handleComplete}
      className={`fixed inset-0 w-screen h-screen bg-[#000000] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-500 ease-out m-0 p-0 border-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, border: 'none', background: '#000000' }}
    >
      {/* 3D Motion Logo Video */}
      {!videoError ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden m-0 p-0 border-none">
          <video
            autoPlay
            muted
            playsInline
            onEnded={handleComplete}
            onError={() => {
              console.warn('[SplashReveal] Video playback fallback triggered');
              setVideoError(true);
              setTimeout(handleComplete, 2200);
            }}
            className="w-full h-full object-cover m-0 p-0 border-none"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src="/splash-video.mp4" type="video/mp4" />
          </video>
        </div>
      ) : (
        /* Motion Brand Fallback if video is blocked */
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 animate-pulse">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-ping" />
            <img
              src="/logos/New SafetyLink Official Logo.svg"
              alt="SafetyLink"
              className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_0_25px_rgba(16,185,129,0.8)]"
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-extrabold text-white text-lg tracking-wider font-mono">SAFETYLINK CORE</span>
            <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">Sequential Emergency Network</span>
          </div>
        </div>
      )}

      {/* Atmospheric bottom telemetry marker */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-1 font-mono text-[9px] text-slate-400/80 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AUTONOMOUS MESH GATEWAY</span>
        </div>
        <span className="text-[8px] text-emerald-400/70 tracking-widest mt-0.5">TAP TO ENTER DIRECTLY</span>
      </div>
    </div>
  );
};
