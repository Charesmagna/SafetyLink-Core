const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Remove fallbacks for process.env
const regexEnvFallbacks = /process\.env\.([A-Z0-9_]+)\s*\|\|\s*['"][^'"]*['"]/g;
content = content.replace(regexEnvFallbacks, 'process.env.$1');

// Wait, the ones in Pusher init are:
//   appId: process.env.PUSHER_APP_ID || "2184826",
// They are matched by the regex. Let's make sure:
// "2184826" -> yes.

// 2. Add raw body capturing
content = content.replace(
  /app\.use\(express\.json\(\{ limit: "50mb" \}\)\);/,
  `app.use(express.json({ limit: "50mb", verify: (req: any, res, buf) => { req.rawBody = buf; } }));`
);

// 3. Fix Paystack webhook
const paystackOld = `
      const hash = crypto
          .createHmac('sha512', PAYSTACK_SECRET_KEY)
          .update(JSON.stringify(req.body))
          .digest('hex');`;
const paystackNew = `
      if (!PAYSTACK_SECRET_KEY) {
          console.error('Security alert: PAYSTACK_SECRET_KEY not configured!');
          return res.status(500).send('Configuration Error');
      }

      const hash = crypto
          .createHmac('sha512', PAYSTACK_SECRET_KEY)
          .update((req as any).rawBody || JSON.stringify(req.body))
          .digest('hex');`;
content = content.replace(paystackOld, paystackNew);

// 4. Fix Payfast webhook
const payfastRegex = /app\.post\("\/api\/payfast\/webhook", express\.urlencoded\(\{ extended: true \}\), async \(req, res\) => \{[\s\S]*?res\.status\(200\)\.send\('OK'\);\n    \} catch \(e: any\) \{/m;
const payfastReplacement = `app.post("/api/payfast/webhook", express.urlencoded({ extended: true, verify: (req: any, res, buf) => { req.rawBody = buf; } }), async (req, res) => {
    try {
      const pfData = req.body;
      console.log('Received Payfast ITN:', pfData);
      
      // Payfast ITN Validation
      const pfHost = process.env.NODE_ENV === 'production' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
      const validateUrl = \`https://\${pfHost}/eng/query/validate\`;
      
      const validateResponse = await fetch(validateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: (req as any).rawBody || new URLSearchParams(req.body).toString()
      });
      
      const validateResult = await validateResponse.text();
      if (validateResult !== 'VALID') {
        console.error("Security alert: Payfast ITN validation failed:", validateResult);
        return res.status(401).send('Unauthorized');
      }

      if (pfData.payment_status === 'COMPLETE') {
         console.log('Payment complete for:', pfData.item_name, 'User:', pfData.email_address);
         
         // Update Firestore Database Role/Status
         try {
           const usersRef = firestoreDb.collection('users');
           const snapshot = await usersRef.where('email', '==', pfData.email_address).get();
           
           if (!snapshot.empty) {
             const batch = firestoreDb.batch();
             snapshot.forEach(doc => {
               batch.update(doc.ref, {
                 subscription_status: 'active',
                 subscription_plan: pfData.item_name || 'Premium',
                 role: (pfData.item_name && pfData.item_name.includes('Organisation')) ? 'org_admin' : 'premium_user',
                 updated_at: FieldValue.serverTimestamp()
               });
             });
             await batch.commit();
             console.log('Successfully upgraded user roles in Firestore for:', pfData.email_address);
           } else {
             console.log('User not found in Firestore for email:', pfData.email_address);
           }
         } catch (firestoreErr) {
           console.error('Firestore update error during webhook processing:', firestoreErr);
         }
      }

      res.status(200).send('OK');
    } catch (e: any) {`;

content = content.replace(payfastRegex, payfastReplacement);

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Patched server.ts");
