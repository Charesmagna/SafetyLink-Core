import React, { useState, useEffect } from 'react';

interface Props { onClose: () => void; }

export const DownloadHub: React.FC<Props> = ({ onClose }) => {
  const [apkUrl, setApkUrl] = useState('');
  const [exeUrl, setExeUrl] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use XHR to bypass any fetch interceptors
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest', true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 10000;
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data?.assets) {
          const apk = data.assets.find((a: any) => a.name.endsWith('.apk'));
          const exe = data.assets.find((a: any) => a.name.endsWith('.exe'));
          if (apk) setApkUrl(apk.browser_download_url);
          if (exe) setExeUrl(exe.browser_download_url);
          if (data.tag_name) setVersion(data.tag_name.replace('v', ''));
        }
      } catch {}
      setLoading(false);
    };
    xhr.onerror = () => setLoading(false);
    xhr.ontimeout = () => setLoading(false);
    xhr.send();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="w-full max-w-sm bg-[#0d1117] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 bg-black/50 rounded-full z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-500 mb-3 border border-red-500/30 text-2xl">📱</div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase font-mono">Download SafetyLink</h2>
            {version && <p className="text-emerald-400 font-mono text-xs mt-1">v{version} — Latest Stable</p>}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-red-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {apkUrl ? (
                <a href={apkUrl} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg">
                  📱 Download Android APK
                </a>
              ) : (
                <a href="https://wa.me/27739441222?text=SafetyLink+APK+download" target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 to-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all">
                  📱 Request Android APK
                </a>
              )}

              {exeUrl ? (
                <a href={exeUrl} className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg">
                  💻 Download Windows EXE
                </a>
              ) : (
                <a href="https://wa.me/27739441222?text=SafetyLink+Windows+EXE+download" target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all">
                  💻 Request Windows EXE
                </a>
              )}

              <a href="https://safetylink.online" target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#1a1c2e] border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all">
                🌐 Open Web App (PWA)
              </a>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-center gap-4 text-center">
                  <a href="mailto:support@safetylink.online" className="text-[10px] text-blue-400 hover:text-blue-300 font-mono">support@safetylink.online</a>
                  <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
