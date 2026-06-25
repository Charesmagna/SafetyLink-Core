const Offline = {
  DB_NAME:    'safetylink_offline',
  DB_VERSION: 1,
  db:         null,
  STORES:     ['alerts_queue','gps_queue','hardware_queue','messages_queue'],

  async init() {
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        this.STORES.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            db.createObjectStore(s, { keyPath: 'id' });
          }
        });
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
    window.addEventListener('online', () => this.flush());
    if (navigator.onLine) this.flush();
  },

  async queue(store, item) {
    if (!this.db) return;
    const record = {
      id:         'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
      payload:    item,
      created_at: Date.now(),
      retries:    0,
      last_error: null,
    };
    await this._put(store, record);
  },

  async flush() {
    if (!this.db || !navigator.onLine) return;
    for (const store of this.STORES) {
      const items = await this._getAll(store);
      for (const item of items) {
        if (item.retries >= 10) { await this._delete(store, item.id); continue; }
        try {
          const { url, method, body } = item.payload;
          const res = await fetch(App.api + url, {
            method:  method || 'POST',
            headers: Auth.headers(),
            body:    JSON.stringify(body),
          });
          if (res.ok || res.status < 500) {
            await this._delete(store, item.id);
          } else {
            item.retries++;
            item.last_error = 'HTTP ' + res.status;
            await this._put(store, item);
          }
        } catch (err) {
          item.retries++;
          item.last_error = err.message;
          await this._put(store, item);
        }
      }
    }
  },

  _put(store, record) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put(record);
      req.onsuccess = resolve;
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  _getAll(store) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  _delete(store, id) {
    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(id);
      req.onsuccess = resolve;
      req.onerror   = (e) => reject(e.target.error);
    });
  },
};
