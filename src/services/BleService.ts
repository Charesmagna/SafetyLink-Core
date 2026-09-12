/**
 * FIX #9: BLE Scan Leak on Error
 * Implements state machine with guaranteed cleanup on error.
 * Previously: Scan didn't stop if error occurred during requestLEScan
 */

type ScanState = 'IDLE' | 'SCANNING' | 'STOPPING';

class BleScanner {
  private state: ScanState = 'IDLE';
  private scanAbortController: AbortController | null = null;

  /**
   * Start BLE scan with guaranteed cleanup
   */
  async startScan(
    onDeviceFound: (device: any) => void,
    timeout: number = 15000
  ): Promise<void> {
    // Prevent multiple concurrent scans
    if (this.state !== 'IDLE') {
      throw new Error('Scan already in progress');
    }

    this.state = 'SCANNING';
    this.scanAbortController = new AbortController();

    try {
      const timeout_id = setTimeout(() => this.stopScan(), timeout);

      // Request BLE scan (Capacitor plugin)
      const devices = await (window as any).BLE?.requestLEScan?.({
        allowDuplicates: false,
        signal: this.scanAbortController.signal
      });

      clearTimeout(timeout_id);

      if (devices && Array.isArray(devices)) {
        devices.forEach(onDeviceFound);
      }
    } catch (error) {
      // Guaranteed cleanup on error
      console.error('[BleScanner] Scan error:', error);
      this.stopScan();
      throw error;
    }
  }

  /**
   * Stop scan with proper state transition
   */
  stopScan(): void {
    if (this.state === 'IDLE') return;

    this.state = 'STOPPING';

    // Abort the scan
    if (this.scanAbortController) {
      this.scanAbortController.abort();
      this.scanAbortController = null;
    }

    // Call native stop if available
    (window as any).BLE?.stopLEScan?.()?.catch((err: Error) => {
      console.warn('[BleScanner] Error stopping scan:', err);
    });

    this.state = 'IDLE';
  }

  /**
   * Get current scan state
   */
  getState(): ScanState {
    return this.state;
  }
}

export const bleScanner = new BleScanner();
