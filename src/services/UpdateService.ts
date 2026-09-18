// SafetyLink Update & Over-The-Air (OTA) Live Sync Engine
// Supports instant light web updates without downloading new APKs,
// as well as native binary updates when required.

export const CURRENT_VERSION: string =
  (import.meta as any).env?.VITE_APP_VERSION ||
  localStorage.getItem('sl_active_version') ||
  '1.1.896';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest';
const APK_DOWNLOAD_BASE = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download';
const LIVE_VERSION_ENDPOINT = 'https://safetylink.online/version.json';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  apkUrl?: string;
  exeUrl?: string;
  releaseNotes?: string;
  isLiveUpdate?: boolean; // true = instant web OTA update without downloading full APK
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
    console.log(`[UpdateService] Checking updates. Current: ${CURRENT_VERSION}`);

    // 1. Try checking the fast live version endpoint first (Local Origin or Cloudflare)
    try {
      let liveMeta: any = null;
      try {
        liveMeta = await xhrGet(`/version.json?t=${Date.now()}`);
      } catch {
        liveMeta = await xhrGet(`${LIVE_VERSION_ENDPOINT}?t=${Date.now()}`);
      }

      if (liveMeta?.version && isNewerVersion(liveMeta.version, CURRENT_VERSION)) {
        console.log(`[UpdateService] Newer live version detected: v${liveMeta.version}`);
        return {
          available: true,
          version: liveMeta.version,
          apkUrl: liveMeta.apkUrl || `${APK_DOWNLOAD_BASE}/SafetyLink-v${liveMeta.version}-Signed.apk`,
          releaseNotes: liveMeta.features?.join(' • ') || 'New live updates and security optimizations.',
          isLiveUpdate: true
        };
      }
    } catch {
      // fallback to GitHub API
    }

    // 2. Query GitHub Releases API
    const release = await xhrGet(GITHUB_RELEASES_API);
    const latestVersion = (release.tag_name || '').replace(/^v/, '');

    if (!latestVersion) {
      return { available: false };
    }

    if (!isNewerVersion(latestVersion, CURRENT_VERSION)) {
      console.log('[UpdateService] Up to date');
      return { available: false };
    }

    const assets = release.assets || [];
    const apkAsset = assets.find((a: any) => a.name.endsWith('.apk'));
    const exeAsset = assets.find((a: any) => a.name.endsWith('.exe'));

    return {
      available: true,
      version: latestVersion,
      apkUrl: apkAsset?.browser_download_url || `${APK_DOWNLOAD_BASE}/SafetyLink-v${latestVersion}-Signed.apk`,
      exeUrl: exeAsset?.browser_download_url,
      releaseNotes: release.body?.substring(0, 200) || 'SafetyLink system update available.',
      isLiveUpdate: true
    };
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
