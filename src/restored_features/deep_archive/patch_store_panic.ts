import fs from 'fs';

let content = fs.readFileSync('src/utils/store.ts', 'utf8');

// Add import for sendPanic
if (!content.includes("import { sendPanic }")) {
  content = content.replace("import { pushIncidentTelemetry }", "import { sendPanic } from '../services/panicRouter';\nimport { pushIncidentTelemetry }");
}

// Update triggerPanic
content = content.replace(
  "    // 1. SmsDispatcher\n    get().addAuditLog('DISPATCH', 'INFO', '[SmsDispatcher] Executing channel broadcast', `Sending cell SMS with geolocation maps linkage to primary contacts.`);\n    await new Promise(r => setTimeout(r, 600));\n\n    // 2. PushDispatcher\n    get().addAuditLog('DISPATCH', 'INFO', '[PushDispatcher] Triggering native push system', `Broadcasting high-priority system-level alert push notifications.`);\n    await new Promise(r => setTimeout(r, 600));",
  `    // Run SMART PANIC ROUTER sequence
    try {
      get().addAuditLog('DISPATCH', 'INFO', '[PanicRouter] Starting SMART Offline-First Routing', 'Attempting Native SMS, Call, WhatsApp, Custom Server, and Moya');
      await sendPanic(
        { id: incidentId, lat: loc.lat, coords: \`\${loc.lat},\${loc.lng}\`, lng: loc.lng, description, name: who },
        get().contacts,
        get().customBackendUrl
      );
    } catch(e) {
      console.warn('Smart Panic Router Error', e);
    }
    
    // Post-panic Voice AI Check
    get().setShowLizzyPopup(true);`
);

fs.writeFileSync('src/utils/store.ts', content);
