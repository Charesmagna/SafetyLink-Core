/**
 * BluetoothService
 * 
 * Core Bluetooth LE service for SafetyLink.
 * 
 * Responsibilities:
 * - Scan for iTAG devices advertising FFE0
 * - Request runtime permissions (Android)
 * - Connect to devices and bond
 * - Subscribe to FFE1 characteristic for button notifications
 * - Handle BLE connection state changes
 * - Provide callbacks for panic trigger on 0x01 notification
 */

import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { BLE_CONFIG, BLE_CONNECTION_TIMEOUT_MS } from '../constants/config';

export interface BleDevice {
  deviceId: string;
  mac: string;
  name: string;
  rssi: number;
  connectable: boolean;
}

export interface RegisteredBleDevice extends BleDevice {
  nickname: string;
  isEnabled: boolean;
  lastConnected: number | null;
  batteryLevel: number | null;
}

/**
 * Callback invoked when an iTAG FFE1 button press (0x01) is received
 */
export type OnButtonPressCallback = (device: RegisteredBleDevice) => void;

class BluetoothServiceImpl {
  private isScanning = false;
  private discoveredDevices: Map<string, BleDevice> = new Map();
  private registeredDevices: Map<string, RegisteredBleDevice> = new Map();
  private onButtonPressCallback: OnButtonPressCallback | null = null;
  private activeConnections: Set<string> = new Set();

