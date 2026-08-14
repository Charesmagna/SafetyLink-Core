import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { Camera, Save, User, MapPin, Phone, Activity } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, updateClientProfile, addToast } = useAppStore();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [medicalInfo, setMedicalInfo] = useState(currentUser?.medicalInfo || '');
  const [homeAddress, setHomeAddress] = useState(currentUser?.homeAddress || '');
  const [workAddress, setWorkAddress] = useState(currentUser?.workAddress || '');
  
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

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-sm">
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
    </div>
  );
};
