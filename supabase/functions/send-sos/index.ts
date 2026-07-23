import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!
const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE')!

serve(async (req) => {
  const { user_id, lat, lng } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const locationUrl = `https://maps.google.com/?q=${lat},${lng}`
  const message = `🚨 EMERGENCY! User needs help. Location: ${locationUrl}`
  
  const { data: contacts } = await supabase.from('emergency_contacts').select('*').eq('user_id', user_id)
  
  if (contacts) {
    for (const c of contacts.filter((x: any) => x.enable_sms)) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, { 
        method: 'POST', 
        headers: { 
          'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        }, 
        body: new URLSearchParams({ To: c.phone, From: TWILIO_PHONE, Body: message }) 
      })
    }
  }
  
  await supabase.from('sos_events').insert({ user_id, lat, lng })
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
})
