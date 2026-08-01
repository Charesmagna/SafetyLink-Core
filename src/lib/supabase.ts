import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oirbmgpfqxojshfoguzo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if we have a valid-looking key (real keys are 100+ chars)
let _client: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      if (supabaseAnonKey.length > 50) {
        try {
          _client = createClient(supabaseUrl, supabaseAnonKey);
        } catch {
          // Supabase unavailable — SOS cloud dispatch will fall back to local
        }
      }
    }
    if (!_client) {
      // Return a safe no-op for any property access
      if (prop === 'auth') return { getSession: async () => ({ data: { session: null } }) };
      return async () => ({ data: null, error: new Error('Supabase not configured') });
    }
    return (_client as any)[prop];
  }
});
