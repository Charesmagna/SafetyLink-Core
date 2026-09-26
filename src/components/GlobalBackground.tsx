import React, { useRef, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const GlobalBackground: React.FC = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy or video decode fallback handled gracefully
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#020617]">
      {/* ── Persistent Splash Screen Video Loop Throughout the Platform ── */}
      {!isNative && !videoError && (
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-30 filter contrast-[1.08] saturate-[1.15]">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onError={() => {
              console.warn('[GlobalBackground] Splash video error, applying visual fallback');
              setVideoError(true);
            }}
            className="w-full h-full object-cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <source src="/media/videos/SafetyLink 3D Animation Logo.mp4" type="video/mp4" />
            <source src="/splash-video.mp4" type="video/mp4" />
            <source src="/api/r2/stream/Safetylink%2FSafetyLink%203D%20Animation%20Logo.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* High-contrast tactical grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Atmospheric High-Contrast Tactical Vignettes - keeps text razor sharp */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/75 via-[#020617]/60 to-[#020617]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Subtle status telemetry watermark in corner */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 font-mono text-[9px] text-slate-500/70 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <span>SAFETYLINK MESH // LIVE</span>
      </div>
    </div>
  );
};


