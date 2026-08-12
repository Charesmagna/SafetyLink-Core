import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  WifiOff, 
  Key, 
  Users, 
  Layers, 
  Smartphone, 
  Monitor, 
  Globe, 
  ShieldCheck, 
  ArrowRight,
  Cpu,
  Activity
} from 'lucide-react';

export default function Landing({ onLogin, onSignup, onLaunchWeb }: { onLogin: () => void; onSignup: () => void; onLaunchWeb?: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollToDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('download-hub')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900 shadow-xl py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SafetyLink Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">SafetyLink</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-bold text-white/90 hover:text-white transition-colors">About</a>
            <a href="#pricing" className="text-sm font-bold text-white/90 hover:text-white transition-colors">Pricing</a>
            <a href="#download-hub" onClick={scrollToDownload} className="text-sm font-bold text-white/90 hover:text-white transition-colors">Downloads</a>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={onLogin} className="text-sm font-bold text-white/90 hover:text-white transition-colors">
              Login
            </button>
            <button onClick={onLogin} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hidden sm:block">
              Access Commander Deck
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-48 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover object-center opacity-30 mix-blend-screen"
          >
            <source src="/media/safetylink_startup.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold tracking-wide uppercase mb-6">
              <Shield className="w-4 h-4" /> SafetyLink
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Sequential Emergency<br />Alert Network
            </h1>
            <p className="text-xl md:text-2xl text-emerald-400 font-medium mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6" /> Offline-Capable, Hyper-Local Community Panic Systems
            </p>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl leading-relaxed">
              SafetyLink provides private emergency mesh networks tailored for campus safety, security patrols, and corporate sites. Operate seamlessly even under restrictive offline or distress scenarios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onLogin} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:-translate-y-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group">
                Access Commander Deck
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={scrollToDownload} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:-translate-y-0.5 border border-slate-700">
                Download Hub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOTHERBOARD CONSOLE PREVIEW */}
      <section className="relative z-20 -mt-16 md:-mt-24 max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-800">
          <div className="bg-slate-950 rounded-[20px] overflow-hidden">
            <div className="p-8 pb-0 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Motherboard Response Console</h2>
              <p className="text-slate-400 mb-8">
                High-fidelity tactical preview of the SafetyLink Commander Deck in action.
              </p>
            </div>
            <div className="relative aspect-video w-full bg-slate-900">
              <img 
                src="/media/Emergency_System_Architecture_Anatomy.png" 
                alt="Motherboard Console" 
                className="w-full h-full object-cover opacity-90 border-t border-slate-800"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* RELIABILITY SECTION */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white mb-6 shadow-xl">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">About SafetyLink Core</h2>
            <p className="text-xl text-slate-600 leading-relaxed mb-6">
              SafetyLink is a unified, highly optimized <strong>Sequential Emergency Alert Network</strong> designed to function seamlessly under restrictive offline, hardware-constrained, or distress scenarios.
            </p>
            <p className="text-lg text-slate-500 leading-relaxed">
              Whether you are a security patrol agency, a school protecting its students, a corporate office monitoring lone-workers, or an individual wanting a private escalation contact chain — SafetyLink bridges the gap between end-user distress signals and centralized Commander Deck dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { icon: WifiOff, title: "Offline Operation", desc: "Works without relying on traditional airtime footprints using localized mesh sync." },
              { icon: Key, title: "Hardware Integration", desc: "Supports physical BLE keychain tokens and panic buttons." },
              { icon: Users, title: "Role-Based Routing", desc: "Distinct interfaces for Dispatchers, Admins, and End-Users." },
              { icon: Layers, title: "Unified State", desc: "Single source of truth for telemetry, beacons, and panic events." }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-shadow group">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> {f.title}
                </h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                <span className="text-3xl">🧩</span> Siloed Tenants
              </h3>
              <p className="text-slate-300 text-lg">
                Isolated database schemes ensure strict privacy between organizations. Your security data is strictly yours.
              </p>
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Transparent Pricing</h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              Scale your emergency response capabilities without unpredictable costs. Choose the tier that fits your operational footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Personal Shield</h3>
              <p className="text-slate-500 mb-6">For individuals and families.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Up to 5 family nodes</li>
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Basic panic alerts</li>
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Real-time location sharing</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors">
                Get Started Free
              </button>
            </div>

            {/* Tier 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative transform md:-translate-y-4 flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Professional Guard</h3>
              <p className="text-slate-400 mb-6">For security teams and campuses.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">$299</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300"><span className="text-emerald-400 font-bold">✓</span> Up to 500 active nodes</li>
                <li className="flex items-center gap-3 text-slate-300"><span className="text-emerald-400 font-bold">✓</span> Full Commander Deck access</li>
                <li className="flex items-center gap-3 text-slate-300"><span className="text-emerald-400 font-bold">✓</span> Hardware BLE token support</li>
                <li className="flex items-center gap-3 text-slate-300"><span className="text-emerald-400 font-bold">✓</span> Priority audit logs</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/25">
                Start Pro Trial
              </button>
            </div>

            {/* Tier 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise Grid</h3>
              <p className="text-slate-500 mb-6">For government & large utilities.</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Unlimited nodes</li>
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Custom offline mesh routing</li>
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> Dedicated support team</li>
                <li className="flex items-center gap-3 text-slate-700"><span className="text-emerald-500 font-bold">✓</span> API & SIEM Integration</li>
              </ul>
              <button onClick={onSignup} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MONITORING CTA */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-8">
            <Globe className="w-10 h-10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight flex items-center justify-center gap-4 flex-wrap">
            <span>🛰️</span> Real-Time Safety Monitoring for Organizations
          </h2>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            Deploy a private safety network in minutes. Connect field personnel, students, or guards directly to a centralized Commander Deck.
          </p>
          <button onClick={onLogin} className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all hover:-translate-y-1 shadow-2xl flex items-center justify-center gap-3 mx-auto">
            Access Commander Deck <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* DOWNLOAD HUB */}
      <section id="download-hub" className="py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 flex items-center justify-center gap-4">
              <span>⬇️</span> SafetyLink Download Hub
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">
              Equip your organization with the tools needed for comprehensive emergency management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* APK */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-emerald-500/50 transition-colors">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">📱 Mobile APK</h3>
              <p className="text-slate-400 mb-8 flex-1">
                Download the SafetyLink APK directly to your personnel devices for instant telemetry and panic alert integration.
              </p>
              <a href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink.apk" className="bg-emerald-600 hover:bg-emerald-500 text-white w-full py-4 rounded-xl font-bold transition-colors text-center inline-block">
                Download APK
              </a>
            </div>

            {/* COMMANDER DECK */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">💻 Commander Deck (Windows)</h3>
              <p className="text-slate-400 mb-8 flex-1">
                Install the Windows executable Commander Deck interface for centralized monitoring and tactical control.
              </p>
              <a href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest" target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white w-full py-4 rounded-xl font-bold transition-colors text-center inline-block">
                Download EXE (Releases)
              </a>
            </div>

            {/* MAP MODULE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-amber-500/50 transition-colors">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🌍 Global Map Module</h3>
              <p className="text-slate-400 mb-8 flex-1">
                Enable live tracking of nodes and panic events with the interactive tactical map.
              </p>
              <button onClick={onLogin} className="bg-amber-600 hover:bg-amber-500 text-white w-full py-4 rounded-xl font-bold transition-colors">
                Activate Map View
              </button>
            </div>

            {/* TENANT SECURITY */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-purple-500/50 transition-colors">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                <Key className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">🔐 Private Tenant Security</h3>
              <p className="text-slate-400 mb-8 flex-1">
                Organizations remain siloed — only registered nodes are visible to your network.
              </p>
              <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white w-full py-4 rounded-xl font-bold transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-slate-500 py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SafetyLink Logo" className="w-6 h-6 object-contain grayscale opacity-50" />
            <span className="font-bold text-sm tracking-widest uppercase">SafetyLink Core</span>
          </div>
          <p className="text-sm">© 2026 SafetyLink Core Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
