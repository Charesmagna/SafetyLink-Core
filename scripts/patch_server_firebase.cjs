const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const adminImport = `import * as admin from 'firebase-admin';\n\n// Initialize Firebase Admin for Firestore updates\nadmin.initializeApp({\n  projectId: 'ai-studio-safetylinkcore-eba1fe74-5070-40bf-b7fa-4d20c299bf48'\n});\nconst firestoreDb = admin.firestore();\n`;

if (!code.includes('import * as admin from')) {
    code = code.replace('import { WebSocketServer } from "ws";', 'import { WebSocketServer } from "ws";\n' + adminImport);
}

// Now replace the Payfast webhook to update Firestore
const webhookOld = `
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
  });`;

const webhookNew = `
  app.post("/api/payfast/webhook", express.urlencoded({ extended: true }), async (req, res) => {
    try {
      const pfData = req.body;
      console.log('Received Payfast ITN:', pfData);
      
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
                 updated_at: admin.firestore.FieldValue.serverTimestamp()
               });
             });
             await batch.commit();
             console.log('Successfully upgraded user roles in Firestore for:', pfData.email_address);
           } else {
             console.log('User not found in Firestore for email:', pfData.email_address);
             // Optionally create a pending subscription record here
           }
         } catch (firestoreErr) {
           console.error('Firestore update error during webhook processing:', firestoreErr);
         }
      }

      res.status(200).send('OK');
    } catch (e: any) {
      console.error('Payfast ITN Error:', e);
      res.status(500).send('Error');
    }
  });`;

code = code.replace(webhookOld, webhookNew);
fs.writeFileSync('server.ts', code);
