const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importStatement = `import nodemailer from 'nodemailer';\n`;

if (!code.includes("import nodemailer")) {
    code = code.replace("import express from", importStatement + "import express from");
}

const paystackWebhookCode = `
  // --- PAYSTACK INTEGRATION ---
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_your_secret_key_here';
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.MERCHANT_EMAIL || 'your-business-email@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
  });

  app.post('/api/webhooks/paystack', async (req, res) => {
      // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION
      const signature = req.headers['x-paystack-signature'];
      if (!signature) {
          console.error('Security alert: Paystack signature header is missing!');
          return res.status(401).send('Unauthorized');
      }

      const hash = crypto
          .createHmac('sha512', PAYSTACK_SECRET_KEY)
          .update(JSON.stringify(req.body))
          .digest('hex');

      if (hash !== signature) {
          console.error('Security alert: Webhook signature verification failed!');
          return res.status(401).send('Unauthorized');
      }

      // 2. DETECT SUCCESSFUL CHARGES
      const eventPayload = req.body;
      
      if (eventPayload.event === 'charge.success') {
          const transactionData = eventPayload.data;
          const customerEmail = transactionData.customer.email;
          const paidAmount = transactionData.amount / 100;
          const paystackRef = transactionData.reference;
          
          const metadata = transactionData.metadata || {};
          const productId = metadata.product_id;
          const quantity = metadata.quantity || 1;
          const productName = metadata.product_name || 'Generic iTag';

          console.log(\`Processing Order for \${customerEmail}: \${quantity}x \${productName} (Paid: R\${paidAmount})\`);

          let sourcingInstructions = '';
          let financialSummary = '';

          switch (productId) {
              case 'lite':
                  sourcingInstructions = \`
                  📌 **PRODUCT:** SafetyLink Lite (Budget Key Finder)
                  📦 **ACTION REQUIRED:** Ship \${quantity} button(s) from your local SafetyLink Lite inventory.
                  🛒 **REPLENISHMENT SOURCE:** Purchase Takealot 5-Pack (PLID95687197) for R205.00 (R41.00/unit).
                  💡 **PRO-TIP:** Purchase at least 4 packs (R820.00) to secure Free Shipping on Takealot!
                  ⚙️ **CONFIG:** Flash with Service UUID: '0000ffe0-0000-1000-8000-00805f9b34fb'.\`;
                  
                  financialSummary = \`
                  💵 **Customer Paid:** R\${paidAmount.toFixed(2)} (R100.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R\${(quantity * 41.00).toFixed(2)} (R41.00 each)
                  🛡️ **Net Profit Margin:** ~54.5%\`;
                  break;

              case 'active':
                  sourcingInstructions = \`
                  📌 **PRODUCT:** SafetyLink Active (Keychain Tag)
                  📦 **ACTION REQUIRED:** Ship \${quantity} button(s) from your local SafetyLink Active inventory.
                  🛒 **REPLENISHMENT SOURCE:** Order from Creative Brands (TECH-2051) at R72.89 each (incl. VAT).
                  💡 **PRO-TIP:** Order 18+ units (R1,312.02) to secure free delivery (Creative Brands threshold is R1,250).
                  ⚙️ **CONFIG:** Flash with Service UUID: '00001802-0000-1000-8000-00805f9b34fb'.\`;
                  
                  financialSummary = \`
                  💵 **Customer Paid:** R\${paidAmount.toFixed(2)} (R150.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R\${(quantity * 72.89).toFixed(2)} (R72.89 each)
                  🛡️ **Net Profit Margin:** ~47.3%\`;
                  break;

              case 'premium':
                  sourcingInstructions = \`
                  📌 **PRODUCT:** SafetyLink Premium (IP67 Waterproof Tracker)
                  📦 **ACTION REQUIRED:** Ship \${quantity} button(s) from your local SafetyLink Premium inventory.
                  🛒 **REPLENISHMENT SOURCE:** Fulfill using a waterproof Apple Find My-compatible tracker (average local cost ~R120.00).\`;
                  
                  financialSummary = \`
                  💵 **Customer Paid:** R\${paidAmount.toFixed(2)} (R299.00 each)
                  📉 **Estimated Sourcing Cost (COGS):** R\${(quantity * 120.00).toFixed(2)} (R120.00 each)
                  🛡️ **Net Profit Margin:** ~55%\`;
                  break;

              default:
                  sourcingInstructions = \`
                  📌 **PRODUCT:** Unknown/Custom Hardware Product
                  📦 **ACTION REQUIRED:** Manual lookup required for Paystack Reference: \${paystackRef}.\`;
                  financialSummary = \`💵 **Customer Paid:** R\${paidAmount.toFixed(2)}\`;
          }

          const emailContent = \`
          ⚡ NEW SAFETYLINK HARDWARE SALE SECURED! ⚡
          
          A payment has been successfully cleared and routed to your profile (Phathutshedzo1).
          
          ------------------------------------------------------------
          ORDER DETAILS:
          ------------------------------------------------------------
          • Customer: \${customerEmail}
          • Product: \${quantity}x \${productName}
          • Total Cleared: R\${paidAmount.toFixed(2)}
          • Paystack Reference: \${paystackRef}
          
          ------------------------------------------------------------
          FULFILLMENT INSTRUCTIONS (HOW TO SHIP):
          ------------------------------------------------------------
          \${sourcingInstructions}
          
          ------------------------------------------------------------
          FINANCIAL PERFORMANCE:
          ------------------------------------------------------------
          \${financialSummary}
          
          *This is an automated system notification for SafetyLink Core.*
          \`;

          const mailOptions = {
              from: process.env.MERCHANT_EMAIL || 'your-business-email@gmail.com',
              to: process.env.MERCHANT_FULFILLMENT_EMAIL || 'your-personal-fulfillment@gmail.com',
              subject: \`[SafetyLink Order] Fulfill \${quantity}x \${productName} (\${customerEmail})\`,
              text: emailContent
          };

          try {
              await transporter.sendMail(mailOptions);
              console.log(\`Success: Fulfillment instructions sent for order: \${paystackRef}\`);
          } catch (error) {
              console.error('Error: Failed to send merchant fulfillment email:', error);
          }
      }

      return res.status(200).send('Webhook Received');
  });

  // --- PAYFAST INTEGRATION ---
`;

if (!code.includes("app.post('/api/webhooks/paystack'")) {
    code = code.replace("// --- PAYFAST INTEGRATION ---", paystackWebhookCode);
}

fs.writeFileSync('server.ts', code);
