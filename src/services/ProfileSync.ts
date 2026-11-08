import { useAppStore } from '../utils/store';

const TOKEN_KEY = 'sl_profile_token';
const DEFAULT_BACKEND = 'https://api.safetylink.online';
let lastSig = '';

/**
 * Saves who the user is, their emergency contacts and last known location on the SafetyLink server.
 * This is what lets the server recognise an offline "Please Call Me" from this phone and alert the right people.
 */
export async function syncProfile(): Promise<void> {
  try {
    const s: any = useAppStore.getState();
    const user = s.currentUser;
    if (!user?.phone || s.demoMode || user.isDemo) return;
    const contacts = (s.contacts || []).slice(0, 5).map((c: any) => ({ name: c.name, phone: c.phone }));
    const loc = s.userLocation;
    const alertNote = String((user as any).alertNote || '').trim().slice(0, 140);
    const sig = JSON.stringify([user.phone, user.fullName, contacts, alertNote, loc ? Math.round(loc.lat * 1000) : 0, loc ? Math.round(loc.lng * 1000) : 0]);
    if (sig === lastSig) return;
    const backend = String(s.customBackendUrl || DEFAULT_BACKEND).replace(/\/$/, '');
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const res = await fetch(backend + '/api/profile/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Profile-Token': token } : {}) },
      body: JSON.stringify({ phone: user.phone, name: user.fullName || user.username, contacts, alertNote, lat: loc?.lat, lng: loc?.lng }),
    });
    const j: any = await res.json().catch(() => ({}));
    const syncAccepted = res.ok && j.ok === true && typeof (j.token || token) === 'string' && Boolean(j.token || token);
    if (syncAccepted && j.token) localStorage.setItem(TOKEN_KEY, j.token);
    if (!syncAccepted) {
      console.warn('[ProfileSync] server did not confirm profile/contact sync', {
        status: res.status,
        error: String(j.error || 'invalid sync response').slice(0, 100),
      });
    }
    const savedToken = syncAccepted ? (j.token || token) : '';
    // Persist to native Android SharedPreferences (safetylink_prefs & sl_contacts_store)
    // so DispatchRunner and PanicSequence can dispatch directly from hardware keys
    try {
      const { NativeDispatchService } = await import('./NativeDispatchService');
      await NativeDispatchService.saveNativeProfile({
        name: user.fullName || user.username,
        phone: user.phone,
        alertNote: (user as any).alertNote || '',
        lat: loc?.lat,
        lng: loc?.lng,
        contacts: (s.contacts || []).map((c: any) => ({
          name: c.name,
          phone: c.phone,
          sms: c.sms !== false,
          call: Boolean(c.call || c.priorityCall || c.priority)
        }))
      });
    } catch { /* native bridge not available on web */ }

    if (syncAccepted && savedToken) {
      try {
        const { SafetyLinkEmergency } = await import('./NativeDispatchService');
        await (SafetyLinkEmergency as any).savePushIdentity({ phone: user.phone, profileToken: savedToken });
      } catch { /* native bridge not available on web */ }
    }
    if (syncAccepted) lastSig = sig;
  } catch {
    /* offline - will retry on the next change or timer */
    try {
      const s: any = useAppStore.getState();
      const user = s.currentUser;
      const loc = s.userLocation;
      if (user?.phone) {
        const { NativeDispatchService } = await import('./NativeDispatchService');
        await NativeDispatchService.saveNativeProfile({
          name: user.fullName || user.username,
          phone: user.phone,
          alertNote: (user as any).alertNote || '',
          lat: loc?.lat,
          lng: loc?.lng,
          contacts: (s.contacts || []).map((c: any) => ({
            name: c.name,
            phone: c.phone,
            sms: c.sms !== false,
            call: Boolean(c.call || c.priorityCall || c.priority)
          }))
        });
      }
    } catch {}
  }
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
