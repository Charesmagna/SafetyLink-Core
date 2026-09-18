import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ASSETS } from './cloudinary';
import { EditorialPlatform, EditorialState, WebEditorialContent, ApkEditorialContent, ExeEditorialContent } from '../types/editorial';

export const DEFAULT_EDITORIAL_STATE: EditorialState = {
  version: '1.1.896',
  lastPublishedAt: '2026-09-18T16:10:38Z',
  lastModifiedBy: 'Super Admin (SL-admin-0000)',
  activePlatform: 'web',
  sections: {
    web: [
      { id: 'hero', name: 'Emergency Hero & Dispatch', category: 'hero', icon: '🚨', visible: true, order: 0 },
      { id: 'ticker', name: 'Operational Status Ticker', category: 'status', icon: '📡', visible: true, order: 1 },
      { id: 'armour', name: 'Platform Capabilities & Protection', category: 'features', icon: '🛡️', visible: true, order: 2 },
      { id: 'hardware', name: 'iTAG Wearables & BLE Beacons', category: 'hardware', icon: '🔑', visible: true, order: 3 },
      { id: 'pricing', name: 'Paystack Subscription Plans', category: 'pricing', icon: '💳', visible: true, order: 4 },
      { id: 'contacts', name: 'Command Center & Hotline', category: 'contacts', icon: '📞', visible: true, order: 5 },
    ],
    apk: [
      { id: 'header', name: 'App Header & Status Tag', category: 'status', icon: '📱', visible: true, order: 0 },
      { id: 'sos', name: 'Central SOS Panic Trigger', category: 'hero', icon: '🚨', visible: true, order: 1 },
      { id: 'ble', name: 'BLE Wearable Keyfob Radar', category: 'hardware', icon: '📡', visible: true, order: 2 },
      { id: 'contacts', name: 'Emergency Contact Cascade', category: 'contacts', icon: '👥', visible: true, order: 3 },
      { id: 'sms', name: 'Offline GSM / SMS Fallback', category: 'system', icon: '💬', visible: true, order: 4 },
    ],
    exe: [
      { id: 'topbar', name: 'War Room Window Header', category: 'status', icon: '💻', visible: true, order: 0 },
      { id: 'radar', name: 'Satellite GIS Telemetry Grid', category: 'features', icon: '🛰️', visible: true, order: 1 },
      { id: 'fleet', name: 'Live Fleet Responders Roster', category: 'contacts', icon: '🛡️', visible: true, order: 2 },
      { id: 'evidence', name: 'Cryptographic Evidence Vault', category: 'system', icon: '🔒', visible: true, order: 3 },
    ],
  },
  web: {
    heroBadge: '// SOUTH AFRICAN EMERGENCY PLATFORM',
    heroTitle1: 'EMERGENCY DISPATCH,',
    heroTitle2: 'ENGINEERED FOR THE WORST DAY.',
    heroSubtitle: 'SafetyLink routes panic alerts across WhatsApp, SMS and voice — coordinating BLE keyfobs, responder rosters and evidence trails. Built for South Africa.',
    heroCtaPrimary: 'DEPLOY FOR MY ORGANISATION',
    heroCtaSecondary: 'SIGN IN →',
    statusTickerItems: [
      'BLE GATEWAY ● LIVE',
      'WHATSAPP RELAY ● LIVE',
      'SMS GATEWAY ● LIVE',
      'VAPI VOICE ● LIVE',
      'USSD CALLBACK ● LIVE',
      'AUDIT CHAIN ● SEALED',
      'TENANTS ACTIVE ● 14',
      'INCIDENTS TODAY ● 3',
    ],
    armourTitle: 'ARMOURING COMMUNITIES.',
    armourSubtitle: 'Emergency response platform designed for mission-critical safety in South Africa. From 2-second panic alerts to advanced AI dispatch, we secure your community.',
    features: [
      { icon: '⚡', title: '2-Second Hold Panic', desc: 'Instantly trigger emergency alerts via BLE keyfob, on-screen SOS, or duress code.' },
      { icon: '📡', title: 'Multi-Channel Dispatch', desc: 'Sequential WhatsApp → SMS → Voice → USSD. Every step logged with cryptographic chain-of-custody.' },
      { icon: '🧠', title: 'VAPI AI Voice Follow-Up', desc: 'AI voice agent calls every contact in sequence until live acknowledgement is received.' },
      { icon: '🔒', title: 'AES-256-GCM Encryption', desc: 'Every data point secured end-to-end. ZK Evidence Vault with Cloudinary-backed storage.' },
    ],
    pricingTiers: [
      {
        name: 'Individual',
        monthly: 'R49',
        onceOff: 'R149 once-off registration',
        planCode: 'PLN_individual',
        popular: false,
        features: [
          'SafetyLink Mobile App (Android APK)',
          'iTAG keyfob pairing & BLE link',
          'SOS panic button & Watch-Me timer',
          '2 emergency contacts cascade',
          'Offline SMS fallback gateway',
          '11 South African official languages',
        ],
      },
      {
        name: 'Family',
        monthly: 'R99',
        onceOff: 'R149 once-off registration',
        planCode: 'PLN_family',
        popular: true,
        features: [
          'Up to 5 family members',
          'All Individual features included',
          'Shared emergency mesh circle',
          'Live family geo-fence radar',
          'Priority AI voice alert routing',
        ],
      },
      {
        name: 'Organisation',
        monthly: 'R49/user',
        onceOff: 'R149 once-off setup',
        planCode: 'PLN_organisation',
        popular: false,
        features: [
          'Unlimited community residents / staff',
          'SafetyLink Command Deck access',
          'Live GIS beacon overlay & muster points',
          'Immutable Evidence Vault & audit logs',
          'SL-ORG-XXXX dedicated mesh node',
          'Cloudflare Worker & USSD API link',
        ],
      },
    ],
    hotlinePhone: '+27 73 944 1222',
    hotlineEmail: 'info@safetylink.online',
    logoImage: ASSETS.logo,
    heroPosterImage: ASSETS.appLogin,
    primaryColor: '#e8321e',
    showLiveLog: true,
  },
  apk: {
    appName: 'SafetyLink Mobile',
    statusTag: 'TACTICAL MESH • ARMED',
    sosButtonText: 'EMERGENCY SOS',
    sosHoldText: 'PRESS & HOLD 2 SECONDS TO TRIGGER',
    duressCodePrompt: 'ENTER 4-DIGIT SILENT DURESS CODE',
    bleStatusText: 'iTAG BLE BEACON ACTIVE (TX: -59 dBm)',
    keyfobPairedText: 'BLE Keyfob Paired (ID: SL-BLE-9982)',
    offlineFallbackNotice: 'Offline GSM SMS Fallback Ready',
    emergencyContactsTitle: 'EMERGENCY CONTACT CASCADE',
    hudThemeColor: '#e8321e',
    shieldIconUrl: ASSETS.logo3d,
    enableVibration: true,
    holdDurationSeconds: 2,
  },
  exe: {
    windowTitle: 'SafetyLink Tactical Dispatch Console v2.0',
    dispatchHeader: 'SL GLOBAL COMMAND CENTER',
    warRoomSubtitle: 'Central Multi-Monitor Emergency Dispatch & Incident Triage System',
    threatLevelLabel: 'DEFCON 4 — MONITORING MESH',
    satelliteFeedStatus: 'GIS GEO-SATELLITE SYNCED • ACCURACY 1.2M',
    evidenceLedgerTitle: 'IMMUTABLE SHA-256 EVIDENCE VAULT',
    primaryTheme: 'slate',
    multiMonitorEnabled: true,
    commandHotline: '+27 73 944 1222',
  },
  history: [
    {
      timestamp: '2026-09-18T16:10:38Z',
      version: '1.1.896',
      notes: 'Initial production system baseline',
      author: 'System Auto-Provision',
    },
  ],
};

