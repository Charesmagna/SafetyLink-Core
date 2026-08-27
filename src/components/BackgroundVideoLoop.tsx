import React, { useState, useEffect, useRef } from 'react';

const homeVideos = ['https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787696129/Make_this_come_to_life.mp4', 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4'];
const appVideos = ['https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310213/Now_I_need_the_d_animation_lo.mp4', 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310110/petal_20260727_180314.mp4'];

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
