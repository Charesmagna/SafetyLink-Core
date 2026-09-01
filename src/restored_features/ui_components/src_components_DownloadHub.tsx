import React, { useState, useEffect } from 'react';

export const DownloadHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [latestRelease, setLatestRelease] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestRelease = () => {
    try {
      fetch(`https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest`, { headers: { Accept: 'application/vnd.github.v3+json' } })
        .then(res => res.json())
        .then(data => {
          if (data && data.tag_name) {
            setLatestRelease(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch releases:", err);
          setLoading(false);
        });
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRelease();
  }, []);

  const getApkUrl = (release: any) => {
    if (!release || !Array.isArray(release.assets)) return '#';
    let asset = release.assets.find((a: any) => a && typeof a.name === 'string' && a.name.toLowerCase().includes('signed') && (a.name.endsWith('.apk') || a.name.endsWith('.exe')));
    if (!asset) {
      asset = release.assets.find((a: any) => a && typeof a.name === 'string' && (a.name.endsWith('.apk') || a.name.endsWith('.exe')));
    }
    return asset ? asset.browser_download_url : '#';
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto pointer-events-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#1a1c23] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto relative pointer-events-auto flex flex-col animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-10 bg-black/50 rounded-full">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-white tracking-wide uppercase font-mono">Download App</h2>
            <p className="text-gray-400 mt-2 font-mono text-xs uppercase tracking-wider">Install SafetyLink on your device</p>
          </div>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {latestRelease && getApkUrl(latestRelease) !== '#' ? (
                <div className="bg-slate-900/50 border border-emerald-500/40 rounded-xl p-6 relative overflow-hidden text-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                  <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase">Latest Stable Version</h3>
                  <div className="flex items-center justify-center gap-3 text-sm mb-6">
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded">v{latestRelease.tag_name?.replace('v', '') || '1.0.0'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 font-mono">Recommended</span>
                  </div>
                  <a 
                    href={getApkUrl(latestRelease)}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 rounded-xl font-bold font-mono hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-lg shadow-emerald-900/40"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download APK / EXE
                  </a>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-mono text-sm">No downloads currently available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
