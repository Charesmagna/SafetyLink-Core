import React, { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

interface SplashRevealProps {
  onComplete: () => void;
}

export const SplashReveal: React.FC<SplashRevealProps> = ({ onComplete }) => {
  const [fadingOut, setFadingOut] = useState<boolean>(false);
  const [videoError, setVideoError] = useState(false);
  const completed = useRef(false);
  const isNative = Capacitor.isNativePlatform();

  const handleComplete = () => {
    if (completed.current) return;
    completed.current = true;
    setFadingOut(true);

    if (isNative) {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    }

    setTimeout(() => {
      onComplete();
    }, isNative ? 200 : 350);
  };

  useEffect(() => {
    if (isNative) {
      SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    }

    // Fast-exit watchdog timer: 1.4s on native APK, 2.5s on web/desktop
    const maxDuration = isNative ? 1400 : 2500;
    const timer = setTimeout(() => {
      handleComplete();
    }, maxDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [isNative]);

  return (
    <div
      id="splash-reveal-container"
      onClick={handleComplete}
      onTouchStart={handleComplete}
      className={`fixed inset-0 bg-[#020408] flex flex-col items-center justify-center z-[99999] overflow-hidden select-none cursor-pointer transition-opacity duration-300 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D Motion Logo Video / Animated Brand Shield */}
      {!videoError ? (
        <div className="relative w-full max-w-xl max-h-[70vh] aspect-video z-10 flex items-center justify-center p-4">
          <video
            autoPlay
            muted
            playsInline
            onEnded={handleComplete}
            onError={() => {
              setVideoError(true);
              setTimeout(handleComplete, 600);
            }}
            className="w-full h-full object-contain"
          >
            <source src="/media/videos/SafetyLink 3D Animation Logo.mp4" type="video/mp4" />
            <source src="/splash-video.mp4" type="video/mp4" />
          </video>
        </div>
      ) : (
        /* Instant High-Contrast Brand Fallback */
        <div className="relative z-10 flex flex-col items-center justify-center gap-5 animate-pulse">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-ping" />
            <img
              src="/logos/New SafetyLink Official Logo.svg"
              alt="SafetyLink"
              className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]"
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-extrabold text-white text-base tracking-wider font-mono">SAFETYLINK CORE</span>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Sequential Emergency Network</span>
          </div>
        </div>
      )}

      {/* Cybernetic ambient grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,rgba(2,4,8,0.96)_100%)] pointer-events-none z-0" />

      {/* Bottom telemetry label */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-1 font-mono text-[9px] text-slate-400/80 tracking-[0.25em] uppercase font-bold z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>AUTONOMOUS MESH GATEWAY</span>
        </div>
        <span className="text-[8px] text-emerald-400/70 tracking-widest mt-0.5">TAP ANYWHERE TO ENTER</span>
      </div>
    </div>
  );
};
