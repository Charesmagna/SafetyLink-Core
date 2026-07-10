/**
 * SafetyLink Dispatch Adapter
 * Abstracts SMS/Voice dispatch so the provider (direct Twilio, Cloudflare Worker,
 * Firebase Function, etc.) can be swapped by changing VITE_DISPATCH_PROVIDER only.
 */

export interface DispatchProvider {
  sendSms(from: string, to: string, body: string): Promise<boolean>;
  triggerCall(from: string, to: string, lat: number, lng: number, desc: string): Promise<boolean>;
}

/** Direct Twilio — current default */
class DirectTwilioProvider implements DispatchProvider {
  constructor(
    private accountSid: string,
    private authToken: string
  ) {}

  async sendSms(from: string, to: string, body: string): Promise<boolean> {
    const { TwilioService } = await import('./TwilioService');
    return TwilioService.sendSms(this.accountSid, this.authToken, from, to, body);
  }

  async triggerCall(from: string, to: string, lat: number, lng: number, desc: string): Promise<boolean> {
    const { TwilioService } = await import('./TwilioService');
    return TwilioService.triggerVoiceCall(this.accountSid, this.authToken, from, to, lat, lng, desc);
  }
}

/** Proxy provider — swap endpoint via env var for Cloudflare/Vercel/Firebase */
class ProxyDispatchProvider implements DispatchProvider {
  private endpoint = import.meta.env.VITE_DISPATCH_PROXY_URL ?? '';

  async sendSms(from: string, to: string, body: string): Promise<boolean> {
    const r = await fetch(`${this.endpoint}/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, body })
    });
    return r.ok;
  }

  async triggerCall(from: string, to: string, lat: number, lng: number, desc: string): Promise<boolean> {
    const r = await fetch(`${this.endpoint}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, lat, lng, desc })
    });
    return r.ok;
  }
}

export function createDispatchProvider(accountSid: string, authToken: string): DispatchProvider {
  const provider = import.meta.env.VITE_DISPATCH_PROVIDER ?? 'direct';
  if (provider === 'proxy') return new ProxyDispatchProvider();
  return new DirectTwilioProvider(accountSid, authToken);
}
