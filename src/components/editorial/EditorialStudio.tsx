import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useEditorialStore } from '../../utils/editorialStore';
import { EditorialPlatform } from '../../types/editorial';
import { ASSETS } from '../../utils/cloudinary';
import { ErrorBoundary } from '../ErrorBoundary';
import { SceneErrorBoundary } from '../three/SceneErrorBoundary';

// Actual live production interfaces & dashboards (zero mockups / zero fake simulations)
const LandingPage = lazy(() => import('../LandingPage').then((m) => ({ default: m.LandingPage })));
const PanicButton = lazy(() => import('../PanicButton').then((m) => ({ default: m.PanicButton })));
const StatusIndicator = lazy(() => import('../StatusIndicator').then((m) => ({ default: m.StatusIndicator })));
const OfflineMap = lazy(() => import('../OfflineMap').then((m) => ({ default: m.OfflineMap })));
const BLEScanner = lazy(() => import('../BLEScanner').then((m) => ({ default: m.BLEScanner })));
const DispatchChain = lazy(() => import('../DispatchChain').then((m) => ({ default: m.DispatchChain })));
const Settings = lazy(() => import('../Settings').then((m) => ({ default: m.Settings })));
const OrgWarRoom = lazy(() => import('../OrgWarRoom').then((m) => ({ default: m.OrgWarRoom })));
const OrgDashboard = lazy(() => import('../OrgDashboard').then((m) => ({ default: m.OrgDashboard })));
const ResponderDashboard = lazy(() => import('../ResponderDashboard').then((m) => ({ default: m.ResponderDashboard })));
const CommandGlobe3DScene = lazy(() => import('../three/CommandGlobe3DScene'));

interface EditorialStudioProps {
  onClose: () => void;
}

type WebSubPage = 'home' | 'platform' | 'hardware' | 'pricing' | 'store' | 'download' | 'enterprise';
type ApkSubTab = 'sos' | 'map' | 'ble' | 'contacts' | 'settings';
type ExeSubView = 'warroom' | 'org' | 'responder' | 'globe';

interface EditableFieldSpec {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color';
  hint: string;
}

const PLATFORM_FIELD_SPECS: Record<EditorialPlatform, EditableFieldSpec[]> = {
  web: [
    { key: 'heroBadge', label: 'Hero Badge Tagline', type: 'text', hint: 'Top pill above main headline on Home' },
    { key: 'heroTitle1', label: 'Hero Headline Line 1', type: 'text', hint: 'Main display title on Landing Home' },
    { key: 'heroTitle2', label: 'Hero Headline Line 2', type: 'text', hint: 'Secondary headline line on Landing Home' },
    { key: 'heroSubtitle', label: 'Hero Subtitle', type: 'textarea', hint: 'Hero lead paragraph beneath headline' },
    { key: 'heroCtaPrimary', label: 'Primary CTA Button', type: 'text', hint: 'Main signup button label' },
    { key: 'heroCtaSecondary', label: 'Secondary CTA Button', type: 'text', hint: 'Organization registration CTA label' },
    { key: 'armourTitle', label: 'How It Works Title', type: 'text', hint: 'Section heading for 3-step response flow' },
    { key: 'armourSubtitle', label: 'How It Works Subtitle', type: 'textarea', hint: 'Supporting description under How It Works' },
    { key: 'hotlinePhone', label: 'Emergency Hotline', type: 'text', hint: 'Shown in live landing footer' },
    { key: 'hotlineEmail', label: 'Support Email', type: 'text', hint: 'Shown in live landing footer' },
    { key: 'logoImage', label: 'Brand Logo URL', type: 'image', hint: 'Live logo rendered in Header' },
    { key: 'primaryColor', label: 'Primary Brand Accent', type: 'color', hint: 'Primary accent color for CTA highlights' },
  ],
  apk: [
    { key: 'appName', label: 'Mobile App Title', type: 'text', hint: 'Displayed in mobile workspace header' },
    { key: 'statusTag', label: 'SOS Actuator Status Tag', type: 'text', hint: 'Live header label above PanicButton' },
    { key: 'sosButtonText', label: 'Main SOS Button Label', type: 'text', hint: 'Live text on central SOS trigger' },
    { key: 'sosHoldText', label: 'SOS Transmitting Text', type: 'text', hint: 'Shown while SOS is actively transmitting' },
    { key: 'bleStatusText', label: 'BLE Hardware Perimeter Label', type: 'text', hint: 'Hardware badge inside PanicButton panel' },
    { key: 'offlineFallbackNotice', label: 'SOS Instruction Notice', type: 'textarea', hint: 'Live helper text under SOS trigger' },
    { key: 'duressCodePrompt', label: 'Silent Duress Prompt', type: 'text', hint: 'Prompt shown on disarm/duress entry' },
    { key: 'shieldIconUrl', label: 'App Shield Logo URL', type: 'image', hint: 'Logo icon displayed in APK header' },
    { key: 'hudThemeColor', label: 'SOS HUD Accent Color', type: 'color', hint: 'Primary actuator highlight color' },
  ],
  exe: [
    { key: 'windowTitle', label: 'Desktop Window Title', type: 'text', hint: 'Desktop application title bar' },
    { key: 'dispatchHeader', label: 'War Room Header', type: 'text', hint: 'Live title bar inside OrgWarRoom' },
    { key: 'warRoomSubtitle', label: 'War Room Subtitle', type: 'text', hint: 'Subtitle below Commander Deck header' },
    { key: 'threatLevelLabel', label: 'Threat Status Banner', type: 'text', hint: 'Live operational status strip' },
    { key: 'satelliteFeedStatus', label: 'GIS Telemetry Badge', type: 'text', hint: 'Live green telemetry pill in War Room' },
    { key: 'evidenceLedgerTitle', label: 'Live Stream / Vault Title', type: 'text', hint: 'Right-panel title in OrgWarRoom' },
    { key: 'commandHotline', label: 'Command Desk Hotline', type: 'text', hint: 'Control-room emergency line' },
  ],
};

