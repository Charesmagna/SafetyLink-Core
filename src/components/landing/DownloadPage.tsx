import React, { useState, useEffect } from 'react';
import { Download, Globe, Monitor, Package, Search, Shield, Smartphone } from 'lucide-react';

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
              qualified.push({
                version: r.tag_name || 'latest',
                name: r.name || `SafetyLink Core ${r.tag_name}`,
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
              version: 'v2.0 (Latest Signed)',
              name: 'SafetyLink Version 2 (Signed Android APK)',
              publishedAt: 'Verified Release',
              sizeMb: '100.5',
              apkUrl: 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk',
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
  const v2ApkUrl = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v2/safetylink.apk';
  const v2ExeUrl = latestRelease?.exeUrl || 'https://github.com/Charesmagna/SafetyLink-Core/releases/latest';

  return (
    <div className="min-h-screen bg-white dark:bg-[#071124] text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── HEADER ── */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-emerald-50/70 to-white dark:from-[#0d1b34]/80 dark:to-[#071124] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            Official Download Hub
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            Deploy SafetyLink across Android, Windows &amp; Web.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Direct access to SafetyLink Legacy v1 (containing every latest feature), SafetyLink Version 2 signed Android packages, Windows Control Desk EXE, and the instant Progressive Web App.
          </p>
        </div>
      </section>

      {/* ── PRIMARY CHANNELS (SEPARATE ROUTES PRESERVED) ── */}
      <section className="py-14 px-4 sm:px-6 bg-slate-50/70 dark:bg-[#050d1c] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              Available Channels
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              SafetyLink Official Releases
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Version 1 Legacy Full-Featured APK */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border-2 border-emerald-600 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-mono">
                    LEGACY v1 · FULL
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    SafetyLink Legacy v1
                  </h3>
                  <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                    v1 Channel · All Latest Features
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Complete production Android APK on the v1 route with BLE iTag triggers, USSD Please Call Me relay, Password Vault, CCTV camera access, live Safety Feed, and screen-fit themes.
                </p>
              </div>
              <a
                href={v1ApkUrl}
                download="SafetyLink-Legacy-v1-Full.apk"
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 no-underline transition-colors"
              >
                <Download size={15} />
                <span>Download Legacy v1 APK</span>
              </a>
            </div>

            {/* SafetyLink Version 2 APK */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Shield size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    VERSION 2
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                    SafetyLink Version 2
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {latestRelease?.version || 'v2.0'} · Signed Android APK
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Signed Android APK channel with durable retry queues, foreground keepalive, BLE iTag monitoring, native SMS/Voice dispatch, and POPIA compliance.
                </p>
              </div>
              <a
                href={v2ApkUrl}
                download="SafetyLink-v2.apk"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold flex items-center justify-center gap-2 no-underline transition-opacity"
              >
                <Download size={15} />
                <span>Download Version 2 APK</span>
              </a>
            </div>

            {/* Windows Control Room EXE */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
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
                  Multi-screen desktop command console for security control rooms, estate managers, and dispatch centers with offline map caching.
                </p>
              </div>
              <a
                href={v2ExeUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 no-underline transition-colors"
              >
                <Monitor size={15} />
                <span>Get Windows EXE</span>
              </a>
            </div>

            {/* Progressive Web App */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-5">
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
                  Instant deployment directly inside any modern browser with offline service workers, theme sync, and home-screen install.
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
                placeholder="Search releases (e.g. v2.0)..."
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
                            Latest
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
              { step: '01', title: 'Download APK', desc: 'Tap Legacy v1 or Version 2 above on your Android smartphone.' },
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
