const fs = require('fs');
let code = fs.readFileSync('src/components/PricingModal.tsx', 'utf8');

// Replace handlePaystackHardwareCheckout with WhatsApp linking logic
code = code.replace(
  /const handlePaystackHardwareCheckout = \(type: string, qty: number\) => \{[\s\S]*?\};/,
  `const handleWhatsAppOrder = (type: string, qty: number) => {
    const number = "27739441222";
    let typeName = "";
    if (type === "lite") typeName = "Lite iTag";
    else if (type === "active") typeName = "Active iTag";
    else if (type === "premium") typeName = "Premium iTag";
    
    let message = \`Hi SafetyLink, I would like to order \${qty}x \${typeName}.\`;
    const url = \`https://wa.me/\${number}?text=\${encodeURIComponent(message)}\`;
    window.open(url, '_blank');
  };`
);

code = code.replace(/handlePaystackHardwareCheckout/g, 'handleWhatsAppOrder');

fs.writeFileSync('src/components/PricingModal.tsx', code);
console.log("Patched PricingModal for WhatsApp");
