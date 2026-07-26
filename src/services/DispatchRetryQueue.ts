/**
 * DispatchRetryQueue
 *
 * Persists failed panic dispatch attempts to IndexedDB and retries them
 * when connectivity is restored. Survives app restarts and mid-dispatch crashes.
 *
 * Design:
 *  - Each failed SMS/voice attempt is queued as a PendingDispatch entry.
 *  - `flush()` is called on app start and on network reconnect.
 *  - Exponential backoff prevents hammering a temporarily unreachable endpoint.
 *  - Max 3 attempts per entry; after that the entry is marked FAILED and kept
 *    for audit (not retried again).
 */

const DB_NAME = 'safetylink_dispatch_queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_dispatches';

export type DispatchType = 'sms' | 'voice';
export type DispatchStatus = 'pending' | 'failed';

export interface PendingDispatch {
  id: string;
  type: DispatchType;
  to: string;
  from: string;
  message: string;
  lat: number;
  lng: number;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number; // epoch ms
  status: DispatchStatus;
  queuedAt: number;
  incidentId: string;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, item: PendingDispatch): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbGetAll(db: IDBDatabase): Promise<PendingDispatch[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as PendingDispatch[]);
    req.onerror = () => reject(req.error);
  });
}

// ─── Backoff calculator ───────────────────────────────────────────────────────

/**
 * Returns next retry timestamp using exponential backoff with jitter.
 * Attempt 1 →  30s ± jitter
 * Attempt 2 →  60s ± jitter
 * Attempt 3 → 120s ± jitter
 */
function nextRetryTimestamp(attempt: number): number {
  const baseMs = Math.min(30_000 * Math.pow(2, attempt - 1), 300_000);
  const jitter = Math.random() * 10_000;
  return Date.now() + baseMs + jitter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a failed dispatch to the persistent retry queue.
 */
export async function enqueueDispatch(
  entry: Omit<PendingDispatch, 'id' | 'attempts' | 'maxAttempts' | 'nextRetryAt' | 'status' | 'queuedAt'>
): Promise<void> {
  try {
    const db = await openDB();
    const item: PendingDispatch = {
      ...entry,
      id: `${entry.incidentId}_${entry.type}_${entry.to}_${Date.now()}`,
      attempts: 0,
      maxAttempts: 3,
      nextRetryAt: nextRetryTimestamp(1),
      status: 'pending',
      queuedAt: Date.now(),
    };
    await dbPut(db, item);
    db.close();
    console.log('[DispatchRetryQueue] Enqueued:', item.id);
  } catch (e) {
    console.error('[DispatchRetryQueue] enqueue failed:', e);
  }
}

/**
 * Flush all pending dispatches whose nextRetryAt is now in the past.
 * Pass in the actual dispatch functions (SMS and voice).
 *
 * Returns number of successfully dispatched entries.
 */
export async function flushQueue(
  sendSms: (from: string, to: string, message: string) => Promise<boolean>,
  triggerVoice: (from: string, to: string, lat: number, lng: number, message: string) => Promise<boolean>
): Promise<number> {
  let successCount = 0;
  try {
    const db = await openDB();
    const all = await dbGetAll(db);
    const due = all.filter(
      (e) => e.status === 'pending' && e.nextRetryAt <= Date.now()
    );

    for (const entry of due) {
      entry.attempts += 1;
      let ok = false;

      try {
        if (entry.type === 'sms') {
          ok = await sendSms(entry.from, entry.to, entry.message);
        } else {
          ok = await triggerVoice(entry.from, entry.to, entry.lat, entry.lng, entry.message);
        }
      } catch {
        ok = false;
      }

      if (ok) {
        // Remove successful entry
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(entry.id);
        successCount++;
        console.log('[DispatchRetryQueue] Delivered and removed:', entry.id);
      } else if (entry.attempts >= entry.maxAttempts) {
        entry.status = 'failed';
        await dbPut(db, entry);
        console.warn('[DispatchRetryQueue] Max attempts reached, marked FAILED:', entry.id);
      } else {
        entry.nextRetryAt = nextRetryTimestamp(entry.attempts + 1);
        await dbPut(db, entry);
        console.log('[DispatchRetryQueue] Will retry at', new Date(entry.nextRetryAt).toISOString(), entry.id);
      }
    }

    db.close();
  } catch (e) {
    console.error('[DispatchRetryQueue] flush failed:', e);
  }
  return successCount;
}

/**
 * Returns all queue entries for display in the audit log / admin panel.
 */
export async function getQueueSnapshot(): Promise<PendingDispatch[]> {
  try {
    const db = await openDB();
    const all = await dbGetAll(db);
    db.close();
    return all;
  } catch {
    return [];
  }
}

/**
 * Call on app startup and on window 'online' events.
 */
export function registerNetworkFlushListener(
  sendSms: (from: string, to: string, message: string) => Promise<boolean>,
  triggerVoice: (from: string, to: string, lat: number, lng: number, message: string) => Promise<boolean>
): () => void {
  const handler = () => {
    console.log('[DispatchRetryQueue] Network online — flushing queue');
    flushQueue(sendSms, triggerVoice).catch(console.error);
  };
  window.addEventListener('online', handler);
  // Also flush immediately in case we're already online
  if (navigator.onLine) handler();
  return () => window.removeEventListener('online', handler);
}
