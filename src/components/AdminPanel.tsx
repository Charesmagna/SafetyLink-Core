import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore, ADMIN_ORG_CODE } from '../utils/store';
import { UserProfile, Organization } from '../types';
import { sendTestEvent } from '../services/ThingsBoardService';
import { LogoSetPart } from './LogoSetPart';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../utils/cloudinary';
import { EvidenceLedger } from './EvidenceLedger';
import { FleetMonitor } from './FleetMonitor';
import { EditorialStudio } from './editorial/EditorialStudio';
import { useEditorialStore } from '../utils/editorialStore';
import { ClientDatabaseModule } from './ClientDatabaseModule';
import { MediaHub } from './MediaHub';
import { getR2StreamUrl } from '../utils/r2Assets';

const slide1 = getR2StreamUrl('Random platform background.png');
const slide2 = getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png');
const slide3 = getR2StreamUrl('IMG_20260914_221811.png');
const slide4 = getR2StreamUrl('Polish_20260914_220631067.png');
const slide5 = getR2StreamUrl('IMG_20260914_223311.png');
const newBg1 = getR2StreamUrl('Emergency_Mesh_Platform_Overview.png');
const newLogo1 = getR2StreamUrl('IMG_20260914_223547.png');

type AdminTab = 'OVERVIEW' | 'USERS' | 'CLIENTS' | 'R2_MEDIA' | 'ORGANIZATIONS' | 'PANICS' | 'SETTINGS' | 'ADVANCED_ROLES' | 'EVIDENCE' | 'FLEET' | 'EDITORIAL';

