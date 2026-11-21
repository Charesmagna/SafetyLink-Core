import SituationalAwareness from './components/SituationalAwareness';
import { FirstLaunchDisclaimer } from "./components/FirstLaunchDisclaimer";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapacitorApp } from '@capacitor/app';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PanicButton } from './components/PanicButton';
import { initFirebaseSync } from './services/FirebaseSyncService';
import { DispatchChain } from './components/DispatchChain';
import { StatusIndicator } from './components/StatusIndicator';
import { GeolocationService, OfflineService } from './services/BaseService';
import { LocalNotificationService } from './services/LocalNotificationService';
import { useAppStore } from './utils/store';
import { AuthScreen } from './components/AuthScreen';
import { GlobalBackground } from "./components/GlobalBackground";
import { SplashReveal } from "./components/SplashReveal";
import { LandingPage } from './components/LandingPage';
import { DnsSetupGuide } from './components/DnsSetupGuide';
import { ResponderDashboard } from './components/ResponderDashboard';
import { TrialBanner } from './components/TrialBanner';
import { SafetyLinkLogo } from './components/SafetyLinkLogo';
import { LizzyPopup } from './components/LizzyPopup';
import { LogoSetPart } from './components/LogoSetPart';
import { translate, SA_LANGUAGES } from './utils/translations';
import { FloatingPanicWidget } from './components/FloatingPanicWidget';
import { SimulatedDesktop } from './components/SimulatedDesktop';
import { ForcedCountdownOverlay } from './components/ForcedCountdownOverlay';
import { PermissionsOnboardingModal } from './components/PermissionsOnboardingModal';
import { useEmergencyListener } from './hooks/useEmergencyListener';
import { useTacticalSensors } from './hooks/useTacticalSensors';
import { DeviceAlertOverlay } from './components/DeviceAlertOverlay';
import { PushNotifications } from '@capacitor/push-notifications';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from './utils/cloudinary';
import { UpdateBanner } from './components/UpdateBanner';
import { startProfileSync } from './services/ProfileSync';

