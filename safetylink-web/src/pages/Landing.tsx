import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ArrowRight, 
  Globe, 
  Smartphone, 
  Monitor, 
  Key, 
  ChevronRight,
  Activity,
  Zap,
  MapPin,
  CheckCircle2,
  Lock,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  onLogin: () => void;
  onSignup: () => void;
  onLaunchWeb: () => void;
}

export default function Landing({ onLogin, onSignup, onLaunchWeb }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* NAVIGATION */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/media/new_logo/New_SafetyLink_Official_Logo.svg" 
              alt="SafetyLink Official Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className={`font-black tracking-tight text-xl ${scrolled ? 'text-white' : 'text-white drop-shadow-md'}`}>
              SafetyLink<span className="text-emerald-500">.</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#platform" className="hover:text-emerald-400 transition-colors drop-shadow-sm">Platform</a>
            <a href="#teams" className="hover:text-emerald-400 transition-colors drop-shadow-sm">Our Teams</a>
            <a href="#hardware" className="hover:text-emerald-400 transition-colors drop-shadow-sm">Hardware</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors drop-shadow-sm">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin} 
              className="text-white text-sm font-bold hover:text-emerald-400 transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={onSignup}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-950 pt-20">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen pointer-events-none"
        >
          <source src="/media/Inside_the_SafetyLink_Emergency_Ecosystem.mp4" type="video/mp4" />
        </video>
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-white text-xs font-bold tracking-widest uppercase">SafetyLink Global Network Active</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-8 leading-[1.1]">
              The Sequential <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-lg">
                Emergency Alert Network.
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
              Empower your field officers, campus patrols, and private security teams with real-time panic telemetry and BLE mesh monitoring.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onSignup}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
              >
                Launch Enterprise Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white px-10 py-5 rounded-2xl font-bold text-lg backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                Access Commander Deck
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST LOGOS */}
      <section className="py-10 bg-slate-950 border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mb-8">Trusted by Elite Security Units Worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-40 grayscale">
            <div className="flex items-center gap-3 font-black text-2xl text-white"><ShieldAlert className="w-8 h-8" /> DEFENDER</div>
            <div className="flex items-center gap-3 font-black text-2xl text-white"><Globe className="w-8 h-8" /> APEX MUNICIPAL</div>
            <div className="flex items-center gap-3 font-black text-2xl text-white"><Users className="w-8 h-8" /> SENTINEL</div>
            <div className="flex items-center gap-3 font-black text-2xl text-white"><Lock className="w-8 h-8" /> OMEGA SECURE</div>
          </div>
        </div>
      </section>

      {/* REAL-WORLD IMPACT SECTION WITH PHOTOS */}
      <section id="teams" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Equip Your Personnel. <br/>
              <span className="text-emerald-600">Protect Your Sites.</span>
            </h2>
            <p className="text-xl text-slate-600">
              SafetyLink uniforms and tactical interfaces are deployed in real-world scenarios across the globe, providing officers with instant response capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Campus Patrol Integration</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                University and corporate campus guards use the SafetyLink Mobile APK connected to their uniforms for instant distress reporting and live geospatial tracking.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 text-lg font-medium">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" /> One-tap panic triggers on tactical vests.
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-lg font-medium">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Silent alarm routing to the Commander Deck.
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <img 
                src="/media/safetylink_campus_patrol_1783424770332.jpg" 
                alt="SafetyLink Campus Patrol Officer" 
                className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3] border border-slate-200"
                onError={(e) => e.currentTarget.src = "/media/copilot_image_1783702988629.jpeg"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img 
                src="/media/safetylink_control_center_1783424754132.jpg" 
                alt="SafetyLink Command Center" 
                className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3] border border-slate-200"
                onError={(e) => e.currentTarget.src = "/media/copilot_image_1783703540293-1.jpeg"}
              />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Global Control Center</h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                Dispatchers utilize the Windows Commander Deck to monitor thousands of field agents concurrently. Offline-first mapping ensures resilience during grid failures.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 text-lg font-medium">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" /> Live heatmap and telemetry data.
                </li>
                <li className="flex items-center gap-3 text-slate-700 text-lg font-medium">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" /> Cross-platform Windows and Web synchronization.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HARDWARE OVERVIEW */}
      <section id="hardware" className="py-32 bg-slate-950 text-white relative">
        <div className="absolute inset-0 bg-[url('/media/background1.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="relative">
              <div className="aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <img 
                  src="/media/safetylink_officer_phone_1783207722148.jpg" 
                  alt="Officer Phone Hardware"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  style={{ display: 'none' }}
                  onLoadStart={(e) => {
                    const img = e.currentTarget.previousElementSibling as HTMLImageElement;
                    if (img && img.style.display === 'none') {
                      e.currentTarget.style.display = 'block';
                    }
                  }}
                >
                  <source src="/media/safetylink_startup.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl"></div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl hidden md:block z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">BLE Mesh Latency</p>
                    <p className="text-3xl font-black text-white">&lt; 40ms</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                Enterprise Deployment Hub.
              </h2>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed font-light">
                SafetyLink is not just a software platform — it is a complete ecosystem. Deploy the dedicated APK to your field devices, or monitor the global network via the Commander Deck.
              </p>
              
              <div className="space-y-6">
                <a 
                  href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink.apk"
                  className="group flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-6 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">Android Application</h4>
                      <p className="text-sm text-slate-400">Field Personnel & Student Client</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </a>

                <a 
                  href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest"
                  target="_blank" rel="noreferrer"
                  className="group flex items-center justify-between bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 p-6 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Monitor className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">Windows Commander Deck</h4>
                      <p className="text-sm text-slate-400">Desktop Monitoring EXE</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* PRICING / E-COMMERCE SECTION */}
      <section id="pricing" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Commercial Licenses
            </h2>
            <p className="text-xl text-slate-600">
              Secure your organization today. Choose the tier that matches your operational scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Standard Team</h3>
              <p className="text-slate-500 mb-6 text-sm">Perfect for small security firms.</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">$299</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Up to 50 active nodes</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Basic Web Dashboard</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Standard Support</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-xl transition-colors">
                Start 30-Day Trial
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Campus Pro</h3>
              <p className="text-slate-400 mb-6 text-sm">Full suite for universities & large sites.</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-white">$899</span>
                <span className="text-slate-400 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Up to 5,000 active nodes</li>
                <li className="flex items-center gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Windows Commander Deck</li>
                <li className="flex items-center gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Offline Map Integration</li>
                <li className="flex items-center gap-3 text-slate-200 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Priority 24/7 Support</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Deploy Now
              </button>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Global Grid</h3>
              <p className="text-slate-500 mb-6 text-sm">For municipal and nation-wide networks.</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Unlimited nodes</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Custom SIEM integration</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dedicated Account Manager</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors">
                Contact Sales
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/media/new_logo/New_SafetyLink_Official_Logo.svg" 
                alt="SafetyLink Logo" 
                className="w-8 h-8 object-contain opacity-50 grayscale" 
              />
              <span className="font-bold text-lg tracking-widest uppercase text-white">SafetyLink Core</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              The leading enterprise safety platform for real-time panic telemetry, personnel tracking, and sequential emergency networking.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Android APK</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Windows Commander</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Hardware Tokens (BLE)</a></li>
              <li><button onClick={onLogin} className="hover:text-emerald-400 transition-colors">Web Dashboard</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Enterprise Sales</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600">
          <p>© 2026 SafetyLink Core Systems. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>System Status: <span className="text-emerald-500 font-bold">100% Operational</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
