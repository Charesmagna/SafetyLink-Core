import React, { useState } from 'react';
import { DownloadHub } from './DownloadHub';

export const GlobalFooter: React.FC = () => {
  const [showDownloads, setShowDownloads] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[999998] flex flex-col items-center justify-end">
        <div className="text-[7px] font-mono text-slate-500/80 text-center leading-[1.1] uppercase tracking-wider backdrop-blur-sm bg-slate-950/40 px-4 py-[3px] rounded-t-lg border-t border-l border-r border-slate-800/50 flex flex-col items-center gap-0.5">
          <p className="font-bold text-slate-400">SAFETYLINK - POWERED BY:</p>
          <p>©TM MEDIA SOLUTIONS</p>
          <p>REGISTRATION NUMBER : 2018/500191/07</p>
          <div className="flex items-center gap-2 mt-0.5">
            <a 
              href="https://safetylink.online" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 underline pointer-events-auto"
            >
              safetylink.online
            </a>
            <span className="text-slate-600">|</span>
            <button 
              onClick={() => setShowDownloads(true)}
              className="text-amber-500 hover:text-amber-400 underline pointer-events-auto font-bold flex items-center gap-1"
            >
              Download App
            </button>
          </div>
        </div>
      </div>
      
      {showDownloads && <DownloadHub onClose={() => setShowDownloads(false)} />}
    </>
  );
};