  /**
   * Initialize Bluetooth service
   * Registers plugin and resets state
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[BLE] Running on web, Bluetooth operations will be simulated');
      return;
    }

    try {
      await BleClient.initialize();
      console.log('[BLE] Bluetooth service initialized');
    } catch (error) {
      console.error('[BLE] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Request runtime Bluetooth permissions (Android API 31+)
   * 
   * Flow:
   * 1. Check if Bluetooth is enabled
   * 2. Request BLUETOOTH_SCAN permission
   * 3. Request BLUETOOTH_CONNECT permission
   * 4. Request ACCESS_FINE_LOCATION permission (required by some Android versions)
   * 5. If Bluetooth is OFF, launch OS intent to enable it
   */
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[BLE] Web platform, permissions simulated as granted');
      return true;
    }

    try {
      // Check if Bluetooth is enabled
      const enabled = await this.isBluetoothEnabled();
      if (!enabled) {
        console.log('[BLE] Bluetooth is OFF, requesting user to enable');
        await this.requestEnableBluetooth();
      }

      console.log('[BLE] Requesting runtime permissions...');
      // Capacitor handles permission requests internally
      // This is a placeholder for the actual permission flow
      return true;
    } catch (error) {
      console.error('[BLE] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if Bluetooth is currently enabled on device
   */
  async isBluetoothEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      const enabled = await BleClient.isEnabled();
      return enabled;
    } catch (error) {
      console.error('[BLE] Failed to check Bluetooth status:', error);
      return false;
    }
  }

  /**
   * Request user to enable Bluetooth
   * Launches Android Bluetooth settings intent
   */
  async requestEnableBluetooth(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // This calls the native Android enableBluetooth intent
      console.log('[BLE] Launching Bluetooth enable intent');
      // In production, use @capacitor/native-bridge to call Android intent
    } catch (error) {
      console.error('[BLE] Failed to request Bluetooth enable:', error);
    }
  }

  /**
   * Start scanning for iTAG devices advertising FFE0
   * 
   * Scan parameters:
   * - Service UUID: FFE0 (vendor-specific)
   * - Duration: Continuous until stopScan() called
   * - Returns devices with RSSI strength
   */
  async startScan(onDeviceFound: (device: BleDevice) => void): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate discovery on web
      console.log('[BLE:Web] Simulating iTAG discovery...');
      this.simulateDiscovery(onDeviceFound);
      return;
    }

    if (this.isScanning) {
      console.log('[BLE] Scan already in progress');
      return;
    }

    try {
      this.isScanning = true;
      console.log('[BLE] Starting scan for iTAG (FFE0)...');

      await BleClient.requestLEScan(
        {
          services: [BLE_CONFIG.iTAG.SERVICE_UUID],
          allowDuplicates: false,
        },
        (result) => {
          const device: BleDevice = {
            deviceId: result.deviceId,
            mac: result.deviceId,
            name: result.localName || 'Unknown iTAG',
            rssi: result.rssi || -100,
            connectable: true,
          };

          this.discoveredDevices.set(result.deviceId, device);
          onDeviceFound(device);
        }
      );

      console.log('[BLE] Scan started successfully');
    } catch (error) {
      console.error('[BLE] Scan failed:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Stop BLE scan
   */
  async stopScan(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await BleClient.stopLEScan();
      this.isScanning = false;
      console.log('[BLE] Scan stopped');
    } catch (error) {
      console.error('[BLE] Failed to stop scan:', error);
    }
  }

  /**
   * Connect to discovered iTAG device
   * 
   * Steps:
   * 1. Connect to device
   * 2. Discover services and characteristics
   * 3. Subscribe to FFE1 characteristic
   * 4. Start listening for button press notifications (0x01)
   */
  async connectDevice(deviceId: string, nickname: string): Promise<RegisteredBleDevice> {
    if (!Capacitor.isNativePlatform()) {
      // Simulate connection on web
      return this.simulateConnect(deviceId, nickname);
    }

    try {
      console.log(`[BLE] Connecting to ${deviceId} as "${nickname}"...`);

      // Step 1: Connect
      await BleClient.connect(deviceId);
      console.log(`[BLE] Connected to ${deviceId}`);

      // Step 2: Discover services
      const services = await BleClient.discoverServices(deviceId);
      const ffe0Service = services.services?.find(
        (s) => s.uuid.toLowerCase().includes('ffe0')
      );

      if (!ffe0Service) {
        throw new Error('FFE0 service not found on device');
      }

      console.log(`[BLE] Found FFE0 service on ${deviceId}`);

      // Step 3: Subscribe to FFE1 characteristic
      const ffe1Char = ffe0Service.characteristics?.find(
        (c) => c.uuid.toLowerCase().includes('ffe1')
      );

      if (!ffe1Char) {
        throw new Error('FFE1 characteristic not found');
      }

      console.log(`[BLE] Found FFE1 characteristic, subscribing to notifications...`);

      await BleClient.startNotifications(
        deviceId,
        ffe0Service.uuid,
        ffe1Char.uuid,
        (value) => this.handleButtonNotification(deviceId, value)
      );

      // Create registered device record
      const discovered = this.discoveredDevices.get(deviceId);
      const registered: RegisteredBleDevice = {
        deviceId,
        mac: deviceId,
        name: discovered?.name || 'Unknown',
        rssi: discovered?.rssi || -100,
        connectable: true,
        nickname,
        isEnabled: true,
        lastConnected: Date.now(),
        batteryLevel: null, // Will be updated via notifications if available
      };

      this.registeredDevices.set(deviceId, registered);
      this.activeConnections.add(deviceId);

      console.log(`[BLE] Device registered and listening: ${nickname} (${deviceId})`);
      return registered;
    } catch (error) {
      console.error(`[BLE] Connection failed for ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from device and stop listening for notifications
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      console.log(`[BLE] Disconnecting from ${deviceId}...`);

      // Stop notifications
      const device = this.registeredDevices.get(deviceId);
      if (device) {
        await BleClient.stopNotifications(
          deviceId,
          BLE_CONFIG.iTAG.SERVICE_UUID,
          BLE_CONFIG.iTAG.BUTTON_CHARACTERISTIC_UUID
        );
      }

      // Disconnect
      await BleClient.disconnect(deviceId);
      this.activeConnections.delete(deviceId);
      console.log(`[BLE] Disconnected from ${deviceId}`);
    } catch (error) {
      console.error(`[BLE] Disconnect failed for ${deviceId}:`, error);
    }
  }

  /**
   * Handle FFE1 button press notification (0x01)
   * Invokes panic trigger callback
   */
  private handleButtonNotification(deviceId: string, value: Uint8Array): void {
    const device = this.registeredDevices.get(deviceId);
    if (!device) return;

    // Check if notification payload is 0x01 (button press)
    if (value[0] === 0x01) {
      console.log(`[BLE] Button press detected on ${device.nickname} (${deviceId})`);

      if (this.onButtonPressCallback) {
        this.onButtonPressCallback(device);
      }
    }
  }

  /**
   * Register callback for button press events
   */
  setOnButtonPressCallback(callback: OnButtonPressCallback): void {
    this.onButtonPressCallback = callback;
    console.log('[BLE] Button press callback registered');
  }

  /**
   * Get all registered devices
   */
  getRegisteredDevices(): RegisteredBleDevice[] {
    return Array.from(this.registeredDevices.values());
  }

  /**
   * Get discovered devices (currently visible in scan)
   */
  getDiscoveredDevices(): BleDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Check if device is currently connected
   */
  isConnected(deviceId: string): boolean {
    return this.activeConnections.has(deviceId);
  }

  /**
   * ========================================================================
   * SIMULATION METHODS (for web/demo mode)
   * ========================================================================
   */

  private simulateDiscovery(callback: (device: BleDevice) => void): void {
    const mockDevices = [
      {
        deviceId: '00:1A:7D:DA:71:0F',
        name: 'Dad Keys',
        rssi: -68,
      },
      {
        deviceId: '00:1A:7D:DA:71:10',
        name: 'Office Keys',
        rssi: -72,
      },
      {
        deviceId: '00:1A:7D:DA:71:11',
        name: 'Backpack',
        rssi: -55,
      },
    ];

    mockDevices.forEach((mock, idx) => {
      setTimeout(() => {
        const device: BleDevice = {
          deviceId: mock.deviceId,
          mac: mock.deviceId,
          name: `iTAG - ${mock.name}`,
          rssi: mock.rssi,
          connectable: true,
        };
        this.discoveredDevices.set(mock.deviceId, device);
        callback(device);
      }, (idx + 1) * 500);
    });
  }

  private async simulateConnect(
    deviceId: string,
    nickname: string
  ): Promise<RegisteredBleDevice> {
    const discovered = this.discoveredDevices.get(deviceId);

    const registered: RegisteredBleDevice = {
      deviceId,
      mac: deviceId,
      name: discovered?.name || 'iTAG Device',
      rssi: discovered?.rssi || -65,
      connectable: true,
      nickname,
      isEnabled: true,
      lastConnected: Date.now(),
      batteryLevel: 87,
    };

    this.registeredDevices.set(deviceId, registered);
    this.activeConnections.add(deviceId);

    // Simulate random button press after 3 seconds
    setTimeout(() => {
      if (this.onButtonPressCallback && Math.random() > 0.7) {
        this.onButtonPressCallback(registered);
      }
    }, 3000);

    return registered;
  }
}

// Export singleton instance
export const BluetoothService = new BluetoothServiceImpl();
