// worker/src/device-tokens.ts
// Stores each phone's FCM device token, keyed by the phone's SafetyLink number.

export async function ensureDeviceTokenTable(db: any) {
  await db.prepare(
    'CREATE TABLE IF NOT EXISTS sl_device_tokens (phone TEXT NOT NULL, token TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (phone, token))',
  ).run();
}

export async function saveDeviceToken(db: any, phone: string, token: string) {
  await ensureDeviceTokenTable(db);
  await db.prepare(
    'INSERT INTO sl_device_tokens (phone, token, updated_at) VALUES (?, ?, ?) ON CONFLICT(phone, token) DO UPDATE SET updated_at = excluded.updated_at',
  ).bind(phone, token, Date.now()).run();
}

export async function tokensForPhone(db: any, phone: string): Promise<string[]> {
  await ensureDeviceTokenTable(db);
  const r = await db.prepare('SELECT token FROM sl_device_tokens WHERE phone = ?').bind(phone).all();
  return (r?.results ?? []).map((x: any) => x.token);
}
