import React, { useState } from "react";
import { Lock, HardDrive, Radio, Trash2, Camera, Mic, Volume2 } from "lucide-react";

export default function EvidenceView() {
  const [evidenceList, setEvidenceList] = useState([
    { id: "evid-1", name: "EVID_AMB_AUDIO_S4.aac", type: "Ambient Audio", size: "1.2 MB", timestamp: "Today, 11:24 AM", security: "AES-256 (Keystore)" },
    { id: "evid-2", name: "EVID_CAM_LOW_LIGHT.jpg", type: "Camera Frame", size: "640 KB", timestamp: "Today, 11:24 AM", security: "AES-256 (Keystore)" },
    { id: "evid-3", name: "GEOTRK_ROUTE_LOG.gpx", type: "GPS Trail Logs", size: "12 KB", timestamp: "Today, 11:23 AM", security: "SHA-256 Signed" },
  ]);
  const [capturing, setCapturing] = useState<string | null>(null);

  const simulateCapture = (type: "audio" | "camera") => {
    setCapturing(type === "audio" ? "sound buffer" : "low-light camera");
    setTimeout(() => {
      const isAudio = type === "audio";
      const newEv = {
        id: "evid-" + Date.now(),
        name: isAudio ? `EVID_AMB_AUDIO_S${Math.floor(Math.random() * 9 + 1)}.aac` : `EVID_SNAP_GRID_${Math.floor(Math.random() * 900 + 100)}.jpg`,
        type: isAudio ? "Ambient Audio" : "Camera Frame",
        size: isAudio ? "840 KB" : "512 KB",
        timestamp: "Just Now",
        security: "AES-256 (Keystore)",
      };
      setEvidenceList((prev) => [newEv, ...prev]);
      setCapturing(null);
    }, 1800);
  };

  const deleteEvidence = (id: string) => {
    setEvidenceList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Evidence Vault</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">ENCRYPTED MEDIA & CITIZEN RECORDBACK AUDITS</p>
      </div>

      {/* Security Status Box */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850/80 flex items-center gap-3.5 shadow-inner">
        <div className="p-2 bg-blue-950/40 text-blue-400 rounded-xl border border-blue-500/20">
          <Lock className="w-5 h-5" />
        </div>
        <div className="text-left">
          <span className="text-[8px] font-black tracking-widest text-blue-400 uppercase font-mono block">Vault Hardware Link</span>
          <p className="text-xs font-bold text-slate-200">Keystore Hardware Encrypted</p>
          <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-normal">
            Every audio log and image is locally wrapped in AES-256 GCM using keys pinned within the physical Android Keystore.
          </p>
        </div>
      </div>

      {/* Capture trigger buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => simulateCapture("audio")}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-2xl text-xs font-extrabold text-slate-300 transition active:scale-95 cursor-pointer disabled:opacity-40 shadow"
        >
          <Mic className="w-4 h-4 text-rose-500" />
          {capturing === "sound buffer" ? "Recording Buffer..." : "Simulate Mic Buffer"}
        </button>

        <button
          onClick={() => simulateCapture("camera")}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-2xl text-xs font-extrabold text-slate-300 transition active:scale-95 cursor-pointer disabled:opacity-40 shadow"
        >
          <Camera className="w-4 h-4 text-blue-400" />
          {capturing === "low-light camera" ? "Snapping lens..." : "Simulate Low-Light Snap"}
        </button>
      </div>

      {/* Capturing feedback bar */}
      {capturing && (
        <div className="bg-blue-950/30 border border-blue-500/20 px-3 py-2 rounded-xl text-center flex items-center justify-center gap-2 animate-pulse">
          <Radio className="w-4 h-4 text-blue-400" />
          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider font-mono">
            Buffered {capturing} live stream, writing block segment...
          </p>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-2.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
          Protected Incident Assets ({evidenceList.length})
        </span>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {evidenceList.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 flex items-center justify-between"
            >
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <h4 className="font-bold text-xs text-slate-300 leading-none">{item.name}</h4>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold font-mono">
                  <span>{item.type}</span>
                  <span>•</span>
                  <span>{item.size}</span>
                  <span>•</span>
                  <span className="text-blue-400">{item.security}</span>
                </div>
                <p className="text-[8px] text-slate-600 font-mono font-medium">Logged: {item.timestamp}</p>
              </div>

              <button
                onClick={() => deleteEvidence(item.id)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 hover:text-rose-500 text-slate-500 rounded-lg border border-slate-850 cursor-pointer shadow-inner transition"
                title="Wipe asset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
