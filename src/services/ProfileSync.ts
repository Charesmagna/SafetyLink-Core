import { useAppStore } from '../utils/store';

const TOKEN_KEY = 'sl_profile_token';
const FCM_TOKEN_KEY = 'sl_fcm_token';
const DEFAULT_BACKEND = 'https://api.safetylink.online';
const FALLBACK_BACKEND = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';
const DEAD_BACKEND_HOST = 'd089bef8b0b58c5d9506b512ec2f63dc.workers.dev';
const DEFAULT_RAIN_GATEWAY = '0816738186';
let lastSig = '';
let cachedRainGateway = DEFAULT_RAIN_GATEWAY;
let lastGatewayFetchAt = 0;

function resolveProfileSyncBackends(customUrl?: string): string[] {
  const candidates: string[] = [];
  const raw = String(customUrl || '').trim().replace(/\/$/, '');
  if (raw && !raw.includes(DEAD_BACKEND_HOST)) {
    candidates.push(raw);
  }
  if (!candidates.includes(DEFAULT_BACKEND)) candidates.push(DEFAULT_BACKEND);
  if (!candidates.includes(FALLBACK_BACKEND)) candidates.push(FALLBACK_BACKEND);
  return candidates;
}

async function resolveRainGatewayNumber(backends: string[], fallback?: string): Promise<string> {
  const configured = String(fallback || '').trim();
  if (configured) cachedRainGateway = configured;
  if (Date.now() - lastGatewayFetchAt < 15 * 60_000) return cachedRainGateway;
  lastGatewayFetchAt = Date.now();
  for (const backend of backends) {
    try {
      const res = await fetch(`${backend}/api/pcm/gateway`);
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.number === 'string' && data.number.trim()) {
        // Convert +27816738186 to local 0816738186 for SA USSD *140*081...#
        const clean = data.number.trim().replace(/[\s-]/g, '');
        cachedRainGateway = clean.startsWith('+27') && clean.length === 12
          ? '0' + clean.slice(3)
          : clean;
        return cachedRainGateway;
      }
    } catch {
      // try next backend
    }
  }
  return cachedRainGateway;
}

/**
 * Registers this device's cached FCM token to SafetyLink backend(s) for a given phone number.
 * Ensures emergency contacts who install SafetyLink receive loud FCM rings immediately after login.
 */
