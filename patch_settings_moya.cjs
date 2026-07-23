const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const moyaState = `
  const [turnApiToken, setTurnApiToken] = useState('');
  const [moyaEnabled, setMoyaEnabled] = useState(false);
`;
if (!content.includes('turnApiToken')) {
  content = content.replace("const [twilioFromNumber, setTwilioFromNumber] = useState(currentUser.twilioFromNumber || '');", "const [twilioFromNumber, setTwilioFromNumber] = useState(currentUser.twilioFromNumber || '');\n" + moyaState);
}

const saveCredentialsFn = `
  const connectService = async (serviceName: 'turn' | 'twilio') => {
    useAppStore.getState().addToast(\`Connecting \${serviceName}...\`, "info");
    try {
      const functionUrl = import.meta.env.VITE_SUPABASE_URL 
        ? \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-service\`
        : 'https://oirbmgpfqxojshfoguzo.supabase.co/functions/v1/setup-service';
      
      const { data: { session } } = await supabase.auth.getSession();
      
      let credentials = {};
      if (serviceName === 'turn') {
        credentials = { api_token: turnApiToken, moya_enabled: moyaEnabled };
      } else {
        credentials = { account_sid: twilioAccountSid, auth_token: twilioAuthToken, from_number: twilioFromNumber };
      }

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${session?.access_token || 'anon'}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service: serviceName, credentials })
      });
      
      if (res.ok) {
        useAppStore.getState().addToast(\`\${serviceName.toUpperCase()} connected successfully!\`, "success");
      } else {
        const errorData = await res.json();
        useAppStore.getState().addToast(\`Failed to connect \${serviceName}: \${errorData.error}\`, "error");
      }
    } catch(e: any) {
      useAppStore.getState().addToast("Connection failed: " + e.message, "error");
    }
  };
`;
if (!content.includes('connectService')) {
  content = content.replace("const testTwilioAndSupabase = async () => {", saveCredentialsFn + "\n  const testTwilioAndSupabase = async () => {");
}

const moyaUI = `
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
`;

// There are three places Personal Integrations are rendered (due to the different tab states possibly, or repeated code)
// We will replace `<div className="space-y-3">\n                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>`
// with MoyaUI + Twilio + Twilio connect button.

const twilioConnectBtn = `
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
`;

// We just replace the Twilio title with Moya UI then Twilio title. And add connect button under Twilio From Number input.
content = content.replace(/<div className="space-y-3">\s*<h5 className="text-\[9px\] font-bold text-slate-500 uppercase">Twilio \(Voice\/SMS\)<\/h5>/g, moyaUI + '                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>');

content = content.replace(/(<input type="text" value=\{twilioFromNumber\}[^>]*>)/g, "$1\n" + twilioConnectBtn);

fs.writeFileSync('src/components/Settings.tsx', content);
