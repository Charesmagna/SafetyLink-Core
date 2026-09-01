import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

serve(async (req) => {
  const { user_id, message } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: creds } = await supabase.from('user_credentials').select('*').eq('user_id', user_id).single()
  const { data: contacts } = await supabase.from('ice_contacts').select('*').eq('user_id', user_id)

  if (!creds || !creds.api_token || !contacts) {
     return new Response(JSON.stringify({ error: 'Missing creds or contacts' }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  let count = 0
  for (const c of contacts) {
    const res = await fetch('https://turn.io/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: c.phone,
        type: 'text',
        text: { body: message }
      })
    })
    if (res.ok) count++
  }

  return new Response(JSON.stringify({ count }), { headers: { "Content-Type": "application/json" } })
})
