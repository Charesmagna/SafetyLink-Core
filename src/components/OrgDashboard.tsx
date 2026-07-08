import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { UserProfile } from '../types';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const OrgDashboard: React.FC = () => {
  const { 
    currentOrg, 
    users, 
    logout, 
    updateUserProfile, 
    deleteUserProfile, 
    panicEvents, 
    resolvePanic,
    customTools,
    addCustomTool,
    deleteCustomTool
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Student editor modal or inline state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Org Custom Tools Form State
  const [newToolTitle, setNewToolTitle] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolType, setNewToolType] = useState<'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET'>('INFO');
  const [newToolValue, setNewToolValue] = useState('');

  if (!currentOrg) return null;

  // Filter students/members belonging to this organization code
  const registeredStudents = users.filter(u => u.orgCode === currentOrg.id);
  
  // Filter by search term
  const filteredStudents = registeredStudents.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  // Active panic alerts triggered by people in this organization
  const orgUserIds = new Set(registeredStudents.map(s => s.username.toLowerCase()));
  const activeOrgPanics = panicEvents.filter(p => 
    p.status !== 'RESOLVED' && 
    (p.description.toLowerCase().includes(currentOrg.name.toLowerCase()) || 
     orgUserIds.has(p.description.split(' ').pop()?.toLowerCase() || ''))
  );

  const handleEditClick = (student: UserProfile) => {
    setEditingUserId(student.id);
    setEditFullName(student.fullName);
    setEditPhone(student.phone);
    setEditEmail(student.email);
  };

  const handleSaveEdit = (id: string) => {
    updateUserProfile(id, {
      fullName: editFullName,
      phone: editPhone,
      email: editEmail
    });
    setEditingUserId(null);
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden pb-12">
      {/* Active Org Alerts */}
      {activeOrgPanics.length > 0 && (
        <div className="w-full bg-red-600 text-white font-mono text-xs font-bold text-center py-2.5 px-4 tracking-wider uppercase animate-pulse flex items-center justify-center gap-2 relative z-50">
          <span>🚨 ACTIVE DISTRESS SIGNAL DETECTED FROM YOUR NODE RESPONDERS 🚨</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-900 py-4 px-6 flex justify-between items-center shadow-lg relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-60" />
        <div className="flex items-center gap-3 text-left">
          <SafetyLinkLogo size={32} />
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase font-mono">
              {currentOrg.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Safety Node Commander Deck
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[10px] font-mono font-bold rounded-full border border-slate-800"
        >
          LOGOUT SESSION
        </button>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Org ID info board */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 flex flex-col md:flex-row gap-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-1 space-y-3.5">
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-mono font-black text-emerald-400 tracking-widest uppercase bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block">
                ORGANIZATIONAL DISPATCH BOUNDING
              </span>
              <h2 className="text-base font-black text-slate-100 font-display uppercase tracking-wide">Share Onboarding QR Code</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Ensure all students, guards, employees, or tenants link automatically. Ask them to scan your secure **Safety Node QR Code** from their registration screen, or enter the Mesh Code manually during registration.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentOrg.id);
                  alert(`Copied Organization ID: ${currentOrg.id}`);
                }}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                📋 COPY TEXT ID
              </button>
              <button
                onClick={() => {
                  const payload = JSON.stringify({ type: 'safetylink-org', orgId: currentOrg.id, name: currentOrg.name });
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}&color=16-185-129&bgcolor=2-6-23`;
                  const a = document.createElement('a');
                  a.href = qrUrl;
                  a.target = '_blank';
                  a.click();
                }}
                className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/25 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                💾 DOWNLOAD QR BADGE
              </button>
            </div>
          </div>

          {/* Holographic QR Code Area */}
          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-4 shrink-0 min-w-[210px] relative overflow-hidden group shadow-xl">
            {/* Real QR Code */}
            <div className="relative p-2 bg-[#020617] rounded-xl border border-slate-900 group-hover:border-emerald-500/20 transition-all">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ type: 'safetylink-org', orgId: currentOrg.id, name: currentOrg.name }))}&color=16-185-129&bgcolor=2-6-23`}
                alt="Onboarding QR Code"
                className="w-[140px] h-[140px] object-contain rounded-lg filter brightness-105"
              />
            </div>

            <span className="text-[10px] font-mono font-black text-slate-100 tracking-wider mt-2.5 select-all">
              {currentOrg.id}
            </span>
            <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest mt-0.5">
              Unique Safety Link Badge
            </span>
          </div>
        </div>

        {/* Active Panics Feed */}
        {activeOrgPanics.length > 0 && (
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold text-red-500 font-mono uppercase tracking-wider">
              Critical Panic Distress Events
            </h3>
            <div className="space-y-2">
              {activeOrgPanics.map((p) => (
                <div key={p.id} className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{p.description}</span>
                      <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-red-500 text-slate-950 rounded-full">
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Location: {p.lat.toFixed(5)}, {p.lng.toFixed(5)} • Time: {new Date(p.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolvePanic(p.id)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold rounded-xl transition-colors uppercase self-start md:self-auto"
                  >
                    Resolve Incident
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registered Users Management */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
            <div>
              <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
                Registered Responders & Members ({filteredStudents.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized occupants or personnel linked to your safety layout node.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name/phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-full md:w-64 font-mono"
              />
            </div>
          </div>

          {/* Student Grid / List */}
          {filteredStudents.length === 0 ? (
            <div className="p-10 bg-slate-900/20 border border-slate-900/60 rounded-3xl text-center">
              <span className="text-2xl">👥</span>
              <p className="text-xs text-slate-500 font-mono mt-2">
                No members found matching your filters. Share your code {currentOrg.id} to register responders!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((student) => {
                const isEditing = editingUserId === student.id;

                return (
                  <div
                    key={student.id}
                    className="p-4 bg-slate-900/60 border border-slate-900/80 hover:border-slate-800 rounded-3xl transition-all text-left space-y-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3 font-mono">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Full Name</label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={e => setEditFullName(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs text-slate-100 w-full"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Phone Number</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs text-slate-100 w-full"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Email Address</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded-xl p-2 text-xs text-slate-100 w-full"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(student.id)}
                            className="px-3.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full hover:bg-emerald-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Student Card Info */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-slate-100">{student.fullName}</h4>
                              <p className="text-[10px] font-mono text-slate-400">@{student.username}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-1 text-[9px] font-mono text-slate-400 hover:text-slate-200 hover:underline uppercase"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Disconnect member ${student.fullName}?`)) {
                                  deleteUserProfile(student.id);
                                }
                              }}
                              className="p-1 text-[9px] font-mono text-red-400 hover:text-red-300 hover:underline uppercase"
                            >
                              DEL
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850 text-[10px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[8px] uppercase">Cellular Link</span>
                            <span className="text-slate-300 font-bold">{student.phone}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[8px] uppercase">Primary Email</span>
                            <span className="text-slate-300 truncate block">{student.email}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Tools pushed specifically by this Org */}
        <div className="space-y-6 pt-6 border-t border-slate-900">
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              🛠️ Organization Custom Tools & Dispatch settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Push tailored quick-dial triggers, local flatmate WhatsApp alerts, or instructions directly to your registered residents or client responders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Creator form */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4 md:col-span-1 shadow-lg">
              <span className="text-[10px] font-mono font-black uppercase text-emerald-400 block tracking-wider">
                Create Client Tool
              </span>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-[8px] text-slate-500 font-bold block mb-1">TOOL TITLE</label>
                  <input
                    type="text"
                    placeholder="e.g. Block A WhatsApp Dispatch"
                    value={newToolTitle}
                    onChange={e => setNewToolTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-slate-500 font-bold block mb-1">DESCRIPTION</label>
                  <textarea
                    placeholder="e.g. Instantly alert neighboring Block A rooms with your current GPS coordinate template."
                    value={newToolDesc}
                    onChange={e => setNewToolDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-200 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-slate-500 font-bold block mb-1">ACTION TYPE</label>
                  <select
                    value={newToolType}
                    onChange={e => setNewToolType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-300 font-sans"
                  >
                    <option value="INFO">INFORMATION / RESOURCE CARD</option>
                    <option value="WHATSAPP">WHATSAPP TEMPLATE BINDING</option>
                    <option value="CALL">DIRECT SPEED DIAL TRIGGER</option>
                    <option value="SMS">SMS BROADCAST BINDING</option>
                    <option value="WIDGET">INTERACTIVE WEB WIDGET</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] text-slate-500 font-bold block mb-1">ACTION VALUE / PARAMETER</label>
                  <input
                    type="text"
                    placeholder={
                      newToolType === 'WHATSAPP' || newToolType === 'SMS' ? 'e.g. template text with {LAT},{LNG}' :
                      newToolType === 'CALL' ? 'e.g. +27XXXXXXXXX' :
                      'e.g. parameter or instruction text'
                    }
                    value={newToolValue}
                    onChange={e => setNewToolValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newToolTitle.trim()) return alert('Please enter a tool title.');
                    addCustomTool({
                      title: newToolTitle,
                      description: newToolDesc,
                      type: newToolType,
                      targetValue: newToolValue,
                      targetOrgId: currentOrg.id
                    });
                    setNewToolTitle('');
                    setNewToolDesc('');
                    setNewToolValue('');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] tracking-wider uppercase transition-all"
                >
                  PUSH TO MY RESPONDERS
                </button>
              </div>
            </div>

            {/* List of current tools for this Org */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4 md:col-span-2 shadow-lg">
              <span className="text-[10px] font-mono font-black uppercase text-slate-400 block tracking-wider">
                Active Organization Tools
              </span>

              {customTools.filter(t => t.targetOrgId === currentOrg.id).length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center h-[200px]">
                  <p className="text-xs text-slate-500 font-mono">No organization-specific tools created yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {customTools.filter(t => t.targetOrgId === currentOrg.id).map((t) => (
                    <div key={t.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex justify-between items-start gap-3 shadow-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{t.title}</span>
                          <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-emerald-950/20 text-emerald-400 rounded border border-emerald-500/10">
                            {t.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                        <p className="text-[9px] font-mono text-slate-500 truncate">Param: {t.targetValue}</p>
                      </div>
                      <button
                        type="button"
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
      </main>
    </div>
  );
};
