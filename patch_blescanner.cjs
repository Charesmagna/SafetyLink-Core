const fs = require('fs');
let code = fs.readFileSync('src/components/BLEScanner.tsx', 'utf8');

const replacement = `
                <button
                  onClick={async () => {
                    // Trigger Payfast checkout dynamically
                    try {
                      const response = await fetch('/api/payfast/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          plan_name: 'Premium',
                          amount: '49.00',
                          item_description: 'SafetyLink Premium Subscription (BLE Unlock)',
                          email: 'user@example.com'
                        })
                      });
                      const data = await response.json();
                      if (data.success && data.url) {
                        window.location.href = data.url;
                      } else {
                        alert('Checkout initialization failed.');
                      }
                    } catch(err) {
                      console.error(err);
                      alert('Checkout initialization failed.');
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/50"
                >
`;

code = code.replace(
  /<button\s+onClick=\{\(\) => \{\s*\/\/ Start checkout flow - simulating for now\s*window\.location\.href = "https:\/\/paystack\.com\/pay\/safetylink-premium";\s*\}\}\s*className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900\/50"\s*>/g,
  replacement
);

fs.writeFileSync('src/components/BLEScanner.tsx', code);
console.log("Patched BLEScanner.tsx");
