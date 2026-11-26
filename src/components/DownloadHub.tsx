import React, { useState, useEffect } from 'react';

interface Props { onClose: () => void; }

export const DownloadHub: React.FC<Props> = ({ onClose }) => {
  const [v1ApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/v1/safetylink.apk');
  const [betaApkUrl] = useState('https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/beta/safetylink.apk');
  const [exeUrl, setExeUrl] = useState('https://github.com/Charesmagna/SafetyLink-Core/releases/latest');
  const [betaBuild, setBetaBuild] = useState('v1.1.1000+');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases?per_page=10', true);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.timeout = 10000;
    xhr.onload = () => {
      try {
        const list = JSON.parse(xhr.responseText);
        if (Array.isArray(list)) {
          for (const rel of list) {
            if (!Array.isArray(rel?.assets)) continue;
            const apk = rel.assets.find((a: any) => a.name?.endsWith('.apk') && a.size > 80 * 1024 * 1024);
            const exe = rel.assets.find((a: any) => a.name?.endsWith('.exe'));
            if (apk?.browser_download_url) {
              if (rel.tag_name) setBetaBuild(String(rel.tag_name));
              if (exe?.browser_download_url) setExeUrl(exe.browser_download_url);
              break;
            }
          }
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
      <div className="w-full max-w-sm bg-[#0d1117] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 bg-black/50 rounded-full z-10 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/30 p-2">
              <img src="/logos/Safety_Link_Logo_Transparent.png" alt="SafetyLink" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase font-mono">SafetyLink APK</h2>
            <p className="text-emerald-400 font-mono text-xs mt-1">Version 1 — Official Signed Release</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3">
              <a href={v1ApkUrl} download="SafetyLink.apk" className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg">
                🛡️ Download SafetyLink APK
              </a>

              <a href={exeUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all shadow-lg">
                💻 Download Windows EXE
              </a>

              <a href="https://safetylink.online" target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#1a1c2e] border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-5 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-sm transition-all">
                🌐 Open Web App (PWA)
              </a>

              <details className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-[10px] font-mono text-slate-400">
                <summary className="cursor-pointer select-none hover:text-slate-300">
                  Testing Track · SafetyLink Beta (v1.1.1000+ · {betaBuild} · Testers Only)
                </summary>
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[10px] text-amber-400/90 leading-relaxed">
                    Experimental builds rolling from v1.1.1000+ (current: {betaBuild}). Not recommended for everyday protection.
                  </p>
                  <a href={betaApkUrl} download={`SafetyLink-Beta-${betaBuild}.apk`} className="inline-block underline text-slate-400 hover:text-white">
                    Download SafetyLink Beta ({betaBuild}) APK
                  </a>
                </div>
              </details>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex flex-wrap justify-center gap-3 text-center">
                  <a href="tel:0816738186" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono font-bold">📞 Tel. 081 673 8186</a>
                  <a href="tel:+27680079911" className="text-[10px] text-sky-400 hover:text-sky-300 font-mono font-bold">📲 Cel. +27 68 007 9911</a>
                  <a href="mailto:info@safetylink.online" className="text-[10px] text-blue-400 hover:text-blue-300 font-mono">✉️ info@safetylink.online</a>
                  <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono">💬 WhatsApp</a>
                  <a href="https://whatsapp.com/channel/0029Vb8MGfc0lwgn9sG1bz2s" target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono">📢 WA Channel</a>
                  <a href="https://chat.whatsapp.com/I4PH58YMv438cSU3iwqyu5" target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono">👥 WA Group</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
