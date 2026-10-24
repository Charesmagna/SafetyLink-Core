// worker/src/admin.ts
// Superadmin endpoints. Every request must send X-Admin-Key matching ADMIN_API_KEY.
// Returns counts and masked numbers only. Deletion removes a user's profile, contacts and device tokens.

const safeEq = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
};

const mask = (p: string) => (p && p.length > 6 ? p.slice(0, 5) + '***' + p.slice(-3) : '***');

export function adminAuthorised(env: any, req: Request): boolean {
  const want = env.ADMIN_API_KEY || '';
  const got = req.headers.get('X-Admin-Key') || '';
  return !!want && !!got && safeEq(got, want);
}

export async function adminSummary(db: any) {
  const now = Date.now();
  const day = 86400000;
  const count = async (sql: string, ...binds: any[]) => {
    try { const r: any = await db.prepare(sql).bind(...binds).first(); return Number(r?.n ?? 0); } catch { return 0; }
  };
  return {
    totalAccounts: await count('SELECT COUNT(*) AS n FROM sl_profiles'),
    activeLast30Days: await count('SELECT COUNT(*) AS n FROM sl_profiles WHERE updated_at > ?', now - 30 * day),
    activeLast7Days: await count('SELECT COUNT(*) AS n FROM sl_profiles WHERE updated_at > ?', now - 7 * day),
    contacts: await count('SELECT COUNT(*) AS n FROM sl_contacts'),
    devicesRegistered: await count('SELECT COUNT(DISTINCT phone) AS n FROM sl_device_tokens'),
    panicsLast30Days: await count('SELECT COUNT(*) AS n FROM sl_pcm_events WHERE received_at > ?', now - 30 * day),
  };
}

export async function adminUsers(db: any) {
  const rows: any = await db.prepare(
    `SELECT p.phone, p.name, p.updated_at,
            (SELECT COUNT(*) FROM sl_contacts c WHERE c.owner_phone = p.phone) AS contacts,
            (SELECT COUNT(*) FROM sl_device_tokens d WHERE d.phone = p.phone) AS devices
       FROM sl_profiles p ORDER BY p.updated_at DESC LIMIT 500`,
  ).all();
  return (rows?.results ?? []).map((r: any) => ({
    phone: mask(r.phone),
    name: r.name || '',
    lastSync: r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 16).replace('T', ' ') : '',
    contacts: Number(r.contacts || 0),
    appRegistered: Number(r.devices || 0) > 0,
    // raw phone is only used server-side for the delete action below
    _key: r.phone,
  })).map(({ _key, ...rest }: any) => ({ ...rest, id: _key }));
}

export async function adminDelete(db: any, phone: string) {
  await db.prepare('DELETE FROM sl_contacts WHERE owner_phone = ?').bind(phone).run();
  await db.prepare('DELETE FROM sl_device_tokens WHERE phone = ?').bind(phone).run();
  await db.prepare('DELETE FROM sl_profiles WHERE phone = ?').bind(phone).run();
  return { ok: true };
}
