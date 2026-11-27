import React from 'react';
import { ApkBuildInfo, useApkChannels } from '../ApkBuildInfo';

const WORKER = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

type Entry = { version: string; size?: number; date?: string };

/** Download hub: SafetyLink Version 1 (Official Stable Release) prominently featured, with SafetyLink Beta (v1.1.1218+) tucked into a muted testing disclosure. */
export const DownloadHubVersions: React.FC = () => {
  const channels = useApkChannels();
  const testingVersion = channels?.testing?.version || null;

  return (
    <div className="my-6 space-y-3">
      {/* Official Flagship Release — SafetyLink APK (Version 1) */}
      <div className="rounded-2xl border-2 border-emerald-500/80 bg-white dark:bg-[#0d1b34] p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            SafetyLink APK
          </h3>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Version 1 · Official Stable Release
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          Complete signed Version 1 Android release containing all promoted features: ZeroLink offline USSD + FCM loud alarm, native SMS &amp; voice stay-on-screen dispatch, BLE iTag panic fobs, 1-Way/2-Way QR contacts, live Safety Feed &amp; crime hotspots, unified Light/Dark themes, and POPIA encrypted vault.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-colors no-underline"
            href={WORKER + '/download/v1/safetylink.apk'}
            download="SafetyLink.apk"
          >
            Download SafetyLink APK · Stable V1
          </a>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Version 1 · Android 8.0+ · Signed Production Build
          </span>
        </div>
        <ApkBuildInfo className="mt-4" />
      </div>

      {/* Demoted SafetyLink Beta Disclosure — Rolling Test Track (v1.1.1000+) */}
      <details className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer select-none font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
          Internal Testing Sandbox · SafetyLink Beta (v1.1.1000+ rolling{testingVersion ? ` · Current v${testingVersion}` : ''} — not recommended for daily use)
        </summary>
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400/90">
            Warning: SafetyLink Beta (progressing from v1.1.1000+{testingVersion ? `, currently v${testingVersion}` : ''}) is our internal testing channel before updates graduate to SafetyLink APK (Version 1). Everyday users should install SafetyLink APK above.
          </p>
          <a
            className="shrink-0 text-[11px] font-mono underline text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            href={WORKER + '/download/beta/safetylink.apk'}
            download={`SafetyLink-Beta-${testingVersion ? `v${testingVersion}` : 'v1.1.1000'}.apk`}
          >
            SafetyLink Beta ({testingVersion ? `v${testingVersion}` : 'v1.1.1000+'}) · Testers Only
          </a>
        </div>
      </details>
    </div>
  );
};

/** Release summary line, shown under download cards. */
export const OlderVersionsLine: React.FC = () => (
  <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
    Official release:{' '}
    <a
      className="underline text-emerald-700 dark:text-emerald-400 font-semibold"
      href="https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk"
      download="SafetyLink.apk"
    >
      SafetyLink APK (Version 1 · Official Stable)
    </a>
  </p>
);
