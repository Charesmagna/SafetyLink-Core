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
    const sig = JSON.stringify([user.phone, user.fullName, contacts, loc ? Math.round(loc.lat * 1000) : 0, loc ? Math.round(loc.lng * 1000) : 0]);
    if (sig === lastSig) return;
    const backend = String(s.customBackendUrl || DEFAULT_BACKEND).replace(/\/$/, '');
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const res = await fetch(backend + '/api/profile/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Profile-Token': token } : {}) },
      body: JSON.stringify({ phone: user.phone, name: user.fullName || user.username, contacts, lat: loc?.lat, lng: loc?.lng }),
    });
    const j: any = await res.json().catch(() => ({}));
    if (j.token) localStorage.setItem(TOKEN_KEY, j.token);
    if (res.ok) lastSig = sig;
  } catch {
    /* offline - will retry on the next change or timer */
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
