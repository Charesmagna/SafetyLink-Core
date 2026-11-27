import WorkspaceIntegrations from "./WorkspaceIntegrations";
import OrgWarRoom from "./OrgWarRoom";
import React, { Suspense, lazy, useState, useMemo, useEffect } from 'react';
import { SceneErrorBoundary } from './three/SceneErrorBoundary';

const TacticalCampus3DScene = lazy(() => import('./three/TacticalCampus3DScene'));
const BleMeshVisualizer3DScene = lazy(() => import('./three/BleMeshVisualizer3DScene'));
import { GlobalRadarBackground } from './GlobalRadarBackground';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useAppStore, PRIMARY_BACKEND_URL, FALLBACK_BACKEND_URL } from '../utils/store';
import { UserProfile } from '../types';
import { LogoSetPart } from './LogoSetPart';
import { GlowingHeartBackground } from './GlowingHeartBackground';
import { MphakatiOverwatch } from './MphakatiOverwatch';
import { NodeMeshOrchestration } from './NodeMeshOrchestration';
import { IncidentReportingTemplates } from './IncidentReportingTemplates';
import { AdvancedOfflineSyncManager } from './AdvancedOfflineSyncManager';
import { MotherboardConsole } from './MotherboardConsole';
import { GeospatialAnalytics } from './GeospatialAnalytics';

