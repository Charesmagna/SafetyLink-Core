import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PanicButton } from './components/PanicButton';
import { DispatchChain } from './components/DispatchChain';
import { BLEScanner } from './components/BLEScanner';
const OfflineMap = lazy(() => import('./components/OfflineMap').then(m => ({ default: m.OfflineMap })));
import { Settings } from './components/Settings';
import { StatusIndicator } from './components/StatusIndicator';
import { LocationDisplay } from './components/LocationDisplay';
import { GeolocationService } from './services/BaseService';
import { LocalNotificationService } from './services/LocalNotificationService';
import { useAppStore } from './utils/store';
import { AuthScreen } from './components/AuthScreen';
import { OrgDashboard } from './components/OrgDashboard';
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
import { SafetyLinkLogo } from './components/SafetyLinkLogo';
import { LizzyPopup } from './components/LizzyPopup';
import { LogoSetPart } from './components/LogoSetPart';
import { AppTour } from './components/AppTour';
import { AIHub } from './components/AIHub';
import { MediaHub } from './components/MediaHub';
import { AndroidWidgetSimulator } from './components/AndroidWidgetSimulator';
import { translate, SA_LANGUAGES } from './utils/translations';
import { KlevaBot } from './components/KlevaBot';
import { GlobalRadarBackground } from './components/GlobalRadarBackground';
import { FloatingPanicWidget } from './components/FloatingPanicWidget';
import { CommerceCenter } from './components/CommerceCenter';
import { ForcedCountdownOverlay } from './components/ForcedCountdownOverlay';
import { SosCountdownOverlay } from './components/SosCountdownOverlay';
import { useEmergencyListener } from './hooks/useEmergencyListener';
import { useTacticalSensors } from './hooks/useTacticalSensors';
import { DeviceAlertOverlay } from './components/DeviceAlertOverlay';
import { AdvancedSubsystems } from './components/AdvancedSubsystems';
import { DecoyCalculator } from './components/DecoyCalculator';
const ConfidentialVault = lazy(() => import('./components/ConfidentialVault').then(m => ({ default: m.ConfidentialVault })));
import { App as CapApp } from '@capacitor/app';
import { motion, AnimatePresence } from 'motion/react';

import slide1 from './assets/images/safetylink_officer_phone_1783207722148.jpg';
import slide2 from './assets/images/safetylink_team_tablet_1783207733837.jpg';
import slide3 from './assets/images/regenerated_image_1784546645212.png';
import slLogoMain from './assets/safetylink-metallic.svg';
import slLogoSet from './assets/images/sl_logoset.jpeg';
import newBg1 from './assets/images/background1.jpeg';
import newLogo1 from '/media/new_logo/New_SafetyLink_Official_Logo.svg';
const klevaLogo = '/media/kleva_logo/Kleva.svg';
import polishLogo from '/media/new_logo/New_SafetyLink_Official_Logo.svg';

type TabId = 'home' | 'deck' | 'vault' | 'contacts' | 'ble' | 'map' | 'settings' | 'subsystems';

