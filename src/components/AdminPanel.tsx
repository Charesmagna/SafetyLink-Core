import React, { useState, useEffect } from 'react';
import { useAppStore, ADMIN_ORG_CODE } from '../utils/store';
import { UserProfile, Organization } from '../types';
import { sendTestEvent } from '../services/ThingsBoardService';
import slLogoMain from '../assets/images/sl_logomain.jpeg';
import { motion, AnimatePresence } from 'motion/react';

import slide1 from '../assets/images/safetylink_officer_phone_1783207722148.jpg';
import slide2 from '../assets/images/safetylink_team_tablet_1783207733837.jpg';
import slide3 from '../assets/images/regenerated_image_1783360733591.jpg';
import slide4 from '../assets/images/safetylink_control_center_1783424754132.jpg';
import slide5 from '../assets/images/safetylink_campus_patrol_1783424770332.jpg';

type AdminTab = 'OVERVIEW' | 'USERS' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS';

export const AdminPanel: React.FC = () => {
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
    addAuditLog,
    thingsBoardToken,
    setThingsBoardToken,
    approveOrganization,
    customTools,
    addCustomTool,
    deleteCustomTool
  } = useAppStore();

  // Background slideshow logic
  const adminSlides = [slide3, slide4, slide5, slide1, slide2];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adminSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [adminSlides.length]);

  const [tbTokenInput, setTbTokenInput] = useState(thingsBoardToken);
  const [tbTestStatus, setTbTestStatus] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle');

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  // Custom tool form state
  const [newToolTitle, setNewToolTitle] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolType, setNewToolType] = useState<'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET'>('INFO');
  const [newToolValue, setNewToolValue] = useState('');

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
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden pb-12 relative">
      {/* Background Slideshow animation */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 0.15 }} // Subtle 15% opacity for Super Admin dashboard readability
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={adminSlides[currentSlide]}
              alt="SafetyLink Administration Background"
              className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.1] saturate-[0.8]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 digital-grid opacity-[0.04]" />
      </div>

      {/* Super Admin Top Badge */}
      <div className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-mono text-[10px] font-bold text-center py-2 px-4 tracking-wider uppercase flex items-center justify-center gap-2 relative z-50 shadow-md">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
        <span>🔒 SECURED CORE ADMINISTRATIVE INTERACTION PROTOCOL LOCKED 🔒</span>
      </div>

      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-900 py-4 px-6 flex justify-between items-center shadow-lg relative z-10">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
        <div className="flex items-center gap-3 text-left">
          <img src={slLogoMain} alt="SafetyLink" className="w-9 h-9 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-100 uppercase font-mono">
              SL Global Command
            </h1>
            <p className="text-[10px] text-purple-400 font-mono uppercase tracking-widest font-black">
              System Admin ({ADMIN_ORG_CODE.toUpperCase()}) // <span className="text-amber-500/80 font-black">POWERED BY TM MEDIA SOLUTIONS</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white transition-colors text-[10px] font-mono font-bold rounded-full"
        >
          SIGNOUT SECURE LINK
        </button>
      </header>

      {/* Admin Nav Bar */}
      <nav className="bg-slate-900/50 border-b border-slate-900 flex p-1 justify-start gap-1 overflow-x-auto relative z-10">
        {(['OVERVIEW', 'USERS', 'ORGANIZATIONS', 'PANICS', 'SETTINGS'] as AdminTab[]).map((tab) => (
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
            {tab === 'PANICS' ? '🚨 distress signals' : tab === 'ORGANIZATIONS' ? '🏢 organizations' : tab === 'USERS' ? '👥 registered users' : tab === 'SETTINGS' ? '⚙️ tools & settings' : '📊 overview'}
          </button>
        ))}
      </nav>

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">
        
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

            {/* ThingsBoard Cloud Integration */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-200">ThingsBoard Cloud Integration</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Every real (non-drill) SOS trigger pushes incident telemetry to your ThingsBoard device,
                  giving org-wide visibility on your dashboard. Paste your device access token below --
                  it's stored only on this device, never committed to the repo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tbTokenInput}
                  onChange={(e) => setTbTokenInput(e.target.value)}
                  placeholder="ThingsBoard device access token"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600"
                />
                <button
                  onClick={() => setThingsBoardToken(tbTokenInput.trim())}
                  className="px-4 py-2 text-[10px] font-mono font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  SAVE
                </button>
                <button
                  disabled={!thingsBoardToken || tbTestStatus === 'sending'}
                  onClick={async () => {
                    setTbTestStatus('sending');
                    const ok = await sendTestEvent(thingsBoardToken);
                    setTbTestStatus(ok ? 'ok' : 'fail');
                    addAuditLog('SYSTEM', ok ? 'INFO' : 'WARN', ok ? 'ThingsBoard test event sent' : 'ThingsBoard test event failed', '');
                  }}
                  className="px-4 py-2 text-[10px] font-mono font-bold rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors whitespace-nowrap"
                >
                  {tbTestStatus === 'sending' ? 'SENDING...' : 'SEND TEST EVENT'}
                </button>
              </div>
              {tbTestStatus === 'ok' && <p className="text-[10px] text-emerald-400 font-mono">✓ Delivered -- check the Latest Telemetry tab on your ThingsBoard device.</p>}
              {tbTestStatus === 'fail' && <p className="text-[10px] text-red-400 font-mono">✗ Failed to reach ThingsBoard. Check the token and your connection.</p>}
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
        {activeTab === 'ORGANIZATIONS' && (() => {
          const pendingOrgs = organizations.filter(o => o.approved === false);
          const approvedOrgs = organizations.filter(o => o.approved !== false);

          return (
            <div className="space-y-4 animate-fadeIn text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Registered Housing Nodes ({approvedOrgs.length})</h2>
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

              {/* Pending Approvals */}
              {pendingOrgs.length > 0 && (
                <div className="bg-purple-950/25 border border-purple-500/30 p-5 rounded-3xl space-y-3.5 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                    <h3 className="text-xs font-mono font-black uppercase text-purple-300 tracking-wider">
                      🔔 Pending Organization Registries Awaiting System Admin Approval ({pendingOrgs.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingOrgs.map((o) => (
                      <div key={o.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow-md">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-100">{o.name}</h4>
                            <span className="text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/10">{o.id}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Manager: {o.contactName} • Email: {o.contactEmail}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { if(confirm(`Reject and delete registration request for ${o.name}?`)) deleteOrganization(o.id); }}
                            className="px-3 py-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold rounded-lg transition-colors border border-slate-800"
                          >
                            REJECT
                          </button>
                          <button
                            onClick={() => approveOrganization(o.id)}
                            className="px-3.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all"
                          >
                            ACCEPT REGISTRY
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizations list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedOrgs
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
          );
        })()}

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

        {/* TAB 5: TOOLS & SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="space-y-6 animate-fadeIn text-left">
            {/* Thingsboard Section (Existing top settings block) */}
            <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">ThingsBoard Edge Telemetry Route Configuration</h3>
                <p className="text-xs text-slate-500">
                  Bind this instance to your specific remote rule chain. Panics will automatically push device telemetries.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Paste ThingsBoard device access token..."
                  value={tbTokenInput}
                  onChange={e => setTbTokenInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setThingsBoardToken(tbTokenInput);
                      addAuditLog('SYSTEM', 'INFO', 'ThingsBoard token saved');
                    }}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold rounded-2xl transition-colors shrink-0"
                  >
                    SAVE ROUTE
                  </button>

                  <button
                    onClick={async () => {
                      if (!tbTokenInput) return alert('Save a token first.');
                      setTbTestStatus('sending');
                      const ok = await sendTestEvent(tbTokenInput);
                      setTbTestStatus(ok ? 'ok' : 'fail');
                      setTimeout(() => setTbTestStatus('idle'), 3000);
                    }}
                    disabled={tbTestStatus === 'sending'}
                    className={`px-4 py-3 border text-xs font-mono font-bold rounded-2xl transition-colors shrink-0 ${
                      tbTestStatus === 'ok' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400' :
                      tbTestStatus === 'fail' ? 'bg-red-950/20 border-red-500/40 text-red-400' :
                      'border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    {tbTestStatus === 'sending' ? 'CONNECTING...' : tbTestStatus === 'ok' ? 'EVENT FIRED ✓' : tbTestStatus === 'fail' ? 'FAILED' : 'FIRE TEST EVENT'}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Tools Builder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Creator Form */}
              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-4 md:col-span-1">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-purple-400 font-mono tracking-wider">🛠️ Add New Custom Tool / Setting</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Instantly push a new setting, quick-dial contact, or automatic integration tool to all connected SafetyLink devices and resident dashboards.
                  </p>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">Tool Title</label>
                    <input
                      type="text"
                      placeholder="e.g. WhatsApp Auto Panic Group"
                      value={newToolTitle}
                      onChange={e => setNewToolTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">Description / Instruction</label>
                    <textarea
                      placeholder="e.g. Automatically opens WhatsApp and sends your high-precision coordinates to Flatmates."
                      value={newToolDesc}
                      onChange={e => setNewToolDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">Action Type</label>
                    <select
                      value={newToolType}
                      onChange={e => setNewToolType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-sans"
                    >
                      <option value="INFO">INFORMATION / RESOURCE CARD</option>
                      <option value="WHATSAPP">WHATSAPP TEMPLATE BINDING</option>
                      <option value="CALL">DIRECT SPEED DIAL TRIGGER</option>
                      <option value="SMS">SMS BROADCAST BINDING</option>
                      <option value="WIDGET">INTERACTIVE WEB WIDGET</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] text-slate-500 font-bold block mb-1 uppercase">Target Value / Action Parameter</label>
                    <input
                      type="text"
                      placeholder={
                        newToolType === 'WHATSAPP' || newToolType === 'SMS' ? 'e.g. template text with {LAT},{LNG}' :
                        newToolType === 'CALL' ? 'e.g. +27XXXXXXXXX' :
                        'e.g. phone number, external URL, or text resource'
                      }
                      value={newToolValue}
                      onChange={e => setNewToolValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newToolTitle.trim()) return alert('Please enter a tool title.');
                      addCustomTool({
                        title: newToolTitle,
                        description: newToolDesc,
                        type: newToolType,
                        targetValue: newToolValue
                      });
                      setNewToolTitle('');
                      setNewToolDesc('');
                      setNewToolValue('');
                      addAuditLog('SYSTEM', 'INFO', `Admin pushed global tool: ${newToolTitle}`);
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-[10px] tracking-wider uppercase transition-all"
                  >
                    PUBLISH GLOBAL TOOL
                  </button>
                </div>
              </div>

              {/* Tools List */}
              <div className="bg-slate-900 border border-slate-900 rounded-3xl p-5 space-y-4 md:col-span-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-300 font-mono tracking-wider">Active Globally-Pushed Tools & Settings</h3>
                  <p className="text-xs text-slate-500">
                    The following tools are currently active and embedded directly into every individual occupant's workspace.
                  </p>
                </div>

                {customTools.filter(t => !t.targetOrgId).length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-mono">No custom global tools have been created yet. Use the form on the left to add one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customTools.filter(t => !t.targetOrgId).map((t) => (
                      <div key={t.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex justify-between items-start gap-3 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{t.title}</span>
                            <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-purple-900/40 text-purple-300 rounded border border-purple-500/20">
                              {t.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                          <p className="text-[9px] font-mono text-slate-500 truncate max-w-md">Param: {t.targetValue}</p>
                        </div>
                        <button
                          onClick={() => deleteCustomTool(t.id)}
                          className="px-2.5 py-1.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900 hover:text-white text-red-400 text-[9px] font-mono font-bold rounded-lg transition-all uppercase"
                        >
                          REVOKE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
