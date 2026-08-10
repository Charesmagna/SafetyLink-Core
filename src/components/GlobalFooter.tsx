import React from 'react';

export const GlobalFooter: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[999999] flex flex-col items-center justify-end">
      <div className="text-[7px] font-mono text-slate-500/80 text-center leading-[1.1] uppercase tracking-wider backdrop-blur-sm bg-slate-950/40 px-4 py-[2px] rounded-t-lg border-t border-l border-r border-slate-800/50">
        <p className="font-bold text-slate-400">SafetyLink - Powered by:</p>
        <p>©TM Media Solutions</p>
        <p>Registration Number : 2018/500191/07</p>
      </div>
    </div>
  );
};
