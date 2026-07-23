const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const stateBlock = `
  const [tbEnabled, setTbEnabled] = useState(currentUser?.sensorStream?.enabled || false);
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

if (!content.includes('turnApiToken')) {
  content = content.replace("  const [tbEnabled, setTbEnabled] = useState(currentUser?.sensorStream?.enabled || false);", stateBlock);
}

// Ensure the profile update saves Moya settings too
if (!content.includes('moya: {')) {
  content = content.replace("twilio: { accountSid: twilioAccountSid, authToken: twilioAuthToken, fromNumber: twilioFromNumber },", "twilio: { accountSid: twilioAccountSid, authToken: twilioAuthToken, fromNumber: twilioFromNumber },\n                    moya: { turnApiToken, enabled: moyaEnabled },");
}


// Replace the Twilio block in all occurrences
const originalTwilioBlock = `<h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />`;

const newTwilioAndMoyaBlock = `<div className="flex justify-between items-center mb-1">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase">Moya / Turn.io</h5>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={moyaEnabled} onChange={e => setMoyaEnabled(e.target.checked)} className="accent-blue-500" />
                  </label>
                </div>
                <input type="text" value={turnApiToken} onChange={e => setTurnApiToken(e.target.value)} placeholder="Turn.io API Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('turn')} className="w-full mt-1 mb-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Moya
                </button>
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
                <button type="button" onClick={testTwilioAndSupabase} className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  📡 Test Integrations
                </button>`;

content = content.split(originalTwilioBlock).join(newTwilioAndMoyaBlock);

fs.writeFileSync('src/components/Settings.tsx', content);
