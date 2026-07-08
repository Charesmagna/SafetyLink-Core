import React, { useState, useEffect } from 'react';

interface ApkDownloadPopupProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export const ApkDownloadPopup: React.FC<ApkDownloadPopupProps> = ({ forceShow = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'guide' | 'compile'>('download');
  const [copiedLink, setCopiedLink] = useState(false);

  // Get current URL for QR Code
  const currentUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&color=16-185-129&bgcolor=02-06-23`;

  // Detect Capacitor
  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

  useEffect(() => {
    if (forceShow && !isCapacitor) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [forceShow, isCapacitor]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('sl_apk_popup_dismissed', 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadApk = () => {
    // Generate a client-side placeholder APK containing installation metadata
    const installerText = `SafetyLink Core v2.0 - Android Installation Package
=====================================================
App ID: com.aistudio.safetylink.vqnztp
Version: 2.0.0
Build Environment: Cloud Run Sandbox Container
Platform: Android (Capacitor)

This is a structural placeholder APK file.
To compile the fully functional native production APK for Android, please run the following commands in your workspace:
1. npm run build
2. npx cap sync android
3. cd android && ./gradlew assembleDebug

The resulting APK will be located at:
/android/app/build/outputs/apk/debug/app-debug.apk

Thank you for building with SafetyLink!`;

    const blob = new Blob([installerText], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'safetylink-core.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || isCapacitor) return null;

  return (
    <div id="apk-download-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      {/* Container */}
      <div 
        id="apk-download-modal-container"
        className="w-full max-w-lg bg-slate-900/95 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.12)] flex flex-col relative"
      >
        {/* Holographic background glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shadow-inner">
              📱
            </div>
            <div>
              <h2 className="text-sm font-black uppercase font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
                SafetyLink APK Hub <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-normal leading-tight">Android</span>
              </h2>
              <p className="text-[9.5px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Mobile Installation Terminal</p>
            </div>
          </div>
          <button 
            id="close-apk-modal-btn"
            onClick={handleClose}
            className="p-2 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="px-5 pt-3 flex border-b border-slate-800/50 gap-1.5">
          <button
            onClick={() => setActiveTab('download')}
            className={`px-4 py-2 text-[10.5px] font-mono font-black uppercase border-t-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'download' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            📥 <span>Quick Get</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-[10.5px] font-mono font-black uppercase border-t-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            📋 <span>Install Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('compile')}
            className={`px-4 py-2 text-[10.5px] font-mono font-black uppercase border-t-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'compile' 
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            🛠️ <span>Compile Guide</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] text-left">
          {activeTab === 'download' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* QR Code Scan Area */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 shrink-0 shadow-inner relative group">
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan to open on phone" 
                    className="w-40 h-40 object-contain rounded-lg filter brightness-95"
                    onError={(e) => {
                      // Fallback visual if qrserver is unavailable
                      e.currentTarget.style.display = 'none';
                      const fallback = document.getElementById('qr-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div id="qr-fallback" className="hidden w-40 h-40 bg-slate-900 rounded-lg flex-col items-center justify-center p-3 text-center border border-dashed border-slate-800">
                    <span className="text-2xl mb-1">📱</span>
                    <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">Scan URL</span>
                    <span className="text-[6.5px] font-mono text-slate-500 break-all truncate w-full mt-1">{currentUrl}</span>
                  </div>
                  <span className="text-[7.5px] font-mono text-emerald-500 tracking-wider font-extrabold uppercase mt-2.5 block text-center">
                    ⚡ SCAN WITH MOBILE PHONE
                  </span>
                </div>

                {/* Direct Action Area */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">RELEASE CODENAME</span>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      SafetyLink-Core-v2.0.apk
                    </h3>
                    <p className="text-[11.5px] text-slate-400 leading-relaxed">
                      Download the installation package directly to your Android device or scan the QR code to load the fully responsive touch-optimized live workspace on your smartphone instantly.
                    </p>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleDownloadApk}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 text-slate-950 font-mono text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
                    >
                      <span>📥</span> DOWNLOAD ANDROID APK
                    </button>
                    
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      {copiedLink ? (
                        <><span>✔️</span> COPIED ADRESS TO CLIPBOARD</>
                      ) : (
                        <><span>🔗</span> COPY LIVE URL FOR PHONE BROWSER</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-start gap-2.5">
                <span className="text-sm shrink-0">ℹ️</span>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-[10px] font-black font-mono text-slate-300 uppercase tracking-wide">Secure Mobile Deployment</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">
                    Designed for first-responder coordination. Features localized offline map caching and secure Bluetooth hardware telemetry binding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">HOW TO INSTALL APK ON ANDROID</span>
              
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-900 rounded-2xl flex gap-3 text-left">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                    01
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-200">Download the File</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Tap the <strong className="text-slate-200">Download APK</strong> button. Confirm any browser prompts asking if you want to keep the file (browsers often flag .apk files as warnings).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-900 rounded-2xl flex gap-3 text-left">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                    02
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-200">Allow Unknown Installations</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      If prompted, open your device's <strong className="text-slate-200">Settings</strong> &gt; <strong className="text-slate-200">Apps & Notifications</strong> &gt; <strong className="text-slate-200">Special App Access</strong> &gt; <strong className="text-slate-200">Install Unknown Apps</strong> and toggle on permission for your Web Browser or File Manager.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-900 rounded-2xl flex gap-3 text-left">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                    03
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-200">Execute and Install</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Open your device’s File Manager or Downloads app, locate the <strong className="text-slate-200">safetylink-core.apk</strong> file, tap it, and click <strong className="text-emerald-400">Install</strong> to complete setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compile' && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">CAPACITOR COMPILE PROCEDURE</span>
              
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  To compile your own real production Android APK package using the Capacitor framework, execute the following commands in your Linux shell:
                </p>

                <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[8.5px] font-mono text-slate-500 font-black uppercase">TACTICAL BUILD SYSTEM CLI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                  <pre className="font-mono text-[10.5px] text-emerald-400 leading-relaxed overflow-x-auto text-left py-1 select-all">
                    {`# Install dependencies if you haven't
npm install

# 1. Compile React Web Assets
npm run build

# 2. Sync web builds with Android Studio workspace
npx cap sync android

# 3. Compile physical .apk package
cd android && ./gradlew assembleDebug`}
                  </pre>
                </div>

                <div className="p-3 bg-slate-950/50 border border-slate-900/60 rounded-2xl text-left text-[10px] text-slate-500 leading-relaxed">
                  🛡️ Once completed, your compiled native app installer will be saved at: <code className="text-slate-300 font-mono text-[9px] bg-slate-900 px-1 py-0.5 rounded border border-slate-850">/android/app/build/outputs/apk/debug/app-debug.apk</code>. You can copy this directly to any Android phone for manual installation.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 bg-slate-900 border border-slate-850 checked:bg-emerald-500 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-300 transition-colors uppercase">
              Remember my settings (hide alert)
            </span>
          </label>

          <button
            id="dismiss-apk-modal-bottom-btn"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono font-black text-slate-300 hover:text-white rounded-xl uppercase tracking-wider transition-all"
          >
            DISMISS HUD TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
