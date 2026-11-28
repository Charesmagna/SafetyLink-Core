import React from 'react';
import { useReleaseChannels } from '../hooks/useReleaseChannels';

interface Props { onClose: () => void; }

export const DownloadHub: React.FC<Props> = ({ onClose }) => {
  const channels = useReleaseChannels();
  const stableTag = channels.stable.version;
  const stableBuild = channels.stable.buildNumber ? `Build #${channels.stable.buildNumber}` : 'main';
  const testingTag = channels.testing.version;
  const testingBuild = channels.testing.buildNumber ? `Build #${channels.testing.buildNumber}` : 'beta';

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="w-full max-w-sm bg-[#0d1117] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 bg-black/50 rounded-full z-10 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/30 p-2">
              <img src="/logos/Safety_Link_Logo_Transparent.png" alt="SafetyLink" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-black text-white tracking-wide uppercase font-mono">SafetyLink APK · v1</h2>
            <p className="text-emerald-400 font-mono text-xs mt-1">
              Official Stable (main) · {stableTag} · {stableBuild}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={channels.stable.apkUrl}
              download={`SafetyLink-v1-${stableTag}.apk`}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-4 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-xs transition-all shadow-lg"
            >
              🛡️ Download Stable v1 ({stableTag})
            </a>

            <a
              href={channels.desktopExe.url}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-xs transition-all shadow-lg"
            >
              💻 Download Windows EXE ({channels.desktopExe.version})
            </a>

            <a
              href="https://safetylink.online"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#1a1c2e] border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-4 py-3.5 rounded-xl font-bold font-mono uppercase tracking-wider text-xs transition-all"
            >
              🌐 Open Web App (PWA)
            </a>

            <details className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-[10px] font-mono text-slate-400">
              <summary className="cursor-pointer select-none hover:text-slate-300">
                Testing Track · {testingTag} ({testingBuild}) · Testers Only
              </summary>
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                <p className="text-[10px] text-amber-400/90 leading-relaxed">
                  {channels.sameBuildAsTesting
                    ? `Currently on the same GitHub build (${stableTag}) as Stable v1 after a fresh push to main.`
                    : `Testing track (${testingTag}) trials changes ahead of Stable v1 (${stableTag}).`}
                </p>
                <a
                  href={channels.testing.apkUrl}
                  download={`SafetyLink-Testing-${testingTag}.apk`}
                  className="inline-block underline text-slate-400 hover:text-white"
                >
                  Download Testing APK ({testingTag})
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
        </div>
      </div>
    </div>
  );
};
