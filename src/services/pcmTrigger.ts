import { Capacitor } from '@capacitor/core';
import { NativeDispatchService } from './NativeDispatchService';

const GATEWAY_CACHE = 'sl_pcm_gateway';
const API = 'https://api.safetylink.online';

/** Free Please Call Me codes. The number must be the local 0XXXXXXXXX form. */
export function pcmUssd(carrier: string, gatewayE164: string): string {
  const digits = gatewayE164.replace(/\D/g, '');
  const local = digits.startsWith('27') ? '0' + digits.slice(2) : digits;
  const c = (carrier || '').toLowerCase();
  if (c.includes('mtn')) return `*121*${local}#`;
  if (c.includes('cell')) return `*111*${local}#`;
  return `*140*${local}#`;
}

async function cachedGateway(): Promise<string> {
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
  return gateway;
}

/** Dial the carrier Please Call Me. Returns false if this is not a phone or no Rain number is configured. */
export async function firePleaseCallMe(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const gateway = await cachedGateway();
  if (!gateway) return false;
  const sims = await NativeDispatchService.getSimCards();
  const preferred = sims.sims.find(s => s.subscriptionId === sims.preferredSubscriptionId) || sims.sims[0];
  const code = pcmUssd(preferred?.carrier || '', gateway);
  const res = await NativeDispatchService.sendUssd(code);
  return !!res.success;
}

/** Attach GPS to an alert that the Please Call Me already opened. Does not place another call. */
export async function postPanicLocation(phone: string, lat: number, lng: number): Promise<void> {
  if (!phone || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
  await fetch(API + '/api/pcm/locate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, lat, lng }),
  });
}
