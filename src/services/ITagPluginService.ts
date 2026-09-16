import { registerPlugin, Capacitor } from '@capacitor/core';

export interface ITagDevice {
  name: string;
  address: string;
  rssi: number;
  batteryLevel?: number;
}

export interface ITagPluginType {
  checkAndRequestPermissions(): Promise<{ granted: boolean }>;
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  connect(options: { address: string }): Promise<{ connected: boolean; address: string }>;
  disconnect(options: { address: string }): Promise<{ disconnected: boolean }>;
  triggerAlert(options: { address: string; level?: number }): Promise<{ success: boolean }>;
  getConnectedDevices(): Promise<{ devices: string[] }>;
  
  // Custom listeners
  addListener(
    eventName: 'itag_found',
    listenerFunc: (data: { device: ITagDevice }) => void
  ): Promise<any>;
  
  addListener(
    eventName: 'itag_connection_change',
    listenerFunc: (data: { address: string; status: 'connected' | 'disconnected' }) => void
  ): Promise<any>;
  
  addListener(
    eventName: 'hardware_trigger_pressed',
    listenerFunc: (data: { address: string; value: number }) => void
  ): Promise<any>;

  addListener(
    eventName: 'itag_warning',
    listenerFunc: (data: { warning: string }) => void
  ): Promise<any>;

  addListener(
    eventName: 'itag_rssi_update',
    listenerFunc: (data: { address: string; rssi: number }) => void
  ): Promise<any>;

  addListener(
    eventName: 'itag_battery_update',
    listenerFunc: (data: { address: string; battery: number }) => void
  ): Promise<any>;
}

export const ITagPlugin = registerPlugin<ITagPluginType>('ITagPlugin');

// Guard check to prevent throwing "not implemented on web" errors in browser context
const isNativeAvailable = Capacitor.isPluginAvailable('ITagPlugin') && Capacitor.getPlatform() !== 'web';

/**
 * Robust frontend wrapper service for the custom ITagPlugin.
 * Handles background permission checks, scanning callbacks, GATT subscriptions, 
 * button press logging, and triggering alarm sirens on connected physical iTAG keyfobs.
 */
export class ITagPluginService {
  private static listeners: any[] = [];

  /**
   * Initializes the plugin and requests dynamic Bluetooth and Location permissions.
   */
  static async init(): Promise<boolean> {
    if (!isNativeAvailable) {
      console.log('[ITagPluginService] Native BLE plugin not available on web platform. Bypassing native initialization.');
      return false;
    }
    try {
      console.log('[ITagPluginService] Initializing custom native BLE plugin...');
      const result = await ITagPlugin.checkAndRequestPermissions();
      console.log('[ITagPluginService] Native permissions status:', result);
      return result.granted;
    } catch (e) {
      console.warn('[ITagPluginService] Permissions request failed:', e);
      return false;
    }
  }

  /**
   * Starts scanning specifically for advertising iTAG devices or devices advertising 0xFFE0 service.
   * Calls onDeviceFound when a match is discovered.
   */
  static async startScanning(
    onDeviceFound: (device: ITagDevice) => void,
    onWarning?: (warning: string) => void
  ): Promise<void> {
    if (!isNativeAvailable) {
      console.log('[ITagPluginService] Scanning requested on web platform (bypassed).');
      return;
    }
    // Clear any previous scan/found listeners to prevent duplicates
    await this.stopListening();

    const listener = await ITagPlugin.addListener('itag_found', (data) => {
      console.log('[ITagPluginService] Discovered matching iTAG node:', data.device);
      onDeviceFound(data.device);
    });
    this.listeners.push(listener);

    if (onWarning) {
      const warnListener = await ITagPlugin.addListener('itag_warning', (data) => {
        console.warn('[ITagPluginService] Native warning received:', data.warning);
        onWarning(data.warning);
      });
      this.listeners.push(warnListener);
    }

    await ITagPlugin.startScan();
  }

  /**
   * Stops the native BLE scanning process.
   */
  static async stopScanning(): Promise<void> {
    if (!isNativeAvailable) {
      console.log('[ITagPluginService] Stop scanning requested on web platform (bypassed).');
      return;
    }
    try {
      await ITagPlugin.stopScan();
      console.log('[ITagPluginService] Scanning stopped.');
    } catch (e) {
      console.warn('[ITagPluginService] Error stopping scan:', e);
    }
  }

