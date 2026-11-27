import { create } from 'zustand';
import {
  EditorialPlatform,
  EditorialSection,
  EditorialFieldDiff,
  PublishChannels,
  WebEditorialContent,
  ApkEditorialContent,
  ExeEditorialContent,
} from '../types/editorial';
import { useAppStore } from './store';

export interface EditorialSnapshot {
  version: string;
  sections: Record<EditorialPlatform, EditorialSection[]>;
  web: WebEditorialContent;
  apk: ApkEditorialContent;
  exe: ExeEditorialContent;
}

export interface EditorialSaveResult {
  ok: boolean;
  savedAt?: string;
  workspaceFiles?: string[];
  error?: string;
}

export interface EditorialPublishOptions {
  notes?: string;
  channels?: PublishChannels;
  pushToGitHub?: boolean;
  bearerToken?: string;
}

export interface EditorialPublishResult {
  success: boolean;
  version?: string;
  message?: string;
  error?: string;
  channels?: PublishChannels;
  workspaceFiles?: string[];
  commitSha?: string;
  commitUrl?: string;
  workflowsTriggered?: string[];
}

interface EditorialState {
  version: string;
  activePlatform: EditorialPlatform;
  sections: Record<EditorialPlatform, EditorialSection[]>;
  web: WebEditorialContent;
  apk: ApkEditorialContent;
  exe: ExeEditorialContent;
  savedSnapshot: EditorialSnapshot;
  publishChannels: PublishChannels;
  lastSavedAt: string | null;
  lastPublishedAt: string | null;
  lastWorkspaceFiles: string[];
  isSaving: boolean;
  isPublishing: boolean;
  isAiGenerating: boolean;
  setPlatform: (p: EditorialPlatform) => void;
  setPublishChannel: (channel: keyof PublishChannels, enabled: boolean) => void;
  setPublishChannels: (channels: PublishChannels) => void;
  updateField: (platform: EditorialPlatform, key: string, value: any) => void;
  reorderSection: (platform: EditorialPlatform, from: number, to: number) => void;
  toggleSectionVisibility: (platform: EditorialPlatform, id: string) => void;
  getPendingChanges: () => EditorialFieldDiff[];
  saveDraft: (bearerToken?: string) => Promise<EditorialSaveResult>;
  publishLive: (notesOrOptions?: string | EditorialPublishOptions) => Promise<EditorialPublishResult>;
  resetToDefaults: (platform?: EditorialPlatform) => void;
  requestAiCopy: (promptOrParams: any) => Promise<string[]>;
  fetchRemoteState: () => Promise<void>;
}

const defaultWeb: WebEditorialContent = {
  heroBadge: 'South African Emergency Network · POPIA Compliant',
  heroTitle1: 'Protect What Matters Most.',
  heroTitle2: 'Family Security, Reimagined.',
  heroSubtitle:
    'Seamless end-to-end emergency protection from pocket BLE key fob and smartphone to live control-room dispatch — built for South African households, estates, and security companies.',
  heroCtaPrimary: 'Create Free Account',
  heroCtaSecondary: 'Register Organization',
  statusTickerItems: [
    'BLE GATEWAY ● LIVE',
    'FCM ALARM ● LIVE',
    'SMS GATEWAY ● LIVE',
    'CONTROL ROOM ● LIVE',
  ],
  armourTitle: 'Three steps from distress trigger to live response',
  armourSubtitle: 'From pocket BLE key fob to native Android PanicService and live control-room dispatch.',
  features: [
    { icon: '⚡', title: '2-Second Hold Panic', desc: 'Instantly trigger emergency alerts via BLE keyfob or on-screen SOS.' },
    { icon: '📡', title: 'Multi-Channel Dispatch', desc: 'Sequential FCM Loud Alarm -> SMS -> Voice -> Zero-Airtime PCM.' },
    { icon: '🧠', title: 'Live Responder Routing', desc: 'Real-time GPS coordinates and Street View navigation for responders.' },
    { icon: '🔒', title: 'POPIA Compliant Security', desc: 'End-to-end protected telemetry and organization-scoped access.' },
  ],
  pricingTiers: [
    { name: 'Individual', monthly: 'R49', onceOff: 'R149', planCode: 'IND_01', features: ['BLE panic binding', '15 Emergency contacts', 'Offline map'] },
    { name: 'Family Mesh', monthly: 'R129', onceOff: 'R399', planCode: 'FAM_01', popular: true, features: ['Up to 5 family members', 'Watch-Me proactive timer', 'Live guard routing'] },
    { name: 'Estate / Business', monthly: 'R999', onceOff: 'Custom', planCode: 'EST_01', features: ['Unlimited members', 'Guard patrol telemetry', 'Dedicated control desk'] },
  ],
  hotlinePhone: '+27 68 009 911',
  hotlineEmail: 'info@safetylink.online',
  logoImage: '/logos/Safety_Link_Logo_Transparent.png',
  heroPosterImage: '/media/Safetylink_Visual_Overview_Deck.png',
  primaryColor: '#10b981',
  showLiveLog: true,
};

