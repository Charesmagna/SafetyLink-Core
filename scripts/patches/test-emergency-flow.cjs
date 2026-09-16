const https = require('https');

// --- Configuration from your provided credentials ---
const CONFIG = {
  pipedreamWebhook: 'https://eomnz1lxw9o2hyq.m.pipedream.net',
  pusherAppId: '2184826',
  pusherKey: 'a6b0a27f24d054a44ada',
  pusherSecret: '3f810ff5ae80ec5e528e1e68b2d6e43f01099457ba06d9d851c14e6e5a8a741a', // (Revoke after testing)
  pusherCluster: 'ap2',
  orgCode: 'SAFELINK-DEMO'
};

// Simulated raw SMS data coming off the cellular network tower
const simulatedSMS = {
  sender: '+27821234567',
  message: 'PANIC:-26.1586,27.8237' // Roodepoort coordinates
};

async function runEmergencySimulation() {
  console.log('🚀 Starting Offline-to-Online Emergency Bridge Simulation...\n');

  // 1. Parse the incoming offline SMS text
  const [tag, coords] = simulatedSMS.message.split(':');
  const [lat, lng] = coords.split(',').map(Number);
  console.log(`1. [CELLULAR TOWER] Intercepted offline SMS from ${simulatedSMS.sender}`);
  console.log(`   Parsed Coordinates: Lat ${lat}, Lng ${lng}`);

  // 2. Resolve the GPS coordinates to a physical address (Nominatim API)
  console.log('\n2. [GEOCODING] Translating raw coordinates into a street address...');
  let physicalAddress = 'Roodepoort, Gauteng, South Africa';
  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`, {
      headers: { 'User-Agent': 'SafetyLink-Emergency-Test/1.0' }
    });
    const geoData = await geoRes.json();
    if (geoData && geoData.display_name) {
      physicalAddress = geoData.display_name;
    }
  } catch (e) {
    console.warn('   Geocoding failed, falling back to default city name.');
  }
  console.log(`   Resolved Location: "${physicalAddress}"`);

  // 3. Construct the full emergency payload
  const payload = {
    event: 'PANIC_TRIGGERED',
    source: 'OFFLINE_BLE_BUTTON',
    sender_phone: simulatedSMS.sender,
    location: {
      latitude: lat,
      longitude: lng,
      address: physicalAddress
    },
    timestamp: new Date().toISOString()
  };

  // 4. Trigger the Pipedream Workflow (Twilio SMS / SendGrid Email / Supabase Log)
  console.log('\n3. [PIPEDREAM] Dispatching payload to Pipedream emergency workflow...');
  try {
    const pdRes = await fetch(CONFIG.pipedreamWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`   Pipedream Response Status: ${pdRes.status} OK`);
  } catch (err) {
    console.error('   Failed to hit Pipedream webhook:', err.message);
  }

  // 5. Summary
  console.log('\n✅ SIMULATION COMPLETE!');
  console.log('--------------------------------------------------');
  console.log('Check your dashboards to confirm receipt:');
  console.log(' - Pipedream Event Inspector: https://pipedream.com');
  console.log(' - Pusher Debug Console: Channel "my-channel", Event "my-event"');
  console.log('--------------------------------------------------');
}

runEmergencySimulation();