const LoadingView: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-full h-full min-h-[420px] flex items-center justify-center bg-slate-950 text-xs font-mono text-emerald-400">
    Loading live {label}...
  </div>
);

export const EditorialStudio: React.FC<EditorialStudioProps> = ({ onClose }) => {
  const {
    version,
    activePlatform,
    setPlatform,
    sections,
    web,
    apk,
    exe,
    publishChannels,
    setPublishChannel,
    getPendingChanges,
    updateField,
    reorderSection,
    toggleSectionVisibility,
    saveDraft,
    publishLive,
    resetToDefaults,
    requestAiCopy,
    isSaving,
    isPublishing,
    isAiGenerating,
  } = useEditorialStore();

  const [platformPickerOpen, setPlatformPickerOpen] = useState(false);
  const [webPage, setWebPage] = useState<WebSubPage>('home');
  const [apkTab, setApkTab] = useState<ApkSubTab>('sos');
  const [exeView, setExeView] = useState<ExeSubView>('warroom');

  const [focusedFieldKey, setFocusedFieldKey] = useState<string>('heroTitle1');
  const [activeTab, setActiveTab] = useState<'sections' | 'assets' | 'theme'>('sections');
  const [previewMode, setPreviewMode] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [pushToGitHub, setPushToGitHub] = useState(true);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    version?: string;
    message?: string;
    error?: string;
    commitSha?: string;
    commitUrl?: string;
    workspaceFiles?: string[];
  } | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingChanges = getPendingChanges();
  const hasChannelSelected = publishChannels.web || publishChannels.apk || publishChannels.exe || publishChannels.worker;

  const activePlatformValues: Record<string, any> =
    activePlatform === 'web' ? web : activePlatform === 'apk' ? apk : exe;
  const fieldSpecs = PLATFORM_FIELD_SPECS[activePlatform];
  const focusedSpec = fieldSpecs.find((f) => f.key === focusedFieldKey) || fieldSpecs[0];
  const focusedValue = String(activePlatformValues[focusedSpec.key] ?? '');

  // Keep focused field synced when switching environments
  useEffect(() => {
    const specs = PLATFORM_FIELD_SPECS[activePlatform];
    if (!specs.some((s) => s.key === focusedFieldKey)) {
      setFocusedFieldKey(specs[0].key);
      setAiSuggestions([]);
    }
  }, [activePlatform, focusedFieldKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    useEditorialStore.getState().fetchRemoteState();
  }, []);

  const handleAiGenerate = async () => {
    const suggestions = await requestAiCopy({
      field: focusedSpec.label,
      prompt: aiPrompt || 'Authoritative South African emergency dispatch copy',
      currentValue: focusedValue,
      platform: activePlatform,
    });
    setAiSuggestions(suggestions);
  };

  const handleApplyAiSuggestion = (text: string) => {
    updateField(activePlatform, focusedSpec.key, text);
    showToast(`Applied to ${focusedSpec.label}`);
  };

  const handleSave = async () => {
    const res = await saveDraft();
    if (res.ok) {
      showToast(`Saved to ${(res.workspaceFiles || ['public/editorial-config.json']).join(', ')}`);
    } else {
      showToast(res.error || 'Save failed — ensure Super Admin session is unlocked');
    }
  };

  const handlePublish = async () => {
    const res = await publishLive({
      notes: releaseNotes || `Editorial update for ${activePlatform.toUpperCase()}`,
      channels: publishChannels,
      pushToGitHub,
    });
    setPublishResult(res);
    if (res.success) {
      showToast(res.message || `Published v${res.version}`);
    } else {
      showToast(res.error || 'Publish failed');
    }
  };

  const MEDIA_PRESETS = [
    { name: 'Official SafetyLink Logo', url: '/logos/Safety_Link_Logo_Transparent.png' },
    { name: '3D Gold Shield Watermark', url: ASSETS.logo3d },
    { name: 'Emergency App Login Poster', url: ASSETS.appLogin },
    { name: 'iTAG BLE Wearable Keyfobs', url: ASSETS.itagAll },
    { name: 'Single iTAG Keyfob Unit', url: ASSETS.itagSingle },
    { name: 'SOS Panic Button Hardware', url: '/panic-button.png' },
    { name: 'Tactical Shield Badge', url: '/safetylink-shield.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* ── TOP STUDIO BAR ── */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-black tracking-widest text-white uppercase hidden sm:inline">
              Live Environment Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
              v{version}
            </span>
            {pendingChanges.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold">
                {pendingChanges.length} change{pendingChanges.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Environment Switcher */}
          <button
            type="button"
            onClick={() => setPlatformPickerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-100 border border-slate-700 transition-all truncate"
            title="Switch Live Target Environment"
          >
            <span className="truncate">
              {activePlatform === 'web' && '🌐 Web · Live Landing Site'}
              {activePlatform === 'apk' && '📱 APK · Live User App'}
              {activePlatform === 'exe' && '💻 EXE · Live Command Dashboards'}
            </span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>
        </div>

        {/* Center: Live View Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              previewMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>{previewMode ? '👁️ Fullscreen Live View' : '✏️ Split Editor'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all"
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>

          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
          >
            <span>🚀 Publish</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-mono transition-all"
            title="Exit Studio"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* ── LEFT SIDEBAR: Structure, Media & Theme ── */}
        {!previewMode && (
          <aside className="hidden xl:flex w-64 bg-slate-900/95 border-r border-slate-800 flex-col z-10 shrink-0">
            <div className="flex border-b border-slate-800 bg-slate-950">
              {(['sections', 'assets', 'theme'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                    activeTab === tab
                      ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'sections' ? '📑 Layout' : tab === 'assets' ? '🖼️ Media' : '🎨 Theme'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeTab === 'sections' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Live Sections ({activePlatform.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => resetToDefaults(activePlatform)}
                      className="text-[9px] font-mono text-slate-500 hover:text-red-400"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {sections[activePlatform].map((sec, idx) => (
                      <div
                        key={sec.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all ${
                          sec.visible
                            ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800/60 text-slate-500 line-through'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{sec.icon}</span>
                          <span className="truncate font-semibold text-[11px]">{sec.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => reorderSection(activePlatform, idx, idx - 1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections[activePlatform].length - 1}
                            onClick={() => reorderSection(activePlatform, idx, idx + 1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(activePlatform, sec.id)}
                            className={`p-1 hover:bg-slate-700 rounded ${sec.visible ? 'text-emerald-400' : 'text-slate-600'}`}
                            title={sec.visible ? 'Hide section' : 'Show section'}
                          >
                            {sec.visible ? '👁️' : '🕶️'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono leading-relaxed">
                    <strong>LIVE INTERFACE MODE:</strong> The center viewport mounts the real production SafetyLink React interfaces &amp; dashboards — not static mockups. Every edit on the right updates live immediately.
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    SafetyLink Asset Library
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDIA_PRESETS.map((asset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const targetKey =
                            focusedSpec.type === 'image'
                              ? focusedSpec.key
                              : activePlatform === 'web'
                                ? 'logoImage'
                                : 'shieldIconUrl';
                          updateField(activePlatform, targetKey, asset.url);
                          showToast(`Applied ${asset.name}`);
                        }}
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-amber-500 cursor-pointer transition-all group flex flex-col items-center text-center"
                      >
                        <div className="w-14 h-14 rounded bg-black/40 flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                          <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 group-hover:text-amber-400 leading-tight">
                          {asset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Primary Accent Swatches
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: 'Armed Emerald', color: '#10b981' },
                      { name: 'Tactical Red', color: '#ef4444' },
                      { name: 'Warning Amber', color: '#f59e0b' },
                      { name: 'Command Blue', color: '#0ea5e9' },
                    ].map((t) => (
                      <button
                        key={t.color}
                        type="button"
                        onClick={() => {
                          if (activePlatform === 'web') updateField('web', 'primaryColor', t.color);
                          if (activePlatform === 'apk') updateField('apk', 'hudThemeColor', t.color);
                          showToast(`Accent updated to ${t.name}`);
                        }}
                        className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2.5 text-xs font-mono text-left hover:border-slate-500 transition-all"
                      >
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-slate-200">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── CENTER STAGE: ACTUAL LIVE INTERFACES & DASHBOARDS ── */}
        <main className="flex-1 bg-slate-950 flex flex-col min-w-0 overflow-hidden">
          {/* Sub-Navigation Bar for Real Live Views */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {activePlatform === 'web' &&
                ([
                  { id: 'home', label: '🏠 Home' },
                  { id: 'platform', label: '📱 Solutions (3D)' },
                  { id: 'hardware', label: '📡 Hardware (3D)' },
                  { id: 'pricing', label: '💎 Pricing' },
                  { id: 'store', label: '🛒 Store' },
                  { id: 'download', label: '⬇️ Downloads' },
                  { id: 'enterprise', label: '🏢 Enterprise' },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWebPage(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase whitespace-nowrap border transition-all ${
                      webPage === item.id
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

              {activePlatform === 'apk' &&
                ([
                  { id: 'sos', label: '🚨 SOS Hub' },
                  { id: 'map', label: '🗺️ Live Map + 3D' },
                  { id: 'ble', label: '📡 BLE Scanner' },
                  { id: 'contacts', label: '👥 Contacts' },
                  { id: 'settings', label: '⚙️ Settings' },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setApkTab(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase whitespace-nowrap border transition-all ${
                      apkTab === item.id
                        ? 'bg-red-600 border-red-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

              {activePlatform === 'exe' &&
                ([
                  { id: 'warroom', label: '🛡️ Org War Room' },
                  { id: 'org', label: '🏢 Org Commander Deck' },
                  { id: 'responder', label: '🚓 Responder Console' },
                  { id: 'globe', label: '🌐 3D Global Command' },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExeView(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase whitespace-nowrap border transition-all ${
                      exeView === item.id
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
              ● REAL LIVE COMPONENT
            </span>
          </div>

          {/* Real Mounted Production Interface Container */}
          <div className="flex-1 overflow-auto min-h-0 relative bg-[#071124]">
            <ErrorBoundary tabName={`Live ${activePlatform.toUpperCase()} Canvas`}>
              {/* 🌐 1. ACTUAL WEB PLATFORM (LandingPage) */}
              {activePlatform === 'web' && (
                <Suspense fallback={<LoadingView label="Landing Website" />}>
                  <LandingPage
                    embedded
                    controlledPage={webPage}
                    onPageChange={(p) => {
                      if (
                        p === 'home' ||
                        p === 'platform' ||
                        p === 'hardware' ||
                        p === 'pricing' ||
                        p === 'store' ||
                        p === 'download' ||
                        p === 'enterprise'
                      ) {
                        setWebPage(p);
                      }
                    }}
                    onLogin={() => showToast('Live preview: Sign-In action triggered')}
                    onRegisterUser={() => showToast('Live preview: User Registration triggered')}
                    onRegisterOrg={() => showToast('Live preview: Organization Registration triggered')}
                  />
                </Suspense>
              )}

              {/* 📱 2. ACTUAL MOBILE APK USER WORKSPACE */}
              {activePlatform === 'apk' && (
                <div className="min-h-full w-full flex justify-center p-4 sm:p-6 bg-slate-950">
                  <div className="w-full max-w-[440px] bg-[#071124] border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col min-h-[720px]">
                    {/* Live App Top Bar */}
                    <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={apk.shieldIconUrl || '/logos/Safety_Link_Logo_Transparent.png'}
                          alt="SafetyLink"
                          className="w-6 h-6 object-contain shrink-0"
                        />
                        <span className="font-mono font-black text-xs text-white uppercase truncate">
                          {apk.appName || 'SafetyLink Mobile'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 uppercase shrink-0">
                        LIVE APK
                      </span>
                    </div>

                    {/* Actual User App Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <Suspense fallback={<LoadingView label="Mobile Workspace" />}>
                        {apkTab === 'sos' && (
                          <div className="space-y-4">
                            <StatusIndicator />
                            <PanicButton />
                          </div>
                        )}
                        {apkTab === 'map' && <OfflineMap />}
                        {apkTab === 'ble' && <BLEScanner />}
                        {apkTab === 'contacts' && <DispatchChain />}
                        {apkTab === 'settings' && <Settings />}
                      </Suspense>
                    </div>

                    {/* Live App Bottom Nav Bar */}
                    <div className="grid grid-cols-5 bg-slate-900 border-t border-slate-800 p-1.5 gap-1 shrink-0">
                      {([
                        { id: 'sos', icon: '🚨', label: 'SOS' },
                        { id: 'map', icon: '🗺️', label: 'Map' },
                        { id: 'ble', icon: '📡', label: 'BLE' },
                        { id: 'contacts', icon: '👥', label: 'Chain' },
                        { id: 'settings', icon: '⚙️', label: 'Setup' },
                      ] as const).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setApkTab(t.id)}
                          className={`py-1.5 rounded-xl flex flex-col items-center text-[9px] font-mono font-bold transition-all ${
                            apkTab === t.id ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-sm">{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 💻 3. ACTUAL DESKTOP EXE / COMMAND DASHBOARDS */}
              {activePlatform === 'exe' && (
                <div className="w-full h-full min-h-[600px] flex flex-col">
                  <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
                    <span className="font-bold text-slate-200 truncate">🛡️ {exe.windowTitle}</span>
                    <span className="text-emerald-400 shrink-0">HOTLINE: {exe.commandHotline || '+27 68 009 911'}</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto">
                    <Suspense fallback={<LoadingView label="Command Dashboard" />}>
                      {exeView === 'warroom' && <OrgWarRoom embedded />}
                      {exeView === 'org' && <OrgDashboard />}
                      {exeView === 'responder' && (
                        <div className="h-[680px]">
                          <ResponderDashboard />
                        </div>
                      )}
                      {exeView === 'globe' && (
                        <div className="h-[680px] p-3">
                          <SceneErrorBoundary title="3D Command Globe" heightClass="h-full">
                            <CommandGlobe3DScene heightClass="h-full" />
                          </SceneErrorBoundary>
                        </div>
                      )}
                    </Suspense>
                  </div>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR: LIVE PROPERTY INSPECTOR & AI COPY ASSISTANT ── */}
        {!previewMode && (
          <aside className="w-80 lg:w-96 bg-slate-900/95 border-l border-slate-800 flex flex-col z-10 shrink-0">
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                ⚙️ Live Property Inspector ({activePlatform.toUpperCase()})
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Instant Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {/* All Live Editable Fields for Active Environment */}
              <div className="space-y-3">
                {fieldSpecs.map((spec) => {
                  const val = String(activePlatformValues[spec.key] ?? '');
                  const isFocused = focusedSpec.key === spec.key;

                  return (
                    <div
                      key={spec.key}
                      onClick={() => {
                        setFocusedFieldKey(spec.key);
                        setAiSuggestions([]);
                      }}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isFocused
                          ? 'bg-slate-950 border-amber-500/70 ring-1 ring-amber-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label
                          htmlFor={`sl-edit-${activePlatform}-${spec.key}`}
                          className="text-[10px] font-mono font-bold text-amber-300 uppercase"
                        >
                          {spec.label}
                        </label>
                        {isFocused && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                            AI Target
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-slate-500 mb-1.5">{spec.hint}</p>

                      {spec.type === 'textarea' ? (
                        <textarea
                          id={`sl-edit-${activePlatform}-${spec.key}`}
                          rows={3}
                          value={val}
                          onFocus={() => setFocusedFieldKey(spec.key)}
                          onChange={(e) => updateField(activePlatform, spec.key, e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-sans text-white focus:border-amber-500 outline-none leading-relaxed"
                        />
                      ) : spec.type === 'color' ? (
                        <div className="flex items-center gap-2">
                          <input
                            id={`sl-edit-${activePlatform}-${spec.key}`}
                            type="color"
                            value={val || '#10b981'}
                            onFocus={() => setFocusedFieldKey(spec.key)}
                            onChange={(e) => updateField(activePlatform, spec.key, e.target.value)}
                            className="h-8 w-12 rounded cursor-pointer border border-slate-700 bg-slate-900"
                          />
                          <input
                            type="text"
                            value={val}
                            onFocus={() => setFocusedFieldKey(spec.key)}
                            onChange={(e) => updateField(activePlatform, spec.key, e.target.value)}
                            className="flex-1 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white outline-none"
                          />
                        </div>
                      ) : spec.type === 'image' ? (
                        <div className="space-y-1.5">
                          <input
                            id={`sl-edit-${activePlatform}-${spec.key}`}
                            type="text"
                            value={val}
                            onFocus={() => setFocusedFieldKey(spec.key)}
                            onChange={(e) => updateField(activePlatform, spec.key, e.target.value)}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-mono text-white outline-none"
                          />
                          <div className="w-full h-14 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-center overflow-hidden p-1">
                            <img src={val} alt={spec.label} className="max-h-full object-contain" />
                          </div>
                        </div>
                      ) : (
                        <input
                          id={`sl-edit-${activePlatform}-${spec.key}`}
                          type="text"
                          value={val}
                          onFocus={() => setFocusedFieldKey(spec.key)}
                          onChange={(e) => updateField(activePlatform, spec.key, e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-sans text-white focus:border-amber-500 outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── AI COPY POLISHER ── */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase">
                    ✨ AI Copy Assistant
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]">
                    {focusedSpec.label}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Instruction (e.g. 'Shorter', 'isiZulu', 'More urgent')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-mono font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {isAiGenerating ? 'Generating...' : `✨ Suggest Copy for ${focusedSpec.label}`}
                </button>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {aiSuggestions.map((sug, si) => (
                      <button
                        key={si}
                        type="button"
                        onClick={() => handleApplyAiSuggestion(sug)}
                        className="w-full text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-sans text-slate-200 hover:text-white transition-all"
                      >
                        "{sug}"
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── ENVIRONMENT PICKER MODAL ── */}
      {platformPickerOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white font-mono">
                  Select Live Target Environment
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Mounts the real production SafetyLink interface for live editing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlatformPickerOpen(false)}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                {
                  id: 'web',
                  icon: '🌐',
                  title: 'SafetyLink.online',
                  desc: 'Live production landing website, 3D hardware showcase, pricing & download hub.',
                },
                {
                  id: 'apk',
                  icon: '📱',
                  title: 'SafetyLink APK',
                  desc: 'Live user workspace: SOS PanicButton, Live Map (OSM/Google/3D/BigDataCloud), BLE Scanner & Settings.',
                },
                {
                  id: 'exe',
                  icon: '💻',
                  title: 'SafetyLink EXE',
                  desc: 'Live Org War Room, Org Commander Deck, Responder Console & 3D Command Globe.',
                },
              ] as const).map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    setPlatform(env.id);
                    setPlatformPickerOpen(false);
                  }}
                  className={`p-5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    activePlatform === env.id
                      ? 'bg-emerald-950/35 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-3xl mb-2">{env.icon}</div>
                    <div className="font-bold text-sm text-white mb-1">{env.title}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{env.desc}</div>
                  </div>
                  <div className="mt-4 text-[10px] font-mono text-emerald-400 font-bold">
                    {activePlatform === env.id ? '● CURRENTLY MOUNTED' : `OPEN LIVE ${env.id.toUpperCase()} →`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH LIVE MODAL ── */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-lg font-black uppercase text-white font-mono">Publish Platform Changes</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPublishModalOpen(false);
                  setPublishResult(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {!publishResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Version:</span>
                    <span className="text-white">v{version}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Next Version:</span>
                    <span className="text-emerald-400 font-bold">
                      v{version.split('.').map((p, i) => (i === 2 ? (parseInt(p, 10) || 1170) + 1 : p)).join('.')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Workspace Files:</span>
                    <span className="text-slate-200">public/editorial-config.json, public/version.json</span>
                  </div>
                </div>

                {/* Target Publish Channels */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block">
                    Select Target Publish Channels
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'web', label: '🌐 Website / Landing', sub: 'safetylink.online' },
                      { key: 'apk', label: '📱 Android APK', sub: 'Mobile build' },
                      { key: 'exe', label: '💻 Windows EXE', sub: 'Desktop console' },
                      { key: 'worker', label: '⚡ Worker API', sub: 'Cloudflare edge' },
                    ] as const).map((ch) => {
                      const active = publishChannels[ch.key];
                      return (
                        <label
                          key={ch.key}
                          className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs font-mono cursor-pointer ${
                            active
                              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setPublishChannel(ch.key, e.target.checked)}
                            className="accent-emerald-500 mt-0.5"
                          />
                          <span>
                            <span className="font-bold block">{ch.label}</span>
                            <span className="text-[9px] text-slate-400">{ch.sub}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {pendingChanges.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 space-y-1 max-h-28 overflow-y-auto text-[10px] font-mono">
                    <div className="text-amber-300 font-bold uppercase">
                      {pendingChanges.length} Configuration Change{pendingChanges.length === 1 ? '' : 's'}:
                    </div>
                    {pendingChanges.map((d) => (
                      <div key={`${d.platform}:${d.key}`} className="text-slate-300 truncate">
                        • [{d.platform.toUpperCase()}] {d.label}: <span className="text-emerald-300">{d.after}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Release Notes / Changelog
                  </label>
                  <input
                    type="text"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="e.g. Updated landing hero headline & command deck copy"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>

                <label className="flex items-start gap-2 p-3 rounded-lg bg-emerald-950/25 border border-emerald-500/30 text-xs text-emerald-200 font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushToGitHub}
                    onChange={(e) => setPushToGitHub(e.target.checked)}
                    className="accent-emerald-500 mt-0.5"
                  />
                  <span>
                    <strong>Push to GitHub (main) &amp; Deploy Selected Channels:</strong> Commits{' '}
                    <span className="text-white">public/editorial-config.json</span> and triggers only the checked workflows above.
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing || !hasChannelSelected}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white text-xs font-mono font-bold shadow-lg"
                  >
                    {isPublishing ? 'Publishing...' : 'Confirm & Publish Selected Channels'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4 font-mono">
                <div className="text-4xl">{publishResult.success ? '🎉' : '⚠️'}</div>
                <div className={`text-sm font-bold ${publishResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {publishResult.success ? publishResult.message : publishResult.error || 'Publish failed'}
                </div>
                {publishResult.commitUrl && (
                  <a
                    href={publishResult.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-emerald-300 underline"
                  >
                    View GitHub Commit {publishResult.commitSha} →
                  </a>
                )}
                {publishResult.workspaceFiles && publishResult.workspaceFiles.length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Updated workspace files: {publishResult.workspaceFiles.join(', ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPublishModalOpen(false);
                    setPublishResult(null);
                  }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999999] bg-slate-900 border border-amber-500/50 text-white px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2">
          <span className="text-amber-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
