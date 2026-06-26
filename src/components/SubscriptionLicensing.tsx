import React, { useState, useEffect } from "react";
import { Award, AlertOctagon, HelpCircle, RefreshCw, BarChart2, Shield } from "lucide-react";
import { LicensingMetrics } from "../types_enterprise";

interface SubscriptionLicensingProps {
  orgId: string;
  onPlanChanged?: () => void;
}

export default function SubscriptionLicensing({ orgId, onPlanChanged }: SubscriptionLicensingProps) {
  const [metrics, setMetrics] = useState<LicensingMetrics | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"Starter" | "Professional" | "Enterprise" | "Custom">("Enterprise");

  const fetchMetrics = async () => {
    if (!orgId) return;
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/licensing/${orgId}`);
      const data = await res.json();
      setMetrics(data);
      setSelectedPlan(data.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [orgId]);

  const updatePlan = async (plan: "Starter" | "Professional" | "Enterprise" | "Custom") => {
    try {
      const res = await fetch(`/api/licensing/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      if (res.ok) {
        setSelectedPlan(plan);
        fetchMetrics();
        if (onPlanChanged) onPlanChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!metrics) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-xs">
        Select or provision an organization to review subscription parameters.
      </div>
    );
  }

  // Percentage utility
  const getPercent = (used: number, limit: number) => {
    if (!limit) return 0;
    return Math.min(100, Math.floor((used / limit) * 100));
  };

  // Human-readable storage sizing
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5" id="licensing-billing-ctr">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Subscription & Licensing System
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage organization plans, active hardware capacity, and monthly API telemetry limits</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-lg text-slate-300 hover:text-indigo-400 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Plan selection cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {(["Starter", "Professional", "Enterprise", "Custom"] as const).map(p => (
          <button
            key={p}
            onClick={() => updatePlan(p)}
            className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden ${
              selectedPlan === p
                ? "bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-950/20"
                : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="text-[11px] uppercase tracking-widest font-mono font-bold">{p}</div>
            <div className="text-[9px] text-slate-500 mt-1">
              {p === "Starter" && "Up to 10 devices"}
              {p === "Professional" && "Up to 100 devices"}
              {p === "Enterprise" && "Up to 1,000 devices"}
              {p === "Custom" && "Unlimited scale"}
            </div>
            {selectedPlan === p && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* Warning block for low limits */}
      {selectedPlan === "Starter" && (
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[10.5px]">
            <b>Starter Plan Restrictions Engaged:</b> API dispatching capabilities (Twilio SMS/WhatsApp) are throttled to a cumulative 100 events per month. Consider moving to <b>Professional</b> or <b>Enterprise</b> to unlock unrestricted automated cascades.
          </p>
        </div>
      )}

      {/* Usage Progress meters */}
      <div className="space-y-3.5">
        {/* SMS Usage progress */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
            <span className="font-bold text-slate-300">Satellite Twilio SMS Dispatches</span>
            <span className="font-mono font-bold text-slate-400">{metrics.smsUsage} / {selectedPlan === "Custom" ? "Unlimited" : metrics.smsLimit} Sent</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${selectedPlan === "Custom" ? 0 : getPercent(metrics.smsUsage, metrics.smsLimit)}%` }}
            ></div>
          </div>
        </div>

        {/* WhatsApp progress */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
            <span className="font-bold text-slate-300">Meta WhatsApp Business API Messages</span>
            <span className="font-mono font-bold text-slate-400">{metrics.whatsappUsage} / {selectedPlan === "Custom" ? "Unlimited" : metrics.whatsappLimit} Deliv</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${selectedPlan === "Custom" ? 0 : getPercent(metrics.whatsappUsage, metrics.whatsappLimit)}%` }}
            ></div>
          </div>
        </div>

        {/* Voice progress */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
            <span className="font-bold text-slate-300">Automated Voice Escalation Cycles</span>
            <span className="font-mono font-bold text-slate-400">{metrics.voiceUsage} / {selectedPlan === "Custom" ? "Unlimited" : metrics.voiceLimit} Cycles</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${selectedPlan === "Custom" ? 0 : getPercent(metrics.voiceUsage, metrics.voiceLimit)}%` }}
            ></div>
          </div>
        </div>

        {/* Devices progress */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-400 text-[10.5px]">
            <span className="font-bold text-slate-300">Registered iTAG BLE Wristband Licenses</span>
            <span className="font-mono font-bold text-slate-400">{metrics.activeDevices} / {selectedPlan === "Custom" ? "Unlimited" : metrics.deviceLimit} Devices</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-850 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${selectedPlan === "Custom" ? 0 : getPercent(metrics.activeDevices, metrics.deviceLimit)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid metadata */}
      <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-850 text-xs text-slate-400 font-mono">
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Estimated Storage Occupancy</span>
          <span className="text-xs font-semibold text-slate-300 mt-1 block">{formatBytes(metrics.storageUsageBytes)}</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Subscription Expiry</span>
          <span className="text-xs font-semibold text-rose-400 mt-1 block">{metrics.expiryDate} (Active)</span>
        </div>
      </div>
    </div>
  );
}
