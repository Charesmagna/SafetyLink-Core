// @ts-nocheck
import React, { useState } from 'react';
import { Smartphone, Monitor, Globe, Check } from 'lucide-react';
import { useAppStore } from '../../utils/store';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Pricing({ onLogin, onRegisterUser, onRegisterOrg }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePaystackHardwareCheckout = (productId: 'lite' | 'active' | 'premium', quantity: number) => {
    const hardwareProducts = {
      lite:    { name: "SafetyLink iTAG Lite",         price: 149 },
      active:  { name: "SafetyLink iTAG Active",       price: 199 },
      premium: { name: "SafetyLink iTAG Premium",      price: 348 },
    };
    const product = hardwareProducts[productId];
    const user = useAppStore.getState().currentUser;
    const email = user?.email || 'customer@safetylink.online';
    const handler = (window as any).PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
      email,
      amount: product.price * quantity * 100,
      currency: 'ZAR',
      ref: `SL-ORDER-${Date.now()}`,
      callback: (tx: any) => alert('Order successful! Ref: ' + tx.reference),
    });
    handler?.openIframe();
  };

  const handlePayfastCheckout = async (planName: string, amount: string) => {
    try {
      setLoadingPlan(planName);
      const res = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: planName, amount, item_description: `SafetyLink ${planName} Subscription`, email: 'user@example.com' }),
      });
      const data = await res.json();
      if (data.success && data.url) window.location.href = data.url;
      else alert('Checkout failed: ' + (data.error || 'Unknown error'));
    } catch (e) {
      alert('Network error during checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <section id="pricing" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 font-sans">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white tracking-tight">Flexible Protection Plans</h2>
            <p className="text-slate-400 mt-2">Choose the right level of coverage for your family, community, or security organization.</p>
          </div>

          <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Individual & Family Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Free */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-1 rounded uppercase tracking-wider">Free</span>
                <h4 className="text-xl font-bold mt-3 text-white">SafetyLink Free</h4>
                <div className="mt-2 text-3xl font-black text-white">R0 <span className="text-sm text-slate-500 font-normal">/mo</span></div>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Digital-Only SOS (On-Screen & Widget)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Live GPS & 2 Emergency Contacts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /><span className="text-slate-400">No physical button (iTag) pairing</span></li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors text-white">Select Free</button>
            </div>

            {/* Premium */}
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 relative flex flex-col shadow-[0_0_30px_rgba(16,185,129,0.15)] md:-translate-y-2">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
              <div className="mb-4">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-1 rounded uppercase tracking-wider">Individual</span>
                <h4 className="text-xl font-bold mt-3 text-white">SafetyLink Premium</h4>
                <div className="mt-2 text-3xl font-black text-white">R49 <span className="text-sm text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-emerald-400 mt-1">& R149 once-off OR R499/year</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Physical iTag Support (Hands-Free)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Up to 5 physical iTags per profile</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Professional control room monitoring</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Geofenced Safe Zones</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Emergency audio recording</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span>Priority cloud routing</span></li>
              </ul>
              <button onClick={() => handlePayfastCheckout('Individual','49.00')} disabled={loadingPlan==='Individual'} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
                {loadingPlan==='Individual' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>

            {/* Family */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950 border border-blue-900 px-2 py-1 rounded uppercase tracking-wider">Group</span>
                <h4 className="text-xl font-bold mt-3 text-white">SafetyLink Family</h4>
                <div className="mt-2 text-3xl font-black text-white">R99 <span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <p className="text-xs text-blue-400 mt-1">& R289 once-off OR R999/year</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Protects up to 6 family members</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Up to 12 Bluetooth iTags</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Shared family dashboard</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Live family tracking & group panic</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Shared safe zones & timeline</span></li>
              </ul>
              <button onClick={() => handlePayfastCheckout('Family','99.00')} disabled={loadingPlan==='Family'} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors text-white">
                {loadingPlan==='Family' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Security Plans */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Security & Patrol Plans</h3>
              <div className="space-y-4">
                {[
                  { name:'Starter',      price:'R999',   suffix:'/mo', desc:'Up to 50 clients. Live client map, basic reporting, client management.', highlight:false },
                  { name:'Professional', price:'R2,499', suffix:'/mo', desc:'Up to 250 clients. Auto dispatch, incident/staff management, API, WhatsApp alerts.', highlight:true },
                  { name:'Business',     price:'R5,999', suffix:'/mo', desc:'Up to 1,000 clients. White-label dashboard, multi-branch, fleet tracking.', highlight:false },
                  { name:'Enterprise',   price:'Custom', suffix:'',    desc:'Unlimited scale. Dedicated infra, white-label app, 24/7 priority support.', highlight:false },
                ].map((p,i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${p.highlight ? 'bg-slate-800 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-white">{p.name}</h4>
                      <span className={`text-xl font-black ${p.highlight ? 'text-emerald-400' : 'text-white'}`}>{p.price}<span className="text-sm font-normal text-slate-400">{p.suffix}</span></span>
                    </div>
                    <p className="text-xs text-slate-400">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-10">
              {/* Hardware */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Hardware (Bluetooth iTags)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label:'Single',    price:'R149', id:'lite',    qty:1 },
                    { label:'Active',    price:'R199', id:'active',  qty:1 },
                    { label:'Premium',   price:'R348', id:'premium', qty:1 },
                    { label:'5-Pack',    price:'R499', id:'lite',    qty:5, highlight:true },
                  ].map((h,i) => (
                    <div key={i} className={`p-3 rounded-xl border text-center ${h.highlight ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 ${h.highlight ? 'text-emerald-400' : 'text-slate-500'}`}>{h.label}</div>
                      <div className="text-lg font-bold text-white">{h.price}</div>
                      <div className="text-[8px] text-slate-400 mb-1">+ 1mo Premium</div>
                      <button onClick={() => handlePaystackHardwareCheckout(h.id as any, h.qty)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy</button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">Universal Sourcing:</span> All devices are fulfilled locally. Secure Paystack checkout dynamically routes to optimal suppliers.
                </p>
              </div>

              {/* Add-ons */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Optional Add-ons</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-sm font-bold text-slate-200">White-Label Mobile App</span>
                    <span className="text-sm font-bold text-emerald-400">R1,000/mo</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-sm font-bold text-slate-200">Advanced Analytics</span>
                    <span className="text-sm font-bold text-emerald-400">R299/mo</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-sm font-bold text-slate-200 block mb-1">Additional Communications</span>
                    <span className="text-xs text-slate-400 block mb-2">SMS Bundles, WhatsApp Business & Voice Dispatch</span>
                    <span className="text-sm font-bold text-emerald-400">Usage-based billing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download section */}
      <section id="download" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">GET SAFETYLINK ON YOUR DEVICE</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white mb-6"><Smartphone size={32}/></div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Android APK</h3>
              <p className="text-xs text-slate-600 mb-6 flex-1">Download the SafetyLink Core APK directly to your Android device. Minimum: Android 8.0. Bluetooth Low Energy required for iTAG functionality.</p>
              <a href="https://wa.me/27739441222?text=I+want+to+download+SafetyLink+APK" target="_blank" rel="noreferrer" className="bg-[#0f172a] hover:bg-slate-800 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Download APK</a>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white mb-6"><Monitor size={32}/></div>
              <h3 className="text-lg font-black text-slate-900 mb-4 uppercase">Windows EXE — Command Deck</h3>
              <p className="text-xs text-slate-600 mb-6 flex-1">The SafetyLink Command Deck for control room operators. Minimum: Windows 10 64-bit. Requires active SL-ORG-XXXX code.</p>
              <a href="https://wa.me/27739441222?text=I+want+to+download+SafetyLink+EXE" target="_blank" rel="noreferrer" className="bg-[#0f172a] hover:bg-slate-800 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Request Installer</a>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#15803d] rounded-2xl flex items-center justify-center text-white mb-6"><Globe size={32}/></div>
              <h3 className="text-lg font-black text-[#15803d] mb-4 uppercase">PWA — Web App</h3>
              <p className="text-xs text-slate-700 mb-6 flex-1">Access SafetyLink directly from your browser. Visit safetylink.online and tap Add to Home Screen. Full offline support.</p>
              <a href="https://safetylink.online" target="_blank" rel="noreferrer" className="bg-[#15803d] hover:bg-green-700 text-white w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">Open Web App</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
