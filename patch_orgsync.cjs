const fs = require('fs');
let content = fs.readFileSync('src/services/OrgSyncService.ts', 'utf8');

const oldFetch = `      if (externalWebhookUrl && externalWebhookUrl.startsWith('http')) {
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

const newFetch = `      if (externalWebhookUrl && externalWebhookUrl.startsWith('http')) {
        console.log("Routing payload through backend proxy:", siaPayload);
        try {
          const response = await fetch('/api/external-sia', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: externalWebhookUrl,
              payload: siaPayload
            })
          });
          if (!response.ok) {
            throw new Error('SIA sync proxy failed with status ' + response.status);
          }
        } catch (fetchErr) {
          console.warn("External SIA sync failed, continuing locally.", fetchErr);
        }
      }`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync('src/services/OrgSyncService.ts', content, 'utf8');
