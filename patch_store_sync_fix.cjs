const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');

const target = `    // Org Sync Service (Phase 3)
    if (userOrgId) {
       OrgSyncService.pushIncidentToExternalSIA(newEvent, 'https://api.external-security-node.com/sia/v1/ingest');
    }`;

const replacement = `    // Org Sync Service (Phase 3)
    const activeOrg = get().activeProfile?.orgCode;
    if (activeOrg) {
       const syncEvent = {
         id: incidentId,
         status: 'ESCALATING' as const,
         severity: 'CRITICAL' as const,
         lat: loc.lat,
         lng: loc.lng,
         timestamp: Date.now(),
         description: description,
         timelineData: [],
         profileUsed: get().activeProfile?.id
       };
       OrgSyncService.pushIncidentToExternalSIA(syncEvent, 'https://api.external-security-node.com/sia/v1/ingest');
    }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/utils/store.ts', content);
  console.log("store.ts org sync patched successfully");
} else {
  console.log("Target not found in store.ts org sync fix");
}
