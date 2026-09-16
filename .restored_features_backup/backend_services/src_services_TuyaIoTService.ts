import { useAppStore } from '../utils/store';

export class TuyaIoTService {
  private static instance: TuyaIoTService;
  
  private clientId: string;
  private secret: string;
  private accessToken: string;
  private baseUrl: string;

  private constructor() {
    const storeConfig = useAppStore.getState().tuyaConfig;
    this.clientId = storeConfig?.clientId || import.meta.env.VITE_TUYA_CLIENT_ID || 'dummy_client_id';
    this.secret = storeConfig?.secret || import.meta.env.VITE_TUYA_SECRET || 'dummy_secret';
    this.accessToken = import.meta.env.VITE_TUYA_ACCESS_TOKEN || '';
    this.baseUrl = storeConfig?.baseUrl || import.meta.env.VITE_TUYA_BASE_URL || 'https://openapi.tuyaeu.com';
  }

  public static getInstance(): TuyaIoTService {
    if (!TuyaIoTService.instance) {
      TuyaIoTService.instance = new TuyaIoTService();
    }
    return TuyaIoTService.instance;
  }
  
  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getSignature(timestamp: string, method: string, url: string, body: string = ''): Promise<string> {
    const bodyHash = await this.sha256(body);
    const signStr = `${this.clientId}${this.accessToken}${timestamp}${method}\n${bodyHash}\n\n${url}`;
    
    const signature = await this.hmacSha256(signStr, this.secret);
    return signature.toUpperCase();
  }

  public async request(method: string, url: string, body?: any) {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = await this.getSignature(timestamp, method, url, bodyStr);

    const headers: Record<string, string> = {
      'client_id': this.clientId,
      'sign': signature,
      't': timestamp,
      'sign_method': 'HMAC-SHA256',
    };
    
    if (this.accessToken) {
      headers['access_token'] = this.accessToken;
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers,
      body: body ? bodyStr : undefined,
    });

    return response.json();
  }

  // Example functionality: Triggering a smart lock or alarm
  public async triggerDevice(deviceId: string, commands: any[]) {
    return this.request('POST', `/v1.0/devices/${deviceId}/commands`, { commands });
  }
}

export const tuyaIoTService = TuyaIoTService.getInstance();
