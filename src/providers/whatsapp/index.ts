import { env } from '../../config/env';
import twilio from 'twilio';

let twilioClient: twilio.Twilio | null = null;
const accountSid = env.TWILIO_SID || env.TWILIO_ACCOUNT_SID;
const authToken = env.WHATSAPP_ACCESS_TOKEN || env.TWILIO_AUTH_TOKEN;

if (env.WHATSAPP_PROVIDER === 'twilio' && accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export interface WhatsAppProvider {
  sendPanicAlert(to: string, message: string): Promise<void>;
  getDeliveryStatus(_messageId: string): Promise<string>;
  verifyWebhook(_payload: any, _signature: string): boolean;
}

export class TwilioWhatsAppAdapter implements WhatsAppProvider {
  async sendPanicAlert(to: string, message: string): Promise<void> {
    const fromNumber = env.WHATSAPP_PHONE_NUMBER_ID || env.TWILIO_PHONE_NUMBER;
    if (!twilioClient || !fromNumber) return;
    
    // Normalize and prefix with 'whatsapp:'
    const toWa = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromWa = `whatsapp:${fromNumber}`;
    
    await twilioClient.messages.create({
      from: fromWa,
      to: toWa,
      body: message
    });
  }

  async getDeliveryStatus(_messageId: string): Promise<string> {
    return 'unknown';
  }

  verifyWebhook(_payload: any, _signature: string): boolean {
    return true; // Use twilio.validateRequest in prod
  }
}

export function getWhatsAppAdapter(): WhatsAppProvider {
  if (env.WHATSAPP_PROVIDER === 'twilio') {
    return new TwilioWhatsAppAdapter();
  }
  throw new Error(`Unsupported WhatsApp provider: ${env.WHATSAPP_PROVIDER}`);
}
