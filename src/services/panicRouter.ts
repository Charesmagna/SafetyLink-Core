import { Network } from '@capacitor/network';
import { App as CapacitorApp } from '@capacitor/app';

// 1. Android SMS Manager (Native Intent)
async function sendNativeSMS(phone: string, message: string) {
  try {
    if ((CapacitorApp as any).openUrl) {
      await (CapacitorApp as any).openUrl({ url: `sms:${phone}?body=${encodeURIComponent(message)}` });
      return true;
    }
  } catch (e) {
    console.warn("SMS Intent failed", e);
  }
  return false;
}

// 2. Android Native Call (Native Intent)
async function makeNativeCall(phone: string) {
  try {
    if ((CapacitorApp as any).openUrl) {
      await (CapacitorApp as any).openUrl({ url: `tel:${phone}` });
      return true;
    }
  } catch (e) {
    console.warn("Call Intent failed", e);
  }
  return false;
}

// 3. WhatsApp (Native Intent)
async function sendWhatsApp(phone: string, message: string) {
  try {
    if ((CapacitorApp as any).canOpenUrl) {
      const res = await (CapacitorApp as any).canOpenUrl({ url: 'whatsapp://' });
      if (res.value && (CapacitorApp as any).openUrl) {
        await (CapacitorApp as any).openUrl({ url: `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}` });
        return true;
      }
    }
  } catch (e) {
    console.warn("WhatsApp Intent failed", e);
  }
  return false;
}

export async function sendPanic(panicData: any, contacts: any[], customServerUrl?: string) {
  const status = await Network.getStatus();
  const hasData = status.connected;

  const emergencyPhone = contacts?.[0]?.phone || '+27820000000';
  const message = `🚨 SAFETYLINK PANIC 🚨\nName: ${panicData?.name || 'User'}\nLocation: https://maps.google.com/?q=${panicData?.coords || '0,0'}`;

  // PRIORITY 1: Native Android SMS
  console.log('Attempting Priority 1: Native SMS');
  await sendNativeSMS(emergencyPhone, message);

  // PRIORITY 2: Native Android Call (Optional delay/prompt can be added if needed, but for now we initiate it)
  // We may not want to auto-call immediately after SMS without a delay, but as per request, we initiate.
  console.log('Attempting Priority 2: Native Call');
  await makeNativeCall(emergencyPhone);

  // PRIORITY 3: WhatsApp Offline-First
  console.log('Attempting Priority 3: WhatsApp');
  await sendWhatsApp(emergencyPhone, message);

  // PRIORITY 4: User's linked servers
  if (hasData && customServerUrl) {
    console.log('Attempting Priority 4: Custom Server');
    try {
      await fetch(`${customServerUrl}/api/panic`, { method: 'POST', body: JSON.stringify(panicData) });
    } catch (e) {
      console.warn("Custom server failed", e);
    }
  }

  // PRIORITY 5: Moya App
  let hasMoya = false;
  try {
    if ((CapacitorApp as any).canOpenUrl) {
      const res = await (CapacitorApp as any).canOpenUrl({ url: 'moya://' });
      hasMoya = res.value;
    }
  } catch (e) {
    console.error('Moya check failed', e);
  }

  if (!hasData && hasMoya) {
    console.log('Attempting Priority 5: Moya Share');
    try {
      if ((CapacitorApp as any).openUrl) {
        await (CapacitorApp as any).openUrl({ url: `moya://share?text=${encodeURIComponent(message)}` });
      }
    } catch (e) {
       console.error('Failed to open Moya', e);
    }
  }

  // PRIORITY 6: Offline Fallback (This is handled by the caller/store usually, but we signify it here)
  if (!hasData) {
    console.log('Priority 6: Queued for Offline Fallback');
  }

  // Return completion so Lizzy can be triggered in the UI/Store
  return "ALERT_SEQUENCE_COMPLETED";
}