export const AdminPanel: React.FC = () => {
  const [showEditorialStudio, setShowEditorialStudio] = useState(false);
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
    customBackendUrl,
    setCustomBackendUrl,
    approveOrganization,
    customTools,
    addCustomTool,
    deleteCustomTool,
    adminUpdateSubscription,
    exportToGoogleDrive,
    refreshClientDatabase,
    addToast
  } = useAppStore();

  const userCountsByOrg = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      if (u.orgCode) {
        counts[u.orgCode] = (counts[u.orgCode] || 0) + 1;
      }
    });
    return counts;
  }, [users]);



  // Background slideshow logic
  const adminSlides = [newBg1, newLogo1, slide3, slide4, slide5, slide1, slide2];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [backendUrlInput, setBackendUrlInput] = useState(customBackendUrl);

  useEffect(() => {
    useAppStore.getState().fetchSuperAdminData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adminSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [adminSlides.length]);

  const [tbTokenInput, setTbTokenInput] = useState(thingsBoardToken);
  const [tbTestStatus, setTbTestStatus] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle');
  
  // OTA Release state
  const [githubToken, setGithubToken] = useState('');
  const [releaseStatus, setReleaseStatus] = useState<'idle' | 'triggering' | 'ok' | 'fail'>('idle');

  const triggerRelease = async () => {
    if (!githubToken) return;
    setReleaseStatus('triggering');
    try {
      const workflows = ['build-apk.yml', 'build-electron.yml', 'deploy-safetylink-web.yml'];
      let allOk = true;
      for (const wf of workflows) {
        const res = await fetch(`https://api.github.com/repos/Charesmagna/SafetyLink-Core/actions/workflows/${wf}/dispatches`, {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ref: 'main' })
        });
        if (!res.ok) {
          allOk = false;
        }
      }
      setReleaseStatus(allOk ? 'ok' : 'fail');
      addAuditLog('SYSTEM', allOk ? 'INFO' : 'WARN', allOk ? 'OTA Release Workflows Triggered' : 'OTA Release Workflows Failed', '');
      setTimeout(() => setReleaseStatus('idle'), 5000);
    } catch (err) {
      setReleaseStatus('fail');
      setTimeout(() => setReleaseStatus('idle'), 5000);
    }
  };

  // External Credentials Status state
  const [credsStatus, setCredsStatus] = useState<any>(null);
  const [checkingCreds, setCheckingCreds] = useState(false);

  const runCredsAudit = async () => {
    setCheckingCreds(true);
    try {
      const res = await fetch('/api/system/credentials-status');
      if (res.ok) {
        const data = await res.json();
        setCredsStatus(data);
      }
    } catch (err) {
      console.error('Failed to run credentials audit:', err);
    } finally {
      setCheckingCreds(false);
    }
  };

  useEffect(() => {
    runCredsAudit();
  }, []);

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  const activePanicEventsCount = useMemo(() => panicEvents.filter(p => p.status !== 'RESOLVED').length, [panicEvents]);
  const globalCustomTools = useMemo(() => customTools.filter(t => !t.targetOrgId), [customTools]);
  const pendingOrgs = useMemo(() => organizations.filter(o => o.approved === false), [organizations]);
  const approvedOrgs = useMemo(() => organizations.filter(o => o.approved !== false), [organizations]);

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
  const [editUserLiveSms, setEditUserLiveSms] = useState(false);
  const [editUserCanUseAdminTwilio, setEditUserCanUseAdminTwilio] = useState(false);

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
    setEditUserLiveSms(u.liveSmsEnabled ?? false);
    setEditUserCanUseAdminTwilio(u.canUseAdminTwilio ?? false);
  };

  const handleSaveUser = (id: string) => {
    updateUserProfile(id, {
      fullName: editUserFullName,
      phone: editUserPhone,
      email: editUserEmail,
      orgCode: editUserOrgCode,
      liveSmsEnabled: editUserLiveSms,
      canUseAdminTwilio: editUserCanUseAdminTwilio
    });
    setEditingUserId(null);
    addAuditLog('SECURITY', 'INFO', `Admin updated user record ${id}`);
  };

  // User Stats & Google Drive Export
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [viewingUserDossier, setViewingUserDossier] = useState<UserProfile | null>(null);
  const [driveSyncSuccessInfo, setDriveSyncSuccessInfo] = useState<{ fileId: string; fileUrl: string; syncedAt: string; count: number } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editorialTargetPlatform, setEditorialTargetPlatform] = useState<'web' | 'apk' | 'exe'>('web');

  // Inline Editorial Store bindings
  const {
    version: studioVersion,
    web: editorialWeb,
    apk: editorialApk,
    exe: editorialExe,
    updateField: updateEditorialField,
    saveDraft: saveEditorialDraft,
    publishLive: publishEditorialLive,
    resetToDefaults: resetEditorialDefaults,
    isSaving: isEditorialSaving,
    isPublishing: isEditorialPublishing
  } = useEditorialStore();

  const handleDownloadCsv = () => {
    const headers = 'ID,Full Name,Username,Phone,WhatsApp,Email,Org Code,Org Name,Role,Status,Registration Date,Home Address,Work Address,Preferred Hospital,Medical Notes,Emergency Contacts,Live SMS Enabled\n';
    const rows = users.map(u => {
      const uOrg = organizations.find(o => o.id === u.orgCode);
      const orgName = uOrg ? uOrg.name : (u.orgCode ? u.orgCode : 'Independent');
      return `"${u.id}","${(u.fullName || '').replace(/"/g, '""')}","${(u.username || '').replace(/"/g, '""')}","${(u.phone || '').replace(/"/g, '""')}","${(u.whatsapp || u.phone || '').replace(/"/g, '""')}","${(u.email || '').replace(/"/g, '""')}","${(u.orgCode || 'None').replace(/"/g, '""')}","${orgName.replace(/"/g, '""')}","${(u.role || 'Community Member').replace(/"/g, '""')}","${(u.subscriptionStatus || 'active').replace(/"/g, '""')}","${new Date(u.createdAt).toISOString()}","${(u.homeAddress || '').replace(/"/g, '""')}","${(u.workAddress || '').replace(/"/g, '""')}","${(u.preferredHospital || '').replace(/"/g, '""')}","${(u.medicalInfo || '').replace(/"/g, '""')}","${(u.emergencyContactsList || '').replace(/"/g, '""')}","${u.liveSmsEnabled ? 'YES' : 'NO'}"`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SafetyLink_Users_Master_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Master user roster CSV (${users.length} users) downloaded successfully.`, 'success');
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SafetyLink_Users_Master_Registry_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast(`Exported ${users.length} user records to JSON archive.`, 'success');
  };

  const handlePrintRoster = () => {
    window.print();
  };

  const handleDriveSync = async () => {
    setIsSyncingDrive(true);
    try {
      await refreshClientDatabase();
      const res = await exportToGoogleDrive();
      if (res.success) {
        setDriveSyncSuccessInfo({
          fileId: res.fileId || `SL_DRIVE_ROSTER_${Date.now()}`,
          fileUrl: res.fileUrl || `https://drive.google.com/file/d/${res.fileId}/view`,
          syncedAt: new Date().toLocaleTimeString(),
          count: users.length
        });
        addToast(`Master user document saved to Google Drive (Doc ID: ${res.fileId?.slice(-8)})`, 'success');
      } else {
        addToast(res.error || 'Google Drive sync failed', 'error');
      }
    } catch (err: any) {
      addToast('Drive sync error: ' + err.message, 'error');
    } finally {
      setIsSyncingDrive(false);
    }
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
      <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-blue-600 text-white font-mono text-[10px] font-bold text-center py-2 px-4 tracking-wider uppercase flex items-center justify-center gap-2 relative z-50 shadow-md">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
        <span>🔒 SECURED CORE ADMINISTRATIVE INTERACTION PROTOCOL LOCKED 🔒</span>
      </div>

      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-900 py-4 px-6 flex justify-between items-center shadow-lg relative z-10">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60" />
        <div className="flex items-center gap-3 text-left">
          <LogoSetPart part="badge" size={44} rounded="xl" />
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-100 uppercase font-mono">
              SL Global Command
            </h1>
            <p className="text-[10px] text-amber-400 font-mono uppercase tracking-widest font-black">
              System Admin ({ADMIN_ORG_CODE.toUpperCase()}) // <span className="text-amber-500/80 font-black">POWERED BY TM MEDIA SOLUTIONS</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditorialStudio(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-full shadow-lg shadow-amber-950/40 border border-amber-400/40 transition-all cursor-pointer"
          >
            <span>🎨 EDIT ENVIRONMENT</span>
          </button>

          <button
            onClick={logout}
            className="px-4 py-1.5 bg-amber-900/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 hover:text-white transition-colors text-[10px] font-mono font-bold rounded-full"
          >
            SIGNOUT SECURE LINK
          </button>
        </div>
      </header>

      {/* Admin Nav Bar */}
      <nav className="bg-slate-900/50 border-b border-slate-900 flex p-1 justify-start gap-1 overflow-x-auto relative z-10">
        {(['OVERVIEW', 'EDITORIAL', 'USERS', 'CLIENTS', 'R2_MEDIA', 'ORGANIZATIONS', 'PANICS', 'FLEET', 'SETTINGS', 'ADVANCED_ROLES'] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchTerm('');
            }}
            className={`px-4.5 py-2.5 text-[10px] font-mono font-bold tracking-wider rounded-xl uppercase transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'EDITORIAL' ? '🎨 edit environment (studio)' :
             tab === 'PANICS' ? '🚨 distress signals' :
             tab === 'ORGANIZATIONS' ? '🏢 organizations' :
             tab === 'USERS' ? '👥 registered users' :
             tab === 'CLIENTS' ? '📁 client database & drive' :
             tab === 'R2_MEDIA' ? '🎬 r2 media & evidence (138)' :
             tab === 'FLEET' ? '📱 device fleet & updates' :
             tab === 'SETTINGS' ? '⚙️ tools & settings' :
             tab === 'ADVANCED_ROLES' ? '🛡️ security roles' :
             '📊 overview'}
          </button>
        ))}
      </nav>

      {/* Editorial Studio Overlay */}
      {showEditorialStudio && (
        <EditorialStudio onClose={() => setShowEditorialStudio(false)} />
      )}

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto min-h-0 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-fadeIn text-left">
            
            {/* Platform Studio Visual Customizer Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-red-950/30 border border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                  🎨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                      Platform Environment Studio (Wix / Sitey-Style)
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold">
                      READY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Visual drag-and-drop platform editor. Interactively modify text, hero banners, theme colors, and section structures for <strong>SafetyLink.online</strong>, <strong>Android APK</strong>, and <strong>Desktop EXE</strong>, then push live OTA updates to all connected users.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditorialStudio(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
              >
                <span>🚀 Launch Visual Editor</span>
              </button>
            </div>

            {/* CI/CD Build Status */}
            <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-emerald-500 text-xl">
                  <i className="fa-brands fa-github"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Pipeline Status: SafetyLink Core</h3>
                  <p className="text-xs text-slate-400 mt-1">Live tracking of GitHub Actions CI/CD deployment pipeline.</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <a href="https://github.com/Charesmagna/SafetyLink-Core/actions" target="_blank" rel="noreferrer">
                  <img src="https://github.com/Charesmagna/SafetyLink-Core/actions/workflows/build-apk.yml/badge.svg" alt="Build APK Status" className="h-5" />
                </a>
                <a href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest" target="_blank" rel="noreferrer" className="text-[10px] font-mono text-amber-500 hover:text-amber-400 hover:underline">
                  Download Latest Artifact →
                </a>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Total Residents / Users</span>
                <span className="text-2xl font-black font-mono text-slate-100">{users.length}</span>
                <p className="text-[9px] text-slate-400">Offline keyfob enabled</p>
              </div>

              <div className="glass-panel p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Organizations</span>
                <span className="text-2xl font-black font-mono text-slate-100">{organizations.length}</span>
                <p className="text-[9px] text-slate-400">University residences & sites</p>
              </div>

              <div className="glass-panel p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Active Alerts</span>
                <span className={`text-2xl font-black font-mono ${activePanicEventsCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                  {activePanicEventsCount}
                </span>
                <p className="text-[9px] text-slate-400">Real-time GPS tracking</p>
              </div>

              <div className="glass-panel p-5 space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">System Health</span>
                <span className="text-2xl font-black font-mono text-emerald-400">100%</span>
                <p className="text-[9px] text-slate-400">Firebase stack connected</p>
              </div>
            </div>

            {/* Quick Info / Guide Card */}
            <div className="glass-panel p-6 flex items-start gap-4">
              <span className="text-2xl">🛡️</span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">SafetyLink Master Node Administration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Welcome back, Global Administrator. You have full edit/delete privileges for all registered residents, students, security personnel, and organization profiles database-wide. To simulate student distress events, trigger an SOS on a user session, then check the distress signals feed.
                </p>
              </div>
            </div>

            {/* IoT Dashboard Integration */}
            <div className="glass-panel p-6 space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-200">IoT Dashboard Integration</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Every real (non-drill) SOS trigger pushes incident telemetry to your IoT Dashboard,
                  giving org-wide visibility on your dashboard. Paste your device access token below --
                  it's stored only on this device, never committed to the repo.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={tbTokenInput}
                  onChange={(e) => setTbTokenInput(e.target.value)}
                  placeholder="IoT Device Access Token"
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
                    addAuditLog('SYSTEM', ok ? 'INFO' : 'WARN', ok ? 'IoT test event sent' : 'IoT test event failed', '');
                  }}
                  className="px-4 py-2 text-[10px] font-mono font-bold rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors whitespace-nowrap"
                >
                  {tbTestStatus === 'sending' ? 'SENDING...' : 'SEND TEST EVENT'}
                </button>
              </div>
              {tbTestStatus === 'ok' && <p className="text-[10px] text-emerald-400 font-mono">✓ Delivered -- check the Latest Telemetry tab on your IoT Dashboard.</p>}
              {tbTestStatus === 'fail' && <p className="text-[10px] text-red-400 font-mono">✗ Failed to reach IoT Dashboard. Check the token and your connection.</p>}
            </div>

            {/* OTA Release Management */}
            <div className="glass-panel p-6 space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Over-The-Air (OTA) Release Management</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Trigger the GitHub Actions workflows to build and publish a new release of SafetyLink (APK, EXE, and Web).
                  Requires a GitHub Personal Access Token with repo workflow permissions.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="GitHub Personal Access Token (PAT)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600"
                />
                <button
                  disabled={!githubToken || releaseStatus === 'triggering'}
                  onClick={triggerRelease}
                  className="px-4 py-2 text-[10px] font-mono font-bold rounded-xl bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-colors whitespace-nowrap"
                >
                  {releaseStatus === 'triggering' ? 'TRIGGERING...' : 'PUBLISH RELEASE'}
                </button>
              </div>
              {releaseStatus === 'ok' && <p className="text-[10px] text-emerald-400 font-mono">✓ Workflows triggered successfully. Check the GitHub Actions tab.</p>}
              {releaseStatus === 'fail' && <p className="text-[10px] text-red-400 font-mono">✗ Failed to trigger workflows. Ensure your PAT has the correct permissions.</p>}
            </div>

            {/* Recent Activity Logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                System Administrative Audit Trails
              </h3>
              <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-4 h-64 overflow-y-auto font-mono text-[10px] space-y-2.5">
                {users.map((u, i) => (
                  <div key={i} className="border-b border-slate-900/40 pb-2 last:border-0 text-slate-400">
                    <span className="text-slate-500">[{new Date(u.createdAt).toLocaleTimeString()}]</span> USER_REGISTRY: Resident <span className="text-amber-400">@{u.username}</span> registered under organization <span className="text-blue-400">{u.orgCode || 'Independent Node'}</span>.
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

        {/* TAB: EDITORIAL STUDIO & ENVIRONMENT DESIGN */}
        {activeTab === 'EDITORIAL' && (
          <div className="space-y-6 animate-fadeIn text-left">
            {/* Top Overview & Launch Canvas Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-red-950/30 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  <h2 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                    Platform Environment Studio (Multi-Target CMS)
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold">
                    v{studioVersion} LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Interactively modify headlines, banners, tactical colors, and emergency copy across <strong>SafetyLink.online</strong>, <strong>Android APK</strong>, and <strong>Command Desktop EXE</strong>, then deploy live OTA updates directly to all devices.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await saveEditorialDraft();
                    if (ok) addToast('Editorial draft saved successfully.', 'success');
                  }}
                  disabled={isEditorialSaving}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-bold transition-all"
                >
                  {isEditorialSaving ? 'Saving...' : '💾 Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await publishEditorialLive(`Platform update v${studioVersion}`);
                    if (res.success) addToast(`Published live to version v${res.version}`, 'success');
                  }}
                  disabled={isEditorialPublishing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all cursor-pointer"
                >
                  {isEditorialPublishing ? 'Deploying...' : '🚀 Publish Live (OTA)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditorialStudio(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-950 cursor-pointer"
                >
                  <span>🖥️ Open Fullscreen Canvas</span>
                </button>
              </div>
            </div>

            {/* Target Platform Selector */}
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mr-2">Target Environment:</span>
              {[
                { id: 'web', name: '🌐 SafetyLink.online (Web)', desc: 'Official Public Gateway' },
                { id: 'apk', name: '📱 Mobile APK (Android)', desc: 'Field & Student Devices' },
                { id: 'exe', name: '💻 Command War Room (EXE)', desc: 'Dispatcher Desktop' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditorialTargetPlatform(p.id as any)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                    editorialTargetPlatform === p.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Platform Editing Forms */}
            {editorialTargetPlatform === 'web' && (
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black font-mono text-slate-200 uppercase tracking-wider">
                    🌐 Web Platform Content Editor (safetylink.online)
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400">STATUS: PRODUCTION ACTIVE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Hero Badge Tagline</label>
                    <input
                      type="text"
                      value={editorialWeb.heroBadge}
                      onChange={e => updateEditorialField('web', 'heroBadge', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Primary Title 1</label>
                    <input
                      type="text"
                      value={editorialWeb.heroTitle1}
                      onChange={e => updateEditorialField('web', 'heroTitle1', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Secondary Title 2</label>
                    <input
                      type="text"
                      value={editorialWeb.heroTitle2}
                      onChange={e => updateEditorialField('web', 'heroTitle2', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Hotline Emergency Phone</label>
                    <input
                      type="text"
                      value={editorialWeb.hotlinePhone}
                      onChange={e => updateEditorialField('web', 'hotlinePhone', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Mission Subtitle</label>
                    <textarea
                      rows={2}
                      value={editorialWeb.heroSubtitle}
                      onChange={e => updateEditorialField('web', 'heroSubtitle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Primary Action Button (CTA)</label>
                    <input
                      type="text"
                      value={editorialWeb.heroCtaPrimary}
                      onChange={e => updateEditorialField('web', 'heroCtaPrimary', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Tactical Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editorialWeb.primaryColor}
                        onChange={e => updateEditorialField('web', 'primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editorialWeb.primaryColor}
                        onChange={e => updateEditorialField('web', 'primaryColor', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editorialTargetPlatform === 'apk' && (
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black font-mono text-slate-200 uppercase tracking-wider">
                    📱 Android APK Field Client Editor
                  </h3>
                  <span className="text-[10px] font-mono text-amber-400">BUILD: R8 PROGUARD HARDENED</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Application Header Name</label>
                    <input
                      type="text"
                      value={editorialApk.appName}
                      onChange={e => updateEditorialField('apk', 'appName', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Status Perimeter Tag</label>
                    <input
                      type="text"
                      value={editorialApk.statusTag}
                      onChange={e => updateEditorialField('apk', 'statusTag', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Emergency SOS Button Label</label>
                    <input
                      type="text"
                      value={editorialApk.sosButtonText}
                      onChange={e => updateEditorialField('apk', 'sosButtonText', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Hardware BLE Keyfob Tag</label>
                    <input
                      type="text"
                      value={editorialApk.bleStatusText}
                      onChange={e => updateEditorialField('apk', 'bleStatusText', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Carrier Offline Fallback Notice</label>
                    <input
                      type="text"
                      value={editorialApk.offlineFallbackNotice}
                      onChange={e => updateEditorialField('apk', 'offlineFallbackNotice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {editorialTargetPlatform === 'exe' && (
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <div className="border-b border-slate-900 pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-black font-mono text-slate-200 uppercase tracking-wider">
                    💻 Desktop War Room Command Console (EXE)
                  </h3>
                  <span className="text-[10px] font-mono text-blue-400">MULTI-MONITOR MATRIX</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Command Window Title</label>
                    <input
                      type="text"
                      value={editorialExe.windowTitle}
                      onChange={e => updateEditorialField('exe', 'windowTitle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Dispatch Header</label>
                    <input
                      type="text"
                      value={editorialExe.dispatchHeader}
                      onChange={e => updateEditorialField('exe', 'dispatchHeader', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Threat Level Banner</label>
                    <input
                      type="text"
                      value={editorialExe.threatLevelLabel}
                      onChange={e => updateEditorialField('exe', 'threatLevelLabel', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Evidence Ledger Vault Title</label>
                    <input
                      type="text"
                      value={editorialExe.evidenceLedgerTitle}
                      onChange={e => updateEditorialField('exe', 'evidenceLedgerTitle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: USERS MASTER STATISTICS & REGISTRY HUB */}
        {activeTab === 'USERS' && (
          <div className="space-y-6 animate-fadeIn text-left">
            {/* Top Header & Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-100 font-mono uppercase tracking-wider">
                    Master User Registry & Telemetry Statistics
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                    {users.length} REGISTERED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Complete official administrative roster of all registered campus students, security operators, and community citizens with full medical & contact records.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                  title="Download complete RFC 4180 CSV with all registration information"
                >
                  <span>📥 Download CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer"
                  title="Download raw machine-readable JSON backup"
                >
                  <span>📄 JSON Backup</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintRoster}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer"
                  title="Print official dossier report"
                >
                  <span>🖨️ Print Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={handleDriveSync}
                  disabled={isSyncingDrive}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-blue-950/40 transition-all cursor-pointer disabled:opacity-50"
                  title="Synchronize and save roster document directly to Google Drive"
                >
                  <span>☁️ {isSyncingDrive ? 'Syncing Drive...' : 'Save to Google Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    useAppStore.getState().fetchSuperAdminData();
                    refreshClientDatabase();
                    addToast('Registry refreshed from central database.', 'info');
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  title="Refresh User Registry"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Google Drive Sync Receipt Banner */}
            {driveSyncSuccessInfo && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl text-emerald-400 shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-emerald-300 uppercase">
                        Master Document Saved to Google Drive
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        ({driveSyncSuccessInfo.count} records at {driveSyncSuccessInfo.syncedAt})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      Document ID: <strong className="text-white">{driveSyncSuccessInfo.fileId}</strong> • Archived in Google Drive cloud storage.
                    </p>
                  </div>
                </div>

                <a
                  href={driveSyncSuccessInfo.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider shrink-0 shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>🔗 View in Google Drive</span>
                </a>
              </div>
            )}

            {/* User Registry Statistics KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-amber-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Total Users</span>
                <span className="text-lg font-black font-mono text-amber-400 block">{users.length}</span>
                <span className="text-[8px] font-mono text-slate-500 block">100% On-Record</span>
              </div>

              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-blue-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Node Members</span>
                <span className="text-lg font-black font-mono text-blue-400 block">
                  {users.filter(u => Boolean(u.orgCode)).length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block">Bound to Residence</span>
              </div>

              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-purple-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Independent Mesh</span>
                <span className="text-lg font-black font-mono text-purple-400 block">
                  {users.filter(u => !u.orgCode).length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block">Private Citizens</span>
              </div>

              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-emerald-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Active Licenses</span>
                <span className="text-lg font-black font-mono text-emerald-400 block">
                  {users.filter(u => u.subscriptionStatus === 'active' || !u.subscriptionStatus).length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block">Covered & Armed</span>
              </div>

              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-red-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Medical Dossiers</span>
                <span className="text-lg font-black font-mono text-red-400 block">
                  {users.filter(u => Boolean(u.medicalInfo || u.preferredHospital || u.medicalProfile)).length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block">Trauma Info Logged</span>
              </div>

              <div className="p-3.5 glass-panel rounded-2xl space-y-1 border-l-2 border-l-teal-500">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase block font-bold">Live SMS Relays</span>
                <span className="text-lg font-black font-mono text-teal-400 block">
                  {users.filter(u => Boolean(u.liveSmsEnabled || u.phone)).length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 block">Cellular Ready</span>
              </div>
            </div>

            {/* Filter & View Switcher Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 glass-panel rounded-2xl">
              <div className="flex-1 flex flex-col md:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name, @user, cell, email, address, hospital..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />

                <select
                  value={orgFilter}
                  onChange={e => setOrgFilter(e.target.value)}
                  className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="">All Organizations</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                  <option value="none">Independent Mesh Only</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="">All Roles</option>
                  <option value="Community Member">Community Member / Student</option>
                  <option value="Organization Administrator">Organization Admin</option>
                  <option value="Dispatcher">Control Room Dispatcher</option>
                  <option value="Responder">Armed Responder / Guard</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    viewMode === 'table' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Table View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    viewMode === 'cards' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🗂️ Cards View
                </button>
              </div>
            </div>

            {/* Users Display: Table or Cards */}
            {(() => {
              const filteredUsers = users.filter(u => {
                const s = searchTerm.toLowerCase();
                const matchSearch = 
                  (u.fullName || '').toLowerCase().includes(s) ||
                  (u.username || '').toLowerCase().includes(s) ||
                  (u.phone || '').includes(s) ||
                  (u.email || '').toLowerCase().includes(s) ||
                  (u.homeAddress || '').toLowerCase().includes(s) ||
                  (u.preferredHospital || '').toLowerCase().includes(s) ||
                  (u.medicalInfo || '').toLowerCase().includes(s);
                const matchOrg = !orgFilter ? true : orgFilter === 'none' ? !u.orgCode : u.orgCode === orgFilter;
                const matchRole = !roleFilter ? true : (u.role || 'Community Member') === roleFilter;
                const matchStatus = !statusFilter ? true : (u.subscriptionStatus || 'active') === statusFilter;
                return matchSearch && matchOrg && matchRole && matchStatus;
              });

              if (filteredUsers.length === 0) {
                return (
                  <div className="p-12 text-center glass-panel rounded-2xl font-mono space-y-3">
                    <span className="text-3xl">👥</span>
                    <h4 className="text-sm font-bold text-slate-300">No User Records Match Criteria</h4>
                    <p className="text-xs text-slate-500">Adjust search queries or clear organization and role filters.</p>
                  </div>
                );
              }

              if (viewMode === 'table') {
                return (
                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-900 shadow-xl">
                    <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                        <thead className="bg-slate-900/90 text-slate-400 uppercase text-[9px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-3">User & ID</th>
                            <th className="py-3 px-3">Contact (Cell/WA)</th>
                            <th className="py-3 px-3">Email Address</th>
                            <th className="py-3 px-3">Org Node & Role</th>
                            <th className="py-3 px-3">Addresses (Home / Work)</th>
                            <th className="py-3 px-3">Trauma & Hospital</th>
                            <th className="py-3 px-3">Registered At</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/80">
                          {filteredUsers.map(u => {
                            const uOrg = organizations.find(o => o.id === u.orgCode);
                            return (
                              <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                                      {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-100 block leading-tight">{u.fullName}</span>
                                      <span className="text-[9px] text-slate-500">@{u.username} • {u.id}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-slate-200">
                                  <div className="space-y-0.5">
                                    <span className="block font-bold">{u.phone || 'No phone'}</span>
                                    {u.whatsapp && (
                                      <span className="text-[8px] text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-500/20">
                                        WA: {u.whatsapp}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-slate-300 max-w-[140px] truncate">
                                  {u.email}
                                </td>

                                <td className="py-3 px-3">
                                  <div>
                                    <span className="text-amber-400 font-bold block">{uOrg ? uOrg.name : 'Independent Mesh'}</span>
                                    <span className="text-[9px] text-slate-400">{u.role || 'Community Member'}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate">
                                  <div className="space-y-0.5">
                                    <span className="block truncate text-slate-200" title={u.homeAddress}>
                                      🏠 {u.homeAddress || 'Not entered'}
                                    </span>
                                    {u.workAddress && (
                                      <span className="block truncate text-[9px] text-slate-500" title={u.workAddress}>
                                        🏢 {u.workAddress}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate">
                                  <div className="space-y-0.5">
                                    <span className="block truncate text-red-400 font-bold" title={u.preferredHospital}>
                                      🏥 {u.preferredHospital || 'Standard Response'}
                                    </span>
                                    <span className="block truncate text-[9px] text-slate-400" title={u.medicalInfo}>
                                      💊 {u.medicalInfo || 'Standard profile'}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>

                                <td className="py-3 px-3">
                                  <span
                                    className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border"
                                    style={{
                                      backgroundColor: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#10b98115' : u.subscriptionStatus === 'trial' ? '#f59e0b15' : '#ef444415',
                                      borderColor: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#10b98140' : u.subscriptionStatus === 'trial' ? '#f59e0b40' : '#ef444440',
                                      color: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#34d399' : u.subscriptionStatus === 'trial' ? '#fbbf24' : '#f87171'
                                    }}
                                  >
                                    {u.subscriptionStatus || 'ACTIVE'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setViewingUserDossier(u)}
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[9px] font-bold"
                                      title="View Complete User Details"
                                    >
                                      Dossier
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleEditUserClick(u)}
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Permanently remove ${u.fullName}?`)) deleteUserProfile(u.id);
                                      }}
                                      className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/20 text-[9px] font-bold"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map(u => {
                    const isEditing = editingUserId === u.id;
                    const uOrg = organizations.find(o => o.id === u.orgCode);

                    return (
                      <div key={u.id} className="p-4.5 glass-panel rounded-2xl space-y-3.5 border border-slate-900">
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
                              <label className="text-[8px] text-slate-500 font-bold block mb-1">ORG CODE BINDING</label>
                              <input
                                type="text"
                                value={editUserOrgCode}
                                onChange={e => setEditUserOrgCode(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono"
                                placeholder="e.g. SL-ORG-8492"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={editUserLiveSms}
                                onChange={e => setEditUserLiveSms(e.target.checked)}
                                className="accent-amber-500"
                              />
                              <label className="text-xs text-slate-400 font-bold">ENABLE LIVE CELLULAR SMS FOR THIS RECORD</label>
                            </div>

                            <div className="flex items-center gap-2 mt-1 p-2 rounded-xl bg-blue-950/20 border border-blue-500/20">
                              <input
                                type="checkbox"
                                checked={editUserCanUseAdminTwilio}
                                onChange={e => setEditUserCanUseAdminTwilio(e.target.checked)}
                                className="accent-blue-500"
                              />
                              <label className="text-[10px] text-blue-300 font-bold">
                                PERMIT USER TO USE SUPERADMIN TWILIO SENDER ACCOUNT (SAVES USER OWN ACCOUNT)
                              </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button onClick={() => setEditingUserId(null)} className="text-[10px] text-slate-400 hover:text-slate-200">Cancel</button>
                              <button onClick={() => handleSaveUser(u.id)} className="px-3 py-1 bg-amber-600 text-white rounded-full text-[10px] font-bold">Save Record</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 shrink-0">
                                  {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-100">{u.fullName}</h4>
                                  <p className="text-[10px] font-mono text-slate-400">@{u.username} • {u.role || 'Community Member'}</p>
                                  <span
                                    className="inline-block mt-1 px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold uppercase tracking-wider border"
                                    style={{
                                      backgroundColor: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#10b98115' : '#f59e0b15',
                                      borderColor: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#10b98140' : '#f59e0b40',
                                      color: u.subscriptionStatus === 'active' || !u.subscriptionStatus ? '#34d399' : '#fbbf24'
                                    }}
                                  >
                                    Status: {u.subscriptionStatus || 'active'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingUserDossier(u)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[9px] font-mono font-bold"
                                >
                                  Dossier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditUserClick(u)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-mono font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete ${u.fullName}?`)) deleteUserProfile(u.id);
                                  }}
                                  className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 text-[9px] font-mono font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-900">
                              <div>
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Phone & WhatsApp</span>
                                <span className="text-slate-200 font-bold">{u.phone}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Org Mesh Link</span>
                                <span className="text-slate-200 font-bold truncate block">{uOrg ? uOrg.name : 'Independent'} ({u.orgCode || 'None'})</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Home Address</span>
                                <span className="text-slate-300 truncate block">{u.homeAddress || 'Not specified'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[8px] uppercase font-bold">Trauma Facility</span>
                                <span className="text-red-400 truncate block font-bold">{u.preferredHospital || 'Standard Center'}</span>
                              </div>
                              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-900/60">
                                <span className="text-[7.5px] text-slate-500 uppercase font-bold">Twilio Pool Access:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextState = !u.canUseAdminTwilio;
                                    updateUserProfile(u.id, { canUseAdminTwilio: nextState });
                                    addToast(`${u.fullName}: Admin Twilio sender access ${nextState ? 'GRANTED' : 'REVOKED'}.`, 'info');
                                  }}
                                  className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                                    u.canUseAdminTwilio
                                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                                  }`}
                                >
                                  {u.canUseAdminTwilio ? '✅ Admin Account Granted' : '🔒 Own Account Mode'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* USER FULL DOSSIER MODAL */}
        {viewingUserDossier && (
          <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl font-mono text-left animate-fadeIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-lg">
                    {(viewingUserDossier.fullName || viewingUserDossier.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">{viewingUserDossier.fullName}</h3>
                    <p className="text-[10px] text-amber-400">@{viewingUserDossier.username} • ID: {viewingUserDossier.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingUserDossier(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Dossier Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 space-y-1">
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Contact Channels</span>
                  <div className="text-slate-200 font-bold">Cell: {viewingUserDossier.phone}</div>
                  <div className="text-emerald-400">WhatsApp: {viewingUserDossier.whatsapp || viewingUserDossier.phone}</div>
                  <div className="text-slate-400 truncate">Email: {viewingUserDossier.email}</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-855 space-y-1">
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Organization & System Role</span>
                  <div className="text-amber-300 font-bold">Org Code: {viewingUserDossier.orgCode || 'Independent Mesh'}</div>
                  <div className="text-slate-300">Role: {viewingUserDossier.role || 'Community Member'}</div>
                  <div className="text-slate-500 text-[10px]">Registration: {new Date(viewingUserDossier.createdAt).toLocaleString()}</div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 space-y-1 md:col-span-2">
                  <span className="text-[8.5px] text-slate-500 font-bold uppercase block">Registered Geolocation & Addresses</span>
                  <div className="text-slate-200">🏠 Home: {viewingUserDossier.homeAddress || 'Not recorded at registration'}</div>
                  {viewingUserDossier.workAddress && (
                    <div className="text-slate-400">🏢 Campus / Work: {viewingUserDossier.workAddress}</div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 space-y-1 md:col-span-2">
                  <span className="text-[8.5px] text-red-400 font-bold uppercase block">Trauma & Special Care Medical Dossier</span>
                  <div className="text-slate-200 font-bold">Preferred Hospital: {viewingUserDossier.preferredHospital || 'Nearest Level 1 Facility'}</div>
                  <div className="text-slate-300">Medical Notes: {viewingUserDossier.medicalInfo || 'Standard individual registration profile'}</div>
                  {viewingUserDossier.emergencyContactsList && (
                    <div className="text-amber-400 text-[10px] pt-1">
                      Escalation Chain: {viewingUserDossier.emergencyContactsList}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    handleEditUserClick(viewingUserDossier);
                    setViewingUserDossier(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl"
                >
                  Edit This Record
                </button>
                <button
                  type="button"
                  onClick={() => setViewingUserDossier(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLIENT DATABASE & DRIVE SYNC (SUPER ADMIN ONLY) */}
        {activeTab === 'CLIENTS' && (
          <div className="space-y-4 animate-fadeIn text-left">
            <div className="p-4 bg-slate-900/60 border border-amber-500/30 rounded-2xl">
              <h2 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <span>📁</span> SECURE CLIENT ROSTER & GOOGLE DRIVE PERSISTENCE ENGINE
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Authoritative Master Database view with bidirectional Google Drive synchronization and emergency telemetry records. Access restricted exclusively to Super Admin.
              </p>
            </div>
            <ClientDatabaseModule />
          </div>
        )}

        {/* TAB: CLOUDFLARE R2 MEDIA ASSETS (138 ASSETS) */}
        {activeTab === 'R2_MEDIA' && (
          <div className="space-y-4 animate-fadeIn text-left">
            <div className="p-4 bg-slate-900/60 border border-purple-500/30 rounded-2xl">
              <h2 className="text-sm font-bold text-purple-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <span>🎬</span> CLOUDFLARE R2 ASSETS & EVIDENCE VAULT (138 ASSETS)
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Stream, inspect, download, and manage verified hardware photographs, video guides, firmware packages, and incident audio recordings hosted in Cloudflare R2 bucket: <span className="text-purple-300 font-bold">media</span>.
              </p>
            </div>
            <MediaHub />
          </div>
        )}

        {/* TAB 3: ORGANIZATIONS MANAGEMENT */}
        {activeTab === 'ORGANIZATIONS' && (
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
                className="bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono w-full md:w-64"
              />
            </div>

              {/* Pending Approvals */}
              {pendingOrgs.length > 0 && (
                <div className="bg-amber-950/25 border border-amber-500/30 p-5 rounded-3xl space-y-3.5 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <h3 className="text-xs font-mono font-black uppercase text-amber-300 tracking-wider">
                      🔔 Pending Organization Registries Awaiting System Admin Approval ({pendingOrgs.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingOrgs.map((o) => (
                      <div key={o.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3 shadow-md">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-100">{o.name}</h4>
                            <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/10">{o.id}</span>
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
                            className="px-3.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-mono font-bold rounded-lg transition-all"
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
                    const resCount = userCountsByOrg[o.id] || 0; // Intentionally left in place unless we use a lookup map

                    return (
                      <div key={o.id} className="p-4 glass-panel space-y-3">
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
                              <button onClick={() => handleSaveOrg(o.id)} className="px-3 py-1 bg-amber-600 text-white rounded-full text-[10px] font-bold">Save Org</button>
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
  <span className="text-[8px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full border" style={{ color: o.subscriptionStatus === 'active' ? '#10b981' : o.subscriptionStatus === 'trial' ? '#f59e0b' : '#ef4444', borderColor: 'currentColor', marginLeft: '4px' }}>
    STATUS: {o.subscriptionStatus || 'active'}
  </span>

                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => { if(confirm(`Unlock trial for ${o.name}?`)) useAppStore.getState().unlockOrganizationTrial(o.id); }} className="p-1 text-[9px] font-mono text-emerald-400 hover:text-emerald-300">UNLOCK TRIAL</button>
                              <button onClick={() => handleEditOrgClick(o)} className="p-1 text-[9px] font-mono text-slate-400 hover:text-slate-200">EDIT</button>
                              
  <button onClick={() => adminUpdateSubscription(o.id, 'org', o.subscriptionStatus === 'trial' ? 'active' : 'trial')} className="p-1 text-[9px] font-mono text-amber-400 hover:text-amber-300">{o.subscriptionStatus === 'trial' ? 'ACTIVATE' : 'TRIAL'}</button>
  <button onClick={() => adminUpdateSubscription(o.id, 'org', o.subscriptionStatus === 'locked' ? 'active' : 'locked')} className="p-1 text-[9px] font-mono text-purple-400 hover:text-purple-300">{o.subscriptionStatus === 'locked' ? 'UNLOCK' : 'LOCK'}</button>
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
                              <span className="text-amber-400 text-[8px] uppercase font-black block mt-0.5">Firebase Stack</span>
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
        {activeTab === 'EVIDENCE' && (
          <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden p-2">
            <EvidenceLedger />
          </div>
        )}

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
                              <span className="text-amber-400 shrink-0">›</span>
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
            {/* IoT Section (Existing top settings block) */}
            
            
            {/* Trial Settings */}
            <div className="glass-panel p-5 md:p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="text-[10px]">🎟️</span> TRIAL SYSTEM
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">Enable or disable the global 14-day trial banner for organizations</p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => useAppStore.getState().setTrialEnabled(!useAppStore.getState().isTrialEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${useAppStore.getState().isTrialEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useAppStore.getState().isTrialEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className={`text-xs font-mono font-bold ${useAppStore.getState().isTrialEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
                    {useAppStore.getState().isTrialEnabled ? 'TRIAL SYSTEM ENABLED' : 'TRIAL SYSTEM DISABLED'}
                  </span>
                </div>
              </div>
            </div>

            {/* EXTERNAL PLATFORM INTEGRATIONS & CREDENTIALS SENTINEL */}
            <div className="glass-panel p-5 md:p-6 space-y-4 border border-blue-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-blue-400 font-mono uppercase tracking-wider flex items-center gap-2">
                    <span>📡</span> EXTERNAL PLATFORM CREDENTIALS & SERVICE SENTINEL
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Live end-to-end verification of VAPI AI Voice, Twilio / WhatsApp, Africa's Talking USSD, Cloudflare R2, and Database connections.
                  </p>
                </div>
                <button
                  onClick={runCredsAudit}
                  disabled={checkingCreds}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase rounded-xl tracking-wider transition-all shadow shrink-0"
                >
                  {checkingCreds ? 'AUDITING...' : '⚡ TEST PLATFORM INTEGRATIONS'}
                </button>
              </div>

              {credsStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {/* VAPI */}
                  <div className={`p-3.5 rounded-2xl border text-left space-y-1 ${credsStatus.services?.vapi?.healthy ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">🎙️ VAPI AI Voice</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${credsStatus.services?.vapi?.healthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {credsStatus.services?.vapi?.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">Agent: {credsStatus.services?.vapi?.assistantName || 'SafetyLink Panic Alert'}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Phone ID: {credsStatus.services?.vapi?.phoneNumberId ? 'Configured ✅' : 'Missing'}</p>
                  </div>

                  {/* Twilio */}
                  <div className={`p-3.5 rounded-2xl border text-left space-y-1 ${credsStatus.services?.twilio?.healthy ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">💬 Twilio / WhatsApp</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${credsStatus.services?.twilio?.healthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {credsStatus.services?.twilio?.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">Account: {credsStatus.services?.twilio?.accountName || 'Active'}</p>
                    <p className="text-[9px] text-slate-500 font-mono">Sender: {credsStatus.services?.twilio?.phoneNumber || '+16055695774'}</p>
                  </div>

                  {/* Cloudflare R2 */}
                  <div className={`p-3.5 rounded-2xl border text-left space-y-1 ${credsStatus.services?.cloudflareR2?.healthy ? 'bg-purple-950/20 border-purple-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">🎬 Cloudflare R2 Media</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${credsStatus.services?.cloudflareR2?.healthy ? 'bg-purple-500/20 text-purple-400' : 'bg-red-500/20 text-red-400'}`}>
                        {credsStatus.services?.cloudflareR2?.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-300 font-mono">Bucket: {credsStatus.services?.cloudflareR2?.bucket} ({credsStatus.services?.cloudflareR2?.assetCount} assets live)</p>
                    <p className="text-[9px] text-slate-500 font-mono">Streaming: Active across entire UI</p>
                  </div>

                  {/* Africa's Talking */}
                  <div className={`p-3.5 rounded-2xl border text-left space-y-1 ${credsStatus.services?.africasTalking?.healthy ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">📶 Africa's Talking USSD</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${credsStatus.services?.africasTalking?.healthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {credsStatus.services?.africasTalking?.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">User: {credsStatus.services?.africasTalking?.username} • Balance: {credsStatus.services?.africasTalking?.balance}</p>
                    {credsStatus.services?.africasTalking?.message && (
                      <p className="text-[8.5px] text-amber-400/80 font-mono">{credsStatus.services?.africasTalking?.message}</p>
                    )}
                  </div>

                  {/* Neon Database */}
                  <div className={`p-3.5 rounded-2xl border text-left space-y-1 ${credsStatus.services?.neonDatabase?.healthy ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 font-mono">🗄️ Neon Database</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${credsStatus.services?.neonDatabase?.healthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {credsStatus.services?.neonDatabase?.status || 'LOCAL_FALLBACK'}
                      </span>
                    </div>
                    {credsStatus.services?.neonDatabase?.healthy ? (
                      <p className="text-[10px] text-emerald-400 font-mono">PostgreSQL connection verified</p>
                    ) : (
                      <p className="text-[8.5px] text-amber-400 font-mono leading-tight">
                        {credsStatus.services?.neonDatabase?.actionRequired || credsStatus.services?.neonDatabase?.error}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs font-mono text-slate-500">
                  Click 'TEST PLATFORM INTEGRATIONS' to execute live API ping checks.
                </div>
              )}
            </div>

            {/* Custom Backend Server */}
            <div className="glass-panel p-5 md:p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">Custom Backend Integration (API Route)</h3>
                <p className="text-xs text-slate-500">
                  Bind this instance to your own remote backend server. Replaces the local offline API.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="https://your-custom-api-server.com"
                  value={backendUrlInput}
                  onChange={e => setBackendUrlInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCustomBackendUrl(backendUrlInput);
                      addAuditLog('SYSTEM', 'INFO', 'Custom Backend URL saved');
                    }}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-2xl transition-colors shrink-0"
                  >
                    SAVE ROUTE
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 md:p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">IoT Edge Telemetry Route Configuration</h3>
                <p className="text-xs text-slate-500">
                  Bind this instance to your specific remote rule chain. Panics will automatically push device telemetries.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Paste IoT Device Access Token..."
                  value={tbTokenInput}
                  onChange={e => setTbTokenInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setThingsBoardToken(tbTokenInput);
                      addAuditLog('SYSTEM', 'INFO', 'ThingsBoard token saved');
                    }}
                    className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold rounded-2xl transition-colors shrink-0"
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
              <div className="glass-panel p-5 space-y-4 md:col-span-1">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-amber-400 font-mono tracking-wider">🛠️ Add New Custom Tool / Setting</h3>
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
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-[10px] tracking-wider uppercase transition-all"
                  >
                    PUBLISH GLOBAL TOOL
                  </button>
                </div>
              </div>

              {/* Tools List */}
              <div className="glass-panel p-5 space-y-4 md:col-span-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-slate-300 font-mono tracking-wider">Active Globally-Pushed Tools & Settings</h3>
                  <p className="text-xs text-slate-500">
                    The following tools are currently active and embedded directly into every individual occupant's workspace.
                  </p>
                </div>

                {globalCustomTools.length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 font-mono">No custom global tools have been created yet. Use the form on the left to add one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {globalCustomTools.map((t) => (
                      <div key={t.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex justify-between items-start gap-3 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{t.title}</span>
                            <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-amber-900/40 text-amber-300 rounded border border-amber-500/20">
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

        {/* TAB 7: FLEET & UPDATES */}
        {activeTab === 'FLEET' && (
          <div className="space-y-6 animate-fadeIn text-left">
            <FleetMonitor />
          </div>
        )}
      </main>
    </div>
  );
};
