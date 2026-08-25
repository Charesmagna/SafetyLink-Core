// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, MonitorSmartphone, Monitor, Globe, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ChevronDown, Bluetooth, Bot, Lock, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';


export function Layout({ children, onLogin, onRegisterUser, onRegisterOrg }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 antialiased overflow-x-hidden">
      <nav className="fixed w-full z-50 bg-[#0f172a] shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/media/new_logos/logo_hq.png" className="h-10 w-auto" alt="SafetyLink Logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/platform" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Platform</Link>
            <Link to="/use-cases" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Use Cases</Link>
            <Link to="/enterprise" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">For Security Companies</Link>
            <Link to="/hardware" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Hardware</Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</Link>
            
            <button onClick={onLogin} className="text-sm font-bold text-white hover:text-[#15803d] transition-colors ml-2">Login</button>
            <button onClick={onRegisterOrg} className="bg-[#15803d] hover:bg-green-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm">Start your 14-day trial</button>
          </div>
          
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f172a] border-t border-slate-800 p-6 flex flex-col gap-4 absolute w-full shadow-2xl">
            <Link to="/platform" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium text-[15px]">Platform</Link>
            <Link to="/use-cases" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium text-[15px]">Use Cases</Link>
            <Link to="/enterprise" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium text-[15px]">For Security Companies</Link>
            <Link to="/hardware" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium text-[15px]">Hardware</Link>
            <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-300 font-medium text-[15px]">Pricing</Link>
            <button onClick={() => { setMobileMenuOpen(false); if(onLogin) onLogin(); }} className="text-slate-300 font-medium text-[15px] text-left">Login</button>
            <button onClick={onRegisterOrg} className="bg-[#15803d] text-white p-3 rounded-full font-bold text-center text-[15px] block w-full">Start your 14-day trial</button>
          </div>
        )}
      </nav>

      <main className="pt-20">
        {children}
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer id="contact" className="bg-[#0f172a] border-t-[12px] border-[#15803d] pt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <img src="/media/new_logos/logo_hq.png" alt="SafetyLink Logo" className="h-24 w-auto mx-auto mb-8 opacity-80 mix-blend-lighten" />
            <h3 className="text-2xl font-black text-white tracking-[0.06em] uppercase mb-12">ONE APP. TOTAL PEACE OF MIND.</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 border border-slate-700 rounded-2xl flex items-center justify-center text-[#15803d] bg-slate-800/30">
                   <Smartphone size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-[0.08em] mb-1">One Tap Alert</p>
                  <p className="text-[13px] text-slate-400">Quickly send an emergency alert.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 border border-slate-700 rounded-2xl flex items-center justify-center text-[#15803d] bg-slate-800/30">
                   <Users size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-[0.08em] mb-1">Trusted Network</p>
                  <p className="text-[13px] text-slate-400">Your alerts go to the people you trust.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 border border-slate-700 rounded-2xl flex items-center justify-center text-[#15803d] bg-slate-800/30">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-[0.08em] mb-1">Real Time Location</p>
                  <p className="text-[13px] text-slate-400">Help can find you faster.</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 border border-slate-700 rounded-2xl flex items-center justify-center text-[#15803d] bg-slate-800/30">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-[0.08em] mb-1">Reliable & Secure</p>
                  <p className="text-[13px] text-slate-400">Your safety and data are our priority.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-slate-800 mb-16"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <h5 className="text-[12px] font-black text-[#15803d] uppercase tracking-widest mb-6">Company Information</h5>
              <div className="flex flex-col gap-3">
                <a href="#" className="text-[14px] text-slate-400 hover:text-white transition-colors">About Us</a>
                <a href="#" className="text-[14px] text-slate-400 hover:text-white transition-colors">Our Partners</a>
                <a href="#" className="text-[14px] text-slate-400 hover:text-white transition-colors">Company</a>
                <a href="https://wa.me/27739441222" target="_blank" rel="noreferrer" className="text-[14px] text-slate-400 hover:text-white transition-colors">Contact Us</a>
              </div>
            </div>
            <div>
              <h5 className="text-[12px] font-black text-[#15803d] uppercase tracking-widest mb-6">Resources</h5>
              <div className="flex flex-col gap-3">
                <Link to="/technology" className="text-[14px] text-slate-400 hover:text-white transition-colors">How It Works</Link>
                <Link to="/platform" className="text-[14px] text-slate-400 hover:text-white transition-colors">Solutions</Link>
                <Link to="/pricing" className="text-[14px] text-slate-400 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h5 className="text-[12px] font-black text-[#15803d] uppercase tracking-widest mb-6">Legal Disclaimers</h5>
              <p className="text-[13px] text-slate-400 leading-relaxed mb-6">
                This disclaimer applies to all content, software, and services provided by SafetyLink. The information provided is for general safety enhancement. While we strive for absolute reliability, physical safety cannot be guaranteed by software alone.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-[13px] text-slate-400 border-b border-slate-700 pb-1 hover:text-white">Legal</a>
                <a href="#" className="text-[13px] text-slate-400 border-b border-slate-700 pb-1 hover:text-white">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 pb-6">
            <h5 className="text-[12px] font-black text-[#15803d] uppercase tracking-widest mb-6 text-center">CONNECT WITH THE SAFETYLINK NETWORK</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-[13px] text-slate-400">
              <div>
                <strong className="text-white mb-2 block">Primary contact:</strong>
                WhatsApp: 073 944 1222<br/>
                Message us to register your estate, request a demo, get a quote, download the app, or report an issue.
              </div>
              <div>
                <strong className="text-white mb-2 block">Email & Website:</strong>
                info@safetylink.online<br/>
                safetylink.online
              </div>
              <div>
                <strong className="text-white mb-2 block">Support hours:</strong>
                Mon-Fri: 08:00 – 17:00<br/>
                Emergency tech support: 24/7 via WhatsApp
              </div>
            </div>
            <div className="text-center text-[13px] text-slate-400 mt-8">
              <strong className="text-white">Organisation registration:</strong> To register your estate or security company, WhatsApp us with your organisation name, number of residents, your area, and your preferred SL-ORG code.
            </div>
          </div>
          
          <div className="border-t border-slate-800 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1.5 text-center md:text-left">
              <span className="text-[12px] text-slate-400 font-medium">Powered by ©TM Media Solutions — Reg: 2018/500191/07</span>
              <a href="https://safetylink.online" className="text-[12px] text-[#15803d] font-semibold hover:underline">safetylink.online</a>
            </div>
            <p className="text-[12px] text-[#15803d] font-bold tracking-[0.15em] uppercase text-center">
              STAY CONNECTED. STAY PROTECTED. STAY IN CONTROL.
            </p>
            <div className="flex flex-col gap-1.5 text-center md:text-right">
              <span className="text-[12px] text-slate-400">Contact: 073 944 1222</span>
              <span className="text-[12px] text-slate-500 italic font-semibold">K'lev.c</span>
            </div>
          </div>
          
          <div className="text-center py-6 border-t border-slate-800">
            <p className="text-[11px] text-slate-500">
              SafetyLink® is a registered trademark. © 2024–2026 SafetyLink. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
