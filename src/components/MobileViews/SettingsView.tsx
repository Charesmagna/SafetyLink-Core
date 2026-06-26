import React, { useState, useEffect } from "react";
import { 
  Sliders, Lock, Shield, LayoutGrid, CheckCircle2, Languages, Download, 
  Terminal, RefreshCw, AlertTriangle, User, Phone, Trash2, Heart, Plus 
} from "lucide-react";

interface Contact {
  name: string;
  relationship: string;
  phone: string;
}

interface SettingsViewProps {
  widgetLayout: "compact" | "dual" | "full";
  setWidgetLayout: (layout: "compact" | "dual" | "full") => void;
  currentUser: any;
  contacts: Contact[];
  onAddContact: (name: string, relationship: string, phone: string) => void;
  onDeleteContact: (index: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  onSaveProfile?: (data: any) => Promise<void>;
}

// South African language asset configurations
const SA_LANGUAGES = [
  { code: "english", label: "English (GP/WC standard)", flag: "🇿🇦", size: "1.2 MB", desc: "Core terminology & speech synthesis" },
  { code: "tshivenda", label: "Tshivenda (Venda Pack)", flag: "🇿🇦", size: "3.4 MB", desc: "Nḓila ya tshiimo tsha tshipanganḓaka" },
  { code: "zulu", label: "isiZulu (Natal Pack)", flag: "🇿🇦", size: "4.2 MB", desc: "Ukusiza ezimeni eziphuthumayo" },
  { code: "afrikaans", label: "Afrikaans (Noodhulp)", flag: "🇿🇦", size: "2.8 MB", desc: "Noodhulpbystand & stemboodskappe" }
];

export default function SettingsView({
  widgetLayout,
  setWidgetLayout,
  currentUser,
  contacts,
  onAddContact,
  onDeleteContact,
  showToast,
  onSaveProfile
}: SettingsViewProps) {
  const [biometrics, setBiometrics] = useState(true);
  const [wakeLock, setWakeLock] = useState(true);
  const [offlineTransport, setOfflineTransport] = useState("sms");

  // Sticky Daemon Simulator States
  const [stickyDaemonActive, setStickyDaemonActive] = useState(true);
  const [isRestartingDaemon, setIsRestartingDaemon] = useState(false);
  const [daemonLogs, setDaemonLogs] = useState<string[]>([
    "Service autostart triggered by boot receiver...",
    "Secured BLE broadcast keep-alive handshake (iTAG-Core)...",
    "Background service daemon running in sticky mode."
  ]);

  // Language Downloader States
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState("0 MB/s");
  const [installedLanguages, setInstalledLanguages] = useState<string[]>(
    currentUser?.downloadedLanguages || ["english"]
  );

  // New emergency contact state inside Settings
  const [newContactName, setNewContactName] = useState("");
  const [newContactRel, setNewContactRel] = useState("Spouse");
  const [newContactPhone, setNewContactPhone] = useState("+27 ");

  // Handle South African Language Downloads
  const triggerLanguageDownload = (langCode: string) => {
    if (installedLanguages.includes(langCode)) {
      showToast(`${langCode.toUpperCase()} language pack is already cached.`, "info");
      return;
    }

    setDownloadingCode(langCode);
    setDownloadProgress(0);
    setDownloadSpeed("1.8 MB/s");

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingCode(null);
          const nextLangs = [...installedLanguages, langCode];
          setInstalledLanguages(nextLangs);
          
          if (onSaveProfile) {
            onSaveProfile({ id: currentUser.id, downloadedLanguages: nextLangs });
          }
          
          showToast(`🇿🇦 ${langCode.toUpperCase()} Language Pack installed & fully cached offline!`, "success");
          return 100;
        }
        
        // Randomize download speed slightly for realistic feel
        const randomSpeed = (Math.random() * 1.5 + 1.2).toFixed(1);
        setDownloadSpeed(`${randomSpeed} MB/s`);
        return prev + Math.floor(Math.random() * 15 + 10);
      });
    }, 400);
  };

  // Force Daemon Hard Restart Simulator (AdGuard style)
  const handleForceDaemonRestart = () => {
    setIsRestartingDaemon(true);
    setDaemonLogs([]);
    showToast("Hard restarting persistent background daemon...", "info");

    const steps = [
      { text: "Killing active foreground daemon (PID: 29048)...", delay: 300 },
      { text: "Re-verifying FIPS KeyStore alias integrity...", delay: 600 },
      { text: "Registering sticky autostart BOOT_COMPLETED broadcast receiver...", delay: 1000 },
      { text: "Re-establishing Bluetooth GATT link heartbeat...", delay: 1500 },
      { text: "Persistent background service locked in RAM (AdGuard Sticky Mode ACTIVE).", delay: 2000 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDaemonLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step.text}`]);
        if (idx === steps.length - 1) {
          setIsRestartingDaemon(false);
          showToast("Sticky system daemon revived and secured!", "success");
        }
      }, step.delay);
    });
  };

  // Add contact form submission
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || newContactPhone.trim().length < 5) {
      showToast("Please provide a valid contact name and phone number.", "error");
      return;
    }
    onAddContact(newContactName, newContactRel, newContactPhone);
    setNewContactName("");
    setNewContactRel("Spouse");
    setNewContactPhone("+27 ");
    showToast("Emergency cascade contact updated.", "success");
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left overflow-y-auto pb-16">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Client Hardening</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono font-bold">NATIVE DAEMONS, LANGUAGES & CASCADE SETTINGS</p>
      </div>

      {/* STICKY DAEMON AUTOSTART COUPLING (AdGuard-Style System Coupling) */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-rose-500/30 space-y-3.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl border-l border-b border-rose-500/20">
          STICKY COUPLING
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-950/40 text-rose-400 rounded-xl border border-rose-500/20">
            <Shield className="w-4.5 h-4.5 animate-pulse text-rose-500" />
          </div>
          <div>
            <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase font-mono block">
              ADGUARD-STYLE CORE SERVICE
            </span>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Sticky Autostart Keep-Alive Daemon</h4>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 font-semibold leading-normal font-sans">
          Secures the client background thread in RAM. If the operating system or user attempts to kill the background processes, the daemon auto-launches immediately after reboot to maintain your physical BLE iTAG keyfob handshake.
        </p>

        {/* Toggle sticky */}
        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-850">
          <div className="text-left">
            <h5 className="text-[10px] font-bold text-slate-200">Enforce Hard Autostart Coupling</h5>
            <p className="text-[8px] text-slate-500 font-semibold">Binds permanent lockscreen persistent notification overlay.</p>
          </div>
          <input
            type="checkbox"
            checked={stickyDaemonActive}
            onChange={(e) => {
              setStickyDaemonActive(e.target.checked);
              showToast(
                e.target.checked 
                  ? "AdGuard-style persistent background service active." 
                  : "Caution: Persistent daemon disabled. BLE triggers may drop in background.", 
                e.target.checked ? "success" : "info"
              );
            }}
            className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 cursor-pointer focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Diagnostics console terminal */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block font-mono flex items-center gap-1">
              <Terminal className="w-3 h-3 text-rose-500" />
              Daemon System Logs (AdGuard Protocol)
            </span>
            <button 
              onClick={handleForceDaemonRestart}
              disabled={isRestartingDaemon}
              className="text-[8.5px] uppercase font-bold text-rose-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 bg-rose-950/40 border border-rose-500/20 rounded cursor-pointer"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRestartingDaemon ? 'animate-spin' : ''}`} />
              Force Restart Daemon
            </button>
          </div>

          <div className="bg-black/90 rounded-xl p-3 border border-slate-850 font-mono text-[8px] text-slate-300 space-y-1 h-[90px] overflow-y-auto">
            {daemonLogs.map((log, idx) => (
              <p key={idx} className={idx === daemonLogs.length - 1 ? "text-emerald-400 font-bold" : ""}>
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* SOUTH AFRICAN LANGUAGES PACK DOWNLOADER */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-indigo-500/30 space-y-3 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Languages className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase font-mono block">
              LOCALIZATION ENGINE
            </span>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">South African Language Packs</h4>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 font-semibold leading-normal font-sans">
          Download off-grid, offline South African voice synthesis and dictionary modules to support voice alerts and dispatch.
        </p>

        {/* List of SA Languages */}
        <div className="space-y-2.5 pt-1">
          {SA_LANGUAGES.map(lang => {
            const isInstalled = installedLanguages.includes(lang.code);
            const isDownloading = downloadingCode === lang.code;

            return (
              <div 
                key={lang.code}
                className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 flex flex-col space-y-1.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm select-none">{lang.flag}</span>
                    <div className="text-left">
                      <span className="text-[9.5px] font-black text-slate-200 block leading-none">{lang.label}</span>
                      <span className="text-[7.5px] text-slate-500 leading-none">{lang.desc}</span>
                    </div>
                  </div>

                  {isInstalled ? (
                    <span className="text-[7.5px] font-black uppercase px-2 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 rounded leading-none">
                      Installed
                    </span>
                  ) : isDownloading ? (
                    <span className="text-[7.5px] font-mono font-bold text-indigo-400 animate-pulse leading-none">
                      {downloadProgress}% ({downloadSpeed})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerLanguageDownload(lang.code)}
                      className="text-[7.5px] font-black uppercase px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/20 rounded cursor-pointer leading-none flex items-center gap-1 transition"
                    >
                      <Download className="w-2.5 h-2.5" />
                      Download ({lang.size})
                    </button>
                  )}
                </div>

                {/* Progress bar simulation for download */}
                {isDownloading && (
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EMERGENCY CONTACT INFORMATION (CASCADE SEQUENCE CONTROLLER) */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 text-slate-400 rounded-xl border border-slate-850">
            <Heart className="w-4.5 h-4.5 text-rose-500" />
          </div>
          <div>
            <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase font-mono block">
              DIAL CASCADE SETTINGS
            </span>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Emergency Contacts & Order</h4>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 font-semibold leading-normal font-sans">
          Configure who is dialed by our automated South African dispatch call center if you trigger an SOS.
        </p>

        {/* Add quick contact within settings */}
        <form onSubmit={handleAddContactSubmit} className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850/60 space-y-2">
          <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider block">Add Fast Cascade Contact:</span>
          
          <div className="space-y-1.5">
            <input 
              type="text" 
              placeholder="Name" 
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-[10px] text-slate-200"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={newContactRel}
                onChange={(e) => setNewContactRel(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-1.5 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Neighbor">Neighbor</option>
                <option value="CPF Coordinator">CPF Coordinator</option>
                <option value="Armed Patrol">Armed Patrol</option>
              </select>
              <input 
                type="text" 
                placeholder="Phone (e.g. +2782...)" 
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-[10px] font-mono text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] py-1.5 rounded-lg transition uppercase font-mono tracking-wider flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Append Contact
          </button>
        </form>

        {/* List of currently configured contacts */}
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
          {contacts.map((contact, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 p-2 rounded-xl border border-slate-850 flex items-center justify-between"
            >
              <div className="text-left space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[6.5px] bg-indigo-950 text-indigo-400 px-1 py-0.5 rounded leading-none uppercase font-mono font-black">
                    #{idx + 1} Cascade
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold">• {contact.relationship}</span>
                </div>
                <h5 className="text-[10px] font-black text-slate-200">{contact.name}</h5>
                <p className="text-[8px] font-mono text-slate-400 leading-none">{contact.phone}</p>
              </div>

              <button
                onClick={() => {
                  onDeleteContact(idx);
                  showToast("Emergency contact removed.", "info");
                }}
                className="p-1 text-slate-500 hover:text-rose-500 rounded hover:bg-slate-950 cursor-pointer"
                title="Delete Contact"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Widget Layout Configurator */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-850 space-y-3.5 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-950/40 text-rose-400 rounded-xl border border-rose-500/20">
            <LayoutGrid className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase font-mono block">
              ANDROID WIDGET API
            </span>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Home Screen Panic Widget</h4>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 font-semibold leading-normal font-sans">
          Select which SafetyLink emergency widget layout is deployed on your Android launcher home screen:
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setWidgetLayout("compact")}
            className={`py-2 px-1 text-center rounded-xl border text-[10px] font-extrabold transition uppercase tracking-wider cursor-pointer ${
              widgetLayout === "compact"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            Compact
          </button>

          <button
            type="button"
            onClick={() => setWidgetLayout("dual")}
            className={`py-2 px-1 text-center rounded-xl border text-[10px] font-extrabold transition uppercase tracking-wider cursor-pointer ${
              widgetLayout === "dual"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            Dual SOS
          </button>

          <button
            type="button"
            onClick={() => setWidgetLayout("full")}
            className={`py-2 px-1 text-center rounded-xl border text-[10px] font-extrabold transition uppercase tracking-wider cursor-pointer ${
              widgetLayout === "full"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            Tactical
          </button>
        </div>
      </div>

      {/* Keystore Verification Box */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850/80 text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Keystore Cryptography</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-xs font-black text-slate-200 uppercase tracking-wide font-sans">FIPS 140-2 Level 3 Secure</p>
        <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
          Hardware-backed master AES key: <strong className="text-slate-400">ALIAS_SL_SECURE_VAULT_KEY_0x9B11</strong>
        </p>
      </div>

      {/* Toggle lists */}
      <div className="space-y-2">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
          Native Operating System Overrides
        </span>

        {/* Biometrics */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
          <div className="text-left max-w-[210px]">
            <h4 className="font-extrabold text-xs text-slate-200">Biometric Authentication Lock</h4>
            <p className="text-[8px] text-slate-500 font-semibold leading-normal mt-0.5">
              Requires fingerprint verification before editing profile biodata or resolving incidents.
            </p>
          </div>
          <input
            type="checkbox"
            checked={biometrics}
            onChange={(e) => setBiometrics(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 cursor-pointer focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Wake Lock */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
          <div className="text-left max-w-[210px]">
            <h4 className="font-extrabold text-xs text-slate-200">Prevent Doze / Sleep Optimization</h4>
            <p className="text-[8px] text-slate-500 font-semibold leading-normal mt-0.5">
              Bypasses Android power throttling to guarantee 24/7 background BLE button scanning.
            </p>
          </div>
          <input
            type="checkbox"
            checked={wakeLock}
            onChange={(e) => setWakeLock(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-800 cursor-pointer focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Failsafe Offline Carrier Selection */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
          <div className="text-left max-w-[160px]">
            <h4 className="font-extrabold text-xs text-slate-200">Failsafe Primary Transport</h4>
            <p className="text-[8px] text-slate-500 font-semibold leading-normal mt-0.5">
              Selects target protocol when internet/data access fails.
            </p>
          </div>
          <select
            value={offlineTransport}
            onChange={(e) => setOfflineTransport(e.target.value)}
            className="bg-slate-950 text-slate-300 text-[10px] font-bold border border-slate-800 rounded px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="sms">SirenLink GSM-SMS</option>
            <option value="sat">SirenLink Satellite</option>
          </select>
        </div>
      </div>
    </div>
  );
}
