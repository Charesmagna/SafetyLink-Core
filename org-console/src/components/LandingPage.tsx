import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, MapPin, Bell, Users, ChevronDown, Download, ArrowRight, Zap, Lock, Radio } from 'lucide-react';

const APK_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink.apk';
const APK_DEBUG_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink-debug.apk';
const EXE_URL = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download/SafetyLink-OrgConsole-Setup-1.0.0.exe';

interface Props {
  onOrgLogin: () => void;
  onOrgSignup: () => void;
}

export default function LandingPage({ onOrgLogin, onOrgSignup }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-sl-dark text-white font-sans">

      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur border-b border-sl-border' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/sl-icon.png" alt="SafetyLink" className="w-9 h-9 rounded-xl"
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span className="font-bold text-lg tracking-tight">SafetyLink</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOrgLogin}
              className="text-slate-300 hover:text-white text-sm px-4 py-2 transition-colors">
              Organisation Login
            </button>
            <button onClick={onOrgSignup}
              className="bg-sl-red hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              Register Org
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sl-red/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-900/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Shield logo */}
          <div className="inline-flex items-center justify-center w-28 h-28 mb-8 relative">
            <img src="/sl-icon.png" alt="SafetyLink Shield" className="w-full h-full object-contain drop-shadow-2xl"
              onError={e => {
                const el = e.target as HTMLImageElement;
                el.style.display='none';
                const next = el.nextElementSibling as HTMLElement;
                if (next) next.style.display='flex';
              }} />
            <div className="hidden w-28 h-28 items-center justify-center bg-sl-red/10 border border-sl-red/30 rounded-3xl">
              <Shield className="w-14 h-14 text-sl-red" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-sl-red/10 border border-sl-red/20 text-sl-red text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <Zap className="w-3 h-3" /> Mission-Critical Emergency Response
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Safety.<br />
            <span className="text-sl-red">Linked.</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time emergency response platform connecting field users, responders, and organisations.
            One tap SOS. Live tracking. Instant alerts.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a href={APK_URL}
              className="flex items-center gap-3 bg-sl-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors w-full sm:w-auto justify-center group">
              <Smartphone className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs opacity-75">Download for</div>
                <div className="text-base">Android APK</div>
              </div>
              <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </a>

            <a href={EXE_URL}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-xl transition-colors w-full sm:w-auto justify-center group">
              <Monitor className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs opacity-75 text-slate-400">Organisation Console</div>
                <div className="text-base">Windows EXE</div>
              </div>
              <Download className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            </a>
          </div>

          <p className="text-slate-600 text-xs">
            Android 8.0+ required · Enable "Install from unknown sources" · Windows 10/11
          </p>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-6 h-6 text-slate-600 mx-auto" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for the field. <span className="text-sl-red">Trusted in a crisis.</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">From individual users to large security organisations — SafetyLink keeps everyone connected and protected.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Bell className="w-6 h-6" />, title: 'One-Tap SOS', desc: 'Instant panic alerts with GPS coordinates sent to your organisation and emergency contacts.' },
              { icon: <MapPin className="w-6 h-6" />, title: 'Live Tracking', desc: 'Real-time location of all field users visible to organisation admins on an interactive map.' },
              { icon: <Radio className="w-6 h-6" />, title: 'Offline Ready', desc: 'BLE mesh networking and offline mode keep the system running even without mobile data.' },
              { icon: <Lock className="w-6 h-6" />, title: 'Encrypted', desc: 'End-to-end encrypted communications. Your data stays private and secure at all times.' },
              { icon: <Users className="w-6 h-6" />, title: 'Team Management', desc: 'Organisations can manage users, roles, and response protocols from the web portal or Windows app.' },
              { icon: <Zap className="w-6 h-6" />, title: 'Instant Alerts', desc: 'Push notifications, SMS, and in-app alerts ensure no emergency goes unnoticed.' },
            ].map(f => (
              <div key={f.title} className="bg-sl-panel border border-sl-border rounded-2xl p-6 hover:border-sl-red/30 transition-colors">
                <div className="text-sl-red mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-sl-panel/30 border-y border-sl-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Field users */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sl-red/10 border border-sl-red/30 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-sl-red" />
                </div>
                <h3 className="text-xl font-bold">For Field Users</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Download the Android APK',
                  'Register as User, Responder, or join your Organisation',
                  'One tap SOS sends your location instantly',
                  'Stay connected even offline via BLE mesh',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sl-red text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-slate-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>
              <a href={APK_URL} className="inline-flex items-center gap-2 mt-6 bg-sl-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                <Download className="w-4 h-4" /> Download APK
              </a>
            </div>

            {/* Organisations */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-900/30 border border-blue-800/30 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">For Organisations</h3>
              </div>
              <div className="space-y-4">
                {[
                  'Register your organisation on the APK or web portal',
                  'Get your unique Organisation ID',
                  'Download the Windows console or use this website',
                  'Monitor all your users live — map, alerts, incidents',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-blue-700 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-slate-300 text-sm">{s}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={onOrgSignup} className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                  <ArrowRight className="w-4 h-4" /> Register Organisation
                </button>
                <a href={EXE_URL} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm">
                  <Download className="w-4 h-4" /> EXE
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Shield className="w-12 h-12 text-sl-red mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to protect your team?</h2>
          <p className="text-slate-400 mb-8">Join organisations across South Africa using SafetyLink to keep their people safe.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onOrgSignup}
              className="bg-sl-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Register Your Organisation
            </button>
            <button onClick={onOrgLogin}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-sl-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sl-red" />
            <span className="text-sm font-semibold">SafetyLink</span>
            <span className="text-slate-600 text-sm">· TM Media Solutions</span>
          </div>
          <div className="flex items-center gap-6 text-slate-600 text-xs">
            <span>Vlakfontein, Gauteng, South Africa</span>
            <button onClick={onOrgLogin} className="hover:text-white transition-colors">Org Login</button>
            <a href={APK_URL} className="hover:text-white transition-colors">Download APK</a>
            <a href={EXE_URL} className="hover:text-white transition-colors">Download EXE</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
