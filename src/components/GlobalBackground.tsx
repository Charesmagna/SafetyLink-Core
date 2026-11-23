import React, { useRef, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { getR2StreamUrl } from '../utils/r2Assets';
import { useAppStore } from '../utils/store';

export const GlobalBackground: React.FC = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isNative = Capacitor.isNativePlatform();
  const { globalTheme } = useAppStore();
  const isLight = globalTheme === 'light';

  useEffect(() => {
    if (!isNative && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy handled gracefully
      });
    }
  }, [isNative]);

  return (
    <div
      className={`fixed inset-0 z-[0] pointer-events-none overflow-hidden transition-colors duration-300 ${
        isLight
          ? 'bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50'
          : 'bg-[#071124]'
      }`}
    >
      {/* ── Persistent 3D Animated Logo Video Loop Shining Through Frosted Glass ── */}
      {!isNative && !videoError && (
        <div
          className={`absolute inset-0 w-full h-full overflow-hidden filter contrast-[1.08] saturate-[1.18] transition-opacity duration-300 ${
            isLight ? 'opacity-[0.14]' : 'opacity-35'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          >
            <source src="/media/videos/SafetyLink 3D Animation Logo.mp4" type="video/mp4" />
            <source src="/splash-video.mp4" type="video/mp4" />
            <source src={getR2StreamUrl('SafetyLink 3D Animation Logo.mp4')} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Living Ambient Glass Orbs */}
      <div
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl animate-float-slow ${
          isLight ? 'bg-emerald-300/35' : 'bg-emerald-500/18'
        }`}
      />
      <div
        className={`absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full blur-3xl animate-float-slow ${
          isLight ? 'bg-sky-300/30' : 'bg-cyan-500/16'
        }`}
        style={{ animationDelay: '2.5s' }}
      />

      {/* High-contrast tactical micro-grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(rgba(15, 23, 42, 0.14) 1px, transparent 1px)'
            : 'radial-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Atmospheric Depth Vignette */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isLight
            ? 'bg-gradient-to-b from-white/55 via-white/30 to-slate-100/65'
            : 'bg-gradient-to-b from-[#071124]/65 via-[#071124]/45 to-[#050d1c]/82'
        }`}
      />
    </div>
  );
};
