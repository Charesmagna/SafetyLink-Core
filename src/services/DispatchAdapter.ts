/**
 * SafetyLink Dispatch Adapter
 * Abstracts SMS/Voice dispatch so the provider (Cloudflare Worker,
 * Firebase Function, Server, etc.) can be swapped if needed.
 */
import { TwilioService } from './TwilioService';

export interface DispatchProvider {
  sendSms(from: string, to: string, body: string): Promise<boolean>;
  triggerCall(from: string, to: string, lat: number, lng: number, desc: string): Promise<boolean>;
}

/** Proxy provider - default path via our server proxy */
class ProxyDispatchProvider implements DispatchProvider {
  async sendSms(from: string, to: string, body: string): Promise<boolean> {
    return TwilioService.sendSms('', '', from, to, body);
  }
  async triggerCall(from: string, to: string, lat: number, lng: number, desc: string): Promise<boolean> {
    return TwilioService.triggerVoiceCall('', '', from, to, lat, lng, desc);
  }
}

export function createDispatchProvider(): DispatchProvider {
  return new ProxyDispatchProvider();
}
