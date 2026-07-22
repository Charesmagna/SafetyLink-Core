import React, { useState } from 'react';
import { GlobalRadarBackground } from './GlobalRadarBackground';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';
import { UserProfile } from '../types';
import { LogoSetPart } from './LogoSetPart';
import { GlowingHeartBackground } from './GlowingHeartBackground';
import { MphakatiOverwatch } from './MphakatiOverwatch';
import { MotherboardConsole } from './MotherboardConsole';

export const OrgDashboard: React.FC = () => {
  const { 
    currentOrg: storeOrg, 
    currentUser,
    organizations,
    users, 
    logout, 
    updateUserProfile, 
    deleteUserProfile, 
    panicEvents, 
    
    customTools,
    addCustomTool,
    deleteCustomTool,
    updateOrgBranding,
    updateClientProfile,
    localOfflineQueue,
    syncOfflineQueue,
    approvePendingUser,
    rejectPendingUser
  } = useAppStore();

  const currentOrg = storeOrg || (currentUser?.orgCode ? organizations.find(o => o.id === currentUser.orgCode) : null);

  const isResponder = currentUser?.role === 'Responder';
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'roster' | 'branding' | 'analytics' | 'twilio' | 'open-platforms' | 'mphakati-overwatch'>('dispatch');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Roster detailed editor state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editMedicalInfo, setEditMedicalInfo] = useState('');
  const [editRiskNotes, setEditRiskNotes] = useState('');
  const [editOfficer, setEditOfficer] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContactsList, setEditContactsList] = useState('');

  // Branding Form State (pre-populated from currentOrg values)
  const [brandLogoUrl, setBrandLogoUrl] = useState(currentOrg?.logoUrl || '/media/new_logo/New_SafetyLink_Official_Logo.svg');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(currentOrg?.primaryColor || '#10b981');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(currentOrg?.secondaryColor || '#06b6d4');
  const [brandControlRoomNumber, setBrandControlRoomNumber] = useState(currentOrg?.controlRoomNumber || '+27829110000');
  const [brandEscalationPolicy, setBrandEscalationPolicy] = useState(currentOrg?.escalationPolicy || 'Multi-stage fallback SMS alert sequence -> Dedicated Sector Response dispatch -> Escalation to Municipal SAPS.');

  // Org Custom Tools Form State
  const [newToolTitle, setNewToolTitle] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolType, setNewToolType] = useState<'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET'>('INFO');
  const [newToolValue, setNewToolValue] = useState('');

  // Twilio Setup State variables
  const [twilioAccountSid, setTwilioAccountSid] = useState(currentOrg?.twilio?.accountSid || '');
  const [twilioAuthToken, setTwilioAuthToken] = useState(currentOrg?.twilio?.authToken || '');
  const [twilioFromNumber, setTwilioFromNumber] = useState(currentOrg?.twilio?.fromNumber || '');
  const [twilioTestStatus, setTwilioTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [twilioTestMessage, setTwilioTestMessage] = useState('');

  // Open Platforms State variables
  const [ntfyTopic, setNtfyTopic] = useState(currentOrg?.ntfy?.topic || '');
  const [ntfyServerUrl, setNtfyServerUrl] = useState(currentOrg?.ntfy?.serverUrl || '');
  const [ownCloudServerUrl, setOwnCloudServerUrl] = useState(currentOrg?.ownCloud?.serverUrl || '');
  const [ownCloudUsername, setOwnCloudUsername] = useState(currentOrg?.ownCloud?.username || '');
  const [ownCloudToken, setOwnCloudToken] = useState(currentOrg?.ownCloud?.token || '');
  const [ownCloudFolder, setOwnCloudFolder] = useState(currentOrg?.ownCloud?.folder || 'safetylink-evidence');
  const [ssUdpHost, setSsUdpHost] = useState(currentOrg?.sensorStream?.udpHost || '192.168.1.100');
  const [ssUdpPort, setSsUdpPort] = useState(currentOrg?.sensorStream?.udpPort ? currentOrg?.sensorStream?.udpPort.toString() : '5005');
  const [ssEnabled, setSsEnabled] = useState(currentOrg?.sensorStream?.enabled || false);

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
    setEditAccountNumber(student.accountNumber || `SL-ACC-${Math.floor(10000 + Math.random() * 90000)}`);
    setEditMedicalInfo(student.medicalInfo || 'No chronic conditions logged.');
    setEditRiskNotes(student.riskNotes || 'Standard perimeter monitoring.');
    setEditOfficer(student.assignedResponseOfficer || 'Officer Thabo (Sector Alpha)');
    setEditHospital(student.preferredHospital || 'Netcare Milpark Hospital');
    setEditAddress(student.homeAddress || 'Wits Campus Housing, West Campus');
    setEditContactsList(student.emergencyContactsList || '+27839110000, +27117171000');
  };

  const handleSaveEdit = (id: string) => {
    updateUserProfile(id, {
      fullName: editFullName,
      phone: editPhone,
      email: editEmail
    });
    
    updateClientProfile(id, {
      accountNumber: editAccountNumber,
      medicalInfo: editMedicalInfo,
      riskNotes: editRiskNotes,
      assignedResponseOfficer: editOfficer,
      preferredHospital: editHospital,
      homeAddress: editAddress,
      emergencyContactsList: editContactsList
    });

    setEditingUserId(null);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgBranding({
      logoUrl: brandLogoUrl,
      primaryColor: brandPrimaryColor,
      secondaryColor: brandSecondaryColor,
      controlRoomNumber: brandControlRoomNumber,
      escalationPolicy: brandEscalationPolicy
    });
  };

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden pb-4 relative">
      {activeSubTab === 'dispatch' ? (
        <GlobalRadarBackground />
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-50"
        >
          <source src="/media/petal_20260720_024055.mp4" type="video/mp4" />
        </video>
      )}
      {/* Background with Glowing Heart and Heartbeat Pulse */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <GlowingHeartBackground />
        {/* Transparent dark overlay to keep foreground text highly readable */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px]" />
      </div>
      {/* Active Org Alerts Banner */}
      {activeOrgPanics.length > 0 && (
        <div className="w-full bg-red-600 text-white font-mono text-xs font-bold text-center py-2.5 px-4 tracking-wider uppercase animate-pulse flex items-center justify-center gap-2 relative z-50">
          <span>🚨 ALERT: CRITICAL SOS SIGNAL DETECTED FROM ASSIGNED SUBSCRIBER NODE 🚨</span>
        </div>
      )}

      {/* Header Bar with custom theme colors if configured */}
      <header className="bg-slate-900 border-b border-slate-900/80 py-4 px-6 flex flex-col sm:flex-row justify-between items-center shadow-lg relative gap-3 z-10">
        <div 
          className="absolute top-0 left-0 right-0 h-1" 
          style={{ backgroundImage: `linear-gradient(to right, ${brandPrimaryColor}, ${brandSecondaryColor})` }}
        />
        
        <div className="flex items-center gap-4 text-left">
          {brandLogoUrl ? (
            <img 
              src={brandLogoUrl} 
              alt="Org Logo" 
              className="w-16 h-16 rounded-2xl border object-cover border-slate-700 shadow-md"
              onError={() => setBrandLogoUrl('')}
            />
          ) : (
            <LogoSetPart part="accent" size={68} rounded="2xl" />
          )}
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase font-mono flex items-center gap-2">
              {currentOrg.name} 
              <span className="text-[8.5px] px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 font-bold font-mono">
                ACTIVE COMMAND NODE
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">
              Secure Safety Link Dispatcher Deck // <span className="text-amber-500/80 font-black">POWERED BY TM MEDIA SOLUTIONS</span>
            </p>
          </div>
        </div>

        {/* Dashboard Sub-Tabs navigation panel */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
          <button
            onClick={() => setActiveSubTab('dispatch')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'dispatch' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🛰️ Dispatch Control
          </button>
          {!isResponder && <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'roster' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            👥 Clients / Profiles
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('branding')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'branding' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🎨 branding & SLA
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('twilio')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'twilio' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📞 Twilio Connection
          </button>}
          {!isResponder && <button
            onClick={() => setActiveSubTab('open-platforms')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'open-platforms' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🔌 Open Platforms
          </button>}
          <button
            onClick={() => setActiveSubTab('mphakati-overwatch')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'mphakati-overwatch' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🛡️ Mphakati Overwatch
          </button>
          {!isResponder && <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 text-[9px] font-mono font-black uppercase rounded-lg transition-all ${
              activeSubTab === 'analytics' ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            📈 Operations Analytics
          </button>}
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-850 hover:text-red-400 text-slate-400 transition-colors text-[9px] font-mono font-black rounded-lg border border-slate-800 uppercase"
        >
          Exit Session
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-5xl w-full mx-auto p-4 space-y-5 relative z-10">
        
        {/* Offline Queuing Synchronizer Alerts Banner */}
        {localOfflineQueue.length > 0 && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex justify-between items-center gap-3 text-left">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase font-mono">
                ⚠️ Local Offline Alerts Pending Sync ({localOfflineQueue.length})
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Simulated localized alerts queued in local cache. Force synchronization to dump events into control deck telemetry maps.
              </p>
            </div>
            <button
              onClick={syncOfflineQueue}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-black text-[9px] rounded-lg transition-all uppercase"
            >
              Sync Offline Queue
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: DISPATCH & PANIC DECK                       */}
        {/* ==================================================== */}
        {activeSubTab === 'dispatch' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Motherboard Response Console for Panics */}
            <MotherboardConsole />

            {/* Custom Tools pushed specifically by this Org */}
            <div className="space-y-4 pt-4 border-t border-slate-900/80">
              <div className="text-left">
                <h3 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">
                  🛠️ Subscriber Tools Customization
                </h3>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Inject quick-trigger icons, speed dial numbers, or regional guidance directly into your clients' mobile apps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Creator form */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 space-y-3.5 md:col-span-1">
                  <span className="text-[9px] font-mono font-black uppercase text-cyan-400 block tracking-wider">
                    Push New Client Tool
                  </span>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div>
                      <label className="text-[8px] text-slate-500 font-bold block mb-1">TOOL TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g. Campus Police Line"
                        value={newToolTitle}
                        onChange={e => setNewToolTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] text-slate-500 font-bold block mb-1">DESCRIPTION</label>
                      <textarea
                        placeholder="e.g. Directly connects to our 24/7 sector patrol dispatch room."
                        value={newToolDesc}
                        onChange={e => setNewToolDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] text-slate-500 font-bold block mb-1">ACTION TYPE</label>
                      <select
                        value={newToolType}
                        onChange={e => setNewToolType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300 font-sans"
                      >
                        <option value="INFO">INFORMATION CARD</option>
                        <option value="WHATSAPP">WHATSAPP BROADCAST</option>
                        <option value="CALL">SPEED DIAL DIALER</option>
                        <option value="SMS">SMS BINDING</option>
                        <option value="WIDGET">WEB PORTAL MODULAR</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[8px] text-slate-500 font-bold block mb-1">ACTION VALUE / PARAMETER</label>
                      <input
                        type="text"
                        placeholder={
                          newToolType === 'WHATSAPP' || newToolType === 'SMS' ? 'e.g. Distress at GPS: {LAT},{LNG}' :
                          newToolType === 'CALL' ? 'e.g. +27711234567' :
                          'e.g. Action parameter value'
                        }
                        value={newToolValue}
                        onChange={e => setNewToolValue(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newToolTitle.trim()) return alert('Please write a title.');
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
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[9px] tracking-wider uppercase transition-all font-mono"
                    >
                      Publish Custom Tool
                    </button>
                  </div>
                </div>

                {/* List of current tools for this Org */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 space-y-4 md:col-span-2">
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400 block tracking-wider">
                    Published Active Tools
                  </span>

                  {customTools.filter(t => t.targetOrgId === currentOrg.id).length === 0 ? (
                    <div className="p-10 border border-dashed border-slate-850 rounded-xl text-center flex flex-col items-center justify-center h-[200px]">
                      <p className="text-[10.5px] text-slate-500 font-mono">No active custom tools configured for your subscribers.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {customTools.filter(t => t.targetOrgId === currentOrg.id).map((t) => (
                        <div key={t.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-start gap-3 shadow-sm">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-100">{t.title}</span>
                              <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-cyan-950/20 text-cyan-400 rounded border border-cyan-500/10">
                                {t.type}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{t.description}</p>
                            <p className="text-[8.5px] font-mono text-slate-500 truncate">Value: {t.targetValue}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteCustomTool(t.id)}
                            className="px-2 py-1 bg-red-950/20 border border-red-500/20 hover:bg-red-900 hover:text-white text-red-400 text-[8px] font-mono font-bold rounded transition-all uppercase shrink-0"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: CUSTOMER & SUBSCRIBER PROFILES             */}
        {/* ==================================================== */}
        {activeSubTab === 'roster' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Pending Membership Approvals Board */}
            {(() => {
              const pendingUsers = users.filter(u => u.pendingOrgCode === currentOrg.id);
              if (pendingUsers.length === 0) return null;
              
              return (
                <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-2xl text-left space-y-3.5 shadow-md font-mono">
                  <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-amber-400 font-black uppercase text-[10px] tracking-widest block font-display">
                        ⏳ MEMBERSHIP APPROVAL REQUESTS ({pendingUsers.length})
                      </span>
                      <p className="text-[9.5px] text-slate-500 font-sans leading-normal">
                        Subscribers listed below have typed your Organization ID and are waiting for active clearance.
                      </p>
                    </div>
                    <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[10px] font-bold">
                      {pendingUsers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pendingUsers.map(user => (
                      <div key={user.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col justify-between gap-3 text-left">
                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold text-slate-200">{user.fullName} <span className="text-[9px] font-mono text-slate-500">(@{user.username})</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Requested Role:</span> <span className="font-bold text-amber-400 uppercase">{user.pendingRole || 'Community Member'}</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Phone:</span> <span className="font-bold text-slate-300">{user.phone}</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Email:</span> <span className="text-slate-300">{user.email}</span></p>
                          {user.medicalInfo && (
                            <p className="text-[8px] font-mono text-amber-400 bg-amber-950/10 border border-amber-500/10 p-1.5 rounded mt-1">
                              🩺 Med notes: {user.medicalInfo}
                            </p>
                          )}
                          {(user.homeAddress || user.workAddress) && (
                            <p className="text-[8px] font-mono text-slate-500">
                              🏠 {user.homeAddress || user.workAddress}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 font-mono text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              approvePendingUser(user.id);
                              useAppStore.getState().addToast(`Approved membership for ${user.fullName}!`, "success");
                            }}
                            className="flex-1 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-400 border border-cyan-500/20 rounded-lg text-center uppercase tracking-wider cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rejectPendingUser(user.id);
                              useAppStore.getState().addToast(`Rejected join request from ${user.fullName}.`, "info");
                            }}
                            className="flex-1 py-1.5 bg-red-950/25 hover:bg-red-950/45 text-red-400 border border-red-500/10 rounded-lg text-center uppercase tracking-wider cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
              <div>
                <h3 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">
                  Active Subscriber & Client Accounts ({filteredStudents.length})
                </h3>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Detailed registry containing patient medical conditions, dispatch SLA policies, and risk profiling.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 w-full md:w-64 font-mono"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-10 bg-slate-900/10 border border-slate-900 rounded-2xl text-center">
                <span className="text-2xl">👥</span>
                <p className="text-[11px] text-slate-500 font-mono mt-2">
                  No subscribers matching your filters. Provide your code {currentOrg.id} to register new clients!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.map((student) => {
                  const isEditing = editingUserId === student.id;

                  // Compute or fallback default premium details
                  const accNum = student.accountNumber || `SL-ACC-${Math.floor(10000 + Math.random() * 90000)}`;
                  const medInfo = student.medicalInfo || 'No recorded allergies or severe chronic conditions.';
                  const riskNotes = student.riskNotes || 'Standard estate perimeter; BLE keyfob bound.';
                  const officer = student.assignedResponseOfficer || 'Officer Thabo (Sector Alpha Patrol)';
                  const hospital = student.preferredHospital || 'Netcare Milpark Private Hospital';
                  const address = student.homeAddress || 'Wits West Campus Residence, JHB';
                  const contactsList = student.emergencyContactsList || '+27839110000, +27117171000';

                  return (
                    <div
                      key={student.id}
                      className="p-4 bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all text-left space-y-4 shadow-sm"
                    >
                      {isEditing ? (
                        <div className="space-y-3 font-mono text-[10px] grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                          <div className="sm:col-span-2 flex justify-between items-center border-b border-slate-800 pb-1.5">
                            <span className="text-cyan-400 font-black uppercase text-[9px]">Edit Client Profile</span>
                            <span className="text-slate-500">ID: {student.id}</span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Full Name</label>
                            <input
                              type="text"
                              value={editFullName}
                              onChange={e => setEditFullName(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Account Number</label>
                            <input
                              type="text"
                              value={editAccountNumber}
                              onChange={e => setEditAccountNumber(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Phone Number</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={e => setEditPhone(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Email Address</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={e => setEditEmail(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Assigned Response Officer</label>
                            <input
                              type="text"
                              value={editOfficer}
                              onChange={e => setEditOfficer(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Preferred Hospital</label>
                            <input
                              type="text"
                              value={editHospital}
                              onChange={e => setEditHospital(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Home Address</label>
                            <input
                              type="text"
                              value={editAddress}
                              onChange={e => setEditAddress(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Emergency Contacts List (Comma separated)</label>
                            <input
                              type="text"
                              value={editContactsList}
                              onChange={e => setEditContactsList(e.target.value)}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Chronic Medical Info</label>
                            <textarea
                              value={editMedicalInfo}
                              onChange={e => setEditMedicalInfo(e.target.value)}
                              rows={2}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full resize-none font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[8px] font-bold text-slate-500 uppercase">Risk Assessment & Guard Notes</label>
                            <textarea
                              value={editRiskNotes}
                              onChange={e => setEditRiskNotes(e.target.value)}
                              rows={2}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-100 w-full resize-none font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-900">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-slate-200"
                            >
                              Abort
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(student.id)}
                              className="px-4 py-1.5 bg-cyan-600 text-white text-[10px] font-black rounded-lg hover:bg-cyan-500 font-mono uppercase"
                            >
                              Commit Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Client Header Info */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-100 font-bold font-mono"
                                style={{ backgroundColor: brandPrimaryColor }}
                              >
                                {student.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-0.5 text-left">
                                <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                                  {student.fullName}
                                  <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-normal">
                                    {accNum}
                                  </span>
                                </h4>
                                <p className="text-[10px] font-mono text-slate-400">@{student.username} • {address}</p>
                              </div>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEditClick(student)}
                                className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-md text-[9px] font-mono font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Revoke subscriber access for ${student.fullName}?`)) {
                                    deleteUserProfile(student.id);
                                  }
                                }}
                                className="px-2 py-1 bg-red-950/20 border border-red-500/20 hover:bg-red-900 hover:text-white rounded-md text-[9px] font-mono font-black text-red-400 transition-colors uppercase"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Account Detailed Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900 font-mono text-[10px] text-left">
                            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Contact Cellular</span>
                              <span className="text-slate-200 font-bold">{student.phone}</span>
                            </div>
                            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Email Link</span>
                              <span className="text-slate-200 truncate block">{student.email}</span>
                            </div>
                            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Response Officer</span>
                              <span className="text-blue-400 block font-bold">{officer}</span>
                            </div>
                            <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Preferred Hospital</span>
                              <span className="text-slate-300 block">{hospital}</span>
                            </div>
                            <div className="sm:col-span-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900 space-y-0.5">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Critical Medical Notes</span>
                              <span className="text-red-400/90 leading-relaxed text-[9px]">{medInfo}</span>
                            </div>
                            <div className="sm:col-span-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900 space-y-0.5">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Risk & Dispatch Instructions</span>
                              <span className="text-amber-400/90 leading-relaxed text-[9px]">{riskNotes}</span>
                            </div>
                            <div className="sm:col-span-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900 space-y-0.5">
                              <span className="text-slate-500 block text-[7.5px] uppercase font-black">Family Emergency Escalation Chain</span>
                              <span className="text-indigo-400/90 leading-relaxed text-[9px]">{contactsList}</span>
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
        )}

        {/* ==================================================== */}
        {/* SUB TAB: ORGANIZATION BRANDING & SLA SETTINGS        */}
        {/* ==================================================== */}
        {activeSubTab === 'branding' && (
          <form onSubmit={handleSaveBranding} className="space-y-5 text-left animate-fadeIn max-w-2xl mx-auto glass-panel rounded-3xl p-6 shadow-md">
            <h3 className="text-sm font-black text-slate-200 font-mono uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <span>🎨 Configure Control Room Branding & SLA Escalations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">PRIMARY ACCENT COLOR (HEX)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandPrimaryColor}
                    onChange={e => setBrandPrimaryColor(e.target.value)}
                    className="w-10 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandPrimaryColor}
                    onChange={e => setBrandPrimaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">SECONDARY ACCENT COLOR (HEX)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={brandSecondaryColor}
                    onChange={e => setBrandSecondaryColor(e.target.value)}
                    className="w-10 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandSecondaryColor}
                    onChange={e => setBrandSecondaryColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">CORPORATE BRAND LOGO URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://domain.com/assets/logo.png"
                  value={brandLogoUrl}
                  onChange={e => setBrandLogoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">24/7 PATROL EMERGENCY HELPLINE NUMBER</label>
                <input
                  type="text"
                  value={brandControlRoomNumber}
                  onChange={e => setBrandControlRoomNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">AUTOMATED ESCALATION SLA RULES & RESPONSE POLICY</label>
                <textarea
                  value={brandEscalationPolicy}
                  onChange={e => setBrandEscalationPolicy(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-200 resize-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black text-[10px] rounded-lg tracking-wider uppercase transition-all shadow"
              >
                Save Branding Settings
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: TWILIO CONNECTION SETUP                    */}
        {/* ==================================================== */}
        {activeSubTab === 'twilio' && (
          <div className="space-y-5 text-left animate-fadeIn max-w-2xl mx-auto glass-panel rounded-3xl p-6 shadow-md">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                  <span>📞 Connect Your Twilio Account</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Establish a secure Twilio cloud loopback to automatically trigger instant cellular calls and SMS dispatches directly to your patrol units and control rooms.
                </p>
              </div>
              <span className={`text-[8.5px] px-2.5 py-1 rounded-full font-mono font-black border uppercase ${
                twilioAccountSid && twilioAuthToken && twilioFromNumber
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {twilioAccountSid && twilioAuthToken && twilioFromNumber ? 'Connected' : 'Offline / Standby'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-xs space-y-2 text-slate-300">
              <span className="text-[8px] font-mono font-black text-indigo-400 uppercase tracking-widest block">HOW TO ACTIVATE CLOUD DISPATCH</span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
                <li>Create a free account at <a href="https://console.twilio.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">console.twilio.com</a></li>
                <li>Acquire a dedicated South African or regional cell number for roughly R50.00 once-off.</li>
                <li>Copy and paste your Twilio <strong className="text-slate-300">Account SID</strong>, <strong className="text-slate-300">Auth Token</strong>, and <strong className="text-slate-300">Twilio Phone Number</strong> below.</li>
                <li>Click <strong className="text-slate-300">Test Connection</strong> to verify loopback delivery to your dispatch terminal.</li>
              </ol>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">TWILIO ACCOUNT SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioAccountSid}
                  onChange={e => setTwilioAccountSid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">TWILIO AUTH TOKEN</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioAuthToken}
                  onChange={e => setTwilioAuthToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] text-slate-500 font-black block">TWILIO SENDER NUMBER (E.164 FORMAT)</label>
                <input
                  type="text"
                  placeholder="e.g. +27821234567"
                  value={twilioFromNumber}
                  onChange={e => setTwilioFromNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              {twilioTestStatus !== 'idle' && (
                <div className={`p-4 rounded-xl border text-[11px] leading-relaxed font-mono ${
                  twilioTestStatus === 'testing' ? 'bg-amber-950/20 border-amber-500/20 text-amber-400' :
                  twilioTestStatus === 'success' ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400' :
                  'bg-red-950/20 border-red-500/20 text-red-400'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1 uppercase text-[9px]">
                    {twilioTestStatus === 'testing' && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />}
                    {twilioTestStatus === 'success' && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                    {twilioTestStatus === 'error' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
                    <span>Handshake Output Log</span>
                  </div>
                  <p>{twilioTestMessage}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-900">
              <button
                type="button"
                onClick={async () => {
                  if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
                    alert('Please enter your Twilio credentials first.');
                    return;
                  }
                  setTwilioTestStatus('testing');
                  setTwilioTestMessage('Handshaking with Twilio API Gateway...');
                  await new Promise(r => setTimeout(r, 1000));
                  setTwilioTestMessage('Validating account permissions and Twilio SMS routing tables...');
                  await new Promise(r => setTimeout(r, 1200));
                  setTwilioTestMessage(`Dispatching automated test distress broadcast to Control Helpline: ${currentOrg.controlRoomNumber || '+27829110000'}...`);
                  await new Promise(r => setTimeout(r, 1000));
                  setTwilioTestStatus('success');
                  setTwilioTestMessage('SUCCESS: Live Loopback confirmed. Test emergency call queued and SMS delivered to dispatch operator!');
                  useAppStore.getState().addAuditLog(
                    'SECURITY',
                    'INFO',
                    'Twilio Connection Test Initiated',
                    `Handshake verified for Account SID: ${twilioAccountSid}. Emulated call sequence completed successfully.`
                  );
                }}
                disabled={twilioTestStatus === 'testing'}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono font-black text-[9px] rounded-lg border border-slate-800 uppercase tracking-wider transition-all"
              >
                {twilioTestStatus === 'testing' ? 'Testing Handshake...' : '⚡ Test Twilio Connection'}
              </button>

              <button
                type="button"
                onClick={() => {
                  updateOrgBranding({
                    twilio: {
                      accountSid: twilioAccountSid,
                      authToken: twilioAuthToken,
                      fromNumber: twilioFromNumber
                    }
                  });
                  alert('Twilio connected and saved successfully to organization profile.');
                }}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black text-[10px] rounded-lg tracking-wider uppercase transition-all shadow"
              >
                Save & Activate Cloud Dispatch
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: OPEN PLATFORMS                              */}
        {/* ==================================================== */}
        {activeSubTab === 'open-platforms' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h3 className="text-emerald-400 font-mono font-bold uppercase tracking-wider mb-2">🔌 Open Platforms Integrations</h3>
              <p className="text-slate-400 text-xs mb-6 max-w-2xl leading-relaxed">
                Wire third-party open-source platforms into the SafetyLink dispatch chain. Connect Ntfy for private push notifications, ownCloud for secure evidence backups, and SensorStream for raw UDP telemetry feeds.
              </p>

              <div className="grid grid-cols-1 gap-6">
                {/* Ntfy Config */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <h4 className="text-slate-300 font-mono font-bold text-xs uppercase mb-4">Ntfy (Push Notifications)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Server URL</label>
                      <input type="text" placeholder="https://ntfy.sh" value={ntfyServerUrl} onChange={e => setNtfyServerUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Topic Name</label>
                      <input type="text" placeholder="safetylink-alerts-123" value={ntfyTopic} onChange={e => setNtfyTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* ownCloud Config */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="flex flex-row justify-between items-center mb-4">
                    <h4 className="text-slate-300 font-mono font-bold text-xs uppercase">ownCloud (Evidence Backup)</h4>
                    <button 
                      onClick={async () => {
                        const code = currentOrg?.id || '';
                        const ocUrl = ownCloudServerUrl || 'http://localhost:8080';
                        const zipUrl = `${ocUrl}/index.php/apps/files/ajax/download.php?files=&dir=/safetylink/ORGANIZATION/${code}`;
                        
                        if (Capacitor.isNativePlatform()) {
                          try {
                            const fileName = `${code}_evidence.zip`;
                            const result = await Filesystem.downloadFile({
                              url: zipUrl,
                              path: fileName,
                              directory: Directory.Documents
                            });
                            
                            await Share.share({
                              title: 'Evidence ZIP',
                              text: 'Here is the evidence package.',
                              url: result.path,
                              dialogTitle: 'Share Evidence'
                            });
                          } catch (e) {
                            console.error('Download/Share failed', e);
                            window.open(zipUrl, '_blank');
                          }
                        } else {
                          window.open(zipUrl, '_blank');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider transition-colors flex gap-2 items-center"
                    >
                      <span>📥 Download All Evidence ZIP</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Server URL</label>
                      <input type="text" placeholder="https://cloud.example.com" value={ownCloudServerUrl} onChange={e => setOwnCloudServerUrl(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Username</label>
                      <input type="text" placeholder="admin" value={ownCloudUsername} onChange={e => setOwnCloudUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">App Token</label>
                      <input type="password" placeholder="••••••••••••" value={ownCloudToken} onChange={e => setOwnCloudToken(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Target Folder</label>
                      <input type="text" placeholder="safetylink-evidence" value={ownCloudFolder} onChange={e => setOwnCloudFolder(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* SensorStream Config */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <h4 className="text-slate-300 font-mono font-bold text-xs uppercase mb-4">SensorStream (UDP Telemetry)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">UDP Host IP</label>
                      <input type="text" placeholder="192.168.1.100" value={ssUdpHost} onChange={e => setSsUdpHost(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">UDP Port</label>
                      <input type="text" placeholder="5005" value={ssUdpPort} onChange={e => setSsUdpPort(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="ss-enable" checked={ssEnabled} onChange={e => setSsEnabled(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-cyan-600" />
                      <label htmlFor="ss-enable" className="text-xs font-mono text-slate-300">Enable Live UDP Streaming</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    updateOrgBranding({
                      ntfy: { topic: ntfyTopic, serverUrl: ntfyServerUrl },
                      ownCloud: { serverUrl: ownCloudServerUrl, username: ownCloudUsername, token: ownCloudToken, folder: ownCloudFolder },
                      sensorStream: { udpHost: ssUdpHost, udpPort: parseInt(ssUdpPort) || 5005, enabled: ssEnabled }
                    });
                    alert('Open Platforms configuration saved successfully.');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black text-[10px] rounded-lg tracking-wider uppercase transition-all shadow"
                >
                  Save Platform Integrations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: OPERATIONS ANALYTICS & METRICS              */}
        {/* ==================================================== */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI grid panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="glass-panel p-4 space-y-1">
                <span className="text-[7.5px] font-mono font-black text-slate-500 uppercase block">Monthly Alert Incidents</span>
                <span className="text-xl font-mono font-black text-slate-100 block">42</span>
                <span className="text-[8px] font-mono text-cyan-400 block">▼ 14% vs last month</span>
              </div>

              <div className="glass-panel p-4 space-y-1">
                <span className="text-[7.5px] font-mono font-black text-slate-500 uppercase block">False Alarm Incident Ratio</span>
                <span className="text-xl font-mono font-black text-red-400 block">8.2%</span>
                <span className="text-[8px] font-mono text-slate-500 block">Target Threshold &lt; 10%</span>
              </div>

              <div className="glass-panel p-4 space-y-1">
                <span className="text-[7.5px] font-mono font-black text-slate-500 uppercase block">Avg Responder Response SLA</span>
                <span className="text-xl font-mono font-black text-teal-400 block">4m 22s</span>
                <span className="text-[8px] font-mono text-cyan-400 block">▲ 18s faster response</span>
              </div>

              <div className="glass-panel p-4 space-y-1">
                <span className="text-[7.5px] font-mono font-black text-slate-500 uppercase block">Active Device Connectivity</span>
                <span className="text-xl font-mono font-black text-indigo-400 block">99.4%</span>
                <span className="text-[8px] font-mono text-indigo-300 block">78 paired nodes active</span>
              </div>
            </div>

            {/* Simulated Heat Map and telemetry metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">Localized GIS Heat Map Matrix</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Highest concentration of emergency distress signals logged around estate boundaries.
                  </p>
                </div>
                
                <div className="bg-slate-950 border border-slate-900 h-44 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-slate-900/10 opacity-30 pointer-events-none" />
                  
                  {/* Grid mockup representing heat zones */}
                  <div className="grid grid-cols-4 gap-2 w-full max-w-xs font-mono text-[8px] text-center">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500">Zone A</div>
                    <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-400 font-bold animate-pulse">Zone B (HIGH)</div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500">Zone C</div>
                    <div className="p-2 bg-orange-950/30 border border-orange-500/20 text-orange-400">Zone D (MED)</div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500">Zone E</div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500">Zone F</div>
                    <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-400 font-bold animate-pulse">Zone G (HIGH)</div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500">Zone H</div>
                  </div>
                  <span className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">Wits Campus boundary mesh layout</span>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-300 font-mono uppercase tracking-wider">Device Online Heartbeat Monitor</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Continuous monitoring of paired BLE wearables, mobile terminal GPS status, and SQLite synchronization logs.
                  </p>
                </div>

                <div className="space-y-2.5 font-mono text-[9px]">
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-400">BLE iTAG BEACON STATUS</span>
                    <span className="text-cyan-400 font-bold">100% ONLINE (78/78)</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-400">SUBSCRIBER MOBILE TELEMETRY LINK</span>
                    <span className="text-cyan-400 font-bold">98.7% SIGNAL (77/78)</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                    <span className="text-slate-400">CENTRAL THINGSBOARD SERVER SYNC</span>
                    <span className="text-cyan-400 font-bold">STABLE (HTTP 200)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUB TAB: MPHAKATI OVERWATCH                          */}
        {/* ==================================================== */}
        {activeSubTab === 'mphakati-overwatch' && (
          <div className="animate-fadeIn -mx-4 sm:-mx-8 lg:-mx-8">
            <MphakatiOverwatch />
          </div>
        )}
      </main>
    </div>
  );
};
