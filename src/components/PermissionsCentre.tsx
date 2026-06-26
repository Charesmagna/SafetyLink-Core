import React, { useState } from "react";
import { ShieldCheck, Info, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { PermissionStatus } from "../types_enterprise";

interface PermissionsCentreProps {
  onPermissionChange?: () => void;
}

export default function PermissionsCentre({ onPermissionChange }: PermissionsCentreProps) {
  const [permissions, setPermissions] = useState<PermissionStatus[]>([
    {
      key: "gps",
      name: "High-Accuracy GPS Location",
      description: "Required to trace your precise coordinate trail in South Africa during active alert dispatches.",
      granted: true,
      denied: false,
      restricted: false
    },
    {
      key: "backgroundGps",
      name: "Background Location Access",
      description: "Allows the Command Centre to trace your coordinate path even when the mobile phone is locked or application is terminated.",
      granted: false,
      denied: true,
      restricted: false
    },
    {
      key: "bluetooth",
      name: "Bluetooth Low Energy (BLE)",
      description: "Required to continuously scan, connect, and receive push-button triggers from physical iTAG panic wristbands.",
      granted: true,
      denied: false,
      restricted: false
    },
    {
      key: "notification",
      name: "Critical Push Notifications",
      description: "Allows high-priority override channels to deliver alert events, shift instructions, and hardware fault messages.",
      granted: true,
      denied: false,
      restricted: false
    },
    {
      key: "call",
      name: "Direct Phone Escalations",
      description: "Enables direct automated emergency number dialing fallback when cellular internet connectivity fails.",
      granted: false,
      denied: false,
      restricted: true
    },
    {
      key: "battery",
      name: "Disable Battery Optimization",
      description: "Allows the background BLE and GPS scanning services to run without Android system suspension or throttles.",
      granted: false,
      denied: true,
      restricted: false
    },
    {
      key: "foregroundService",
      name: "Foreground Service execution",
      description: "Required to run a permanent 'SafetyLink Monitoring Active' persistent notification drawer for high-availability.",
      granted: true,
      denied: false,
      restricted: false
    },
    {
      key: "alarm",
      name: "Exact Alarm Scheduling",
      description: "Allows the 60-second device health heartbeat engine to trigger at exact millisecond intervals.",
      granted: true,
      denied: false,
      restricted: false
    }
  ]);

  const [onboardingStep, setOnboardingStep] = useState<number>(-1);

  const fixPermission = (key: string) => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.key === key) {
          return { ...p, granted: true, denied: false, restricted: false };
        }
        return p;
      })
    );
    if (onPermissionChange) onPermissionChange();
  };

  const currentOnboarding = permissions[onboardingStep];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5" id="permissions-mgmt-ctr">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Permissions Management Centre
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Android Native Telemetry & Service Permissions (v5.2 Stable)</p>
        </div>
        <button
          onClick={() => setOnboardingStep(0)}
          className="text-[10px] uppercase tracking-widest font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-lg transition"
        >
          Run Onboarding
        </button>
      </div>

      {/* Onboarding Dialog Slider */}
      {onboardingStep >= 0 && onboardingStep < permissions.length && currentOnboarding && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4.5 space-y-3 relative animate-fadeIn">
          <div className="flex gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 font-bold flex items-center justify-center font-mono text-xs border border-emerald-500/20 shrink-0">
              {onboardingStep + 1}
            </span>
            <div>
              <h5 className="font-bold text-xs text-white uppercase tracking-wider">{currentOnboarding.name}</h5>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-1">{currentOnboarding.description}</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-emerald-500/10">
            <span className="text-[10px] text-emerald-400/60 font-mono">Onboarding Step {onboardingStep + 1} of {permissions.length}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fixPermission(currentOnboarding.key)}
                className="bg-emerald-500 text-black font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-md hover:bg-emerald-400 transition"
              >
                Grant Now
              </button>
              <button
                onClick={() => setOnboardingStep(prev => prev + 1)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-md border border-slate-700 transition"
              >
                {onboardingStep === permissions.length - 1 ? "Complete" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions List Grid */}
      <div className="space-y-2.5">
        {permissions.map(perm => (
          <div
            key={perm.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80"
          >
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-200">{perm.name}</span>
                {perm.granted && (
                  <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    GRANTED
                  </span>
                )}
                {perm.denied && (
                  <span className="text-[9px] font-mono bg-rose-950 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">
                    DENIED
                  </span>
                )}
                {perm.restricted && (
                  <span className="text-[9px] font-mono bg-amber-950 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    RESTRICTED
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal">{perm.description}</p>
            </div>
            {!perm.granted && (
              <button
                onClick={() => fixPermission(perm.key)}
                className="self-start sm:self-center bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-500 text-emerald-400 text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1.5 rounded-lg transition shrink-0"
              >
                Fix Permission
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
