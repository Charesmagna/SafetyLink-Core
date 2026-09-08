// SafetyLink Update Checker
// Checks GitHub Releases for a newer version and prompts user to download

// Injected by CI as "1.1.<run_number>"; falls back to package.json version for local dev
const CURRENT_VERSION: string = import.meta.env.VITE_APP_VERSION || '1.0.0';
const GITHUB_RELEASES_API = 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest';
const APK_DOWNLOAD_BASE = 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest/download';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  apkUrl?: string;
  exeUrl?: string;
  releaseNotes?: string;
}

// Use XHR instead of fetch to bypass the fetch interceptor in main.tsx
function xhrGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 10000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('JSON parse error')); }
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
    console.log(`[UpdateService] Checking for updates. Installed: ${CURRENT_VERSION}`);

    const release = await xhrGet(GITHUB_RELEASES_API);
    const latestVersion = (release.tag_name || '').replace(/^v/, '');

    if (!latestVersion) {
      console.warn('[UpdateService] No tag_name in response');
      return { available: false };
    }

    console.log(`[UpdateService] Latest: ${latestVersion} | Installed: ${CURRENT_VERSION}`);

    if (!isNewerVersion(latestVersion, CURRENT_VERSION)) {
      console.log('[UpdateService] Already on latest version');
      return { available: false };
    }

    const assets = release.assets || [];
    const apkAsset = assets.find((a: any) => a.name.endsWith('.apk'));
    const exeAsset = assets.find((a: any) => a.name.endsWith('.exe'));

    console.log(`[UpdateService] Update available: v${latestVersion}`);

    return {
      available: true,
      version: latestVersion,
      apkUrl: apkAsset?.browser_download_url || `${APK_DOWNLOAD_BASE}/SafetyLink.apk`,
      exeUrl: exeAsset?.browser_download_url,
      releaseNotes: release.body?.substring(0, 200) || 'New version available',
    };
  } catch (e) {
    console.warn('[UpdateService] Check failed:', e);
    return { available: false };
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);
  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}

export function openDownloadUrl(url: string) {
  window.open(url, '_blank');
}
