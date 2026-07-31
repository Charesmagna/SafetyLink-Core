import fs from 'fs';

let content = fs.readFileSync('src/utils/store.ts', 'utf8');

// 1. Add Moya to the Dispatch Engine pipeline logs
content = content.replace(
  "// 1. SmsDispatcher",
  "// 1. Supabase Edge Function\n    get().addAuditLog('DISPATCH', 'INFO', '[SupabaseDispatcher] Triggering Cloud Edge Functions', 'Invoking /functions/v1/send-sos');\n    const functionUrl = import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sos` : 'https://oirbmgpfqxojshfoguzo.supabase.co/functions/v1/send-sos';\n    try {\n      const { data: { session } } = await supabase.auth.getSession();\n      if (session?.access_token) {\n        await fetch(functionUrl, {\n          method: 'POST',\n          headers: {\n            'Authorization': `Bearer ${session.access_token}`,\n            'Content-Type': 'application/json'\n          },\n          body: JSON.stringify({ user_id: session.user.id, lat: loc.lat, lng: loc.lng })\n        });\n      }\n    } catch(e) { console.warn('Supabase edge func failed', e); }\n\n    // 1b. SmsDispatcher"
);

// 2. Add Lizzy popup delay
content = content.replace(
  "// 3. DashboardDispatcher",
  "// 2b. Voice AI Callback Scheduler\n    setTimeout(() => {\n      if (get().activeSOSState !== 'IDLE') {\n        get().setShowLizzyPopup(true);\n        get().addAuditLog('SYSTEM', 'INFO', '[Lizzy AI] Wellness Check', 'Triggered AI wellness check after timeout.');\n      }\n    }, 120000);\n\n    // 3. DashboardDispatcher"
);

// 3. Add Custom Server and Moya logic near Twilio logic
const customServerLogic = `
    // Custom Server Webhook
    if (get().customBackendUrl) {
      try {
        await fetch(\`\${get().customBackendUrl}/api/panic\`, { method: 'POST', body: JSON.stringify({ id: incidentId, lat: loc.lat, coords: \`\${loc.lat},\${loc.lng}\`, lng: loc.lng, description, name: get().currentUser?.fullName || 'User', isDrill }) });
      } catch (e) {
        console.warn("Custom server failed", e);
      }
    }

    // Moya App Fallback
    try {
      if ((window as any).Capacitor && Capacitor.isNativePlatform()) {
        const { App: CapacitorApp } = await import('@capacitor/app');
        if ((CapacitorApp as any).canOpenUrl) {
          const res = await (CapacitorApp as any).canOpenUrl({ url: 'moya://' });
          if (res.value && (CapacitorApp as any).openUrl) {
             const fallbackMsg = \`\${isDrill ? '⚠️ DRILL ⚠️' : '🚨 SAFETYLINK PANIC 🚨'}\\nName: \${get().currentUser?.fullName || 'User'}\\nLocation: https://maps.google.com/?q=\${loc.lat},\${loc.lng}\`;
             await (CapacitorApp as any).openUrl({ url: \`moya://share?text=\${encodeURIComponent(fallbackMsg)}\` });
          }
        }
      }
    } catch (e) {
      console.warn('Moya check failed', e);
    }
`;

content = content.replace(
  "const userOrgId = get().currentUser?.orgCode || '';",
  customServerLogic + "\n    const userOrgId = get().currentUser?.orgCode || '';"
);

// We need to make sure supabase and Capacitor are imported in store.ts.
if (!content.includes("import { supabase }")) {
  content = content.replace("import { create } from 'zustand';", "import { create } from 'zustand';\nimport { supabase } from '../lib/supabase';\nimport { Capacitor } from '@capacitor/core';");
}

fs.writeFileSync('src/utils/store.ts', content);
