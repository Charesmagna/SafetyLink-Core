const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');

const importTarget = `import { TwilioService } from '../services/TwilioService';`;
const newImport = `import { TwilioService } from '../services/TwilioService';
import { OrgSyncService } from '../services/OrgSyncService';`;

const target = `    // 2. PushDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[PushDispatcher] Triggering native push system', \`Broadcasting high-priority system-level alert push notifications.\`);`;

const replacement = `    // 2. PushDispatcher
    get().addAuditLog('DISPATCH', 'INFO', '[PushDispatcher] Triggering native push system', \`Broadcasting high-priority system-level alert push notifications.\`);
    
    // Org Sync Service (Phase 3)
    if (userOrgId) {
       OrgSyncService.pushIncidentToExternalSIA(newEvent, 'https://api.external-security-node.com/sia/v1/ingest');
    }`;

if (content.includes(target) && content.includes(importTarget)) {
  content = content.replace(importTarget, newImport);
  content = content.replace(target, replacement);
  fs.writeFileSync('src/utils/store.ts', content);
  console.log("store.ts org sync patched successfully");
} else {
  console.log("Target not found in store.ts org sync");
}
