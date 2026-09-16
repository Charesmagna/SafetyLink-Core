import { env } from '../../config/env';

export async function sendVapiCall(to: string, contactName: string, incident: any, locationDescription: string) {
  if (!env.VAPI_PRIVATE_KEY || !env.VAPI_ASSISTANT_ID || !env.VAPI_PHONE_NUMBER_ID) {
    console.error('VAPI configuration missing, skipping voice call');
    return;
  }

  const payload = {
    assistantId: env.VAPI_ASSISTANT_ID,
    phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
    customer: {
      number: to,
      name: contactName
    },
    assistantOverrides: {
      variableValues: {
        incidentId: incident.id,
        personName: incident.name,
        locationDescription,
        locationSource: "System",
        triggeredAt: incident.created_at,
        responseCentreNumber: env.RESPONSE_CENTRE_NUMBER
      }
    }
  };

  try {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`VAPI call failed: ${response.status} ${err}`);
      return;
    }
    
    console.log(`VAPI call dispatched to ${to}`);
  } catch (error) {
    console.error('Error dispatching VAPI call:', error);
  }
}
