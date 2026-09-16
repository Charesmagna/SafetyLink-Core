import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface OrgUser {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  lastSeen: number;
  lat?: number;
  lng?: number;
  sosActive?: boolean;
  status?: string;
}

interface Props {
  members: OrgUser[];
  orgId: string;
}

export default function UserList({ members }: Props) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = members.filter(m => {
    const matchSearch = (m.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = ['all', ...Array.from(new Set(members.map(m => m.role).filter(Boolean)))];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-sl-panel border border-sl-border rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sl-red/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-sl-panel border border-sl-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none capitalize"
        >
          {roles.map(r => <option key={r} value={r} className="capitalize">{r === 'all' ? 'All Roles' : r}</option>)}
        </select>
      </div>

      <div className="bg-sl-panel border border-sl-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sl-border">
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">User</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Role</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Location</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase px-5 py-3">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const isOnline = Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000;
              return (
                <tr key={m.uid} className="border-b border-sl-border/50 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{m.displayName || 'Unknown'}</p>
                      <p className="text-slate-500 text-xs">{m.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-slate-300 text-sm">{m.role || 'user'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {m.sosActive ? (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> SOS Active
                      </span>
                    ) : isOnline ? (
                      <span className="flex items-center gap-1.5 text-green-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Offline
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {m.lat && m.lng ? (
                      <span className="flex items-center gap-1 text-blue-400 text-xs">
                        <MapPin className="w-3 h-3" />
                        {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">No location</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {m.lastSeen ? new Date(m.lastSeen).toLocaleString() : 'Never'}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-600 text-sm py-8">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
