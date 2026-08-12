import React, { useState, useEffect } from 'react';
import { Shield, Users, MapPin, AlertTriangle, Bell, LogOut, Activity, CheckCircle, XCircle, Clock, Copy, RefreshCw } from 'lucide-react';
import type { Session } from '../App';

interface Member {
  id: string;
  username: string;
  email: string;
  role: string;
  lastSeen: number;
  lat?: number;
  lng?: number;
  sosActive?: boolean;
}

interface OrgData {
  id: string;
  name: string;
  memberCount: number;
  createdAt: number;
}

interface Props { session: Session; onLogout: () => void; }

type Tab = 'overview' | 'users' | 'incidents';

export default function Dashboard({ session, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [org, setOrg] = useState<OrgData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${session.token}` };
      const [orgRes, membersRes] = await Promise.all([
        fetch(`/api/org/${session.orgId}`, { headers }),
        fetch(`/api/org/${session.orgId}/members`, { headers }),
      ]);
      if (orgRes.ok) setOrg(await orgRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, []);

  const copyOrgId = () => { navigator.clipboard.writeText(session.orgId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const online = members.filter(m => Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000);
  const sos = members.filter(m => m.sosActive);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'users', label: `Users (${members.length})`, icon: <Users className="w-4 h-4" /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-sl-dark flex flex-col">
      {/* Header */}
      <header className="bg-sl-navy border-b border-sl-border px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sl-red/10 border border-sl-red/20 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-sl-red" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{session.orgName || session.orgId}</div>
            <div className="text-xs text-slate-500">{session.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sos.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/40 text-red-300 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
              <Bell className="w-3 h-3" /> {sos.length} SOS
            </div>
          )}
          <button onClick={fetchData} className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors p-2 rounded-lg hover:bg-white/5">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Org ID banner */}
      <div className="bg-sl-card border-b border-sl-border px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Organisation ID:</span>
          <span className="font-mono font-bold text-white">{session.orgId}</span>
        </div>
        <button onClick={copyOrgId} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy to share'}
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex border-b border-sl-border bg-sl-navy px-4 sm:px-6 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${tab === t.id ? 'border-sl-red text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.icon} {t.label}
            {t.id === 'incidents' && sos.length > 0 && (
              <span className="bg-sl-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{sos.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-sl-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'overview' ? (
          <div className="space-y-6 max-w-5xl">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: members.length, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/30' },
                { label: 'Online Now', value: online.length, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/30' },
                { label: 'Active SOS', value: sos.length, icon: <AlertTriangle className="w-5 h-5" />, color: sos.length > 0 ? 'text-red-400' : 'text-slate-500', bg: sos.length > 0 ? 'bg-red-900/20 border-red-800/30' : 'bg-sl-card border-sl-border' },
                { label: 'Offline', value: members.length - online.length, icon: <XCircle className="w-5 h-5" />, color: 'text-slate-500', bg: 'bg-sl-card border-sl-border' },
              ].map(s => (
                <div key={s.label} className={`border rounded-2xl p-5 ${s.bg}`}>
                  <div className={`${s.color} mb-3`}>{s.icon}</div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* SOS Alerts */}
            {sos.length > 0 && (
              <div className="bg-red-950/20 border border-red-800/30 rounded-2xl p-5">
                <h3 className="text-red-300 font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Active SOS Alerts
                </h3>
                {sos.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-red-950/30 rounded-xl px-4 py-3 mb-2 last:mb-0">
                    <div>
                      <p className="text-white text-sm font-semibold">{u.username}</p>
                      <p className="text-red-300/60 text-xs">{u.role} · {u.lat && u.lng ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}` : 'Location unknown'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold animate-pulse">
                      <div className="w-2 h-2 bg-red-400 rounded-full" /> SOS
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Member list */}
            <div className="bg-sl-card border border-sl-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-sl-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
              </div>
              {members.length === 0 ? (
                <div className="py-12 text-center text-slate-600 text-sm">
                  No members yet. Share your Organisation ID <span className="font-mono text-white">{session.orgId}</span> with your field users.
                </div>
              ) : (
                members.slice(0, 10).map(m => {
                  const isOnline = Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000;
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-sl-border/50 last:border-0 hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${m.sosActive ? 'bg-red-400 animate-pulse' : isOnline ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <div>
                          <p className="text-white text-sm font-medium">{m.username}</p>
                          <p className="text-slate-500 text-xs capitalize">{m.role}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs">{m.lastSeen ? new Date(m.lastSeen).toLocaleTimeString() : 'Never'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : tab === 'users' ? (
          <div className="max-w-5xl bg-sl-card border border-sl-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-sl-border">
                {['User', 'Role', 'Status', 'Last Seen'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {members.map(m => {
                  const isOnline = Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000;
                  return (
                    <tr key={m.id} className="border-b border-sl-border/50 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{m.username}</p>
                        <p className="text-slate-500 text-xs">{m.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-300 capitalize">{m.role}</td>
                      <td className="px-5 py-3">
                        {m.sosActive ? <span className="text-red-400 text-xs font-bold">SOS Active</span>
                          : isOnline ? <span className="text-green-400 text-xs">Online</span>
                          : <span className="text-slate-600 text-xs">Offline</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{m.lastSeen ? new Date(m.lastSeen).toLocaleString() : 'Never'}</td>
                    </tr>
                  );
                })}
                {members.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-slate-600">No members yet</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="max-w-3xl">
            <div className="bg-sl-card border border-sl-border rounded-2xl p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Incident log will appear here when SOS events are triggered by your users.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
