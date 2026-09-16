/**
 * FIX #3: Satellite Telemetry Poll Without Backoff
 * Adds exponential backoff to polling to reduce aggressive API hammering.
 * Previously: Polled every 5 seconds indefinitely
 * Now: Starts at 5s, backs off to 30s max on consecutive errors
 */

interface BackoffConfig {
  initialDelay: number; // ms
  maxDelay: number; // ms
  multiplier: number;
  maxRetries: number;
}

const defaultConfig: BackoffConfig = {
  initialDelay: 5000,
  maxDelay: 30000,
  multiplier: 1.5,
  maxRetries: 10
};

export class SatellitePoller {
  private pollInterval: NodeJS.Timeout | null = null;
  private currentDelay: number;
  private consecutiveErrors = 0;
  private controller: AbortController | null = null;

  constructor(private config: BackoffConfig = defaultConfig) {
    this.currentDelay = config.initialDelay;
  }

  /**
   * Start polling with exponential backoff
   */
  async startPolling(callback: (data: any) => void, onError: (error: Error) => void) {
    const poll = async () => {
      try {
        this.controller = new AbortController();
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
          signal: this.controller.signal,
          method: 'GET'
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        callback(data);
        
        // Reset backoff on success
        this.consecutiveErrors = 0;
        this.currentDelay = this.config.initialDelay;
      } catch (error) {
        this.consecutiveErrors++;
        if (this.consecutiveErrors <= this.config.maxRetries) {
          // Exponential backoff
          this.currentDelay = Math.min(
            this.config.maxDelay,
            this.currentDelay * this.config.multiplier
          );
          onError(error instanceof Error ? error : new Error(String(error)));
        } else {
          onError(new Error('Max retries exceeded'));
        }
      }
      
      // Schedule next poll with current delay
      this.pollInterval = setTimeout(poll, this.currentDelay);
    };

    // Start immediately
    poll();
  }

  /**
   * Stop polling and cleanup
   */
  stopPolling() {
    if (this.pollInterval) {
      clearTimeout(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}
