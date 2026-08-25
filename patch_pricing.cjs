const fs = require('fs');
let code = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

const freeListOld = `<ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Includes 1 User</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Live GPS location & emergency contacts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>24-hour location history</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Community alerts & basic push notifications</span></li>
              </ul>`;
const freeListNew = `<ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Digital-Only SOS (On-Screen & Widget)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Live GPS & 2 Emergency Contacts</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> <span className="text-slate-400">No physical button (iTag) pairing</span></li>
              </ul>`;

const premiumListOld = `<ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Supports up to 5 Bluetooth iTags</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Unlimited panic activations</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Private company monitoring</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Live tracking & 12-month history</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Safe zone alerts & emergency audio</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Priority cloud & premium support</span></li>
              </ul>`;
const premiumListNew = `<ul className="space-y-3 mb-6 flex-1 text-sm text-slate-300">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Physical iTag Support (Hands-Free)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Up to 5 physical iTags per profile</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Professional control room monitoring</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Geofenced Safe Zones</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Emergency audio recording</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> <span>Priority cloud routing</span></li>
              </ul>`;

code = code.replace(freeListOld, freeListNew);
code = code.replace(premiumListOld, premiumListNew);

fs.writeFileSync('src/components/PricingModal.tsx', code);
