/**
 * SAFETY-LINK Offline Queue — IndexedDB backed store-and-forward engine.
 * Queues incidents, GPS updates, and hardware events when the backend is unreachable.
 * Retries automatically when connectivity is restored.
 */

const DB_NAME    = 'safetylink_offline';
const DB_VERSION = 1;
const STORES     = ['alerts', 'location', 'hardware_events', 'audit'];

let db = null;

/* ── Open DB ── */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const idb = e.target.result;
      STORES.forEach(store => {
        if (!idb.objectStoreNames.contains(store)) {
          idb.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        }
      });
    };

    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── Enqueue ── */
export async function enqueueOffline(storeName, payload) {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = idb.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add({
      ...payload,
      _queuedAt: new Date().toISOString(),
      _attempts: 0,
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/* ── Get all pending ── */
export async function getPending(storeName) {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = idb.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/* ── Delete after successful sync ── */
export async function removeFromQueue(storeName, id) {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = idb.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/* ── Update attempt count ── */
async function incrementAttempts(storeName, record) {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = idb.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put({ ...record, _attempts: (record._attempts || 0) + 1 });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/* ── Sync engine ── */
const MAX_ATTEMPTS = 10;

export async function syncStore(storeName, endpoint, getToken) {
  const pending = await getPending(storeName);
  for (const item of pending) {
    if (item._attempts >= MAX_ATTEMPTS) {
      await removeFromQueue(storeName, item.id);
      continue;
    }
    try {
      const token = getToken ? getToken() : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const { id: _id, _queuedAt, _attempts, ...payload } = item;
      const res = await fetch(endpoint, {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload),
      });

      if (res.ok) {
        await removeFromQueue(storeName, item.id);
      } else {
        await incrementAttempts(storeName, item);
      }
    } catch {
      await incrementAttempts(storeName, item);
    }
  }
}

/* ── Full sync cycle ── */
export async function syncAll(apiBase, getToken) {
  if (!navigator.onLine) return;
  await syncStore('alerts',          `${apiBase}/alerts`,   getToken);
  await syncStore('location',        `${apiBase}/location`, getToken);
  await syncStore('hardware_events', `${apiBase}/hardware/register`, getToken);
}

/* ── Auto-retry on connectivity ── */
export function startSyncWorker(apiBase, getToken, intervalMs = 30000) {
  const run = () => syncAll(apiBase, getToken).catch(() => {});
  window.addEventListener('online', run);
  const tid = setInterval(run, intervalMs);
  run();
  return () => {
    clearInterval(tid);
    window.removeEventListener('online', run);
  };
}

/* ── Queue helpers for common events ── */
export function queueAlert(apiBase, payload, getToken) {
  return enqueueOffline('alerts', payload).catch(() => {});
}

export function queueLocation(payload) {
  return enqueueOffline('location', payload).catch(() => {});
}

export function queueHardwareEvent(payload) {
  return enqueueOffline('hardware_events', payload).catch(() => {});
}

export function getQueueSize(storeName) {
  return getPending(storeName).then(items => items.length).catch(() => 0);
}
