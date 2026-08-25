const fs = require('fs');

// Patch PricingModal.tsx
let pricing = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');
pricing = pricing.replace(
  "const handlePaystackHardwareCheckout = (productId, quantity) => {",
  "const handlePaystackHardwareCheckout = (productId: 'lite' | 'active' | 'premium', quantity: number) => {"
);
pricing = pricing.replace(
  "callback: (transaction) => {",
  "callback: (transaction: any) => {"
);
pricing = pricing.replace(
  "const handler = window.PaystackPop.setup({",
  "const handler = (window as any).PaystackPop.setup({"
);
fs.writeFileSync('src/components/PricingModal.tsx', pricing);

// Patch EvidenceLedger.tsx
let ledger = fs.readFileSync('src/components/EvidenceLedger.tsx', 'utf8');
ledger = ledger.replace(
  `currentUser?.role === 'Super Admin'`,
  `currentUser?.role === 'super_admin'`
);
fs.writeFileSync('src/components/EvidenceLedger.tsx', ledger);