  /**
   * Connects to a specific iTAG device and registers state changes and button triggers.
   */
  static async connectDevice(
    address: string,
    onConnectionChange?: (status: 'connected' | 'disconnected') => void,
    onButtonPressed?: (value: number) => void,
    onBatteryUpdate?: (battery: number) => void,
    onRssiUpdate?: (rssi: number) => void
  ): Promise<boolean> {
    if (!isNativeAvailable) {
      console.log(`[ITagPluginService] Connection to ${address} failed: Native BLE is only supported on native mobile platforms.`);
      return false;
    }
    try {
      console.log(`[ITagPluginService] Connecting to device at ${address}...`);

      if (onConnectionChange) {
        const connListener = await ITagPlugin.addListener('itag_connection_change', (data) => {
          if (data.address.toLowerCase() === address.toLowerCase()) {
            console.log(`[ITagPluginService] Connection state change for ${address}: ${data.status}`);
            onConnectionChange(data.status);
          }
        });
        this.listeners.push(connListener);
      }

      if (onButtonPressed) {
        const pressListener = await ITagPlugin.addListener('hardware_trigger_pressed', (data) => {
          if (data.address.toLowerCase() === address.toLowerCase()) {
            console.log(`[ITagPluginService] Physical button pressed on ${address} with code: ${data.value}`);
            onButtonPressed(data.value);
          }
        });
        this.listeners.push(pressListener);
      }

      if (onBatteryUpdate) {
        const batteryListener = await ITagPlugin.addListener('itag_battery_update', (data) => {
          if (data.address.toLowerCase() === address.toLowerCase()) {
            console.log(`[ITagPluginService] Battery level read for ${address}: ${data.battery}%`);
            onBatteryUpdate(data.battery);
          }
        });
        this.listeners.push(batteryListener);
      }

      if (onRssiUpdate) {
        const rssiListener = await ITagPlugin.addListener('itag_rssi_update', (data) => {
          if (data.address.toLowerCase() === address.toLowerCase()) {
            console.log(`[ITagPluginService] RSSI update for ${address}: ${data.rssi} dBm`);
            onRssiUpdate(data.rssi);
          }
        });
        this.listeners.push(rssiListener);
      }

      const res = await ITagPlugin.connect({ address });
      return res.connected;
    } catch (e) {
      console.warn(`[ITagPluginService] Failed to establish GATT connection to ${address}:`, e);
      return false;
    }
  }

  /**
   * Disconnects a connected iTAG device.
   */
  static async disconnectDevice(address: string): Promise<boolean> {
    if (!isNativeAvailable) {
      console.log(`[ITagPluginService] Disconnection from ${address} simulated on web.`);
      return true;
    }
    try {
      console.log(`[ITagPluginService] Terminating connection with device: ${address}`);
      const res = await ITagPlugin.disconnect({ address });
      return res.disconnected;
    } catch (e) {
      console.warn(`[ITagPluginService] Disconnect command failed for ${address}:`, e);
      return false;
    }
  }

  /**
   * Commands the physical iTAG to beep on-demand via the Immediate Alert characteristic.
   * @param address Mac address of the connected iTAG keyfob
   * @param level Alert level: 0 = silent, 1 = mild beep, 2 = high-frequency beep
   */
  static async ringDevice(address: string, level: number = 2): Promise<boolean> {
    if (!isNativeAvailable) {
      console.log(`[ITagPluginService] Ring device ${address} level ${level} simulated on web.`);
      return true;
    }
    try {
      console.log(`[ITagPluginService] Triggering alert beep level ${level} on iTAG: ${address}`);
      const res = await ITagPlugin.triggerAlert({ address, level });
      return res.success;
    } catch (e) {
      console.warn(`[ITagPluginService] Immediate Alert write failed for ${address}:`, e);
      return false;
    }
  }

  /**
   * Retrieves an array of MAC addresses for all currently active native connection handles.
   */
  static async getActiveConnections(): Promise<string[]> {
    if (!isNativeAvailable) {
      return [];
    }
    try {
      const res = await ITagPlugin.getConnectedDevices();
      return res.devices;
    } catch (e) {
      console.warn('[ITagPluginService] Failed to fetch active connections:', e);
      return [];
    }
  }

  /**
   * Dispose of all active event listeners.
   */
  static async stopListening(): Promise<void> {
    if (!isNativeAvailable) {
      return;
    }
    for (const listener of this.listeners) {
      try {
        if (listener && typeof listener.remove === 'function') {
          await listener.remove();
        }
      } catch (e) {
        console.warn('[ITagPluginService] Error removing event listener:', e);
      }
    }
    this.listeners = [];
  }
}
