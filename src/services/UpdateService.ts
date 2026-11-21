// SafetyLink Update & Over-The-Air (OTA) Live Sync Engine
// Supports instant light web updates without downloading new APKs,
// as well as native binary updates when required.

import { Capacitor } from '@capacitor/core';

export const CURRENT_VERSION: string =
  (import.meta as any).env?.VITE_APP_VERSION ||
  localStorage.getItem('sl_active_version') ||
  '1.1.1170';

export function isAppBinary(): boolean {
  if (typeof window === 'undefined') return false;
  // 1. Android APK or iOS Native App
  if (Capacitor.isNativePlatform()) return true;

  // 2. Desktop EXE via Tauri
  if (
    typeof (window as any).__TAURI__ !== 'undefined' ||
    typeof (window as any).__TAURI_IPC__ !== 'undefined' ||
    navigator.userAgent.includes('Tauri')
  ) {
    return true;
  }

  // 3. Desktop EXE via Electron
  if (
    (typeof (window as any).process !== 'undefined' && Boolean((window as any).process?.versions?.electron)) ||
    navigator.userAgent.includes('Electron')
  ) {
    return true;
  }

  // 4. Standalone installed app (PWA application shell)
  if (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  ) {
    return true;
  }

  return false;
}

export async function getCurrentAppVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { App: CapApp } = await import('@capacitor/app');
      const info = await CapApp.getInfo();
      if (info?.version) return info.version;
    } catch (e) {
      console.warn('[UpdateService] Failed to read native app version:', e);
    }
  }
  return CURRENT_VERSION;
}

const GITHUB_RELEASES_API = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/latest';
const APK_DOWNLOAD_BASE = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download';
const VERSION_POLICY_URL = 'https://api.safetylink.online/api/app/version-policy';
const FALLBACK_VERSION_POLICY_URL = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/version-policy';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  apkUrl?: string;
  exeUrl?: string;
  releaseNotes?: string;
  isLiveUpdate?: boolean; // true = instant web OTA update without downloading full APK
  updateRequiredBlocked?: boolean;
  minSupportedVersion?: string;
}

export function isVersionBelow(current: string, minRequired: string): boolean {
  try {
    const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);
    const [mMaj = 0, mMin = 0, mPat = 0] = parse(minRequired);
    if (cMaj !== mMaj) return cMaj < mMaj;
    if (cMin !== mMin) return cMin < mMin;
    return cPat < mPat;
  } catch {
    return false;
  }
}

export async function checkVersionPolicy(currentVersion?: string): Promise<{
  blocked: boolean;
  minSupportedVersion: string;
  latestVersion: string;
  updateUrl: string;
}> {
  const cur = currentVersion || (await getCurrentAppVersion());
  for (const url of [VERSION_POLICY_URL, FALLBACK_VERSION_POLICY_URL]) {
    try {
      const policy = await xhrGet(url);
      if (policy?.minSupportedVersion) {
        return {
          blocked: isVersionBelow(cur, String(policy.minSupportedVersion)),
          minSupportedVersion: String(policy.minSupportedVersion),
          latestVersion: String(policy.latestVersion || policy.minSupportedVersion),
          updateUrl: String(policy.updateUrl || 'https://safetylink.online/#/download'),
        };
      }
    } catch {
      // try next
    }
  }
  return {
    blocked: false,
    minSupportedVersion: '1.0.0',
    latestVersion: cur,
    updateUrl: 'https://safetylink.online/#/download',
  };
}

function xhrGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 8000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('JSON parse error'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Timeout'));
    xhr.send();
  });
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const currentVersion = await getCurrentAppVersion();
    console.log(`[UpdateService] Checking updates. Current: ${currentVersion}`);

    // 0. Check server minimum supported version policy
    const policy = await checkVersionPolicy(currentVersion);
    if (policy.blocked) {
      return {
        available: true,
        updateRequiredBlocked: true,
        minSupportedVersion: policy.minSupportedVersion,
        version: policy.latestVersion,
        apkUrl: `${APK_DOWNLOAD_BASE}/safetylink.apk`,
        releaseNotes: `Version ${currentVersion} is below the minimum supported version (v${policy.minSupportedVersion}). Please update to continue.`,
        isLiveUpdate: false,
      };
    }

    // 1. Ask Worker / GitHub Releases endpoint for newest release
    try {
      const release = await xhrGet(GITHUB_RELEASES_API);
      const latestVersion = (release.tag_name || '').replace(/^v/, '');
      if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
        const assets = release.assets || [];
        const apk = assets.find((x: any) => x.name?.endsWith('.apk'));
        const exe = assets.find((x: any) => x.name?.endsWith('.exe'));
        return {
          available: true,
          version: latestVersion,
          apkUrl: apk?.browser_download_url || `${APK_DOWNLOAD_BASE}/SafetyLink-v${latestVersion}-Signed.apk`,
          exeUrl: exe?.browser_download_url,
          releaseNotes: release.body ? String(release.body).slice(0, 300) : 'New release available.',
          isLiveUpdate: false,
        };
      }
      if (latestVersion) return { available: false };
    } catch {
      // Worker release check failed
    }

    return { available: false };
  } catch (e) {
    console.warn('[UpdateService] Check failed:', e);
    return { available: false };
  }
}

export function isNewerVersion(latest: string, current: string): boolean {
  try {
    const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
    const [lMaj, lMin, lPat] = parse(latest);
    const [cMaj, cMin, cPat] = parse(current);
    if (lMaj !== cMaj) return lMaj > cMaj;
    if (lMin !== cMin) return lMin > cMin;
    return lPat > cPat;
  } catch {
    return false;
  }
}

/**
 * Applies a Light/OTA Update instantly without requiring the user to download an APK.
 * Clears cached assets, activates the latest version, and refreshes the application.
 */
export async function applyLiveUpdate(version?: string): Promise<void> {
  console.log('[UpdateService] Applying Live Update...');
  if (version) {
    localStorage.setItem('sl_active_version', version);
  }

  // 1. Unregister active service workers to pull the latest bundled code
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    } catch (e) {
      console.warn('[UpdateService] SW unregister error:', e);
    }
  }

  // 2. Clear CacheStorage
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {
      console.warn('[UpdateService] Cache clear error:', e);
    }
  }

  // 3. Mark update timestamp
  localStorage.setItem('sl_last_ota_update', Date.now().toString());

  // 4. Force hard reload with cache bust
  const url = new URL(window.location.href);
  url.searchParams.set('v', version || Date.now().toString());
  window.location.href = url.toString();
}

export function openDownloadUrl(url: string) {
  window.open(url, '_blank');
}