const App: React.FC = () => {
  const [isSosActive, setIsSosActive] = useState(false);

  // The custom hook catches the Native Kotlin BLE Broadcast
  const { startSensors } = useTacticalSensors();
  useEmergencyListener(() => {
    setIsSosActive(true); // Wakes up the React overlay
  });

  const handleTrueCancel = () => {
    console.log("SOS Canceled cleanly.");
    setIsSosActive(false);
  };

  const handleDuressTrigger = () => {
    console.warn("DURESS PROTOCOL ACTIVATED");
    setIsSosActive(false); // Make it look like it was canceled to the attacker
    useAppStore.getState().addAuditLog('SYSTEM', 'SEVERE', 'Duress Protocol Activated', 'Duress PIN used. Silent escalation.');
  };

  const handleFinalDispatch = () => {
    console.error("TIMER EXPIRED. DISPATCHING PAYLOAD.");
    setIsSosActive(false); // Close the overlay
    useAppStore.getState().triggerPanic('Emergency SOS: Timer expired via BLE/Hardware button.');
  };
  const { 
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
    demoMode
  } = useAppStore();
  
  const t = (key: string) => {
    if (key === 'tab.deck') return 'Control Deck';
    if (key === 'tab.vault') return 'Confidential Vault';
    return translate(language, key);
  };
  
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Failsafe: hide splash screen after 5 seconds just in case video doesn't play or end
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
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
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // 4. Block Back Button during SOS
      if (isSosActive) {
        console.warn("Back button blocked: SOS Countdown is active.");
        return;
      }

      if (isDrawerOpen) {
        setIsDrawerOpen(false);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      } else {
        if (!canGoBack) {
          setShowExitConfirm(true);
        }
      }
    });
    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [isDrawerOpen, activeTab, isSosActive]);

  useEffect(() => {
    // Bootstrap tracking and simulated BLE hardware listeners on mount
    const geoService = GeolocationService.getInstance();
    
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

    geoService.startTracking();
    startSensors();

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
    }, 4000);
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
    if (decoyActive) {
      return <DecoyCalculator />;
    }

    if (superAdminActive) {
      return <ErrorBoundary tabName="Admin"><Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Admin...</div>}><AdminPanel /></Suspense></ErrorBoundary>;
    }

    if (currentOrg || (currentUser && currentUser.orgCode && ['Organization Administrator', 'Control Room Operator', 'Dispatcher', 'Responder'].includes(currentUser.role || ''))) {
      return <OrgDashboard />;
    }

    if (!currentUser) {
      return <AuthScreen />;
    }



    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

      
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
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
        <AppTour
          onClose={(neverShowAgain) => {
            if (neverShowAgain) {
              localStorage.setItem('sl_skip_tour', 'true');
            }
            setShowTour(false);
          }}
        />
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
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-900 py-3 px-5 flex justify-between items-center shadow-md relative z-30">
        {/* Left Side: Hamburger trigger and Brand title */}
        <div className="flex items-center gap-3.5">
          {activeTab === 'home' ? (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-inner"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('home')}
              className="p-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-inner flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center gap-2.5">
            <LogoSetPart part="badge" size={40} rounded="xl" />
            <div className="text-left">
              <h1 className="text-sm font-black tracking-wider text-slate-100 uppercase font-mono leading-none flex items-center gap-1">
                SafetyLink <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded font-normal leading-none">v2.0</span>
              </h1>
              <p className="text-[7px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Secure Active Node</p>
            </div>
          </div>
        </div>

        {/* Right Side: Language & Account */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-1 mr-2">
            {['en', 'zu', 'af', 'st', 'xh'].map((code) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`text-[9px] font-bold px-1.5 py-1 rounded transition-colors uppercase ${language === code ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {code}
              </button>
            ))}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-200 block leading-none">{currentUser.fullName}</span>
            <span className="text-[7.5px] font-mono text-slate-500 uppercase mt-0.5 block leading-none">@{currentUser.username}</span>
          </div>

          <div className="h-4.5 w-[1px] bg-slate-850" />

          {/* Active View Indicator Badge */}
          <span className={`text-[8.5px] font-mono font-bold tracking-wider uppercase bg-slate-950 px-2.5 py-1 rounded-full border ${
            activeTab === 'home' ? 'text-red-400 border-red-500/10' :
            activeTab === 'deck' ? 'text-cyan-400 border-cyan-500/10' :
            activeTab === 'vault' ? 'text-emerald-400 border-emerald-500/10' :
            activeTab === 'contacts' ? 'text-blue-400 border-blue-500/10' :
            activeTab === 'ble' ? 'text-emerald-400 border-emerald-500/10' :
            activeTab === 'map' ? 'text-amber-400 border-amber-500/10' :
            activeTab === 'subsystems' ? 'text-indigo-400 border-indigo-500/10' :
            'text-purple-400 border-purple-500/10'
          }`}>
            {t(`tab.${activeTab}`)}
          </span>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className={`flex-1 min-h-0 pb-12 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`max-w-md mx-auto ${activeTab === 'home' ? 'h-full flex flex-col p-2' : 'p-4 space-y-5'}`}>
          {/* Active Tab Screen Routing */}
          {activeTab === 'home' && (
            <div className="flex flex-col items-center h-full animate-fadeIn text-center py-2 gap-2">
              {/* TOP: Logo */}
              <div className="shrink-0 pt-1">
                <SafetyLinkLogo size={72} showText={true} />
              </div>

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
                
                {/* QUICK ACTION SHORTCUTS */}
                <div className="w-full grid grid-cols-5 gap-1.5 mt-2">
                  <button onClick={() => setActiveTab('ble')} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-sm">
                    <span className="text-base leading-none">📡</span>
                    <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-widest text-center leading-tight">Devices</span>
                  </button>
                  <button onClick={() => setActiveTab('map')} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-sm">
                    <span className="text-base leading-none">🗺️</span>
                    <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-widest text-center leading-tight">Map</span>
                  </button>
                  <button onClick={() => setCommerceModalOpen(true)} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-sm">
                    <span className="text-base leading-none">🛒</span>
                    <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-widest text-center leading-tight">Store</span>
                  </button>
                  <button onClick={() => setActiveTab('contacts')} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-sm">
                    <span className="text-base leading-none">👥</span>
                    <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-widest text-center leading-tight">Alerts</span>
                  </button>
                  <button onClick={() => setActiveTab('vault')} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-sm">
                    <span className="text-base leading-none">🗄️</span>
                    <span className="text-[7.5px] font-bold text-slate-300 uppercase tracking-widest text-center leading-tight">Vault</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deck' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Location telemetry display */}
              <LocationDisplay />

              {/* Status metrics bar */}
              <StatusIndicator />

              {/* Coordinated AI Hub: K'leva.info */}
              <AIHub />

              {/* Informational Media & Resources Hub (TM Media Solutions) */}
              <MediaHub />

              {/* Interactive Home Screen SOS Widget */}
              {demoMode && <AndroidWidgetSimulator />}

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
                        const lat = userLocation?.lat || -26.191200;
                        const lng = userLocation?.lng || 28.026400;
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
              <BLEScanner />
            </div>
          )}

          {activeTab === 'map' && (
            <ErrorBoundary tabName="Map">
              <Suspense fallback={<div className="text-center text-slate-500 text-xs py-8">Loading Map...</div>}>
                <div className="animate-fadeIn"><OfflineMap /></div>
              </Suspense>
            </ErrorBoundary>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <Settings />
            </div>
          )}

          {activeTab === 'subsystems' && (
            <div className="animate-fadeIn">
              <AdvancedSubsystems />
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
              className="fixed top-0 left-0 bottom-0 w-80 bg-slate-950/80 backdrop-blur-xl border-r border-slate-900 p-5 flex flex-col justify-between z-50 overflow-y-auto relative"
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
                <div className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl text-left flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-750 flex items-center justify-center text-base shadow-inner">
                    👤
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-black text-slate-200 truncate">{currentUser.fullName}</div>
                    <div className="text-[8.5px] font-mono text-slate-500 uppercase truncate">@{currentUser.username}</div>
                  </div>
                </div>

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
                    onClick={() => { setActiveTab('vault'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'vault'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">🛡️</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.vault')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Secure files & app locking</p>
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

                  {demoMode && (
                  <button
                    onClick={() => { setActiveTab('subsystems'); setIsDrawerOpen(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                      activeTab === 'subsystems'
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm shrink-0">💻</span>
                    <div className="text-left">
                      <p className="text-xs font-extrabold uppercase font-display leading-none">{t('tab.subsystems')}</p>
                      <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">Hardware & Chaos Simulator</p>
                    </div>
                  </button>
                  )}
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
    if (superAdminActive) return 'theme-admin';
    if (currentOrg) return 'theme-org';
    if (currentUser) {
      return currentUser.orgCode ? 'theme-responder' : 'theme-personal';
    }
    return 'theme-personal';
  };

  return (
    <div className={`h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden relative ${getThemeClass()} ${demoMode ? 'scanlines' : ''}`}>

      {/* High fidelity cyber background lighting elements */}
      {showSplash && (
        <div className="fixed inset-0 z-[999999] bg-black flex items-center justify-center">
          <video
            autoPlay
            muted
            playsInline
            onEnded={() => setShowSplash(false)}
            onError={() => setShowSplash(false)}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/media/petal_20260720_023729.mp4" type="video/mp4" />
          </video>
        </div>
      )}
      <div className="police-wash pointer-events-none" />
      
      <div className="flare-line-container pointer-events-none">
        <div className="flare-line flare-line-1" />
        <div className="flare-line flare-line-2" />
      </div>

      {activeTab === 'deck' && !currentOrg && <GlobalRadarBackground />}
      {/* Background Video */}
      {(activeTab === 'home' && !currentOrg) && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none brightness-50"
        >
          <source src="/media/petal_20260720_024055.mp4" type="video/mp4" />
        </video>
      )}
      {demoMode && (
        <div className="demo-simulated-overlay select-none pointer-events-none">
          <span>EXPERIMENTAL LIVE MODE • SIMULATED BROADCAST LINKS</span>
        </div>
      )}

      {/* Persistent System Status Bar & Background Notification Tray */}

      {/* High-Priority Emergency Overlay */}
      <ForcedCountdownOverlay />
      <SosCountdownOverlay 
        isActive={isSosActive}
        onTrueCancel={handleTrueCancel}
        onDuressTrigger={handleDuressTrigger}
        onDispatchSOS={handleFinalDispatch}
      />

      {/* Critical Wearable Device Alert Sentinel Overlay */}
      <DeviceAlertOverlay />
      <LizzyPopup />

      {/* Primary Dynamic App Screen Container */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden z-10">
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

      {/* Floating Lizzy - K'lev.ai South African Safety Assistant Bot */}
      <KlevaBot />

      {/* Sizable Movable Deployed Floating Panic Button Widget */}
      <FloatingPanicWidget />

      {/* SafetyLink Core SA-Pty Commerce Center & Quotation Portal */}
      <CommerceCenter />

    </div>
  );
};

export default App;
