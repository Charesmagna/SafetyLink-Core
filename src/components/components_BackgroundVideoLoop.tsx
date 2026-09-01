import React, { useState, useEffect, useRef } from 'react';

const homeVideos = ['/media/petal_20260720_023729.mp4'];
const appVideos = ['/media/petal_20260720_024055.mp4'];

interface BackgroundVideoLoopProps {
  isHome?: boolean;
}

export const BackgroundVideoLoop: React.FC<BackgroundVideoLoopProps> = ({ isHome = false }) => {
  const [currentVideo, setCurrentVideo] = useState(isHome ? homeVideos[0] : appVideos[0]);
  const videoRefBg = useRef<HTMLVideoElement>(null);
  const videoRefFg = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentVideo(isHome ? homeVideos[0] : appVideos[0]);
  }, [isHome]);

  const pickNextVideo = () => {
    if (videoRefBg.current && videoRefFg.current) {
      videoRefBg.current.currentTime = 0;
      videoRefFg.current.currentTime = 0;
      videoRefBg.current.play().catch(e => console.error("Video bg play failed", e));
      videoRefFg.current.play().catch(e => console.error("Video fg play failed", e));
    }
  };

  useEffect(() => {
    if (videoRefBg.current && videoRefFg.current) {
      videoRefBg.current.play().catch(e => console.error("Video bg play failed", e));
      videoRefFg.current.play().catch(e => console.error("Video fg play failed", e));
    }
  }, [currentVideo]);

  return (
    <>
      <video
        ref={videoRefBg}
        key={`${currentVideo}-bg`}
        autoPlay
        muted
        playsInline
        onEnded={pickNextVideo}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 blur-2xl ${isHome ? 'opacity-30' : 'opacity-10'}`}
      >
        <source src={currentVideo} type="video/mp4" />
      </video>
      <video
        ref={videoRefFg}
        key={`${currentVideo}-fg`}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 mix-blend-screen ${isHome ? 'opacity-20' : 'opacity-5'}`}
      >
        <source src={currentVideo} type="video/mp4" />
      </video>
    </>
  );
};
