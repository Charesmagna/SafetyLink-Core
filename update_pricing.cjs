const fs = require('fs');

const modalCode = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

// Extract handlePaystackHardwareCheckout
const hardwareMatch = modalCode.match(/const handlePaystackHardwareCheckout = [\s\S]*?};\n/);
const hardwareCheckoutStr = hardwareMatch ? hardwareMatch[0] : '';

// Extract the content starting from `<div className="text-center mb-10">` to the end of the content grid
const contentMatch = modalCode.match(/<div className="text-center mb-10">([\s\S]*?)<\/div>\s*<\/motion.div>/);
let contentStr = contentMatch ? '<div className="text-center mb-10">' + contentMatch[1] : '';

const newPricingCode = `// @ts-nocheck
import React, { useState } from 'react';
import { Smartphone, Monitor, Globe, Check, XCircle } from 'lucide-react';

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

${hardwareCheckoutStr}

  const handlePayfastCheckout = async (planName: string, amount: string) => {
    try {
      setLoadingPlan(planName);
      const response = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planName,
          amount: amount,
          item_description: \`SafetyLink \${planName} Subscription\`,
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
          ${contentStr}
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
`;

fs.writeFileSync('src/components/landing/Pricing.tsx', newPricingCode);
