import React, { useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { translate } from '../utils/translations';

export const SuperDashboard: React.FC = () => {
  const { organizations, panicEvents, users, language } = useAppStore();
  const t = (key: string) => translate(key, language);

  useEffect(() => {
    // Optionally fetch more stats
  }, []);

  return (
    <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] min-h-[700px] text-white font-mono">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase">{t('super_dashboard.title') || "SafetyLink Global Command"}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('super_dashboard.subtitle') || "SUPER ADMIN DASHBOARD | READ-ONLY"}</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Total Nodes (KPI)</div>
            <div className="text-lg text-emerald-400 font-bold">{organizations.length}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Active Incidents (KPI)</div>
            <div className="text-lg text-red-400 font-bold animate-pulse">{panicEvents.filter(p => p.status === 'DISPATCHED' || p.status === 'ESCALATING').length}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Total Users (KPI)</div>
            <div className="text-lg text-blue-400 font-bold">{users.length}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold mb-4 text-cyan-500">Organizations Table</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2">Name</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Contact</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map(o => (
                <tr key={o.id} className="border-b border-slate-800/50">
                  <td className="py-2">{o.name}</td>
                  <td className="py-2 font-mono text-cyan-400">{o.id}</td>
                  <td className="py-2 text-slate-400">{o.contactName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold mb-4 text-red-500">Live Panics Table</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2">User</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {panicEvents.map(p => (
                <tr key={p.id} className="border-b border-slate-800/50">
                  <td className="py-2">{p.profileUsed || "Unknown"}</td>
                  <td className="py-2 font-mono text-red-400">{p.status}</td>
                  <td className="py-2 text-slate-400">{new Date(p.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SuperDashboard;
