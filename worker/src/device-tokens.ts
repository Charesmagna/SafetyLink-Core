// worker/src/device-tokens.ts
// Stores and queries each phone's FCM device token(s), keyed by normalized E.164 SafetyLink phone number.
// Supports multiple devices per contact and matches E.164 (+27...), local (0...), and stripped (27...) variants.

export function normalizeDevicePhone(raw: string): string {
  let n = String(raw || '').replace(/[^0-9+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0') && n.length === 10) n = '27' + n.slice(1);
  if (n.length === 9 && /^[6-8]/.test(n)) n = '27' + n;
  return n ? '+' + n : '';
}

export function phoneLookupVariants(raw: string): string[] {
  const e164 = normalizeDevicePhone(raw);
  if (!e164) return [];
  const digits = e164.slice(1);
  const variants = new Set<string>([e164, digits]);
  if (e164.startsWith('+27') && e164.length === 12) {
    variants.add('0' + e164.slice(3));
  }
  const trimmed = String(raw || '').trim();
  if (trimmed) variants.add(trimmed);
  return Array.from(variants);
}

export async function ensureDeviceTokenTable(db: any) {
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS sl_device_tokens (phone TEXT NOT NULL, token TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (phone, token))',
  ).run();
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS device_tokens (phone TEXT PRIMARY KEY, token TEXT NOT NULL, profile_token TEXT, updated_at INTEGER NOT NULL)',
  ).run().catch(() => {});
}

export async function saveDeviceToken(db: any, rawPhone: string, token: string, profileToken = '') {
  const phone = normalizeDevicePhone(rawPhone);
  const cleanToken = String(token || '').trim();
  if (!phone || !cleanToken) return { phone: '', saved: false };
  await ensureDeviceTokenTable(db);
  const now = Date.now();

  // Multi-device table (supports a contact signed in on more than one phone/tablet)
  await db.prepare(
    'INSERT INTO sl_device_tokens (phone, token, updated_at) VALUES (?, ?, ?) ON CONFLICT(phone, token) DO UPDATE SET updated_at = excluded.updated_at',
  ).bind(phone, cleanToken, now).run();

  // Keep only the 5 most recent tokens per phone number to prevent stale buildup
  await db.prepare(
    `DELETE FROM sl_device_tokens WHERE phone = ? AND token NOT IN (
      SELECT token FROM sl_device_tokens WHERE phone = ? ORDER BY updated_at DESC LIMIT 5
    )`,
  ).bind(phone, phone).run().catch(() => {});

  // Legacy single-token table kept in sync for backward compatibility
  await db.prepare(
    `INSERT INTO device_tokens (phone, token, profile_token, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(phone) DO UPDATE SET token=excluded.token, profile_token=COALESCE(NULLIF(excluded.profile_token, ''), device_tokens.profile_token), updated_at=excluded.updated_at`,
  ).bind(phone, cleanToken, profileToken || '', now).run().catch(() => {});

  return { phone, saved: true };
}

export async function tokensForPhone(db: any, rawPhone: string): Promise<string[]> {
  const variants = phoneLookupVariants(rawPhone);
  if (!variants.length) return [];
  await ensureDeviceTokenTable(db);
  const placeholders = variants.map(() => '?').join(', ');

  const r1: any = await db.prepare(
    `SELECT token FROM sl_device_tokens WHERE phone IN (${placeholders}) ORDER BY updated_at DESC LIMIT 8`,
  ).bind(...variants).all().catch(() => ({ results: [] }));

  const r2: any = await db.prepare(
    `SELECT token FROM device_tokens WHERE phone IN (${placeholders}) ORDER BY updated_at DESC LIMIT 5`,
  ).bind(...variants).all().catch(() => ({ results: [] }));

  return Array.from(
    new Set(
      [
        ...((r1?.results ?? []).map((x: any) => x.token)),
        ...((r2?.results ?? []).map((x: any) => x.token)),
      ].filter((t): t is string => typeof t === 'string' && t.trim().length > 20),
    ),
  );
}

export async function tokenStatusForPhone(
  db: any,
  rawPhone: string,
): Promise<{ phone: string; registered: boolean; deviceCount: number; lastUpdated: number | null }> {
  const phone = normalizeDevicePhone(rawPhone);
  const variants = phoneLookupVariants(rawPhone);
  if (!phone || !variants.length) {
    return { phone: '', registered: false, deviceCount: 0, lastUpdated: null };
  }
  await ensureDeviceTokenTable(db);
  const placeholders = variants.map(() => '?').join(', ');

  const r1: any = await db.prepare(
    `SELECT token, updated_at FROM sl_device_tokens WHERE phone IN (${placeholders}) ORDER BY updated_at DESC LIMIT 8`,
  ).bind(...variants).all().catch(() => ({ results: [] }));
  const r2: any = await db.prepare(
    `SELECT token, updated_at FROM device_tokens WHERE phone IN (${placeholders}) ORDER BY updated_at DESC LIMIT 5`,
  ).bind(...variants).all().catch(() => ({ results: [] }));

  const seen = new Map<string, number>();
  for (const row of [...(r1?.results ?? []), ...(r2?.results ?? [])]) {
    if (row?.token && String(row.token).trim().length > 20) {
      const ts = Number(row.updated_at || 0);
      seen.set(row.token, Math.max(seen.get(row.token) || 0, ts));
    }
  }
  const timestamps = Array.from(seen.values()).filter((n) => n > 0);
  return {
    phone,
    registered: seen.size > 0,
    deviceCount: seen.size,
    lastUpdated: timestamps.length ? Math.max(...timestamps) : null,
  };
}

export async function pruneDeviceToken(db: any, token: string): Promise<void> {
  const clean = String(token || '').trim();
  if (!db || !clean) return;
  await db.prepare('DELETE FROM sl_device_tokens WHERE token = ?').bind(clean).run().catch(() => {});
  await db.prepare('DELETE FROM device_tokens WHERE token = ?').bind(clean).run().catch(() => {});
}
