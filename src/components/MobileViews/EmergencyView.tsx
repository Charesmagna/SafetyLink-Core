import React from "react";
import { AlertOctagon, ShieldAlert, Heart, Flame, VolumeX, Check, RefreshCw } from "lucide-react";
import { User } from "../../types";

interface EmergencyViewProps {
  currentUser: User;
  isHoldingSos: boolean;
  holdProgress: number;
  startSosHold: () => void;
  cancelSosHold: () => void;
  isDispatching: boolean;
  dispatchStage: number;
  activeEmergencyType: "standard" | "silent" | "medical" | "fire" | "security" | null;
  simulatedNetwork: "online" | "offline";
  gpsLatitude: number;
  gpsLongitude: number;
  onInstantEmergency: (type: "standard" | "silent" | "medical" | "fire" | "security", notes?: string) => void;
}

export default function EmergencyView({
  currentUser,
  isHoldingSos,
  holdProgress,
  startSosHold,
  cancelSosHold,
  isDispatching,
  dispatchStage,
  activeEmergencyType,
  simulatedNetwork,
  gpsLatitude,
  gpsLongitude,
  onInstantEmergency,
}: EmergencyViewProps) {
  // Define progressive stages
  const stages = [
    { label: "GPS Handshake", desc: `Securing satellite lock-on: ${gpsLatitude.toFixed(4)}, ${gpsLongitude.toFixed(4)}` },
    { label: "Evidence Capture", desc: "Activating encrypted 15s ambient audio buffer (AES-256)" },
    { label: "Hardened Offline Queue", desc: simulatedNetwork === "offline" ? "No signal: Staged in secure SQLite cache" : "Broadcasting: Bypassing local offline buffer" },
    { label: "SMS Fallback Cascade", desc: "Twilio GSM-SMS backup relays armed for contacts" },
    { label: "Gauteng Tower Link", desc: "Active connection with Johannesburg Dispatch Control tower" },
  ];

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Tactical Emergencies</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">MD3 HIGH-CONTRAST SECURE ACTIVATOR</p>
      </div>

      {/* Main Hold-to-SOS Area or Dispatching progress */}
      {!isDispatching ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-3xl border border-slate-850/80 p-5 text-center min-h-[300px]">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black font-mono">Direct Alarm Activator</p>
          <p className="text-[10px] text-slate-500 max-w-[240px] mt-1 mb-8 leading-relaxed font-semibold">
            Press and hold the central red shield continuously for 2 seconds to initiate standard satellite dispatches
          </p>

          {/* Big hold button */}
          <div className="relative flex items-center justify-center w-48 h-48">
            {/* Outer pulse effect when holding */}
            {isHoldingSos && (
              <div className="absolute inset-0 rounded-full bg-rose-600/20 animate-ping"></div>
            )}

            {/* Circular hold status border */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="#1e293b"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="84"
                stroke="#ef4444"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="528"
                strokeDashoffset={528 - (528 * holdProgress) / 100}
                className="transition-all duration-200"
              />
            </svg>

            {/* The core tactile button */}
            <button
              onMouseDown={startSosHold}
              onMouseUp={cancelSosHold}
              onMouseLeave={cancelSosHold}
              onTouchStart={startSosHold}
              onTouchEnd={cancelSosHold}
              className="absolute w-36 h-36 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-full flex flex-col items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <AlertOctagon className="w-10 h-10 text-white animate-pulse" />
              <span className="font-black text-sm text-white mt-2 uppercase tracking-widest font-sans">HOLD SOS</span>
              <span className="text-[9px] text-white/70 mt-1 font-mono font-bold">
                {isHoldingSos ? "RECORDING..." : "2S BUFFER"}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Dispatch Stage Progress Telemetry Board */
        <div className="flex-grow flex flex-col p-4 bg-slate-950 rounded-3xl border border-slate-850/80 space-y-4">
          <div className="flex justify-between items-center bg-rose-600/10 border border-rose-500/20 px-3 py-2 rounded-xl">
            <div className="text-left">
              <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase font-mono">EMERGENCY ACTIVE</span>
              <p className="text-xs font-black text-white uppercase">{activeEmergencyType || "Standard"} SOS Dispatched</p>
            </div>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {stages.map((stage, idx) => {
              const isDone = dispatchStage > idx;
              const isCurrent = dispatchStage === idx;
              const isSkipped = simulatedNetwork === "offline" && idx >= 3;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex gap-3 items-start text-left transition ${
                    isDone
                      ? "bg-slate-900/60 border-slate-800 text-slate-300"
                      : isCurrent
                      ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                      : isSkipped
                      ? "bg-slate-950 border-dashed border-slate-900 text-slate-600 opacity-40"
                      : "bg-slate-950 border-slate-950 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <div className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/30 text-[9px] font-bold">
                        ✓
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center animate-spin text-[9px] font-bold">
                        <RefreshCw className="w-2.5 h-2.5" />
                      </div>
                    ) : isSkipped ? (
                      <div className="w-5 h-5 bg-slate-900 text-slate-600 rounded-full flex items-center justify-center border border-slate-850 text-[9px] font-mono">
                        ✕
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center border border-slate-850 text-[9px] font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-black text-[11px] uppercase tracking-wide leading-none">
                      {stage.label}
                    </h5>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono mt-1 leading-normal">
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom dispatch message */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-850/80 text-center space-y-1">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Relay Gateway Feedback</span>
            {simulatedNetwork === "offline" ? (
              <p className="text-[10px] text-amber-500 font-bold">
                ⚠️ CELLULAR FAILURE - Distress logs successfully saved to indexed offline queue. Automatic sync active.
              </p>
            ) : dispatchStage >= 5 ? (
              <p className="text-[10px] text-emerald-400 font-bold">
                ✓ DISPATCH SUCCESSFUL - GPS tracking active. Responders routed in Lenasia Sector.
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-semibold font-mono animate-pulse">
                Transmitting emergency packets... Stay calm.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grid of direct One-click Category alarms */}
      <div className="space-y-2">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Immediate Category Activators</span>
        <div className="grid grid-cols-4 gap-2">
          {/* Silent */}
          <button
            onClick={() => onInstantEmergency("silent", "Discrete silent distress triggered.")}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer shadow text-center"
          >
            <VolumeX className="w-5 h-5 text-slate-400" />
            <span className="text-[8px] font-black mt-1 text-slate-300 uppercase">Silent</span>
          </button>

          {/* Medical */}
          <button
            onClick={() => onInstantEmergency("medical", "EMS medical paramedics dispatch requested.")}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer shadow text-center"
          >
            <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
            <span className="text-[8px] font-black mt-1 text-slate-300 uppercase">Medical</span>
          </button>

          {/* Fire */}
          <button
            onClick={() => onInstantEmergency("fire", "Fire & Rescue brigade requested.")}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer shadow text-center"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-[8px] font-black mt-1 text-slate-300 uppercase">Fire</span>
          </button>

          {/* Security */}
          <button
            onClick={() => onInstantEmergency("security", "CPF Armed Response patrols requested.")}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer shadow text-center"
          >
            <ShieldAlert className="w-5 h-5 text-blue-500" />
            <span className="text-[8px] font-black mt-1 text-slate-300 uppercase">Security</span>
          </button>
        </div>
      </div>
    </div>
  );
}
