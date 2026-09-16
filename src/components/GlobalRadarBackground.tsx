import React from 'react';

export const GlobalRadarBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-30">
      {/* Radar scanning circle */}
      <div className="absolute w-[800px] h-[800px] border border-emerald-500/10 rounded-full" />
      <div className="absolute w-[600px] h-[600px] border border-emerald-500/20 rounded-full" />
      <div className="absolute w-[400px] h-[400px] border border-emerald-500/30 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.1)]" />
      
      {/* Crosshairs */}
      <div className="absolute w-full h-[1px] bg-emerald-500/10" />
      <div className="absolute h-full w-[1px] bg-emerald-500/10" />

      {/* Rotating Scanner Sweep */}
      <div className="absolute w-[400px] h-[400px] rounded-full overflow-hidden">
        <div className="w-1/2 h-1/2 bg-gradient-to-tr from-emerald-500/40 to-transparent origin-bottom-right animate-[spin_4s_linear_infinite]" />
      </div>
      
      {/* Target points */}
      <div className="absolute w-2 h-2 bg-emerald-400 rounded-full top-[30%] left-[40%] animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
      <div className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full top-[60%] right-[30%] animate-ping" />
      <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full bottom-[20%] left-[25%] animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]" />
      
      {/* Hex grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTEyIDBMIDI0IDIwdjIwbC0xMi0yMEwwIDIwaC0yNHYtMjBsMTItMjB6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTYsIDE4NSwgMTI5LCAwLjA0KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-20" />
    </div>
  );
};
