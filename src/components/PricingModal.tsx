import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';

export const PricingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  
  const handlePaystackHardwareCheckout = (productId: 'lite' | 'active' | 'premium', quantity: number) => {
    const hardwareProducts = {
      lite: {
        name: "SafetyLink Lite",
        price: 100,
        description: "Compact, budget-friendly emergency panic trigger."
      },
      active: {
        name: "SafetyLink Active",
        price: 150,
        description: "Sleek, ruggedized corporate keychain alert tag."
      },
      premium: {
        name: "SafetyLink Premium (Waterproof)",
        price: 299,
        description: "IP67 waterproof device with global location assistance."
      }
    };
    
    const selectedProduct = hardwareProducts[productId];
    const totalAmount = selectedProduct.price * quantity;
    const customerEmail = "user@example.com"; // In a real app, this should be the logged-in user's email

    const handler = (window as any).PaystackPop.setup({
      key: 'pk_test_your_paystack_public_key', // Replace with real key in production
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 font-sans my-8"
      >
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto">
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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Includes 1 User</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Live GPS location & emergency contacts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>24-hour location history</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Community alerts & basic push notifications</span></li>
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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Supports up to 5 Bluetooth iTags</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Unlimited panic activations</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Private company monitoring</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Live tracking & 12-month history</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Safe zone alerts & emergency audio</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Priority cloud & premium support</span></li>
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
                    <div className="text-lg font-bold text-white">R100</div>
                    <button onClick={() => handlePaystackHardwareCheckout('lite', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Lite</button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active</div>
                    <div className="text-lg font-bold text-white">R150</div>
                    <button onClick={() => handlePaystackHardwareCheckout('active', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Active</button>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Premium</div>
                    <div className="text-lg font-bold text-white">R299</div>
                    <button onClick={() => handlePaystackHardwareCheckout('premium', 1)} className="mt-2 w-full py-1.5 text-[10px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Buy Premium</button>
                  </div>
                  <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/50 text-center">
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Lite (5-Pack)</div>
                    <div className="text-lg font-bold text-white">R450</div>
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
      </motion.div>
    </div>
  );
};
