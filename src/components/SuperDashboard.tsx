import React, { useEffect } from 'react';
import { useAppStore } from '../utils/store';

export const SuperDashboard: React.FC = () => {
  const { organizations, panicEvents, users } = useAppStore();
  
  useEffect(() => {
    // Optionally fetch more stats
  }, []);

  return (
    <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] min-h-[700px] text-white font-mono">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase">SafetyLink Global Command</h1>
          <p className="text-xs text-slate-500 mt-1">SUPER ADMIN DASHBOARD | READ-ONLY</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Total Nodes</div>
            <div className="text-lg text-emerald-400 font-bold">{organizations.length}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Active Incidents</div>
            <div className="text-lg text-red-400 font-bold animate-pulse">{panicEvents.filter(p => p.status === 'DISPATCHED' || p.status === 'ESCALATING').length}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Total Users</div>
            <div className="text-lg text-blue-400 font-bold">{users.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-widest">ORGANIZATION DIRECTORY</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="text-[10px] uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Org Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-cyan-400">{org.id}</td>
                    <td className="px-4 py-3">{org.name}</td>
                    <td className="px-4 py-3 text-emerald-400">ACTIVE</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-4 tracking-widest">RECENT INCIDENTS LOG</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="text-[10px] uppercase bg-slate-900 text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {panicEvents.slice(0, 8).map(panic => (
                  <tr key={panic.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-bold text-slate-300">{panic.id.substring(0,8)}...</td>
                    <td className="px-4 py-3 truncate max-w-[150px]">{panic.description}</td>
                    <td className={`px-4 py-3 font-bold ${(panic.status === 'DISPATCHED' || panic.status === 'ESCALATING') ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                      {panic.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
