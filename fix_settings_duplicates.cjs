const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const marker = '<h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>';
const firstIndex = content.indexOf(marker);

if (firstIndex !== -1) {
    // find where the block starts
    const blockStart = content.lastIndexOf('<div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">', firstIndex);
    
    // find where the first block ends by looking for the next top-level block
    // The next top-level block is <div className="text-center mt-6">
    const nextBlockStart = content.indexOf('<div className="text-center mt-6">', blockStart);
    
    if (blockStart !== -1 && nextBlockStart !== -1) {
        // the pre content
        const pre = content.substring(0, blockStart);
        const post = content.substring(nextBlockStart);
        
        const cleanIntegrations = `
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase">Moya / Turn.io (Data-Free)</h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[9px] text-slate-400">Enable</span>
                    <input type="checkbox" checked={moyaEnabled} onChange={e => setMoyaEnabled(e.target.checked)} className="accent-blue-500" />
                  </label>
                </div>
                <input type="text" value={turnApiToken} onChange={e => setTurnApiToken(e.target.value)} placeholder="Turn.io API Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('turn')} className="w-full py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Moya
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
                <button
                  type="button"
                  onClick={testTwilioAndSupabase}
                  className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all"
                >
                  📡 Test All Integrations
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Private Security Company</h5>
                <input type="text" value={securityCompany} onChange={e => setSecurityCompany(e.target.value)} placeholder="Security Company Name" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={personalControlRoom} onChange={e => setPersonalControlRoom(e.target.value)} placeholder="Control Room Dispatcher Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase flex justify-between items-center">
                  ThingsBoard (UDP)
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={tbEnabled} onChange={e => setTbEnabled(e.target.checked)} className="accent-purple-500" />
                  </label>
                </h5>
                <input type="text" value={tbHost} onChange={e => setTbHost(e.target.value)} placeholder="UDP Host" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="number" value={tbPort} onChange={e => setTbPort(parseInt(e.target.value) || 0)} placeholder="UDP Port" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <div className="flex flex-row justify-between items-center mb-1"><h5 className="text-[9px] font-bold text-slate-500 uppercase">OwnCloud / NextCloud</h5><button onClick={() => { const code = currentUser?.orgCode || currentUser?.orgCode || ""; const baseUrl = ocUrl || "http://localhost:8080"; const type = currentUser?.orgCode ? "FAMILY" : "ORGANIZATION"; const zipUrl = \`\${baseUrl}/index.php/apps/files/ajax/download.php?files=&dir=/safetylink/\${type}/\${code}\`; window.open(zipUrl, "_blank"); }} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[8px] font-bold px-2 py-1 rounded transition-colors">Download ZIP</button></div>
                <input type="text" value={ocUrl} onChange={e => setOcUrl(e.target.value)} placeholder="Server URL" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocUser} onChange={e => setOcUser(e.target.value)} placeholder="Username" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={ocToken} onChange={e => setOcToken(e.target.value)} placeholder="App Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocFolder} onChange={e => setOcFolder(e.target.value)} placeholder="Sync Folder Path" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>
`;
        let newContent = pre + cleanIntegrations + post;
        
        // Add missing states
        const statesToAdd = `
  const [turnApiToken, setTurnApiToken] = useState(currentUser?.moya?.turnApiToken || '');
  const [moyaEnabled, setMoyaEnabled] = useState(currentUser?.moya?.enabled || false);

  const connectService = async (serviceName: 'turn' | 'twilio') => {
    try {
      if (serviceName === 'turn' && !turnApiToken) throw new Error("Turn.io API Token is required");
      if (serviceName === 'twilio' && (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber)) throw new Error("Twilio Account SID, Auth Token, and From Number are required");

      const response = await supabase.functions.invoke('setup-service', {
        body: {
          service: serviceName,
          token: serviceName === 'turn' ? turnApiToken : undefined,
          accountSid: twilioAccountSid,
          authToken: twilioAuthToken,
          fromNumber: twilioFromNumber
        }
      });

      if (response.error) throw new Error(response.error.message || "Unknown error from edge function");

      useAppStore.getState().addToast(\`Successfully connected to \${serviceName}!\`, "success");
    } catch (e: any) {
      useAppStore.getState().addToast(\`Failed to connect \${serviceName}: \${e.message}\`, "error");
    }
  };

  const testTwilioAndSupabase = async () => {
    try {
      useAppStore.getState().addToast("Testing integrations...", "info");
      
      const response = await supabase.functions.invoke('send-twilio-sms', {
        body: {
          to: currentUser?.phone || "+1234567890",
          message: "SafetyLink Test - Integrations are working!"
        }
      });
      if (response.error) throw new Error(response.error.message);
      
      useAppStore.getState().addToast("Test successful! Integrations are working.", "success");
    } catch (e: any) {
      useAppStore.getState().addToast("Test failed: " + e.message, "error");
    }
  };
`;
        if (!newContent.includes('const [turnApiToken')) {
            newContent = newContent.replace("const [twilioAccountSid", statesToAdd + "\n  const [twilioAccountSid");
        }
        
        fs.writeFileSync('src/components/Settings.tsx', newContent);
        console.log("Successfully fixed Settings.tsx");
    }
}
