/**
 * SafetyLink ThingsBoard Cloud HTTP Integration Client Bridge
 *
 * Security model:
 * - Zero ThingsBoard credentials are stored in browser localStorage or Vite client env vars.
 * - All telemetry and verification requests go through the SafetyLink backend proxy
 *   (`/api/iot/thingsboard/*`), which reads `THINGSBOARD_HTTP_INTEGRATION_KEY` exclusively on the server.
 * - One ThingsBoard device identity is generated per SafetyLink installation.
 * - Never fakes or mocks delivery success: returns actual server/HTTP delivery outcomes.
 */

export interface ThingsBoardStatus {
  configured: boolean;
  integrationMode: string;
  deviceIdentityModel: string;
  host: string;
  secretEnvVar: string;
  browserStorageAllowed: boolean;
}

export interface ThingsBoardDeliveryResult {
  ok: boolean;
  configured: boolean;
  status: 'DELIVERED' | 'UNCONFIGURED' | 'UPSTREAM_REJECTED' | 'NETWORK_ERROR';
  deviceName?: string;
  upstreamStatus?: number;
  deliveredAt?: string;
  error?: string;
}

export interface ThingsBoardIncidentTelemetry {
  event: string;
  incidentId?: string;
  lat?: number;
  lng?: number;
  description?: string;
  orgId?: string;
  triggeredBy?: string;
  source?: string;
}

const INSTALLATION_ID_KEY = 'sl_installation_device_id';

export function getInstallationDeviceId(): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'server-node';
    }
    // Clean up any legacy client-side credential storage if present
    window.localStorage.removeItem('sl_thingsboard_token');

    let id = window.localStorage.getItem(INSTALLATION_ID_KEY);
    if (!id) {
      const rand =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID().slice(0, 12)
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      id = `node-${rand}`;
      window.localStorage.setItem(INSTALLATION_ID_KEY, id);
    }
    return id;
  } catch {
    return 'web-ephemeral';
  }
}

export async function getThingsBoardStatus(): Promise<ThingsBoardStatus> {
  try {
    const res = await fetch('/api/iot/thingsboard/status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        configured: false,
        integrationMode: 'THINGSBOARD_CLOUD_HTTP_INTEGRATION',
        deviceIdentityModel: 'per-installation',
        host: 'thingsboard.cloud',
        secretEnvVar: 'THINGSBOARD_HTTP_INTEGRATION_KEY',
        browserStorageAllowed: false,
      };
    }
    return (await res.json()) as ThingsBoardStatus;
  } catch {
    return {
      configured: false,
      integrationMode: 'THINGSBOARD_CLOUD_HTTP_INTEGRATION',
      deviceIdentityModel: 'per-installation',
      host: 'thingsboard.cloud',
      secretEnvVar: 'THINGSBOARD_HTTP_INTEGRATION_KEY',
      browserStorageAllowed: false,
    };
  }
}

export async function sendTestEventDetailed(orgId?: string): Promise<ThingsBoardDeliveryResult> {
  try {
    const res = await fetch('/api/iot/thingsboard/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installationId: getInstallationDeviceId(),
        orgId: orgId || 'ADMIN_TEST',
        source: 'ADMIN_DIAGNOSTIC_TEST',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: Boolean(res.ok && data?.ok),
      configured: Boolean(data?.configured),
      status: data?.status || (res.ok ? 'DELIVERED' : 'UPSTREAM_REJECTED'),
      deviceName: data?.deviceName,
      upstreamStatus: data?.upstreamStatus ?? res.status,
      deliveredAt: data?.deliveredAt,
      error: data?.error,
    };
  } catch (err: any) {
    return {
      ok: false,
      configured: false,
      status: 'NETWORK_ERROR',
      error: err?.message || 'Unable to reach SafetyLink ThingsBoard server proxy.',
    };
  }
}

/** Backwards-compatible boolean wrapper — strictly reflects real server delivery, never mocks true. */
export const sendTestEvent = async (_legacyUnused?: string): Promise<boolean> => {
  const result = await sendTestEventDetailed();
  return result.ok;
};

export async function pushIncidentTelemetry(
  telemetry: ThingsBoardIncidentTelemetry
): Promise<ThingsBoardDeliveryResult> {
  try {
    const res = await fetch('/api/iot/thingsboard/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installationId: getInstallationDeviceId(),
        ...telemetry,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: Boolean(res.ok && data?.ok),
      configured: Boolean(data?.configured),
      status: data?.status || (res.ok ? 'DELIVERED' : 'UPSTREAM_REJECTED'),
      deviceName: data?.deviceName,
      upstreamStatus: data?.upstreamStatus ?? res.status,
      deliveredAt: data?.deliveredAt,
      error: data?.error,
    };
  } catch (err: any) {
    return {
      ok: false,
      configured: false,
      status: 'NETWORK_ERROR',
      error: err?.message || 'Unable to reach SafetyLink ThingsBoard server proxy.',
    };
  }
}
