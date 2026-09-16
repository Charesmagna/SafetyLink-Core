import { supabase } from '../lib/supabase'

export async function triggerSOS(user: any, access_token: string) {
  if (!navigator.geolocation) return alert('Location not supported')
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`
    const message = `🚨 EMERGENCY! I need help. Location: ${locationUrl}`
    
    const { data: contacts } = await supabase.from('emergency_contacts').select('*').eq('user_id', user.id)
    
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sos`, { 
      method: 'POST', 
      headers: { 
        'Authorization': `Bearer ${access_token}`, 
        'Content-Type': 'application/json' 
      }, 
      body: JSON.stringify({ user_id: user.id, lat: latitude, lng: longitude }) 
    })
    
    contacts?.filter(c => c.enable_sms).forEach(c => { window.location.href = `sms:${c.phone}?body=${encodeURIComponent(message)}` })
    
    if (contacts?.[0]) { 
      window.location.href = `tel:${contacts[0].phone}`; 
      setTimeout(() => {
        if (contacts[1]) window.location.href = `tel:${contacts[1].phone}`
      }, 10000) 
    }
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    window.open(`moya://compose?text=${encodeURIComponent(message)}`, '_blank')
  })
}
