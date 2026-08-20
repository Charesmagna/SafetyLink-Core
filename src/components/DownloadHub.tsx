import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const DownloadHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest releases from GitHub API
    fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReleases(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch releases:", err);
        setLoading(false);
      });
  }, []);

  const latestRelease = releases.length > 0 ? releases[0] : null;
  const previousReleases = releases.length > 1 ? releases.slice(1, 6) : [];

  const getApkUrl = (release: any) => {
    if (!release) return '#';
    const asset = release.assets.find((a: any) => a.name.endsWith('.apk') || a.name.endsWith('.exe'));
    return asset ? asset.browser_download_url : '#';
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[#1a1c23] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto relative pointer-events-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-10">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/30">
              <i className="fa-solid fa-cloud-arrow-down text-3xl"></i>
            </div>
            <h2 className="text-3xl font-black text-white tracking-wide uppercase font-mono">Download Hub</h2>
            <p className="text-gray-400 mt-2 font-mono text-xs uppercase tracking-wider">Access the latest SafetyLink Core applications</p>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Latest Release */}
              <div className="bg-slate-900/50 border border-emerald-500/40 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 font-mono uppercase">Latest Release</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-emerald-400 font-mono font-bold bg-emerald-950/40 px-2 py-0.5 rounded">{latestRelease?.tag_name || 'v1.0.0'}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 font-mono">Stable Build</span>
                    </div>
                  </div>
                  <a 
                    href={getApkUrl(latestRelease)}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold font-mono hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                  >
                    <i className="fa-solid fa-download"></i>
                    Download APK / EXE
                  </a>
                </div>
              </div>

              {/* Previous Versions */}
              {previousReleases.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2 font-mono">Previous Versions</h4>
                  <div className="space-y-3">
                    {previousReleases.map((release: any) => (
                      <div key={release.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                        <div className="mb-3 md:mb-0">
                          <div className="text-slate-200 font-bold font-mono text-sm">{release.name}</div>
                          <div className="text-gray-500 text-[10px] font-mono mt-1 uppercase tracking-wider">Tag: {release.tag_name}</div>
                        </div>
                        <a 
                          href={getApkUrl(release)}
                          className="text-amber-500 hover:text-white px-4 py-2 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors text-xs font-mono uppercase font-bold text-center"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
