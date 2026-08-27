// @ts-nocheck
import React, { useState } from 'react';
import { Smartphone, Monitor, Globe, Check, XCircle } from 'lucide-react';
import { useAppStore } from '../../utils/store';

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

const handlePaystackHardwareCheckout = (productId: 'lite' | 'active' | 'premium', quantity: number) => {
    const hardwareProducts = {
      lite: { name: "SafetyLink iTAG Lite", price: 100, description: "Compact BLE panic keyfob." },
      active: { name: "SafetyLink iTAG Active (3-Pack)", price: 179, description: "3x BLE keyfobs." },
      premium: { name: "SafetyLink iTAG Premium (5-Pack)", price: 299, description: "5x BLE keyfobs." },
    };
    const selectedProduct = hardwareProducts[productId];
    const totalAmount = selectedProduct.price * quantity;
    // Get logged-in user email from store
    
    const user = useAppStore.getState().currentUser;
    const customerEmail = user?.email || 'customer@safetylink.online';

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
      email: customerEmail,
      amount: totalAmount * 100, // Paystack operates in cents
      currency: 'ZAR',
      ref: `SL-ORDER-${Date.now()}`,
      metadata: {
        account_id: "Phathutshedzo1",
        product_id: productId,
        product_name: selectedProduct.name,
        quantity: quantity,
        custom_fields: [
          {
            display_name: "Hardware Type",
            variable_name: "hardware_type",
            value: selectedProduct.name
          },
          {
            display_name: "Sourcing Channel",
            variable_name: "sourcing_channel",
            value: productId === 'lite' ? 'TAKEALOT_BULK' : productId === 'active' ? 'CREATIVE_BRANDS' : 'FIND_MY_ALT'
          }
        ]
      },
      callback: (transaction: any) => {
        console.log("Payment successful! Reference: ", transaction.reference);
        // You can add a success toast here
        alert("Hardware ordered successfully! Reference: " + transaction.reference);
      }
    });

    handler.openIframe();
  };


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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Digital-Only SOS (On-Screen & Widget)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Live GPS & 2 Emergency Contacts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> <span className="text-slate-400">No physical button (iTag) pairing</span></li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors">Select Free</button>
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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Physical iTag Support (Hands-Free)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Up to 5 physical iTags per profile</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Professional control room monitoring</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Geofenced Safe Zones</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Emergency audio recording</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Priority cloud routing</span></li>
              </ul>
              <button onClick={() => handlePayfastCheckout('Individual', '49.00')} disabled={loadingPlan === 'Individual'} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">{loadingPlan === 'Individual' ? 'Processing...' : 'Subscribe with Payfast'}</button>
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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Protects up to 6 family members</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Up to 12 Bluetooth iTags</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Shared family dashboard</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Live family tracking & group panic</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Shared safe zones & timeline</span></li>
              </ul>
              <button onClick={() => handlePayfastCheckout('Family', '99.00')} disabled={loadingPlan === 'Family'} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors text-white">{loadingPlan === 'Family' ? 'Processing...' : 'Subscribe with Payfast'}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Patrol Companies */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Security & Patrol Plans</h3>
              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">Starter</h4>
                    <span className="text-xl font-black text-white">R999<span className="text-sm text-slate-500 font-normal">/mo</span></span>
                  </div>
                  <p className="text-xs text-slate-400">Up to 50 clients. Live client map, basic reporting, client management.</p>
                </div>
                
                <div className="bg-slate-800 p-5 rounded-2xl border border-emerald-500/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">Professional</h4>
                    <span className="text-xl font-black text-emerald-400">R2,499<span className="text-sm text-emerald-400/50 font-normal">/mo</span></span>
                  </div>
                  <p className="text-xs text-slate-300">Up to 250 clients. Auto dispatch, incident/staff management, API, WhatsApp alerts.</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">Business</h4>
                    <span className="text-xl font-black text-white">R5,999<span className="text-sm text-slate-500 font-normal">/mo</span></span>
                  </div>
                  <p className="text-xs text-slate-400">Up to 1,000 clients. White-label dashboard, multi-branch, fleet tracking.</p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-white">Enterprise</h4>
                    <span className="text-lg font-black text-white">Custom Quote</span>
                  </div>
                  <p className="text-xs text-slate-400">Unlimited scale. Dedicated infra, white-label app, 24/7 priority support.</p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Hardware */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Hardware (Bluetooth iTags)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Single</div>
                    <div className="text-lg font-bold text-white">R149</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>
                    <button onClick={() => handlePaystackHardwareCheckout('lite', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Lite</button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active</div>
                    <div className="text-lg font-bold text-white">R199</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>
                    <button onClick={() => handlePaystackHardwareCheckout('active', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Active</button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Premium</div>
                    <div className="text-lg font-bold text-white">R348</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>
                    <button onClick={() => handlePaystackHardwareCheckout('premium', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Premium</button>
                  </div>
                  <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/50 text-center">
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Lite (5-Pack)</div>
                    <div className="text-lg font-bold text-white">R499</div><div className="text-[8px] text-slate-400 -mt-1 mb-1">+ 1mo Premium</div>
                    <button onClick={() => handlePaystackHardwareCheckout('lite', 5)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy 5-Pack</button>
                  </div>
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
