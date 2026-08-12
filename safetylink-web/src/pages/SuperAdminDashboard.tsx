import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Building, Trash2, Unlock, LogOut, Search, Activity, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Session } from '../App';

interface DashboardProps {
  session: Session;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ session, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORGS' | 'USERS'>('OVERVIEW');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgRes, userRes] = await Promise.all([
        fetch('/api/superadmin/orgs', { headers: { Authorization: `Bearer ${session.token}` } }),
        fetch('/api/superadmin/users', { headers: { Authorization: `Bearer ${session.token}` } })
      ]);
      if (orgRes.ok) setOrgs((await orgRes.json()).orgs);
      if (userRes.ok) setUsers((await userRes.json()).users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteOrg = async (id: string) => {
    if (!confirm('Delete organization and ALL its users?')) return;
    await fetch(`/api/superadmin/orgs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } });
    fetchData();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete user?')) return;
    await fetch(`/api/superadmin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } });
    fetchData();
  };

  const unlockOrg = async (id: string) => {
    if (!confirm('Unlock 30-day trial for this organization?')) return;
    await fetch(`/api/superadmin/orgs/${id}/unlock`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0d1623] text-slate-300 font-sans flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111c2a] border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <ShieldAlert className="w-8 h-8" />
            <h1 className="text-xl font-black">SuperAdmin</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">GLOBAL COMMAND CENTER</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('OVERVIEW')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'OVERVIEW' ? 'bg-red-500/10 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Activity className="w-5 h-5" /> <span className="font-bold">Overview</span>
          </button>
          <button onClick={() => setActiveTab('ORGS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ORGS' ? 'bg-red-500/10 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Building className="w-5 h-5" /> <span className="font-bold">Organizations</span>
          </button>
          <button onClick={() => setActiveTab('USERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-red-500/10 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}>
            <Users className="w-5 h-5" /> <span className="font-bold">Users</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 h-screen overflow-y-auto relative">
        {loading && <div className="absolute inset-0 bg-[#0d1623]/80 flex items-center justify-center z-50">Loading...</div>}
        
        <header className="mb-8">
          <h2 className="text-3xl font-black text-white">{activeTab === 'OVERVIEW' ? 'System Overview' : activeTab === 'ORGS' ? 'Manage Organizations' : 'Registered Users'}</h2>
          <p className="text-slate-400">Logged in as {session.email} • {session.orgId}</p>
        </header>

        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Organizations</h3>
              <p className="text-4xl font-black text-white">{orgs.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Users</h3>
              <p className="text-4xl font-black text-white">{users.length}</p>
            </div>
          </div>
        )}

        {activeTab === 'ORGS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-400 font-mono text-xs">
                <tr>
                  <th className="p-4">Org ID / Code</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orgs.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-mono text-emerald-400">{o.id}</td>
                    <td className="p-4 font-bold text-white">{o.name}</td>
                    <td className="p-4 text-slate-400">{o.contact_email}</td>
                    <td className="p-4 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => unlockOrg(o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/50 rounded-lg transition-colors text-xs font-bold border border-emerald-900/50"><Unlock className="w-3 h-3"/> UNLOCK</button>
                      <button onClick={() => deleteOrg(o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-950/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors text-xs font-bold border border-red-900/50"><Trash2 className="w-3 h-3"/> DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-400 font-mono text-xs">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Org Code</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-white">{u.name}</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-slate-800 rounded-md text-xs">{u.role}</span></td>
                    <td className="p-4 font-mono text-emerald-400">{u.org_id}</td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => deleteUser(u.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-950/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors text-xs font-bold border border-red-900/50"><Trash2 className="w-3 h-3"/> DELETE</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
