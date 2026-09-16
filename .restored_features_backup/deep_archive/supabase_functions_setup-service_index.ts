import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

serve(async (req) => {
  const { service, credentials } = await req.json()
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } })
  }

  // TODO: Actual API verification could be added here

  const credsData = {
    user_id: user.id,
    service: service,
    account_sid: credentials.account_sid || null,
    auth_token: credentials.auth_token || null,
    from_number: credentials.from_number || null,
    api_token: credentials.api_token || null,
    moya_enabled: credentials.moya_enabled || false
  }

  const { error } = await supabase.from('user_credentials').upsert(credsData)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
})
