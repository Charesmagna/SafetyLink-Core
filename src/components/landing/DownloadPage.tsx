import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Download, Globe, Monitor, Package, Search, Smartphone } from 'lucide-react';
import { ASSETS, ACTION_VIDEOS, vid, vidPoster } from '../../utils/cloudinary';

interface Props {
  onLogin?: () => void;
  onRegisterUser?: () => void;
  onRegisterOrg?: () => void;
  navigate?: (p: string) => void;
}

interface ReleaseItem {
  version: string;
  name: string;
  publishedAt: string;
  sizeMb: string;
  apkUrl: string;
  exeUrl?: string;
  isLatest?: boolean;
}

export function DownloadPage({ onLogin }: Props) {
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestRelease, setLatestRelease] = useState<ReleaseItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=35', true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 10000;
    xhr.onload = () => {
      try {
        const rawList = JSON.parse(xhr.responseText);
        if (Array.isArray(rawList)) {
          const qualified: ReleaseItem[] = [];

          rawList.forEach((r, idx) => {
            if (!r.assets || !Array.isArray(r.assets)) return;
            const apkAsset = r.assets.find((a: { name?: string; size?: number }) => a.name && a.name.endsWith('.apk') && (a.size || 0) > 80 * 1024 * 1024);
            const exeAsset = r.assets.find((a: { name?: string }) => a.name && a.name.endsWith('.exe'));

            if (apkAsset) {
              const rawTag = String(r.tag_name || 'v1.1');
              const isBetaTag = /beta|exp|v2/i.test(rawTag) || /beta|experimental/i.test(String(r.name || ''));
              const cleanName = isBetaTag
                ? `SafetyLink Beta (${rawTag})`
                : `SafetyLink APK · Version 1 (${rawTag})`;
              qualified.push({
                version: rawTag,
                name: cleanName,
                publishedAt: r.published_at
                  ? new Date(r.published_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Verified Build',
                sizeMb: (apkAsset.size / (1024 * 1024)).toFixed(1),
                apkUrl: apkAsset.browser_download_url,
                exeUrl: exeAsset?.browser_download_url,
                isLatest: idx === 0,
              });
            }
          });

          if (qualified.length > 0) {
            setReleases(qualified);
            setLatestRelease(qualified[0]);
          } else {
            const fallback: ReleaseItem = {
              version: 'v1.1.1000+',
              name: 'SafetyLink APK (Version 1 · Official Signed)',
              publishedAt: 'Verified Release',
              sizeMb: '105.4',
              apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk',
              isLatest: true,
            };
            setReleases([fallback]);
            setLatestRelease(fallback);
          }
        }
      } catch (e) {
        console.warn('Error reading release list:', e);
      }
      setLoading(false);
    };
    xhr.onerror = () => setLoading(false);
    xhr.ontimeout = () => setLoading(false);
    xhr.send();
  }, []);

  const filteredReleases = releases.filter(
    (r) =>
      r.version.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const v1ApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk';
  const betaApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/beta/safetylink.apk';
  const desktopExeUrl = latestRelease?.exeUrl || 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest';

  return (
    <div className="min-h-screen bg-white dark:bg-[#071124] text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── HEADER WITH UNIVERSAL SAFETYLINK LOGO & LIVE VISUAL ACTION PREVIEW ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-emerald-50/70 to-white dark:from-[#0d1b34]/85 dark:to-[#071124] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={ASSETS.logo}
                alt="SafetyLink Logo"
                className="h-10 w-auto object-contain drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Download Hub · Version 1 Stable
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
              Deploy SafetyLink across Android, Windows &amp; Web.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Download SafetyLink APK — our official Version 1 production-signed Android release packed with every tested emergency feature — alongside Windows Control Desk EXE and the instant Web App.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 shadow-2xl">
              <video
                src={vid(ACTION_VIDEOS.liveActionShowcase)}
                poster={vidPoster(ACTION_VIDEOS.liveActionShowcase)}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-52 sm:h-56 object-cover block"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-400/35">
                <img src={ASSETS.logo} alt="SafetyLink" className="h-4 w-auto object-contain" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  VERSION 1 LIVE ACTION
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 text-xs font-semibold text-white">
                Pocket BLE · Zero-Airtime USSD · Instant Dispatch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OFFICIAL PRODUCTION CHANNELS (VERSION 1 FLAGSHIP + WINDOWS + WEB) ── */}
      <section className="py-14 px-4 sm:px-6 bg-slate-50/70 dark:bg-[#050d1c] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Recommended Production Releases
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              SafetyLink Official Downloads
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Flagship Card — SafetyLink Version 1 Official Stable (Dominant Focal Anchor) */}
            <div className="lg:col-span-6 p-7 rounded-3xl bg-white dark:bg-[#0d1b34] border-2 border-emerald-600 dark:border-emerald-500 shadow-lg shadow-emerald-950/10 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone size={24} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-mono">
                    RECOMMENDED · OFFICIAL STABLE
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                    SafetyLink APK
                  </h3>
                  <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    Version 1 · Production-Signed Android Build · All Features Shipped
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Our official Version 1 consumer &amp; responder Android app. Includes every promoted upgrade thoroughly tested for daily protection:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                  {[
                    'ZeroLink Offline USSD + FCM Loud Alarm',
                    'Real Native SMS & Stay-on-Screen Voice Dispatch',
                    'BLE iTag Keyfob Triggers & Auto-Reconnect',
                    '1-Way & 2-Way QR Contact Linking',
                    'Live Local Safety Feed & Crime Hotspots',
                    'Unified Light/Dark Theme & POPIA Vault',
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <a
                  href={v1ApkUrl}
                  download="SafetyLink.apk"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 no-underline transition-all"
                >
                  <Download size={17} />
                  <span>Download SafetyLink APK</span>
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono">
                  Version 1 · Android 8.0+ · Signed Production Release · Direct Cloudflare R2 Delivery
                </p>
              </div>
            </div>

            {/* Windows Control Room EXE */}
            <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Monitor size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono">
                    WINDOWS EXE
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    Windows Dispatch EXE
                  </h3>
                  <p className="text-xs font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                    Control Room &amp; Security Desk
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Multi-screen desktop command console for security control rooms, estate gates, and dispatch supervisors with offline map caching and Hikvision CCTV view.
                </p>
              </div>
              <a
                href={desktopExeUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 no-underline transition-colors"
              >
                <Monitor size={15} />
                <span>Get Windows EXE</span>
              </a>
            </div>

            {/* Progressive Web App */}
            <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Globe size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                    WEB / PWA
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    Progressive Web App
                  </h3>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    iOS Safari · Chrome · Edge
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Run immediately inside any modern browser with offline service workers, synced Light/Dark themes, and instant home-screen install.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onLogin?.()}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Globe size={15} />
                <span>Launch Web App</span>
              </button>
            </div>
          </div>

          {/* ── DEMOTED SAFETYLINK TEST / BETA DISCLOSURE (ROLLING FROM v1.1.1000+ ONWARD) ── */}
          <details className="mt-7 rounded-xl border border-slate-200/80 dark:border-slate-800/90 bg-slate-100/70 dark:bg-slate-900/45 px-4 py-3 text-slate-600 dark:text-slate-400">
            <summary className="cursor-pointer select-none flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber-600/80 dark:text-amber-500/80 shrink-0" />
                <span>
                  Internal Testing Sandbox — SafetyLink Beta (v1.1.1000+ rolling{latestRelease?.version ? ` · Current ${latestRelease.version}` : ''} · Not recommended for daily protection)
                </span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                Testers Only
              </span>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                <strong className="text-amber-700 dark:text-amber-400">Not for everyday use:</strong> SafetyLink Beta (rolling progressively from <code className="font-mono">v1.1.1000+</code>{latestRelease?.version ? <> · currently <code className="font-mono">{latestRelease.version}</code></> : null}) is our experimental test track where upcoming changes are trialed before graduating to <strong>SafetyLink APK (Version 1)</strong>. For reliable daily emergency protection, always install <strong>SafetyLink APK</strong> above.
              </p>
              <a
                href={betaApkUrl}
                download={`SafetyLink-Beta-${latestRelease?.version || 'v1.1.1000'}.apk`}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-mono no-underline text-center transition-colors"
              >
                SafetyLink Beta ({latestRelease?.version || 'v1.1.1000+'}) · Testers Only
              </a>
            </div>
          </details>
        </div>
      </section>

      {/* ── VERIFIED PRODUCTION RELEASE ARCHIVE ── */}
      <section className="py-14 px-4 sm:px-6 bg-white dark:bg-[#071124] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                Verified Production Archive
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                High-Capacity Release Catalog
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Showing verified production APKs compiled with complete background services (&gt; 80 MB).
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search releases (e.g. v1.1)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs">Loading verified release manifest...</p>
            </div>
          ) : filteredReleases.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">No production releases matching &ldquo;{searchFilter}&rdquo;.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReleases.map((rel, idx) => (
                <div
                  key={rel.version + idx}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    rel.isLatest
                      ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-slate-50/60 dark:bg-[#0d1b34] border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#071124] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
                      <Package size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {rel.name}
                        </span>
                        {rel.isLatest && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                            Official Stable
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 tabular-nums">
                        Released: {rel.publishedAt} · Size: {rel.sizeMb} MB · Signed APK
                      </div>
                    </div>
                  </div>

                  <a
                    href={rel.apkUrl}
                    download
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 no-underline shrink-0 transition-colors ${
                      rel.isLatest
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
                    }`}
                  >
                    <Download size={14} />
                    <span>Download APK</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ANDROID INSTALLATION GUIDE ── */}
      <section className="py-14 px-4 sm:px-6 bg-slate-50/70 dark:bg-[#050d1c]">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            Installation Guide
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
            How to install SafetyLink on Android
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: '01', title: 'Download SafetyLink APK', desc: 'Tap "Download SafetyLink APK" (Version 1) above on your Android smartphone.' },
              { step: '02', title: 'Allow Unknown Apps', desc: 'If prompted by Chrome or Files, enable "Allow from this source".' },
              { step: '03', title: 'Tap Install', desc: 'Open the downloaded package and tap Install to complete setup.' },
              { step: '04', title: 'Grant Permissions', desc: 'Allow Location, Bluetooth, SMS, and Phone permissions for reliable emergency dispatch.' },
            ].map((s) => (
              <div
                key={s.step}
                className="p-5 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800"
              >
                <div className="font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">
                  {s.step}
                </div>
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">{s.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Need assistance deploying to a security company or estate fleet?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Our team supports MDM rollout, custom APK branding, and BLE iTag hardware pairing.
              </p>
            </div>
            <a
              href="https://wa.me/message/YIEA73M7H3P5M1?text=Hi+I+need+help+installing+SafetyLink"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold no-underline text-center shrink-0 transition-colors"
            >
              Chat with Support →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
