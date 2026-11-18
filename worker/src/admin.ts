// worker/src/admin.ts
// Superadmin endpoints. Returns counts, 24h/7d/30d active telemetry, failed logins, and device/version data.

const mask = (p: string) => (p && p.length > 6 ? p.slice(0, 5) + '***' + p.slice(-3) : '***');

import { sessionValid } from './admin-auth';

export async function adminAuthorised(env: any, req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token ? await sessionValid(env, token) : false;
}

export async function adminSummary(db: any) {
  const now = Date.now();
  const day = 86400000;
  const count = async (sql: string, ...binds: any[]) => {
    try { const r: any = await db.prepare(sql).bind(...binds).first(); return Number(r?.n ?? 0); } catch { return 0; }
  };
  const versionRows: any = await db.prepare(
    `SELECT COALESCE(app_version, '1.1.x') AS version, COUNT(*) AS count FROM users GROUP BY COALESCE(app_version, '1.1.x') LIMIT 20`
  ).all().catch(() => ({ results: [] }));

  return {
    totalAccounts: (await count('SELECT COUNT(*) AS n FROM users')) + (await count('SELECT COUNT(*) AS n FROM sl_profiles')),
    activeLast24Hours: await count('SELECT COUNT(*) AS n FROM users WHERE last_seen > ?', now - day),
    activeLast7Days: (await count('SELECT COUNT(*) AS n FROM users WHERE last_seen > ?', now - 7 * day)) || (await count('SELECT COUNT(*) AS n FROM sl_profiles WHERE updated_at > ?', now - 7 * day)),
    activeLast30Days: (await count('SELECT COUNT(*) AS n FROM users WHERE last_seen > ?', now - 30 * day)) || (await count('SELECT COUNT(*) AS n FROM sl_profiles WHERE updated_at > ?', now - 30 * day)),
    failedLogins24h: await count('SELECT COUNT(*) AS n FROM login_attempts WHERE ok = 0 AND created_at > ?', now - day),
    contacts: await count('SELECT COUNT(*) AS n FROM sl_contacts'),
    devicesRegistered: await count('SELECT COUNT(DISTINCT phone) AS n FROM sl_device_tokens'),
    panicsLast30Days: (await count('SELECT COUNT(*) AS n FROM incidents WHERE created_at > ?', now - 30 * day)) + (await count('SELECT COUNT(*) AS n FROM sl_pcm_events WHERE received_at > ?', now - 30 * day)),
    versionsBreakdown: versionRows?.results || [],
  };
}

export async function adminUsers(db: any) {
  const rows: any = await db.prepare(
    `SELECT p.phone, p.name, p.updated_at,
            (SELECT COUNT(*) FROM sl_contacts c WHERE c.owner_phone = p.phone) AS contacts,
            (SELECT COUNT(*) FROM sl_device_tokens d WHERE d.phone = p.phone) AS devices
       FROM sl_profiles p ORDER BY p.updated_at DESC LIMIT 500`,
  ).all().catch(() => ({ results: [] }));

  const appUsers: any = await db.prepare(
    `SELECT id, username, email, phone, org_id, role, status, app_version, device_model, last_seen, created_at
       FROM users ORDER BY COALESCE(last_seen, created_at) DESC LIMIT 500`
  ).all().catch(() => ({ results: [] }));

  const mappedProfiles = (rows?.results ?? []).map((r: any) => ({
    phone: mask(r.phone),
    name: r.name || '',
    lastSync: r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    contacts: Number(r.contacts || 0),
    appRegistered: Number(r.devices || 0) > 0,
    id: r.phone,
    source: 'pcm_profile',
  }));

  const mappedUsers = (appUsers?.results ?? []).map((u: any) => ({
    id: u.id,
    username: u.username,
    email: u.email || '',
    phone: u.phone || '',
    orgCode: u.org_id || '',
    role: u.role || 'Community Member',
    accountStatus: u.status || 'active',
    appVersion: u.app_version || '1.1.x',
    deviceModel: u.device_model || 'Unknown Device',
    lastSeen: u.last_seen || u.created_at || Date.now(),
    createdAt: u.created_at || Date.now(),
    source: 'app_user',
  }));

  return [...mappedUsers, ...mappedProfiles];
}

export async function adminDelete(db: any, phone: string) {
  await db.prepare('DELETE FROM sl_contacts WHERE owner_phone = ?').bind(phone).run();
  await db.prepare('DELETE FROM sl_device_tokens WHERE phone = ?').bind(phone).run();
  await db.prepare('DELETE FROM sl_profiles WHERE phone = ?').bind(phone).run();
  return { ok: true };
}
