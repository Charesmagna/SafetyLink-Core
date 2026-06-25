import React, { useState, useEffect } from "react";
import { Database, Download, Filter, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { AuditLog } from "../types_enterprise";

interface AuditLoggerProps {
  orgId?: string;
}

export default function AuditLogger({ orgId }: AuditLoggerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLogs = async () => {
    setIsSyncing(true);
    try {
      const url = orgId ? `/api/audit-logs?orgId=${orgId}` : "/api/audit-logs";
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [orgId]);

  // Export audit logs as CSV
  const handleExportCSV = () => {
    const url = orgId ? `/api/audit-logs/export?orgId=${orgId}` : "/api/audit-logs/export";
    window.open(url, "_blank");
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="security-audit-logger">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Security & Audit Logging Centre
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit trail logs of administrative, hardware, and system events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-1.5 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-lg text-slate-300 hover:text-emerald-400 transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, operator, details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-4 text-slate-200 placeholder-slate-500 outline-none"
          />
        </div>
        <div className="sm:col-span-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 px-3 text-slate-300 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Auth">Auth & Shift</option>
            <option value="Hardware">Hardware Pool</option>
            <option value="Config">Tenant Configurations</option>
            <option value="Alert">SOS Alarm Lifecycle</option>
            <option value="License">Licensing & Billing</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-850 text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Operator</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">IP Address</th>
              <th className="py-2.5 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                  No security audit events recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-900/30 text-[11px] text-slate-300 transition">
                  <td className="py-2.5 px-4 text-slate-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}<br/>
                    <span className="text-[9px] text-slate-600 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-bold text-slate-200">
                    {log.userName || "SYSTEM"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold uppercase tracking-wider text-[10.5px]">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