const defaultApk: ApkEditorialContent = {
  appName: 'SafetyLink Mobile',
  statusTag: 'MISSION-CONTROL SOS ACTUATOR',
  sosButtonText: 'HOLD FOR SOS',
  sosHoldText: 'TRANSMITTING DISTRESS SIGNAL',
  duressCodePrompt: 'Enter Duress Safe Code',
  bleStatusText: 'iTAG HARDWARE PERIMETER',
  keyfobPairedText: 'BLE Beacon Linked (UUID: FFE0)',
  offlineFallbackNotice: 'Depress and hold central beacon for 1.5s to initiate sequential security escalation chain.',
  emergencyContactsTitle: 'Rapid Escalation Chain',
  hudThemeColor: '#ef4444',
  shieldIconUrl: '/logos/Safety_Link_Logo_Transparent.png',
  enableVibration: true,
  holdDurationSeconds: 2,
};

const defaultExe: ExeEditorialContent = {
  windowTitle: 'SafetyLink War Room Command',
  dispatchHeader: 'Live GIS Map — Commander Deck',
  warRoomSubtitle: 'Tactical telemetry and responder dispatch control',
  threatLevelLabel: 'OPERATIONAL WATCH — LIVE TELEMETRY',
  satelliteFeedStatus: 'ORBITAL GIS FEED ACTIVE',
  evidenceLedgerTitle: 'Tamper-Evident Evidence Vault',
  primaryTheme: 'slate',
  multiMonitorEnabled: true,
  commandHotline: '+27 68 009 911',
};

const defaultSections: Record<EditorialPlatform, EditorialSection[]> = {
  web: [
    { id: 'hero', name: 'Hero Banner', category: 'hero', icon: '🌟', visible: true, order: 0 },
    { id: 'status', name: 'How It Works', category: 'status', icon: '📡', visible: true, order: 1 },
    { id: 'armour', name: 'BLE Hardware Showcase', category: 'features', icon: '🛡️', visible: true, order: 2 },
    { id: 'explore', name: 'Explore Cards', category: 'features', icon: '📱', visible: true, order: 3 },
    { id: 'downloads', name: 'Download Hub', category: 'system', icon: '⬇️', visible: true, order: 4 },
  ],
  apk: [
    { id: 'hero', name: 'SOS Action Hub', category: 'hero', icon: '🚨', visible: true, order: 0 },
    { id: 'status', name: 'Hardware BLE Sensor', category: 'status', icon: '📡', visible: true, order: 1 },
    { id: 'features', name: 'Emergency Chain', category: 'contacts', icon: '👥', visible: true, order: 2 },
  ],
  exe: [
    { id: 'hero', name: 'Command Deck', category: 'hero', icon: '🖥️', visible: true, order: 0 },
    { id: 'status', name: 'GIS Fleet Map', category: 'system', icon: '🗺️', visible: true, order: 1 },
    { id: 'features', name: 'Incident Logs', category: 'features', icon: '📋', visible: true, order: 2 },
  ],
};

const defaultChannels: PublishChannels = {
  web: true,
  apk: true,
  exe: true,
  worker: false,
};

