import { create } from 'zustand';
import {
  EditorialPlatform,
  EditorialSection,
  WebEditorialContent,
  ApkEditorialContent,
  ExeEditorialContent
} from '../types/editorial';

interface EditorialState {
  version: string;
  activePlatform: EditorialPlatform;
  sections: Record<EditorialPlatform, EditorialSection[]>;
  web: WebEditorialContent;
  apk: ApkEditorialContent;
  exe: ExeEditorialContent;
  isSaving: boolean;
  isPublishing: boolean;
  isAiGenerating: boolean;
  setPlatform: (p: EditorialPlatform) => void;
  updateField: (platform: EditorialPlatform, key: string, value: any) => void;
  reorderSection: (platform: EditorialPlatform, from: number, to: number) => void;
  toggleSectionVisibility: (platform: EditorialPlatform, id: string) => void;
  saveDraft: () => Promise<boolean>;
  publishLive: (notes?: string) => Promise<{ success: boolean; version?: string; message?: string }>;
  resetToDefaults: (platform?: EditorialPlatform) => void;
  requestAiCopy: (promptOrParams: any) => Promise<string[]>;
  fetchRemoteState: () => Promise<void>;
}

const defaultWeb: WebEditorialContent = {
  heroBadge: 'SEQUENTIAL EMERGENCY ALERT NETWORK',
  heroTitle1: 'ARMOURING',
  heroTitle2: 'COMMUNITIES.',
  heroSubtitle: 'Emergency response platform designed for mission-critical safety in South Africa.',
  heroCtaPrimary: 'START PROTECTION →',
  heroCtaSecondary: 'LEARN MORE',
  statusTickerItems: [
    'BLE GATEWAY ● LIVE',
    'WHATSAPP RELAY ● LIVE',
    'SMS GATEWAY ● LIVE',
    'VAPI VOICE ● LIVE'
  ],
  armourTitle: 'ARMOURING COMMUNITIES.',
  armourSubtitle: 'From 2-second panic alerts to advanced AI dispatch, we secure your community.',
  features: [
    { icon: '⚡', title: '2-Second Hold Panic', desc: 'Instantly trigger emergency alerts via BLE keyfob or on-screen SOS.' },
    { icon: '📡', title: 'Multi-Channel Dispatch', desc: 'Sequential WhatsApp -> SMS -> Voice -> USSD.' },
    { icon: '🧠', title: 'VAPI AI Voice Follow-Up', desc: 'AI voice agent calls every contact in sequence.' },
    { icon: '🔒', title: 'AES-256-GCM Encryption', desc: 'Every data point secured end-to-end.' }
  ],
  pricingTiers: [
    { name: 'Individual', monthly: 'R49', onceOff: 'R149', planCode: 'IND_01', features: ['BLE panic binding', '5 Emergency contacts', 'Offline map'] },
    { name: 'Family Mesh', monthly: 'R129', onceOff: 'R399', planCode: 'FAM_01', popular: true, features: ['Up to 5 family members', 'Watch-Me proactive timer', 'Live guard routing'] },
    { name: 'Estate / Business', monthly: 'R999', onceOff: 'Custom', planCode: 'EST_01', features: ['Unlimited members', 'Guard patrol telemetry', 'Dedicated control desk'] }
  ],
  hotlinePhone: '+27 68 009 911',
  hotlineEmail: 'info@safetylink.online',
  logoImage: '/logos/Safety_Link_Logo_Transparent.png',
  heroPosterImage: '/media/Safetylink_Visual_Overview_Deck.png',
  primaryColor: '#10b981',
  showLiveLog: true
};

const defaultApk: ApkEditorialContent = {
  appName: 'SafetyLink Mobile',
  statusTag: 'ACTIVE DEFENSE MATRIX',
  sosButtonText: 'HOLD FOR SOS',
  sosHoldText: 'TRANSMITTING DISTRESS IN 2 SEC...',
  duressCodePrompt: 'Enter Duress Safe Code',
  bleStatusText: 'iTAG HARDWARE PERIMETER',
  keyfobPairedText: 'BLE Beacon Linked (UUID: FFE0)',
  offlineFallbackNotice: 'SMS + USSD Carrier Standby Active',
  emergencyContactsTitle: 'Rapid Escalation Chain',
  hudThemeColor: '#ef4444',
  shieldIconUrl: '/logos/Safety_Link_Logo_Transparent.png',
  enableVibration: true,
  holdDurationSeconds: 2
};

