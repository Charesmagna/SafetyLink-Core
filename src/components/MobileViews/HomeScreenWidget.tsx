import React from "react";
import { Shield, AlertOctagon, Flame, ShieldAlert, Heart, VolumeX } from "lucide-react";

interface HomeScreenWidgetProps {
  widgetLayout: "compact" | "dual" | "full";
  isHoldingWidget: boolean;
  widgetHoldProgress: number;
  onWidgetHoldStart: () => void;
  onWidgetHoldEnd: () => void;
  onInstantTrigger: (type: "standard" | "silent" | "medical" | "fire" | "security", notes?: string) => void;
}

export default function HomeScreenWidget({
  widgetLayout,
  isHoldingWidget,
  widgetHoldProgress,
  onWidgetHoldStart,
  onWidgetHoldEnd,
  onInstantTrigger,
}: HomeScreenWidgetProps) {
  return (
    <div className="bg-slate-950/90 rounded-3xl border border-slate-800/80 p-4 shadow-xl relative overflow-hidden text-left">
      <div className="absolute top-0 right-0 bg-rose-600/10 border-l border-b border-rose-500/20 text-rose-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">
        {widgetLayout === "compact" ? "Compact Widget" : widgetLayout === "dual" ? "Dual Widget" : "Full Tactical Grid"}
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 bg-rose-600/15 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/20 shrink-0">
          <Shield className="w-4.5 h-4.5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">SafetyLink Widget</h4>
          <p className="text-[9px] text-slate-500 font-semibold uppercase">Certified Android 15 Failsafe</p>
        </div>
      </div>

      {/* COMPACT LAYOUT - Large circular Hold SOS only */}
      {widgetLayout === "compact" && (
        <div className="flex flex-col items-center justify-center py-2">
          <button
            onMouseDown={onWidgetHoldStart}
            onMouseUp={onWidgetHoldEnd}
            onMouseLeave={onWidgetHoldEnd}
            onTouchStart={onWidgetHoldStart}
            onTouchEnd={onWidgetHoldEnd}
            className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-rose-950 to-rose-900 border-4 border-slate-900 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-xl ${
              isHoldingWidget ? "ring-4 ring-rose-500/40" : ""
            }`}
          >
            <div
              className="absolute inset-0 bg-rose-600 rounded-full transition-all duration-100 opacity-25"
              style={{ transform: `scale(${widgetHoldProgress / 100})` }}
            ></div>
            <AlertOctagon className="w-8 h-8 text-rose-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-rose-200">
              {isHoldingWidget ? `${widgetHoldProgress}%` : "HOLD SOS"}
            </span>
          </button>
          <p className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold mt-2.5">
            Requires 2-second continuous hold
          </p>
        </div>
      )}

      {/* DUAL PANIC LAYOUT - Hold SOS and Instant Silent Button */}
      {widgetLayout === "dual" && (
        <div className="grid grid-cols-2 gap-3 py-1">
          {/* Circular Hold SOS */}
          <div className="flex flex-col items-center justify-center">
            <button
              onMouseDown={onWidgetHoldStart}
              onMouseUp={onWidgetHoldEnd}
              onMouseLeave={onWidgetHoldEnd}
              onTouchStart={onWidgetHoldStart}
              onTouchEnd={onWidgetHoldEnd}
              className={`relative w-24 h-24 rounded-full bg-gradient-to-tr from-rose-950 to-rose-900 border-4 border-slate-900 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-lg ${
                isHoldingWidget ? "ring-4 ring-rose-500/40" : ""
              }`}
            >
              <div
                className="absolute inset-0 bg-rose-600 rounded-full transition-all duration-100 opacity-25"
                style={{ transform: `scale(${widgetHoldProgress / 100})` }}
              ></div>
              <AlertOctagon className="w-7 h-7 text-rose-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-rose-200">
                {isHoldingWidget ? `${widgetHoldProgress}%` : "HOLD SOS"}
              </span>
            </button>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">Hold standard</span>
          </div>

          {/* Instant Silent */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => onInstantTrigger("silent", "Silent distress triggered via dual widget shortcut.")}
              className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 hover:border-slate-700 active:scale-95 flex flex-col items-center justify-center transition cursor-pointer shadow-lg text-slate-400 hover:text-white"
            >
              <VolumeX className="w-7 h-7 text-amber-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-slate-300">SILENT</span>
            </button>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">One-click discrete</span>
          </div>
        </div>
      )}

      {/* FULL TACTICAL GRID - All 5 buttons in an elegant layout */}
      {widgetLayout === "full" && (
        <div className="space-y-3">
          {/* Central Hold SOS Area */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-slate-850/80">
            <button
              onMouseDown={onWidgetHoldStart}
              onMouseUp={onWidgetHoldEnd}
              onMouseLeave={onWidgetHoldEnd}
              onTouchStart={onWidgetHoldStart}
              onTouchEnd={onWidgetHoldEnd}
              className={`relative w-16 h-16 rounded-full bg-gradient-to-tr from-rose-950 to-rose-900 border-2 border-slate-950 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                isHoldingWidget ? "ring-2 ring-rose-500/40" : ""
              }`}
            >
              <div
                className="absolute inset-0 bg-rose-600 rounded-full transition-all duration-100 opacity-25"
                style={{ transform: `scale(${widgetHoldProgress / 100})` }}
              ></div>
              <span className="text-[8px] font-extrabold uppercase text-rose-200 text-center leading-none">
                {isHoldingWidget ? `${widgetHoldProgress}%` : "HOLD\nSOS"}
              </span>
            </button>
            <div className="text-left ml-3">
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest block">TACTICAL DISPATCH</span>
              <p className="text-[9px] text-slate-400 font-medium">Main hold-to-activate trigger</p>
            </div>
            <div className="text-[8px] bg-rose-600/10 text-rose-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
              2s Guard
            </div>
          </div>

          {/* Grid of 4 Instant Short Triggers */}
          <div className="grid grid-cols-4 gap-2">
            {/* Silent Trigger */}
            <button
              onClick={() => onInstantTrigger("silent", "Silent alarm triggered via full tactical widget.")}
              className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer"
            >
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span className="text-[8px] font-bold mt-1 text-slate-300">Silent</span>
            </button>

            {/* Medical Trigger */}
            <button
              onClick={() => onInstantTrigger("medical", "EMS Medical emergency triggered via widget.")}
              className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer"
            >
              <Heart className="w-4 h-4 text-amber-500" />
              <span className="text-[8px] font-bold mt-1 text-slate-300">Medical</span>
            </button>

            {/* Fire Trigger */}
            <button
              onClick={() => onInstantTrigger("fire", "Local Fire/Rescue triggered via widget.")}
              className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-[8px] font-bold mt-1 text-slate-300">Fire</span>
            </button>

            {/* Security Trigger */}
            <button
              onClick={() => onInstantTrigger("security", "Armed response and security company dispatch triggered via widget.")}
              className="flex flex-col items-center justify-center p-2 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 transition active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              <span className="text-[8px] font-bold mt-1 text-slate-300">Security</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
