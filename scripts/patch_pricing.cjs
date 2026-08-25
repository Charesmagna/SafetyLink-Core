const fs = require('fs');
let code = fs.readFileSync('src/components/landing/Pricing.tsx', 'utf8');

// Insert state for loading
code = code.replace(
  'export function Pricing() {',
  `export function Pricing() {\n  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);\n\n  const handlePayfastCheckout = async (planName: string, amount: string) => {\n    try {\n      setLoadingPlan(planName);\n      const response = await fetch('/api/payfast/checkout', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({\n          plan_name: planName,\n          amount: amount,\n          item_description: \`SafetyLink \${planName} Subscription\`,\n          email: 'user@example.com'\n        })\n      });\n      const data = await response.json();\n      if (data.success && data.url) {\n        window.location.href = data.url;\n      } else {\n        alert('Checkout failed: ' + (data.error || 'Unknown error'));\n      }\n    } catch (e) {\n      console.error(e);\n      alert('Network error during checkout.');\n    } finally {\n      setLoadingPlan(null);\n    }\n  };\n`
);

// Individual button
code = code.replace(
  '{["SafetyLink Mobile app", "iTAG keyfob pairing", "SOS alerts", "Watch-Me Timer", "Emergency contact dispatch", "Offline SMS fallback", "11-language support"].map((ft, i) => (\n                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>\n                ))}\n              </ul>\n            </div>',
  `{["SafetyLink Mobile app", "iTAG keyfob pairing", "SOS alerts", "Watch-Me Timer", "Emergency contact dispatch", "Offline SMS fallback", "11-language support"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Individual', '49.00')}
                disabled={loadingPlan === 'Individual'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Individual' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>`
);

// Family button
code = code.replace(
  '{["Covers up to 5 individual profiles under one household node", "Everything in Individual"].map((ft, i) => (\n                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>\n                ))}\n              </ul>\n            </div>',
  `{["Covers up to 5 individual profiles under one household node", "Everything in Individual"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Family', '99.00')}
                disabled={loadingPlan === 'Family'}
                className="w-full bg-[#15803d] hover:bg-green-700 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Family' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>`
);

// Organisation button
code = code.replace(
  '{["Everything in Individual", "SafetyLink Command Deck", "SafetyLink Admin panel", "Multi-responder dispatch", "Live GIS beacon overlay", "Evidence Ledger", "Audit logs", "SL-ORG-XXXX mesh node", "Dedicated organisational configuration"].map((ft, i) => (\n                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>\n                ))}\n              </ul>\n            </div>',
  `{["Everything in Individual", "SafetyLink Command Deck", "SafetyLink Admin panel", "Multi-responder dispatch", "Live GIS beacon overlay", "Evidence Ledger", "Audit logs", "SL-ORG-XXXX mesh node", "Dedicated organisational configuration"].map((ft, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-[#15803d] shrink-0" /> {ft}</li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayfastCheckout('Organisation', '49.00')}
                disabled={loadingPlan === 'Organisation'}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-center text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                {loadingPlan === 'Organisation' ? 'Processing...' : 'Subscribe with Payfast'}
              </button>
            </div>`
);

fs.writeFileSync('src/components/landing/Pricing.tsx', code);
