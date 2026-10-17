import { Capacitor } from '@capacitor/core';
import { NativeDispatchService } from './NativeDispatchService';

const GATEWAY_CACHE = 'sl_pcm_gateway';
const DEFAULT_GATEWAY = '0816738186';
const API = 'https://api.safetylink.online';

export interface UssdResolveOptions {
  carrierPreset?: 'AUTO' | 'MTN' | 'VODACOM' | 'CELL_C' | 'TELKOM' | 'CUSTOM';
  customPattern?: string;
  gatewayNumber?: string;
  detectedCarrier?: string;
}

/** Formats an E.164 or international number into the local 10-digit format (0XXXXXXXXX) */
export function formatLocalMsisdn(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) {
    return '0' + digits.slice(2);
  }
  return digits.length === 9 && !digits.startsWith('0') ? '0' + digits : digits || DEFAULT_GATEWAY;
}

/**
 * Resolves the exact USSD Please-Call-Me string based on user configuration or detected SIM carrier.
 */
export function resolveUssdCode(options: UssdResolveOptions = {}): string {
  const { carrierPreset = 'AUTO', customPattern = '*140*{NUMBER}#', gatewayNumber = DEFAULT_GATEWAY, detectedCarrier = '' } = options;
  const local = formatLocalMsisdn(gatewayNumber);

  switch (carrierPreset) {
    case 'MTN':
      // MTN Please Call Me is *121*<number>#
      return `*121*${local}#`;
    case 'VODACOM':
      // Vodacom Please Call Me is *140*<number>#
      return `*140*${local}#`;
    case 'CELL_C':
      // Cell C Please Call Me is *111*<number>#
      return `*111*${local}#`;
    case 'TELKOM':
      // Telkom Mobile Please Call Me is *140*<number>#
      return `*140*${local}#`;
    case 'CUSTOM': {
      if (customPattern && (customPattern.includes('{NUMBER}') || customPattern.includes('{PHONE}'))) {
        return customPattern.replace(/\{NUMBER\}/g, local).replace(/\{PHONE\}/g, local).trim();
      }
      return customPattern ? customPattern.trim() : `*140*${local}#`;
    }
    case 'AUTO':
    default: {
      const c = (detectedCarrier || '').toLowerCase();
      if (c.includes('mtn')) return `*121*${local}#`;
      if (c.includes('cell')) return `*111*${local}#`;
      return `*140*${local}#`;
    }
  }
}

/** Legacy alias for backward compatibility */
export function pcmUssd(carrier: string, gatewayE164: string): string {
  return resolveUssdCode({ carrierPreset: 'AUTO', detectedCarrier: carrier, gatewayNumber: gatewayE164 });
}

export async function cachedGateway(): Promise<string> {
  let gateway = '';
  try { gateway = localStorage.getItem(GATEWAY_CACHE) || ''; } catch { /* private mode */ }
  if (gateway) return gateway;
  try {
    const res = await fetch(API + '/api/pcm/gateway');
    const json = await res.json();
    if (json?.number) {
      gateway = String(json.number);
      try { localStorage.setItem(GATEWAY_CACHE, gateway); } catch { /* ignore */ }
    }
  } catch { /* offline */ }
  return gateway || DEFAULT_GATEWAY;
}

/**
 * Dials the carrier Please Call Me USSD code.
 * Executes natively on Android via Android Telecom or simulates in browser.
 */
export async function firePleaseCallMe(explicitCode?: string, options?: UssdResolveOptions): Promise<{ success: boolean; code: string; error?: string }> {
  let code = explicitCode;
  if (!code) {
    let detectedCarrier = options?.detectedCarrier || '';
    if (Capacitor.isNativePlatform() && !detectedCarrier) {
      try {
        const sims = await NativeDispatchService.getSimCards();
        const preferred = sims.sims.find(s => s.subscriptionId === sims.preferredSubscriptionId) || sims.sims[0];
        detectedCarrier = preferred?.carrier || '';
      } catch (err) {
        console.warn('[pcmTrigger] SIM query note:', err);
      }
    }
    const gateway = options?.gatewayNumber || await cachedGateway();
    code = resolveUssdCode({
      ...options,
      detectedCarrier,
      gatewayNumber: gateway
    });
  }

  const res = await NativeDispatchService.sendUssd(code);
  return { success: !!res.success, code, error: res.error };
}

/** Attach GPS to an alert that the Please Call Me already opened. Does not place another call. */
export async function postPanicLocation(phone: string, lat: number, lng: number): Promise<void> {
  if (!phone || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
  try {
    await fetch(API + '/api/pcm/locate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, lat, lng }),
    });
  } catch (e) {
    console.warn('[pcmTrigger] Failed to post panic location to gateway:', e);
  }
}