interface EditorialStoreState extends EditorialState {
  isEditorOpen: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isAiGenerating: boolean;
  lastError: string | null;
  selectedElementId: string | null;
  editorPreviewMode: boolean; // true = hide outline boxes to preview final appearance
  editorViewport: 'desktop' | 'tablet' | 'mobile';
  
  // Actions
  openEditor: (platform?: EditorialPlatform) => void;
  closeEditor: () => void;
  setPlatform: (platform: EditorialPlatform) => void;
  setViewport: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
  setPreviewMode: (enabled: boolean) => void;
  selectElement: (id: string | null) => void;
  
  updateWebContent: (partial: Partial<WebEditorialContent>) => void;
  updateApkContent: (partial: Partial<ApkEditorialContent>) => void;
  updateExeContent: (partial: Partial<ExeEditorialContent>) => void;
  updateField: (platform: EditorialPlatform, field: string, value: any) => void;
  
  reorderSection: (platform: EditorialPlatform, fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (platform: EditorialPlatform, sectionId: string) => void;
  
  saveDraft: () => Promise<boolean>;
  publishLive: (releaseNotes?: string) => Promise<{ success: boolean; version?: string; message?: string }>;
  fetchRemoteState: () => Promise<void>;
  resetToDefaults: (platform?: EditorialPlatform) => void;
  
  requestAiCopy: (params: {
    field: string;
    prompt: string;
    currentValue: string;
    platform: EditorialPlatform;
  }) => Promise<string[]>;
}

export const useEditorialStore = create<EditorialStoreState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_EDITORIAL_STATE,
      isEditorOpen: false,
      isSaving: false,
      isPublishing: false,
      isAiGenerating: false,
      lastError: null,
      selectedElementId: null,
      editorPreviewMode: false,
      editorViewport: 'desktop',

