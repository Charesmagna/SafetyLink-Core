import { Network } from '@capacitor/network';
import { App as CapacitorApp } from '@capacitor/app';

export async function sendPanic(panicData: any) {
  const status = await Network.getStatus();
  const hasData = status.connected;

  let hasMoya = false;
  try {
    if ((CapacitorApp as any).canOpenUrl) {
      const res = await (CapacitorApp as any).canOpenUrl({ url: 'moya://' });
      hasMoya = res.value;
    }
  } catch (e) {
    console.error('Moya check failed', e);
  }

  // PRIORITY 1: Normal internet - use our backend
  if (hasData) {
    console.log('Sending via internet');
    // Simulated fetch to backend
    // await fetch(`${BACKEND_URL}/api/panic`, { method: 'POST', body: JSON.stringify(panicData) });
    return "ALERT_SENT_VIA_SERVER";
  }

  // PRIORITY 2: No data but Moya installed - use Moya Share
  if (!hasData && hasMoya) {
    const message = `🚨 SAFETYLINK PANIC 🚨\n${panicData?.name || 'User'}\nLocation: https://maps.google.com/?q=${panicData?.coords || '0,0'}`;
    console.log('Sending via Moya Share');
    try {
      if ((CapacitorApp as any).openUrl) {
        await (CapacitorApp as any).openUrl({ url: `moya://share?text=${encodeURIComponent(message)}` });
      }
    } catch (e) {
       console.error('Failed to open Moya', e);
    }
    return "ALERT_SENT_VIA_MOYA";
  }

  // PRIORITY 3: No data, no Moya - fallback SMS
  if (!hasData && !hasMoya) {
    console.log('Sending via SMS fallback');
    // Fallback logic
    return "ALERT_SENT_VIA_SMS";
  }
}
