/**
 * TwilioService
 * 
 * Secure, client-side direct API gateway for Twilio Cloud SMS and Voice Dispatch.
 * Integrates directly with Twilio REST APIs to initiate calls and send SMS
 * when an organization has configured their Twilio Account SID and Auth Token.
 */
export const TwilioService = {
  sendSms: async (
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    message: string
  ): Promise<boolean> => {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = btoa(`${accountSid}:${authToken}`);
      const body = new URLSearchParams();
      body.append('To', toNumber);
      body.append('From', fromNumber);
      body.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Twilio SMS API Error:', errText);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Twilio SMS network error:', e);
      return false;
    }
  },

  triggerVoiceCall: async (
    accountSid: string,
    authToken: string,
    fromNumber: string,
    toNumber: string,
    lat: number,
    lng: number,
    description: string
  ): Promise<boolean> => {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
      const auth = btoa(`${accountSid}:${authToken}`);
      const body = new URLSearchParams();
      body.append('To', toNumber);
      body.append('From', fromNumber);

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Emergency alert from Safety Link. A distress panic signal has been activated. Reason: ${description}. High accuracy coordinates are Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}. Immediate dispatch is required.</Say>
  <Pause length="1"/>
  <Say voice="alice">Repeating coordinates. Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}. Safety Link dispatch completed.</Say>
</Response>`;

      body.append('Twiml', twiml);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Twilio Voice API Error:', errText);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Twilio Voice network error:', e);
      return false;
    }
  }
};
