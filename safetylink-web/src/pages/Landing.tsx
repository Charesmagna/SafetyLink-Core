import React, { useState, useEffect, useRef } from 'react';
import { Shield, Smartphone, Monitor, MapPin, Bell, Users, Download, ArrowRight, Zap, Lock, Radio, ChevronRight, Menu, X, CheckCircle } from 'lucide-react';

const APK_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink.apk';
const EXE_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink-OrgConsole-Setup-1.0.0.exe';

export default function Landing({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-sl-dark text-white">

      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-sl-navy/95 backdrop-blur-xl border-b border-sl-border shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/sl-icon.png" alt="" className="w-9 h-9 rounded-xl"
                onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-sl-dark" />
            </div>
            <span className="font-black text-xl tracking-tight">SafetyLink</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How it works</a>
            <a href="#download" className="text-slate-400 hover:text-white text-sm transition-colors">Downloads</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin} className="text-slate-300 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-all">Sign In</button>
            <button onClick={onSignup} className="bg-sl-red hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-red-900/30">
              Register Organisation
            </button>
          </div>

          <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-sl-navy border-t border-sl-border px-4 py-4 space-y-3">
            <a href="#features" className="block text-slate-300 py-2" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#download" className="block text-slate-300 py-2" onClick={() => setMenuOpen(false)}>Downloads</a>
            <button onClick={() => { onLogin(); setMenuOpen(false); }} className="block w-full text-left text-slate-300 py-2">Sign In</button>
            <button onClick={() => { onSignup(); setMenuOpen(false); }} className="w-full bg-sl-red text-white font-semibold py-3 rounded-xl">Register Organisation</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pt-20 hero-grid overflow-hidden">
        {/* Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sl-red/4 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-900/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-sl-red/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-sl-red/10 border border-sl-red/20 text-sl-red text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <div className="w-2 h-2 bg-sl-red rounded-full animate-pulse" />
            South Africa's Emergency Mesh Network
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative float">
              <img src="/sl-icon.png" alt="SafetyLink" className="w-32 h-32 object-contain drop-shadow-2xl rounded-3xl"
                onError={e => {
                  (e.target as HTMLImageElement).style.display='none';
                  const fb = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (fb) fb.style.display='flex';
                }} />
              <div className="hidden w-32 h-32 items-center justify-center bg-sl-red/10 border-2 border-sl-red/30 rounded-3xl">
                <Shield className="w-16 h-16 text-sl-red" />
              </div>
              <div className="absolute -inset-4 bg-sl-red/5 rounded-full blur-2xl" />
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
            <span className="gradient-text">Safety</span>
            <span className="text-white">Link</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            Offline-capable, hyper-local emergency mesh network. One tap SOS. Live tracking. BLE keyfob support. Built for South African communities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 mb-12">
            {['Works offline', 'BLE hardware support', 'Multi-org', 'Android 8+'].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" /> {f}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6" id="download">
            <a href={APK_URL}
              className="group flex items-center gap-4 bg-sl-red hover:bg-red-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-red-900/40 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <Smartphone className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs font-normal opacity-75">Download for Android</div>
                <div className="text-base">SafetyLink APK</div>
              </div>
              <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <a href={EXE_URL}
              className="group flex items-center gap-4 bg-sl-card hover:bg-sl-border border border-sl-border text-white font-bold px-8 py-4 rounded-2xl transition-all hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <Monitor className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs font-normal text-slate-400">Windows Desktop App</div>
                <div className="text-base">Org Console EXE</div>
              </div>
              <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <button onClick={onSignup}
              className="group flex items-center gap-3 border border-sl-red/40 hover:border-sl-red text-sl-red hover:text-white hover:bg-sl-red font-bold px-8 py-4 rounded-2xl transition-all w-full sm:w-auto justify-center">
              <Users className="w-5 h-5" />
              Register Your Organisation
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <p className="text-slate-600 text-xs">Enable "Install from unknown sources" on Android · Windows 10/11 required for EXE</p>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y border-sl-border bg-sl-navy/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: '< 1s', label: 'SOS trigger time' },
            { val: '100m+', label: 'BLE mesh range' },
            { val: '5', label: 'iTag devices / user' },
            { val: '100%', label: 'Offline capable' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white mb-1">{s.val}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-sl-red text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="w-3.5 h-3.5" /> Core Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Built for extreme reliability.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Traditional safety apps fail when networks go down. SafetyLink keeps working.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: <Bell />, title: 'One-Tap SOS', desc: 'Hardware keyfob or screen tap triggers instant multi-channel alerts — SMS, call, WhatsApp, and push — simultaneously.', color: 'text-red-400' },
              { icon: <MapPin />, title: 'Live GPS Tracking', desc: 'Real-time location of all field users on an interactive map. Org admins see everyone instantly.', color: 'text-blue-400' },
              { icon: <Radio />, title: 'BLE Mesh Network', desc: 'iTag keyfob integration with generic GATT discovery. Works without mobile data in offline environments.', color: 'text-purple-400' },
              { icon: <Lock />, title: 'Siloed Tenants', desc: 'Isolated data per organisation. Security companies, estates, and schools — fully separated.', color: 'text-yellow-400' },
              { icon: <Users />, title: 'Role-Based Access', desc: 'User, Responder, Admin, and Super Admin roles. Each sees only what they need.', color: 'text-green-400' },
              { icon: <Zap />, title: 'Anti-Hijack Mode', desc: 'Safety Ride system with interior alerts and countermeasures for vehicle security.', color: 'text-orange-400' },
            ].map(f => (
              <div key={f.title} className="group bg-sl-card border border-sl-border rounded-2xl p-6 hover:border-sl-red/30 transition-all duration-300 card-glow cursor-default">
                <div className={`${f.color} mb-4 w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl`}>
                  {React.cloneElement(f.icon as React.ReactElement, { className: 'w-5 h-5' })}
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 bg-sl-navy/30 border-y border-sl-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Two ways to use SafetyLink</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-sl-card border border-sl-border rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-sl-red/10 border border-sl-red/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-sl-red" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Field Users</h3>
                  <p className="text-slate-500 text-sm">Android Mobile App</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {['Download the Android APK', 'Register as User, Responder, or join your Org', 'Pair iTag BLE keyfob for hands-free SOS', 'Trigger SOS with one tap — alerts sent instantly', 'Stay tracked and connected even offline'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sl-red/10 text-sl-red text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-sl-red/20">{i+1}</span>
                    <p className="text-slate-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>
              <a href={APK_URL} className="flex items-center justify-center gap-2 bg-sl-red hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all w-full">
                <Download className="w-4 h-4" /> Download Android APK
              </a>
            </div>

            <div className="bg-sl-card border border-sl-border rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-900/30 border border-blue-800/20 rounded-2xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Organisations</h3>
                  <p className="text-slate-500 text-sm">Web Portal + Windows Console</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {['Register your org here or on the mobile app', 'Get your unique Organisation ID (e.g. SL-ACME-1234)', 'Share the org ID with your field users', 'Monitor all users live on the map', 'Receive instant SOS alerts and incident logs'].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-800/30">{i+1}</span>
                    <p className="text-slate-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={onSignup} className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all">
                  <ArrowRight className="w-4 h-4" /> Register Org
                </button>
                <a href={EXE_URL} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-sl-border text-white font-semibold px-4 rounded-xl transition-all">
                  <Download className="w-4 h-4" /> EXE
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sl-red/4 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="float mb-8 inline-block">
            <div className="w-20 h-20 mx-auto bg-sl-red/10 border border-sl-red/20 rounded-3xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-sl-red" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">Protect your people today.</h2>
          <p className="text-slate-400 mb-10 text-lg">Join security companies, estates, and communities across South Africa.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onSignup} className="bg-sl-red hover:bg-red-600 text-white font-black px-10 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-red-900/40 hover:-translate-y-0.5 text-lg">
              Register Your Organisation
            </button>
            <button onClick={onLogin} className="bg-sl-card hover:bg-sl-border border border-sl-border text-white font-semibold px-10 py-4 rounded-2xl transition-all">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-sl-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/sl-icon.png" alt="" className="w-8 h-8 rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            <div>
              <div className="font-bold text-sm">SafetyLink</div>
              <div className="text-slate-600 text-xs">TM Media Solutions · Gauteng, South Africa</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 text-sm">
            <button onClick={onLogin} className="hover:text-white transition-colors">Org Login</button>
            <button onClick={onSignup} className="hover:text-white transition-colors">Register Org</button>
            <a href={APK_URL} className="hover:text-white transition-colors">Download APK</a>
            <a href={EXE_URL} className="hover:text-white transition-colors">Download EXE</a>
          </div>
          <div className="text-slate-700 text-xs">© 2026 TM Media Solutions</div>
        </div>
      </footer>
    </div>
  );
}
