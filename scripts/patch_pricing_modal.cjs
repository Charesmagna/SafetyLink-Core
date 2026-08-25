const fs = require('fs');
let code = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

// Insert State import if missing
if (!code.includes('useState')) {
  code = code.replace("import { motion } from 'motion/react';", "import React, { useState } from 'react';\nimport { motion } from 'motion/react';");
}

code = code.replace(
  'export const PricingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {',
  `export const PricingModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
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
  };`
);

code = code.replace(
  '<button className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">Go Premium</button>',
  `<button onClick={() => handlePayfastCheckout('Individual', '49.00')} disabled={loadingPlan === 'Individual'} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">{loadingPlan === 'Individual' ? 'Processing...' : 'Subscribe with Payfast'}</button>`
);

code = code.replace(
  '<button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors">Get Family Plan</button>',
  `<button onClick={() => handlePayfastCheckout('Family', '99.00')} disabled={loadingPlan === 'Family'} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors text-white">{loadingPlan === 'Family' ? 'Processing...' : 'Subscribe with Payfast'}</button>`
);

fs.writeFileSync('src/components/PricingModal.tsx', code);
