import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Clock, 
  Zap,
  Info
} from 'lucide-react';

interface AuditItem {
  id: number;
  step: string;
  category: 'core' | 'native' | 'hardware' | 'gis' | 'organization' | 'security_data' | 'system';
  status: 'COMPLETED' | 'PARTIAL' | 'ABSENT';
  statusLabel: string;
  description: string;
  currentWork: string;
  backlog: string;
}

interface ConsolidatedStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolidatedStatus: React.FC<ConsolidatedStatusProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'PARTIAL' | 'ABSENT'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<AuditItem | null>(null);

  const auditItems: AuditItem[] = [
    {
      id: 1,
      step: 'Repository Audit',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Partial',
      description: 'Audit and repository analysis for structural integrity, Capacitor configuration, and build paths.',
      currentWork: 'Capacitor Android wrapper configured with relative assets and localized offline asset loading.',
      backlog: 'Integrate automated static analyzer on git push and multi-architecture build verification.'
    },
    {
      id: 2,
      step: 'PWA',
      category: 'native',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Progressive Web App support enabling complete system caching and offline stand-alone operations.',
      currentWork: 'Configured standard manifest stubs for local development frame routing.',
      backlog: 'Implement fully customized service worker caching (Workbox) to support offline application boots.'
    },
    {
      id: 3,
      step: 'Web App Manifest',
      category: 'native',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'System asset declarations, launcher icons, splash screen configs, and high-fidelity screen locks.',
      currentWork: 'Icon definitions declared inside asset tree directories.',
      backlog: 'Wire native install banner prompting Android users to pin the platform directly from the browser.'
    },
    {
      id: 4,
      step: 'Home Screen',
      category: 'core',
      status: 'PARTIAL',
      statusLabel: '⚠️ Exists but over-loaded',
      description: 'Primary workspace housing the core central emergency triggers and BLE device diagnostic state indicators.',
      currentWork: 'High-contrast Slate 950 workspace with holding timer and sound triggers implemented.',
      backlog: 'Refactor to split metrics into separate bento cards to lower visual complexity under critical distress.'
    },
    {
      id: 5,
      step: 'Status Screen',
      category: 'core',
      status: 'ABSENT',
      statusLabel: '❌ No dedicated screen',
      description: 'Dedicated hardware and network diagnostics hub providing full-screen real-time connection logging.',
      currentWork: 'Status bar mini tickers available on lockscreen tray.',
      backlog: 'Create a dedicated multi-layered telemetry panel detailing cellular signal, satellite locks, and BLE battery.'
    },
    {
      id: 6,
      step: 'Android Home Screen Widget',
      category: 'native',
      status: 'ABSENT',
      statusLabel: '❌ Simulator only, no native widget',
      description: 'Real home-screen shortcut bypass widget that instantly triggers tactical alerts without opening the app.',
      currentWork: 'High-fidelity visual simulator with satellite counters and heartbeats rendered inside the sandbox.',
      backlog: 'Develop native AppWidgetProvider class backing the homescreen widget in the Java/Kotlin codebase.'
    },
    {
      id: 7,
      step: 'Lock Screen Integration',
      category: 'native',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Dynamic device lockscreen overlay for distress activations with minimal user interaction.',
      currentWork: 'Mock lockscreen wallpaper and swipe trigger simulator implemented.',
      backlog: 'Integrate native system lockscreen widgets using modern Android Glance APIs.'
    },
    {
      id: 8,
      step: 'BLE Wearable Integration',
      category: 'hardware',
      status: 'PARTIAL',
      statusLabel: '⚠️ Core working; battery/reconnect/diagnostics missing',
      description: 'Physical Bluetooth Smart iTag beacon connection tracking to trigger silent panic sequences hands-free.',
      currentWork: 'Web Bluetooth pairing API with manual simulation controls for double-press events fully functional.',
      backlog: 'Implement background auto-reconnection filters and battery telemetry monitoring for low-energy beacons.'
    },
    {
      id: 9,
      step: 'GIS & Navigation',
      category: 'gis',
      status: 'PARTIAL',
      statusLabel: '⚠️ Leaflet map only; no geofence/routing/tracking',
      description: 'Local offline GIS Incident Mapping with responder tracking and geofenced safe-zones.',
      currentWork: 'Leaflet.js mapping module with local caching, incident pins, and live position markers.',
      backlog: 'Add offline geometric routing solvers, dynamic responder tracking vectors, and custom polygon geofencing.'
    },
    {
      id: 10,
      step: 'Offline Mesh Network',
      category: 'gis',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Device-to-device secure relay network routing coordinates during cellular blackouts.',
      currentWork: 'Offline simulator illustrating multihop student handset and patrol vehicle relay paths.',
      backlog: 'Integrate WebRTC mesh fallback networks or Chirp audio-based coordinate transmission.'
    },
    {
      id: 11,
      step: 'Zero-Knowledge Evidence Vault',
      category: 'security_data',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Secure client-side encrypted storage ledger preparing evidentiary chain-of-custody files.',
      currentWork: 'Local state queue for GPS logs and text messages.',
      backlog: 'Build offline asymmetric encryption (AES-GCM/RSA) protecting captured media files prior to sync.'
    },
    {
      id: 12,
      step: 'Multi-Layer Dispatch',
      category: 'organization',
      status: 'PARTIAL',
      statusLabel: '⚠️ Layers 1–2 done; Layers 3–4 missing',
      description: 'Sequential emergency dispatch protocol cascading from SMS to cloud, Twilio gateways, and control rooms.',
      currentWork: 'Layer 1 SMS backup triggers and Layer 2 Firestore cloud sync schemas are defined and active.',
      backlog: 'Connect Layer 3 Twilio voice triggers and Layer 4 Commander Board active SLA timer constraints.'
    },
    {
      id: 13,
      step: 'Twilio Organization Gateway',
      category: 'organization',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Direct organization-managed Twilio API bindings bypass, enabling private billing and independent routing.',
      currentWork: 'Settings input layout for API credentials with mock diagnostic logs.',
      backlog: 'Implement direct client-to-server proxied REST requests to trigger automated emergency phone calls.'
    },
    {
      id: 14,
      step: 'Organization Configuration',
      category: 'organization',
      status: 'PARTIAL',
      statusLabel: '⚠️ 5-field skeleton only',
      description: 'White-label control config enabling companies to alter branding colors, logo assets, and custom SOI routing.',
      currentWork: 'Active configuration state linked to primary org structures.',
      backlog: 'Build full visual theme editor with color pickers and persistent CSS variable injection.'
    },
    {
      id: 15,
      step: 'Standard Operating Instructions',
      category: 'organization',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Flexible checklist templates loaded dynamically depending on incident classification (fire, hijack, medical).',
      currentWork: 'Basic hardcoded text guidelines displayed inside commander decks.',
      backlog: 'Build interactive builder supporting customized checklists with response SLA timers per organization.'
    },
    {
      id: 16,
      step: 'Emergency Contacts',
      category: 'core',
      status: 'PARTIAL',
      statusLabel: '⚠️ Basic; no categories or ordering',
      description: 'Contact cards storage supporting sequential escalation loops when panic event triggers.',
      currentWork: 'Array-backed local list of contacts with toggleable alert flags.',
      backlog: 'Implement drag-and-drop sequencing, custom grouping, and active status tracking.'
    },
    {
      id: 17,
      step: 'User Modes',
      category: 'core',
      status: 'PARTIAL',
      statusLabel: '⚠️ 3 roles only; no role-specific UX',
      description: 'Role-based access routing separating administrators, dispatch operators, and emergency subscribers.',
      currentWork: 'Dynamic component routing for User, Org Dashboard, and Super Admin panels.',
      backlog: 'Integrate strict middleware security tokens and specialized responder mobile UI layouts.'
    },
    {
      id: 18,
      step: 'Safety Node Commander Deck',
      category: 'organization',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Advanced live dispatch screen specialized for campus control rooms and security company commands.',
      currentWork: 'Fully operational responsive dashboard showing active incident feeds, lists, and White-Label branding QR badges.',
      backlog: 'Integrate real-time socket events for guard dispatching and live dispatcher voice integration.'
    },
    {
      id: 19,
      step: 'Super Admin Platform',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Basic CRUD; no subscriptions/workflow',
      description: 'The master Global Command Center for approving new company applications and managing tenant billing.',
      currentWork: 'Holographic Super Admin screen with pending organizations approval workflow and live telemetry ticker.',
      backlog: 'Implement actual stripe subscription billing webhooks and automated verification loops.'
    },
    {
      id: 20,
      step: 'Org Onboarding Workflow',
      category: 'organization',
      status: 'PARTIAL',
      statusLabel: '⚠️ Registration + approval button only',
      description: 'Process where entities register, wait for Super Admin approval, and auto-generate secure onboarding tokens.',
      currentWork: 'Apply and Approve workflow fully wired into the local state store; system generates 6-character node tokens.',
      backlog: 'Create custom welcome packages, automated onboarding emails, and registration tutorials.'
    },
    {
      id: 21,
      step: 'Database Architecture',
      category: 'security_data',
      status: 'PARTIAL',
      statusLabel: '⚠️ No SQLite/Firestore; types incomplete',
      description: 'Structured database schemas supporting offline local indexing and online cross-device synchronization.',
      currentWork: 'In-memory state managers with standard typescript type guards.',
      backlog: 'Incorporate SQLite Capacitor drivers for on-device persistence, backed by online Firestore sync rules.'
    },
    {
      id: 22,
      step: 'Media Hub',
      category: 'core',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Resource center detailing operational walkthroughs, training videos, and SOP guidelines.',
      currentWork: 'Basic mock list layout and placeholders.',
      backlog: 'Implement video streaming players, offline asset managers, and downloadable instruction brochures.'
    },
    {
      id: 23,
      step: 'Demo Showcase Mode',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Seed data only',
      description: 'One-click login profiles designed to fast-track stakeholder demonstrations and technical evaluations.',
      currentWork: 'Quick-login cards available in Auth Screen for 4 distinct real roles.',
      backlog: 'Add automated simulation script triggers that run an active panic event automatically for the evaluator.'
    },
    {
      id: 24,
      step: 'Localization',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Framework done; 9 of 11 languages are stubs',
      description: 'Multi-lingual translation support for South African languages ensuring high accessibility.',
      currentWork: 'Translation parser written supporting English, isiZulu, and Afrikaans stubs.',
      backlog: 'Onboard professional translators to complete translation sets for Sesotho, Sepedi, isiXhosa, and others.'
    },
    {
      id: 25,
      step: 'Brand Standardization',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Partial coverage',
      description: 'Strict branding guidelines powered by TM Media Solutions to white-label all operational screens.',
      currentWork: 'TM Media logo display in footer and onboarding pages.',
      backlog: 'Ensure unified font scale rendering and asset alignment across all screens.'
    },
    {
      id: 26,
      step: 'Security',
      category: 'security_data',
      status: 'PARTIAL',
      statusLabel: '⚠️ No encryption; no Firestore rules',
      description: 'E2E transport encryption, strict authentication permissions, and secure cloud storage structures.',
      currentWork: 'Standard client side secure input masking.',
      backlog: 'Author firestore.rules configuration and configure OAuth scopes with token-revocation hooks.'
    },
    {
      id: 27,
      step: 'Performance Optimization',
      category: 'system',
      status: 'ABSENT',
      statusLabel: '❌ Zero implementation',
      description: 'Memory leak prevention, debounced geolocation polling, and low background processor footprints.',
      currentWork: 'React state stabilization avoiding nested loop rerenders.',
      backlog: 'Optimize asset package size and introduce code-splitting for large Leaflet/D3 layouts.'
    },
    {
      id: 28,
      step: 'Code Integration',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ Wired but undocumented',
      description: 'Consolidated module structures integrating telemetry feeds, mesh simulations, and state hooks.',
      currentWork: 'Centralized state store in store.ts coordinating BLE and dispatch loops.',
      backlog: 'Compile comprehensive JSDoc annotations and write full system design reference docs.'
    },
    {
      id: 29,
      step: 'Final Validation',
      category: 'system',
      status: 'PARTIAL',
      statusLabel: '⚠️ CI builds APK; no full validation suite',
      description: 'Continuous Integration testing, visual layout checks, and native APK compilations.',
      currentWork: 'ApkDownloadPopup fully functional with dynamic guides and build terminal instructions.',
      backlog: 'Integrate automated Playwright E2E tests and Appium native test routines.'
    }
  ];

  const totalSteps = auditItems.length;
  const absentCount = auditItems.filter(i => i.status === 'ABSENT').length;
  const partialCount = auditItems.filter(i => i.status === 'PARTIAL').length;
  const completedCount = auditItems.filter(i => i.status === 'COMPLETED').length;

  // Progress rating calculation
  const progressPercent = Math.round(((completedCount + (partialCount * 0.5)) / totalSteps) * 100);

  const filteredItems = auditItems.filter(item => {
    const matchesSearch = item.step.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-hidden animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col h-[85vh] max-h-[750px] relative font-mono text-xs">
        {/* Holographic glowing borders */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold shadow-inner">
              ⚙️
            </div>
            <div>
              <h2 className="text-[12px] font-black uppercase tracking-wider text-slate-100">
                SafetyLink Core Platform Integrity
              </h2>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">
                Consolidated Status Audit & Development Checklist // 29 Core Milestones
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Global Progress Metrics Panel */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 shrink-0 grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px]">
          {/* Progress bar */}
          <div className="sm:col-span-2 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center font-bold text-slate-300">
              <span className="uppercase tracking-wider">Estimated System Completion:</span>
              <span className="text-blue-400 font-black text-xs">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-1.5 border border-slate-850">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-slate-500 uppercase font-bold text-[7.5px] tracking-wider block">Completed</span>
              <span className="text-emerald-400 font-black text-sm">{completedCount}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-slate-500 uppercase font-bold text-[7.5px] tracking-wider block">Partials / Stubs</span>
              <span className="text-amber-400 font-black text-sm">{partialCount}</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500/60" />
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 bg-slate-950/20 border-b border-slate-850 shrink-0 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Filter audit log by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-slate-800 focus:outline-none rounded-xl py-2 pl-9 pr-4 text-[10px] text-slate-300 font-mono"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto">
            {/* Status Selector */}
            <div className="flex bg-slate-950 border border-slate-850 rounded-xl p-0.5 font-bold text-[8.5px]">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
              >
                ALL ({totalSteps})
              </button>
              <button 
                onClick={() => setStatusFilter('PARTIAL')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${statusFilter === 'PARTIAL' ? 'bg-amber-950/40 text-amber-400 font-black' : 'text-slate-500 hover:text-slate-300'}`}
              >
                PARTIAL ({partialCount})
              </button>
              <button 
                onClick={() => setStatusFilter('ABSENT')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${statusFilter === 'ABSENT' ? 'bg-red-950/40 text-red-400 font-black' : 'text-slate-500 hover:text-slate-300'}`}
              >
                BACKLOG ({absentCount})
              </button>
            </div>

            {/* Category Selector */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-2.5 py-1.5 text-[8.5px] font-mono font-bold focus:outline-none"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="core">CORE WORKSPACE</option>
              <option value="native">NATIVE INTEGRATION</option>
              <option value="hardware">HARDWARE BLE</option>
              <option value="gis">GIS / MAPS</option>
              <option value="organization">ORGANIZATION</option>
              <option value="security_data">SECURITY & DATA</option>
              <option value="system">SYSTEM OPERATIONS</option>
            </select>
          </div>
        </div>

        {/* Audit Logs List & Sidebar Panel */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Main list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-md w-full border-r border-slate-800/60">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-start gap-3 relative overflow-hidden ${
                    isSelected 
                      ? 'bg-blue-950/20 border-blue-500/40 shadow-md shadow-blue-950/15' 
                      : 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-900/60 hover:border-slate-800'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-500 mt-0.5 shrink-0 w-4">
                    {String(item.id).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-200 text-[11px] uppercase tracking-wide truncate">{item.step}</p>
                    <p className="text-[8.5px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{item.category.replace('_', ' ')}</p>
                  </div>

                  <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-md ${
                    item.status === 'COMPLETED' ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' :
                    item.status === 'PARTIAL' ? 'bg-amber-950/40 border border-amber-500/20 text-amber-400' :
                    'bg-red-950/40 border border-red-500/20 text-red-400'
                  }`}>
                    {item.status === 'COMPLETED' ? 'OK' : item.status === 'PARTIAL' ? 'PARTIAL' : 'BACKLOG'}
                  </span>
                </button>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-20 text-center text-slate-500 italic text-[10px]">
                No matching development steps found.
              </div>
            )}
          </div>

          {/* Right Detail Panel */}
          <div className="flex-1 bg-slate-950/20 overflow-y-auto p-5 text-left flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[7.5px] font-mono font-black text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                    {selectedItem.category.replace('_', ' ')} UNIT CHECKLIST
                  </span>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    {selectedItem.step}
                  </h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9.5px] font-extrabold text-slate-400">Status:</span>
                    <span className={`text-[9.5px] font-black ${
                      selectedItem.status === 'COMPLETED' ? 'text-emerald-400' :
                      selectedItem.status === 'PARTIAL' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {selectedItem.statusLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-600" />
                    System Specification
                  </span>
                  <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans font-medium">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Currently Functional / Simulated
                  </span>
                  <p className="text-[9px] text-slate-300 leading-relaxed font-sans">
                    {selectedItem.currentWork}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5">
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                    Backlog Development Pipeline
                  </span>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                    {selectedItem.backlog}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 p-4 space-y-2 select-none">
                <ShieldAlert className="w-8 h-8 text-slate-800" />
                <div>
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Milestone Auditor Standby</p>
                  <p className="text-[8.5px] text-slate-500 leading-normal max-w-[200px] mt-1 font-sans">Select any core task on the left column to audit system specifications and code backlog.</p>
                </div>
              </div>
            )}

            {selectedItem && (
              <div className="pt-4 border-t border-slate-800/40">
                <button
                  onClick={() => {
                    alert(`Simulated Upgrade request triggered for: ${selectedItem.step}`);
                  }}
                  className="w-full py-2 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/25 text-[9px] font-black text-blue-400 hover:text-blue-300 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                >
                  <Zap className="w-3 h-3 text-blue-400" />
                  <span>Request Feature Upgrade</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0 text-center text-slate-600 font-bold text-[8.5px] uppercase tracking-widest flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>SECURE PROTOCOL MATRIX // SYSTEM V1.2</span>
          <span className="text-blue-400">POWERED BY TM MEDIA SOLUTIONS</span>
        </div>
      </div>
    </div>
  );
};
