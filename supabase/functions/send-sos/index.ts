import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')!

serve(async (req) => {
  const { user_id, lat, lng, isTest, name = 'User' } = await req.json()
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  const locationUrl = `https://maps.google.com/?q=${lat},${lng}`
  const message = isTest 
    ? `🧪 SAFETYLINK SYSTEM TEST: Your Twilio & Supabase integration is correctly configured.` 
    : `🚨 SAFETYLINK SOS: ${name} needs help. ${locationUrl}`

  const { data: creds } = await supabase.from('user_credentials').select('*').eq('user_id', user_id).single()
  const { data: iceContacts } = await supabase.from('ice_contacts').select('*').eq('user_id', user_id)
  const { data: emergencyContacts } = await supabase.from('emergency_contacts').select('*').eq('user_id', user_id)
  
  // Combine contacts for redundancy (using both new ice_contacts and existing emergency_contacts)
  const allContacts = [...(iceContacts || []), ...(emergencyContacts || [])].filter(c => c.phone)

  if (!isTest) {
    await supabase.from('sos_events').insert({ user_id, lat, lng })
  }

  if (!creds) {
    return new Response(JSON.stringify({ error: 'No user credentials configured' }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  // 1. Moya / Turn.io
  if (creds.moya_enabled && creds.api_token) {
    let sentCount = 0
    for (const c of allContacts) {
      const res = await fetch('https://turn.io/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.api_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to: c.phone, type: 'text', text: { body: message } })
      })
      if (res.ok) sentCount++
    }
    if (sentCount > 0) return new Response(JSON.stringify({ via: 'moya', success: true }), { headers: { "Content-Type": "application/json" } })
  }

  // 2. Twilio SMS
  if (creds.account_sid && creds.auth_token && creds.from_number) {
    let sentCount = 0
    for (const c of allContacts) {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ To: c.phone, From: creds.from_number, Body: message })
      })
      if (res.ok) sentCount++
    }
    if (sentCount > 0) return new Response(JSON.stringify({ via: 'sms', success: true }), { headers: { "Content-Type": "application/json" } })
    
    // 3. Twilio Voice (Fallback)
    let callCount = 0
    for (const c of allContacts) {
      const callRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.account_sid}/Calls.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${creds.account_sid}:${creds.auth_token}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ 
          To: c.phone, 
          From: creds.from_number, 
          Twiml: `<Response><Say>SafetyLink Alert. ${name} requires emergency assistance. Please check the SMS for location details.</Say></Response>` 
        })
      })
      if (callRes.ok) callCount++
    }
    if (callCount > 0) return new Response(JSON.stringify({ via: 'voice', success: true }), { headers: { "Content-Type": "application/json" } })
  }

  return new Response(JSON.stringify({ error: 'All notification strategies failed', success: false }), { headers: { "Content-Type": "application/json" } })
})
