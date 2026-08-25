import { BleClient, ScanResult, numbersToDataView, BleService as GattService } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

// Standard "Find Me" profile -- genuinely universal across nearly all of
// these anti-loss keyfobs regardless of vendor, used for the optional
// "ring my tag" locate feature. This is NOT used to identify the button
// press channel -- that's discovered dynamically per device, see below.
export const IMMEDIATE_ALERT_SERVICE_UUID = '00001802-0000-1000-8000-00805f9b34fb';
export const ALERT_LEVEL_CHARACTERISTIC_UUID = '00002a06-0000-1000-8000-00805f9b34fb';

// Standard characteristics known NOT to be a button-press channel, even
// though some devices expose them with the notify property. Excluded as
// candidates during trigger discovery to avoid false-positive binding
// (e.g. binding to a coincidental battery-level notification instead of
// the actual button).
const KNOWN_NON_BUTTON_CHARACTERISTICS = new Set([
  '00002a19-0000-1000-8000-00805f9b34fb', // Battery Level
  '00002a06-0000-1000-8000-00805f9b34fb', // Alert Level (Immediate Alert / Link Loss)
]);

export interface DiscoveredDevice {
  deviceId: string;
  name: string;
  rssi: number;
}

export interface BoundTrigger {
  serviceUuid: string;
  characteristicUuid: string;
}

let initialized = false;
const connectedDeviceIds = new Set<string>();

async function ensureInitialized(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (initialized) return true;
  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    initialized = true;
    return true;
  } catch (e) {
    console.error('[BleService] initialize failed', e);
    return false;
  }
}

/**
 * Confirms Bluetooth is actually turned on, and prompts the system
 * "Turn on Bluetooth?" dialog if it's off (Android only).
 */
export async function ensureBluetoothReady(): Promise<{ ok: boolean; reason?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: 'Bluetooth hardware access requires the native Android app, not the web preview.' };
  }
  const ready = await ensureInitialized();
  if (!ready) return { ok: false, reason: 'Could not initialize Bluetooth on this device.' };

  try {
    // Dynamic runtime permission requests for Bluetooth scanning, connecting, and location tracking
    const bleAny = BleClient as any;
    if (typeof bleAny.checkPermissions === 'function') {
      const perms = await bleAny.checkPermissions();
      if (perms.bluetooth !== 'granted' || perms.location !== 'granted') {
        if (typeof bleAny.requestPermissions === 'function') {
          await bleAny.requestPermissions();
        }
      }
    }
  } catch (err) {
    console.warn('Failed to dynamically check or request Android BLE runtime permissions:', err);
  }

  try {
    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      // Automatically triggers a native Bluetooth Enable Intent
      await BleClient.requestEnable();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'Bluetooth permission was denied, or Bluetooth could not be enabled.' };
  }
}

/**
 * Scans for ALL nearby BLE devices, unfiltered -- same approach as nRF
 * Connect. No assumption about vendor, name, or advertised service; any
 * BLE peripheral in range shows up. onRawDevice fires for every device
 * seen (audit-log visibility so you can confirm the radio is actually
 * picking things up).
 */
export async function scanForNearbyDevices(
  onFound: (device: DiscoveredDevice) => void,
  timeoutMs = 15000,
  onRawDevice?: (name: string, rssi: number) => void
): Promise<void> {
  const ready = await ensureBluetoothReady();
  if (!ready.ok) throw new Error(ready.reason);

  const seen = new Set<string>();

  await BleClient.requestLEScan({}, (result: ScanResult) => {
    const name = result.device.name || result.localName || '';
    const rssi = result.rssi ?? -100;
    onRawDevice?.(name || result.device.deviceId, rssi);

    if (seen.has(result.device.deviceId)) return;
    seen.add(result.device.deviceId);
    onFound({ deviceId: result.device.deviceId, name: name || 'Unnamed BLE Device', rssi });
  });

  setTimeout(async () => {
    try {
      await BleClient.stopLEScan();
    } catch {
      // already stopped
    }
  }, timeoutMs);
}

export async function stopScan(): Promise<void> {
  try {
    await BleClient.stopLEScan();
  } catch {
    // no-op if scan wasn't running
  }
}

/**
 * The core of the vendor-agnostic bonding wizard. Connects to a device,
 * enumerates every GATT service and characteristic, subscribes to every
 * candidate that supports notify/indicate (minus the known non-button
 * standard characteristics), then waits for the user to physically press
 * the button. Whichever candidate actually fires first is bound as the
 * device's trigger channel; every other subscription is torn down.
 *
 * Returns null if nothing fired within the listen window.
 */
