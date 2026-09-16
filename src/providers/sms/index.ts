import twilio from 'twilio';
import { env } from '../../config/env';

let client: twilio.Twilio | null = null;
const accountSid = env.TWILIO_SID || env.TWILIO_ACCOUNT_SID;
if (accountSid && env.TWILIO_AUTH_TOKEN) {
  client = twilio(accountSid, env.TWILIO_AUTH_TOKEN);
}

export async function sendTwilioSms(to: string, body: string) {
  const fromNumber = env.TWILIO_NUMBER || env.TWILIO_PHONE_NUMBER;
  if (!client || !fromNumber) {
    console.error('Twilio configuration missing, skipping SMS');
    return;
  }

  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log(`Twilio SMS dispatched to ${to}`);
  } catch (error) {
    console.error('Error dispatching Twilio SMS:', error);
  }
}
