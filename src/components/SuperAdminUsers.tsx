import React, { useState } from 'react';

const BACKEND = 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev';

type User = { id: string; phone: string; name: string; lastSync: string; contacts: number; appRegistered: boolean };
type Summary = Record<string, number>;

/**
 * Superadmin panel: counts, current users (masked numbers) and delete.
 * The admin key is typed in each session and kept only in memory. It is never saved.
 */
export const SuperAdminUsers: React.FC = () => {
  const [key, setKey] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState('');

  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(BACKEND + path, {
      ...init,
      headers: { 'X-Admin-Key': key, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Request failed (' + res.status + ')');
    return j;
  };

  const load = async () => {
    setMsg('');
    try {
      const [s, u] = await Promise.all([call('/api/admin/summary'), call('/api/admin/users')]);
      setSummary(s);
      setUsers(u.users || []);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const remove = async (u: User) => {
    if (!window.confirm('Delete ' + u.name + ' (' + u.phone + ')? Their profile, contacts and app registration will be removed.')) return;
    try {
      await call('/api/admin/delete-user', { method: 'POST', body: JSON.stringify({ phone: u.id }) });
      setMsg('Deleted.');
      await load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="mt-8 border-t border-slate-800 pt-6 text-slate-200 font-mono">
      <h2 className="text-lg font-bold text-cyan-400 tracking-widest uppercase mb-3">Users</h2>
      <div className="flex gap-2 mb-4">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key" className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm" />
        <button onClick={load} disabled={!key}
          className="bg-cyan-700 px-4 py-2 rounded text-sm disabled:opacity-40">Load</button>
      </div>
      {msg && <p className="text-xs text-amber-400 mb-3">{msg}</p>}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">Accounts</div><div className="text-emerald-400 text-lg font-bold">{summary.totalAccounts}</div></div>
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">Active 30 days</div><div className="text-emerald-400 text-lg font-bold">{summary.activeLast30Days}</div></div>
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">Contacts</div><div className="text-emerald-400 text-lg font-bold">{summary.contacts}</div></div>
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">App registered</div><div className="text-emerald-400 text-lg font-bold">{summary.devicesRegistered}</div></div>
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">Alerts 30 days</div><div className="text-emerald-400 text-lg font-bold">{summary.panicsLast30Days}</div></div>
          <div className="bg-slate-900 rounded p-3"><div className="text-slate-400">Active 7 days</div><div className="text-emerald-400 text-lg font-bold">{summary.activeLast7Days}</div></div>
        </div>
      )}
      {users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400 text-left">
              <tr><th className="py-2">Name</th><th>Number</th><th>Last sync</th><th>Contacts</th><th>App</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="py-2">{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.lastSync}</td>
                  <td>{u.contacts}</td>
                  <td>{u.appRegistered ? 'Yes' : 'No'}</td>
                  <td><button onClick={() => remove(u)} className="text-red-400 hover:text-red-300">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
