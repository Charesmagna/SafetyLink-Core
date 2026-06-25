import pool from '../config/db.js';
import { ENV } from '../config/env.js';

let firebaseAdmin = null;

async function getAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  if (!ENV.FCM_SERVER_KEY && !ENV.FIREBASE_PROJECT_ID) return null;

  try {
    const { default: admin } = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: ENV.FIREBASE_PROJECT_ID
          ? admin.credential.applicationDefault()
          : { getAccessToken: async () => ({ access_token: ENV.FCM_SERVER_KEY, expires_in: 3600 }) },
      });
    }
    firebaseAdmin = admin;
    return admin;
  } catch {
    return null;
  }
}

export async function sendPushToUser(userId, notification, data = {}) {
  const { rows } = await pool.query(
    'SELECT token FROM notification_tokens WHERE user_id = $1',
    [userId]
  );
  const tokens = rows.map(r => r.token).filter(Boolean);
  if (!tokens.length) return;
  return sendPushToTokens(tokens, notification, data);
}

export async function sendPushToOrg(orgId, roles, notification, data = {}) {
  const placeholders = roles.map((_, i) => `$${i + 2}`).join(',');
  const { rows } = await pool.query(
    `SELECT nt.token FROM notification_tokens nt
     JOIN users u ON u.id = nt.user_id
     WHERE u.organization_id = $1 AND u.role IN (${placeholders}) AND u.status = 'active'`,
    [orgId, ...roles]
  );
  const tokens = rows.map(r => r.token).filter(Boolean);
  if (!tokens.length) return;
  return sendPushToTokens(tokens, notification, data);
}

async function sendPushToTokens(tokens, notification, data) {
  const admin = await getAdmin();
  if (!admin) {
    console.warn('[FCM] Firebase not configured — push skipped');
    return;
  }
  try {
    const message = {
      notification,
      data:    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens,
      android: {
        priority: 'high',
        notification: { channelId: 'safetylink_alerts', sound: 'alarm' },
      },
    };
    const result = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Sent: ${result.successCount} ok, ${result.failureCount} failed`);
    return result;
  } catch (err) {
    console.error('[FCM] Send error:', err.message);
  }
}
