const fs = require('fs');

let content = fs.readFileSync('src/services/panicRouter.ts', 'utf8');

const importSupabase = `import { supabase } from '../lib/supabase';\n`;
if (!content.includes(importSupabase)) {
  content = importSupabase + content;
}

const supabaseLogic = `
  // SUPABASE EDGE FUNCTION
  if (hasData) {
    console.log('Attempting Supabase Edge Function');
    try {
      const functionUrl = import.meta.env.VITE_SUPABASE_URL 
        ? \`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sos\`
        : 'https://oirbmgpfqxojshfoguzo.supabase.co/functions/v1/send-sos';
        
      // For now, pass a dummy access token if we don't have a logged-in user in supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${session.access_token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_id: session.user.id, lat: panicData.lat, lng: panicData.lng })
        });
      }
    } catch (e) {
      console.warn("Supabase edge function failed", e);
    }
  }
`;

if (!content.includes('Attempting Supabase Edge Function')) {
  content = content.replace("// PRIORITY 4: User's linked servers", supabaseLogic + "\n  // PRIORITY 4: User's linked servers");
}

fs.writeFileSync('src/services/panicRouter.ts', content);
