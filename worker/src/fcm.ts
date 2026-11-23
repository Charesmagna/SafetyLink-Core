// worker/src/fcm.ts
// Sends high-priority DATA-ONLY emergency alarm pushes via Firebase Cloud Messaging HTTP v1.
// Uses the service account from the FCM_SERVICE_ACCOUNT secret. No firebase-admin needed.
//
// CRITICAL: We intentionally omit top-level `notification` and `android.notification` fields!
// On Android, any FCM message containing a `notification` block is intercepted by the OS tray
// when the app is in the background, locked, or swiped closed — bypassing SafetyFcmService.onMessageReceived().
// A DATA-ONLY message with `android.priority = "HIGH"` always wakes the device out of Doze mode
// and invokes SafetyFcmService.onMessageReceived(), which plays the insistent USAGE_ALARM ringtone
// and triggers the full-screen lockscreen wake intent regardless of app state.

type ServiceAccount = { project_id: string; private_key: string; client_email: string; token_uri: string };

const b64url = (buf: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof buf === 'string' ? new TextEncoder().encode(buf) : new Uint8Array(buf as ArrayBuffer);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

let cached: { token: string; exp: number; projectId: string } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.projectId === sa.project_id && cached.exp - 60 > Date.now() / 1000) {
    return cached.token;
  }
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const jwt = `${header}.${claims}.${b64url(sig)}`;
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    throw new Error('FCM token error: ' + JSON.stringify(j).slice(0, 200));
  }
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600), projectId: sa.project_id };
  return cached.token;
}

export interface FcmSendResult {
  ok: boolean;
  status: number;
  messageId?: string;
  error?: string;
  unregistered?: boolean;
}

export async function sendLoudAlarm(
  serviceAccountJson: string,
  deviceToken: string,
  title: string,
  body: string,
  extraData?: Record<string, string>,
): Promise<FcmSendResult> {
  const sa = JSON.parse(serviceAccountJson) as ServiceAccount;
  const at = await accessToken(sa);

  // Every value in FCM `data` MUST be a string
  const safeExtra: Record<string, string> = {};
  if (extraData) {
    for (const [k, v] of Object.entries(extraData)) {
      if (v !== undefined && v !== null) safeExtra[k] = String(v);
    }
  }

  const dataPayload: Record<string, string> = {
    type: 'EMERGENCY_RING',
    priority: 'CRITICAL',
    ringDurationSec: '45',
    title: String(title || '🚨 EMERGENCY: SafetyLink Alert'),
    body: String(body || 'Emergency distress signal received.'),
    timestamp: String(Date.now()),
    ...safeExtra,
  };

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${at}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        // DATA-ONLY payload so Android ALWAYS invokes SafetyFcmService.onMessageReceived()
        // even when the app is backgrounded, screen-locked, in Doze mode, or force-closed.
        data: dataPayload,
        android: {
          priority: 'HIGH',
          ttl: '60s',
          direct_boot_ok: true,
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: { title: dataPayload.title, body: dataPayload.body },
              sound: 'default',
              'content-available': 1,
              'interruption-level': 'time-sensitive',
            },
          },
        },
      },
    }),
  });

  if (res.ok) {
    const j: any = await res.json().catch(() => ({}));
    return { ok: true, status: res.status, messageId: j.name || undefined };
  }

  const errText = (await res.text().catch(() => '')).slice(0, 350);
  const unregistered =
    res.status === 404 ||
    /UNREGISTERED|NOT_FOUND|not a valid FCM registration token/i.test(errText);
  return { ok: false, status: res.status, error: errText, unregistered };
}