const SuperDashboard = lazy(() => import('./components/SuperDashboard').then(m => ({ default: m.SuperDashboard })));
const OrgWarRoom = lazy(() => import('./components/OrgWarRoom').then(m => ({ default: m.OrgWarRoom })));
const BLEScanner = lazy(() => import('./components/BLEScanner').then(m => ({ default: m.BLEScanner })));
const OfflineMap = lazy(() => import('./components/OfflineMap').then(m => ({ default: m.OfflineMap })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const WorkspaceIntegrations = lazy(() => import('./components/WorkspaceIntegrations'));
const Profile = lazy(() => import('./components/Profile').then(m => ({ default: m.Profile })));
const LocationDisplay = lazy(() => import('./components/LocationDisplay').then(m => ({ default: m.LocationDisplay })));
const OrgDashboard = lazy(() => import('./components/OrgDashboard').then(m => ({ default: m.OrgDashboard })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const AppTour = lazy(() => import('./components/AppTour').then(m => ({ default: m.AppTour })));
const AIHub = lazy(() => import('./components/AIHub').then(m => ({ default: m.AIHub })));
const MediaHub = lazy(() => import('./components/MediaHub').then(m => ({ default: m.MediaHub })));
const AndroidWidgetSimulator = lazy(() => import('./components/AndroidWidgetSimulator').then(m => ({ default: m.AndroidWidgetSimulator })));
const KlevaBot = lazy(() => import('./components/KlevaBot').then(m => ({ default: m.KlevaBot })));
const GlobalRadarBackground = lazy(() => import('./components/GlobalRadarBackground').then(m => ({ default: m.GlobalRadarBackground })));
const AdvancedSubsystems = lazy(() => import('./components/AdvancedSubsystems').then(m => ({ default: m.AdvancedSubsystems })));
const DecoyCalculator = lazy(() => import('./components/DecoyCalculator').then(m => ({ default: m.DecoyCalculator })));
const ConfidentialVault = lazy(() => import('./components/ConfidentialVault').then(m => ({ default: m.ConfidentialVault })));
const SafetyWareStore = lazy(() => import('./components/SafetyWareStore'));
const OpenPlatformHub = lazy(() => import('./components/OpenPlatformHub').then(m => ({ default: m.OpenPlatformHub })));
const ClientDatabaseModule = lazy(() => import('./components/ClientDatabaseModule').then(m => ({ default: m.ClientDatabaseModule })));
const LiveCameraFeed = lazy(() => import('./components/LiveCameraFeed').then(m => ({ default: m.LiveCameraFeed })));
import { getR2StreamUrl } from './utils/r2Assets';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { IncomingEmergencyRingModal } from './components/IncomingEmergencyRingModal';
import { SLShieldLogo } from './components/SLShieldLogo';

const slide1 = getR2StreamUrl('Random platform background.png');
const slide2 = getR2StreamUrl('Emergency_Response_Platform_Architecture_Overview.png');
const slide3 = getR2StreamUrl('IMG_20260914_221811.png');
const slLogoMain = getR2StreamUrl('Polish_20260914_220631067.png');
const slLogoSet = getR2StreamUrl('IMG_20260914_223311.png');
const newBg1 = getR2StreamUrl('Emergency_Mesh_Platform_Overview.png');
const newLogo1 = getR2StreamUrl('IMG_20260914_223547.png');
const klevaLogo = getR2StreamUrl('Polish_20260809_035827088.png');
const polishLogo = getR2StreamUrl('limx dynamics.jpg');

type TabId = 'home' | 'deck' | 'cameras' | 'vault' | 'contacts' | 'ble' | 'map' | 'settings' | 'subsystems' | 'profile' | 'workspace' | 'intelligence' | 'store' | 'integrations' | 'clients' | 'media';

const TrialLockOverlay = () => {
  const { logout } = useAppStore();
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="max-w-md w-full bg-red-950/40 border-2 border-red-500/50 rounded-2xl p-8 text-center shadow-[0_0_100px_rgba(220,38,38,0.2)]">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">System Locked</h1>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          Your 14-day SafetyLink trial has concluded. The system has automatically locked your account's access.
        </p>
        <div className="bg-black/40 p-4 rounded-xl text-sm text-slate-400 font-mono mb-8">
          ERROR CODE: TRIAL_EXPIRED
        </div>
        <a href="mailto:info@safetylink.online" className="inline-block bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-xl transition-colors w-full mb-4">
          Contact Sales to Unlock
        </a>
        <button onClick={logout} className="text-slate-500 text-sm font-bold hover:text-white underline">Sign Out</button>
      </div>
    </div>
  );
};


const TrialReminderModal = () => {
  const { currentUser, currentOrg, showTrialReminder, setShowTrialReminder } = useAppStore();
  
  if (!showTrialReminder) return null;
  
  const target = currentOrg || currentUser;
  if (!target || target.subscriptionStatus !== 'trial') return null;

  const daysPassed = Math.floor((Date.now() - (target.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 14 - daysPassed);

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Free Trial Active</h2>
        <p className="text-slate-400 mb-6 text-sm">
          You are currently using the SafetyLink Free Trial. Upgrade to premium for unlimited access to all features.
        </p>
        
        <div className="bg-slate-950 rounded-2xl p-4 mb-8 border border-slate-800">
          <div className="text-4xl font-black text-amber-400 mb-1">{daysLeft}</div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Days Remaining</div>
        </div>

        <button 
          onClick={() => setShowTrialReminder(false)}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // If we're on the web platform, we always want to show the landing page initially. Otherwise, skip straight to app logic.
  // Check if running in a desktop EXE (Electron) environment
  const isDesktopExe = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0;
  // Only show landing page initially on actual web browsers
  const [showLanding, setShowLanding] = useState(() => !isDesktopExe && (Capacitor.getPlatform() === 'web' || typeof window !== 'undefined' && !Capacitor.isNativePlatform()));
  const [klevaLogoFailed, setKlevaLogoFailed] = useState(false);
  useEffect(() => {
    const openPreview = () => {
      setAuthInitialView('LOGIN');
      setShowLanding(false);
    };
    window.addEventListener('sl-open-preview', openPreview);
    if (typeof window !== 'undefined' && window.location.hash === '#preview') {
      openPreview();
    }
    return () => window.removeEventListener('sl-open-preview', openPreview);
  }, []);
  const [authInitialView, setAuthInitialView] = useState<'LOGIN' | 'REGISTER_ORG' | 'REGISTER_USER'>('LOGIN');
  const [trialExpired, setTrialExpired] = useState(false);
  const [mapsQuotaError, setMapsQuotaError] = useState<string | null>(null);
  const isLizzyOpen = useAppStore((s) => s.isLizzyOpen);
  const setIsLizzyOpen = useAppStore((s) => s.setIsLizzyOpen);
  const postEmergencyPrompt = useAppStore((s) => s.postEmergencyPrompt);
  const openLizzyCompanion = useAppStore((s) => s.openLizzyCompanion);
  const dismissPostEmergencyPrompt = useAppStore((s) => s.dismissPostEmergencyPrompt);

  useEffect(() => {
    const onQuota = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      setMapsQuotaError(detail?.reason || 'Google Maps API Quota Exceeded. Interactive map tiles may be degraded.');
    };
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // The custom hook catches the Native Android PanicService status transitions & real DispatchResult
  const {   } = useTacticalSensors();
  const { startNativeScanner } = useEmergencyListener((info) => {
    const store = useAppStore.getState();
    const status = String(info?.status || '').toUpperCase();

    if (status === 'TRIGGERED' || status === 'COUNTDOWN') {
      useAppStore.setState({
        panicCountdown: typeof info.countdownSeconds === 'number' && info.countdownSeconds > 0 ? info.countdownSeconds : 10,
      });
      return;
    }

    if (status === 'DISPATCHING') {
      useAppStore.setState({ panicCountdown: null, activeSOSState: 'ESCALATING' });
      store.addAuditLog('DISPATCH', 'SEVERE', 'Native EmergencyService Executing', `Source: ${info.source || 'NATIVE_PANIC_SERVICE'}`);
      return;
    }

    if (status === 'CANCELLED') {
      useAppStore.setState({
        panicCountdown: null,
        activeSOSState: 'IDLE',
        postEmergencyPrompt: {
          incidentId: info.incidentId || `DISARM-${Date.now().toString().slice(-5)}`,
          summary: 'Native Emergency SOS was disarmed. Lizzy AI is ready to check in and confirm you are safe.',
          timestamp: Date.now(),
        },
      });
      store.addToast('Emergency SOS disarmed cleanly.', 'info');
      return;
    }

    if (status === 'DISPATCHED' || status === 'PARTIAL_SUCCESS' || status === 'FAILED') {
      // Schedule 10-minute post-panic Lizzy AI voice check-in on native dispatch too
      if (status !== 'FAILED' && typeof window !== 'undefined') {
        const existingTimer = (window as any).__SL_CHECKIN_TIMER__;
        if (existingTimer) clearTimeout(existingTimer);
        (window as any).__SL_CHECKIN_TIMER__ = setTimeout(() => {
          const cur = useAppStore.getState();
          if (cur.activeSOSState !== 'IDLE') {
            cur.setShowLizzyPopup(true);
          }
        }, 10 * 60 * 1000);
        useAppStore.setState({
          postEmergencyPrompt: {
            incidentId: info.incidentId || `INC-${Date.now().toString().slice(-5)}`,
            summary: `Emergency alert (${status}) dispatched. Lizzy AI is available via Live Voice or Chat to stay with you until help arrives.`,
            timestamp: Date.now(),
          },
        });
      }
      const coords = store.userLocation || { lat: 0, lng: 0 };
      const incidentId = info.incidentId || `INC-${Date.now()}`;
      const smsStatus = info.smsStatus || 'UNKNOWN';
      const callStatus = info.callStatus || 'UNKNOWN';
      const backendSyncStatus = info.backendSyncStatus || 'UNKNOWN';
      const pcmStatus = info.pcmStatus || 'NOT_REQUIRED';

      const newEvent = {
        id: incidentId,
        status: (status === 'FAILED' ? 'FAILED' : status === 'PARTIAL_SUCCESS' ? 'PARTIAL' : 'DISPATCHED') as 'FAILED' | 'PARTIAL' | 'DISPATCHED',
        severity: 'CRITICAL' as const,
        lat: coords.lat,
        lng: coords.lng,
        timestamp: Date.now(),
        assignedResponder: store.currentUser?.orgCode || store.currentOrg?.id || 'Escalated Patrol Unit',
        description: `Native Dispatch (${status}) — SMS: ${smsStatus}, Call: ${callStatus}, Sync: ${backendSyncStatus}`,
        timelineData: [
          `Incident ${incidentId} processed at ${new Date().toLocaleTimeString()}`,
          `SMS Result: ${smsStatus}`,
          `Voice Call Result: ${callStatus}`,
          `Backend Sync: ${backendSyncStatus}`,
          `PCM/USSD: ${pcmStatus}`,
        ],
      };

      const nextEvents = [newEvent, ...store.panicEvents.filter((ev) => ev.id !== incidentId)];
      useAppStore.setState({
        panicCountdown: null,
        activeSOSState: status === 'FAILED' ? 'IDLE' : 'DISPATCHED',
        panicEvents: nextEvents,
      });
      try {
        localStorage.setItem('sl_panic_events', JSON.stringify(nextEvents));
      } catch {}

      store.addDispatchLog({
        channel: 'SMS',
        target: store.contacts?.[0]?.phone || store.currentUser?.phone || 'Emergency Contacts',
        status: smsStatus === 'SENT' ? 'SENT' : 'FAILED',
        unitId: store.currentUser?.id || 'SL-NATIVE',
        coordinates: coords.lat || coords.lng ? coords : undefined,
        details: `Incident ${incidentId} · SMS=${smsStatus} Call=${callStatus} Sync=${backendSyncStatus} PCM=${pcmStatus}`,
      });

      store.addAuditLog(
        'DISPATCH',
        status === 'FAILED' ? 'SEVERE' : 'INFO',
        `Native Dispatch Result: ${status}`,
        `ID=${incidentId} SMS=${smsStatus} Call=${callStatus} Backend=${backendSyncStatus} PCM=${pcmStatus}`
      );

      if (status === 'DISPATCHED') {
        store.addToast(`SOS Dispatched (${incidentId}): SMS ${smsStatus}, Sync ${backendSyncStatus}`, 'success');
      } else if (status === 'PARTIAL_SUCCESS') {
        store.addToast(`Partial SOS Dispatch (${incidentId}): SMS ${smsStatus}, Call ${callStatus}, Sync ${backendSyncStatus}`, 'warn');
      } else {
        store.addToast(`SOS Dispatch Failed (${incidentId}): queued offline if unreachable.`, 'error');
      }
    }
  });
  const { 
    isAppMinimized,
    setMinimized,
    activeSOSState, 
    currentUser, 
    currentOrg, 
    superAdminActive, 
    logout,
    customTools,
    userLocation,
    language, setLanguage,
    setCommerceModalOpen,
    toasts,
    removeToast,
    isBackgroundServiceRunning,
    backgroundServiceTick,
    bleDevices,
    decoyActive,
    isFloatingWidgetDeployed,
    setFloatingWidgetDeployed,
    demoMode,
    localOfflineQueue,
    syncOfflineQueue,
    checkAppUpdates,
    updateInfo,
    setUpdateInfo,
    globalTheme,
    setGlobalTheme,
    profileCreatedSummary,
    setProfileCreatedSummary,
    addToast
  } = useAppStore();

  useEffect(() => {
    checkAppUpdates();
    const updateInterval = setInterval(() => {
      checkAppUpdates();
    }, 15 * 60 * 1000);

    const handleFocus = () => {
      checkAppUpdates();
    };
    window.addEventListener('focus', handleFocus);

    initFirebaseSync();
    startProfileSync();
    if (Capacitor.isNativePlatform()) {
      startNativeScanner().catch(() => {});
    }

    const handleOnlineReconnect = () => {
      import('./services/ProfileSync').then(({ syncProfile }) => syncProfile()).catch(() => {});
      useAppStore.getState().syncOfflineQueue(true);
    };
    window.addEventListener('online', handleOnlineReconnect);

    // Persistent BLE iTAG Auto-Reconnect on App Launch & Wake
    const autoReconnectBondedITags = () => {
      try {
        const bonded = useAppStore.getState().bleDevices;
        if (bonded && bonded.length > 0) {
          console.log('[App] Auto-reconnecting saved bonded iTAG devices:', bonded.length);
          bonded.forEach(dev => {
            if (dev.connectionState !== 'CONNECTED') {
              useAppStore.getState().connectBleDevice(dev.macAddress);
            }
          });
        }
      } catch (e) {
        console.warn('[App] Auto-reconnect saved iTAG note:', e);
      }
    };
    const itagTimer = setTimeout(autoReconnectBondedITags, 1000);
    
    // Initialize real-time mesh node sync if firestore sync is active
    let cleanupSync: any = null;
    const { firestoreSync, currentUser } = useAppStore.getState();
    if (firestoreSync && currentUser) {
      cleanupSync = useAppStore.getState().initMeshSync();
    }
    
    // Watch for toggle changes
    const unsub = useAppStore.subscribe((state, prevState) => {
       if ((state.firestoreSync !== prevState.firestoreSync || state.currentUser?.id !== prevState.currentUser?.id) && state.firestoreSync && state.currentUser) {
          if (cleanupSync) cleanupSync();
          cleanupSync = state.initMeshSync();
       } else if (!state.firestoreSync && cleanupSync) {
          cleanupSync();
          cleanupSync = null;
       }
    });
    
    const checkTrial = () => {
      const target = currentOrg || currentUser;
      if (target && target.subscriptionStatus === 'trial') {
        const daysPassed = Math.floor((Date.now() - (target.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
        if (daysPassed >= 14) {
          setTrialExpired(true);
        } else {
          setTrialExpired(false);
        }
      } else if (target && target.subscriptionStatus === 'locked') {
        setTrialExpired(true);
      } else {
        setTrialExpired(false);
      }
    };
    checkTrial();
    
    // Fallback original event listener
    const handleTrialExpired = () => setTrialExpired(true);
    window.addEventListener('trial_expired', handleTrialExpired);
    return () => { 
      clearInterval(updateInterval);
      clearTimeout(itagTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnlineReconnect);
      window.removeEventListener('trial_expired', handleTrialExpired);
      if (cleanupSync) cleanupSync(); 
      unsub(); 
    };
  }, [currentUser, currentOrg]);
  
  const t = (key: string) => {
    if (key === 'tab.deck') return 'Control Deck';
    if (key === 'tab.vault') return 'Confidential Vault';
    return translate(language, key);
  };
  
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    // On native APK, native SplashActivity already executed; avoid duplicate web splash stall
    if (Capacitor.isNativePlatform()) {
      return false;
    }
    // On web, show cinematic splash once per session
    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('sl_splash_shown') || localStorage.getItem('sl_splash_shown');
      if (!shown) {
        sessionStorage.setItem('sl_splash_shown', 'true');
        return true;
      }
    }
    return false;
  });
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  useEffect(() => {
    // Hide native splash screen once React has mounted and our custom cinematic splash is ready
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(console.warn);
      // Fallback timeout ensuring no lingering splash overlay on native
      const t = setTimeout(() => {
        SplashScreen.hide().catch(() => {});
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);
  
  const [showTour, setShowTour] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const backgroundSlides = [
    newBg1,
    newLogo1,
    klevaLogo,
    polishLogo,
    slLogoMain,
    slLogoSet,
    slide3,
    slide1,
    slide2
  ];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % backgroundSlides.length);
    }, 4500);
    
  return () => clearInterval(interval);
  }, [isDrawerOpen]);

  useEffect(() => {
    const skipTour = localStorage.getItem('sl_skip_tour');
    if (currentUser) {
      if (skipTour !== 'true') {
        setShowTour(true);
      }
    } else {
      setShowTour(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let urlOpenListener: Promise<{ remove: () => void }> | null = null;
    let backButtonListenerPromise: Promise<{ remove: () => void }> | null = null;

    if (Capacitor.isNativePlatform()) {
      urlOpenListener = CapacitorApp.addListener('appUrlOpen', data => {
        console.log('App opened with URL:', data);
        try {
          const url = new URL(data.url);
          if (url.searchParams.has('ref')) {
            const refCode = url.searchParams.get('ref');
            if (refCode) localStorage.setItem('sl_pending_referral', refCode);
          }
        } catch (e) {
          console.warn('Failed to parse incoming deep link url:', e);
        }
      });

      try {
        backButtonListenerPromise = CapacitorApp.addListener('backButton', () => {
          if (useAppStore.getState().panicCountdown !== null) {
            console.warn("Back button blocked: SOS Countdown is active.");
            return;
          }
          if (isDrawerOpen) {
            setIsDrawerOpen(false);
          } else if (activeTab !== 'home') {
            setActiveTab('home');
          } else {
            setShowExitConfirm(true);
          }
        });
      } catch (e) {
        console.warn("backButton not supported", e);
      }
    }

    return () => {
      if (urlOpenListener) urlOpenListener.then(listener => listener.remove());
      if (backButtonListenerPromise) {
        backButtonListenerPromise.then(listener => listener.remove());
      }
    };
  }, [isDrawerOpen, activeTab]);
 
   useEffect(() => {
    const geoService = GeolocationService.getInstance();
    OfflineService.getInstance(); // Initialize offline listeners
    
    const setupSurvivalListener = async () => {
      const bridge = (Capacitor.Plugins as any).SafetyLinkBridge;
      if (bridge) {
        bridge.addListener('onSurvivalMode', (info: any) => {
          useAppStore.getState().setSurvivalMode(info.isSurvival);
          if (info.isSurvival) {
            console.error("CRITICAL: BATTERY SURVIVAL MODE ACTIVATED. UI SUSPENDED.");
          }
        });
      }
    };
    setupSurvivalListener();

    // Helper to register FCM device token with SafetyLink Worker & native PushRegistrar
    const syncFcmTokenToServer = async (fcmToken: string) => {
      if (!fcmToken) return;
      try {
        localStorage.setItem('sl_fcm_token', fcmToken);
      } catch {}
      const state = useAppStore.getState();
      const user = state.currentUser;
      const phone = user?.phone?.trim();
      if (user?.id) {
        state.updateUserProfile(user.id, { fcmToken } as any);
      }
      if (!phone) return;
      const profileToken = (() => {
        try { return localStorage.getItem('sl_profile_token') || state.token || ''; } catch { return state.token || ''; }
      })();
      try {
        const bridge = (Capacitor.Plugins as any).SafetyLinkEmergency;
        if (bridge?.savePushIdentity && profileToken) {
          await bridge.savePushIdentity({ phone, profileToken }).catch(() => {});
        }
      } catch {}
      try {
        const apiBase = (state.customBackendUrl || 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev').replace(/\/+$/, '');
        await fetch(`${apiBase}/api/device/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(profileToken ? { 'X-Profile-Token': profileToken } : {}),
          },
          body: JSON.stringify({ phone, token: fcmToken }),
        });
      } catch (err) {
        console.warn('FCM token Worker sync deferred:', err);
      }
    };

    // FCM Push Notification Setup (Android Loud Contact Ringing)
    const registerPush = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            PushNotifications.addListener('registration', (token) => {
              console.log('FCM Token registered');
              syncFcmTokenToServer(token.value);
            });
            PushNotifications.addListener('registrationError', (error) => {
              console.error('FCM Registration error: ', error.error);
            });
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
              const data: any = notification.data || {};
              const latNum = data.lat !== undefined ? Number(data.lat) : undefined;
              const lngNum = data.lng !== undefined ? Number(data.lng) : undefined;
              useAppStore.getState().triggerIncomingEmergencyRing({
                id: data.incidentId || notification.id || `FCM-${Date.now()}`,
                callerName: data.callerName || notification.title || 'SafetyLink Emergency Alert',
                callerNumber: data.callerNumber || '',
                location: data.location || notification.body || 'Emergency distress alert received',
                lat: Number.isFinite(latNum) ? latNum : undefined,
                lng: Number.isFinite(lngNum) ? lngNum : undefined,
                source: 'FCM_LOUD_ALARM',
              });
            });
            PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              const notification = action.notification;
              const data: any = notification?.data || {};
              const latNum = data.lat !== undefined ? Number(data.lat) : undefined;
              const lngNum = data.lng !== undefined ? Number(data.lng) : undefined;
              useAppStore.getState().triggerIncomingEmergencyRing({
                id: data.incidentId || notification?.id || `FCM-TAP-${Date.now()}`,
                callerName: data.callerName || notification?.title || 'SafetyLink Emergency Alert',
                callerNumber: data.callerNumber || '',
                location: data.location || notification?.body || 'Emergency distress alert received',
                lat: Number.isFinite(latNum) ? latNum : undefined,
                lng: Number.isFinite(lngNum) ? lngNum : undefined,
                source: 'FCM_LOUD_ALARM',
              });
            });
          }
        }
      } catch (e) {
        console.warn('FCM Registration skipped (not native or error):', e);
      }
    };
    registerPush();

    geoService.startTracking();
    //  (); // Disabled to prevent false auto-alerts as requested

    const handleCustomWearableEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Intercepted custom wearable hardware trigger:', customEvent.detail);
    };

    window.dispatchEvent(new CustomEvent('wearable-panic-trigger', { detail: 'initialized' }));
    window.addEventListener('wearable-panic-trigger', handleCustomWearableEvent);

    return () => {
      geoService.stopTracking();
      window.removeEventListener('wearable-panic-trigger', handleCustomWearableEvent);
    };
  }, []);

  // Re-sync cached FCM token whenever the user logs in or updates their phone number
  useEffect(() => {
    const phone = currentUser?.phone?.trim();
    if (!currentUser?.id || !phone) return;
    let cachedToken = (currentUser as any).fcmToken || '';
    if (!cachedToken) {
      try { cachedToken = localStorage.getItem('sl_fcm_token') || ''; } catch {}
    }
    if (!cachedToken) return;
    const state = useAppStore.getState();
    const profileToken = (() => {
      try { return localStorage.getItem('sl_profile_token') || state.token || ''; } catch { return state.token || ''; }
    })();
    if (Capacitor.isNativePlatform()) {
      const bridge = (Capacitor.Plugins as any).SafetyLinkEmergency;
      if (bridge?.savePushIdentity && profileToken) {
        bridge.savePushIdentity({ phone, profileToken }).catch(() => {});
      }
    }
    const apiBase = (state.customBackendUrl || 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev').replace(/\/+$/, '');
    fetch(`${apiBase}/api/device/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(profileToken ? { 'X-Profile-Token': profileToken } : {}),
      },
      body: JSON.stringify({ phone, token: cachedToken }),
    }).catch(() => {});
  }, [currentUser?.id, currentUser?.phone]);




  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<TabId>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('sl-switch-tab', handleSwitchTab);
    return () => window.removeEventListener('sl-switch-tab', handleSwitchTab);
  }, []);

  // Background monitoring tick loop
  useEffect(() => {
    const { incrementBackgroundServiceTick } = useAppStore.getState();
    const tickInterval = setInterval(() => {
      if (isBackgroundServiceRunning) {
        incrementBackgroundServiceTick();
      }
    }, 30000); // OPTIMIZED: Reduced heartbeat frequency to save battery
    return () => clearInterval(tickInterval);
  }, [isBackgroundServiceRunning]);

  // Synchronize state with actual phone local notification system tray
  useEffect(() => {
    const locStr = userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'Acquiring GPS...';
    const connectedBleCount = bleDevices.filter(d => d.connectionState === 'CONNECTED').length;
    
    LocalNotificationService.updateStatusNotification(
      isBackgroundServiceRunning,
      backgroundServiceTick,
      activeSOSState,
      locStr,
      connectedBleCount
    ).catch(err => {
      console.error('[App:NotificationSync] Error updating system tray notification:', err);
    });
  }, [isBackgroundServiceRunning, backgroundServiceTick, activeSOSState, userLocation, bleDevices]);

  // Show 5-second 3D logo splash reveal before rendering AuthScreen or Dashboards

  // Secure routing conditional renders and persistent layout wraps
  const renderMainBody = () => {
    if (!currentUser && !currentOrg && !superAdminActive) {
      if (showLanding) {
        return <LandingPage 
          onLogin={() => {
            setAuthInitialView('LOGIN');
            setShowLanding(false);
          }} 
          onRegisterOrg={() => {
            setAuthInitialView('REGISTER_ORG');
            setShowLanding(false);
          }} 
          onRegisterUser={() => {
            setAuthInitialView('REGISTER_USER');
            setShowLanding(false);
          }}
        />;
      }
      return <AuthScreen initialView={authInitialView as any} onBackToSite={Capacitor.getPlatform() === 'web' ? () => setShowLanding(true) : undefined} />;
    }

    if (isAppMinimized) {
      return <SimulatedDesktop />;
    }
    if (decoyActive) {
      return <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Calculator...</div>}><DecoyCalculator /></Suspense>;
    }

    if (superAdminActive) {
      return <ErrorBoundary tabName="Admin"><Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Admin...</div>}><AdminPanel /></Suspense></ErrorBoundary>;
    }

    if (currentUser && currentUser.orgCode && currentUser.role === 'Responder') {
      return <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Responder Console...</div>}><ResponderDashboard /></Suspense>;
    }

    if (currentOrg || (currentUser && currentUser.orgCode && ['Organization Administrator', 'Control Room Operator', 'Dispatcher'].includes(currentUser.role || ''))) {
      return <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Dashboard...</div>}><OrgDashboard /></Suspense>;
    }

    if (!currentUser) {
      return null;
    }



    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

      
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">🚪</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider font-mono">Exit SafetyLink?</h2>
              <p className="text-xs text-slate-400 mt-2">Background tracking and emergency listeners will be suspended if you exit.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 rounded-xl border border-slate-700 font-bold uppercase tracking-wider text-xs">
                Cancel
              </button>
              <button onClick={() => CapacitorApp.exitApp()} className="flex-1 py-3 rounded-xl bg-red-600 font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-500/20">
                Exit App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Tour Overlay */}
      {showTour && (
        <Suspense fallback={<div className="hidden"></div>}><AppTour
          onClose={(neverShowAgain) => {
            if (neverShowAgain) {
              localStorage.setItem('sl_skip_tour', 'true');
            }
            setShowTour(false);
          }}
        />
        </Suspense>
      )}

      {/* Top Banner Alert during SOS Distress Broadcast */}
      {activeSOSState !== 'IDLE' ? (
        <div className="w-full bg-red-600 text-slate-100 font-mono text-xs font-bold text-center py-2 px-4 tracking-wider uppercase animate-pulse border-b border-red-500/50 flex items-center justify-center gap-2 relative z-50">
          <span>{t('status.emergency')}</span>
        </div>
      ) : (
        <div className="w-full bg-slate-900 border-b border-slate-800/60 text-slate-400 font-mono text-[10px] py-1 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>{t('status.secure')}</span>
        </div>
      )}

      {/* Header bar */}
      <header className={`${
        globalTheme === 'light'
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
          : 'bg-slate-900/60 border-slate-900 text-slate-100'
      } backdrop-blur-md border-b py-2.5 sm:py-3 px-3 sm:px-5 flex justify-between items-center shadow-md relative z-30 transition-colors`}>
        {/* Left Side: Hamburger trigger and Brand title */}
        <div className="flex items-center gap-3">
          {activeTab === 'home' ? (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all shadow-inner flex items-center justify-center cursor-pointer ${
                globalTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Open Navigation Menu"
              aria-label="Open menu drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('home')}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all shadow-inner flex items-center gap-1 cursor-pointer ${
                globalTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Return to Home"
              aria-label="Back to home"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center gap-2.5">
            <div className="text-left">
              <h1 className={`text-sm font-black tracking-wider uppercase font-mono leading-none flex items-center gap-1 ${
                globalTheme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}>
                SafetyLink <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded font-normal leading-none">v2.0</span>
              </h1>
              <p className={`text-[7px] font-mono uppercase tracking-widest mt-0.5 ${
                globalTheme === 'light' ? 'text-slate-500' : 'text-slate-500'
              }`}>Secure Active Node</p>
            </div>
          </div>
        </div>

        {/* Right Side: Language & Account */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="relative mr-0.5 group">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`appearance-none text-[9.5px] font-bold py-1.5 pl-2 pr-6 rounded-lg focus:outline-none transition-colors uppercase tracking-wider cursor-pointer border ${
                globalTheme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 focus:border-slate-400'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-300 focus:border-slate-600'
              }`}
            >
              <option value="en">🌐 English</option>
              <option value="zu">🌐 Zulu</option>
              <option value="af">🌐 Afrikaans</option>
              <option value="xh">🌐 Xhosa</option>
              <option value="st">🌐 Sesotho</option>
              <option value="tn">🌐 Setswana</option>
              <option value="ts">🌐 Tsonga</option>
              <option value="ss">🌐 Swati</option>
              <option value="ve">🌐 Venda</option>
              <option value="nr">🌐 Ndebele</option>
              <option value="nso">🌐 Sepedi</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-slate-300 transition-colors">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="text-right hidden md:block">
            <span className={`text-[10px] font-black block leading-none ${
              globalTheme === 'light' ? 'text-slate-900' : 'text-slate-200'
            }`}>{currentUser.fullName}</span>
            <span className="text-[7.5px] font-mono text-slate-500 uppercase mt-0.5 block leading-none">@{currentUser.username}</span>
          </div>

          {/* Active View Indicator Badge */}
          <span className={`text-[8.5px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border hidden sm:inline-block ${
            globalTheme === 'light' ? 'bg-slate-100' : 'bg-slate-950'
          } ${
            activeTab === 'home' ? 'text-red-400 border-red-500/20' :
            activeTab === 'deck' ? 'text-cyan-500 border-cyan-500/20' :
            activeTab === 'cameras' ? 'text-emerald-500 border-emerald-500/20' :
            activeTab === 'vault' ? 'text-emerald-500 border-emerald-500/20' :
            activeTab === 'contacts' ? 'text-blue-500 border-blue-500/20' :
            activeTab === 'ble' ? 'text-emerald-500 border-emerald-500/20' :
            activeTab === 'map' ? 'text-amber-500 border-amber-500/20' :
            activeTab === 'subsystems' ? 'text-indigo-500 border-indigo-500/20' :
            'text-purple-500 border-purple-500/20'
          }`}>
            {t(`tab.${activeTab}`)}
          </span>

          {/* Quick Download APK / Hub Button */}
          <a
            href={
              Capacitor.getPlatform() === 'android'
                ? 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk'
                : 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev/download/safetylink.apk'
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`px-2 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 ${
              globalTheme === 'light'
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-500/30 text-emerald-400'
            }`}
            title="Download SafetyLink Version 1 APK"
          >
            <span>⬇</span>
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            id="app-theme-toggle-btn"
            onClick={() => setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm shrink-0 ${
              globalTheme === 'dark'
                ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-500/50 hover:bg-slate-850'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-indigo-600 hover:border-indigo-400 hover:text-indigo-700'
            }`}
            title={globalTheme === 'dark' ? "Switch to Light Theme" : "Switch to Tactical Dark Theme"}
            aria-label="Toggle visual theme"
          >
            {globalTheme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => useAppStore.getState().logout()}
            className={`text-[9px] font-mono border px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              globalTheme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-red-600'
                : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-red-400'
            }`}
            title="Sign Out to Website"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className={`flex-1 min-h-0 pb-12 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`${activeTab === 'cameras' ? 'max-w-6xl' : 'max-w-md'} mx-auto ${activeTab === 'home' ? 'h-full flex flex-col p-2' : 'p-4 space-y-5'}`}>
          {/* Active Tab Screen Routing */}
          {activeTab === 'home' && (
            <div className="flex flex-col items-center h-full animate-fadeIn text-center py-2 gap-2">

              {/* OFFLINE QUEUE INDICATOR */}
              {localOfflineQueue && localOfflineQueue.length > 0 && (
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between mb-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📡</span>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-amber-400">OFFLINE SYNC PENDING</p>
                      <p className="text-[8.5px] text-amber-500/70">{localOfflineQueue.length} {localOfflineQueue.length === 1 ? 'event' : 'events'} waiting for network.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => syncOfflineQueue()} className="text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors">
                      RETRY
                    </button>
                    <button onClick={() => useAppStore.setState({ localOfflineQueue: [] })} className="text-[8px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                      CLEAR
                    </button>
                  </div>
                </div>
              )}

              {/* MIDDLE: SOS Button fills remaining space */}
              <div className="flex-1 w-full flex items-center justify-center">
                <PanicButton />
              </div>

              {/* BOTTOM: iTAG status + reassurance */}
              <div className="shrink-0 w-full space-y-2 pb-1">
                {bleDevices.length > 0 && (
                  <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-2 flex-wrap">
                    {bleDevices.slice(0, 2).map((d: any) => (
                      <div key={d.macAddress} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${d.connectionState === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : d.connectionState === 'CONNECTING' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-[9px] font-mono text-slate-400 truncate">{d.friendlyName}</span>
                        <span className="text-[8px] font-mono text-slate-600 shrink-0">{d.rssi}dBm</span>
                        {d.connectionState === 'DISCONNECTED' && (
                          <button
                            onClick={() => useAppStore.getState().connectBleDevice(d.macAddress)}
                            className="text-[7px] font-bold text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-lg hover:bg-blue-500/10 transition-all shrink-0"
                          >
                            RECONNECT
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="w-full bg-slate-900/40 border border-slate-900 rounded-2xl px-3 py-2.5 flex items-center gap-3">
                  <span className="text-lg shrink-0">🛡️</span>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] font-bold text-slate-200 leading-none">{t('home.reassurance_title')}, {currentUser.fullName?.split(' ')[0]}!</p>
                    {currentUser.orgCode && (
                      <span className="text-[7px] font-mono text-blue-400 uppercase tracking-wider">{currentUser.orgCode}</span>
                    )}
                    <p className="text-[8.5px] text-slate-500 leading-snug mt-0.5">{t('home.reassurance_subtitle')}</p>
                  </div>
                </div>
                
                {/* RESOURCEFUL QUICK ACTION SHORTCUTS */}
                <div className="w-full grid grid-cols-3 gap-1.5 mt-2" data-testid="home-quick-shortcuts">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">👤</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ble')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">📡</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Devices</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cameras')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">📹</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Cameras</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('vault')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">🔐</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Passwords</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contacts')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">👥</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Contacts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800/80 transition-all shadow-sm"
                  >
                    <span className="text-base leading-none">⚙️</span>
                    <span className="text-[7.5px] font-bold text-slate-200 uppercase tracking-widest text-center leading-tight">Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deck' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Location telemetry display */}
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Location...</div>}><LocationDisplay /></Suspense>

              {/* Status metrics bar */}
              <StatusIndicator />

              {/* Coordinated AI Hub: K'leva.info */}
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading AI Hub...</div>}><AIHub /></Suspense>

              {/* Informational Media & Resources Hub (TM Media Solutions) */}
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Media...</div>}><MediaHub /></Suspense>

              {/* Interactive Home Screen SOS Widget */}
              {demoMode && <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Simulator...</div>}><AndroidWidgetSimulator /></Suspense>}

              {/* Dynamic Pushed Tools & Settings */}
              {(() => {
                const orgCode = currentUser.orgCode;
                const visibleTools = customTools.filter(t => !t.targetOrgId || (orgCode && t.targetOrgId === orgCode));
                if (visibleTools.length === 0) return null;

                return (
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 text-left space-y-4 shadow animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <h3 className="text-xs font-black uppercase text-purple-300 font-mono tracking-wider">
                        🛠️ Your Custom Integration Tools
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {visibleTools.map((t) => {
                        const lat = userLocation?.lat || 0;
                        const lng = userLocation?.lng || 0;
                        const formattedVal = t.targetValue
                          .replace('{LAT}', lat.toFixed(6))
                          .replace('{LNG}', lng.toFixed(6));

                        const triggerAction = () => {
                          if (t.type === 'WHATSAPP') {
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(formattedVal)}`, '_blank');
                          } else if (t.type === 'CALL') {
                            window.open(`tel:${formattedVal}`, '_blank');
                          } else if (t.type === 'SMS') {
                            const smsPart = formattedVal.includes(':') ? formattedVal.split(':') : [formattedVal, ''];
                            window.open(`sms:${smsPart[0]}?body=${encodeURIComponent(smsPart[1])}`, '_blank');
                          } else if (t.type === 'WIDGET') {
                            window.open(formattedVal.startsWith('http') ? formattedVal : `https://${formattedVal}`, '_blank');
                          } else {
                            useAppStore.getState().addToast(`Tool [${t.title}]: ${t.description} (Value: ${t.targetValue})`, "info");
                          }
                        };

                        return (
                          <div key={t.id} className="p-3.5 bg-slate-950/85 border border-slate-900 rounded-2xl flex flex-col gap-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-100">{t.title}</span>
                                <span className="text-[8px] font-mono font-black px-1.5 py-0.5 bg-purple-950/20 text-purple-300 rounded border border-purple-500/10 uppercase">
                                  {t.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{t.description}</p>
                            </div>
                            
                            <button
                              onClick={triggerAction}
                              className="w-full py-2 bg-purple-900/40 hover:bg-purple-850 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 text-[10px] font-mono font-extrabold rounded-xl uppercase tracking-wider transition-all"
                            >
                              Launch Action {t.type === 'WHATSAPP' ? '💬' : t.type === 'CALL' ? '📞' : t.type === 'WIDGET' ? '🌐' : '⚡'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'cameras' && (
            <ErrorBoundary tabName="Live Cameras">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Live Camera Control Deck...</div>}>
                <div className="animate-fadeIn"><LiveCameraFeed scope="USER" /></div>
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === 'vault' && (
            <ErrorBoundary tabName="Vault">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Vault...</div>}>
                <div className="animate-fadeIn"><ConfidentialVault /></div>
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === 'contacts' && (
            <div className="animate-fadeIn">
              <DispatchChain />
            </div>
          )}

          {activeTab === 'ble' && (
            <div className="animate-fadeIn">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Scanner...</div>}><BLEScanner /></Suspense>
            </div>
          )}

          {activeTab === 'map' && (
            <ErrorBoundary tabName="Map">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Map...</div>}>
                <div className="animate-fadeIn"><OfflineMap /></div>
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === 'profile' && (
            <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Profile...</div>}><Profile /></Suspense>
          )}
          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Settings...</div>}><Settings /></Suspense>
            </div>
          )}

          
          
            {activeTab === 'intelligence' && (
              <div className="animate-fadeIn p-4 overflow-y-auto h-full">
                <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Intelligence...</div>}><SituationalAwareness /></Suspense>
              </div>
            )}
            {activeTab === 'subsystems' && (
            <div className="animate-fadeIn">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Subsystems...</div>}><AdvancedSubsystems /></Suspense>
            </div>
          )}
          {activeTab === 'store' && (
            <div className="animate-fadeIn h-full overflow-y-auto">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Store...</div>}><SafetyWareStore /></Suspense>
            </div>
          )}
          {activeTab === 'workspace' && (
            <div className="animate-fadeIn p-4 overflow-y-auto h-full">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Workspace...</div>}><WorkspaceIntegrations /></Suspense>
            </div>
          )}
          {activeTab === 'integrations' && (
            <div className="animate-fadeIn p-4 overflow-y-auto h-full">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Integrations Hub...</div>}><OpenPlatformHub /></Suspense>
            </div>
          )}
          {activeTab === 'media' && (
            <div className="animate-fadeIn p-4 overflow-y-auto h-full">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Media & Evidence Vault...</div>}><MediaHub /></Suspense>
            </div>
          )}

        </div>
      </main>

      {/* Collapsible Left Side Hamburger Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed left-0 top-0 h-[100dvh] w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-xl border-r border-slate-900 p-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col justify-between z-[60] overflow-y-auto overscroll-contain"
            >
              {/* Cinematic Background Image Slideshow at 60% opacity with ambient lighting */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 0.6 }} // 60% visibility exactly as requested
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <img
                      src={backgroundSlides[currentSlideIndex]}
                      alt="SafetyLink Support Background"
                      className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] saturate-[0.85]"
                      referrerPolicy="no-referrer"
                    />
                    {/* Shadow overlay to integrate nicely with UI */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950" />
                  </motion.div>
                </AnimatePresence>
                {/* HUD Overlay Scanlines and digital grid */}
                <div className="absolute inset-0 digital-grid opacity-[0.06]" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-red-500/5 mix-blend-color" />
              </div>

              <div className="space-y-6 relative z-10">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-2.5">
                    <LogoSetPart part="main" size={32} rounded="xl" />
                    <div className="text-left">
                      <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase font-mono leading-none">
                        SafetyLink Core
                      </h2>
                      <p className="text-[7px] text-slate-500 font-mono uppercase tracking-widest mt-1">Tactical Mesh Controller</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 bg-slate-900/60 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* User Info inside drawer */}
                <button onClick={() => { setActiveTab('profile'); setIsDrawerOpen(false); }} className="w-full p-3 bg-slate-900/40 border border-slate-900 rounded-2xl text-left flex items-center gap-3 hover:bg-slate-900/80 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-750 flex items-center justify-center text-base shadow-inner overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-200 truncate">{currentUser.fullName}</div>
                    <div className="text-[8.5px] font-mono text-slate-500 uppercase truncate">@{currentUser.username}</div>
                  </div>
                  <div className="text-[10px] text-slate-500">✎</div>
                </button>

                {/* Navigation Options */}
                <div className="space-y-1.5 text-left">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-2 px-1">
                    TACTICAL DASHBOARDS
                  </span>

                  <button
                    onClick={() => { setActiveTab('home'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'home'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🏠</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.home')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Control cockpit & beacon</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('deck'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'deck'
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🎛️</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.deck')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Support tools & telemetry</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('cameras'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'cameras'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">📹</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.cameras')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">WebRTC quad wall, PTZ &amp; talkback</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('vault'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'vault'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🔐</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">Password Manager</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">AES-256 encrypted logins &amp; PINs</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('contacts'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'contacts'
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">📞</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.contacts')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Alert cascading chain</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('ble'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'ble'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">📟</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.ble')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">iTAG wearables setup</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('map'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'map'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🗺️</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.map')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Offline GIS mapping</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('store'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'store'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🛒</span>
                    <span className="text-sm font-medium">SafetyWare Store</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('integrations'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'integrations'
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🔌</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">Integrations Hub</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Twilio, VAPI, Africa's Talking, PCB</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('media'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'media'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🎬</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">R2 Media & Evidence</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">138 verified Cloudflare R2 assets & videos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'settings'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">⚙️</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.settings')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Preferences & Ledger</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowDnsGuide(true); setIsDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                  >
                    <span className="text-sm shrink-0">🔑</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">DNS Shield</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Configure device DNS protection</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setIsLizzyOpen(true); setIsDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
                  >
                    <span className="text-sm shrink-0">🤖</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">Lizzy AI</p>
                      <p className="text-[7.5px] font-mono text-blue-400/80 mt-0.5">Voice check-in & safety assistant</p>
                    </div>
                  </button>
                </div>

                {/* Language preloader inside drawer */}
                <div className="space-y-2 text-left border-t border-slate-900 pt-4">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block px-1">
                    🌐 SOUTH AFRICAN TRANSLATIONS
                  </span>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 px-2.5 py-1.5 rounded-xl w-full">
                    <span className="text-xs">🌐</span>
                    <select
                      value={language}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '_more_') {
                          setActiveTab('settings');
                          setIsDrawerOpen(false);
                        } else {
                          useAppStore.getState().setLanguage(val);
                        }
                      }}
                      className="bg-transparent text-[9.5px] font-mono font-bold text-slate-300 focus:outline-none cursor-pointer uppercase border-none outline-none w-full"
                    >
                      {SA_LANGUAGES.map((lang) => {
                        const isPreloaded = lang.status === 'preloaded';
                        const isDownloaded = useAppStore.getState().downloadedLanguages.includes(lang.code);
                        const isAvailable = isPreloaded || isDownloaded;
                        
                        return (
                          <option 
                            key={lang.code} 
                            value={lang.code}
                            disabled={!isAvailable}
                            className="bg-slate-950 text-slate-100 font-bold"
                          >
                            {lang.flag} {lang.name} {!isAvailable ? ' ⬇️' : ''}
                          </option>
                        );
                      })}
                      <option value="_more_" className="bg-slate-950 text-blue-400 font-bold">⚙️ MANAGE PACKS...</option>
                    </select>
                  </div>
                </div>
              </div>

              
              {/* Floating Widget Toggle */}
              <div className="space-y-2 text-left border-t border-slate-900 pt-4 relative z-10">
                <div className="flex items-center justify-between bg-slate-950 border border-slate-900 px-3 py-2.5 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider font-mono block">
                      🛡️ FLOATING WIDGET
                    </span>
                    <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">Persistent safety toggle</span>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !isFloatingWidgetDeployed;
                      setFloatingWidgetDeployed(newState);
                      try {
                        import('@capacitor/core').then(({ Capacitor }) => {
                          const bridge = (Capacitor.Plugins as any).SafetyLinkBridge;
                          if (bridge) bridge.toggleFloatingWidget({ enable: newState });
                        });
                      } catch (e) {
                        console.warn(e);
                      }
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isFloatingWidgetDeployed ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-all ${isFloatingWidgetDeployed ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>


              {/* Drawer footer with partnership info & Sign Out */}
              <div className="space-y-4 pt-4 border-t border-slate-900 mt-6 relative z-10">
                <div className="space-y-1 text-left opacity-70">
                  <span className="text-[7px] text-slate-600 font-mono uppercase tracking-widest font-bold">COOPERATIVE BRANDS</span>
                  <div className="space-y-1 font-mono text-[8px] text-slate-400 font-bold">
                    <p>📹 TM MEDIA SOLUTIONS</p>
                    <p>⚡ K'LEVA.I SIMPLICITY</p>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); setIsDrawerOpen(false); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[9px] font-mono font-black text-red-400 hover:text-red-300 rounded-xl uppercase tracking-wider transition-all"
                >
                  🔑 SHUTDOWN SESSION
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    );
  };

  const getThemeClass = () => {
    let base = 'theme-personal';
    if (activeTab === 'deck') {
      base = currentUser?.orgCode ? 'theme-responder' : 'theme-personal';
    }
    return globalTheme === 'light' ? `${base} theme-light` : base;
  };

  return (
    <div className={`min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-y-auto ${getThemeClass()} ${demoMode ? 'scanlines' : ''}`}>
      <GlobalBackground />
      {showSplash && <SplashReveal onComplete={() => setShowSplash(false)} />}
      {trialExpired && <TrialLockOverlay />}
      <UpdateBanner updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      <TrialReminderModal />

      {/* High fidelity cyber background lighting elements */}
      
      
      

      {mapsQuotaError && (
        <div className="sticky top-0 z-[99998] w-full bg-amber-950/95 border-b border-amber-500/40 px-4 py-2 text-amber-200 text-xs font-mono flex items-center justify-between gap-3">
          <span>⚠️ {mapsQuotaError} (Emergency dispatch remains unaffected.)</span>
          <button onClick={() => setMapsQuotaError(null)} className="text-amber-400 hover:text-white font-bold px-2">Dismiss</button>
        </div>
      )}

      {activeTab === 'deck' && !currentOrg && <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Radar...</div>}><GlobalRadarBackground /></Suspense>}

      {/* Single Canonical Emergency Countdown Overlay (replaces duplicate double countdowns) */}
      <TrialBanner />
      <ForcedCountdownOverlay />

      {/* Critical Wearable Device Alert Sentinel Overlay */}
      <DeviceAlertOverlay />
      <PermissionsOnboardingModal />
      <LizzyPopup />
      {showDnsGuide && <DnsSetupGuide onClose={() => setShowDnsGuide(false)} />}

      {/* Minimum Supported Version Enforcement Gate */}
      {updateInfo?.updateRequiredBlocked && (
        <div className="fixed inset-0 z-[9999999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-2xl">⚠️</div>
            <h2 className="text-lg font-black font-mono text-white uppercase tracking-wider">Mandatory Update Required</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {updateInfo.releaseNotes || `Your app version is below the minimum supported release (v${updateInfo.minSupportedVersion}). Please update to continue using SafetyLink.`}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              {updateInfo.apkUrl && (
                <a
                  href={updateInfo.apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider text-center"
                >
                  Download Updated APK (v{updateInfo.version})
                </a>
              )}
              {updateInfo.exeUrl && (
                <a
                  href={updateInfo.exeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider text-center"
                >
                  Download Desktop Update (v{updateInfo.version})
                </a>
              )}
              <button
                type="button"
                onClick={() => checkAppUpdates()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs uppercase cursor-pointer"
              >
                Recheck Version Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Registration Profile Summary & Org Code Copy Popup */}
      {profileCreatedSummary && (
        <div className="fixed inset-0 z-[999998] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl font-mono text-left">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-black">✓</div>
              <div>
                <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wider">{profileCreatedSummary.title}</h3>
                <p className="text-[10px] text-slate-400">
                  {profileCreatedSummary.provisionalOffline
                    ? 'Saved offline — automatic server sync queued'
                    : 'Signed in automatically to your active session'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              {profileCreatedSummary.fullName && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Name:</span>
                  <span className="text-slate-100 font-bold">{profileCreatedSummary.fullName}</span>
                </div>
              )}
              {profileCreatedSummary.username && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Username:</span>
                  <span className="text-slate-200">@{profileCreatedSummary.username}</span>
                </div>
              )}
              {profileCreatedSummary.email && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-200 truncate">{profileCreatedSummary.email}</span>
                </div>
              )}
              {profileCreatedSummary.role && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Role:</span>
                  <span className="text-cyan-300 font-bold">{profileCreatedSummary.role}</span>
                </div>
              )}
              {profileCreatedSummary.pinConfigured && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Safety PIN:</span>
                  <span className="text-emerald-400 font-bold">Armed (4 digits)</span>
                </div>
              )}
            </div>

            {profileCreatedSummary.orgCode && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] text-emerald-400 uppercase font-bold block">Organization ID / Mesh Code</span>
                  <span className="text-sm font-black text-white tracking-widest select-all">{profileCreatedSummary.orgCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(profileCreatedSummary.orgCode || '').catch(() => {});
                    addToast(`Copied Organization Code: ${profileCreatedSummary.orgCode}`, 'success');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setProfileCreatedSummary(null)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* Primary Dynamic App Screen Container */}
      <div className="flex-1 relative flex flex-col z-10">
        {renderMainBody()}
      </div>

      {/* Unified Non-overlapping Toast Stack */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-xs px-4 pointer-events-none">
        <AnimatePresence>
          {toasts && toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 35, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
              className={`p-3 rounded-2xl shadow-2xl border flex items-start gap-2.5 pointer-events-auto relative overflow-hidden font-mono text-[9.5px] ${
                toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/20 text-emerald-300' :
                toast.type === 'error' ? 'bg-red-950/90 border-red-500/20 text-red-300' :
                toast.type === 'warn' ? 'bg-amber-950/90 border-amber-500/20 text-amber-300' :
                'bg-slate-900/90 border-slate-800 text-slate-300'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <span className="text-xs shrink-0 mt-0.5">
                {toast.type === 'success' ? '✅' :
                 toast.type === 'error' ? '❌' :
                 toast.type === 'warn' ? '⚠️' : 'ℹ️'}
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="font-extrabold text-[8px] text-slate-500 uppercase tracking-wider leading-none">
                  {toast.type === 'success' ? 'Task Complete' :
                   toast.type === 'error' ? 'System Warning' :
                   toast.type === 'warn' ? 'Tactical Notice' : 'Telemetry Link'}
                </p>
                <p className="font-bold text-slate-200 mt-1 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Post-Emergency AI Follow-Up Card (appears automatically after any emergency is disarmed or resolved) */}
      <AnimatePresence>
        {postEmergencyPrompt && !isLizzyOpen && !decoyActive && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[370px] z-[115] bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-left"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Post-Emergency Care Check-In
                </p>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  Are you safe right now?
                </h4>
              </div>
              <button
                type="button"
                onClick={dismissPostEmergencyPrompt}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
                aria-label="Dismiss post-emergency check-in"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Lizzy AI can talk with you live, guide you through calming breaths, or help draft an update for your contacts or SAPS.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openLizzyCompanion('voice')}
                className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-mono font-bold uppercase tracking-wider transition-colors"
              >
                🎙️ Live Voice
              </button>
              <button
                type="button"
                onClick={() => openLizzyCompanion('chat')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold uppercase tracking-wider transition-colors"
              >
                💬 Care Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-accessible Kleva AI & SafetyLink Shield Live Voice / Care Launcher */}
      {!isLizzyOpen && !decoyActive && !showSplash && (
        <div className="fixed bottom-4 right-4 z-[110] flex items-center gap-2" data-testid="floating-ai-launcher">
          <button
            type="button"
            onClick={() => openLizzyCompanion('voice')}
            title="Start Real-Time Voice Conversation with Kleva / Lizzy AI"
            className="flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-slate-950/90 hover:bg-slate-900 text-cyan-300 shadow-2xl border border-cyan-500/40 text-xs font-mono font-bold tracking-wide transition-all cursor-pointer backdrop-blur-md"
          >
            <span className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
              🎙️
            </span>
            <span className="hidden sm:inline">Live Voice</span>
          </button>
          <button
            type="button"
            onClick={() => openLizzyCompanion('chat')}
            title="Open Kleva AI Safety & Post-Emergency Companion"
            className="group flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-slate-950/95 hover:bg-slate-900 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] border border-emerald-400/50 text-xs font-mono font-black tracking-wide transition-all cursor-pointer backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-400/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {!klevaLogoFailed ? (
                <img
                  src={klevaLogo}
                  alt="Kleva AI"
                  onError={() => setKlevaLogoFailed(true)}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <SLShieldLogo className="w-7 h-7" />
              )}
            </div>
            <div className="text-left leading-tight">
              <span className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider">Kleva AI</span>
              <span className="block text-[7.5px] text-slate-400 uppercase tracking-widest">Safety Care</span>
            </div>
          </button>
        </div>
      )}

      {/* Lizzy / Kleva AI Safety & Post-Emergency Companion Drawer */}
      <Suspense fallback={null}><KlevaBot isOpen={isLizzyOpen} onClose={() => setIsLizzyOpen(false)} /></Suspense>

      {/* Incoming FCM Emergency Contact Ring Modal */}
      <IncomingEmergencyRingModal />

      {/* Sizable Movable Deployed Floating Panic Button Widget */}
      <FloatingPanicWidget />

      {/* SafetyLink Core SA-Pty Commerce Center & Quotation Portal */}
      <FirstLaunchDisclaimer />

      {/* Sensitive Permissions & Google Play Privacy Notice Modal */}
      <PrivacyNoticeModal />

    </div>
  );
};

export default App;
