import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, SkipForward, Play, Pause, Radio, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { BACKGROUND_CYCLE_PLAYLIST, R2MediaItem } from '../utils/continuousMediaEngine';

export const GlobalBackground: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const currentItem: R2MediaItem = BACKGROUND_CYCLE_PLAYLIST[currentIndex] || BACKGROUND_CYCLE_PLAYLIST[0];

  const handleNext = () => {
    setMediaError(false);
    setCurrentIndex((prev) => (prev + 1) % BACKGROUND_CYCLE_PLAYLIST.length);
  };

  // For static posters/blueprints, auto-advance after 14 seconds
  useEffect(() => {
    if (currentItem.type === 'image' && isPlaying) {
      const timer = setTimeout(() => {
        handleNext();
      }, 14000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, currentItem.type]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const togglePlay = () => {
    if (currentItem.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    setMediaError(false);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#020617]">
      {/* Dynamic Streaming Layer with smooth cross-fade */}
      <div className="absolute inset-0 w-full h-full opacity-70 transition-opacity duration-1000">
        {currentItem.type === 'video' && !mediaError ? (
          <video
            ref={videoRef}
            key={currentItem.src}
            autoPlay
            loop={false}
            muted={isMuted}
            playsInline
            onEnded={handleNext}
            onError={() => {
              console.warn('[GlobalBackground] Video error on', currentItem.src);
              setMediaError(true);
              setTimeout(handleNext, 1200);
            }}
            className="w-full h-full object-cover"
          >
            <source src={currentItem.src} type="video/mp4" />
            {currentItem.fallbackSrc && <source src={currentItem.fallbackSrc} type="video/mp4" />}
          </video>
        ) : !mediaError ? (
          /* High-Resolution Poster, Tactical Blueprint or Infographic */
          <div className="w-full h-full flex items-center justify-center relative bg-slate-950/40 overflow-hidden">
            <img
              key={currentItem.src}
              src={currentItem.src}
              alt={currentItem.title}
              onError={() => {
                console.warn('[GlobalBackground] Image load error on', currentItem.src);
                setMediaError(true);
                setTimeout(handleNext, 1200);
              }}
              className="w-full h-full object-cover object-center filter saturate-[1.2] contrast-[1.1] transform scale-105 transition-transform duration-[14000ms] ease-linear"
            />
            {/* Subtle scanning grid line over blueprint images */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.5px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full bg-[#020617]/80" />
        )}
      </div>

      {/* Atmospheric Vignettes and Grid Overlays - softer to let media show through */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/20 to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/15 via-transparent to-transparent pointer-events-none" />

      {/* Persistent Media Telemetry Pill in corner */}
      <div className="absolute bottom-5 right-5 z-20 pointer-events-auto flex items-center gap-2">
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-full px-3.5 py-1.5 shadow-2xl flex items-center gap-3 text-xs text-slate-300">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none" 
            onClick={() => setIsExpanded(!isExpanded)}
            title="Continuous R2 Streaming Vault"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            {currentItem.type === 'video' ? (
              <VideoIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <div className="max-w-[190px] truncate hidden sm:block">
              <span className="font-semibold text-white">{currentItem.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
            {currentItem.type === 'video' && (
              <>
                <button
                  onClick={togglePlay}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause broadcast' : 'Play broadcast'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={toggleSound}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute Audio Explainer' : 'Mute Audio'}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </>
            )}
            <button
              onClick={handleNext}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Next R2 Media"
              aria-label="Next Media"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
