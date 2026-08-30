const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const sbOld = `const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);`;

const sbNew = `const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock_key';
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);`;

content = content.replace(sbOld, sbNew);
fs.writeFileSync('server.ts', content, 'utf8');
