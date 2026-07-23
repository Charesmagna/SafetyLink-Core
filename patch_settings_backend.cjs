const fs = require('fs');

let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Ensure useAppStore destructures customBackendUrl and setCustomBackendUrl
if (!content.includes("customBackendUrl,")) {
  content = content.replace("setFloatingWidgetSize,", "setFloatingWidgetSize,\n    customBackendUrl,\n    setCustomBackendUrl,");
}

// Add state for it
if (!content.includes("const [localBackendUrl,")) {
  content = content.replace("const [profileName, setProfileName]", "const [localBackendUrl, setLocalBackendUrl] = useState(customBackendUrl || '');\n  const [profileName, setProfileName]");
}

// Add UI section
const uiCode = `
          {/* Custom Server Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden group mb-8">
            <h3 className="text-xl font-bold text-white mb-2 font-display flex items-center">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text mr-3">Custom Alerting Server</span>
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Route your distress alerts and telemetry to a custom organizational backend, self-hosted cloud, or own security company server.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custom Server URL</label>
                <input
                  type="url"
                  placeholder="https://your-server.com"
                  value={localBackendUrl}
                  onChange={e => setLocalBackendUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
                />
              </div>
              
              <button 
                onClick={() => { setCustomBackendUrl(localBackendUrl); addToast('Custom Server Updated', 'success'); }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all border border-slate-700 w-full md:w-auto"
              >
                Save Server Configuration
              </button>
            </div>
          </div>
`;

if (!content.includes("Custom Alerting Server")) {
  // Inject before "Profile Customization" or another section
  content = content.replace('{/* Integrations & Webhooks */}', uiCode + '\n          {/* Integrations & Webhooks */}');
}

fs.writeFileSync('src/components/Settings.tsx', content);
