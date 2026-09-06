import React, { useState, useEffect } from 'react';

interface Asset {
  name: string;
  url: string;
  size: number;
}

export const DownloadHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [apkUrl, setApkUrl] = useState<string>('');
  const [exeUrl, setExeUrl] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json' }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.assets) {
          const apk = data.assets.find((a: any) => a.name.endsWith('.apk'));
          const exe = data.assets.find((a: any) => a.name.endsWith('.exe'));
          if (apk) setApkUrl(apk.browser_download_url);
          if (exe) setExeUrl(exe.browser_download_url);
          if (data.tag_name) setVersion(data.tag_name.replace('v', ''));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="w-full max-w-sm bg-[#1a1c23] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 bg-black/50 rounded-full z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mb-3 border border-amber-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase font-mono">Download SafetyLink</h2>
            {version && <p className="text-emerald-400 font-mono text-xs mt-1">v{version} — Latest Stable</p>}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {apkUrl ? (
                <a
                  href={apkUrl}
                  download
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg"
                >
                  <span>📱</span> Download for Android (.apk)
                </a>
              ) : null}

              {exeUrl ? (
                <a
                  href={exeUrl}
                  download
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg"
                >
                  <span>🖥️</span> Download for Windows (.exe)
                </a>
              ) : null}

              {!apkUrl && !exeUrl && (
                <p className="text-center text-slate-400 font-mono text-sm py-4">No downloads available right now.</p>
              )}

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest text-center">Need help?</p>
                <div className="flex flex-col gap-1.5 text-center">
                  <a href="mailto:support@safetylink.online" className="text-[10px] text-blue-400 hover:text-blue-300 font-mono">support@safetylink.online</a>
                  <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp Support</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
