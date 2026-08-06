import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Users, MapPin, AlertTriangle, Bell, LogOut, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import LiveMap from './LiveMap';
import UserList from './UserList';
import IncidentLog from './IncidentLog';

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

interface OrgData {
  name: string;
  plan: string;
  memberCount: number;
}

interface Props {
  user: User;
  orgId: string;
  onLogout: () => void;
}

type TabId = 'overview' | 'map' | 'users' | 'incidents';

export default function Dashboard({ user, orgId, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [members, setMembers] = useState<OrgUser[]>([]);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    // Load org metadata
    getDoc(doc(db, 'organisations', orgId)).then(snap => {
      if (snap.exists()) setOrgData(snap.data() as OrgData);
    });
  }, [orgId]);

  useEffect(() => {
    // Real-time member tracking
    const q = query(collection(db, 'users'), where('orgId', '==', orgId));
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as OrgUser));
      setMembers(users);
      setActiveAlerts(users.filter(u => u.sosActive).length);
    });
    return unsub;
  }, [orgId]);

  const onlineUsers = members.filter(m => Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000);
  const sosUsers = members.filter(m => m.sosActive);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'map', label: 'Live Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-sl-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-sl-panel border-b border-sl-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-sl-red" />
          <div>
            <h1 className="text-sm font-bold text-white">SafetyLink Org Console</h1>
            <p className="text-xs text-slate-500">{orgData?.name || orgId} · {user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeAlerts > 0 && (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800/50 text-red-300 text-xs font-medium px-3 py-1.5 rounded-full animate-pulse">
              <Bell className="w-3 h-3" />
              {activeAlerts} ACTIVE SOS
            </div>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="flex border-b border-sl-border bg-sl-panel flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-sl-red text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'incidents' && activeAlerts > 0 && (
              <span className="bg-sl-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeAlerts}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: members.length, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
                { label: 'Online Now', value: onlineUsers.length, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400' },
                { label: 'Active SOS', value: sosUsers.length, icon: <AlertTriangle className="w-5 h-5" />, color: sosUsers.length > 0 ? 'text-red-400' : 'text-slate-500' },
                { label: 'Offline', value: members.length - onlineUsers.length, icon: <XCircle className="w-5 h-5" />, color: 'text-slate-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-sl-panel border border-sl-border rounded-xl p-5">
                  <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Active SOS alerts */}
            {sosUsers.length > 0 && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-5">
                <h3 className="text-red-300 font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Active SOS Alerts
                </h3>
                <div className="space-y-2">
                  {sosUsers.map(u => (
                    <div key={u.uid} className="flex items-center justify-between bg-red-950/40 rounded-lg px-4 py-2.5">
                      <div>
                        <p className="text-white text-sm font-medium">{u.displayName || u.email}</p>
                        <p className="text-red-300/70 text-xs">{u.role} · {u.lat && u.lng ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}` : 'Location unknown'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400 text-xs animate-pulse">
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                        SOS ACTIVE
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div className="bg-sl-panel border border-sl-border rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Member Activity
              </h3>
              <div className="space-y-2">
                {members.slice(0, 8).map(m => (
                  <div key={m.uid} className="flex items-center justify-between py-2 border-b border-sl-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${Date.now() - (m.lastSeen || 0) < 5 * 60 * 1000 ? 'bg-green-400' : 'bg-slate-600'}`} />
                      <div>
                        <p className="text-white text-sm">{m.displayName || m.email}</p>
                        <p className="text-slate-500 text-xs capitalize">{m.role}</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs">
                      {m.lastSeen ? new Date(m.lastSeen).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                ))}
                {members.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No members found for this organisation.</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && <LiveMap members={members} />}
        {activeTab === 'users' && <UserList members={members} orgId={orgId} />}
        {activeTab === 'incidents' && <IncidentLog orgId={orgId} />}
      </main>
    </div>
  );
}