export async function discoverAndBindTrigger(
  deviceId: string,
  onListening: (candidateCount: number) => void,
  listenMs = 10000
): Promise<BoundTrigger | null> {
  const ready = await ensureBluetoothReady();
  if (!ready.ok) throw new Error(ready.reason);

  await BleClient.connect(deviceId);
  connectedDeviceIds.add(deviceId);

  const services: GattService[] = await BleClient.getServices(deviceId);

  const candidates: BoundTrigger[] = [];
  for (const service of services) {
    for (const characteristic of service.characteristics) {
      const supportsNotify = characteristic.properties?.notify || characteristic.properties?.indicate;
      if (!supportsNotify) continue;
      if (KNOWN_NON_BUTTON_CHARACTERISTICS.has(characteristic.uuid.toLowerCase())) continue;
      candidates.push({ serviceUuid: service.uuid, characteristicUuid: characteristic.uuid });
    }
  }

  onListening(candidates.length);
  if (candidates.length === 0) {
    await BleClient.disconnect(deviceId).catch(() => {});
    connectedDeviceIds.delete(deviceId);
    return null;
  }

  return new Promise<BoundTrigger | null>((resolve) => {
    let resolved = false;

    const cleanupOthers = async (winner: BoundTrigger) => {
      for (const c of candidates) {
        if (c.serviceUuid === winner.serviceUuid && c.characteristicUuid === winner.characteristicUuid) continue;
        try {
          await BleClient.stopNotifications(deviceId, c.serviceUuid, c.characteristicUuid);
        } catch {
          // ignore -- some may not have started successfully, that's fine
        }
      }
    };

    const timer = setTimeout(async () => {
      if (resolved) return;
      resolved = true;
      for (const c of candidates) {
        try { await BleClient.stopNotifications(deviceId, c.serviceUuid, c.characteristicUuid); } catch {}
      }
      resolve(null);
    }, listenMs);

    candidates.forEach((c) => {
      BleClient.startNotifications(deviceId, c.serviceUuid, c.characteristicUuid, (dataView) => {
        if (resolved) return;

        // If it is the real iTAG on 0xFFE0 / 0xFFE1, check if value returns 0x01
        let isPressed = true;
        const serviceLower = c.serviceUuid.toLowerCase();
        const charLower = c.characteristicUuid.toLowerCase();
        const isITag = serviceLower.includes('ffe0') && charLower.includes('ffe1');
        if (isITag && dataView) {
          try {
            if (dataView.byteLength > 0) {
              const byteVal = dataView.getUint8(0);
              isPressed = (byteVal !== 0x00);
            }
          } catch (e) {
            console.error('Error reading BLE iTAG characteristic value:', e);
          }
        }

        if (isPressed) {
          resolved = true;
          clearTimeout(timer);
          cleanupOthers(c).then(() => resolve(c));
        }
      }).catch(() => {
        // this particular characteristic refused notifications -- fine,
        // it's just not a valid candidate on this device
      });
    });
  });
}

/**
 * Subscribes to an already-bound trigger channel (from a previous
 * discoverAndBindTrigger call). Used for normal reconnects, so we don't
 * have to re-run the full discovery wizard every time the app restarts.
 * ANY notification on the bound channel counts as a press -- payload
 * format isn't assumed, since different hardware sends different bytes.
 */
export async function subscribeToKnownTrigger(
  deviceId: string,
  trigger: BoundTrigger,
  onButtonPress: () => void,
  onDisconnect: () => void
): Promise<void> {
  const ready = await ensureBluetoothReady();
  if (!ready.ok) throw new Error(ready.reason);

  await BleClient.connect(deviceId, () => {
    connectedDeviceIds.delete(deviceId);
    onDisconnect();
  });
  connectedDeviceIds.add(deviceId);

  await BleClient.startNotifications(
    deviceId,
    trigger.serviceUuid,
    trigger.characteristicUuid,
    (dataView) => {
      let isPressed = true;
      const serviceLower = trigger.serviceUuid.toLowerCase();
      const charLower = trigger.characteristicUuid.toLowerCase();
      const isITag = serviceLower.includes('ffe0') && charLower.includes('ffe1');
      if (isITag && dataView) {
        try {
          if (dataView.byteLength > 0) {
            const byteVal = dataView.getUint8(0);
            isPressed = (byteVal !== 0x00);
          }
        } catch (e) {
          console.error('Error reading BLE iTAG subscription characteristic value:', e);
        }
      }

      if (isPressed) {
        onButtonPress();
      }
    }
  );
}

export async function disconnectDevice(deviceId: string, trigger?: BoundTrigger): Promise<void> {
  if (!connectedDeviceIds.has(deviceId)) return;
  if (trigger) {
    try {
      await BleClient.stopNotifications(deviceId, trigger.serviceUuid, trigger.characteristicUuid);
    } catch {
      // ignore
    }
  }
  try {
    await BleClient.disconnect(deviceId);
  } catch {
    // ignore
  }
  connectedDeviceIds.delete(deviceId);
}

/**
 * Makes the physical tag beep/vibrate via the standard Immediate Alert
 * service, if it has one. Best-effort -- not every device implements it.
 */
export async function ringTag(deviceId: string): Promise<boolean> {
  try {
    await BleClient.write(
      deviceId,
      IMMEDIATE_ALERT_SERVICE_UUID,
      ALERT_LEVEL_CHARACTERISTIC_UUID,
      numbersToDataView([2]) // 2 = high alert
    );
    return true;
  } catch {
    return false;
  }
}
