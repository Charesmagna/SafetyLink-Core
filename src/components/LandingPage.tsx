import React from 'react';
import { motion } from 'motion/react';
import { LogoSetPart } from './LogoSetPart';

export const LandingPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-y-auto selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoSetPart part="badge" size={40} rounded="xl" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white uppercase">Safety<span className="text-amber-500">Link</span></span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 font-bold">Core Network</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#download-hub" className="hidden md:block text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">
              Download Hub
            </a>
            <button 
              onClick={onLogin}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
            >
              Access Dispatch Console
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Live & Operational
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
              The Next-Generation <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Emergency Mesh</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              A unified, highly optimized Sequential Emergency Alert Network designed for campuses, corporate zones, and tactical patrol dispatch. Offline-first. Hardware-agnostic.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-200 text-slate-950 text-sm font-black uppercase tracking-wider rounded-2xl transition-colors"
            >
              Open Web Application
            </button>
            <a 
              href="#download-hub"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-sm font-black uppercase tracking-wider rounded-2xl transition-colors text-center"
            >
              Get Native Apps
            </a>
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative aspect-square"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-purple-500/20 blur-3xl rounded-full" />
          <div className="absolute inset-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden">
             <LogoSetPart part="main" size={200} />
             
             {/* Decorative rings */}
             <div className="absolute inset-0 border border-slate-800/50 rounded-[3rem] scale-90" />
             <div className="absolute inset-0 border border-slate-800/30 rounded-[3rem] scale-75" />
          </div>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="border-t border-slate-900 bg-slate-950/50 py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 text-2xl mb-6">
              🛰️
            </div>
            <h3 className="text-xl font-black text-white">Tactical Dispatch</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time geospatial analytics and multi-node event tracking for security control rooms.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl mb-6">
              🔋
            </div>
            <h3 className="text-xl font-black text-white">Offline Resilience</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Functions independently in deep dead-zones via Local Sync Queues and BLE peer discovery.
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 text-2xl mb-6">
              📡
            </div>
            <h3 className="text-xl font-black text-white">Hardware Agnostic</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect standalone wearables, drones, or deploy natively via Web, Windows, and Android.
            </p>
          </div>
        </div>
      </section>

      {/* Download Hub */}
      <section id="download-hub" className="py-24 px-6 bg-slate-900 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Download Hub
            </h2>
            <p className="text-slate-400 text-lg">
              Get the native SafetyLink agent for your tactical devices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Android APK */}
            <a 
              href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest" 
              target="_blank" rel="noreferrer"
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-900 group-hover:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 text-3xl transition-colors">
                📱
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">Android (.APK)</h3>
                <p className="text-xs text-slate-500 mt-1">Requires Android 8.0+</p>
              </div>
            </a>

            {/* Windows EXE */}
            <a 
              href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest" 
              target="_blank" rel="noreferrer"
              className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-900 group-hover:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 text-3xl transition-colors">
                💻
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">Windows (.EXE)</h3>
                <p className="text-xs text-slate-500 mt-1">For Desktop Dispatch Centers</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-center">
        <LogoSetPart part="badge" size={32} className="mx-auto mb-4 opacity-50 grayscale" />
        <p className="text-xs text-slate-600 font-mono">
          &copy; {new Date().getFullYear()} TM MEDIA SOLUTIONS. All Tactical Rights Reserved.
        </p>
      </footer>
    </div>
  );
};
