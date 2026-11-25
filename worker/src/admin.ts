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

function normalizePhoneKey(raw: string): string {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('27') && digits.length === 11) return '0' + digits.slice(2);
  if (digits.length === 9 && /^[678]/.test(digits)) return '0' + digits;
  return digits;
}

/**
 * Collects every customer registered anywhere across SafetyLink D1 tables
 * (users, sl_profiles, sl_device_tokens, organisations), deduplicates by phone/email/id,
 * and returns one complete unified Super Admin customer roster.
 */
export async function adminRestoreCustomers(db: any) {
  if (!db) {
    return { ok: false, totalCount: 0, sources: {}, users: [] };
  }

  const [appUsersRes, profilesRes, devicesRes, orgsRes, contactsRes] = await Promise.all([
    db.prepare(
      `SELECT id, username, email, phone, org_id, role, status, app_version, device_model, last_seen, created_at
         FROM users ORDER BY COALESCE(last_seen, created_at) DESC LIMIT 2000`
    ).all().catch(() => ({ results: [] })),
    db.prepare(
      `SELECT phone, name, updated_at FROM sl_profiles ORDER BY updated_at DESC LIMIT 2000`
    ).all().catch(() => ({ results: [] })),
    db.prepare(
      `SELECT phone, COUNT(*) AS token_count, MAX(updated_at) AS last_token_at
         FROM sl_device_tokens GROUP BY phone LIMIT 2000`
    ).all().catch(() => ({ results: [] })),
    db.prepare(
      `SELECT id, name, contact_email, created_at FROM organisations ORDER BY created_at DESC LIMIT 500`
    ).all().catch(() => ({ results: [] })),
    db.prepare(
      `SELECT owner_phone, COUNT(*) AS cnt FROM sl_contacts GROUP BY owner_phone LIMIT 2000`
    ).all().catch(() => ({ results: [] })),
  ]);

  const contactCountByPhone = new Map<string, number>();
  for (const row of (contactsRes?.results ?? []) as any[]) {
    const k = normalizePhoneKey(row.owner_phone);
    if (k) contactCountByPhone.set(k, (contactCountByPhone.get(k) || 0) + Number(row.cnt || 0));
  }

  const deviceByPhone = new Map<string, { count: number; lastAt: number }>();
  for (const row of (devicesRes?.results ?? []) as any[]) {
    const k = normalizePhoneKey(row.phone);
    if (k) {
      deviceByPhone.set(k, {
        count: Number(row.token_count || 0),
        lastAt: Number(row.last_token_at || 0),
      });
    }
  }

  const unified = new Map<string, any>();

  const upsert = (key: string, patch: any) => {
    const existing = unified.get(key);
    if (!existing) {
      unified.set(key, {
        ...patch,
        sources: Array.from(new Set(patch.sources || [])),
      });
      return;
    }
    unified.set(key, {
      ...existing,
      fullName: existing.fullName && existing.fullName !== 'SafetyLink User' ? existing.fullName : (patch.fullName || existing.fullName),
      username: existing.username || patch.username,
      email: existing.email || patch.email,
      phone: existing.phone || patch.phone,
      orgCode: existing.orgCode || patch.orgCode,
      role: existing.role && existing.role !== 'Community Member' ? existing.role : (patch.role || existing.role),
      accountStatus: existing.accountStatus || patch.accountStatus || 'active',
      contactsCount: Math.max(Number(existing.contactsCount || 0), Number(patch.contactsCount || 0)),
      appRegistered: Boolean(existing.appRegistered || patch.appRegistered),
      lastSeen: Math.max(Number(existing.lastSeen || 0), Number(patch.lastSeen || 0)),
      createdAt: Math.min(Number(existing.createdAt || Date.now()), Number(patch.createdAt || Date.now())),
      sources: Array.from(new Set([...(existing.sources || []), ...(patch.sources || [])])),
    });
  };

  for (const u of (appUsersRes?.results ?? []) as any[]) {
    const pKey = normalizePhoneKey(u.phone);
    const eKey = String(u.email || '').trim().toLowerCase();
    const dedupeKey = pKey ? `phone:${pKey}` : (eKey ? `email:${eKey}` : `id:${u.id}`);
    const dev = pKey ? deviceByPhone.get(pKey) : undefined;
    upsert(dedupeKey, {
      id: String(u.id),
      username: u.username || (u.phone ? `user_${pKey.slice(-4)}` : String(u.id)),
      fullName: u.username || u.email || 'SafetyLink User',
      email: u.email || '',
      phone: u.phone || '',
      orgCode: u.org_id || '',
      role: u.role || 'Community Member',
      accountStatus: u.status || 'active',
      subscriptionStatus: u.status || 'active',
      appVersion: u.app_version || '2.0',
      deviceModel: u.device_model || 'Mobile Node',
      contactsCount: pKey ? (contactCountByPhone.get(pKey) || 0) : 0,
      appRegistered: Boolean(dev && dev.count > 0),
      lastSeen: Number(u.last_seen || u.created_at || Date.now()),
      createdAt: Number(u.created_at || Date.now()),
      sources: ['d1_users'],
    });
  }

  for (const p of (profilesRes?.results ?? []) as any[]) {
    const pKey = normalizePhoneKey(p.phone);
    const dedupeKey = pKey ? `phone:${pKey}` : `profile:${p.phone}`;
    const dev = pKey ? deviceByPhone.get(pKey) : undefined;
    upsert(dedupeKey, {
      id: `PROF-${pKey || p.phone}`,
      username: (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') || `sl_${pKey.slice(-4)}`,
      fullName: p.name || 'Zero-Airtime Profile',
      email: '',
      phone: p.phone || '',
      orgCode: '',
      role: 'Community Member',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      contactsCount: pKey ? (contactCountByPhone.get(pKey) || 0) : 0,
      appRegistered: Boolean(dev && dev.count > 0),
      lastSeen: Number(p.updated_at || Date.now()),
      createdAt: Number(p.updated_at || Date.now()),
      sources: ['d1_sl_profiles'],
    });
  }

  for (const d of (devicesRes?.results ?? []) as any[]) {
    const pKey = normalizePhoneKey(d.phone);
    if (!pKey) continue;
    upsert(`phone:${pKey}`, {
      id: `DEV-${pKey}`,
      username: `device_${pKey.slice(-4)}`,
      fullName: `Registered Device (${d.phone})`,
      email: '',
      phone: d.phone || '',
      orgCode: '',
      role: 'Community Member',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      contactsCount: contactCountByPhone.get(pKey) || 0,
      appRegistered: true,
      lastSeen: Number(d.last_token_at || Date.now()),
      createdAt: Number(d.last_token_at || Date.now()),
      sources: ['d1_fcm_devices'],
    });
  }

  for (const o of (orgsRes?.results ?? []) as any[]) {
    const eKey = String(o.contact_email || '').trim().toLowerCase();
    const dedupeKey = eKey ? `email:${eKey}` : `org:${o.id}`;
    upsert(dedupeKey, {
      id: `ORG-${o.id}`,
      username: String(o.id || '').toLowerCase(),
      fullName: `${o.name || o.id} (Org Admin)`,
      email: o.contact_email || '',
      phone: '',
      orgCode: o.id || '',
      role: 'Organization Administrator',
      accountStatus: 'active',
      subscriptionStatus: 'active',
      contactsCount: 0,
      appRegistered: false,
      lastSeen: Number(o.created_at || Date.now()),
      createdAt: Number(o.created_at || Date.now()),
      sources: ['d1_organisations'],
    });
  }

  const users = Array.from(unified.values()).sort((a, b) => Number(b.lastSeen || 0) - Number(a.lastSeen || 0));

  return {
    ok: true,
    totalCount: users.length,
    sources: {
      d1Users: (appUsersRes?.results ?? []).length,
      d1Profiles: (profilesRes?.results ?? []).length,
      d1Devices: (devicesRes?.results ?? []).length,
      d1Organisations: (orgsRes?.results ?? []).length,
    },
    users,
  };
}

