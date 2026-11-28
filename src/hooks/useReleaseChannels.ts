import { useState, useEffect } from 'react';

export interface ReleaseChannelEntry {
  channel: 'v1' | 'beta' | string;
  label: string;
  version: string;
  buildNumber: number | null;
  apkUrl: string;
  githubAssetUrl: string;
  sizeMb?: number | null;
  publishedAt: string;
  branch?: string;
}

export interface ReleaseHistoryItem {
  tag: string;
  buildNumber: number | null;
  channel: string;
  publishedAt: string;
  sizeMb: number | null;
  apkUrl: string;
  prerelease: boolean;
}

export interface ReleaseChannelsData {
  ok: boolean;
  loading: boolean;
  syncedAt: string;
  stable: ReleaseChannelEntry;
  testing: ReleaseChannelEntry;
  sameBuildAsTesting: boolean;
  testingAhead: boolean;
  parityNotice: string;
  desktopExe: {
    version: string;
    buildNumber: number | null;
    url: string;
  };
  recentReleases: ReleaseHistoryItem[];
}

const DEFAULT_CHANNELS: ReleaseChannelsData = {
  ok: true,
  loading: true,
  syncedAt: '',
  stable: {
    channel: 'v1',
    label: 'Version 1 — Official Stable (main)',
    version: 'v1.1.1222',
    buildNumber: 1222,
    apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk',
    githubAssetUrl: 'https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.1222/SafetyLink-v1.1.1222-Signed.apk',
    sizeMb: 96,
    publishedAt: '2026-11-27T14:14:16Z',
    branch: 'main',
  },
  testing: {
    channel: 'beta',
    label: 'Testing / Beta Track',
    version: 'v1.1.1222',
    buildNumber: 1222,
    apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/beta/safetylink.apk',
    githubAssetUrl: 'https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.1222/SafetyLink-v1.1.1222-Signed.apk',
    publishedAt: '2026-11-27T14:14:16Z',
  },
  sameBuildAsTesting: true,
  testingAhead: false,
  parityNotice: 'Same build as Testing (v1.1.1222 · Build #1222) — fresh push to main, testing in progress',
  desktopExe: {
    version: 'v1.1.740',
    buildNumber: 740,
    url: 'https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.740/SafetyLink.Setup.1.1.740.exe',
  },
  recentReleases: [],
};

function extractBuild(tag?: string | null): number | null {
  const clean = String(tag || '').replace(/^v/i, '').trim();
  const parts = clean.split('.');
  if (parts.length >= 3) {
    const n = parseInt(parts[2].replace(/\D.*$/, ''), 10);
    if (Number.isFinite(n)) return n;
  }
  const m = clean.match(/(\d{3,6})/);
  return m ? parseInt(m[1], 10) : null;
}

function normTag(v?: string | null, fallback = 'v1.1.1222'): string {
  const s = String(v || '').trim();
  if (!s) return fallback;
  return s.startsWith('v') || s.startsWith('V') ? `v${s.slice(1)}` : `v${s}`;
}

let cachedChannels: ReleaseChannelsData | null = null;
let inflightPromise: Promise<ReleaseChannelsData> | null = null;

