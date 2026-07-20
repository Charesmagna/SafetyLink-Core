import React, { useState, useEffect, useRef } from 'react';

// Use the available 3D Animation Logo as primary and background.
const primaryVideos = ['/SafetyLink 3D Animation Logo.mp4'];
const secondaryVideos = ['/SafetyLink 3D Animation Logo.mp4'];

export const BackgroundVideoLoop: React.FC = () => {
  const [currentVideo, setCurrentVideo] = useState(primaryVideos[0]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const pickNextVideo = () => {
    // 80% chance for primary, 20% for secondary
    const isPrimary = Math.random() < 0.8;
    const list = isPrimary ? primaryVideos : secondaryVideos;
    let nextVideo = list[Math.floor(Math.random() * list.length)];
    
    // Ensure we don't play the exact same video twice in a row if possible
    if (nextVideo === currentVideo && list.length > 1) {
      nextVideo = list.find(v => v !== currentVideo) || nextVideo;
    }
    
    setCurrentVideo(nextVideo);
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
      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 opacity-60"
    >
      <source src={currentVideo} type="video/mp4" />
    </video>
  );
};
