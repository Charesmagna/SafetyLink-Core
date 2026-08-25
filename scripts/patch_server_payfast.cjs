const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const cryptoImport = `import crypto from 'crypto';\n`;
if (!code.includes('import crypto from')) {
    code = cryptoImport + code;
}

const payfastCode = `
  // --- PAYFAST INTEGRATION ---
  app.post("/api/payfast/checkout", async (req, res) => {
    try {
      const { plan_name, amount, item_description, email } = req.body;
      const merchant_id = process.env.PAYFAST_MERCHANT_ID || '26778541';
      const merchant_key = process.env.PAYFAST_MERCHANT_KEY || 'gqgynogxhcomh';
      const passphrase = process.env.PAYFAST_PASSPHRASE || '';
      const baseUrl = req.headers.origin || 'https://safetylink.online';

      const data = {
        merchant_id,
        merchant_key,
        return_url: \`\${baseUrl}?payment=success\`,
        cancel_url: \`\${baseUrl}?payment=cancel\`,
        notify_url: \`\${baseUrl}/api/payfast/webhook\`,
        name_first: 'SafetyLink',
        name_last: 'User',
        email_address: email || 'user@example.com',
        m_payment_id: \`sl_\${Date.now()}\`,
        amount: parseFloat(amount).toFixed(2),
        item_name: plan_name || 'SafetyLink Subscription',
        item_description: item_description || 'SafetyLink Core Subscription'
      };

      let pfOutput = '';
      for (let key in data) {
        if (data[key] !== '') {
          pfOutput += \`\${key}=\${encodeURIComponent(data[key]).replace(/%20/g, '+')}&\`;
        }
      }
      let getString = pfOutput.slice(0, -1);
      if (passphrase) {
        getString += \`&passphrase=\${encodeURIComponent(passphrase).replace(/%20/g, '+')}\`;
      }
      const signature = crypto.createHash('md5').update(getString).digest('hex');
      const payload = { ...data, signature };

      // Payfast uses https://www.payfast.co.za/eng/process for production
      const payfastUrl = 'https://www.payfast.co.za/eng/process?' + new URLSearchParams(payload).toString();
      
      res.json({ success: true, url: payfastUrl });
    } catch (e: any) {
      console.error("Payfast Checkout Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/payfast/webhook", express.urlencoded({ extended: true }), async (req, res) => {
    try {
      // Payfast sends ITN as application/x-www-form-urlencoded
      const pfData = req.body;
      console.log('Received Payfast ITN:', pfData);
      
      // Ideally, you would validate the signature and IP here,
      // then update the user's subscription in the database.
      if (pfData.payment_status === 'COMPLETE') {
         console.log('Payment complete for:', pfData.item_name);
         // Simulate DB update
      }

      res.status(200).send('OK');
    } catch (e: any) {
      console.error('Payfast ITN Error:', e);
      res.status(500).send('Error');
    }
  });

  // Vite middleware for development
`;

code = code.replace('// Vite middleware for development', payfastCode);
fs.writeFileSync('server.ts', code);
