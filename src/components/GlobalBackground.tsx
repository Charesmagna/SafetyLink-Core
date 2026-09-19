import React, { useState } from 'react';

export const GlobalBackground: React.FC = () => {
  const [videoError, setVideoError] = useState(false);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#020617]">
      {!videoError && (
        <div className="absolute inset-0 w-full h-full opacity-30">
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
            style={{ background: 'transparent' }}
          >
            <source src="https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/petal_20260906_213751.mp4" type="video/mp4" />
          </video>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/70 pointer-events-none" />
    </div>
  );
};