export async function syncDeviceFcmToken(phone: string, fcmToken?: string, profileToken?: string): Promise<boolean> {
  const cleanPhone = String(phone || '').trim();
  const token = String(fcmToken || localStorage.getItem(FCM_TOKEN_KEY) || '').trim();
  if (!cleanPhone || token.length < 20) return false;

  const s: any = useAppStore.getState();
  const pTok = String(profileToken || localStorage.getItem(TOKEN_KEY) || '').trim();
  for (const backend of resolveProfileSyncBackends(s.customBackendUrl)) {
    try {
      const res = await fetch(`${backend}/api/device/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pTok ? { 'X-Profile-Token': pTok } : {}),
        },
        body: JSON.stringify({ phone: cleanPhone, token }),
      });
      if (res.ok) return true;
    } catch {
      // try next backend
    }
  }
  return false;
}

/**
 * Saves who the user is, their emergency contacts, Rain PCM gateway settings, FCM device token,
 * and last known location on the SafetyLink server and native Android SharedPreferences.
 * This enables zero-airtime Please Call Me -> Rain SIM -> Server -> FCM loud contact ringing.
 */
export async function syncProfile(force = false): Promise<boolean> {
  const s: any = useAppStore.getState();
  const user = s.currentUser;
  const org = s.currentOrg;
  if ((!user?.phone && !org?.controlRoomNumber) || s.demoMode || user?.isDemo) return false;

  const effectivePhone = user?.phone || org?.controlRoomNumber || '';
  const effectiveName = user?.fullName || user?.username || org?.contactName || org?.name || 'SafetyLink User';
  const effectiveOrgCode = user?.orgCode || org?.id || 'INDIVIDUAL';
  const effectiveUserId = user?.id || org?.id || '';
  const loc = s.userLocation;
  const alertNote = String(user?.alertNote || '').trim().slice(0, 140);
  const contacts = (s.contacts || [])
    .slice(0, 15)
    .map((c: any) => ({ name: c.name || c.label || 'Emergency Contact', phone: c.phone }));
  const ds = s.dispatchSettings || {};

  const backends = resolveProfileSyncBackends(s.customBackendUrl);
  const rainGateway = await resolveRainGatewayNumber(backends, ds.pcmGatewayNumber || DEFAULT_RAIN_GATEWAY);

  const sig = JSON.stringify([
    effectivePhone,
    effectiveName,
    effectiveOrgCode,
    contacts,
    alertNote,
    rainGateway,
    ds.ussdEnabled !== false,
    ds.offlineUssdMode || 'RAIN_PCM',
    ds.pcmCooldownMinutes ?? 5,
    typeof s.sosCountdownDuration === 'number' ? s.sosCountdownDuration : 10,
    loc ? Math.round(loc.lat * 1000) : 0,
    loc ? Math.round(loc.lng * 1000) : 0,
  ]);
  if (!force && sig === lastSig) return true;

  // Always update native SharedPreferences first so hardware & zero-airtime PCM triggers work even offline
  try {
    const { NativeDispatchService } = await import('./NativeDispatchService');
    await NativeDispatchService.saveNativeProfile({
      name: effectiveName,
      phone: effectivePhone,
      alertNote,
      orgCode: effectiveOrgCode,
      orgId: effectiveOrgCode,
      userId: effectiveUserId,
      lat: loc?.lat,
      lng: loc?.lng,
      ussdEnabled: ds.ussdEnabled !== false,
      pcmGateway: rainGateway,
      offlineUssdMode: ds.offlineUssdMode || 'RAIN_PCM',
      reverseChargePrefix: ds.reverseChargePrefix || '127',
      pcmCooldownMinutes: typeof ds.pcmCooldownMinutes === 'number' ? ds.pcmCooldownMinutes : 5,
      userPin: s.userPin || '',
      duressPin: s.duressPin || '',
      sosCountdownSeconds: typeof s.sosCountdownDuration === 'number' ? s.sosCountdownDuration : 10,
      contacts: (s.contacts || []).map((c: any) => ({
        name: c.name || c.label || 'Emergency Contact',
        phone: c.phone,
        sms: c.sms !== false,
        call: Boolean(c.call || c.priorityCall || c.priority),
      })),
    });
  } catch { /* native bridge not available on web */ }

  if (!effectivePhone) return false;

  const token = localStorage.getItem(TOKEN_KEY) || '';
  let syncAccepted = false;
  let savedToken = token;

  // Register push identity on native immediately (even before /api/profile/sync responds)
  try {
    const { SafetyLinkEmergency } = await import('./NativeDispatchService');
    await SafetyLinkEmergency.savePushIdentity({ phone: effectivePhone, profileToken: savedToken });
  } catch { /* native bridge not available on web */ }

  for (const backend of backends) {
    try {
      const res = await fetch(`${backend}/api/profile/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Profile-Token': token } : {}) },
        body: JSON.stringify({
          phone: effectivePhone,
          name: effectiveName,
          orgCode: effectiveOrgCode,
          contacts,
          alertNote,
          lat: loc?.lat,
          lng: loc?.lng,
        }),
      });
      const j: any = await res.json().catch(() => ({}));
      const ok = res.ok && j.ok === true && typeof (j.token || token) === 'string' && Boolean(j.token || token);
      if (ok) {
        syncAccepted = true;
        if (j.token) {
          savedToken = j.token;
          localStorage.setItem(TOKEN_KEY, j.token);
        }
        break;
      }
      console.warn('[ProfileSync] backend rejected sync:', {
        backend,
        status: res.status,
        error: String(j.error || 'invalid sync response').slice(0, 100),
      });
    } catch {
      // Try next backend candidate
    }
  }

  // Re-sync native PushRegistrar with updated profileToken AND push cached WebView FCM token if available
  try {
    const { SafetyLinkEmergency } = await import('./NativeDispatchService');
    await SafetyLinkEmergency.savePushIdentity({ phone: effectivePhone, profileToken: savedToken });
  } catch { /* native bridge not available on web */ }

  await syncDeviceFcmToken(effectivePhone, undefined, savedToken).catch(() => {});

  // Pull any incoming 2-way QR mutual contacts added while this app was closed/locked
  for (const backend of backends) {
    try {
      const incRes = await fetch(`${backend}/api/link/incoming?phone=${encodeURIComponent(effectivePhone)}&ack=1`);
      const incData: any = await incRes.json().catch(() => ({}));
      if (incRes.ok && Array.isArray(incData.links) && incData.links.length > 0) {
        const curContacts = useAppStore.getState().contacts || [];
        const normDigits = (p: string) => String(p || '').replace(/[^0-9]/g, '').replace(/^0(?=\d{9}$)/, '27');
        let added = 0;
        for (const item of incData.links) {
          if (!item?.phone) continue;
          const targetKey = normDigits(item.phone);
          if (curContacts.some((c: any) => normDigits(c.phone) === targetKey)) continue;
          useAppStore.getState().addContact({
            label: item.name || 'SafetyLink Contact',
            name: item.name || 'SafetyLink Contact',
            phone: item.phone,
            relation: 'QR Mutual Emergency Contact',
            channelType: 'CALL',
            hasWhatsApp: true,
            priority: curContacts.length + added + 1,
          });
          added++;
        }
        if (added > 0) {
          useAppStore.getState().addToast(`${added} new 2-way QR emergency contact(s) synced to your device!`, 'success');
        }
      }
      break;
    } catch {
      // try next backend
    }
  }

  if (syncAccepted) lastSig = sig;
  return syncAccepted;
}

let started = false;
export function startProfileSync(): void {
  if (started) return;
  started = true;
  let timer: any = null;
  useAppStore.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(() => { void syncProfile(); }, 3500);
  });
  setInterval(() => { void syncProfile(); }, 5 * 60 * 1000);
  setTimeout(() => { void syncProfile(); }, 3000);
}
