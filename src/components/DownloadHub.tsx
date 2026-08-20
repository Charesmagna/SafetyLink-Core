import { useState, useEffect } from 'react';

const GITHUB_REPO = 'Charesmagna/SafetyLink-Core';
const RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  assets: Array<{ name: string; browser_download_url: string; size: number }>;
}

export default function DownloadHub() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(RELEASES_URL)
      .then(r => r.json())
      .then(data => { setRelease(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const apkUrl = release?.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url
    || `https://github.com/${GITHUB_REPO}/releases/latest/download/SafetyLink-v1.0.apk`;
  const exeUrl = release?.assets?.find(a => a.name.endsWith('.exe'))?.browser_download_url
    || `https://github.com/${GITHUB_REPO}/releases/latest/download/SafetyLink-OrgConsole-Setup.exe`;
  const version = release?.tag_name || 'v1.0.0';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <img src="/sl-icon.png" alt="SafetyLink" className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-lg" />
        <h1 className="text-4xl font-black mb-2">Download SafetyLink</h1>
        <p className="text-slate-400">
          {loading ? 'Checking latest version...' : `Latest: ${version}`}
        </p>
      </div>

      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
        {/* APK */}
        <a href={apkUrl}
          className="group bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-2xl p-8 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24C14.6 8.31 13.34 8 12 8s-2.6.31-3.47.91L6.65 5.67c-.19-.29-.55-.37-.83-.22-.3.16-.42.54-.26.85L7.4 9.48C5.32 10.78 4 13.01 4 15.5V16h16v-.5c0-2.49-1.32-4.72-3.4-6.02zM9 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              <path d="M2 17h20v2H2zM2 20h20v2H2z" opacity=".3"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Android APK</h2>
          <p className="text-slate-400 text-sm mb-4">For Android 7.0+ devices<br/>Panic button · BLE iTAG · Live tracking</p>
          <span className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors">
            Download APK
          </span>
          <p className="text-slate-600 text-xs mt-3">Enable "Install from unknown sources" in settings</p>
        </a>

        {/* EXE */}
        <a href={exeUrl}
          className="group bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-2xl p-8 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
            <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Windows EXE</h2>
          <p className="text-slate-400 text-sm mb-4">Organization Control Room<br/>Live map · Dispatch · User management</p>
          <span className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-colors">
            Download EXE
          </span>
          <p className="text-slate-600 text-xs mt-3">Windows 10/11 · 64-bit</p>
        </a>
      </div>

      {/* PWA Install */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-3xl mb-8 text-center">
        <h3 className="font-bold mb-2">Use on iPhone or any browser</h3>
        <p className="text-slate-400 text-sm mb-4">SafetyLink works as a Progressive Web App — no app store needed</p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
          <span>📱 iPhone: Safari → Share → Add to Home Screen</span>
          <span>🖥️ Desktop: Visit safetylink.online in Chrome</span>
        </div>
      </div>

      {/* Release Notes */}
      {release?.body && (
        <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <h3 className="font-bold mb-3 text-slate-300">What's new in {version}</h3>
          <p className="text-slate-400 text-sm whitespace-pre-line">{release.body.substring(0, 500)}</p>
        </div>
      )}

      <p className="text-slate-600 text-xs mt-8">
        SafetyLink by TM Media Solutions · <a href="/" className="hover:text-slate-400 transition-colors">safetylink.online</a>
      </p>
    </div>
  );
}
