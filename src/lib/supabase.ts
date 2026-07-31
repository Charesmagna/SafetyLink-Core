import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oirbmgpfqxojshfoguzo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'XC8TtJsb1NefWm63';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