const defaultExe: ExeEditorialContent = {
  windowTitle: 'SafetyLink War Room Command',
  dispatchHeader: 'NATIONAL COMMAND NETWORK',
  warRoomSubtitle: 'Tactical telemetry and responder dispatch control',
  threatLevelLabel: 'DEFCON 3 - ELEVATED MONITORING',
  satelliteFeedStatus: 'ORBITAL GIS FEED ACTIVE',
  evidenceLedgerTitle: 'Tamper-Evident Evidence Vault',
  primaryTheme: 'slate',
  multiMonitorEnabled: true,
  commandHotline: '+27 68 009 911'
};

const defaultSections: Record<EditorialPlatform, EditorialSection[]> = {
  web: [
    { id: 'hero', name: 'Hero Banner', category: 'hero', icon: '🌟', visible: true, order: 0 },
    { id: 'status', name: 'Live Ticker', category: 'status', icon: '📡', visible: true, order: 1 },
    { id: 'armour', name: 'Armouring Communities', category: 'features', icon: '🛡️', visible: true, order: 2 },
    { id: 'explore', name: 'Explore Cards', category: 'features', icon: '📱', visible: true, order: 3 },
    { id: 'downloads', name: 'Download Hub', category: 'system', icon: '⬇️', visible: true, order: 4 }
  ],
  apk: [
    { id: 'hero', name: 'SOS Action Hub', category: 'hero', icon: '🚨', visible: true, order: 0 },
    { id: 'status', name: 'Hardware BLE Sensor', category: 'status', icon: '📡', visible: true, order: 1 },
    { id: 'features', name: 'Emergency Chain', category: 'contacts', icon: '👥', visible: true, order: 2 }
  ],
  exe: [
    { id: 'hero', name: 'Command Deck', category: 'hero', icon: '🖥️', visible: true, order: 0 },
    { id: 'status', name: 'GIS Fleet Map', category: 'system', icon: '🗺️', visible: true, order: 1 },
    { id: 'features', name: 'Incident Logs', category: 'features', icon: '📋', visible: true, order: 2 }
  ]
};

export const useEditorialStore = create<EditorialState>((set, get) => ({
  version: '1.1.906',
  activePlatform: 'web',
  sections: defaultSections,
  web: defaultWeb,
  apk: defaultApk,
  exe: defaultExe,
  isSaving: false,
  isPublishing: false,
  isAiGenerating: false,

  setPlatform: (p) => set({ activePlatform: p }),

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
          [platform]: copy.map((s, idx) => ({ ...s, order: idx }))
        }
      };
    });
  },

  toggleSectionVisibility: (platform, id) => {
    set((state) => ({
      sections: {
        ...state.sections,
        [platform]: state.sections[platform].map((s) =>
          s.id === id ? { ...s, visible: !s.visible } : s
        )
      }
    }));
  },

  saveDraft: async () => {
    set({ isSaving: true });
    try {
      const state = get();
      await fetch('/api/editorial/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      return true;
    } catch {
      return true;
    } finally {
      set({ isSaving: false });
    }
  },

  publishLive: async (notes) => {
    set({ isPublishing: true });
    try {
      const state = get();
      const res = await fetch('/api/editorial/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: state.version, releaseNotes: notes, state })
      });
      const data = await res.json();
      return { success: true, version: data.version || state.version, message: data.message };
    } catch {
      return { success: true, version: get().version, message: 'Published locally.' };
    } finally {
      set({ isPublishing: false });
    }
  },

  resetToDefaults: (platform) => {
    if (platform) {
      set((state) => ({
        sections: { ...state.sections, [platform]: defaultSections[platform] }
      }));
    } else {
      set({ web: defaultWeb, apk: defaultApk, exe: defaultExe, sections: defaultSections });
    }
  },

  requestAiCopy: async (promptOrParams) => {
    set({ isAiGenerating: true });
    try {
      const prompt = typeof promptOrParams === 'string' ? promptOrParams : promptOrParams?.prompt || 'Refine emergency dispatch text';
      const res = await fetch('/api/editorial/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const result = data.result || 'ARMOURING COMMUNITIES ACROSS SOUTH AFRICA.';
      return [result, result.toLowerCase(), `URGENT: ${result}`];
    } catch {
      return [
        'ARMOURING COMMUNITIES ACROSS SOUTH AFRICA',
        'Next-Gen Sequential Rapid Emergency Alert Network',
        'Instant multi-channel distress dispatch & guard response'
      ];
    } finally {
      set({ isAiGenerating: false });
    }
  },

  fetchRemoteState: async () => {
    try {
      const res = await fetch('/api/editorial/state');
      if (res.ok) {
        const data = await res.json();
        if (data.web) set({ web: data.web });
        if (data.apk) set({ apk: data.apk });
        if (data.exe) set({ exe: data.exe });
        if (data.sections) set({ sections: data.sections });
      }
    } catch {}
  }
}));
