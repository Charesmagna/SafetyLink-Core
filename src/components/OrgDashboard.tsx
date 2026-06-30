import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { UserProfile } from '../types';

export const OrgDashboard: React.FC = () => {
  const { currentOrg, users, logout, updateUserProfile, deleteUserProfile, panicEvents, resolvePanic } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Student editor modal or inline state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden pb-12">
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
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
            🏢
          </div>
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
      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Org ID info board */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="space-y-1 max-w-lg">
            <h2 className="text-sm font-bold text-slate-200">Share Code with Responders / Residents / Members</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              When students, employees, responders, or tenants create profiles, ask them to write your unique code below. They will immediately bind to your command deck for SOS fallback dispatch.
            </p>
          </div>

          <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0 min-w-[200px]">
            <span className="text-[9px] font-mono font-black text-emerald-400 tracking-wider uppercase mb-1">
              Active Org ID
            </span>
            <span className="text-lg font-mono font-black text-slate-100 tracking-widest select-all">
              {currentOrg.id}
            </span>
            <span className="text-[8px] text-slate-500 mt-1 uppercase font-mono">
              Tap to highlight and copy
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
      </main>
    </div>
  );
};
