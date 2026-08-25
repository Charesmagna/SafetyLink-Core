const fs = require('fs');
let code = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

const paystackLogic = `
  const handlePaystackHardwareCheckout = (productId, quantity) => {
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

    const handler = window.PaystackPop.setup({
      key: 'pk_test_your_paystack_public_key', // Replace with real key in production
      email: customerEmail,
      amount: totalAmount * 100, // Paystack operates in cents
      currency: 'ZAR',
      ref: \`SL-ORDER-\${Date.now()}\`,
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
      callback: (transaction) => {
        console.log("Payment successful! Reference: ", transaction.reference);
        // You can add a success toast here
        alert("Hardware ordered successfully! Reference: " + transaction.reference);
      }
    });

    handler.openIframe();
  };
`;

if (!code.includes("handlePaystackHardwareCheckout")) {
    code = code.replace("const handlePayfastCheckout =", paystackLogic + "\n  const handlePayfastCheckout =");
}

// Now replace the hardware section UI
const oldHardwareUI = `<div className="text-lg font-bold text-white">R89</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">3-Pack</div>
                    <div className="text-lg font-bold text-white">R189</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">5-Pack</div>
                    <div className="text-lg font-bold text-white">R450</div>
                  </div>
                  <div className="bg-emerald-900/30 p-3 rounded-xl border border-emerald-500/50 text-center">
                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">10-Pack</div>
                    <div className="text-lg font-bold text-white">R740</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">Reseller Margin:</span> The 10-Pack is optimized to provide a ~28% margin for local community resellers and neighborhood watch distributors.
                </p>`;

const newHardwareUI = `<div className="text-lg font-bold text-white">R100</div>
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
                </p>`;

if (code.includes('R89</div>')) {
    code = code.replace(oldHardwareUI, newHardwareUI);
}

fs.writeFileSync('src/components/PricingModal.tsx', code);
