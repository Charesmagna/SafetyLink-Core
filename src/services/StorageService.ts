/**
 * FIX #4: localStorage Parse on Every Access
 * Implements a Map-based cache to avoid repeated JSON parsing.
 * Previously: getStoredJSON() re-parsed the entire JSON on every access
 * Now: Caches parsed values in memory
 */

class StorageCache {
  private cache = new Map<string, any>();
  private isDirty = new Map<string, boolean>();

  /**
   * Get value from cache or localStorage
   */
  get<T>(key: string, fallback: T): T {
    // Return cached value if available
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // Parse from localStorage
    try {
      const item = localStorage.getItem(key);
      const value = item ? JSON.parse(item) : fallback;
      this.cache.set(key, value);
      this.isDirty.set(key, false);
      return value as T;
    } catch (err) {
      console.warn(`[StorageCache] Failed to parse ${key}:`, err);
      return fallback;
    }
  }

  /**
   * Set value in cache and mark dirty for sync
   */
  set<T>(key: string, value: T): void {
    this.cache.set(key, value);
    this.isDirty.set(key, true);
    // Write to localStorage asynchronously to avoid blocking
    Promise.resolve().then(() => this.flush(key));
  }

  /**
   * Flush dirty keys to localStorage
   */
  private flush(key: string): void {
    if (this.isDirty.get(key)) {
      try {
        const value = this.cache.get(key);
        localStorage.setItem(key, JSON.stringify(value));
        this.isDirty.set(key, false);
      } catch (err) {
        console.error(`[StorageCache] Failed to write ${key}:`, err);
      }
    }
  }

  /**
   * Clear cache (useful on logout)
   */
  clear(): void {
    this.cache.clear();
    this.isDirty.clear();
  }
}

export const storageCache = new StorageCache();
