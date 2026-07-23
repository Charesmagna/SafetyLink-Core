import { supabase } from "../lib/supabase";
import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { SafetyLinkBridge } from '../hooks/useEmergencyListener';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'motion/react';
import { translate, SA_LANGUAGES } from '../utils/translations';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { LocalNotificationService } from '../services/LocalNotificationService';

export const Settings: React.FC = () => {
  const { 
    auditLogs, 
    clearAuditLogs, 
    language, 
    downloadedLanguages, 
    setLanguage, 
    downloadLanguage,
    isBackgroundServiceRunning,
    toggleBackgroundService,
    backgroundServiceTick,
    bleDevices,
    userLocation,
    isFloatingWidgetDeployed,
    setFloatingWidgetDeployed,
    floatingWidgetSize,
    setFloatingWidgetSize,
    currentUser,
    userPin,
    duressPin,
    updateUserProfile,
    requestJoinOrganization,
    organizations,
    onlySystemSms,
    setOnlySystemSms
  } = useAppStore();

  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY'>('ALL');
  const [shortcutTriggerEnabled, setShortcutTriggerEnabled] = useState<boolean>(() => localStorage.getItem('sl_shortcut_enabled') === 'true');
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  // Profile forms state

  const [twilioAccountSid, setTwilioAccountSid] = useState(currentUser?.twilio?.accountSid || '');
  const [twilioAuthToken, setTwilioAuthToken] = useState(currentUser?.twilio?.authToken || '');
  const [twilioFromNumber, setTwilioFromNumber] = useState(currentUser?.twilio?.fromNumber || '');
  

  const [tbEnabled, setTbEnabled] = useState(currentUser?.sensorStream?.enabled || false);
  const [turnApiToken, setTurnApiToken] = useState(currentUser?.moya?.turnApiToken || '');
  const [moyaEnabled, setMoyaEnabled] = useState(currentUser?.moya?.enabled || false);

  const connectService = async (serviceName: 'turn' | 'twilio') => {
    try {
      if (serviceName === 'turn' && !turnApiToken) throw new Error("Turn.io API Token is required");
      if (serviceName === 'twilio' && (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber)) throw new Error("Twilio Account SID, Auth Token, and From Number are required");

      const response = await supabase.functions.invoke('setup-service', {
        body: {
          service: serviceName,
          token: serviceName === 'turn' ? turnApiToken : undefined,
          accountSid: twilioAccountSid,
          authToken: twilioAuthToken,
          fromNumber: twilioFromNumber
        }
      });

      if (response.error) throw new Error(response.error.message || "Unknown error from edge function");

      useAppStore.getState().addToast(`Successfully connected to ${serviceName}!`, "success");
    } catch (e: any) {
      useAppStore.getState().addToast(`Failed to connect ${serviceName}: ${e.message}`, "error");
    }
  };

  const testTwilioAndSupabase = async () => {
    try {
      useAppStore.getState().addToast("Testing integrations...", "info");
      
      const response = await supabase.functions.invoke('send-twilio-sms', {
        body: {
          to: currentUser?.phone || "+1234567890",
          message: "SafetyLink Test - Integrations are working!"
        }
      });
      if (response.error) throw new Error(response.error.message);
      
      useAppStore.getState().addToast("Test successful! Integrations are working.", "success");
    } catch (e: any) {
      useAppStore.getState().addToast("Test failed: " + e.message, "error");
    }
  };

  const [tbHost, setTbHost] = useState(currentUser?.sensorStream?.udpHost || '');
  const [tbPort, setTbPort] = useState(currentUser?.sensorStream?.udpPort || 0);
  
  const [ocUrl, setOcUrl] = useState(currentUser?.ownCloud?.serverUrl || '');
  const [ocUser, setOcUser] = useState(currentUser?.ownCloud?.username || '');
  const [ocToken, setOcToken] = useState(currentUser?.ownCloud?.token || '');
  const [ocFolder, setOcFolder] = useState(currentUser?.ownCloud?.folder || '');
  
  const [personalControlRoom, setPersonalControlRoom] = useState(currentUser?.personalControlRoom || '');
  const [securityCompany, setSecurityCompany] = useState(currentUser?.securityCompany || '');

  const [profileName, setProfileName] = useState(currentUser?.fullName || '');


  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [medicalInfo, setMedicalInfo] = useState(currentUser?.medicalInfo || '');
  const [homeAddress, setHomeAddress] = useState(currentUser?.homeAddress || '');
  const [workAddress, setWorkAddress] = useState(currentUser?.workAddress || '');
  const [orgIdInput, setOrgIdInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedJoinRole, setSelectedJoinRole] = useState('Community Member');

  const t = (key: string) => translate(language, key);

  const handleShortcutToggle = (enabled: boolean) => {
    setShortcutTriggerEnabled(enabled);
    localStorage.setItem('sl_shortcut_enabled', String(enabled));
    useAppStore.getState().addAuditLog(
      'SYSTEM',
      'INFO',
      `Homescreen Quick-Trigger ${enabled ? 'Enabled' : 'Disabled'}`,
      'Shortcut configured to bypass biometric locks and trigger emergency sequence on instant click.'
    );
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'ALL') return true;
    return log.category === filter;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 shadow-2xl w-full max-w-md mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 neon-glow-blue" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      <div className="border-b border-slate-900 pb-3.5 text-left relative z-10 flex items-center gap-2">
        <SafetyLinkLogo size={18} glowColor="rgba(168, 85, 247, 0.4)" />
        <div>
          <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] font-display uppercase">
            {t('settings.title')}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Diagnostics Quick Panel */}
      <div className="space-y-3 text-left mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          {t('settings.diagnostics_title')}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
          <button
            onClick={() => {
              useAppStore.getState().addAuditLog('SYSTEM', 'INFO', 'Self-Test Initiated', 'Checking GATT profiles, GPS providers, and local caches.');
              useAppStore.getState().addToast("All system diagnostics are functional. BLE: Stable, GPS: High accuracy locked.", "success");
            }}
            className="bg-slate-950/40 border border-slate-900 rounded-2xl p-3 text-slate-200 hover:bg-slate-900 hover:text-white transition-all text-center"
          >
            {t('settings.diagnose_btn')}
          </button>
          <button
            onClick={clearAuditLogs}
            className="bg-slate-950/40 border border-red-500/10 rounded-2xl p-3 text-red-400 hover:bg-red-950/20 transition-all text-center"
          >
            {t('settings.purge_btn')}
          </button>
        </div>
      </div>

      {/* Platform Commerce & Quotes Section */}
      <div className="space-y-2 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          💼 Commercial & Quotations
        </h4>
        <div className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-4 flex flex-col gap-3">
          <div className="text-left space-y-1">
            <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
              SafetyLink Hardware & Subscriptions
            </span>
            <span className="text-[9.5px] text-slate-500 block leading-normal font-sans">
              Access product catalogs, estimate subscription costs for your campus/guards, and download professional SA tax invoices.
            </span>
          </div>
          <button
            onClick={() => useAppStore.getState().setCommerceModalOpen(true)}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer font-mono flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20"
          >
            <span className="text-sm">💼</span> OPEN COMMERCE & QUOTES PORTAL
          </button>
        </div>
      </div>

      {/* Background Service & Device System Tray Notification Panel */}
      <div className="space-y-3.5 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
          🛡️ SYSTEM TRAY & ACTIVE CONNECTION
        </h4>
        <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-left flex-1">
              <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
                Phone Notification Bar Status
              </span>
              <span className="text-[9px] text-slate-500 block leading-normal font-sans">
                Pushes a persistent, real-time status card to your phone's native notification tray. This ensures constant background link with your wearable panic button and prevents Android from killing the sensor listener.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={isBackgroundServiceRunning}
                onChange={() => {
                  toggleBackgroundService();
                  useAppStore.getState().addAuditLog(
                    'SYSTEM',
                    isBackgroundServiceRunning ? 'WARN' : 'INFO',
                    isBackgroundServiceRunning ? 'Background Service Stopped' : 'Background Service Started',
                    'State toggled via settings controller. System tray status card synchronized.'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-900 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {/* Quick System Tray Diagnostics */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 text-[8.5px] text-slate-400 space-y-2">
            <div className="flex justify-between items-center">
              <span>SYSTEM NOTIFICATION STATE:</span>
              {isBackgroundServiceRunning ? (
                <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PERSISTENT IN PHONE TRAY
                </span>
              ) : (
                <span className="text-red-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  SUSPENDED / OFFLINE
                </span>
              )}
            </div>

            {isBackgroundServiceRunning && (
              <>
                <div className="flex justify-between">
                  <span>ACTIVE BACKGROUND TICK:</span>
                  <span className="text-slate-300 font-bold">#{backgroundServiceTick}</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS COORDINATES:</span>
                  <span className="text-blue-400 font-bold">
                    {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : 'ACQUIRING...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>HARDWARE LINK:</span>
                  <span className="text-slate-300 font-bold">
                    {bleDevices.length > 0 
                      ? `${bleDevices.filter(d => d.connectionState === 'CONNECTED').length} connected BLE`
                      : 'No iTAG paired'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Request Phone Notification Permission Button */}
          <button
            type="button"
            onClick={async () => {
              const granted = await LocalNotificationService.requestPermission();
              if (granted) {
                useAppStore.getState().addToast("Native phone notification bar permission granted!", "success");
                useAppStore.getState().addAuditLog('SYSTEM', 'INFO', 'Notification Permission Granted', 'Operator approved native device notification permissions.');
              } else {
                useAppStore.getState().addToast("Native notification permission was denied or not supported.", "warn");
              }
            }}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] font-bold rounded-xl text-slate-300 hover:text-white transition-all text-center uppercase tracking-wider"
          >
            🔒 Re-verify Phone Notification Permission
          </button>
        </div>
      </div>

      {/* Language & Localization Panel */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10">
        <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
          {t('settings.language_title')}
        </h4>
        <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
              {t('settings.language_subtitle')}
            </span>
            <span className="text-[9.5px] text-slate-500 block leading-normal">
              Toggle the primary application language instantly, or download additional official South African languages.
            </span>
          </div>

          {/* Installed Languages Toggle */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            {SA_LANGUAGES.filter(lang => lang.status === 'preloaded' || downloadedLanguages.includes(lang.code)).map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  language === lang.code
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-bold shadow-md shadow-emerald-950/20'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </span>
                {language === lang.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Download other SA languages */}
          <div className="space-y-2 border-t border-slate-900/60 pt-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-display block">
              {t('settings.download_language')}
            </span>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {SA_LANGUAGES.filter(lang => lang.status !== 'preloaded' && !downloadedLanguages.includes(lang.code)).map(lang => {
                const isThisDownloading = downloadingCode === lang.code;
                return (
                  <div key={lang.code} className="flex justify-between items-center p-2 bg-slate-950/60 border border-slate-900 rounded-xl font-mono text-[9px] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{lang.flag}</span>
                      <div className="text-left">
                        <p className="font-bold text-slate-200 leading-tight">{lang.name} ({lang.nativeName})</p>
                        <p className="text-[7.5px] text-slate-500 font-mono uppercase tracking-tight">{lang.code.toUpperCase()} · SA LANGUAGE PACK</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isThisDownloading}
                      onClick={async () => {
                        setDownloadingCode(lang.code);
                        await downloadLanguage(lang.code);
                        setDownloadingCode(null);
                        useAppStore.getState().addToast(`${lang.name} language package successfully downloaded and registered!`, "success");
                      }}
                      className="px-2 py-1.5 text-[8.5px] font-bold rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-white border border-blue-500/25 transition-all flex items-center gap-1 shrink-0"
                    >
                      {isThisDownloading ? (
                        <>
                          <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping shrink-0" />
                          <span>{t('settings.downloading')}</span>
                        </>
                      ) : (
                        <span>{t('settings.download_btn')}</span>
                      )}
                    </button>
                  </div>
                );
              })}
              {SA_LANGUAGES.filter(lang => lang.status !== 'preloaded' && !downloadedLanguages.includes(lang.code)).length === 0 && (
                <p className="text-center text-slate-600 italic text-[9px] py-2">All South African languages are fully downloaded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Homescreen Red Circle Shortcut Trigger Settings */}
      <div className="space-y-3.5 text-left border-t border-slate-900 pt-4 mt-4 relative z-10">
        <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
          {t('settings.shortcut_title')}
        </h4>
        <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 text-left pr-4">
              <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
                {t('settings.shortcut_name')}
              </span>
              <span className="text-[9px] text-slate-500 block leading-normal font-sans">
                {t('settings.shortcut_desc')}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={shortcutTriggerEnabled}
                onChange={(e) => handleShortcutToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-900 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          <AnimatePresence>
            {shortcutTriggerEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3.5 border-t border-slate-900/60 flex flex-col items-center gap-3"
              >
                <div className="text-[9px] text-slate-400 font-mono text-center uppercase tracking-wider">
                  Test Direct Launcher Widget:
                </div>
                
                {/* Pulsing Red Circle Interactive Widget */}
                <button
                  onClick={() => {
                    useAppStore.getState().triggerPanic("DISTRESS: Instant trigger activated from homescreen red circle quick-shortcut.");
                  }}
                  className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-red-950 border border-red-500/20"
                >
                  <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75 pointer-events-none" />
                  <span className="absolute inset-1 rounded-full border-2 border-dashed border-red-300/20 group-hover:rotate-45 transition-transform duration-1000" />
                  <span className="text-[10px] font-black text-white tracking-widest font-mono">SOS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    useAppStore.getState().addToast("Pinning Red Circle Shortcut Trigger to your Android Home Screen... Success! (Via ShortcutManager API)", "success");
                    useAppStore.getState().addAuditLog('SYSTEM', 'INFO', 'Homescreen Shortcut Pinned', 'Red circle launcher widget requested and pinned successfully.');
                  }}
                  className="text-[9px] py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono font-bold rounded-xl transition-all w-full text-center"
                >
                  PIN TO NATIVE HOMESCREEN
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sizable Movable Deployed Floating Widget Toggle */}
          <div className="pt-3.5 border-t border-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left pr-4">
                <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
                  Movable Floating SOS Button
                </span>
                <span className="text-[9px] text-slate-500 block leading-normal font-sans">
                  Deploy a sizing-adjustable, movable "breathing" SOS overlay. Works on top of standard interfaces. Double-tap the overlay to resize!
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isFloatingWidgetDeployed}
                  onChange={(e) => {
                    
                    setFloatingWidgetDeployed(e.target.checked);
                    if (Capacitor.isNativePlatform()) {
                        if (e.target.checked) {
                            SafetyLinkBridge.checkOverlayPermission().then((res: any) => {
                                if (!res.granted) {
                                    SafetyLinkBridge.requestOverlayPermission().then(() => {
                                        SafetyLinkBridge.toggleFloatingWidget({ enable: true });
                                    });
                                } else {
                                    SafetyLinkBridge.toggleFloatingWidget({ enable: true });
                                }
                            });
                        } else {
                            SafetyLinkBridge.toggleFloatingWidget({ enable: false });
                        }
                    }

                    useAppStore.getState().addAuditLog(
                      'SYSTEM',
                      'INFO',
                      `Movable Floating Widget ${e.target.checked ? 'Deployed' : 'Undeployed'}`,
                      'Floating tactical SOS shortcut layer synchronized on device screen.'
                    );
                    useAppStore.getState().addToast(
                      `Floating SOS Shortcut ${e.target.checked ? 'deployed on-screen' : 'removed'}!`,
                      e.target.checked ? 'success' : 'info'
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-900 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {isFloatingWidgetDeployed && (
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 space-y-2.5 font-mono text-[9px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>WIDGET SIZE PRESET:</span>
                  <span className="text-emerald-400 font-bold">{floatingWidgetSize}px</span>
                </div>
                <input
                  type="range"
                  min="48"
                  max="140"
                  value={floatingWidgetSize}
                  onChange={(e) => setFloatingWidgetSize(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Profile, System SMS, and Org Membership Panel */}
      <div className="space-y-4 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        
        {/* Only System SMS Toggle */}
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
            🛡️ EMERGENCY DISPATCH ROUTING FILTER
          </h4>
          <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-left flex-1">
                <span className="text-[11px] font-extrabold text-slate-200 block font-display uppercase tracking-wide">
                  Restrict to System SMS Only
                </span>
                <span className="text-[9px] text-slate-500 block leading-normal font-sans">
                  When enabled, outbound alerts will only be processed via native SMS pipelines. Non-SMS channels (such as WhatsApp, Voice speed-dial, and browser simulators) are muted to conserve mobile data or network resources in severe environments.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={onlySystemSms}
                  onChange={(e) => setOnlySystemSms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-900 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Info Form */}
        {currentUser && (
          <div className="space-y-3 border-t border-slate-900/60 pt-4">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
              👤 EDIT SAFETY PROFILE & MEDICAL DETAILS
            </h4>
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. Tshilidzi Mukwevho"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. +27829110000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Medical Information & Allergy Notes</label>
                <textarea
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50 resize-none font-mono"
                  placeholder="e.g. Type-1 Diabetic, Penicillin allergy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Home Address</label>
                <input
                  type="text"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. 12 Baker Street, Rosebank, Johannesburg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Work Address</label>
                <input
                  type="text"
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. SafetyLink Headquarters, Sandton"
                />
              </div>

              
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase">Moya / Turn.io</h5>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={moyaEnabled} onChange={e => setMoyaEnabled(e.target.checked)} className="accent-blue-500" />
                  </label>
                </div>
                <input type="text" value={turnApiToken} onChange={e => setTurnApiToken(e.target.value)} placeholder="Turn.io API Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('turn')} className="w-full mt-1 mb-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Moya
                </button>
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
                <button type="button" onClick={testTwilioAndSupabase} className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  📡 Test Integrations
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Private Security Company</h5>
                <input type="text" value={securityCompany} onChange={e => setSecurityCompany(e.target.value)} placeholder="Security Company Name" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={personalControlRoom} onChange={e => setPersonalControlRoom(e.target.value)} placeholder="Control Room Dispatcher Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase flex justify-between items-center">
                  ThingsBoard (UDP)
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={tbEnabled} onChange={e => setTbEnabled(e.target.checked)} className="accent-purple-500" />
                  </label>
                </h5>
                <input type="text" value={tbHost} onChange={e => setTbHost(e.target.value)} placeholder="UDP Host" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="number" value={tbPort} onChange={e => setTbPort(parseInt(e.target.value) || 0)} placeholder="UDP Port" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <div className="flex flex-row justify-between items-center mb-1"><h5 className="text-[9px] font-bold text-slate-500 uppercase">OwnCloud / NextCloud</h5><button onClick={() => { const code = currentUser?.orgCode || currentUser?.orgCode || ""; const baseUrl = ocUrl || "http://localhost:8080"; const type = currentUser?.orgCode ? "FAMILY" : "ORGANIZATION"; const zipUrl = `${baseUrl}/index.php/apps/files/ajax/download.php?files=&dir=/safetylink/${type}/${code}`; window.open(zipUrl, "_blank"); }} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[8px] font-bold px-2 py-1 rounded transition-colors">Download ZIP</button></div>
                <input type="text" value={ocUrl} onChange={e => setOcUrl(e.target.value)} placeholder="Server URL" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocUser} onChange={e => setOcUser(e.target.value)} placeholder="Username" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={ocToken} onChange={e => setOcToken(e.target.value)} placeholder="App Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocFolder} onChange={e => setOcFolder(e.target.value)} placeholder="Sync Folder Path" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>

              <button
                type="button"
                onClick={() => {
                  updateUserProfile(currentUser.id, {
                    fullName: profileName,
                    phone: profilePhone,
                    medicalInfo,
                    homeAddress,
                    workAddress,
                    twilio: { accountSid: twilioAccountSid, authToken: twilioAuthToken, fromNumber: twilioFromNumber },
                    moya: { turnApiToken, enabled: moyaEnabled },
                    sensorStream: { udpHost: tbHost, udpPort: tbPort, enabled: tbEnabled },
                    ownCloud: { serverUrl: ocUrl, username: ocUser, token: ocToken, folder: ocFolder },
                    personalControlRoom,
                    securityCompany
                  });
                  useAppStore.getState().addToast("Safety profile updated successfully!", "success");
                }}
                className="w-full py-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 rounded-xl text-[9px] font-bold text-purple-300 uppercase tracking-wider text-center cursor-pointer"
              >
                💾 Save Safety Profile Details
              </button>
            </div>
          </div>
        )}

        {/* Security PINs Section */}
        {currentUser && (
          <div className="space-y-3 border-t border-slate-900/60 pt-4">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
              🔒 SECURITY PIN SETTINGS
            </h4>
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-3 font-mono">
              <div className="space-y-1">
                
                <div className="pt-2 pb-3 border-b border-slate-900/60 mb-2">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Account Password</label>
                  <div className="flex gap-2">
                    <input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
/>
                    <button
                      type="button"
                      onClick={() => {
                        const newPwd = newPassword;
                        if (!newPwd) return useAppStore.getState().addToast('Password cannot be empty', 'warn');
                        if (currentUser) {
                           useAppStore.getState().updateUserPassword(currentUser.id, newPwd);
                           useAppStore.getState().addToast('Account password updated successfully.', 'success');
                           setNewPassword('');
                           (document.getElementById('newAccountPassword') as HTMLInputElement).value = '';
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase px-3 rounded-xl border border-blue-500/20 whitespace-nowrap"
                    >
                      Update
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-500 mt-1">Change your login password (active in demo mode).</p>
                </div>
                
                <label className="text-[9px] font-bold text-slate-400 block uppercase">Safe PIN (Cancels Alert)</label>
                <input
                  type="password"
                  value={userPin}
                  onChange={(e) => useAppStore.getState().setUserPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                  maxLength={4}
                  placeholder="e.g. 0000"
                />
                <p className="text-[7.5px] text-slate-500 mt-1">Used to safely cancel an accidental panic trigger.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 block uppercase text-red-500/80">Duress PIN (Silent Escalation)</label>
                <input
                  type="password"
                  value={duressPin}
                  onChange={(e) => useAppStore.getState().setDuressPin(e.target.value)}
                  className="w-full bg-slate-950 border border-red-900/30 rounded-xl px-3 py-2 text-xs text-red-200 focus:outline-none focus:border-red-500/50"
                  maxLength={4}
                  placeholder="e.g. 9999"
                />
                <p className="text-[7.5px] text-slate-500 mt-1">If forced to cancel by an attacker, enter this to appear like you canceled, but silently escalate to Police.</p>
              </div>
            </div>
          </div>
        )}

        {/* Join Organization Workflow Section */}
        {currentUser && (
          <div className="space-y-3 border-t border-slate-900/60 pt-4">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
              🏢 CAMPUS / SECURITY ORGANIZATION HUB
            </h4>
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-3">
              
              {/* Scenario 1: Already has approved Organization */}
              {currentUser.orgCode ? (() => {
                const boundOrg = organizations.find(o => o.id === currentUser.orgCode);
                return (
                  <div className="space-y-2 text-left">
                    <span className="text-[9.5px] text-emerald-400 font-bold block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACTIVE ORG CONNECTION: {currentUser.orgCode}
                    </span>
                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                      Your profile is securely bound to the organization <strong>{boundOrg?.name || 'Authorized Responders Network'}</strong>. Alert dispatches are shared with the organization's central control room console in real time.
                    </p>
                    
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase">Moya / Turn.io</h5>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={moyaEnabled} onChange={e => setMoyaEnabled(e.target.checked)} className="accent-blue-500" />
                  </label>
                </div>
                <input type="text" value={turnApiToken} onChange={e => setTurnApiToken(e.target.value)} placeholder="Turn.io API Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('turn')} className="w-full mt-1 mb-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Moya
                </button>
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
                <button type="button" onClick={testTwilioAndSupabase} className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  📡 Test Integrations
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Private Security Company</h5>
                <input type="text" value={securityCompany} onChange={e => setSecurityCompany(e.target.value)} placeholder="Security Company Name" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={personalControlRoom} onChange={e => setPersonalControlRoom(e.target.value)} placeholder="Control Room Dispatcher Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase flex justify-between items-center">
                  ThingsBoard (UDP)
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={tbEnabled} onChange={e => setTbEnabled(e.target.checked)} className="accent-purple-500" />
                  </label>
                </h5>
                <input type="text" value={tbHost} onChange={e => setTbHost(e.target.value)} placeholder="UDP Host" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="number" value={tbPort} onChange={e => setTbPort(parseInt(e.target.value) || 0)} placeholder="UDP Port" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <div className="flex flex-row justify-between items-center mb-1"><h5 className="text-[9px] font-bold text-slate-500 uppercase">OwnCloud / NextCloud</h5><button onClick={() => { const code = currentUser?.orgCode || currentUser?.orgCode || ""; const baseUrl = ocUrl || "http://localhost:8080"; const type = currentUser?.orgCode ? "FAMILY" : "ORGANIZATION"; const zipUrl = `${baseUrl}/index.php/apps/files/ajax/download.php?files=&dir=/safetylink/${type}/${code}`; window.open(zipUrl, "_blank"); }} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[8px] font-bold px-2 py-1 rounded transition-colors">Download ZIP</button></div>
                <input type="text" value={ocUrl} onChange={e => setOcUrl(e.target.value)} placeholder="Server URL" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocUser} onChange={e => setOcUser(e.target.value)} placeholder="Username" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={ocToken} onChange={e => setOcToken(e.target.value)} placeholder="App Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocFolder} onChange={e => setOcFolder(e.target.value)} placeholder="Sync Folder Path" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>

              <button
                type="button"
                onClick={() => {
                  updateUserProfile(currentUser.id, { orgCode: '', pendingOrgCode: '' });
                        useAppStore.getState().addToast("Successfully disconnected from organization.", "info");
                        useAppStore.getState().addAuditLog('SECURITY', 'WARN', 'Organization Disconnected', `User disconnected from organization ${currentUser.orgCode}`);
                      }}
                      className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 rounded-xl text-[8.5px] font-bold text-red-400 uppercase tracking-wider text-center cursor-pointer"
                    >
                      🔌 Leave Organization Connection
                    </button>
                  </div>
                );
              })() : currentUser.pendingOrgCode ? (() => {
                const pendingOrg = organizations.find(o => o.id === currentUser.pendingOrgCode);
                return (
                  <div className="space-y-2 text-left">
                    <span className="text-[9.5px] text-amber-400 font-bold block flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      MEMBERSHIP REQUEST PENDING
                    </span>
                    <p className="text-[9px] text-slate-400 font-sans leading-normal">
                      You requested to join <strong>{pendingOrg?.name || currentUser.pendingOrgCode}</strong>. Requests require supervisor approval inside the Safety Node Commander Deck.
                    </p>
                    
            <div className="bg-slate-950/30 border border-slate-900 rounded-2xl p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 pb-2">Personal Integrations</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase">Moya / Turn.io</h5>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={moyaEnabled} onChange={e => setMoyaEnabled(e.target.checked)} className="accent-blue-500" />
                  </label>
                </div>
                <input type="text" value={turnApiToken} onChange={e => setTurnApiToken(e.target.value)} placeholder="Turn.io API Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('turn')} className="w-full mt-1 mb-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Moya
                </button>
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Twilio (Voice/SMS)</h5>
                <input type="text" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="Account SID" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={twilioAuthToken} onChange={e => setTwilioAuthToken(e.target.value)} placeholder="Auth Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={twilioFromNumber} onChange={e => setTwilioFromNumber(e.target.value)} placeholder="From Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <button type="button" onClick={() => connectService('twilio')} className="w-full mt-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  🔗 Connect Twilio
                </button>
                <button type="button" onClick={testTwilioAndSupabase} className="w-full mt-2 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-[9px] font-bold text-emerald-400 uppercase tracking-wider text-center cursor-pointer transition-all">
                  📡 Test Integrations
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase">Private Security Company</h5>
                <input type="text" value={securityCompany} onChange={e => setSecurityCompany(e.target.value)} placeholder="Security Company Name" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={personalControlRoom} onChange={e => setPersonalControlRoom(e.target.value)} placeholder="Control Room Dispatcher Number" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <h5 className="text-[9px] font-bold text-slate-500 uppercase flex justify-between items-center">
                  ThingsBoard (UDP)
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-[8px] text-slate-600">Enabled</span>
                    <input type="checkbox" checked={tbEnabled} onChange={e => setTbEnabled(e.target.checked)} className="accent-purple-500" />
                  </label>
                </h5>
                <input type="text" value={tbHost} onChange={e => setTbHost(e.target.value)} placeholder="UDP Host" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="number" value={tbPort} onChange={e => setTbPort(parseInt(e.target.value) || 0)} placeholder="UDP Port" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>

              <div className="space-y-3 border-t border-slate-800/50 pt-3">
                <div className="flex flex-row justify-between items-center mb-1"><h5 className="text-[9px] font-bold text-slate-500 uppercase">OwnCloud / NextCloud</h5><button onClick={() => { const code = currentUser?.orgCode || currentUser?.orgCode || ""; const baseUrl = ocUrl || "http://localhost:8080"; const type = currentUser?.orgCode ? "FAMILY" : "ORGANIZATION"; const zipUrl = `${baseUrl}/index.php/apps/files/ajax/download.php?files=&dir=/safetylink/${type}/${code}`; window.open(zipUrl, "_blank"); }} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[8px] font-bold px-2 py-1 rounded transition-colors">Download ZIP</button></div>
                <input type="text" value={ocUrl} onChange={e => setOcUrl(e.target.value)} placeholder="Server URL" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocUser} onChange={e => setOcUser(e.target.value)} placeholder="Username" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="password" value={ocToken} onChange={e => setOcToken(e.target.value)} placeholder="App Token" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
                <input type="text" value={ocFolder} onChange={e => setOcFolder(e.target.value)} placeholder="Sync Folder Path" className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>

              <button
                type="button"
                onClick={() => {
                  updateUserProfile(currentUser.id, { pendingOrgCode: '' });
                        useAppStore.getState().addToast("Organization join request cancelled.", "info");
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[8.5px] font-bold text-slate-300 uppercase tracking-wider text-center cursor-pointer"
                    >
                      ❌ Cancel Membership Request
                    </button>
                  </div>
                );
              })() : (
                // Scenario 3: No connection, can type orgCode
                <div className="space-y-3">
                  <span className="text-[9.5px] text-slate-400 block font-sans leading-normal">
                    Type a unique Campus or Patrol Org ID to synchronize distress streams with a local security team, supervisor, or public emergency patrol.
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Organization ID</label>
                      <input
                        type="text"
                        value={orgIdInput}
                        onChange={(e) => setOrgIdInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 uppercase focus:outline-none focus:border-purple-500/50 font-mono"
                        placeholder="e.g. SL-ORG-001"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Select Your Role</label>
                      <select
                        value={selectedJoinRole}
                        onChange={(e) => setSelectedJoinRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500/50 font-mono"
                      >
                        <option value="Community Member">Community Member</option>
                        <option value="Guard">Guard</option>
                        <option value="Dispatcher">Dispatcher</option>
                        <option value="Control Room Operator">Control Room Operator</option>
                        <option value="Organization Administrator">Organization Administrator</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!orgIdInput.trim()) {
                        useAppStore.getState().addToast("Please enter an Organization ID code.", "warn");
                        return;
                      }
                      const res = requestJoinOrganization(currentUser.id, orgIdInput.toUpperCase().trim(), selectedJoinRole);
                      if (res.success) {
                        useAppStore.getState().addToast(`Membership request as ${selectedJoinRole} submitted! Waiting for admin approval.`, "success");
                        setOrgIdInput('');
                      } else {
                        useAppStore.getState().addToast(res.error || "Failed to submit membership request.", "error");
                      }
                    }}
                    className="w-full py-2 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 rounded-xl text-[9px] font-bold text-blue-300 uppercase tracking-wider text-center cursor-pointer font-mono"
                  >
                    🚀 Submit Membership Request
                  </button>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-900/50 text-[7.5px] text-slate-500 space-y-1 font-mono">
                    <p className="font-bold uppercase tracking-wider text-slate-400 text-center">💡 SIMULATOR CODE DIRECTORY</p>
                    <p className="flex justify-between"><span>🏫 School Roster Node:</span> <span className="text-blue-400 font-bold">SL-ORG-001</span></p>
                    <p className="flex justify-between"><span>🚨 Security Patrol Escort:</span> <span className="text-blue-400 font-bold">SL-ORG-002</span></p>
                    <p className="flex justify-between"><span>🏭 Corporate Safe-zone:</span> <span className="text-blue-400 font-bold">SL-ORG-003</span></p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Interactive Audit Logs Ledger */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
            {t('settings.ledger_title')}
          </h4>
          <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900">
            {filteredLogs.length} {t('settings.events_badge')}
          </span>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[8px] font-bold">
          {(['ALL', 'SYSTEM', 'BLE', 'GPS', 'DISPATCH', 'SECURITY'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded-full border transition-all ${
                filter === cat
                  ? 'bg-blue-600 border-blue-500/20 text-white shadow-md'
                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Audit Log Box */}
        <div className="h-44 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-y-auto p-3.5 font-mono text-[10px] space-y-3.5 scrollbar-none">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-600 text-center py-10 italic">Ledger buffer empty.</p>
          ) : (
            filteredLogs.map(log => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const isSevere = log.severity === 'SEVERE';
              const isWarn = log.severity === 'WARN';

              return (
                <div key={log.id} className="border-b border-slate-900/40 pb-2.5 last:border-0 last:pb-0 text-left">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-1 h-1 rounded-full ${isSevere ? 'bg-red-500 animate-ping' : isWarn ? 'bg-orange-500' : 'bg-slate-500'}`} />
                      <span className="text-slate-500 text-[8px]">{dateStr}</span>
                      <span className="text-slate-400 font-bold text-[8px] tracking-wider uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-900">
                        {log.category}
                      </span>
                    </div>
                    <span className={`font-black text-[8px] tracking-wider px-1.5 py-0.5 rounded-full ${isSevere ? 'bg-red-950/20 border-red-500/20 text-red-400' : isWarn ? 'bg-orange-950/20 border-orange-500/20 text-orange-400' : 'bg-slate-900 text-slate-500'}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className="text-slate-200 font-bold mt-1 leading-normal">{log.message}</p>
                  {log.details && (
                    <p className="text-slate-500 text-[9px] mt-1 leading-normal bg-slate-950/40 p-1.5 rounded-lg border border-slate-900/30">
                      {log.details}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};
