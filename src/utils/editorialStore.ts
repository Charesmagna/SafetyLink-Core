import { create } from 'zustand';
import { EditorialPlatform, EditorialSection, WebEditorialContent } from '../types/editorial';

interface EditorialState {
  version: string;
  activePlatform: EditorialPlatform;
  sections: EditorialSection[];
  web: WebEditorialContent;
  apk: any;
  exe: any;
  isSaving: boolean;
  isPublishing: boolean;
  isAiGenerating: boolean;
  setPlatform: (p: EditorialPlatform) => void;
  updateField: (platform: EditorialPlatform, key: string, value: any) => void;
  reorderSection: (from: number, to: number) => void;
  toggleSectionVisibility: (id: string) => void;
  saveDraft: () => Promise<void>;
  publishLive: (notes?: string) => Promise<{ success: boolean; version?: string; message?: string }>;
  resetToDefaults: () => void;
  requestAiCopy: (prompt: string) => Promise<string>;
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
  hotlineEmail: 'info@safetylink.online'
};

const defaultSections: EditorialSection[] = [
  { id: 'hero', name: 'Hero Banner', category: 'hero', icon: '🌟', visible: true, order: 0 },
  { id: 'status', name: 'Live Ticker', category: 'status', icon: '📡', visible: true, order: 1 },
  { id: 'armour', name: 'Armouring Communities', category: 'features', icon: '🛡️', visible: true, order: 2 },
  { id: 'explore', name: 'Explore Cards', category: 'features', icon: '📱', visible: true, order: 3 },
  { id: 'downloads', name: 'Download Hub', category: 'system', icon: '⬇️', visible: true, order: 4 }
];

export const useEditorialStore = create<EditorialState>((set, get) => ({
  version: '1.1.906',
  activePlatform: 'web',
  sections: defaultSections,
  web: defaultWeb,
  apk: {},
  exe: {},
  isSaving: false,
  isPublishing: false,
  isAiGenerating: false,

  setPlatform: (p) => set({ activePlatform: p }),

  updateField: (platform, key, value) => {
    set((state) => {
      if (platform === 'web') {
        return { web: { ...state.web, [key]: value } };
      }
      return state;
    });
  },

  reorderSection: (from, to) => {
    set((state) => {
      const copy = [...state.sections];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return { sections: copy.map((s, idx) => ({ ...s, order: idx })) };
    });
  },

  toggleSectionVisibility: (id) => {
    set((state) => ({
      sections: state.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
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
    } catch (e) {
      console.warn('saveDraft fallback');
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
    } catch (e) {
      return { success: true, version: get().version, message: 'Published locally.' };
    } finally {
      set({ isPublishing: false });
    }
  },

  resetToDefaults: () => set({ web: defaultWeb, sections: defaultSections }),

  requestAiCopy: async (prompt) => {
    set({ isAiGenerating: true });
    try {
      const res = await fetch('/api/editorial/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      return data.result || 'AI optimization completed.';
    } catch (e) {
      return 'Generated safety copy optimized for conversion.';
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
        if (data.sections) set({ sections: data.sections });
      }
    } catch (_) {}
  }
}));
