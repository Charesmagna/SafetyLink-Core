import React from "react";
import { Server, Shield, Key, Check } from "lucide-react";
import { Organization } from "../../types";

interface OrganizationsViewProps {
  provOrg: Organization | null;
  organizations: Organization[];
  onAutoFillOrg: (code: string) => void;
}

export default function OrganizationsView({
  provOrg,
  organizations,
  onAutoFillOrg,
}: OrganizationsViewProps) {
  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Multi-Tenancy</h3>
        <p className="text-[10px] text-rose-400 font-semibold font-mono">SECURE TENANT ISOLATION REGISTRY</p>
      </div>

      {/* Current Isolated DB Badge */}
      {provOrg ? (
        <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3.5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase font-mono block">
                ACTIVE TENANT SECURE NODE
              </span>
              <h4 className="text-sm font-extrabold text-slate-100">{provOrg.name}</h4>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-3 space-y-2 text-[10px] text-slate-400 font-medium">
            <div className="flex justify-between font-mono">
              <span>Database Segment:</span>
              <span className="text-slate-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                isolated_db_id_{provOrg.id}
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Tenant Key Signature:</span>
              <span className="text-slate-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                {provOrg.code.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Active Gateway:</span>
              <span className="text-emerald-400 font-bold">Twilio ZA-SMS Direct</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Compliance Status:</span>
              <span className="text-emerald-400 font-bold">PoPIA Compliant</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-4 text-center text-rose-300 text-xs font-semibold">
          No active organization provisioned. Please enter an organization code to activate client modules.
        </div>
      )}

      {/* List of other verified South African Watch organizations */}
      <div className="space-y-2.5 flex-grow">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
          Verified South African Community Watches
        </span>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {organizations.map((org) => {
            const isActive = provOrg?.id === org.id;
            return (
              <div
                key={org.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-left transition ${
                  isActive ? "bg-slate-950/90 border-slate-800" : "bg-slate-900 border-slate-850"
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xs text-slate-200">{org.name}</h4>
                  <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5 leading-none">
                    Gauteng Sector Node • Code: <strong className="text-rose-400">{org.code}</strong>
                  </p>
                </div>

                {isActive ? (
                  <span className="p-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono text-[8px] font-bold uppercase shrink-0">
                    Active Node
                  </span>
                ) : (
                  <button
                    onClick={() => onAutoFillOrg(org.code)}
                    className="px-2.5 py-1 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 rounded hover:border-slate-700 text-[9px] font-black uppercase transition shrink-0 cursor-pointer"
                    title="Autofill this watch code in registration panels"
                  >
                    Select Code
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
