import fs from 'fs';
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

content = content.replace("import { supabase } from '../lib/supabase';", "// import { supabase } from '../lib/supabase';");
fs.writeFileSync('src/components/Settings.tsx', content);
