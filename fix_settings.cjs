const fs = require('fs');

let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Replace the unused hooks
content = content.replace("    customBackendUrl,\n    setCustomBackendUrl,\n    currentUser", "    customBackendUrl,\n    setCustomBackendUrl,\n    currentUser");

// Actually, wait, the error said they are unused. I just need to USE them!
// Where is "Personal Integrations"? Let's find it and inject the input for customBackendUrl.
const newUi = `
              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Custom Alerting Server (Fallback/Org)</h5>
                <input type="text" value={localBackendUrl} onChange={e => setLocalBackendUrl(e.target.value)} onBlur={() => setCustomBackendUrl(localBackendUrl)} placeholder="e.g. https://oraclecloud.mycompany.com" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>
`;

if (!content.includes("Custom Alerting Server (Fallback/Org)")) {
  content = content.replace('<h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>', newUi + '\n                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>');
}

fs.writeFileSync('src/components/Settings.tsx', content);
