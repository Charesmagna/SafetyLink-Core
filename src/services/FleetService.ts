import { Capacitor } from '@capacitor/core';
import { CURRENT_VERSION } from './UpdateService';

export interface DeviceFleetInfo {
  nodeKey: string;
  platform: 'android_apk' | 'windows_exe' | 'web_pwa' | 'ios_app';
  appVersion: string;
  firstInstalledAt: string;
  lastHeartbeat: string;
  userAgent: string;
  customerEmail?: string;
  customerName?: string;
  orgCode?: string;
  isRegistered: boolean;
}

const STORAGE_KEY_NODE = 'sl_fleet_node_key';
const STORAGE_KEY_INSTALL_DATE = 'sl_fleet_first_install';
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

/**
 * Generates or retrieves the unique, immutable installation key for this client.
 * This key identifies the device installation across updates.
 */
export function getOrCreateDeviceNodeKey(): string {
  let key = localStorage.getItem(STORAGE_KEY_NODE);
  if (!key) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    key = `SL-NODE-${randomHex}-${Date.now().toString(36).toUpperCase()}`;
    localStorage.setItem(STORAGE_KEY_NODE, key);
  }
  return key;
}

/**
 * Detects current runtime platform: Android APK, Windows Desktop EXE, or Web PWA.
 */
export function getRuntimePlatform(): 'android_apk' | 'windows_exe' | 'web_pwa' | 'ios_app' {
  const capPlatform = Capacitor.getPlatform();
  if (capPlatform === 'android') return 'android_apk';
  if (capPlatform === 'ios') return 'ios_app';
  if (navigator.userAgent.includes('Electron')) return 'windows_exe';
  return 'web_pwa';
}

/**
 * Gets or sets the original installation timestamp.
 */
export function getFirstInstallTimestamp(): string {
  let date = localStorage.getItem(STORAGE_KEY_INSTALL_DATE);
  if (!date) {
    date = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_INSTALL_DATE, date);
  }
  return date;
}

/**
 * Returns complete device identity object.
 */
export function getDeviceFleetSnapshot(): DeviceFleetInfo {
  return {
    nodeKey: getOrCreateDeviceNodeKey(),
    platform: getRuntimePlatform(),
    appVersion: CURRENT_VERSION,
    firstInstalledAt: getFirstInstallTimestamp(),
    lastHeartbeat: new Date().toISOString(),
    userAgent: navigator.userAgent,
    customerEmail: localStorage.getItem('sl_user_email') || undefined,
    customerName: localStorage.getItem('sl_user_name') || undefined,
    orgCode: localStorage.getItem('sl_org_code') || undefined,
    isRegistered: localStorage.getItem('sl_fleet_registered') === 'true',
  };
}

/**
 * Alerts the server about a new installation or application open.
 */
export async function registerDeviceWithServer(customerOverride?: { email?: string; name?: string; orgCode?: string }): Promise<void> {
  try {
    const info = getDeviceFleetSnapshot();
    if (customerOverride?.email) info.customerEmail = customerOverride.email;
    if (customerOverride?.name) info.customerName = customerOverride.name;
    if (customerOverride?.orgCode) info.orgCode = customerOverride.orgCode;

    const res = await fetch(`${API_BASE}/api/fleet/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    });

    if (res.ok) {
      localStorage.setItem('sl_fleet_registered', 'true');
      console.log(`[FleetService] Device ${info.nodeKey} registered successfully with server.`);
    }
  } catch (err) {
    console.warn('[FleetService] Registration ping deferred (offline mode):', err);
  }
}

/**
 * Sends periodic heartbeat ping to the server to maintain presence and telemetry.
 */
export async function sendFleetHeartbeat(): Promise<void> {
  try {
    const nodeKey = getOrCreateDeviceNodeKey();
    await fetch(`${API_BASE}/api/fleet/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeKey,
        appVersion: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        customerEmail: localStorage.getItem('sl_user_email') || undefined,
      }),
    });
  } catch {
    // Silent fail if offline
  }
}

let heartbeatInterval: any = null;

/**
 * Initializes telemetry tracking upon app launch.
 */
export function startFleetTelemetry(): void {
  // 1. Register or alert server
  registerDeviceWithServer();

  // 2. Schedule heartbeats every 5 minutes
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(sendFleetHeartbeat, 5 * 60 * 1000);
  }
}
