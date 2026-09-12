/**
 * FIX #6: Multiple Geolocation Polls
 * Implements GeolocationCacheService singleton to deduplicate polls.
 * Previously: Components independently called navigator.geolocation.getCurrentPosition()
 * Now: Single service handles all geolocation requests with caching
 */

interface GeolocationCache {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

class GeolocationCacheService {
  private static instance: GeolocationCacheService;
  private cache: GeolocationCache | null = null;
  private listeners = new Set<(pos: GeolocationCoordinates) => void>();
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private cacheExpiry = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): GeolocationCacheService {
    if (!GeolocationCacheService.instance) {
      GeolocationCacheService.instance = new GeolocationCacheService();
    }
    return GeolocationCacheService.instance;
  }

  /**
   * Get current location (cached if fresh)
   */
  async getCurrentPosition(): Promise<GeolocationCoordinates> {
    // Return cached if still fresh
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheExpiry) {
      return {
        latitude: this.cache.lat,
        longitude: this.cache.lng,
        accuracy: this.cache.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      };
    }

    // Fetch fresh position
    return new Promise((resolve, reject) => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          this.updateCache(pos.coords);
          resolve(pos.coords);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Subscribe to location updates
   */
  subscribe(callback: (pos: GeolocationCoordinates) => void): () => void {
    this.listeners.add(callback);

    // Start polling if this is the first subscriber
    if (this.listeners.size === 1) {
      this.startPolling();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = () => {
      this.getCurrentPosition()
        .then((coords) => {
          this.listeners.forEach((cb) => cb(coords));
        })
        .catch((err) => console.warn('[GeolocationCache] Poll error:', err))
        .finally(() => {
          this.pollInterval = setTimeout(poll, this.cacheExpiry);
        });
    };

    poll();
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  private updateCache(coords: GeolocationCoordinates): void {
    this.cache = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy || 0,
      timestamp: Date.now()
    };
  }
}

export const geolocationService = GeolocationCacheService.getInstance();
