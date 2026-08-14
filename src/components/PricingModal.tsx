
import { motion } from 'framer-motion';
import { X, Shield, Plus, Check } from 'lucide-react';

export const PricingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 font-sans my-8"
      >
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-mono font-black text-white uppercase tracking-tight">SafetyLink Plans & Pricing</h2>
            <p className="text-slate-400 font-mono text-xs mt-2">Secure your life, family, and business.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Individual Plans */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-1 rounded uppercase">Individual</span>
                <h3 className="text-xl font-bold mt-3 text-white">Free / Premium</h3>
                <div className="mt-2 text-3xl font-black text-white">R0 <span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <p className="text-xs text-slate-400 mt-1">Premium: R149 once-off + R49/mo (or R499/yr)</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Basic safety alerts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>1 Free Panic Button (Premium)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>GPS Location Sharing</span></li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-mono text-xs font-bold uppercase transition-colors">Select Plan</button>
            </div>

            {/* Family Plan */}
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-6 relative flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 border border-blue-900 px-2 py-1 rounded uppercase">Family</span>
                <h3 className="text-xl font-bold mt-3 text-white">Family Pack</h3>
                <div className="mt-2 text-3xl font-black text-white">R99 <span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <p className="text-xs text-blue-400/80 mt-1">Complete household protection</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <span>All Premium features</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <span>5 Free Panic Buttons included</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <span>Family Geo-Fence & Routing</span></li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-mono text-xs font-bold uppercase shadow-lg shadow-blue-500/20 transition-colors text-white">Select Plan</button>
            </div>

            {/* Security Company Plans */}
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-6 relative flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950 border border-purple-900 px-2 py-1 rounded uppercase">Enterprise & Guarding</span>
                <h3 className="text-xl font-bold mt-3 text-white">Security Orgs</h3>
                <div className="mt-2 text-3xl font-black text-white">From R999 <span className="text-sm text-slate-500 font-normal">/mo</span></div>
                <p className="text-xs text-slate-400 mt-1">Scalable command infrastructure</p>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> <span>Starter: R999/mo</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> <span>Professional: R2,499/mo</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> <span>Business: R5,999/mo</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" /> <span>Enterprise: Custom Pricing</span></li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/30 font-mono text-xs font-bold uppercase transition-colors text-purple-400">Contact Sales</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-mono font-bold text-sm text-slate-200 uppercase mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Hardware: SafetyLink iTags
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span>Single Bluetooth iTag</span>
                  <span className="font-bold text-white font-mono">R99</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span>2-Pack Bundle</span>
                  <span className="font-bold text-white font-mono">R199</span>
                </li>
                <li className="flex justify-between items-center pb-2">
                  <span>5-Pack Family Bundle</span>
                  <span className="font-bold text-emerald-400 font-mono">R499</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h4 className="font-mono font-bold text-sm text-slate-200 uppercase mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Optional Add-Ons
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span>Armed Response Link (Partner)</span>
                  <span className="font-bold text-white font-mono">+ R69/mo</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span>Medical Passport Sync</span>
                  <span className="font-bold text-white font-mono">+ R29/mo</span>
                </li>
                <li className="flex justify-between items-center pb-2">
                  <span>Vehicle Tracking Integration</span>
                  <span className="font-bold text-white font-mono">+ R89/mo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
