const fs = require('fs');

let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const importSupabase = `import { supabase } from '../lib/supabase';\n`;
if (!content.includes(importSupabase)) {
  content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\n" + importSupabase);
}

const testFunction = `
  const testTwilioAndSupabase = async () => {
    useAppStore.getState().addToast("Testing backend Integrations...", "info");
    try {
      const functionUrl = import.meta.env.VITE_SUPABASE_URL 
        ? \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sos\`
        : 'https://oirbmgpfqxojshfoguzo.supabase.co/functions/v1/send-sos';
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${session?.access_token || 'anon'}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          user_id: session?.user?.id || 'test-user-123', 
          lat: -26.1912, 
          lng: 28.0264,
          isTest: true
        })
      });
      if (res.ok) {
        useAppStore.getState().addToast("Backend test successful! Check SMS.", "success");
      } else {
        useAppStore.getState().addToast("Backend returned an error.", "error");
      }
    } catch(e: any) {
      useAppStore.getState().addToast("Failed to hit backend: " + e.message, "error");
    }
  };
`;

if (!content.includes('testTwilioAndSupabase')) {
  // Insert inside Settings component
  content = content.replace("const { t } = useLanguage();", "const { t } = useLanguage();\n" + testFunction);
}

const testButton = `
                <button
                  type="button"
                  onClick={testTwilioAndSupabase}
                  className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all"
                >
                  📡 Test Twilio & Supabase Edge
                </button>
`;

// Insert the test button after the Twilio inputs
content = content.replace(/(<input type="text" value=\{twilioFromNumber\}[^>]*>\s*<\/div>)/g, "$1\n" + testButton);

fs.writeFileSync('src/components/Settings.tsx', content);
