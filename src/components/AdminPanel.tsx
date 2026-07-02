import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { UserProfile, Organization } from '../types';

type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS';

interface AdminPanelProps {
  onToggleView?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onToggleView }) => {
  const { 
    users, 
    organizations, 
    panicEvents, 
    logout, 
    updateUserProfile, 
    deleteUserProfile, 
    updateOrganization, 
    deleteOrganization,
    resolvePanic,
    addAuditLog
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  // Editing User States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserOrgCode, setEditUserOrgCode] = useState('');

  // Editing Org States
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgContactName, setEditOrgContactName] = useState('');
  const [editOrgContactEmail, setEditOrgContactEmail] = useState('');

  // User Actions
  const handleEditUserClick = (u: UserProfile) => {
    setEditingUserId(u.id);
    setEditUserFullName(u.fullName);
    setEditUserPhone(u.phone);
    setEditUserEmail(u.email);
    setEditUserOrgCode(u.orgCode);
  };

  const handleSaveUser = (id: string) => {
    updateUserProfile(id, {
      fullName: editUserFullName,
      phone: editUserPhone,
      email: editUserEmail,
      orgCode: editUserOrgCode
    });
    setEditingUserId(null);
    addAuditLog('SECURITY', 'INFO', `Admin updated user record ${id}`);
  };

  // Org Actions
  const handleEditOrgClick = (o: Organization) => {
    setEditingOrgId(o.id);
    setEditOrgName(o.name);
    setEditOrgContactName(o.contactName);
    setEditOrgContactEmail(o.contactEmail);
  };

  const handleSaveOrg = (id: string) => {
    updateOrganization(id, {
      name: editOrgName,
      contactName: editOrgContactName,
      contactEmail: editOrgContactEmail
    });
    setEditingOrgId(null);
    addAuditLog('SECURITY', 'INFO', `Admin updated organization record ${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden pb-12">
      {/* Super Admin Top Badge */}
      <div className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-mono text-[10px] font-bold text-center py-2 px-4 tracking-wider uppercase flex items-center justify-center gap-2 relative z-50 shadow-md">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
        <span>🔒 SECURED CORE ADMINISTRATIVE INTERACTION PROTOCOL LOCKED 🔒</span>
      </div>

      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-900 py-4 px-6 flex justify-between items-center shadow-lg relative">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl font-bold font-mono">
            👑
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-100 uppercase font-mono">
              SL Global Command
            </h1>
            <p className="text-[10px] text-purple-400 font-mono uppercase tracking-widest font-black">
              System Admin (SL-admin-0000)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleView && (
            <button
              onClick={onToggleView}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-450 text-white transition-all text-[10px] font-mono font-black rounded-full shadow shadow-indigo-950 uppercase"
            >
              👁️ Preview User Workspace
            </button>
          )}
          <button
            onClick={logout}
            className="px-4 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition-colors text-[10px] font-mono font-bold rounded-full uppercase"
          >
            SIGNOUT SECURE LINK
          </button>
        </div>
      </header>

      {/* Admin Nav Bar */}
      <nav className="bg-slate-900/50 border-b border-slate-900 flex p-1 justify-start gap-1 overflow-x-auto">
        {(['OVERVIEW', 'USERS', 'ORGANIZATIONS', 'PANICS'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm('');
            }}
            className={`px-4.5 py-2.5 text-[10px] font-mono font-bold tracking-wider rounded-xl uppercase transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'PANICS' ? '🚨 distress signals' : tab === 'ORGANIZATIONS' ? '🏢 organizations' : tab === 'USERS' ? '👥 registered users' : '📊 overview'}
          </button>
        ))}
      </nav>

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fadeIn text-left">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Total Residents / Users</span>
                <span className="text-2xl font-black font-mono text-slate-100">{users.length}</span>
                <p className="text-[9px] text-slate-400">Offline keyfob enabled</p>
              </div>

              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Organizations</span>
                <span className="text-2xl font-black font-mono text-slate-100">{organizations.length}</span>
                <p className="text-[9px] text-slate-400">University residences & sites</p>
              </div>

              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Active Alerts</span>
                <span className={`text-2xl font-black font-mono ${panicEvents.filter(p => p.status !== 'RESOLVED').length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                  {panicEvents.filter(p => p.status !== 'RESOLVED').length}
                </span>
                <p className="text-[9px] text-slate-400">Real-time GPS tracking</p>
              </div>

              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">System Health</span>
                <span className="text-2xl font-black font-mono text-emerald-400">100%</span>
                <p className="text-[9px] text-slate-400">Firebase stack connected</p>
              </div>
            </div>

            {/* Quick Info / Guide Card */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex items-start gap-4">
              <span className="text-2xl">🛡️</span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">SafetyLink Master Node Administration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Welcome back, Global Administrator. You have full edit/delete privileges for all registered residents, students, security personnel, and organization profiles database-wide. To simulate student distress events, trigger an SOS on a user session, then check the distress signals feed.
                </p>
              </div>
            </div>

            {/* Recent Activity Logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                System Administrative Audit Trails
              </h3>
              <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-4 h-64 overflow-y-auto font-mono text-[10px] space-y-2.5">
                {users.map((u, i) => (
                  <div key={i} className="border-b border-slate-900/40 pb-2 last:border-0 text-slate-400">
                    <span className="text-slate-500">[{new Date(u.createdAt).toLocaleTimeString()}]</span> USER_REGISTRY: Resident <span className="text-purple-400">@{u.username}</span> registered under organization <span className="text-blue-400">{u.orgCode || 'Independent Node'}</span>.
                  </div>
                ))}
                {organizations.map((o, i) => (
                  <div key={i} className="border-b border-slate-900/40 pb-2 last:border-0 text-slate-400">
                    <span className="text-slate-500">[{new Date(o.createdAt).toLocaleTimeString()}]</span> ORG_REGISTRY: Node <span className="text-emerald-400">{o.name}</span> provisioned securely via generated ID <span className="text-emerald-300 font-bold">{o.id}</span>.
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'USERS' && (
          <div className="space-y-4 animate-fadeIn text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Registered System Users ({users.length})</h2>
                <p className="text-xs text-slate-500">Manage, edit, or remove student and operator records.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Search name / user / cell..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />

                <select
                  value={orgFilter}
                  onChange={e => setOrgFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-full px-4.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="">All Organizations</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                  <option value="none">Independent / None</option>
                </select>
              </div>
            </div>

            {/* Users list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users
                .filter(u => {
                  const matchSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      u.phone.includes(searchTerm);
                  const matchOrg = !orgFilter ? true : orgFilter === 'none' ? !u.orgCode : u.orgCode === orgFilter;
                  return matchSearch && matchOrg;
                })
                .map(u => {
                  const isEditing = editingUserId === u.id;
                  const uOrg = organizations.find(o => o.id === u.orgCode);

                  return (
                    <div key={u.id} className="p-4 bg-slate-900/60 border border-slate-900 rounded-3xl space-y-3">
                      {isEditing ? (
                        <div className="space-y-2.5 font-mono text-xs">
                          <div>
                            <label className="text-[8px] text-slate-500 font-bold block mb-1">FULL NAME</label>
                            <input
                              type="text"
                              value={editUserFullName}
                              onChange={e => setEditUserFullName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] text-slate-500 font-bold block mb-1">PHONE</label>
                              <input
                                type="text"
                                value={editUserPhone}
                                onChange={e => setEditUserPhone(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] text-slate-500 font-bold block mb-1">EMAIL</label>
                              <input
                                type="text"
                                value={editUserEmail}
                                onChange={e => setEditUserEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 font-bold block mb-1">ORG ID BINDING</label>
                            <input
                              type="text"
                              value={editUserOrgCode}
                              onChange={e => setEditUserOrgCode(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                              placeholder="e.g. SL-ORG-8492"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setEditingUserId(null)} className="text-[10px] text-slate-400 hover:text-slate-200">Cancel</button>
                            <button onClick={() => handleSaveUser(u.id)} className="px-3 py-1 bg-purple-600 text-white rounded-full text-[10px] font-bold">Save Record</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-100">{u.fullName}</h4>
                                <p className="text-[10px] font-mono text-slate-400">@{u.username}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => handleEditUserClick(u)} className="p-1 text-[9px] font-mono text-slate-400 hover:text-slate-200">EDIT</button>
                              <button onClick={() => { if(confirm(`Delete ${u.fullName}?`)) deleteUserProfile(u.id); }} className="p-1 text-[9px] font-mono text-red-400 hover:text-red-300">DELETE</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2.5 border-t border-slate-850">
                            <div>
                              <span className="text-slate-500 block text-[8px]">CELLPHONE</span>
                              <span className="text-slate-200 font-bold">{u.phone}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px]">ORG RESIDENCE</span>
                              <span className="text-slate-200 truncate block text-[9px] font-bold">
                                {uOrg ? uOrg.name : 'Independent'} ({u.orgCode || 'None'})
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZATIONS MANAGEMENT */}
        {activeTab === 'ORGANIZATIONS' && (
          <div className="space-y-4 animate-fadeIn text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Registered Housing Nodes ({organizations.length})</h2>
                <p className="text-xs text-slate-500">Add, edit, or deprecate organization profile codes.</p>
              </div>

              <input
                type="text"
                placeholder="Search residence name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono w-full md:w-64"
              />
            </div>

            {/* Organizations list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations
                .filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(o => {
                  const isEditing = editingOrgId === o.id;
                  const resCount = users.filter(u => u.orgCode === o.id).length;

                  return (
                    <div key={o.id} className="p-4 bg-slate-900/60 border border-slate-900 rounded-3xl space-y-3">
                      {isEditing ? (
                        <div className="space-y-2.5 font-mono text-xs">
                          <div>
                            <label className="text-[8px] text-slate-500 block mb-1">RESIDENCE NAME</label>
                            <input
                              type="text"
                              value={editOrgName}
                              onChange={e => setEditOrgName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 block mb-1">MANAGER NAME</label>
                            <input
                              type="text"
                              value={editOrgContactName}
                              onChange={e => setEditOrgContactName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 block mb-1">EMAIL ADDRESS</label>
                            <input
                              type="text"
                              value={editOrgContactEmail}
                              onChange={e => setEditOrgContactEmail(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setEditingOrgId(null)} className="text-[10px] text-slate-400 hover:text-slate-200">Cancel</button>
                            <button onClick={() => handleSaveOrg(o.id)} className="px-3 py-1 bg-purple-600 text-white rounded-full text-[10px] font-bold">Save Org</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm font-mono">
                                🏢
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-100">{o.name}</h4>
                                <span className="text-[8px] font-mono font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/10">
                                  ID: {o.id}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => handleEditOrgClick(o)} className="p-1 text-[9px] font-mono text-slate-400 hover:text-slate-200">EDIT</button>
                              <button onClick={() => { if(confirm(`Delete ${o.name} and unbind its users?`)) deleteOrganization(o.id); }} className="p-1 text-[9px] font-mono text-red-400 hover:text-red-300">DELETE</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono pt-2.5 border-t border-slate-850 text-center">
                            <div className="border-r border-slate-800">
                              <span className="text-slate-500 block text-[8px]">MANAGER</span>
                              <span className="text-slate-200 font-bold block truncate">{o.contactName}</span>
                            </div>
                            <div className="border-r border-slate-800">
                              <span className="text-slate-500 block text-[8px]">RESIDENTS</span>
                              <span className="text-slate-200 font-bold block">{resCount} active</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px]">DATABASE TYPE</span>
                              <span className="text-purple-400 text-[8px] uppercase font-black block mt-0.5">Firebase Stack</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVE PANICS / DISTRESS FEED */}
        {activeTab === 'PANICS' && (
          <div className="space-y-4 animate-fadeIn text-left">
            <div>
              <h2 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Global System distress events ({panicEvents.length})</h2>
              <p className="text-xs text-slate-500">Live emergency cascades being processed in real-time.</p>
            </div>

            {panicEvents.length === 0 ? (
              <div className="p-12 bg-slate-900/20 border border-slate-900/60 rounded-3xl text-center">
                <span className="text-3xl">🛡️</span>
                <p className="text-xs text-slate-500 font-mono mt-2">All locations stabilized. No active panic distress signals found in core database.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {panicEvents.map(p => {
                  const isResolved = p.status === 'RESOLVED';
                  return (
                    <div key={p.id} className={`p-5 rounded-3xl border text-left space-y-3.5 transition-all ${isResolved ? 'bg-slate-900/30 border-slate-900' : 'bg-red-950/15 border-red-500/20 animate-pulse'}`}>
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-100">{p.description}</span>
                            <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${isResolved ? 'bg-slate-800 text-slate-400' : 'bg-red-500 text-slate-950 animate-pulse'}`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500">
                            Incident Node ID: {p.id} • Lat: {p.lat.toFixed(5)}, Lng: {p.lng.toFixed(5)}
                          </p>
                        </div>

                        {!isResolved && (
                          <button
                            onClick={() => resolvePanic(p.id)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold rounded-xl uppercase tracking-wider shadow"
                          >
                            Resolve Distress
                          </button>
                        )}
                      </div>

                      <div className="bg-slate-950/80 border border-slate-900 p-3.5 rounded-2xl space-y-2">
                        <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Sequential Dispatch Log</span>
                        <div className="space-y-1 font-mono text-[9px] text-slate-400">
                          {p.timelineData.map((log, lidx) => (
                            <div key={lidx} className="flex gap-2">
                              <span className="text-purple-400 shrink-0">›</span>
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
