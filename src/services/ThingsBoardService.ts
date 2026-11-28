import { useAppStore } from '../utils/store';
const DEFAULT_BACKEND = 'https://api.safetylink.online';
const INSTALLATION_KEY = 'sl_tb_installation_id';
function getInstallationId(): string {
  let id = '';
  try { id = localStorage.getItem(INSTALLATION_KEY) || ''; } catch { /* storage unavailable */ }
  if (!/^[a-zA-Z0-9-]{12,64}$/.test(id)) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    try { localStorage.setItem(INSTALLATION_KEY, id); } catch { /* session-only fallback */ }
  }
  return id;
}
export interface SafetyLinkTelemetry { activeThreat?: boolean; drillMode?: boolean; batteryLevel?: number; latitude?: number; longitude?: number; integrationTest?: boolean; }
/** ThingsBoard credentials remain exclusively in the SafetyLink Worker secret store. */
export async function sendSafetyLinkTelemetry(payload: SafetyLinkTelemetry): Promise<boolean> {
  const state = useAppStore.getState();
  const token = String(state.token || (typeof localStorage !== 'undefined' && (localStorage.getItem('sl_token') || localStorage.getItem('sl_auth_token'))) || '').trim();
  if (!token) return false;
  const custom = String(state.customBackendUrl || '').trim().replace(/\/+$/, '');
  for (const base of [...new Set([custom, DEFAULT_BACKEND].filter(Boolean))]) {
    try {
      const response = await fetch(`${base}/api/iot/telemetry`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...payload, installationId: getInstallationId() }) });
      const result: any = await response.json().catch(() => ({}));
      if (response.ok && result.ok === true) return true;
      if ([400, 401, 403, 503].includes(response.status)) return false;
    } catch { /* try fallback backend */ }
  }
  return false;
}
export const sendTestEvent = async (): Promise<boolean> => sendSafetyLinkTelemetry({ integrationTest: true });