const FIELD_LABELS: Record<string, string> = {
  heroBadge: 'Hero Badge Tagline',
  heroTitle1: 'Primary Title Line 1',
  heroTitle2: 'Secondary Title Line 2',
  heroSubtitle: 'Hero Subtitle',
  heroCtaPrimary: 'Primary CTA Button',
  heroCtaSecondary: 'Secondary CTA Button',
  armourTitle: 'How It Works Headline',
  armourSubtitle: 'How It Works Subtitle',
  hotlinePhone: 'Emergency Hotline',
  hotlineEmail: 'Support Email',
  primaryColor: 'Accent Color',
  logoImage: 'Brand Logo',
  appName: 'APK App Name',
  statusTag: 'SOS Status Header',
  sosButtonText: 'SOS Button Label',
  sosHoldText: 'SOS Transmitting Label',
  bleStatusText: 'BLE Hardware Tag',
  offlineFallbackNotice: 'SOS Actuator Description',
  hudThemeColor: 'APK HUD Color',
  windowTitle: 'EXE Window Title',
  dispatchHeader: 'War Room Header',
  warRoomSubtitle: 'War Room Subtitle',
  threatLevelLabel: 'Threat Status Banner',
  evidenceLedgerTitle: 'Evidence Ledger Title',
};

const cloneSnapshot = (s: EditorialSnapshot): EditorialSnapshot => JSON.parse(JSON.stringify(s));

const initialSnapshot: EditorialSnapshot = {
  version: '1.1.1170',
  sections: defaultSections,
  web: defaultWeb,
  apk: defaultApk,
  exe: defaultExe,
};

const resolveAdminBearer = (override?: string): string => {
  if (override && override.trim()) return override.trim();
  const st = useAppStore.getState();
  return (st.localAdminToken || '').trim();
};

