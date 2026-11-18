import { useAppStore } from '../utils/store';

const TOKEN_KEY = 'sl_profile_token';
const DEFAULT_BACKEND = 'https://api.safetylink.online';
const FALLBACK_BACKEND = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';
const DEAD_BACKEND_HOST = 'd089bef8b0b58c5d9506b512ec2f63dc.workers.dev';
let lastSig = '';

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

/**
 * Saves who the user is, their emergency contacts and last known location on the SafetyLink server.
 * This is what lets the server recognise an offline "Please Call Me" from this phone and alert the right people.
 */
export async function syncProfile(): Promise<void> {
  const s: any = useAppStore.getState();
  const user = s.currentUser;
  const org = s.currentOrg;
  if ((!user?.phone && !org?.controlRoomNumber) || s.demoMode || user?.isDemo) return;

  const effectivePhone = user?.phone || org?.controlRoomNumber || '';
  const effectiveName = user?.fullName || user?.username || org?.contactName || org?.name || 'SafetyLink User';
  const effectiveOrgCode = user?.orgCode || org?.id || 'INDIVIDUAL';
  const effectiveUserId = user?.id || org?.id || '';
  const loc = s.userLocation;
  const alertNote = String(user?.alertNote || '').trim().slice(0, 140);
  const contacts = (s.contacts || []).slice(0, 5).map((c: any) => ({ name: c.name, phone: c.phone }));

  const sig = JSON.stringify([
    effectivePhone,
    effectiveName,
    effectiveOrgCode,
    contacts,
    alertNote,
    loc ? Math.round(loc.lat * 1000) : 0,
    loc ? Math.round(loc.lng * 1000) : 0,
  ]);
  if (sig === lastSig) return;

  // Always update native SharedPreferences first so hardware triggers work even when completely offline
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
      ussdEnabled: Boolean(s.dispatchSettings?.ussdEnabled),
      userPin: s.userPin || '',
      duressPin: s.duressPin || '',
      contacts: (s.contacts || []).map((c: any) => ({
        name: c.name,
        phone: c.phone,
        sms: c.sms !== false,
        call: Boolean(c.call || c.priorityCall || c.priority),
      })),
    });
  } catch { /* native bridge not available on web */ }

  if (!effectivePhone) return;

  const token = localStorage.getItem(TOKEN_KEY) || '';
  let syncAccepted = false;
  let savedToken = token;

  for (const backend of resolveProfileSyncBackends(s.customBackendUrl)) {
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

  if (syncAccepted && savedToken) {
    try {
      const { SafetyLinkEmergency } = await import('./NativeDispatchService');
      await SafetyLinkEmergency.savePushIdentity({ phone: effectivePhone, profileToken: savedToken });
    } catch { /* native bridge not available on web */ }
  }
  if (syncAccepted) lastSig = sig;
}

let started = false;
export function startProfileSync(): void {
  if (started) return;
  started = true;
  let timer: any = null;
  useAppStore.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(syncProfile, 4000);
  });
  setInterval(syncProfile, 5 * 60 * 1000);
  setTimeout(syncProfile, 5000);
}
