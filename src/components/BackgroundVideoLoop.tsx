import React, { useState, useEffect, useRef } from 'react';

const homeVideos = ['/media/safetylink_startup.mp4', '/media/Neon Power Logo Reveal_0p.mp4'];
const appVideos = ['/media/Now_I_need_the_d_animation_lo.mp4', '/media/Scene_Setup_vertical_.mp4'];

interface BackgroundVideoLoopProps {
  isHome?: boolean;
}

export const BackgroundVideoLoop: React.FC<BackgroundVideoLoopProps> = ({ isHome = false }) => {
  const [currentVideo, setCurrentVideo] = useState(isHome ? homeVideos[0] : appVideos[0]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentVideo(isHome ? homeVideos[0] : appVideos[0]);
  }, [isHome]);

  const pickNextVideo = () => {
    const list = isHome ? homeVideos : appVideos;
    const currentIndex = list.indexOf(currentVideo);
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentVideo(list[nextIndex]);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [currentVideo]);

  return (
    <video
      ref={videoRef}
      key={currentVideo}
      autoPlay
      muted
      playsInline
      onEnded={pickNextVideo}
      className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 ${isHome ? 'opacity-60' : 'opacity-40'}`}
    >
      <source src={currentVideo} type="video/mp4" />
    </video>
  );
};
