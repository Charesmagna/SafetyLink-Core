import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

serve(async (req) => {
  const { user_id, message } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: creds } = await supabase.from('user_credentials').select('*').eq('user_id', user_id).single()
  const { data: contacts } = await supabase.from('ice_contacts').select('*').eq('user_id', user_id)

  if (!creds || !creds.account_sid || !creds.auth_token || !creds.from_number || !contacts) {
     return new Response(JSON.stringify({ error: 'Missing creds or contacts' }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  let count = 0
  for (const c of contacts) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: c.phone,
        From: creds.from_number,
        Body: message
      })
    })
    if (res.ok) count++
  }

  return new Response(JSON.stringify({ count }), { headers: { "Content-Type": "application/json" } })
})