export const useEditorialStore = create<EditorialState>((set, get) => ({
  version: '1.1.1170',
  activePlatform: 'web',
  sections: cloneSnapshot(initialSnapshot).sections,
  web: cloneSnapshot(initialSnapshot).web,
  apk: cloneSnapshot(initialSnapshot).apk,
  exe: cloneSnapshot(initialSnapshot).exe,
  savedSnapshot: cloneSnapshot(initialSnapshot),
  publishChannels: { ...defaultChannels },
  lastSavedAt: null,
  lastPublishedAt: null,
  lastWorkspaceFiles: [],
  isSaving: false,
  isPublishing: false,
  isAiGenerating: false,

  setPlatform: (p) => set({ activePlatform: p }),

  setPublishChannel: (channel, enabled) =>
    set((state) => ({
      publishChannels: { ...state.publishChannels, [channel]: enabled },
    })),

  setPublishChannels: (channels) => set({ publishChannels: { ...channels } }),

  updateField: (platform, key, value) => {
    set((state) => {
      if (platform === 'web') {
        return { web: { ...state.web, [key]: value } };
      }
      if (platform === 'apk') {
        return { apk: { ...state.apk, [key]: value } };
      }
      if (platform === 'exe') {
        return { exe: { ...state.exe, [key]: value } };
      }
      return state;
    });
  },

  reorderSection: (platform, from, to) => {
    set((state) => {
      const copy = [...state.sections[platform]];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return {
        sections: {
          ...state.sections,
          [platform]: copy.map((s, idx) => ({ ...s, order: idx })),
        },
      };
    });
  },

  toggleSectionVisibility: (platform, id) => {
    set((state) => ({
      sections: {
        ...state.sections,
        [platform]: state.sections[platform].map((s) =>
          s.id === id ? { ...s, visible: !s.visible } : s,
        ),
      },
    }));
  },

  getPendingChanges: () => {
    const state = get();
    const diffs: EditorialFieldDiff[] = [];
    const platforms: EditorialPlatform[] = ['web', 'apk', 'exe'];

    for (const platform of platforms) {
      const currentObj = state[platform] as unknown as Record<string, any>;
      const savedObj = (state.savedSnapshot[platform] || {}) as unknown as Record<string, any>;
      for (const key of Object.keys(currentObj)) {
        const curVal = currentObj[key];
        const prevVal = savedObj[key];
        if (typeof curVal === 'object' && curVal !== null) {
          if (JSON.stringify(curVal) !== JSON.stringify(prevVal)) {
            diffs.push({
              platform,
              key,
              label: FIELD_LABELS[key] || key,
              before: 'Previous list',
              after: 'Updated list',
            });
          }
        } else if (String(curVal ?? '') !== String(prevVal ?? '')) {
          diffs.push({
            platform,
            key,
            label: FIELD_LABELS[key] || key,
            before: String(prevVal ?? ''),
            after: String(curVal ?? ''),
          });
        }
      }

      const curSecs = state.sections[platform] || [];
      const prevSecs = state.savedSnapshot.sections[platform] || [];
      for (const sec of curSecs) {
        const prevSec = prevSecs.find((p) => p.id === sec.id);
        if (prevSec && (prevSec.visible !== sec.visible || prevSec.order !== sec.order)) {
          diffs.push({
            platform,
            key: `section:${sec.id}`,
            label: `Section: ${sec.name}`,
            before: `${prevSec.visible ? 'Visible' : 'Hidden'} (#${prevSec.order + 1})`,
            after: `${sec.visible ? 'Visible' : 'Hidden'} (#${sec.order + 1})`,
          });
        }
      }
    }

    return diffs;
  },

  saveDraft: async (bearerToken) => {
    set({ isSaving: true });
    try {
      const state = get();
      const token = resolveAdminBearer(bearerToken);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const payload = {
        version: state.version,
        activePlatform: state.activePlatform,
        publishedChannels: state.publishChannels,
        sections: state.sections,
        web: state.web,
        apk: state.apk,
        exe: state.exe,
      };

      const res = await fetch('/api/editorial/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error || `Save failed (HTTP ${res.status})` };
      }
      const nextSnap = cloneSnapshot({
        version: state.version,
        sections: state.sections,
        web: state.web,
        apk: state.apk,
        exe: state.exe,
      });
      set({
        savedSnapshot: nextSnap,
        lastSavedAt: data.savedAt || new Date().toISOString(),
        lastWorkspaceFiles: Array.isArray(data.workspaceFiles) ? data.workspaceFiles : ['public/editorial-config.json'],
      });
      return {
        ok: true,
        savedAt: data.savedAt,
        workspaceFiles: Array.isArray(data.workspaceFiles) ? data.workspaceFiles : ['public/editorial-config.json'],
      };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Unable to reach workspace server' };
    } finally {
      set({ isSaving: false });
    }
  },

  publishLive: async (notesOrOptions) => {
    set({ isPublishing: true });
    try {
      const state = get();
      const opts: EditorialPublishOptions =
        typeof notesOrOptions === 'string'
          ? { notes: notesOrOptions }
          : (notesOrOptions || {});

      const channels: PublishChannels = opts.channels || state.publishChannels;
      const token = resolveAdminBearer(opts.bearerToken);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const cleanState = {
        version: state.version,
        activePlatform: state.activePlatform,
        publishedChannels: channels,
        sections: state.sections,
        web: state.web,
        apk: state.apk,
        exe: state.exe,
      };

      const res = await fetch('/api/editorial/publish', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          version: state.version,
          releaseNotes: opts.notes || 'Editorial configuration update',
          channels,
          pushToGitHub: Boolean(opts.pushToGitHub),
          state: cleanState,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        return {
          success: false,
          error: data?.error || `Publish failed (HTTP ${res.status})`,
        };
      }
      const nextVersion = data.version || state.version;
      const nextSnap = cloneSnapshot({
        version: nextVersion,
        sections: state.sections,
        web: state.web,
        apk: state.apk,
        exe: state.exe,
      });
      set({
        version: nextVersion,
        savedSnapshot: nextSnap,
        publishChannels: channels,
        lastSavedAt: data.publishedAt || new Date().toISOString(),
        lastPublishedAt: data.publishedAt || new Date().toISOString(),
        lastWorkspaceFiles: Array.isArray(data.workspaceFiles) ? data.workspaceFiles : ['public/editorial-config.json', 'public/version.json'],
      });
      return {
        success: true,
        version: nextVersion,
        message: data.message,
        channels,
        workspaceFiles: data.workspaceFiles,
        commitSha: data.commitSha,
        commitUrl: data.commitUrl,
        workflowsTriggered: data.workflowsTriggered,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Unable to reach workspace server' };
    } finally {
      set({ isPublishing: false });
    }
  },

  resetToDefaults: (platform) => {
    if (platform) {
      set((state) => ({
        sections: { ...state.sections, [platform]: defaultSections[platform] },
        ...(platform === 'web' ? { web: { ...defaultWeb } } : {}),
        ...(platform === 'apk' ? { apk: { ...defaultApk } } : {}),
        ...(platform === 'exe' ? { exe: { ...defaultExe } } : {}),
      }));
    } else {
      set({
        web: { ...defaultWeb },
        apk: { ...defaultApk },
        exe: { ...defaultExe },
        sections: cloneSnapshot(initialSnapshot).sections,
      });
    }
  },

  requestAiCopy: async (promptOrParams) => {
    set({ isAiGenerating: true });
    try {
      const payload =
        typeof promptOrParams === 'string'
          ? { prompt: promptOrParams }
          : {
              field: promptOrParams?.field || 'General Copy',
              prompt: promptOrParams?.prompt || 'Refine emergency dispatch text',
              currentValue: promptOrParams?.currentValue || '',
              platform: promptOrParams?.platform || 'web',
            };

      const res = await fetch('/api/editorial/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        return data.suggestions;
      }
      const result = data.result || 'ARMOURING COMMUNITIES ACROSS SOUTH AFRICA.';
      return [result, result.toLowerCase(), `URGENT: ${result}`];
    } catch {
      return [
        'ARMOURING COMMUNITIES ACROSS SOUTH AFRICA',
        'Next-Gen Sequential Rapid Emergency Alert Network',
        'Instant multi-channel distress dispatch & guard response',
      ];
    } finally {
      set({ isAiGenerating: false });
    }
  },

  fetchRemoteState: async () => {
    const applyLoaded = (data: any) => {
      if (!data || typeof data !== 'object') return false;
      const cur = get();
      const nextWeb = data.web ? { ...defaultWeb, ...data.web } : cur.web;
      const nextApk = data.apk ? { ...defaultApk, ...data.apk } : cur.apk;
      const nextExe = data.exe ? { ...defaultExe, ...data.exe } : cur.exe;
      const nextSections = data.sections
        ? {
            web: Array.isArray(data.sections.web) ? data.sections.web : cur.sections.web,
            apk: Array.isArray(data.sections.apk) ? data.sections.apk : cur.sections.apk,
            exe: Array.isArray(data.sections.exe) ? data.sections.exe : cur.sections.exe,
          }
        : cur.sections;
      const nextVersion = typeof data.version === 'string' && data.version ? data.version : cur.version;
      const nextChannels = data.publishedChannels
        ? {
            web: Boolean(data.publishedChannels.web),
            apk: Boolean(data.publishedChannels.apk),
            exe: Boolean(data.publishedChannels.exe),
            worker: Boolean(data.publishedChannels.worker),
          }
        : cur.publishChannels;

      set({
        version: nextVersion,
        web: nextWeb,
        apk: nextApk,
        exe: nextExe,
        sections: nextSections,
        publishChannels: nextChannels,
        savedSnapshot: cloneSnapshot({
          version: nextVersion,
          sections: nextSections,
          web: nextWeb,
          apk: nextApk,
          exe: nextExe,
        }),
        lastSavedAt: data.updatedAt || cur.lastSavedAt,
      });
      return true;
    };

    // 1. Try live server endpoint first (works in AI Studio preview & Express server)
    try {
      const res = await fetch('/api/editorial/state', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.web || data?.apk || data?.exe) {
          applyLoaded(data);
          return;
        }
      }
    } catch {}

    // 2. Fallback to static bundled /editorial-config.json (works on safetylink.online Pages, APK, EXE)
    try {
      const staticRes = await fetch('/editorial-config.json', { cache: 'no-store' });
      if (staticRes.ok) {
        const data = await staticRes.json();
        applyLoaded(data);
      }
    } catch {}
  },
}));
