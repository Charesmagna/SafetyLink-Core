const fs = require('fs');
const path = 'src/services/OrgSyncService.ts';
let content = fs.readFileSync(path, 'utf8');

const target1 = `      // 1. Fire webhook (mock)
      if (externalWebhookUrl) {
        console.log("Sending payload:", siaPayload);
        // await fetch(externalWebhookUrl, { method: 'POST', body: JSON.stringify(siaPayload) });
      }`;

const repl1 = `      // 1. Fire webhook
      if (externalWebhookUrl && externalWebhookUrl.startsWith('http')) {
        console.log("Sending payload:", siaPayload);
        try {
          const response = await fetch(externalWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + import.meta.env.VITE_SIA_TOKEN || 'placeholder'
            },
            body: JSON.stringify(siaPayload)
          });
          if (!response.ok) {
            throw new Error('SIA sync failed with status ' + response.status);
          }
        } catch (fetchErr) {
          console.warn("External SIA sync failed, continuing locally.", fetchErr);
        }
      }`;

content = content.replace(target1, repl1);

fs.writeFileSync(path, content);
console.log('Patched OrgSyncService.ts');
