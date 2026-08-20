const fs = require('fs');

const code = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoSetPart } from './LogoSetPart';

interface LandingPageProps {
  onLogin: () => void;
  onBackToApp?: () => void;
}

interface HardwareProduct {
  id: string;
  name: string;
  description: string;
  priceZAR: number;
  category: 'Wearable' | 'BaseStation' | 'Relay' | 'Drone';
  icon: string;
}

const HARDWARE_CATALOG: HardwareProduct[] = [
  { id: 'prod-cam-2pack', name: '2-Pack Wireless WiFi Cameras', description: 'Dual-view system for small apartments and indoor monitoring.', priceZAR: 950, category: 'BaseStation', icon: '📹' },
  { id: 'prod-cam-4pack', name: '4-Pack Wireless WiFi Cameras', description: 'Perimeter package for full residential properties or small businesses.', priceZAR: 1650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-pulse', name: 'RFD BLE Beacon (SafetyLink Pulse)', description: 'Long-range safety beacon for personal distress tracking.', priceZAR: 450, category: 'Wearable', icon: '🔘' },
  { id: 'prod-doorlock', name: 'Smart Fingerprint Door Lock', description: 'Smart access control lock with fingerprint and remote access.', priceZAR: 1150, category: 'BaseStation', icon: '🔒' },
  { id: 'prod-elderly-watch', name: 'Elderly SOS Watch GPS Tracking Wristband', description: 'GPS tracking watch with emergency SOS button.', priceZAR: 850, category: 'Wearable', icon: '⌚' },
  { id: 'prod-gps-tracker', name: 'GPS Smart Tracker Anti-Loss Device (Bluetooth)', description: 'Bluetooth anti-loss device for keys and personal items.', priceZAR: 220, category: 'Wearable', icon: '📍' },
  { id: 'prod-smart-ring', name: 'Smart Ring Set', description: 'Discreet smart ring for subtle emergency triggering.', priceZAR: 150, category: 'Wearable', icon: '💍' },
  { id: 'prod-2day-cam', name: '2 Days Security Camera System Kit (1080p)', description: 'Complete 4-channel security camera kit.', priceZAR: 2650, category: 'BaseStation', icon: '📹' },
  { id: 'prod-guard-tour', name: 'RFID Security Patrol Guard Tour System', description: 'RFID guard tour system for security patrols.', priceZAR: 3850, category: 'Relay', icon: '👮' },
  { id: 'prod-drone-box', name: 'DJI Dock 2 Automated Station', description: 'Drone-in-a-box solution for automated perimeter overwatch.', priceZAR: 125000, category: 'Drone', icon: '🚁' },
  { id: 'prod-tethered', name: 'Tethered Overwatch System', description: 'Continuous power aerial overwatch platform.', priceZAR: 85000, category: 'Drone', icon: '🛸' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onBackToApp }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 overflow-y-auto overflow-x-hidden relative scroll-smooth">
      {/* Background Video blended beautifully */}
      <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen opacity-30">
        <video src="/media/SafetyLink_3D_Animation_Logo.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white hover:text-amber-400 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
              <LogoSetPart part="main" size={32} showBorder={false} />
              <span className="font-black text-lg tracking-widest uppercase text-white">
                Safety<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Link</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="hidden sm:block px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
              >
                Back to Dashboard
              </button>
            )}
            <button 
              onClick={onLogin}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
            >
              Access Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6"
          >
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 p-4 text-white hover:text-amber-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="space-y-8 text-center">
              {['Home', 'Architecture', 'Hardware Store', 'Pricing', 'Contact'].map(link => (
                <a 
                  key={link} 
                  href={\`#\${link.toLowerCase().replace(' ', '-')}\`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 hover:from-amber-400 hover:to-orange-600 transition-all uppercase tracking-tight"
                >
                  {link}
                </a>
              ))}
              {onBackToApp && (
                <button 
                  onClick={() => { setIsMenuOpen(false); onBackToApp(); }}
                  className="mt-8 px-8 py-4 bg-slate-800 text-white rounded-full font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 pt-32 pb-24" id="home">
        {/* Ultra Modern Hero */}
        <div className="max-w-7xl mx-auto px-6 text-center space-y-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="mx-auto w-fit px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
             <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
             SA-PTY DEPLOYMENT ACTIVE
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9]"
          >
            <span className="text-white">SURVIVE</span><br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">THE UNEXPECTED</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className="max-w-2xl mx-auto text-lg md:text-2xl text-slate-400 font-light leading-relaxed"
          >
            The offline-first emergency mesh network engineered for rapid tactical deployment, community security, and absolute resilience.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={onLogin} className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest rounded-full transition-transform hover:scale-105">
              Launch Console
            </button>
            <a href="#hardware-store" className="w-full sm:w-auto px-10 py-5 bg-transparent border border-slate-700 hover:border-amber-500 text-white font-black uppercase tracking-widest rounded-full transition-colors hover:bg-amber-500/10">
              View Hardware
            </a>
          </motion.div>
        </div>
      </div>

      {/* Apple-Style Bento Grid (Architecture) */}
      <section className="py-24 px-6 bg-slate-950" id="architecture">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Core Architecture</h2>
            <p className="text-slate-400 text-lg">Uncompromising technology stack for life-critical operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Bento 1: Offline Comm */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center text-3xl">📡</div>
                <h3 className="text-3xl font-black text-white">BLE Mesh Networking</h3>
                <p className="text-slate-400 text-lg max-w-md">When cell towers fail, SafetyLink automatically forms a peer-to-peer Bluetooth mesh network to relay distress signals across hundreds of devices.</p>
              </div>
            </div>

            {/* Bento 2: Drone Integration */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-20 group-hover:opacity-40 transition-opacity">
                <svg className="w-64 h-64 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l6 14H6l6-14z"/></svg>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl">🚁</div>
                <h3 className="text-3xl font-black text-white">Automated Drone Response</h3>
                <p className="text-slate-400 text-lg">DJI Dock integration for instant aerial overwatch on alarm trigger.</p>
              </div>
            </div>

            {/* Bento 3: AI Assistant */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl">🤖</div>
                <h3 className="text-3xl font-black text-white">K'lev.ai Integration</h3>
                <p className="text-slate-400 text-lg">Voice-activated emergency assistant trained on SA tactical law.</p>
              </div>
            </div>

            {/* Bento 4: Dispatch Console */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center text-3xl">🖥️</div>
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">Global Command Center</h3>
                  <p className="text-slate-400 text-lg max-w-xl">A complete GIS tracking suite for security companies. Monitor patrols, view CCTV streams, and coordinate live response vectors from a unified dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hardware Store */}
      <section className="py-24 px-6 relative border-t border-slate-900" id="hardware-store">
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-slate-900 to-transparent z-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Equipment Depot</h2>
              <p className="text-slate-400 text-lg">Procure verified tactical hardware optimized for the SafetyLink Mesh.</p>
            </div>
            <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-full uppercase tracking-widest text-xs transition-colors shrink-0">
              Request Enterprise Quote
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HARDWARE_CATALOG.map((item) => (
              <div key={item.id} className="bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 transition-all group flex flex-col hover:-translate-y-2">
                <div className="w-full aspect-square bg-slate-950 rounded-2xl mb-6 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-amber-500 mb-2 uppercase">{item.category}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">{item.description}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xl font-black text-white">R{item.priceZAR.toLocaleString()}</span>
                  <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-amber-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-6" id="contact">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-slate-900 pb-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <LogoSetPart part="main" size={60} showBorder={false} />
            <p className="text-slate-400 text-sm max-w-sm">
              TM Media Solutions &copy; {new Date().getFullYear()}. Delivering uncompromising tactical infrastructure for communities and enterprises across South Africa.
            </p>
            <div className="flex items-center gap-4 text-slate-500">
              <a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-amber-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-amber-500 transition-colors">API Specs</a>
            </div>
          </div>
          <div>
            <h4 className="font-black text-white mb-6 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Global Dispatch Console</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mobile Applications</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Drone Integration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mesh Analytics</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-white mb-6 uppercase tracking-widest">Contact</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>HQ: Johannesburg, ZA</li>
              <li>Support: support@safetylink.online</li>
              <li>Sales: enterprise@safetylink.online</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-slate-600 font-mono tracking-widest uppercase">
          Deployed under TM Media Solutions Tactical License.
        </div>
      </footer>
    </div>
  );
};
`;

fs.writeFileSync('src/components/LandingPage.tsx', code);
