// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Smartphone, Users, MonitorSmartphone, Monitor, Globe, ShieldCheck, Zap, Activity, CheckCircle2, XCircle, ChevronDown, Bluetooth, Bot, Lock, Server } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePayfastCheckout = async (planName: string, amount: string) => {
    try {
      setLoadingPlan(planName);
      const response = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planName,
          amount: amount,
          item_description: `SafetyLink ${planName} Subscription`,
          email: 'user@example.com'
        })
      });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Network error during checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      {/* ══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">SIMPLE PRICING. NO SURPRISES.</h2>
            <p className="text-slate-600 text-[15px] leading-relaxed">
              One platform fee. Zero interference with how security operators run their business. SafetyLink charges the platform. You charge your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Individual */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
              <h4 className="text-sm font-black text-[#15803d] uppercase tracking-widest mb-2">Individual / Resident</h4>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900">R49</span><span className="text-sm text-slate-500 font-medium"> / month</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Once-off registration: R149</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["SafetyLink Mobile app", "iTAG keyfob pairing", "SOS alerts", "Watch-Me Timer", "Emergency contact dispatch", "Offline SMS fallback", "11-language support"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Individual', '49.00')}
                disabled={loadingPlan === 'Individual'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Individual' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>

            {/* Family */}
            <div className="bg-white border-2 border-[#15803d] rounded-3xl p-8 shadow-xl relative flex flex-col transform lg:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#15803d] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most Popular</div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Family of 5</h4>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900">R99</span><span className="text-sm text-slate-500 font-medium"> / month</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Once-off: R149 per member</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Covers up to 5 individual profiles under one household node", "Everything in Individual"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Family', '99.00')}
                disabled={loadingPlan === 'Family'}
                className="w-full bg-[#15803d] hover:bg-green-700 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Family' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>

            {/* Organisation */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
              <h4 className="text-sm font-black text-[#15803d] uppercase tracking-widest mb-2">Organisation / Estate</h4>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-black text-slate-900">R49</span><span className="text-sm text-slate-500 font-medium"> / resident / month</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Once-off registration: R149 per resident</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Individual", "SafetyLink Command Deck", "SafetyLink Admin panel", "Multi-responder dispatch", "Live GIS beacon overlay", "Evidence Ledger", "Audit logs", "SL-ORG-XXXX mesh node", "Dedicated organisational configuration"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Organisation', '49.00')}
                disabled={loadingPlan === 'Organisation'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Organisation' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col text-white">
              <h4 className="text-sm font-black text-[#15803d] uppercase tracking-widest mb-2">Enterprise / Security</h4>
              <div className="mb-6 pb-6 border-b border-slate-800">
                <span className="text-2xl font-black text-white">Custom Pricing</span>
                <p className="text-xs text-slate-400 mt-2 font-medium">Based on node count and volume</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Organisation", "API access", "Control room integration", "Custom branding options", "Dedicated support", "Multi-estate management"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button onClick={onRegisterOrg} className="w-full bg-[#15803d] hover:bg-green-700 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors">Start your 14-day trial</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">What you are NOT paying for:</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["No call centre subscription", "No proprietary hardware lock-in", "No hidden dispatch fees", "No interference with your existing armed response contract"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-slate-600 font-medium"><XCircle size={16} className="text-red-500 shrink-0" /> {ft}</li>
                ))}
              </ul>
            </div>
            <div className="text-center md:text-right shrink-0">
              <p className="text-2xl md:text-3xl font-black text-[#15803d] tracking-tight">R49. ONE LIFE PROTECTED.<br/>EVERY MONTH.</p>
            </div>
          </div>
        </div>
      </section>

      
      {/* ══ DOWNLOAD ══════════════════════════════════════════════════════ */}
      <section id="download" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">GET SAFETYLINK ON YOUR DEVICE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white mb-6">
                <Smartphone size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Android APK</h3>
              <p className="text-xs text-slate-600 mb-6 flex-1">
                Download the SafetyLink Core APK directly to your Android device.<br/><br/>
                Minimum: Android 8.0 (API 24) or higher. Bluetooth Low Energy required for iTAG functionality.<br/><br/>
                Tap DOWNLOAD APK and install from your downloads folder. Enable "Install from unknown sources" if prompted.
              </p>
              <a href="https://wa.me/27739441222?text=I+want+to+download+SafetyLink+APK" target="_blank" rel="noreferrer" className="bg-[#0f172a] hover:bg-slate-800 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Download APK</a>
              <p className="text-[10px] text-slate-400 mt-4">Contact 073 944 1222 on WhatsApp for the latest link.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white mb-6">
                <Monitor size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Windows EXE — Command Deck</h3>
              <p className="text-xs text-slate-600 mb-6 flex-1">
                The SafetyLink Command Deck is available as a Windows desktop application for control room operators.<br/><br/>
                Minimum: Windows 10 64-bit.<br/><br/>
                Requires: Active SL-ORG-XXXX organisational mesh code for access.
              </p>
              <a href="https://wa.me/27739441222?text=I+want+to+download+SafetyLink+EXE" target="_blank" rel="noreferrer" className="bg-[#0f172a] hover:bg-slate-800 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Request Installer</a>
              <p className="text-[10px] text-slate-400 mt-4">Contact 073 944 1222 on WhatsApp to receive it.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#15803d] rounded-2xl flex items-center justify-center text-white mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-lg font-black text-[#15803d] mb-4 uppercase">PWA — Progressive Web App</h3>
              <p className="text-xs text-slate-700 mb-6 flex-1">
                Access SafetyLink directly from your browser on any device — no installation required.<br/><br/>
                Visit safetylink.online and tap ADD TO HOME SCREEN on your mobile browser.<br/><br/>
                Works on Android, iOS, and desktop. Full offline capability once installed.
              </p>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="bg-[#15803d] hover:bg-green-700 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Open Web App</a>
            </div>
          </div>

          <div className="bg-[#0f172a] text-white rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-2xl">
            <h3 className="text-[15px] font-black text-[#15803d] mb-4 uppercase tracking-widest">After Download:</h3>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              Launch the app. On the SECURE COMMAND GATEWAY screen, enter your USERNAME / CALLSIGN and PASSWORD. If you belong to an organisation, enter your ORGANISATIONAL MESH CODE (format: SL-ORG-XXXX). Leave blank for standalone individual mode. Tap SIGN IN TO CONSOLE.<br/><br/>
              New user? Tap CREATE USER / RESPONDER to register. Organisation not yet on SafetyLink? Tap REGISTER ORGANISATION.
            </p>
          </div>
        </div>
      </section>

      
    </>
  );
}
