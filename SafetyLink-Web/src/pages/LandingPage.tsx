import { Shield, Smartphone, Download, ChevronRight, Activity, Zap, Server, MapPin, CheckCircle2, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const scrollToDownloads = () => {
    document.getElementById('download-hub')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Navbar */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SafetyLink</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={scrollToDownloads}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Downloads
            </button>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-5 py-2.5 text-sm font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/10 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              Login / Register
            </button>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 flex items-center gap-2"
            >
              Commander Deck <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* 1. Hero & Mission Statement Section */}
        <section className="py-32 px-6 relative overflow-hidden">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[150px] pointer-events-none" 
          />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-emerald-400 text-sm font-bold mb-8 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              <Activity className="w-4 h-4" />
              <span>Sequential Emergency Alert Network</span>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-2xl"
            >
              Offline-Capable, Hyper-Local <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-gradient-x">
                Community Panic Systems
              </span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              SafetyLink provides private emergency mesh networks tailored for campus safety, security patrols, and corporate sites. Operate seamlessly even under restrictive offline or distress scenarios.
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <button 
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                Access Commander Deck <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={scrollToDownloads}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-white/5 hover:bg-white/10 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Download Hub <Download className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* 2. Visual Gallery & Tactical Preview */}
        <section className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] overflow-hidden aspect-[16/9] md:aspect-[21/9] p-4 flex items-center justify-center group"
            >
              {/* Decorative Glass Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />

              {/* Abstract representation of the dashboard */}
              <div className="absolute inset-4 bg-slate-950/80 rounded-[2rem] border border-white/5 grid grid-cols-12 gap-4 p-4 md:p-6 overflow-hidden shadow-inner">
                {/* Sidebar */}
                <div className="col-span-2 hidden md:flex bg-white/5 rounded-2xl border border-white/10 p-5 flex-col gap-5 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]"><Shield className="w-5 h-5 text-slate-950"/></div>
                  <div className="w-full h-10 bg-white/5 rounded-xl border border-white/5" />
                  <div className="w-full h-10 bg-white/5 rounded-xl border border-white/5" />
                  <div className="w-full h-10 bg-white/5 rounded-xl border border-white/5" />
                </div>
                {/* Main Map */}
                <div className="col-span-12 md:col-span-7 bg-slate-900 rounded-2xl border border-white/10 relative overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_default_map_style_-_London.png')] opacity-30 bg-cover bg-center grayscale mix-blend-luminosity" />
                  {/* Ping Markers */}
                  <motion.div 
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 left-1/4 w-5 h-5 bg-emerald-400 rounded-full border-[3px] border-slate-900 shadow-[0_0_15px_rgba(52,211,153,0.8)]" 
                  />
                  <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-red-500 rounded-full border-[3px] border-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.9)] animate-pulse flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"/>
                  </div>
                  <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full border-2 border-red-500 animate-ping" />
                </div>
                {/* Threat Queue */}
                <div className="col-span-12 md:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col gap-4 backdrop-blur-md">
                  <div className="h-6 w-1/2 bg-white/10 rounded-lg mb-2" />
                  <div className="w-full h-28 border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <div className="h-4 w-3/4 bg-red-500/80 rounded-md" />
                    <div className="h-3 w-1/2 bg-white/20 rounded-md" />
                    <div className="h-3 w-full bg-white/10 rounded-md mt-auto" />
                  </div>
                  <div className="w-full h-24 border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col gap-3">
                    <div className="h-4 w-2/3 bg-white/20 rounded-md" />
                    <div className="h-3 w-1/2 bg-white/10 rounded-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. About & Ecosystem Overview */}
        <section className="py-24 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-6">
                  <Server className="w-4 h-4" /> Architecture
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Built for extreme reliability.</h2>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  Traditional safety apps fail when data networks go down or in restricted environments. 
                  SafetyLink's unified mesh architecture is designed to function seamlessly using simulated 
                  Bluetooth Low Energy (BLE) beacons and background location telemetry, operating as a true 
                  single source of truth.
                </p>
                <ul className="space-y-4">
                  {[
                    'Works without relying on traditional airtime footprints.',
                    'Hardware integration with physical keychain tokens.',
                    'Role-based access routing (Command Center vs Node Viewer).',
                    'Zero unused variables, strict Material 3 design harmony.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-slate-300 pt-1 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-[100px] -z-10" />
                
                {[
                  { icon: Server, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Siloed Tenants', desc: 'Isolated database schemas ensure strict privacy between different security groups.' },
                  { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'BLE Beacons', desc: 'Simulated beacons feed directly into the central state to replicate physical hardware.' },
                  { icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'GIS Telemetry', desc: 'Background location polling synchronizes precise coordinates instantly.' },
                  { icon: Monitor, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Command Deck', desc: 'Master user control with real-time alert logs and live GIS mapping.' }
                ].map((feature, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className={`bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-5 hover:bg-white/10 transition-colors ${idx % 2 === 0 ? 'sm:translate-y-8' : ''}`}
                  >
                    <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center shadow-inner`}><feature.icon className={`w-7 h-7 ${feature.color}`}/></div>
                    <h3 className="font-bold text-xl text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Dual-Platform Download Hub */}
        <section id="download-hub" className="py-32 px-6 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-6">Dual-Platform Download Hub</h2>
              <p className="text-xl text-slate-400 mb-16 max-w-2xl mx-auto">Secure download portals for command center operators and field personnel.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 hover:border-emerald-500/50 transition-all backdrop-blur-xl group relative overflow-hidden shadow-2xl"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-colors" />
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/30">
                  <Smartphone className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Mobile Safety APK</h3>
                <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                  Direct link for field personnel, guards, and residents to download the Android safety companion app. Includes background polling service.
                </p>
                <a href="#" className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-emerald-500 shadow-lg group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Download className="w-5 h-5" /> Download .APK (v2.4.1)
                </a>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 hover:border-blue-500/50 transition-all backdrop-blur-xl group relative overflow-hidden shadow-2xl"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-colors" />
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30">
                  <Monitor className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Desktop Dashboard</h3>
                <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                  Secure executable for command center operators needing the native desktop workstation build with multi-monitor support.
                </p>
                <a href="#" className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/10 hover:bg-blue-500 hover:text-white text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-blue-500 shadow-lg group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Download className="w-5 h-5" /> Download .EXE (Win64)
                </a>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 text-center text-slate-500 border-t border-white/10 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
          <Shield className="w-6 h-6 text-emerald-500" />
          <span className="font-bold text-slate-300 text-lg">SafetyLink Core</span>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} SafetyLink Core Systems. All rights reserved.</p>
        <p className="text-xs mt-2 opacity-50">DeepMind Secure Gateway Integrations</p>
      </footer>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
