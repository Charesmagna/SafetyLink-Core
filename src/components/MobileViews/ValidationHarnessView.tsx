import React from "react";
import { Sliders, Activity, ClipboardList, RefreshCw } from "lucide-react";

interface ValidationHarnessViewProps {
  isRunningTest: boolean;
  activeTestScenario: string | null;
  testLog: string[];
  runValidationTest: (scenario: string) => void;
}

export default function ValidationHarnessView({
  isRunningTest,
  activeTestScenario,
  testLog,
  runValidationTest,
}: ValidationHarnessViewProps) {
  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Harness Lab</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">AUTOMATED CRISIS VALIDATION SUITE</p>
      </div>

      {/* Intro info */}
      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 text-slate-400 text-[10px] leading-relaxed font-semibold">
        🔬 Trigger extreme diagnostic tests to verify the integrity of our offline-first routing, cryptographic keystores, cell blackout caches, and satellite failover engines.
      </div>

      {/* Scenario Triggers */}
      <div className="grid grid-cols-3 gap-2">
        {/* Scenario A */}
        <button
          onClick={() => runValidationTest("blackout")}
          disabled={isRunningTest}
          className={`p-2.5 rounded-xl border text-center font-extrabold text-[9px] uppercase tracking-wider transition cursor-pointer disabled:opacity-40 flex flex-col items-center justify-between h-[80px] ${
            activeTestScenario === "blackout"
              ? "bg-rose-600 border-rose-500 text-white"
              : "bg-slate-900 border-slate-850 text-slate-300 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Scenario A</span>
          <span className="text-[7px] text-slate-400 leading-none">Cell Blackout</span>
        </button>

        {/* Scenario B */}
        <button
          onClick={() => runValidationTest("satellite")}
          disabled={isRunningTest}
          className={`p-2.5 rounded-xl border text-center font-extrabold text-[9px] uppercase tracking-wider transition cursor-pointer disabled:opacity-40 flex flex-col items-center justify-between h-[80px] ${
            activeTestScenario === "satellite"
              ? "bg-amber-600 border-amber-500 text-white"
              : "bg-slate-900 border-slate-850 text-slate-300 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Scenario B</span>
          <span className="text-[7px] text-slate-400 leading-none">Sat Failover</span>
        </button>

        {/* Scenario C */}
        <button
          onClick={() => runValidationTest("auto-sync")}
          disabled={isRunningTest}
          className={`p-2.5 rounded-xl border text-center font-extrabold text-[9px] uppercase tracking-wider transition cursor-pointer disabled:opacity-40 flex flex-col items-center justify-between h-[80px] ${
            activeTestScenario === "auto-sync"
              ? "bg-blue-600 border-blue-500 text-white"
              : "bg-slate-900 border-slate-850 text-slate-300 hover:text-white"
          }`}
        >
          <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Scenario C</span>
          <span className="text-[7px] text-slate-400 leading-none">Auto Sync</span>
        </button>
      </div>

      {/* Live Logging console */}
      <div className="flex-1 flex flex-col bg-slate-950 rounded-2xl border border-slate-850 p-3 shadow-inner">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2 shrink-0">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Diagnostic Telemetry Stream
          </span>
          {isRunningTest && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          )}
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto max-h-[220px] font-mono text-[9px] text-slate-400 space-y-1 pr-1 select-text">
          {testLog.length === 0 ? (
            <p className="text-slate-600 italic py-12 text-center font-semibold">
              Console idle. Select an automated stress scenario above to launch.
            </p>
          ) : (
            testLog.map((log, idx) => {
              const isSuccess = log.includes("SUCCESS");
              const isFail = log.includes("FAILED") || log.includes("Warning");
              const isInfo = log.includes("Initializing") || log.includes("Checking");
              return (
                <div
                  key={idx}
                  className={`py-0.5 leading-normal text-left ${
                    isSuccess
                      ? "text-emerald-400 font-extrabold"
                      : isFail
                      ? "text-rose-400 font-extrabold animate-pulse"
                      : isInfo
                      ? "text-blue-400 font-medium"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
