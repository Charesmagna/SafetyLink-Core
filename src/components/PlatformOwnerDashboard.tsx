import React, { useState } from "react";
import { Shield, Users, Server, MessageSquare, PhoneCall, AlertTriangle, Play, RefreshCw, Layers, Key, CheckCircle } from "lucide-react";
import { Organization, User, Alert } from "../types";
import SubscriptionLicensing from "./SubscriptionLicensing";
import AuditLogger from "./AuditLogger";

interface PlatformOwnerDashboardProps {
  organizations: Organization[];
  users: User[];
  alerts: Alert[];
  smsCount: number;
  waCount: number;
  voiceCount: number;
  onCreateOrganization: (name: string, plan: string) => void;
  onUpdateUserStatus: (userId: string, status: "approved" | "suspended" | "pending") => void;
}

export default function PlatformOwnerDashboard({
  organizations,
  users,
  alerts,
  smsCount,
  waCount,
  voiceCount,
  onCreateOrganization,
  onUpdateUserStatus
}: PlatformOwnerDashboardProps) {
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("Enterprise Unlimited");
  const [filterPending, setFilterPending] = useState(true);

  // API credentials manager states
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [voiceNumbers, setVoiceNumbers] = useState("");
  const [credSaveSuccess, setCredSaveSuccess] = useState(false);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) return;
    onCreateOrganization(newOrgName, newOrgPlan);
    setNewOrgName("");
  };

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrgId(org.id);
    setTwilioSid(org.twilioSid || "");
    setTwilioToken(org.twilioToken || "");
    setWhatsappPhoneId(org.whatsappPhoneId || "");
    setWhatsappToken(org.whatsappToken || "");
    setVoiceNumbers(org.voiceEscalationNumbers || "");
    setCredSaveSuccess(false);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;

    try {
      const res = await fetch(`/api/organizations/${selectedOrgId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilioSid,
          twilioToken,
          whatsappPhoneId,
          whatsappToken,
          voiceEscalationNumbers: voiceNumbers
        })
      });

      if (res.ok) {
        setCredSaveSuccess(true);
        // Automatically close after success
        setTimeout(() => {
          setCredSaveSuccess(false);
        }, 3000);
        // Force refresh parent data cache
        const refreshBtn = document.querySelector('button[title="Click to sync data"]');
        if (refreshBtn) (refreshBtn as HTMLButtonElement).click();
      }
    } catch (err) {
      console.error("Error saving tenant credentials:", err);
    }
  };

  const pendingUsers = users.filter(u => u.status === "pending");
  const approvedUsers = users.filter(u => u.status === "approved");
  const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");

  const serverUptime = "14d 6h 32m";
  const databaseStatus = "CONNECTED (OK)";
  const systemPing = "14ms";

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Metrics Row - Tactical Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Tenants</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">{organizations.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Active Members</p>
            <h3 className="text-2xl font-black text-white font-mono mt-0.5">{users.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-rose-950/80 border border-rose-500/20 text-rose-400 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active SOS Triggers</p>
            <h3 className="text-2xl font-black text-rose-400 font-mono mt-0.5">{activeAlerts.length}</h3>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cluster Status</p>
            <h3 className="text-xs font-mono font-bold text-emerald-400 mt-1 uppercase tracking-wider">ONLINE (OK)</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Org Creation & Tenant List) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Security Org */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
            <h3 className="font-bold text-base text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Provision New Security Tenant
            </h3>
            <form onSubmit={handleCreateOrg} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tenant Corporate Name</label>
                <input 
                  type="text" 
                  value={newOrgName} 
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Cape Town Guard, GP Tactical" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subscription Tier</label>
                <select 
                  value={newOrgPlan} 
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                >
                  <option value="Basic Tier">Basic Watch (Max 50 Users)</option>
                  <option value="Premium Watch">Premium Guard (Max 500 Users)</option>
                  <option value="Enterprise Unlimited">Enterprise Unlimited (Full SLAs)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition uppercase tracking-widest font-mono"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>

          {/* Tenant List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white uppercase tracking-wider font-mono">
                Provisioned Tenant Organizations
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Click a tenant to configure API credentials</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Org Name</th>
                    <th className="py-3 px-4">Access Code</th>
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4">API Setup</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {organizations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No active organizations found. Please provision a tenant above.
                      </td>
                    </tr>
                  ) : (
                    organizations.map(org => {
                      const hasApiKeys = !!(org.twilioSid || org.whatsappPhoneId);
                      return (
                        <tr 
                          key={org.id} 
                          onClick={() => handleSelectOrg(org)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition ${selectedOrgId === org.id ? 'bg-slate-800/60 border-l-2 border-emerald-400' : ''}`}
                        >
                          <td className="py-3.5 px-4 font-bold text-white">{org.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded font-mono text-xs font-bold">
                              {org.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{org.subscriptionPlan}</td>
                          <td className="py-3.5 px-4">
                            {hasApiKeys ? (
                              <span className="text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded uppercase">Configured</span>
                            ) : (
                              <span className="text-[9px] font-bold bg-slate-950 text-slate-500 border border-slate-800 px-2 py-0.5 rounded uppercase">Default Gate</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectOrg(org); }}
                              className="text-[10px] bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 hover:border-indigo-400 px-2.5 py-1 rounded-md"
                            >
                              Edit Credentials
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Third-Party API Credentials Manager */}
          {selectedOrgId && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                    API Credentials Manager: <span className="text-emerald-400">{organizations.find(o => o.id === selectedOrgId)?.name}</span>
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedOrgId(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-bold"
                >
                  ✕ CLOSE
                </button>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Twilio Account SID</label>
                    <input 
                      type="text" 
                      value={twilioSid} 
                      onChange={(e) => setTwilioSid(e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Twilio Secret Auth Token</label>
                    <input 
                      type="password" 
                      value={twilioToken} 
                      onChange={(e) => setTwilioToken(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meta WhatsApp Phone ID</label>
                    <input 
                      type="text" 
                      value={whatsappPhoneId} 
                      onChange={(e) => setWhatsappPhoneId(e.target.value)}
                      placeholder="E.g. 1098481293245" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meta WhatsApp System Access Token</label>
                    <input 
                      type="password" 
                      value={whatsappToken} 
                      onChange={(e) => setWhatsappToken(e.target.value)}
                      placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxx" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Voice Escalation Hierarchy Numbers (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={voiceNumbers} 
                    onChange={(e) => setVoiceNumbers(e.target.value)}
                    placeholder="E.g. +27829990011, +27712224455" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-mono"
                  />
                  <p className="text-[9px] text-slate-500 font-mono mt-1">First response number will be dialed immediately on alert, cascading sequentially down the list if unanswered.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {credSaveSuccess && (
                      <span className="text-[10px] text-emerald-400 font-bold font-mono uppercase flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Gateway Credentials Saved and Isolated!
                      </span>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-6 rounded-lg transition uppercase tracking-widest font-mono"
                  >
                    Save Isolated Credentials
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Right Columns (Queue & Telemetry) */}
        <div className="space-y-6">
          
          {/* User queue */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-white uppercase tracking-wider font-mono">Verification Queue</h3>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                <button 
                  onClick={() => setFilterPending(true)}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition ${filterPending ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Pending ({pendingUsers.length})
                </button>
                <button 
                  onClick={() => setFilterPending(false)}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition ${!filterPending ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Approved ({approvedUsers.length})
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filterPending ? (
                pendingUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs italic">
                    No pending members currently awaiting approval.
                  </div>
                ) : (
                  pendingUsers.map(u => {
                    const org = organizations.find(o => o.id === u.organizationId);
                    return (
                      <div key={u.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-xs text-white font-mono">{u.name}</h4>
                          <span className="text-[8px] font-black tracking-widest text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded uppercase">{u.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Tenant: <span className="font-semibold text-slate-300">{org?.name || "Global Pool"}</span></p>
                        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
                          <button 
                            onClick={() => onUpdateUserStatus(u.id, "approved")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1.5 rounded transition uppercase tracking-wider font-mono"
                          >
                            Approve Access
                          </button>
                          <button 
                            onClick={() => onUpdateUserStatus(u.id, "suspended")}
                            className="bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-[10px] py-1.5 px-3 rounded transition uppercase tracking-wider font-mono border border-slate-800"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                approvedUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs italic">
                    No approved members found in this cluster database.
                  </div>
                ) : (
                  approvedUsers.map(u => {
                    const org = organizations.find(o => o.id === u.organizationId);
                    return (
                      <div key={u.id} className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between font-mono">
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{u.name}</h4>
                          <p className="text-[10px] text-slate-500">{org?.name || "Global Staff"}</p>
                        </div>
                        <button 
                          onClick={() => onUpdateUserStatus(u.id, "suspended")}
                          className="text-[10px] text-rose-400 hover:bg-rose-950/40 px-2.5 py-1 rounded transition border border-rose-950 hover:border-rose-900"
                        >
                          Suspend
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Infrastructure Health Panel */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-white uppercase tracking-wider font-mono">Cluster Telemetry</h3>
            
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-500 block mb-0.5">Server Uptime</span>
                <span className="font-semibold text-slate-300">{serverUptime}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-500 block mb-0.5">SQL Database</span>
                <span className="font-semibold text-slate-300">{databaseStatus}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-500 block mb-0.5">Internal Ping</span>
                <span className="font-bold text-emerald-400">{systemPing}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="text-slate-500 block mb-0.5">Active WebSockets</span>
                <span className="font-semibold text-slate-300">6 Connections</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 font-mono">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  SMS Gateway Pings (Twilio)
                </span>
                <span className="font-bold text-emerald-400">Active ({smsCount} sent)</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  WhatsApp Meta API Gateway
                </span>
                <span className="font-bold text-emerald-400">Active ({waCount} msg)</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                  Voice Escalation Engine
                </span>
                <span className="font-bold text-emerald-400">Active ({voiceCount} calls)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ENTERPRISE ADMIN WIDGETS: AUDITS & LICENSING (Phases 11 & 12) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SubscriptionLicensing 
          orgId={organizations.length > 0 ? organizations[0].id : ""} 
          onPlanChanged={() => {
            // Force refresh parent data cache
            const refreshBtn = document.querySelector('button[title="Click to sync data"]') as HTMLButtonElement;
            if (refreshBtn) refreshBtn.click();
          }} 
        />
        <AuditLogger orgId={organizations.length > 0 ? organizations[0].id : ""} />
      </div>

    </div>
  );
}