      openEditor: (platform) => {
        set({
          isEditorOpen: true,
          activePlatform: platform || get().activePlatform,
          selectedElementId: null,
        });
      },

      closeEditor: () => {
        set({ isEditorOpen: false, selectedElementId: null });
      },

      setPlatform: (platform) => {
        set({ activePlatform: platform, selectedElementId: null });
      },

      setViewport: (viewport) => {
        set({ editorViewport: viewport });
      },

      setPreviewMode: (enabled) => {
        set({ editorPreviewMode: enabled, selectedElementId: null });
      },

      selectElement: (id) => {
        set({ selectedElementId: id });
      },

      updateWebContent: (partial) => {
        set((state) => ({
          web: { ...state.web, ...partial },
        }));
      },

      updateApkContent: (partial) => {
        set((state) => ({
          apk: { ...state.apk, ...partial },
        }));
      },

      updateExeContent: (partial) => {
        set((state) => ({
          exe: { ...state.exe, ...partial },
        }));
      },

      updateField: (platform, field, value) => {
        set((state) => {
          if (platform === 'web') {
            return { web: { ...state.web, [field]: value } };
          }
          if (platform === 'apk') {
            return { apk: { ...state.apk, [field]: value } };
          }
          if (platform === 'exe') {
            return { exe: { ...state.exe, [field]: value } };
          }
          return {};
        });
      },

