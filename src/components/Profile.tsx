import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { Camera, Save, User, MapPin, Phone, Activity, Building2, Link2, Unlink } from 'lucide-react';

export const Profile: React.FC = () => {
  const {
    currentUser,
    organizations,
    updateClientProfile,
    requestJoinOrganization,
    disconnectFromOrganization,
    addToast,
  } = useAppStore();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [medicalInfo, setMedicalInfo] = useState(currentUser?.medicalInfo || '');
  const [homeAddress, setHomeAddress] = useState(currentUser?.homeAddress || '');
  const [workAddress, setWorkAddress] = useState(currentUser?.workAddress || '');
  const [joinOrgCode, setJoinOrgCode] = useState('');
  const [joinRole, setJoinRole] = useState('Community Member');
  const [busyOrg, setBusyOrg] = useState(false);
  
  // Sync state if currentUser changes from outside
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setUsername(currentUser.username || '');
      setPhone(currentUser.phone || '');
      setMedicalInfo(currentUser.medicalInfo || '');
      setHomeAddress(currentUser.homeAddress || '');
      setWorkAddress(currentUser.workAddress || '');
    }
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    updateClientProfile(currentUser.id, {
      fullName,
      username,
      phone,
      medicalInfo,
      homeAddress,
      workAddress
    });
    
    addToast('Profile updated successfully.', 'success');
  };

  const connectedOrg = currentUser?.orgCode
    ? organizations.find(o => o.id.toUpperCase() === currentUser.orgCode?.toUpperCase())
    : null;

  const handleRequestJoinOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !joinOrgCode.trim()) {
      addToast('Please enter an Organization Code (e.g. SL-ORG-001).', 'error');
      return;
    }
    const res = requestJoinOrganization(currentUser.id, joinOrgCode.trim().toUpperCase(), joinRole);
    if (res.success) {
      addToast(`Join request sent to ${joinOrgCode.trim().toUpperCase()}. Awaiting organization approval.`, 'success');
      setJoinOrgCode('');
    } else {
      addToast(res.error || 'Could not submit join request.', 'error');
    }
  };

  const handleDisconnectOrg = async () => {
    if (!currentUser) return;
    setBusyOrg(true);
    await disconnectFromOrganization(currentUser.id);
    setBusyOrg(false);
    addToast('Disconnected from organization. Your personal account remains active and free.', 'info');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl border-2 border-slate-700 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} className="text-white mb-1" />
              <span className="text-[8px] font-bold text-white uppercase tracking-wider">Change</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black text-slate-200 leading-tight">{fullName || 'Set your name'}</h2>
            <p className="text-xs font-mono text-slate-500 mt-1">@{username || 'username'}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {currentUser?.orgCode ? `Linked · ${currentUser.orgCode}` : 'Free Personal Account'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="font-mono text-xs font-bold leading-none">@</span> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} /> Primary Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="e.g. +27829110000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Home Address
              </label>
              <textarea
                value={homeAddress}
                onChange={e => setHomeAddress(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                placeholder="Your primary physical address"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} /> Medical Info & Notes
              </label>
              <textarea
                value={medicalInfo}
                onChange={e => setMedicalInfo(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                placeholder="Allergies, blood type, conditions..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/50">
            <button
              type="submit"
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
            >
              <Save size={14} /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Organization Connect / Disconnect Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm text-left space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Building2 size={14} className="text-cyan-400" /> Organization Monitoring Link
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Connect to a security company, school, estate, or employer so they can monitor your SOS alerts, or disconnect anytime.
            </p>
          </div>
        </div>

        {currentUser?.orgCode ? (
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-emerald-400 block">Connected Organization</span>
              <p className="text-sm font-black text-slate-100">{connectedOrg?.name || currentUser.orgCode}</p>
              <p className="text-[10px] font-mono text-slate-400">Code: {currentUser.orgCode} · Role: {currentUser.role}</p>
            </div>
            <button
              type="button"
              disabled={busyOrg}
              onClick={handleDisconnectOrg}
              className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Unlink size={12} /> {busyOrg ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : currentUser?.pendingOrgCode ? (
          <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-400 block">Pending Organization Approval</span>
              <p className="text-xs font-bold text-slate-200 mt-0.5">Requested to join <span className="font-mono text-amber-300">{currentUser.pendingOrgCode}</span> as {currentUser.pendingRole || 'Community Member'}</p>
              <p className="text-[9.5px] text-slate-400 mt-0.5">The Organization Commander can approve or decline your request from their dashboard.</p>
            </div>
            <button
              type="button"
              disabled={busyOrg}
              onClick={handleDisconnectOrg}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider shrink-0"
            >
              Cancel Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleRequestJoinOrg} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Organization Code</label>
                <input
                  type="text"
                  value={joinOrgCode}
                  onChange={e => setJoinOrgCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SL-ORG-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Requested Role</label>
                <select
                  value={joinRole}
                  onChange={e => setJoinRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="Community Member">Community Member</option>
                  <option value="Employee">Employee / Staff</option>
                  <option value="Student">Student</option>
                  <option value="Patrol Officer">Patrol Officer / Guard</option>
                  <option value="Responder">Responder</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/30 text-cyan-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Link2 size={13} /> Request to Connect to Organization
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