import { EvidenceLedger } from './EvidenceLedger';
import { HikvisionCameraManager } from './HikvisionCameraManager';
import { LiveCameraFeed } from './LiveCameraFeed';
import { OrgLiveIncidentMap } from './OrgLiveIncidentMap';
import {
  MapPin,
  LayoutDashboard,
  Users,
  Video,
  Shield,
  Radio,
  FileText,
  RefreshCw,
  BarChart3,
  Palette,
  Building2,
  Plug,
  Ticket,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Copy,
  Check,
  Globe,
  Box,
} from 'lucide-react';

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
    rejectPendingUser,
    disconnectOrgMember,
    setOrgMemberStatus,
    generateReferralCode,
    isTrialEnabled,
    globalTheme,
    setDisplaySettings,
  } = useAppStore();

  const isDark = globalTheme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cctvViewMode, setCctvViewMode] = useState<'LIVE' | 'ONBOARD'>('LIVE');

  const currentOrg = storeOrg || (currentUser?.orgCode ? organizations.find(o => o.id === currentUser.orgCode) : null);

  const isResponder = currentUser?.role === 'Responder';
  const [orgReferralCode, setOrgReferralCode] = useState(currentOrg?.referralCode || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('incident-map');
  const [copiedOrgCode, setCopiedOrgCode] = useState(false);
  const [serverJoinRequests, setServerJoinRequests] = useState<any[]>([]);
  const [serverMembers, setServerMembers] = useState<any[]>([]);
  const [refreshingMembers, setRefreshingMembers] = useState(false);

  const fetchOrgLiveRoster = async () => {
    const orgId = currentOrg?.id;
    const token = useAppStore.getState().token;
    const customUrl = useAppStore.getState().customBackendUrl;
    if (!orgId || !token || isResponder) return;
    setRefreshingMembers(true);
    const bases = [customUrl, PRIMARY_BACKEND_URL, FALLBACK_BACKEND_URL].filter(Boolean) as string[];
    for (const base of bases) {
      const cleanBase = base.replace(/\/$/, '');
      try {
        const [reqRes, memRes] = await Promise.all([
          fetch(`${cleanBase}/api/org/${encodeURIComponent(orgId)}/join-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${cleanBase}/api/org/${encodeURIComponent(orgId)}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (reqRes.ok) {
          const data = await reqRes.json();
          setServerJoinRequests(Array.isArray(data?.requests) ? data.requests : []);
        }
        if (memRes.ok) {
          const membersData = await memRes.json();
          setServerMembers(Array.isArray(membersData) ? membersData : []);
        }
        if (reqRes.ok || memRes.ok) break;
      } catch {}
    }
    setRefreshingMembers(false);
  };

  useEffect(() => {
    fetchOrgLiveRoster();
  }, [currentOrg?.id, activeSubTab, isResponder]);
  
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
  const [brandLogoUrl, setBrandLogoUrl] = useState(currentOrg?.logoUrl || 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(currentOrg?.primaryColor || '#10b981');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(currentOrg?.secondaryColor || '#06b6d4');
  const [brandControlRoomNumber, setBrandControlRoomNumber] = useState(currentOrg?.controlRoomNumber || '+27829110000');
  const [brandEscalationPolicy, setBrandEscalationPolicy] = useState(currentOrg?.escalationPolicy || 'Multi-stage fallback SMS alert sequence -> Dedicated Sector Response dispatch -> Escalation to Municipal SAPS.');

  // Org Custom Tools Form State
  const [newToolTitle, setNewToolTitle] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [newToolType, setNewToolType] = useState<'WHATSAPP' | 'CALL' | 'SMS' | 'INFO' | 'WIDGET'>('INFO');
  const [newToolValue, setNewToolValue] = useState('');

  // Gateway Setup State variables

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

  // Filter students/members belonging to this organization code (merge local + live server members)
  const registeredStudents = useMemo(() => {
    const localList = users.filter(u => u.orgCode?.toUpperCase() === currentOrg?.id?.toUpperCase());
    const merged: any[] = [...localList];
    for (const sm of serverMembers) {
      const idx = merged.findIndex(u => u.id === sm.id || (sm.username && u.username?.toLowerCase() === String(sm.username).toLowerCase()));
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          status: sm.status || merged[idx].status || 'active',
          lastSeen: sm.last_seen || merged[idx].lastSeen,
          lat: sm.lat ?? merged[idx].lat,
          lng: sm.lng ?? merged[idx].lng,
          sosActive: Boolean(sm.sos_active),
          appVersion: sm.app_version || merged[idx].appVersion,
        };
      } else {
        merged.push({
          id: sm.id,
          username: sm.username || sm.email || sm.id,
          fullName: sm.username || sm.email || 'Connected Member',
          phone: sm.phone || '',
          email: sm.email || '',
          role: sm.role || 'Community Member',
          orgCode: currentOrg?.id || '',
          status: sm.status || 'active',
          lastSeen: sm.last_seen,
          lat: sm.lat,
          lng: sm.lng,
          sosActive: Boolean(sm.sos_active),
          appVersion: sm.app_version,
          createdAt: Date.now(),
        });
      }
    }
    return merged;
  }, [users, serverMembers, currentOrg?.id]);
  
  // Filter by search term
  const filteredStudents = useMemo(() => registeredStudents.filter(u => 
    (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.phone || '').includes(searchTerm)
  ), [registeredStudents, searchTerm]);

  const activeReferralCode = currentOrg?.referralCode || orgReferralCode;
  const referredUsers = useMemo(() => {
    if (!activeReferralCode) return [];
    const upperCode = activeReferralCode.toUpperCase();
    return users.filter(u => u.referredByCode?.toUpperCase() === upperCode);
  }, [users, activeReferralCode]);

  // Active panic alerts triggered by people in this organization
  const activeOrgPanics = useMemo(() => {
    if (!currentOrg) return [];
    const orgUserIds = new Set(registeredStudents.map(s => s.username.toLowerCase()));
    return panicEvents.filter(p => 
      p.status !== 'RESOLVED' && 
      (p.description.toLowerCase().includes(currentOrg.name.toLowerCase()) || 
       orgUserIds.has(p.description.split(' ').pop()?.toLowerCase() || ''))
    );
  }, [panicEvents, currentOrg?.name, registeredStudents]);

  if (!currentOrg) return null;

  const handleEditClick = (student: UserProfile) => {
    setEditingUserId(student.id);
    setEditFullName(student.fullName);
    setEditPhone(student.phone);
    setEditEmail(student.email);
    setEditAccountNumber(student.accountNumber || `SL-ACC-${Math.floor(10000 + Math.random() * 90000)}`);
    setEditMedicalInfo(student.medicalInfo || 'No chronic conditions logged.');
    setEditRiskNotes(student.riskNotes || 'Standard perimeter monitoring.');
    setEditOfficer(student.assignedResponseOfficer || 'Unassigned');
    setEditHospital(student.preferredHospital || 'Netcare Milpark Hospital');
    setEditAddress(student.homeAddress || 'Not specified');
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

  const pendingApprovalCount =
    users.filter(u => u.pendingOrgCode === currentOrg?.id).length +
    serverJoinRequests.filter(
      sr => !users.some(u => u.pendingOrgCode === currentOrg?.id && (u.id === sr.user_id || u.username === sr.username))
    ).length;

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'incident-map', label: 'Incident Map', icon: MapPin, show: true },
        { id: 'dispatch', label: 'Dispatch Control', icon: LayoutDashboard, show: true, badge: activeOrgPanics.length > 0 ? activeOrgPanics.length : undefined },
      ],
    },
    {
      label: 'Incidents',
      items: [
        { id: 'mphakati-overwatch', label: 'Mphakati Overwatch', icon: Shield, show: true },
        { id: 'incident-reporting', label: 'Incident Templates', icon: FileText, show: !isResponder },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, show: !isResponder },
      ],
    },
    {
      label: 'Team',
      items: [
        { id: 'roster', label: 'Clients & Approvals', icon: Users, show: !isResponder, badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined },
        { id: 'referrals', label: 'Referrals', icon: Ticket, show: !isResponder },
      ],
    },
    {
      label: 'Operations',
      items: [
        { id: 'cctv', label: 'CCTV / Hikvision', icon: Video, show: true },
        { id: 'live-gis', label: 'Live GIS War Room', icon: Globe, show: true },
        { id: 'tactical-3d', label: '3D Tactical Twin', icon: Box, show: true },
        { id: 'mesh-orchestration', label: 'Mesh Orchestration', icon: Radio, show: !isResponder },
        { id: 'offline-sync', label: 'Offline Sync', icon: RefreshCw, show: !isResponder, badge: localOfflineQueue.length > 0 ? localOfflineQueue.length : undefined },
        { id: 'branding', label: 'Branding & SLA', icon: Palette, show: !isResponder },
        { id: 'workspace', label: 'Google Workspace', icon: Building2, show: !isResponder },
        { id: 'open-platforms', label: 'Open Platforms', icon: Plug, show: !isResponder },
      ],
    },
  ];

  const handleSelectNav = (id: string) => {
    setActiveSubTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="sl-app-shell h-[100dvh] bg-slate-50 dark:bg-[#071124] text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden relative">
      {/* Active Org Alerts Banner */}
      {activeOrgPanics.length > 0 && (
        <div className="w-full bg-red-600 text-white text-xs font-bold text-center py-2 px-4 tracking-wide uppercase flex items-center justify-center gap-3 relative z-50 shrink-0">
          <span>Active SOS Alert from Assigned Subscriber ({activeOrgPanics.length})</span>
          <button
            type="button"
            onClick={() => setActiveSubTab('incident-map')}
            className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors"
          >
            Focus Map
          </button>
        </div>
      )}

      {/* Trial Banner (Organizations only) */}
      {isTrialEnabled && (
        <div className="w-full bg-amber-500 text-slate-950 text-[11px] font-bold text-center py-1.5 px-4 flex items-center justify-center gap-3 relative z-50 shrink-0">
          <span>14-Day Organization Trial Active</span>
          <span className="hidden sm:inline opacity-80">· Full Control-Room Access Enabled</span>
        </div>
      )}

      {/* Top Command Bar */}
      <header className="h-14 bg-white dark:bg-[#0d1b34] border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-30 relative">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundImage: `linear-gradient(to right, ${brandPrimaryColor}, ${brandSecondaryColor})` }}
        />

        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle organization navigation"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={currentOrg.name}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 object-cover shrink-0 bg-white"
              onError={() => setBrandLogoUrl('')}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-display font-black text-sm flex items-center justify-center shrink-0">
              {(currentOrg.name || 'S')[0].toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-sm sm:text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                {currentOrg.name}
              </h1>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(currentOrg.id).catch(() => {});
                  setCopiedOrgCode(true);
                  useAppStore.getState().addToast(`Copied Organization Code: ${currentOrg.id}`, 'success');
                  setTimeout(() => setCopiedOrgCode(false), 2000);
                }}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-bold transition-colors shrink-0"
                title="Copy Organization Code to share with members"
              >
                {copiedOrgCode ? <Check size={11} /> : <Copy size={11} />}
                <span>{currentOrg.id}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pendingApprovalCount > 0 && !isResponder && (
            <button
              type="button"
              onClick={() => setActiveSubTab('roster')}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-500/25 transition-colors tabular-nums"
            >
              <span>Pending Approvals</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">{pendingApprovalCount}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDisplaySettings({ themeMode: isDark ? 'light' : 'dark' })}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#162849] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Deep Navy Dark Mode'}
            aria-label="Toggle Control-Room Theme"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#162849] hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Body Workspace: Collapsible Left Sidebar + Content Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Control-Room Grouped Left Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-white dark:bg-[#0d1b34] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200`}
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between lg:hidden">
            <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white truncate">{currentOrg.name}</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => handleSelectNav('incident-map')}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <span>+ Live Incident Map</span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-5">
            {navGroups.map(group => {
              const visibleItems = group.items.filter(item => item.show);
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {visibleItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectNav(item.id)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <Icon size={15} className={isActive ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold tabular-nums shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="truncate font-mono">{currentOrg.id}</span>
            <span className="tabular-nums font-semibold">{registeredStudents.length} members</span>
          </div>
        </aside>

        {/* Main Viewport */}
        {activeSubTab === 'incident-map' ? (
          <div className="flex-1 min-w-0 min-h-0 relative overflow-hidden">
            <OrgLiveIncidentMap
              orgName={currentOrg.name}
              orgId={currentOrg.id}
              members={registeredStudents}
            />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto min-h-0 min-w-0 bg-slate-50 dark:bg-[#071124]">
            <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5 relative z-10">
        
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
              onClick={() => syncOfflineQueue()}
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
        {activeSubTab === 'evidence' && (
          <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden p-2">
            <EvidenceLedger />
          </div>
        )}

        {activeSubTab === 'roster' && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Pending Membership Approvals Board */}
            {(() => {
              const localPending = users.filter(u => u.pendingOrgCode === currentOrg?.id);
              const mergedPending: any[] = [...localPending];
              for (const sr of serverJoinRequests) {
                if (!mergedPending.some(p => p.id === sr.user_id || p.username === sr.username)) {
                  mergedPending.push({
                    id: sr.user_id || sr.id,
                    requestId: sr.id,
                    fullName: sr.full_name || sr.username || 'Applicant',
                    username: sr.username || sr.email || sr.user_id,
                    phone: sr.phone || '',
                    email: sr.email || '',
                    pendingRole: sr.requested_role || 'Community Member',
                    pendingOrgCode: currentOrg?.id,
                  });
                }
              }
              return (
                <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-2xl text-left space-y-3.5 shadow-md font-mono">
                  <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-amber-400 font-black uppercase text-[10px] tracking-widest block font-display">
                        ⏳ MEMBERSHIP APPROVAL WINDOW ({mergedPending.length})
                      </span>
                      <p className="text-[9.5px] text-slate-400 font-sans leading-normal">
                        Approve or decline users requesting to connect to Organization ID <span className="font-mono font-bold text-amber-300">{currentOrg.id}</span>.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchOrgLiveRoster}
                        disabled={refreshingMembers}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[9px] font-bold text-cyan-300 hover:bg-slate-800 uppercase"
                      >
                        {refreshingMembers ? 'Syncing...' : '↻ Refresh'}
                      </button>
                      <span className="h-5 px-2 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[10px] font-bold">
                        {mergedPending.length}
                      </span>
                    </div>
                  </div>

                  {mergedPending.length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-sans">
                      No pending join requests right now. Share your code <span className="font-mono text-cyan-400 font-bold">{currentOrg.id}</span> — when a user requests to join from their Profile, their approval card appears here immediately.
                    </p>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mergedPending.map((user: any) => (
                      <div key={user.requestId || user.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex flex-col justify-between gap-3 text-left">
                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold text-slate-200">{user.fullName} <span className="text-[9px] font-mono text-slate-500">(@{user.username})</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Requested Role:</span> <span className="font-bold text-amber-400 uppercase">{user.pendingRole || 'Community Member'}</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Phone:</span> <span className="font-bold text-slate-300">{user.phone || '—'}</span></p>
                          <p className="text-[9px] font-mono text-slate-400 flex justify-between"><span>Email:</span> <span className="text-slate-300">{user.email || '—'}</span></p>
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
                              approvePendingUser(user.id, user.requestId);
                              setServerJoinRequests(prev => prev.filter(r => r.id !== user.requestId && r.user_id !== user.id));
                              useAppStore.getState().addToast(`Approved membership for ${user.fullName}!`, "success");
                            }}
                            className="flex-1 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-400 border border-cyan-500/20 rounded-lg text-center uppercase tracking-wider cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              rejectPendingUser(user.id, user.requestId);
                              setServerJoinRequests(prev => prev.filter(r => r.id !== user.requestId && r.user_id !== user.id));
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
                  )}
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
                  const officer = student.assignedResponseOfficer || 'Unassigned';
                  const hospital = student.preferredHospital || 'Netcare Milpark Private Hospital';
                  const address = student.homeAddress || 'Not specified';
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
                                <h4 className="text-sm font-black text-slate-100 flex flex-wrap items-center gap-1.5">
                                  {student.fullName}
                                  <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-normal">
                                    {accNum}
                                  </span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                                    (student as any).sosActive
                                      ? 'bg-red-600 text-white animate-pulse'
                                      : (student as any).status === 'suspended' || (student as any).status === 'deactivated'
                                        ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                                        : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400'
                                  }`}>
                                    {(student as any).sosActive
                                      ? '🚨 SOS ACTIVE'
                                      : ((student as any).status || 'active').toUpperCase()}
                                  </span>
                                </h4>
                                <p className="text-[10px] font-mono text-slate-400">
                                  @{student.username} • {address}
                                  {(student as any).lastSeen ? ` • Seen ${new Date((student as any).lastSeen).toLocaleTimeString()}` : ''}
                                </p>
                                {(student as any).lat && (student as any).lng && (
                                  <a
                                    href={`https://maps.google.com/?q=${(student as any).lat},${(student as any).lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block text-[9px] font-mono text-cyan-400 hover:underline"
                                  >
                                    📍 Live GPS: {Number((student as any).lat).toFixed(4)}, {Number((student as any).lng).toFixed(4)}
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleEditClick(student)}
                                className="px-2 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-md text-[9px] font-mono font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase"
                              >
                                Edit
                              </button>
                              {((student as any).status === 'suspended' || (student as any).status === 'deactivated') ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await setOrgMemberStatus(student.id, 'ACTIVATE');
                                    setServerMembers(prev => prev.map(m => m.id === student.id ? { ...m, status: 'active' } : m));
                                    useAppStore.getState().addToast(`Activated ${student.fullName}.`, 'success');
                                  }}
                                  className="px-2 py-1 bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-md text-[9px] font-mono font-black text-emerald-300 transition-colors uppercase"
                                >
                                  Activate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await setOrgMemberStatus(student.id, 'SUSPEND');
                                    setServerMembers(prev => prev.map(m => m.id === student.id ? { ...m, status: 'suspended' } : m));
                                    useAppStore.getState().addToast(`Suspended ${student.fullName}.`, 'info');
                                  }}
                                  className="px-2 py-1 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-600 hover:text-white rounded-md text-[9px] font-mono font-black text-amber-300 transition-colors uppercase"
                                >
                                  Suspend
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  await disconnectOrgMember(student.id);
                                  setServerMembers(prev => prev.filter(m => m.id !== student.id));
                                  useAppStore.getState().addToast(`Disconnected ${student.fullName} from ${currentOrg.name}.`, 'info');
                                }}
                                className="px-2 py-1 bg-red-950/25 border border-red-500/30 hover:bg-red-800 hover:text-white rounded-md text-[9px] font-mono font-black text-red-400 transition-colors uppercase"
                              >
                                Disconnect
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
        {/* SUB TAB: OPEN PLATFORMS                              */}
        {/* ==================================================== */}
        
        {activeSubTab === 'workspace' && (
          <WorkspaceIntegrations />
        )}
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
        {activeSubTab === 'analytics' && (
          <GeospatialAnalytics />
        )}
        {activeSubTab === 'live-gis' && (
          <div className="animate-fadeIn mt-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[600px]">
            <OrgWarRoom />
          </div>
        )}
        {activeSubTab === 'tactical-3d' && (
          <div className="animate-fadeIn mt-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider font-mono text-emerald-400">
                  3D Tactical Campus &amp; Floor-by-Floor Command Twin
                </h2>
                <p className="text-xs text-slate-400">
                  Isolate building floors, inspect vertical distress beacons, monitor patrol units, and trace BLE relay uplinks.
                </p>
              </div>
            </div>
            <SceneErrorBoundary title="3D Tactical Campus Twin" heightClass="h-[600px]">
              <Suspense
                fallback={
                  <div className="h-[600px] rounded-2xl bg-[#050b16] border border-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400">
                    Initializing 3D Tactical Campus Twin...
                  </div>
                }
              >
                <TacticalCampus3DScene heightClass="h-[600px]" orgName={currentOrg?.name} />
              </Suspense>
            </SceneErrorBoundary>
          </div>
        )}
        {activeSubTab === 'mphakati-overwatch' && (
          <div className="animate-fadeIn -mx-4 sm:-mx-8 lg:-mx-8">
            <MphakatiOverwatch />
          </div>
        )}

        {activeSubTab === 'mesh-orchestration' && (
          <div className="space-y-4 animate-fadeIn">
            <SceneErrorBoundary title="3D BLE Proximity & Offline Mesh Visualizer" heightClass="h-[420px]">
              <Suspense
                fallback={
                  <div className="h-[420px] rounded-2xl bg-[#050b16] border border-slate-800 flex items-center justify-center text-xs font-mono text-emerald-400">
                    Initializing 3D BLE Mesh Radar...
                  </div>
                }
              >
                <BleMeshVisualizer3DScene heightClass="h-[420px]" />
              </Suspense>
            </SceneErrorBoundary>
            <NodeMeshOrchestration />
          </div>
        )}
        
        {activeSubTab === 'incident-reporting' && (
          <IncidentReportingTemplates />
        )}
        
        {activeSubTab === 'offline-sync' && (
          <AdvancedOfflineSyncManager />
        )}

        {activeSubTab === 'cctv' && (
          <div className="glass-panel rounded-2xl p-5 animate-fadeIn space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider font-mono text-emerald-400">
                  Organization CCTV Command &amp; Hikvision Deployment
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Switch between the live WebRTC quad wall (PTZ, talkback, snapshots) and zero-IT camera onboarding.
                </p>
              </div>
              <div className="inline-flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCctvViewMode('LIVE')}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-md transition-colors ${
                    cctvViewMode === 'LIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live WebRTC Wall
                </button>
                <button
                  type="button"
                  onClick={() => setCctvViewMode('ONBOARD')}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase rounded-md transition-colors ${
                    cctvViewMode === 'ONBOARD' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fleet &amp; Onboarding
                </button>
              </div>
            </div>
            {cctvViewMode === 'LIVE' ? (
              <LiveCameraFeed scope="ORG" />
            ) : (
              <HikvisionCameraManager scope="ORG" />
            )}
          </div>
        )}
        
        {activeSubTab === 'referrals' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Referral Code Generator */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-900 pb-3">
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">Agent Referral Code</h3>
                <p className="text-[10px] text-slate-500 mt-1">Generate a code to give to your agents. Every client that signs up using this code is tracked below.</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (currentOrg) {
                      const code = generateReferralCode(currentOrg.id);
                      setOrgReferralCode(code);
                    }
                  }}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 border border-amber-500/10 transition-colors text-white font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider"
                >
                  {orgReferralCode ? '🔄 Regenerate Code' : '🎟️ Generate Referral Code'}
                </button>

                {(orgReferralCode || currentOrg?.referralCode) && (
                  <div className="flex-1 min-w-[180px] bg-slate-950 border border-amber-500/30 px-4 py-2.5 rounded-xl font-mono font-black text-sm text-amber-300 tracking-widest select-text text-center">
                    {orgReferralCode || currentOrg?.referralCode}
                  </div>
                )}
              </div>

              {(orgReferralCode || currentOrg?.referralCode) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
                  <p className="text-[9px] text-amber-400/80 font-mono leading-relaxed">
                    📋 Share this code with your agents. Clients enter it in the <strong>"Have a Referral Code?"</strong> section on the login screen. Total referrals tracked: <strong className="text-amber-300">{currentOrg?.referralCount ?? 0}</strong>
                  </p>
                  <div className="flex items-center justify-between p-2 bg-black/30 border border-amber-500/20 rounded-lg">
                    <span className="text-[9px] font-mono text-amber-200/50 truncate pr-2 select-all">
                      safetylink://join?ref={orgReferralCode || currentOrg?.referralCode}
                    </span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`safetylink://join?ref=${orgReferralCode || currentOrg?.referralCode}`)}
                      className="shrink-0 text-[8px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/30 transition-colors uppercase font-bold tracking-wider"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Referred Users List */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-mono">Referred Clients & Earnings</h3>
                  <p className="text-[10px] text-slate-500 mt-1">20% commission per active subscriber (Estimated $2.00/mo).</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-mono font-black text-xs text-center w-full">
                    {referredUsers.length} clients
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono font-black text-xs text-center w-full">
                    ${(referredUsers.length * 2).toFixed(2)}/mo
                  </span>
                </div>
              </div>

              {(() => {
                const code = activeReferralCode;
                const referred = referredUsers;
                if (!code) return (
                  <p className="text-[10px] text-slate-500 font-mono text-center py-6">Generate a referral code above to start tracking clients.</p>
                );
                if (referred.length === 0) return (
                  <p className="text-[10px] text-slate-500 font-mono text-center py-6">No clients have used your referral code yet. Share it with your agents!</p>
                );
                return (
                  <div className="space-y-2">
                    {referred.map((u, idx) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">👤</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-slate-200 block truncate">{u.fullName || u.username}</span>
                          <span className="text-[9px] text-slate-500 font-mono block">{u.email} · {u.phone}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[8px] font-mono text-slate-500 block">#{idx + 1}</span>
                          <span className="text-[8px] font-mono text-emerald-400 block">{u.role || 'Member'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};
