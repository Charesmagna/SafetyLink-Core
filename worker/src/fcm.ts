// worker/src/fcm.ts
// Sends high-priority alarm pushes via Firebase Cloud Messaging HTTP v1.
// Uses the service account from the FCM_SERVICE_ACCOUNT secret. No firebase-admin needed.

type ServiceAccount = { project_id: string; private_key: string; client_email: string; token_uri: string };

const b64url = (buf: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof buf === 'string' ? new TextEncoder().encode(buf) : new Uint8Array(buf as ArrayBuffer);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

let cached: { token: string; exp: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cached && cached.exp - 60 > Date.now() / 1000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const jwt = `${header}.${claims}.${b64url(sig)}`;
  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString(),
  });
  const j: any = await res.json();
  if (!res.ok || !j.access_token) throw new Error('FCM token error: ' + JSON.stringify(j).slice(0, 200));
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return cached.token;
}

export async function sendLoudAlarm(
  serviceAccountJson: string,
  deviceToken: string,
  title: string,
  body: string,
  extraData?: Record<string, string>,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const sa = JSON.parse(serviceAccountJson) as ServiceAccount;
  const at = await accessToken(sa);
  const dataPayload: Record<string, string> = {
    type: 'EMERGENCY_RING',
    title,
    body,
    timestamp: String(Date.now()),
    ...(extraData || {}),
  };
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        data: dataPayload,
        notification: { title, body },
        android: {
          priority: 'HIGH',
          ttl: '60s',
          notification: {
            channel_id: 'loud_alarm_channel',
            sound: 'default',
            notification_priority: 'PRIORITY_MAX',
            visibility: 'PUBLIC',
            default_vibrate_timings: true,
          },
        },
      },
    }),
  });
  if (res.ok) return { ok: true, status: res.status };
  return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
}
