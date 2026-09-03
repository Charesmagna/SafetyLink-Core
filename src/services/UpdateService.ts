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

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
    const ghToken = import.meta.env.VITE_GITHUB_TOKEN;
    if (ghToken) headers['Authorization'] = `Bearer ${ghToken}`;

    const res = await fetch(GITHUB_RELEASES_API, { headers });
    if (!res.ok) return { available: false };

    const release = await res.json();
    const latestVersion = release.tag_name?.replace(/^v/, '') || '0.0.0';

    if (!isNewerVersion(latestVersion, CURRENT_VERSION)) {
      return { available: false };
    }

    // Find APK and EXE assets
    const assets = release.assets || [];
    const apkAsset = assets.find((a: any) => a.name.endsWith('.apk'));
    const exeAsset = assets.find((a: any) => a.name.endsWith('.exe'));

    return {
      available: true,
      version: latestVersion,
      apkUrl: apkAsset?.browser_download_url || `${APK_DOWNLOAD_BASE}/SafetyLink.apk`,
      exeUrl: exeAsset?.browser_download_url || `${APK_DOWNLOAD_BASE}/SafetyLink-OrgConsole-Setup.exe`,
      releaseNotes: release.body?.substring(0, 200) || 'New version available'
    };
  } catch {
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