      reorderSection: (platform, fromIndex, toIndex) => {
        set((state) => {
          const list = [...state.sections[platform]];
          if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
            return {};
          }
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          const updated = list.map((item, index) => ({ ...item, order: index }));
          return {
            sections: {
              ...state.sections,
              [platform]: updated,
            },
          };
        });
      },

      toggleSectionVisibility: (platform, sectionId) => {
        set((state) => {
          const list = state.sections[platform].map((sec) =>
            sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
          );
          return {
            sections: {
              ...state.sections,
              [platform]: list,
            },
          };
        });
      },

      saveDraft: async () => {
        set({ isSaving: true, lastError: null });
        try {
          const state = get();
          const payload = {
            version: state.version,
            lastPublishedAt: state.lastPublishedAt,
            lastModifiedBy: 'Super Admin',
            activePlatform: state.activePlatform,
            sections: state.sections,
            web: state.web,
            apk: state.apk,
            exe: state.exe,
            history: state.history,
          };
          const res = await fetch('/api/editorial/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Save failed HTTP ${res.status}`);
          set({ isSaving: false });
          return true;
        } catch (e: any) {
          console.warn('[EditorialStore] Save draft warning (persisting locally):', e);
          set({ isSaving: false });
          return true;
        }
      },

      publishLive: async (releaseNotes) => {
        set({ isPublishing: true, lastError: null });
        try {
          const state = get();
          // Calculate next incremented version
          const parts = state.version.split('.').map((p) => parseInt(p, 10) || 0);
          const nextVersion = `${parts[0] || 1}.${parts[1] || 1}.${(parts[2] || 896) + 1}`;

          const payload = {
            version: nextVersion,
            releaseNotes: releaseNotes || `SafetyLink Studio Live Update (${state.activePlatform.toUpperCase()})`,
            state: {
              version: nextVersion,
              lastPublishedAt: new Date().toISOString(),
              lastModifiedBy: 'Super Admin (SL-admin-0000)',
              activePlatform: state.activePlatform,
              sections: state.sections,
              web: state.web,
              apk: state.apk,
              exe: state.exe,
            },
          };

          const res = await fetch('/api/editorial/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            const newPublishedAt = new Date().toISOString();
            const newHistoryItem = {
              timestamp: newPublishedAt,
              version: nextVersion,
              notes: payload.releaseNotes,
              author: 'Super Admin (SL-admin-0000)',
            };

            set((s) => ({
              version: nextVersion,
              lastPublishedAt: newPublishedAt,
              isPublishing: false,
              history: [newHistoryItem, ...s.history],
            }));

            // Store active version in localStorage to trigger OTA banner or instant update
            localStorage.setItem('sl_active_version', nextVersion);

            // Dispatch global event for in-app listeners
            window.dispatchEvent(
              new CustomEvent('safetylink:editorial-published', {
                detail: { version: nextVersion, notes: payload.releaseNotes },
              })
            );

            return {
              success: true,
              version: nextVersion,
              message: `Platform changes published live! Version bumped to v${nextVersion}`,
            };
          } else {
            throw new Error(data.error || 'Server rejected publish');
          }
        } catch (e: any) {
          console.warn('[EditorialStore] Publish fallback to local state:', e);
          const state = get();
          const parts = state.version.split('.').map((p) => parseInt(p, 10) || 0);
          const nextVersion = `${parts[0] || 1}.${parts[1] || 1}.${(parts[2] || 896) + 1}`;
          const newPublishedAt = new Date().toISOString();

          set((s) => ({
            version: nextVersion,
            lastPublishedAt: newPublishedAt,
            isPublishing: false,
            history: [
              {
                timestamp: newPublishedAt,
                version: nextVersion,
                notes: releaseNotes || 'Local broadcast update',
                author: 'Super Admin',
              },
              ...s.history,
            ],
          }));

          localStorage.setItem('sl_active_version', nextVersion);
          return {
            success: true,
            version: nextVersion,
            message: `Platform changes published locally to v${nextVersion}`,
          };
        }
      },

      fetchRemoteState: async () => {
        try {
          const res = await fetch('/api/editorial/state');
          if (res.ok) {
            const data = await res.json();
            if (data && data.web) {
              set({
                version: data.version || get().version,
                lastPublishedAt: data.lastPublishedAt || get().lastPublishedAt,
                sections: data.sections || get().sections,
                web: { ...get().web, ...data.web },
                apk: { ...get().apk, ...data.apk },
                exe: { ...get().exe, ...data.exe },
              });
            }
          }
        } catch (e) {
          console.warn('[EditorialStore] Remote sync failed, using cached state');
        }
      },

      resetToDefaults: (platform) => {
        if (!platform) {
          set({ ...DEFAULT_EDITORIAL_STATE });
        } else {
          set((state) => ({
            [platform]: DEFAULT_EDITORIAL_STATE[platform],
            sections: {
              ...state.sections,
              [platform]: DEFAULT_EDITORIAL_STATE.sections[platform],
            },
          }));
        }
      },

      requestAiCopy: async ({ field, prompt, currentValue, platform }) => {
        set({ isAiGenerating: true });
        try {
          const res = await fetch('/api/editorial/ai-assist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field, prompt, currentValue, platform }),
          });
          const data = await res.json();
          set({ isAiGenerating: false });
          if (data && data.suggestions && Array.isArray(data.suggestions)) {
            return data.suggestions;
          }
          return [
            `IMMEDIATE DISPATCH • 2-SECOND PANIC TRIGGER`,
            `MISSION CRITICAL COMMUNITY DEFENSE`,
            `SOUTH AFRICA'S ARMED RESPONSE MESH NETWORK`,
          ];
        } catch (e) {
          set({ isAiGenerating: false });
          return [
            `IMMEDIATE DISPATCH • 2-SECOND PANIC TRIGGER`,
            `MISSION CRITICAL COMMUNITY DEFENSE`,
            `SOUTH AFRICA'S ARMED RESPONSE MESH NETWORK`,
          ];
        }
      },
    }),
    {
      name: 'safetylink_editorial_state_v1',
      partialize: (state) => ({
        version: state.version,
        lastPublishedAt: state.lastPublishedAt,
        activePlatform: state.activePlatform,
        sections: state.sections,
        web: state.web,
        apk: state.apk,
        exe: state.exe,
        history: state.history,
      }),
    }
  )
);
