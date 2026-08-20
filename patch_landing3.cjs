const fs = require('fs');

const code = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadHub } from './DownloadHub';

interface LandingPageProps {
  onLogin: () => void;
  onRegisterOrg?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegisterOrg }) => {
  const [showDownloadHub, setShowDownloadHub] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1c222e] text-slate-200 font-sans relative overflow-x-hidden overflow-y-auto flex flex-col">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#151a23]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c8a14b] to-[#997a38] rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-[#c8a14b]/20">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">SAFETYLINK™</h1>
            <p className="text-[9px] text-[#c8a14b] font-mono tracking-widest uppercase">Intelligent Emergency Response Systems</p>
          </div>
        </div>

        {/* Burger Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors text-white"
        >
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
      </header>

      {/* Main Content Area (Single View) */}
      <main className="relative z-10 flex-1 flex flex-col items-center p-4 md:p-6 w-full max-w-[1400px] mx-auto">
        
        {/* Main Title */}
        <div className="text-center mb-6 w-full bg-[#2a3441] border border-slate-700 rounded-xl py-3 px-6 flex flex-col md:flex-row items-center justify-between shadow-xl">
           <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-wider">
             SAFETYLINK - OFFLINE-FIRST INTELLIGENT DISPATCH
           </h2>
        </div>

        {/* Grid Layout matching infographic */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
          
          <div className="flex flex-col gap-4">
              {/* Top Left: Wearable & App */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#242b38] border border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 shadow-lg"
              >
                <div className="bg-[#c8a14b] px-4 py-2 flex items-center gap-3">
                  <span className="text-[#1c222e] font-black text-2xl">1</span>
                  <h3 className="text-white font-bold tracking-wider text-sm md:text-lg">WEARABLE & APP ALERTS</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4 relative h-32">
                    <img src="/hand-smooth.png" alt="App" className="object-contain h-full opacity-80" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <i className="fa-solid fa-mobile-screen-button text-5xl text-slate-500 mr-2 drop-shadow-lg"></i>
                      <i className="fa-solid fa-wifi text-red-500 text-2xl animate-pulse absolute -mt-8 ml-8"></i>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h4 className="font-bold text-[#c8a14b] mb-1 text-sm">1. INSTANT TRIGGERS & LOCAL FAMILY CONNEC</h4>
                    <p className="text-xs text-slate-300">Wearable and App UI. Mesh <i className="fa-solid fa-network-wired text-slate-400 mx-1"></i>, Family Linked</p>
                    <div className="mt-2 inline-block px-2 py-1 border border-slate-500 rounded text-[9px] font-mono font-bold text-slate-400">OFFLINE OPERATION</div>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Left: Secure Local Network */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#242b38] border border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 shadow-lg"
              >
                <div className="bg-[#c8a14b] px-4 py-2 flex items-center gap-3">
                  <span className="text-[#1c222e] font-black text-2xl">2</span>
                  <h3 className="text-white font-bold tracking-wider text-sm md:text-lg">SECURE LOCAL NETWORK</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4 h-32 opacity-80">
                    <i className="fa-solid fa-server text-6xl text-slate-400 mr-8"></i>
                    <div className="flex flex-col items-center">
                       <i className="fa-solid fa-network-wired text-3xl text-emerald-500 mb-2"></i>
                       <span className="text-[10px] text-slate-400 font-mono">Mesh<br/>Mesh</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h4 className="font-bold text-[#c8a14b] mb-1 text-sm">2. PRIVATE LOCAL MESH NETWORK.</h4>
                    <p className="text-xs text-slate-300">Data Privacy-First. Encrypted Local Communication.</p>
                    <div className="mt-2 inline-block px-2 py-1 border border-slate-500 rounded text-[9px] font-bold font-mono text-slate-400">OFFLINE-READY</div>
                  </div>
                </div>
              </motion.div>
          </div>

          {/* Center Laptop Concept */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center relative z-20"
          >
            {/* Pseudo Laptop */}
            <div className="w-full max-w-md aspect-[16/10] bg-black rounded-t-xl border-t-[8px] border-l-[8px] border-r-[8px] border-slate-800 p-1 relative shadow-2xl">
              <div className="w-full h-full bg-[#151a23] overflow-hidden relative flex flex-col">
                 {/* Fake UI Header */}
                 <div className="h-6 bg-[#11151c] flex items-center px-2 justify-between border-b border-slate-800">
                   <div className="flex items-center gap-1">
                     <i className="fa-solid fa-shield-halved text-[#c8a14b] text-[10px]"></i>
                     <span className="text-[8px] font-bold text-white tracking-widest">SAFETYLINK</span>
                   </div>
                   <span className="text-[7px] text-slate-400 uppercase tracking-widest">Intelligent Local Dispatch Hub UI</span>
                   <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                   </div>
                 </div>
                 {/* Fake UI Body */}
                 <div className="flex-1 p-2 flex gap-2">
                    <div className="w-1/4 bg-[#1c222e] rounded border border-slate-800 p-1 space-y-1">
                      <div className="h-2 bg-slate-700 rounded w-full"></div>
                      <div className="h-2 bg-slate-700/50 rounded w-5/6"></div>
                      <div className="h-2 bg-slate-700/50 rounded w-4/6"></div>
                    </div>
                    <div className="flex-1 bg-[#1c222e] rounded border border-slate-800 relative overflow-hidden">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-16 h-16 border border-red-500/30 rounded-full flex items-center justify-center">
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            <div className="w-[110%] max-w-lg h-6 bg-slate-300 rounded-b-xl border-b-[6px] border-slate-400 shadow-xl relative z-10 flex justify-center">
              <div className="w-20 h-1.5 bg-slate-400 rounded-b-md"></div>
            </div>
            
            <div className="text-center mt-8 px-4 w-full">
              <h3 className="text-[#c8a14b] font-black text-lg md:text-xl tracking-wider uppercase mb-1">INTELLIGENT LOCAL COORDINATION.</h3>
              <h3 className="text-white font-bold text-base md:text-lg tracking-wider uppercase">LOCAL PROCESSING, LOCAL CONTROL.</h3>
              <div className="mt-4">
                <span className="text-[#c8a14b] font-bold text-lg md:text-xl tracking-widest uppercase">OFFLINE, ON PURPOSE.</span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
              {/* Top Right: Automated Drone Dispatch */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#242b38] border border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 shadow-lg"
              >
                <div className="bg-[#c8a14b] px-4 py-2 flex items-center gap-3">
                  <span className="text-[#1c222e] font-black text-2xl">3</span>
                  <h3 className="text-white font-bold tracking-wider text-sm md:text-lg">AUTOMATED DRONE DISPATCH</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4 relative h-32">
                    <i className="fa-solid fa-helicopter text-7xl text-slate-500 relative z-10"></i>
                    <div className="absolute w-20 h-20 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 mb-4">
                    <li>• Immediate dispatch.</li>
                    <li>• Pre-programed offline flight.</li>
                    <li>• Eyes on Scene.</li>
                  </ul>
                  <div className="mt-auto pt-4 border-t border-slate-700">
                    <h4 className="font-bold text-[#c8a14b] mb-1 text-sm">3. AUTOMATED PHYSICAL RESPONSE.</h4>
                    <p className="text-xs text-slate-300">Immediate dispatch. Pre-programed offline flight.</p>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Right: Live Local Coordination */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#242b38] border border-slate-700 rounded-xl overflow-hidden flex flex-col flex-1 shadow-lg"
              >
                <div className="bg-[#c8a14b] px-4 py-2 flex items-center gap-3">
                  <span className="text-[#1c222e] font-black text-2xl">4</span>
                  <h3 className="text-white font-bold tracking-wider text-sm md:text-lg">LIVE LOCAL COORDINATION</h3>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1 flex items-center justify-center mb-4 h-32">
                    <div className="grid grid-cols-2 gap-2 opacity-80">
                       <div className="w-16 h-12 border-2 border-slate-500 rounded flex items-center justify-center bg-slate-800"><i className="fa-solid fa-map text-slate-600"></i></div>
                       <div className="w-16 h-12 border-2 border-slate-500 rounded flex items-center justify-center bg-slate-800"><i className="fa-solid fa-video text-slate-600"></i></div>
                       <div className="w-16 h-12 border-2 border-slate-500 rounded flex items-center justify-center bg-slate-800"><i className="fa-solid fa-desktop text-slate-600"></i></div>
                       <div className="w-16 h-12 border-2 border-slate-500 rounded flex items-center justify-center bg-slate-800"><i className="fa-solid fa-users text-slate-600"></i></div>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h4 className="font-bold text-[#c8a14b] mb-1 text-sm">4. LOCAL OPERATOR CONTROL & EMERGENCY SERVICES.</h4>
                    <p className="text-xs text-slate-300">Local Control Console. Emergency Service Status. Control Room.</p>
                  </div>
                </div>
              </motion.div>
          </div>

        </div>

        {/* Footer Tagline */}
        <div className="w-full mt-6 bg-slate-400 text-slate-950 text-center py-3 rounded-lg font-black text-lg md:text-2xl uppercase tracking-widest shadow-lg">
          FROM TRIGGER TO ACTION: A COMPREHENSIVE OFFLINE EMERGENCY ECOSYSTEM
        </div>
      </main>

      {/* Full Screen Burger Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl hover:bg-red-950/50 hover:border-red-500/50 hover:text-red-500 transition-colors text-white"
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                onClick={() => setIsMenuOpen(false)}
                className="text-3xl md:text-5xl font-black text-white hover:text-[#c8a14b] transition-colors uppercase tracking-wider"
              >
                Home
              </motion.button>
              
              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                onClick={() => { setIsMenuOpen(false); setShowDownloadHub(true); }}
                className="text-3xl md:text-5xl font-black text-white hover:text-[#c8a14b] transition-colors uppercase tracking-wider flex items-center gap-4"
              >
                <i className="fa-solid fa-cloud-arrow-down"></i> Download Hub
              </motion.button>

              <motion.button 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                onClick={() => { setIsMenuOpen(false); onLogin(); }}
                className="text-3xl md:text-5xl font-black text-white hover:text-[#c8a14b] transition-colors uppercase tracking-wider flex items-center gap-4"
              >
                <i className="fa-solid fa-right-to-bracket"></i> Login / Console
              </motion.button>

              {onRegisterOrg && (
                <motion.button 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  onClick={() => { setIsMenuOpen(false); onRegisterOrg(); }}
                  className="text-3xl md:text-5xl font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider flex items-center gap-4"
                >
                  <i className="fa-solid fa-building-shield"></i> Register Node
                </motion.button>
              )}
            </div>
            
            <div className="p-8 text-center border-t border-slate-900 mt-auto">
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">© 2026 SafetyLink Core. TM Media Solutions.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Hub Modal */}
      {showDownloadHub && <DownloadHub onClose={() => setShowDownloadHub(false)} />}
    </div>
  );
};
`;
fs.writeFileSync('src/components/LandingPage.tsx', code);
