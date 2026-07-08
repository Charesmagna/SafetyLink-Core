/**
 * ThingsBoardService
 *
 * Pushes incident telemetry to a ThingsBoard Cloud device so org admins get
 * real-time visibility across all members' panic events in one dashboard,
 * and so a ThingsBoard Rule Chain can trigger further actions (e.g. an
 * org-wide Twilio broadcast) without any secret ever living in this app.
 *
 * Uses ThingsBoard's public device telemetry endpoint:
 *   POST https://thingsboard.cloud/api/v1/{DEVICE_ACCESS_TOKEN}/telemetry
 *
 * The device access token is intentionally NOT hardcoded here -- it's
 * entered once in the Admin Panel and stored only in this device's local
 * storage (see 'sl_thingsboard_token' in store.ts), so it never ends up in
 * this public repo.
 */

const THINGSBOARD_HOST = 'https://thingsboard.cloud';

export async function pushIncidentTelemetry(
  deviceToken: string,
  payload: {
    event: 'panic' | 'resolved' | 'drill';
    incidentId: string;
    lat: number;
    lng: number;
    description: string;
    orgId: string;
    triggeredBy: string;
  }
): Promise<boolean> {
  if (!deviceToken) return false;

  try {
    const res = await fetch(`${THINGSBOARD_HOST}/api/v1/${deviceToken}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('[ThingsBoardService] telemetry push failed (device might be offline or request was blocked):', e instanceof Error ? e.message : e);
    return false;
  }
}

/** Sends a harmless test event, used by the "Send Test Event" button in Admin settings. */
export async function sendTestEvent(deviceToken: string): Promise<boolean> {
  return pushIncidentTelemetry(deviceToken, {
    event: 'drill',
    incidentId: `TEST-${Date.now()}`,
    lat: -26.3085,
    lng: 27.8344,
    description: 'SafetyLink connectivity test event',
    orgId: 'TEST',
    triggeredBy: 'AdminPanel test button',
  });
}
