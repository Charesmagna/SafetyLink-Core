const fs = require('fs');
const path = 'src/utils/store.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `
    for (const item of queue) {
      try {
        let ok = true;
        
        // 1. If thingsboard token is present, push to ThingsBoard
`;

const replaceStr = `
    // Check if worker endpoint is available for bulk sync
    try {
      const baseUrl = get().customBackendUrl || '';
      const bulkRes = await fetch(\`\${baseUrl}/api/sync/offline\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, payload: queue })
      });
      if (bulkRes.ok) {
         const { failedItems } = await bulkRes.json();
         // If there are failed items in bulk, we just replace queue with them
         // otherwise queue is empty
         if (failedItems && Array.isArray(failedItems) && failedItems.length > 0) {
            set({ localOfflineQueue: failedItems });
            setStoredJSON('sl_offline_queue', failedItems);
            get().addToast(\`Sync completed with \${failedItems.length} failures remaining in queue.\`, 'warn');
            get().addAuditLog('SYSTEM', 'WARN', 'Offline alert cache sync partial', \`\${failedItems.length} items failed to sync.\`);
         } else {
            set({ localOfflineQueue: [] });
            setStoredJSON('sl_offline_queue', []);
            if (!silent) get().addToast('Successfully synced all offline queued alerts to worker!', 'success');
            get().addAuditLog('SYSTEM', 'INFO', 'Offline alert cache synced successfully via Worker DB', 'Local storage buffer fully flushed.');
         }
         return; // We skip the individual sync logic below if bulk sync works
      }
    } catch (e) {
      console.warn('Worker bulk sync failed, falling back to individual endpoints', e);
    }

    for (const item of queue) {
      try {
        let ok = true;
        
        // 1. If thingsboard token is present, push to ThingsBoard
`;

if (content.includes(targetStr)) {
   content = content.replace(targetStr, replaceStr);
   fs.writeFileSync(path, content);
   console.log("Patched successfully!");
} else {
   console.log("Target string not found in store.ts");
}
