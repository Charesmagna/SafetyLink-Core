// worker/src/qr-link.ts
// Short-lived QR code pairing & optional Two-Way / One-Way mutual emergency contact linking
// so SafetyLink users can scan each other's QR codes and instantly verify FCM readiness.

import { normalizeDevicePhone, phoneLookupVariants, tokenStatusForPhone } from './device-tokens';

const LINK_TTL_MS = 15 * 60_000; // 15 minutes
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let qrTablesReady = false;

export async function ensureQrLinkTables(db: any) {
  if (qrTablesReady || !db) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS sl_qr_links (
      code TEXT PRIMARY KEY,
      owner_phone TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sl_mutual_links (
      id TEXT PRIMARY KEY,
      target_phone TEXT NOT NULL,
      linked_phone TEXT NOT NULL,
      linked_name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'TWO_WAY',
      created_at INTEGER NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sl_mutual_target ON sl_mutual_links(target_phone, acknowledged, created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sl_profiles (
      phone TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL,
      lng REAL,
      token TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      alert_note TEXT DEFAULT ''
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS sl_contacts (
      id TEXT PRIMARY KEY,
      owner_phone TEXT NOT NULL,
      name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    )`),
  ]);
  qrTablesReady = true;
}

function generatePairingCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = 'SL-';
  for (let i = 0; i < bytes.length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

async function addContactToServerProfile(db: any, ownerPhone: string, ownerName: string, contactPhone: string, contactName: string) {
  const now = Date.now();
  const existingProfile = await db
    .prepare('SELECT phone FROM sl_profiles WHERE phone = ?')
    .bind(ownerPhone)
    .first() as { phone: string } | null;

  if (!existingProfile) {
    await db
      .prepare('INSERT INTO sl_profiles (phone, name, lat, lng, token, updated_at) VALUES (?, ?, NULL, NULL, ?, ?)')
      .bind(ownerPhone, ownerName || 'SafetyLink Member', crypto.randomUUID(), now)
      .run();
  }

  const existingContacts = await db
    .prepare('SELECT contact_phone, sort_order FROM sl_contacts WHERE owner_phone = ?')
    .bind(ownerPhone)
    .all() as { results?: { contact_phone: string; sort_order: number }[] };

  const rows = existingContacts?.results || [];
  const normalizedTarget = normalizeDevicePhone(contactPhone);
  const alreadyExists = rows.some((r: any) => normalizeDevicePhone(r.contact_phone) === normalizedTarget);
  if (!alreadyExists && normalizedTarget) {
    const nextOrder = rows.length;
    await db
      .prepare('INSERT INTO sl_contacts (id, owner_phone, name, contact_phone, sort_order) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), ownerPhone, (contactName || 'Emergency Contact').slice(0, 60), normalizedTarget, nextOrder)
      .run();
  }
}

export async function createQrLink(db: any, rawPhone: string, rawName: string) {
  const phone = normalizeDevicePhone(rawPhone);
  if (!phone || phone.length < 10) {
    return { status: 400, json: { ok: false, error: 'Valid phone number is required to generate a SafetyLink QR code.' } };
  }
  await ensureQrLinkTables(db);
  const now = Date.now();
  const expiresAt = now + LINK_TTL_MS;
  const name = String(rawName || 'SafetyLink Member').trim().slice(0, 60) || 'SafetyLink Member';
  const code = generatePairingCode();

  // Opportunistic cleanup of expired codes
  await db.prepare('DELETE FROM sl_qr_links WHERE expires_at < ?').bind(now).run().catch(() => {});

  await db
    .prepare('INSERT INTO sl_qr_links (code, owner_phone, owner_name, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(code, phone, name, now, expiresAt)
    .run();

  const fcmStatus = await tokenStatusForPhone(db, phone);
  return {
    status: 200,
    json: {
      ok: true,
      code,
      phone,
      name,
      expiresAt,
      fcmStatus,
    },
  };
}

export async function resolveQrLink(db: any, rawCode: string) {
  const cleanCode = String(rawCode || '').trim().toUpperCase();
  if (!/^SL-[A-Z0-9]{6}$/.test(cleanCode)) {
    return { status: 400, json: { ok: false, error: 'Invalid pairing code format (expected SL-XXXXXX).' } };
  }
  await ensureQrLinkTables(db);
  const row = await db
    .prepare('SELECT code, owner_phone, owner_name, expires_at FROM sl_qr_links WHERE code = ?')
    .bind(cleanCode)
    .first() as { code: string; owner_phone: string; owner_name: string; expires_at: number } | null;

  if (!row || Number(row.expires_at) < Date.now()) {
    return { status: 404, json: { ok: false, error: 'Pairing code expired or not found. Ask your contact to refresh their QR code.' } };
  }
  const fcmStatus = await tokenStatusForPhone(db, row.owner_phone);
  return {
    status: 200,
    json: {
      ok: true,
      code: row.code,
      phone: row.owner_phone,
      name: row.owner_name,
      expiresAt: row.expires_at,
      fcmStatus,
    },
  };
}

export async function claimQrLink(
  db: any,
  body: {
    code?: string;
    targetPhone?: string;
    targetName?: string;
    scannerPhone?: string;
    scannerName?: string;
    mode?: string;
  },
) {
  await ensureQrLinkTables(db);
  const scannerPhone = normalizeDevicePhone(body.scannerPhone || '');
  const scannerName = String(body.scannerName || 'SafetyLink Contact').trim().slice(0, 60) || 'SafetyLink Contact';
  const mode = String(body.mode || 'TWO_WAY').toUpperCase() === 'ONE_WAY' ? 'ONE_WAY' : 'TWO_WAY';

  if (!scannerPhone || scannerPhone.length < 10) {
    return { status: 400, json: { ok: false, error: 'Your SafetyLink profile must have a valid phone number before linking.' } };
  }

  let targetPhone = normalizeDevicePhone(body.targetPhone || '');
  let targetName = String(body.targetName || '').trim().slice(0, 60);

  const cleanCode = String(body.code || '').trim().toUpperCase();
  if (cleanCode && /^SL-[A-Z0-9]{6}$/.test(cleanCode)) {
    const row = await db
      .prepare('SELECT owner_phone, owner_name, expires_at FROM sl_qr_links WHERE code = ?')
      .bind(cleanCode)
      .first() as { owner_phone: string; owner_name: string; expires_at: number } | null;
    if (row && Number(row.expires_at) >= Date.now()) {
      targetPhone = normalizeDevicePhone(row.owner_phone);
      targetName = row.owner_name || targetName;
    }
  }

  if (!targetPhone || targetPhone.length < 10) {
    return { status: 400, json: { ok: false, error: 'Scanned QR code did not contain a valid SafetyLink phone number.' } };
  }
  if (targetPhone === scannerPhone) {
    return { status: 400, json: { ok: false, error: 'You cannot link your own phone number as a contact.' } };
  }
  if (!targetName) targetName = 'SafetyLink Contact';

  // 1. Always add scanned target into scanner's server-side contacts
  await addContactToServerProfile(db, scannerPhone, scannerName, targetPhone, targetName);

  // 2. If TWO_WAY mutual link, ALSO add scanner into target's server-side contacts & queue client notification
  if (mode === 'TWO_WAY') {
    await addContactToServerProfile(db, targetPhone, targetName, scannerPhone, scannerName);
    await db
      .prepare(
        `INSERT INTO sl_mutual_links (id, target_phone, linked_phone, linked_name, mode, created_at, acknowledged)
         VALUES (?, ?, ?, ?, 'TWO_WAY', ?, 0)`,
      )
      .bind(crypto.randomUUID(), targetPhone, scannerPhone, scannerName, Date.now())
      .run();
  }

  const [targetFcm, scannerFcm] = await Promise.all([
    tokenStatusForPhone(db, targetPhone),
    tokenStatusForPhone(db, scannerPhone),
  ]);

  return {
    status: 200,
    json: {
      ok: true,
      mode,
      mutualQueued: mode === 'TWO_WAY',
      target: { phone: targetPhone, name: targetName, fcmStatus: targetFcm },
      scanner: { phone: scannerPhone, name: scannerName, fcmStatus: scannerFcm },
    },
  };
}

export async function getIncomingMutualLinks(db: any, rawPhone: string, acknowledge = false) {
  const variants = phoneLookupVariants(rawPhone);
  if (!variants.length) {
    return { status: 400, json: { ok: false, error: 'phone query parameter is required' } };
  }
  await ensureQrLinkTables(db);
  const placeholders = variants.map(() => '?').join(', ');
  const res = await db
    .prepare(
      `SELECT id, linked_phone, linked_name, mode, created_at
       FROM sl_mutual_links
       WHERE target_phone IN (${placeholders}) AND acknowledged = 0
       ORDER BY created_at DESC LIMIT 20`,
    )
    .bind(...variants)
    .all() as { results?: { id: string; linked_phone: string; linked_name: string; mode: string; created_at: number }[] };

  const links = res?.results || [];
  if (acknowledge && links.length > 0) {
    for (const row of links) {
      await db.prepare('UPDATE sl_mutual_links SET acknowledged = 1 WHERE id = ?').bind(row.id).run().catch(() => {});
    }
  }

  return {
    status: 200,
    json: {
      ok: true,
      links: links.map((l: any) => ({
        id: l.id,
        phone: l.linked_phone,
        name: l.linked_name,
        mode: l.mode,
        createdAt: l.created_at,
      })),
    },
  };
}
