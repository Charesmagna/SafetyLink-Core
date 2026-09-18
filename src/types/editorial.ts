export type EditorialPlatform = 'web' | 'apk' | 'exe';

export interface EditorialSection {
  id: string;
  name: string;
  category: 'hero' | 'status' | 'features' | 'hardware' | 'pricing' | 'contacts' | 'system';
  icon: string;
  visible: boolean;
  order: number;
}

export interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

export interface PricingPlan {
  name: string;
  monthly: string;
  onceOff: string;
  planCode: string;
  popular?: boolean;
  features: string[];
}

export interface WebEditorialContent {
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  statusTickerItems: string[];
  armourTitle: string;
  armourSubtitle: string;
  features: FeatureItem[];
  pricingTiers: PricingPlan[];
  hotlinePhone: string;
  hotlineEmail: string;
  logoImage: string;
  heroPosterImage: string;
  primaryColor: string;
  showLiveLog: boolean;
}

export interface ApkEditorialContent {
  appName: string;
  statusTag: string;
  sosButtonText: string;
  sosHoldText: string;
  duressCodePrompt: string;
  bleStatusText: string;
  keyfobPairedText: string;
  offlineFallbackNotice: string;
  emergencyContactsTitle: string;
  hudThemeColor: string;
  shieldIconUrl: string;
  enableVibration: boolean;
  holdDurationSeconds: number;
}

export interface ExeEditorialContent {
  windowTitle: string;
  dispatchHeader: string;
  warRoomSubtitle: string;
  threatLevelLabel: string;
  satelliteFeedStatus: string;
  evidenceLedgerTitle: string;
  primaryTheme: 'slate' | 'cyber' | 'stealth';
  multiMonitorEnabled: boolean;
  commandHotline: string;
}

export interface EditorialState {
  version: string;
  lastPublishedAt: string;
  lastModifiedBy: string;
  activePlatform: EditorialPlatform;
  sections: Record<EditorialPlatform, EditorialSection[]>;
  web: WebEditorialContent;
  apk: ApkEditorialContent;
  exe: ExeEditorialContent;
  history: Array<{
    timestamp: string;
    version: string;
    notes: string;
    author: string;
  }>;
}
