import React, { useState, useEffect } from 'react';
import { useEditorialStore } from '../../utils/editorialStore';
import { EditorialPlatform } from '../../types/editorial';
import { ASSETS } from '../../utils/cloudinary';

interface EditorialStudioProps {
  onClose: () => void;
}

export const EditorialStudio: React.FC<EditorialStudioProps> = ({ onClose }) => {
  const {
    version,
    activePlatform,
    setPlatform,
    sections,
    web,
    apk,
    exe,
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
  const [selectedField, setSelectedField] = useState<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'color';
    value: string;
    platform: EditorialPlatform;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'sections' | 'assets' | 'theme'>('sections');
  const [previewMode, setPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [publishResult, setPublishResult] = useState<{ success: boolean; version?: string; message?: string } | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state on mount
  useEffect(() => {
    useEditorialStore.getState().fetchRemoteState();
  }, []);

  const handleSelectField = (key: string, label: string, type: 'text' | 'textarea' | 'image' | 'color', value: string) => {
    if (previewMode) return;
    setSelectedField({ key, label, type, value, platform: activePlatform });
    setAiSuggestions([]);
  };

  const handleFieldValueChange = (val: string) => {
    if (!selectedField) return;
    setSelectedField(prev => (prev ? { ...prev, value: val } : null));
    updateField(selectedField.platform, selectedField.key, val);
  };

  const handleAiGenerate = async () => {
    if (!selectedField) return;
    const suggestions = await requestAiCopy({
      field: selectedField.label,
      prompt: aiPrompt || 'Authoritative South African emergency dispatch copy',
      currentValue: selectedField.value,
      platform: selectedField.platform,
    });
    setAiSuggestions(suggestions);
  };

  const handleApplyAiSuggestion = (text: string) => {
    if (!selectedField) return;
    handleFieldValueChange(text);
    showToast(`Applied: "${text.substring(0, 30)}..."`);
  };

  const handleSave = async () => {
    const ok = await saveDraft();
    if (ok) showToast('Draft saved successfully');
  };

  const handlePublish = async () => {
    const res = await publishLive(releaseNotes || `Editorial update for ${activePlatform.toUpperCase()}`);
    setPublishResult(res);
    if (res.success) {
      showToast(`Published live! Platform updated to v${res.version}`);
    }
  };

  // Pre-configured asset library for 1-click swapping
  const MEDIA_PRESETS = [
    { name: 'Official SafetyLink Logo', url: ASSETS.logo, category: 'Logo' },
    { name: '3D Gold Shield Watermark', url: ASSETS.logo3d, category: 'Branding' },
    { name: 'Emergency App Login Poster', url: ASSETS.appLogin, category: 'Mockup' },
    { name: 'iTAG BLE Wearable Keyfobs', url: ASSETS.itagAll, category: 'Hardware' },
    { name: 'Single iTAG Keyfob Unit', url: ASSETS.itagSingle, category: 'Hardware' },
    { name: 'SOS Panic Button Hardware', url: '/panic-button.png', category: 'Hardware' },
    { name: 'Tactical Shield Badge', url: '/safetylink-shield.jpg', category: 'Branding' },
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      
      {/* ── TOP APP BAR (Wix-Style Header) ── */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo & Platform Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-black tracking-widest text-white uppercase">
              SafetyLink Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/40">
              v{version}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Platform Selector Button */}
          <button
            onClick={() => setPlatformPickerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 transition-all"
            title="Switch Target Environment"
          >
            <span>
              {activePlatform === 'web' && '🌐 SafetyLink.online (Web)'}
              {activePlatform === 'apk' && '📱 SafetyLink APK (Android)'}
              {activePlatform === 'exe' && '💻 SafetyLink EXE (Desktop)'}
            </span>
            <span className="text-[10px] text-slate-400">▼</span>
          </button>
        </div>

        {/* Center Controls: Zoom & View Mode */}
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="hidden md:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setZoomLevel(z => Math.max(60, z - 10))}
              className="px-1.5 py-0.5 hover:text-white text-slate-400"
              title="Zoom out"
            >
              −
            </button>
            <span className="w-10 text-center text-slate-300">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(130, z + 10))}
              className="px-1.5 py-0.5 hover:text-white text-slate-400"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="text-[9px] px-1 text-slate-500 hover:text-slate-300"
            >
              RESET
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => {
              setPreviewMode(p => !p);
              setSelectedField(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              previewMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>{previewMode ? '👁️ Live Preview Mode' : '✏️ Edit Mode'}</span>
          </button>
        </div>

        {/* Right Actions: Save, Publish, Exit */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all"
          >
            {isSaving ? 'Saving...' : '💾 Save Draft'}
          </button>

          <button
            onClick={() => setPublishModalOpen(true)}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-bold text-xs shadow-lg shadow-red-950/40 transition-all"
          >
            <span>🚀 Publish Live (OTA)</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-300 border border-slate-700 text-xs font-mono transition-all"
            title="Exit Studio"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── LEFT SIDEBAR: Wix/Sitey Component Tree & Assets ── */}
        {!previewMode && (
          <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col z-10 shrink-0">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950">
              <button
                onClick={() => setActiveTab('sections')}
                className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                  activeTab === 'sections'
                    ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📑 Sections
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                  activeTab === 'assets'
                    ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🖼️ Media
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`flex-1 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-center transition-all ${
                  activeTab === 'theme'
                    ? 'text-amber-400 border-b-2 border-amber-500 bg-slate-900/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎨 Theme
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activeTab === 'sections' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Re-order & Toggle Structure
                    </span>
                    <button
                      onClick={() => resetToDefaults(activePlatform)}
                      className="text-[9px] font-mono text-slate-500 hover:text-red-400"
                    >
                      Reset Order
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {sections[activePlatform].map((sec, idx) => (
                      <div
                        key={sec.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition-all ${
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
                          {/* Move Up */}
                          <button
                            disabled={idx === 0}
                            onClick={() => reorderSection(activePlatform, idx, idx - 1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          {/* Move Down */}
                          <button
                            disabled={idx === sections[activePlatform].length - 1}
                            onClick={() => reorderSection(activePlatform, idx, idx + 1)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          {/* Visibility Toggle */}
                          <button
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

                  <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300 font-mono">
                    💡 <strong>Pro Tip:</strong> Click any element in the live canvas on the right to edit its wording, image, or action directly!
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    SafetyLink Asset Library
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDIA_PRESETS.map((asset, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (selectedField?.type === 'image') {
                            handleFieldValueChange(asset.url);
                            showToast(`Updated image to: ${asset.name}`);
                          } else {
                            // Default to updating hero poster or logo
                            updateField(activePlatform, activePlatform === 'web' ? 'logoImage' : 'shieldIconUrl', asset.url);
                            showToast(`Selected: ${asset.name}`);
                          }
                        }}
                        className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-amber-500 cursor-pointer transition-all group flex flex-col items-center text-center"
                      >
                        <div className="w-16 h-16 rounded bg-black/40 flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                          <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 group-hover:text-amber-400 leading-tight">
                          {asset.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Primary Tactical Accent
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Tactical Red', color: '#e8321e' },
                      { name: 'Armed Emerald', color: '#10b981' },
                      { name: 'Warning Amber', color: '#f59e0b' },
                      { name: 'Cyber Blue', color: '#0ea5e9' },
                    ].map(t => (
                      <button
                        key={t.color}
                        onClick={() => {
                          if (activePlatform === 'web') updateField('web', 'primaryColor', t.color);
                          if (activePlatform === 'apk') updateField('apk', 'hudThemeColor', t.color);
                          showToast(`Accent set to ${t.name}`);
                        }}
                        className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs font-mono text-left hover:border-slate-500 transition-all"
                      >
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-slate-200">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── CENTER CANVAS: Live Interactive Platform Device Simulator ── */}
        <main className="flex-1 bg-slate-950/90 overflow-auto flex items-center justify-center p-6 relative">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className="w-full max-w-5xl flex justify-center py-6"
          >
            {/* 🌐 1. WEB PLATFORM SIMULATOR (safetylink.online) */}
            {activePlatform === 'web' && (
              <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 font-sans">
                {/* Browser Top Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
                    <span className="text-emerald-400">🔒</span>
                    <span>https://safetylink.online</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">LIVE PRODUCTION WEB</span>
                </div>

                {/* Simulated Web Navigation */}
                <div className="bg-slate-950/80 border-b border-slate-800/60 px-6 py-3 flex items-center justify-between backdrop-blur">
                  <div
                    onClick={() => handleSelectField('logoImage', 'Brand Logo URL', 'image', web.logoImage)}
                    className={`flex items-center gap-2.5 cursor-pointer p-1 rounded transition-all ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    <img src={web.logoImage} alt="Logo" className="h-8 w-16 object-contain" />
                    <span className="font-black text-white tracking-wider text-sm uppercase font-mono">SafetyLink</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSelectField('heroCtaSecondary', 'Sign In Button Label', 'text', web.heroCtaSecondary)}
                      className={`text-xs font-mono text-slate-400 hover:text-white p-1 rounded ${
                        !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                      }`}
                    >
                      {web.heroCtaSecondary}
                    </button>
                    <button
                      onClick={() => handleSelectField('heroCtaPrimary', 'Primary Action Button Label', 'text', web.heroCtaPrimary)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold text-white uppercase transition-all ${
                        !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                      }`}
                      style={{ backgroundColor: web.primaryColor }}
                    >
                      {web.heroCtaPrimary}
                    </button>
                  </div>
                </div>

                {/* Web Content Body */}
                <div className="p-8 space-y-12">
                  {/* Hero Section */}
                  {sections.web.find(s => s.id === 'hero')?.visible && (
                    <div className="relative text-center max-w-3xl mx-auto py-10">
                      {/* Badge */}
                      <div
                        onClick={() => handleSelectField('heroBadge', 'Hero Eyebrow Badge', 'text', web.heroBadge)}
                        className={`inline-block mb-3 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-red-400 bg-red-950/40 border border-red-500/30 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.heroBadge}
                      </div>

                      {/* Main Titles */}
                      <h1
                        onClick={() => handleSelectField('heroTitle1', 'Hero Headline Line 1', 'text', web.heroTitle1)}
                        className={`text-4xl md:text-5xl font-black tracking-tight cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.heroTitle1}
                      </h1>
                      <h2
                        onClick={() => handleSelectField('heroTitle2', 'Hero Headline Line 2', 'text', web.heroTitle2)}
                        className={`text-4xl md:text-5xl font-black tracking-tight text-slate-400 mb-6 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.heroTitle2}
                      </h2>

                      {/* Subtitle */}
                      <p
                        onClick={() => handleSelectField('heroSubtitle', 'Hero Descriptive Subtitle', 'textarea', web.heroSubtitle)}
                        className={`text-base text-slate-300 leading-relaxed max-w-xl mx-auto mb-8 cursor-pointer p-2 rounded ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.heroSubtitle}
                      </p>

                      {/* Primary Buttons */}
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleSelectField('heroCtaPrimary', 'Primary Action Button Label', 'text', web.heroCtaPrimary)}
                          className={`px-6 py-3 rounded-xl font-mono font-black text-xs uppercase tracking-wider text-white shadow-xl ${
                            !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                          }`}
                          style={{ backgroundColor: web.primaryColor }}
                        >
                          {web.heroCtaPrimary}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Ticker Section */}
                  {sections.web.find(s => s.id === 'ticker')?.visible && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-4 overflow-hidden">
                      <span className="text-[10px] font-mono text-red-500 font-bold shrink-0">● OPERATIONAL STATUS:</span>
                      <div className="flex gap-4 text-[11px] font-mono text-slate-400">
                        {web.statusTickerItems.slice(0, 4).map((item, i) => (
                          <span key={i} className="whitespace-nowrap">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features Grid */}
                  {sections.web.find(s => s.id === 'armour')?.visible && (
                    <div>
                      <h3
                        onClick={() => handleSelectField('armourTitle', 'Capabilities Title', 'text', web.armourTitle)}
                        className={`text-2xl font-black uppercase tracking-tight mb-2 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.armourTitle}
                      </h3>
                      <p
                        onClick={() => handleSelectField('armourSubtitle', 'Capabilities Subtitle', 'textarea', web.armourSubtitle)}
                        className={`text-xs text-slate-400 mb-6 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {web.armourSubtitle}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {web.features.map((f, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectField(`features[${idx}].title`, `Feature ${idx + 1} Title`, 'text', f.title)}
                            className={`p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex gap-3 cursor-pointer ${
                              !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                            }`}
                          >
                            <span className="text-2xl">{f.icon}</span>
                            <div>
                              <div className="font-bold text-sm text-white">{f.title}</div>
                              <div className="text-xs text-slate-400">{f.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Plans */}
                  {sections.web.find(s => s.id === 'pricing')?.visible && (
                    <div className="pt-6">
                      <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-center">
                        Simple Pricing & Subscriptions
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {web.pricingTiers.map((p, idx) => (
                          <div
                            key={p.name}
                            className={`p-5 rounded-xl border flex flex-col justify-between ${
                              p.popular ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900/40 border-slate-800'
                            }`}
                          >
                            <div>
                              <div className="text-[10px] font-mono text-slate-400 uppercase">{p.name}</div>
                              <div className="text-3xl font-black my-1 text-white">{p.monthly}</div>
                              <div className="text-[10px] text-amber-400 mb-3">{p.onceOff}</div>
                              <ul className="text-xs space-y-1 text-slate-300">
                                {p.features.map((ft, fi) => (
                                  <li key={fi}>✓ {ft}</li>
                                ))}
                              </ul>
                            </div>
                            <button
                              className="w-full mt-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold"
                            >
                              Subscribe {p.monthly}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 📱 2. APK MOBILE SIMULATOR (SafetyLink Android APK) */}
            {activePlatform === 'apk' && (
              <div className="w-[380px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col font-sans">
                {/* Phone Notch & Dynamic Island */}
                <div className="h-7 bg-black flex items-center justify-between px-6 text-[10px] font-mono text-slate-400">
                  <span>07:46</span>
                  <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
                  <span>5G ● 98%</span>
                </div>

                {/* App Header */}
                <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <div
                    onClick={() => handleSelectField('appName', 'Mobile App Name', 'text', apk.appName)}
                    className={`flex items-center gap-2 cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    <img src={apk.shieldIconUrl} alt="Shield" className="w-6 h-6 object-contain" />
                    <span className="font-mono font-black text-xs uppercase text-white">{apk.appName}</span>
                  </div>

                  <span
                    onClick={() => handleSelectField('statusTag', 'Tactical Status Tag', 'text', apk.statusTag)}
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    {apk.statusTag}
                  </span>
                </div>

                {/* Mobile App Canvas */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-6">
                  {/* Central Big SOS Trigger */}
                  <div className="flex flex-col items-center justify-center my-6">
                    <div
                      onClick={() => handleSelectField('sosButtonText', 'Main SOS Button Label', 'text', apk.sosButtonText)}
                      className={`w-48 h-48 rounded-full flex flex-col items-center justify-center text-center p-4 cursor-pointer shadow-2xl transition-all ${
                        !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                      }`}
                      style={{
                        background: `radial-gradient(circle, ${apk.hudThemeColor} 0%, #7f1d1d 100%)`,
                        boxShadow: `0 0 40px ${apk.hudThemeColor}60`,
                      }}
                    >
                      <span className="text-3xl mb-1">🚨</span>
                      <span className="font-black text-lg tracking-wider text-white uppercase font-mono">
                        {apk.sosButtonText}
                      </span>
                    </div>

                    <div
                      onClick={() => handleSelectField('sosHoldText', 'SOS Press & Hold Prompt', 'text', apk.sosHoldText)}
                      className={`mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-wider text-center cursor-pointer ${
                        !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                      }`}
                    >
                      {apk.sosHoldText}
                    </div>
                  </div>

                  {/* BLE Keyfob Status Card */}
                  <div
                    onClick={() => handleSelectField('bleStatusText', 'BLE Telemetry Status Text', 'text', apk.bleStatusText)}
                    className={`p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔑</span>
                      <div>
                        <div className="text-[11px] font-bold text-white">iTAG Beacon Active</div>
                        <div className="text-[9px] font-mono text-slate-400">{apk.bleStatusText}</div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  {/* Offline GSM SMS Notice */}
                  <div
                    onClick={() => handleSelectField('offlineFallbackNotice', 'Offline Fallback Notice', 'text', apk.offlineFallbackNotice)}
                    className={`p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-[10px] font-mono text-slate-400 cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    📡 {apk.offlineFallbackNotice}
                  </div>

                  {/* Duress Code Prompt */}
                  <div
                    onClick={() => handleSelectField('duressCodePrompt', 'Silent Duress Code Prompt', 'text', apk.duressCodePrompt)}
                    className={`text-center text-[10px] font-mono text-slate-500 cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    🔒 {apk.duressCodePrompt}
                  </div>
                </div>

                {/* Android Bottom Navigation Bar */}
                <div className="h-10 bg-black flex items-center justify-center pb-2">
                  <div className="w-32 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            )}

            {/* 💻 3. EXE DESKTOP SIMULATOR (SafetyLink Desktop EXE) */}
            {activePlatform === 'exe' && (
              <div className="w-full bg-slate-950 rounded-xl border border-slate-700 shadow-2xl overflow-hidden font-sans">
                {/* Windows Window Header */}
                <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
                  <div
                    onClick={() => handleSelectField('windowTitle', 'Desktop Window Title', 'text', exe.windowTitle)}
                    className={`flex items-center gap-2 text-xs font-mono font-bold text-slate-300 cursor-pointer ${
                      !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                    }`}
                  >
                    <span className="text-red-500">🛡️</span>
                    <span>{exe.windowTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-700 text-slate-300 flex items-center justify-center text-[9px]">_</span>
                    <span className="w-3 h-3 rounded bg-slate-700 text-slate-300 flex items-center justify-center text-[9px]">□</span>
                    <span className="w-3 h-3 rounded bg-red-600 text-white flex items-center justify-center text-[9px]">✕</span>
                  </div>
                </div>

                {/* EXE Console Dashboard */}
                <div className="p-6 space-y-6">
                  {/* Header Banner */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2
                        onClick={() => handleSelectField('dispatchHeader', 'Command Center Header', 'text', exe.dispatchHeader)}
                        className={`text-2xl font-black font-mono uppercase text-white cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {exe.dispatchHeader}
                      </h2>
                      <p
                        onClick={() => handleSelectField('warRoomSubtitle', 'War Room Subtitle', 'text', exe.warRoomSubtitle)}
                        className={`text-xs font-mono text-slate-400 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {exe.warRoomSubtitle}
                      </p>
                    </div>

                    <div
                      onClick={() => handleSelectField('threatLevelLabel', 'Threat Level Tag', 'text', exe.threatLevelLabel)}
                      className={`px-3 py-1 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold cursor-pointer ${
                        !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                      }`}
                    >
                      {exe.threatLevelLabel}
                    </div>
                  </div>

                  {/* Multi-Monitor GIS Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 h-64 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>SATELLITE GIS RADAR (LIVE)</span>
                        <span className="text-emerald-400">● 14 NODES CONNECTED</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-xs">
                        [ HIGH-RESOLUTION SATELLITE TILES & INCIDENT CLUSTERS ]
                      </div>
                      <div
                        onClick={() => handleSelectField('satelliteFeedStatus', 'GIS Telemetry Status', 'text', exe.satelliteFeedStatus)}
                        className={`text-[10px] font-mono text-emerald-400/80 cursor-pointer ${
                          !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                        }`}
                      >
                        {exe.satelliteFeedStatus}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div
                          onClick={() => handleSelectField('evidenceLedgerTitle', 'Evidence Vault Title', 'text', exe.evidenceLedgerTitle)}
                          className={`text-xs font-mono font-bold text-white mb-2 cursor-pointer ${
                            !previewMode ? 'hover:outline hover:outline-dashed hover:outline-amber-400' : ''
                          }`}
                        >
                          {exe.evidenceLedgerTitle}
                        </div>
                        <div className="space-y-2 text-[10px] font-mono text-slate-400">
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            ✓ Block #49281 • Sealed
                          </div>
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            ✓ Incident #082 • Audio Recorded
                          </div>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg">
                        BROADCAST ALL RESPONDERS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR: Wix/Sitey Property Inspector & AI Assistant ── */}
        {!previewMode && (
          <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col z-10 shrink-0">
            <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                ⚙️ Property Inspector
              </span>
              {selectedField && (
                <button
                  onClick={() => setSelectedField(null)}
                  className="text-[10px] text-slate-400 hover:text-white font-mono"
                >
                  Deselect
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {selectedField ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Target Element
                    </label>
                    <div className="text-xs font-bold text-amber-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                      {selectedField.label}
                    </div>
                  </div>

                  {/* Text or Image Input */}
                  {selectedField.type === 'textarea' ? (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Content Text
                      </label>
                      <textarea
                        rows={4}
                        value={selectedField.value}
                        onChange={e => handleFieldValueChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-sans text-white focus:border-amber-500 outline-none leading-relaxed"
                      />
                    </div>
                  ) : selectedField.type === 'image' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Image Asset URL
                      </label>
                      <input
                        type="text"
                        value={selectedField.value}
                        onChange={e => handleFieldValueChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-amber-500 outline-none"
                      />
                      <div className="w-full h-24 rounded-lg bg-black/50 border border-slate-800 flex items-center justify-center overflow-hidden">
                        <img src={selectedField.value} alt="Preview" className="max-h-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Content Text
                      </label>
                      <input
                        type="text"
                        value={selectedField.value}
                        onChange={e => handleFieldValueChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-sans text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}

                  {/* ── AI COPY POLISHER (GEMINI) ── */}
                  <div className="pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-amber-400">✨</span>
                      <span className="text-[11px] font-mono font-bold text-white uppercase">
                        Gemini AI Assistant
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Context (e.g. 'More urgent', 'isiZulu translation')"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-200 outline-none placeholder:text-slate-600"
                      />
                      <button
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-mono font-bold text-xs shadow transition-all disabled:opacity-50"
                      >
                        {isAiGenerating ? 'Generating Suggestions...' : '✨ Generate AI Variations'}
                      </button>

                      {aiSuggestions.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[9px] font-mono text-slate-400 uppercase block">
                            Click to apply:
                          </span>
                          {aiSuggestions.map((sug, si) => (
                            <div
                              key={si}
                              onClick={() => handleApplyAiSuggestion(sug)}
                              className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-amber-500 cursor-pointer text-xs font-sans text-slate-300 hover:text-white transition-all"
                            >
                              "{sug}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
                  <div className="text-2xl">👆</div>
                  <div>Click any element in the live simulator to inspect and edit its wording or media.</div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── PLATFORM PICKER MODAL (Wix/Sitey Environment Switcher) ── */}
      {platformPickerOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white font-mono">
                  Select Target Environment
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Which platform structure would you like to visually customize?
                </p>
              </div>
              <button
                onClick={() => setPlatformPickerOpen(false)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Web */}
              <div
                onClick={() => {
                  setPlatform('web');
                  setPlatformPickerOpen(false);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  activePlatform === 'web'
                    ? 'bg-amber-950/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-3xl mb-2">🌐</div>
                  <div className="font-bold text-sm text-white mb-1">SafetyLink.online</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Live Web Platform, Hero Dispatch, Pricing Tiers, and Responder Portal.
                  </div>
                </div>
                <div className="mt-4 text-[10px] font-mono text-amber-400 font-bold">
                  {activePlatform === 'web' ? '● CURRENTLY ACTIVE' : 'SELECT WEB →'}
                </div>
              </div>

              {/* Option 2: APK */}
              <div
                onClick={() => {
                  setPlatform('apk');
                  setPlatformPickerOpen(false);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  activePlatform === 'apk'
                    ? 'bg-amber-950/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-3xl mb-2">📱</div>
                  <div className="font-bold text-sm text-white mb-1">SafetyLink APK</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Android Mobile Shell, Big SOS Button, BLE Keyfob radar, and GSM offline SMS.
                  </div>
                </div>
                <div className="mt-4 text-[10px] font-mono text-amber-400 font-bold">
                  {activePlatform === 'apk' ? '● CURRENTLY ACTIVE' : 'SELECT APK →'}
                </div>
              </div>

              {/* Option 3: EXE */}
              <div
                onClick={() => {
                  setPlatform('exe');
                  setPlatformPickerOpen(false);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  activePlatform === 'exe'
                    ? 'bg-amber-950/30 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-3xl mb-2">💻</div>
                  <div className="font-bold text-sm text-white mb-1">SafetyLink EXE</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Windows Desktop Console, Multi-Monitor War Room, Satellite GIS telemetry.
                  </div>
                </div>
                <div className="mt-4 text-[10px] font-mono text-amber-400 font-bold">
                  {activePlatform === 'exe' ? '● CURRENTLY ACTIVE' : 'SELECT EXE →'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLISH LIVE MODAL (OTA Broadcast) ── */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-lg font-black uppercase text-white font-mono">
                  Publish Platform Changes
                </h3>
              </div>
              <button
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
                      v{version.split('.').map((p, i) => i === 2 ? (parseInt(p, 10) || 896) + 1 : p).join('.')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Platforms:</span>
                    <span className="text-amber-400">Web • APK • EXE</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Release Notes / Changelog
                  </label>
                  <input
                    type="text"
                    value={releaseNotes}
                    onChange={e => setReleaseNotes(e.target.value)}
                    placeholder="e.g. Updated emergency headlines & new hero branding"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
                  📡 <strong>Live OTA Broadcast:</strong> Connected users will receive an in-app "Update Available" notification and will instantly pull these new texts, images, and layout without redownloading a full APK binary!
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-mono font-bold shadow-lg"
                  >
                    {isPublishing ? 'Broadcasting Update...' : 'Confirm & Publish Live'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4 font-mono">
                <div className="text-4xl">🎉</div>
                <div className="text-base font-bold text-emerald-400">
                  {publishResult.message}
                </div>
                <p className="text-xs text-slate-400">
                  The live platform version has been incremented to v{publishResult.version}. All clients will pull this updated layout.
                </p>
                <button
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999999] bg-slate-900 border border-amber-500/50 text-white px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-slideUp">
          <span className="text-amber-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