async function fetchReleaseChannels(): Promise<ReleaseChannelsData> {
  // 1. Try server-side proxy first (caches GitHub Releases + Worker versions)
  try {
    const res = await fetch('/api/releases/channels', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.stable?.version) {
        return {
          ...DEFAULT_CHANNELS,
          ...data,
          loading: false,
        };
      }
    }
  } catch {
    // Fallback to direct public endpoints (e.g. static Pages / APK webview)
  }

  // 2. Fallback: fetch GitHub Releases + Worker versions directly
  const next: ReleaseChannelsData = {
    ...DEFAULT_CHANNELS,
    loading: false,
    syncedAt: new Date().toISOString(),
  };

  const [ghRes, wvRes] = await Promise.allSettled([
    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=15', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(7000),
    }).then((r) => (r.ok ? r.json() : null)),
    fetch('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/api/app/versions', {
      signal: AbortSignal.timeout(5000),
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  if (ghRes.status === 'fulfilled' && Array.isArray(ghRes.value)) {
    let foundStable = false;
    let foundTesting = false;
    let foundExe = false;
    const recent: ReleaseHistoryItem[] = [];

    for (const rel of ghRes.value as any[]) {
      if (!rel || rel.draft || !Array.isArray(rel.assets)) continue;
      const apk = rel.assets.find((a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.apk'));
      const exe = rel.assets.find((a: any) => typeof a?.name === 'string' && a.name.toLowerCase().endsWith('.exe'));

      if (exe?.browser_download_url && !foundExe) {
        foundExe = true;
        const tag = normTag(rel.tag_name, next.desktopExe.version);
        next.desktopExe = { version: tag, buildNumber: extractBuild(tag), url: String(exe.browser_download_url) };
      }
      if (apk?.browser_download_url) {
        const tag = normTag(rel.tag_name, next.stable.version);
        const buildNumber = extractBuild(tag);
        const sizeMb = typeof apk.size === 'number' ? Math.round((apk.size / (1024 * 1024)) * 10) / 10 : null;
        const isPre = Boolean(rel.prerelease) || /beta|rc|alpha|test/i.test(tag);
        recent.push({
          tag,
          buildNumber,
          channel: isPre ? 'testing' : 'stable',
          publishedAt: String(rel.published_at || ''),
          sizeMb,
          apkUrl: String(apk.browser_download_url),
          prerelease: isPre,
        });
        if (!isPre && !foundStable) {
          foundStable = true;
          next.stable = {
            ...next.stable,
            version: tag,
            buildNumber,
            githubAssetUrl: String(apk.browser_download_url),
            sizeMb: sizeMb ?? next.stable.sizeMb,
            publishedAt: String(rel.published_at || next.stable.publishedAt),
          };
        }
        if (!foundTesting && (isPre || !foundStable)) {
          foundTesting = true;
          next.testing = {
            ...next.testing,
            version: tag,
            buildNumber,
            githubAssetUrl: String(apk.browser_download_url),
            publishedAt: String(rel.published_at || next.testing.publishedAt),
          };
        }
      }
    }
    if (!foundTesting) {
      next.testing = {
        ...next.testing,
        version: next.stable.version,
        buildNumber: next.stable.buildNumber,
        githubAssetUrl: next.stable.githubAssetUrl,
        publishedAt: next.stable.publishedAt,
      };
    }
    next.recentReleases = recent.slice(0, 6);
  }

  if (wvRes.status === 'fulfilled' && wvRes.value && typeof wvRes.value === 'object') {
    const wv = wvRes.value as any;
    if (wv?.v1?.version) {
      const tag = normTag(wv.v1.version, next.stable.version);
      const b = extractBuild(tag) || 0;
      if (b >= (next.stable.buildNumber || 0)) {
        next.stable = { ...next.stable, version: tag, buildNumber: b };
      }
    }
    if (wv?.beta?.version) {
      const tag = normTag(wv.beta.version, next.testing.version);
      const b = extractBuild(tag) || 0;
      if (b >= (next.testing.buildNumber || 0)) {
        next.testing = { ...next.testing, version: tag, buildNumber: b };
      }
    }
  }

  const same =
    (next.stable.buildNumber !== null &&
      next.testing.buildNumber !== null &&
      next.stable.buildNumber === next.testing.buildNumber) ||
    next.stable.version.toLowerCase() === next.testing.version.toLowerCase();

  const ahead =
    !same &&
    next.stable.buildNumber !== null &&
    next.testing.buildNumber !== null &&
    next.testing.buildNumber > next.stable.buildNumber;

  next.sameBuildAsTesting = same;
  next.testingAhead = ahead;
  next.parityNotice = same
    ? `Same build as Testing (${next.stable.version}${next.stable.buildNumber ? ` · Build #${next.stable.buildNumber}` : ''}) — fresh push to main, testing in progress`
    : ahead
      ? `Verified Stable on ${next.stable.version} (Build #${next.stable.buildNumber}) · Testing ahead on ${next.testing.version} (Build #${next.testing.buildNumber})`
      : `Official Stable Release ${next.stable.version}${next.stable.buildNumber ? ` (Build #${next.stable.buildNumber})` : ''} from main`;

  return next;
}

export function useReleaseChannels(): ReleaseChannelsData {
  const [data, setData] = useState<ReleaseChannelsData>(() => cachedChannels || DEFAULT_CHANNELS);

  useEffect(() => {
    let active = true;
    if (cachedChannels) {
      setData(cachedChannels);
      return;
    }
    if (!inflightPromise) {
      inflightPromise = fetchReleaseChannels().then((resolved) => {
        cachedChannels = resolved;
        return resolved;
      });
    }
    inflightPromise.then((resolved) => {
      if (active) setData(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  return data;
}
