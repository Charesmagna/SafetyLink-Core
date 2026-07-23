const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// The file has multiple copies of:
// <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
//   <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>
// and
// <div className="space-y-3 border-t border-slate-800/50 pt-3">
//   <h5 className="text-[9px] font-bold text-slate-500 uppercase">Private Security Company</h5>
// ...
// We need to carefully strip out the duplicates.

// Find the index of the first "Personal Integrations"
const firstIntegrations = content.indexOf('<h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>');

if (firstIntegrations !== -1) {
    // Find the end of this block by finding the start of the next section, e.g. "OwnCloud"
    const ownCloudIdx = content.indexOf('<div className="flex flex-row justify-between items-center mb-1"><h5 className="text-[9px] font-bold text-slate-500 uppercase">OwnCloud / NextCloud</h5>', firstIntegrations);
    
    if (ownCloudIdx !== -1) {
        // Now, we want to replace everything between firstIntegrations and ownCloudIdx with a single, clean block
        
        const cleanBlock = `
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
`;
        const pre = content.substring(0, firstIntegrations);
        const post = content.substring(ownCloudIdx);
        content = pre + cleanBlock + post;
        fs.writeFileSync('src/components/Settings.tsx', content);
    }
}
