const fs = require('fs');

function patch(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

patch('src/components/landing/Pricing.tsx', [
  ['openSecure Payment GatewayCheckout', 'openPaystackCheckout']
]);

patch('src/components/TrialBanner.tsx', [
  ['openSecure Payment GatewayCheckout', 'openPaystackCheckout']
]);

patch('src/components/PricingModal.tsx', [
  ['Secure Payment GatewayPop', 'PaystackPop'],
  ['// Secure Payment Gateway operates in cents', '// Paystack operates in cents']
]);

patch('src/utils/paystackService.ts', [
  ['openSecure Payment GatewayCheckout', 'openPaystackCheckout'],
  ['Secure Payment GatewayPop', 'PaystackPop']
]);

console.log("Fixed code names");
