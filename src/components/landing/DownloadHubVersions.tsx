import React from 'react';
import { useReleaseChannels } from '../../hooks/useReleaseChannels';

/**
 * Download hub: SafetyLink Version 1 (Official Stable Release from main) prominently featured
 * with explicit live GitHub version/build code and side-by-side comparison against the Testing track.
 */
export const DownloadHubVersions: React.FC = () => {
  const channels = useReleaseChannels();
  const stableTag = channels.stable.version;
  const stableBuild = channels.stable.buildNumber ? `Build #${channels.stable.buildNumber}` : 'main';
  const testingTag = channels.testing.version;
  const testingBuild = channels.testing.buildNumber ? `Build #${channels.testing.buildNumber}` : 'beta';

  return (
    <div className="my-6 space-y-3">
      {/* Official Flagship Release — SafetyLink APK (Version 1 · main) */}
      <div className="rounded-2xl border-2 border-emerald-500/80 bg-white dark:bg-[#0d1b34] p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              SafetyLink APK — Version 1
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/15 border border-emerald-500/40 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
              {stableTag} · {stableBuild}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            OFFICIAL STABLE · MAIN BRANCH
          </span>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
          Complete signed Version 1 Android release containing all promoted features: ZeroLink offline USSD + FCM loud alarm, native SMS &amp; voice stay-on-screen dispatch, BLE iTag panic fobs, 1-Way/2-Way QR contacts, live Safety Feed &amp; crime hotspots, unified Light/Dark themes, and POPIA encrypted vault.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors no-underline"
            href={channels.stable.apkUrl}
            download={`SafetyLink-v1-${stableTag}.apk`}
          >
            Download Official Stable v1 ({stableTag})
          </a>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {stableTag} · {stableBuild} · Android 8.0+ · Signed Production Build
          </span>
        </div>
      </div>

      {/* Demoted SafetyLink Testing Disclosure */}
      <details className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer select-none font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
          Testing Track · SafetyLink Beta ({testingTag} · {testingBuild}
          {channels.sameBuildAsTesting ? ' · Same build as Stable v1' : ` · Stable v1 is ${stableTag}`})
        </summary>
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
            {channels.sameBuildAsTesting
              ? `Testing (${testingTag}) and Official Stable v1 (${stableTag}) currently share Build #${channels.stable.buildNumber || 'latest'} right after a fresh push to main. Install Official Stable v1 above for standard production updates.`
              : `SafetyLink Testing (${testingTag} · ${testingBuild}) trials upcoming changes ahead of Official Stable v1 (${stableTag} · ${stableBuild}). Everyday users should install Official Stable v1 above.`}
          </p>
          <a
            className="shrink-0 text-[11px] font-mono underline text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            href={channels.testing.apkUrl}
            download={`SafetyLink-Testing-${testingTag}.apk`}
          >
            Download Testing ({testingTag}) · Testers Only
          </a>
        </div>
      </details>
    </div>
  );
};

/** Release summary line, shown under download cards. */
export const OlderVersionsLine: React.FC = () => {
  const channels = useReleaseChannels();
  const stableBuild = channels.stable.buildNumber ? `Build #${channels.stable.buildNumber}` : 'main';
  return (
    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
      Official production release:{' '}
      <a
        className="underline text-emerald-700 dark:text-emerald-400 font-semibold"
        href={channels.stable.apkUrl}
        download={`SafetyLink-v1-${channels.stable.version}.apk`}
      >
        SafetyLink APK Version 1 Stable ({channels.stable.version} · {stableBuild})
      </a>
    </p>
  );
};
