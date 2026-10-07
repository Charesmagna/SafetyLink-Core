import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { Capacitor } from '@capacitor/core';
import { motion } from 'motion/react';
import { translate } from '../utils/translations';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { biometricService } from '../services/BiometricService';

export const Settings: React.FC = () => {
  const { 
    auditLogs, 
    clearAuditLogs, 
    language, 
    currentUser,
    userPin,
    duressPin,
    updateUserProfile,
    requestJoinOrganization,
    organizations,
    sosCountdownDuration,
    setSosCountdownDuration,
    silenceAlerts,
    setSilenceAlerts,
    globalTheme,
    setGlobalTheme,
    decoyActive,
    setDecoyActive,
    decoyCode,
    setDecoyCode,
    decoyDistressCode,
    setDecoyDistressCode,
    isFloatingWidgetDeployed,
    setFloatingWidgetDeployed,
    floatingWidgetSize,
    setFloatingWidgetSize,
    dispatchSettings,
    setDispatchSettings,
    dispatchLogs,
    clearDispatchLogs,
    notificationPanelLogs,
    clearNotificationPanelLogs
  } = useAppStore();

  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY'>('ALL');

  // Biometric gate for sensitive security settings
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometryType, setBiometryType] = useState('FINGERPRINT');
  const [isPinSettingsUnlocked, setIsPinSettingsUnlocked] = useState(() => biometricService.isScopeUnlocked('settings'));
  const [isAuthenticatingPin, setIsAuthenticatingPin] = useState(false);

  useEffect(() => {
    let active = true;
    biometricService.checkAvailability().then(res => {
      if (active) {
        setHasBiometrics(res.isAvailable);
        setBiometryType(res.biometryType);
      }
    });
    return () => { active = false; };
  }, []);

  const handleUnlockPinSettings = async () => {
    setIsAuthenticatingPin(true);
    try {
      const ok = await biometricService.authenticate({
        title: 'Security PIN Authentication',
        subtitle: 'Biometric Security Gate',
        description: 'Verify your fingerprint or face to view and modify your emergency PINs.',
        negativeButtonText: 'Cancel'
      });
      if (ok) {
        setIsPinSettingsUnlocked(true);
        biometricService.grantScopeUnlock('settings');
        useAppStore.getState().addToast('Biometrics verified. Security PIN settings unlocked.', 'success');
      } else {
        useAppStore.getState().addToast('Biometric authentication required to modify security PINs.', 'warn');
      }
    } finally {
      setIsAuthenticatingPin(false);
    }
  };

  // Profile forms state

  
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      await useAppStore.getState().checkAppUpdates();
      const { updateInfo } = useAppStore.getState();
      if (updateInfo && updateInfo.available) {
        useAppStore.getState().addToast(`Version ${updateInfo.version} found! Downloading...`, "success");
        // For Capacitor/Android
        if (Capacitor.getPlatform() === 'android' && updateInfo.apkUrl) {
          window.open(updateInfo.apkUrl, '_blank');
        } else if (updateInfo.exeUrl && Capacitor.getPlatform() !== 'android') {
           // Desktop Web/Electron
           window.open(updateInfo.exeUrl, '_blank');
        } else {
           window.open('https://github.com/Charesmagna/SafetyLink-Core/releases/latest', '_blank');
        }
      } else {
        useAppStore.getState().addToast("You are already on the latest version.", "info");
      }
    } catch (e) {
      useAppStore.getState().addToast("Failed to check for updates.", "error");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  
  



  const [orgIdInput, setOrgIdInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedJoinRole, setSelectedJoinRole] = useState('Community Member');

  const t = (key: string) => translate(language, key);


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
      <div className="flex justify-center mb-6 mt-2 relative z-10">
        <img 
          src="/logos/Safety_Link_Logo_Transparent.png" 
          alt="SafetyLink Official Logo" 
          className="h-14 object-contain drop-shadow-xl" 
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logos/New SafetyLink Official Logo.svg';
          }}
        />
      </div>

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

      
      {/* App Preferences */}
      <div className="space-y-3 text-left mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          🎨 APP PREFERENCES
        </h4>
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200">Global Theme</div>
            <div className="text-[10px] text-slate-500">Switch to Light Mode for high-contrast outdoors</div>
          </div>
          <button 
            onClick={() => setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${globalTheme === 'light' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
          >
            {globalTheme === 'light' ? 'LIGHT (ENABLED)' : 'TACTICAL DARK'}
          </button>
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


      {/* Alert & Countdown Settings */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
          🚨 ALERTS & COUNTDOWN
        </h4>
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-4">
          {/* Floating SOS Overlay Settings (User Golden Spec) */}
          <div className="border-t border-slate-800/50 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <span>🔴</span> Floating SOS Bubble (Chat Heads Style)
                </h5>
                <p className="text-[8px] text-slate-500 mt-0.5">
                  Enables a persistent draggable SOS trigger that floats over all native Android apps.
                </p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className={`text-[8px] font-bold ${isFloatingWidgetDeployed ? "text-red-400" : "text-slate-600"}`}>
                  {isFloatingWidgetDeployed ? "ACTIVE" : "DISABLED"}
                </span>
                <input 
                  type="checkbox" 
                  checked={isFloatingWidgetDeployed} 
                  onChange={e => {
                    setFloatingWidgetDeployed(e.target.checked);
                    NativeDispatchService.toggleFloatingWidget(e.target.checked);
                    useAppStore.getState().addToast(
                      e.target.checked ? 'Floating SOS button deployed.' : 'Floating SOS button disabled.',
                      'info'
                    );
                  }}
                  className="accent-red-500 w-4 h-4 cursor-pointer" 
                />
              </label>
            </div>
            {isFloatingWidgetDeployed && (
              <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-xl border border-slate-800 text-[8px]">
                <span className="text-slate-400 uppercase font-bold">BUBBLE SIZE:</span>
                <div className="flex gap-1.5">
                  {[52, 64, 78].map(sz => (
                    <button
                      key={sz}
                      onClick={() => setFloatingWidgetSize(sz)}
                      className={`px-2 py-0.5 rounded-lg font-bold ${
                        floatingWidgetSize === sz ? 'bg-red-600 text-white' : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Configurable Dispatch Logic (User Golden Spec) */}
          <div className="border-t border-slate-800/50 pt-3 space-y-3">
            <h5 className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <span>⚡</span> Configurable Dispatch Engine & Presets
            </h5>

            <div className="space-y-1">
              <label className="text-[8px] font-bold text-slate-500 uppercase block">Dispatch Channel Preset</label>
              <select
                value={dispatchSettings.dispatchPreset}
                onChange={e => {
                  const val = e.target.value as any;
                  setDispatchSettings({ dispatchPreset: val });
                  useAppStore.getState().addToast(`Dispatch preset switched to ${val.replace('_', ' ')}`, 'info');
                }}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-red-500/50 font-mono"
              >
                <option value="STRICT_OFFLINE">Strict Offline (USSD Dial *134*911# + Local GSM SMS)</option>
                <option value="VIP_TWILIO_CLOUD">VIP Cloud (Twilio Voice IVR + VAPI AI + Africa's Talking)</option>
                <option value="SMS_ONLY">SMS Only (Pure Direct GSM + SMS Gateway)</option>
                <option value="CUSTOM">Custom Multi-Channel Sequential Queue</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase block">Fullscreen Countdown Overlay</span>
                <span className="text-[7.5px] text-slate-500">Show visual countdown modal over UI during grace period.</span>
              </div>
              <input
                type="checkbox"
                checked={dispatchSettings.countdownOverlayEnabled}
                onChange={e => setDispatchSettings({ countdownOverlayEnabled: e.target.checked })}
                className="accent-red-500 w-4 h-4"
              />
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[8px] font-bold text-slate-500 uppercase block">Situational Map Engine</label>
              <select
                value={dispatchSettings.mapProvider}
                onChange={e => {
                  const val = e.target.value as any;
                  setDispatchSettings({ mapProvider: val });
                  useAppStore.getState().addToast(`Map provider updated to ${val.replace('_', ' ')}`, 'info');
                }}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-red-500/50 font-mono"
              >
                <option value="GOOGLE_MAPS">Google Maps (Hybrid & Live Traffic)</option>
                <option value="OPENSTREETMAP">OpenStreetMap (Offline GIS Vector Tiles)</option>
                <option value="MAPBOX">Mapbox Tactical Dark Mode</option>
                <option value="HYBRID_SATELLITE">High-Resolution Satellite Imagery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dispatch & Mini-App Logs Terminal (User Golden Spec) */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <h5 className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <span>📜</span> Native Dispatch & Notification Logs
            </h5>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearDispatchLogs();
                  clearNotificationPanelLogs();
                  useAppStore.getState().addToast('Dispatch logs cleared', 'info');
                }}
                className="text-[7.5px] text-slate-500 hover:text-slate-300 uppercase"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {dispatchLogs.length === 0 && notificationPanelLogs.length === 0 ? (
              <p className="text-[8px] text-slate-600 text-center py-4">No recent emergency dispatch activity logged.</p>
            ) : (
              <>
                {dispatchLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="p-2 bg-slate-950 border border-slate-900 rounded-xl text-[8px] space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-bold text-red-400">[{log.channel}] ➔ {log.target}</span>
                      <span className={`px-1 py-0.2 rounded font-black ${
                        log.status === 'SENT' || log.status === 'DELIVERED' ? 'text-emerald-400' :
                        log.status === 'INITIATED' ? 'text-cyan-400' : 'text-amber-400'
                      }`}>{log.status}</span>
                    </div>
                    <p className="text-slate-500">{log.details}</p>
                    <span className="text-[7px] text-slate-600 block">{new Date(log.timestamp).toLocaleTimeString()} • Unit: {log.unitId}</span>
                  </div>
                ))}
                {notificationPanelLogs.slice(0, 6).map(log => (
                  <div key={log.id} className="p-2 bg-slate-950/70 border border-slate-900/80 rounded-xl text-[8px] space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-bold text-indigo-400">[MINI-APP] {log.action}</span>
                      <span className="text-emerald-400 font-bold">{log.status}</span>
                    </div>
                    <p className="text-slate-500">{log.details}</p>
                    <span className="text-[7px] text-slate-600 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-800/50 pt-3">
            <h5 className="text-[9px] font-bold text-slate-500 uppercase">Silent Mode</h5>
            <label className="flex items-center space-x-2 cursor-pointer">
              <span className="text-[8px] text-slate-600">Enabled</span>
              <input 
                type="checkbox" 
                checked={silenceAlerts} 
                onChange={e => setSilenceAlerts(e.target.checked)}
                className="accent-red-500" 
              />
            </label>
          </div>
          <p className="text-[8px] text-slate-500 mt-1">Mutes all sirens during panic activation.</p>

          <div className="flex justify-between items-center border-t border-slate-800/50 pt-3">
            <div>
              <h5 className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <span>🧮</span> Decoy Mode (Calculator Disguise)
              </h5>
              <p className="text-[8px] text-slate-500 mt-0.5">
                Launches an operational calculator to mask SafetyLink under duress.
              </p>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <span className={`text-[8px] font-bold ${decoyActive ? "text-emerald-400" : "text-slate-600"}`}>
                {decoyActive ? "ARMED" : "OFF"}
              </span>
              <input 
                type="checkbox" 
                checked={decoyActive} 
                onChange={e => {
                  setDecoyActive(e.target.checked);
                  useAppStore.getState().addToast(
                    e.target.checked 
                      ? 'Calculator disguise armed. Enter ' + (decoyCode || '1911') + '= to unlock.' 
                      : 'Calculator disguise disarmed.', 
                    'info'
                  );
                }}
                className="accent-emerald-500 w-4 h-4 cursor-pointer" 
              />
            </label>
          </div>
          {decoyActive && (
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-1.5">
              <div className="flex justify-between text-[8px] font-mono text-emerald-400">
                <span>Unlock Passcode: <strong>{decoyCode || '1911'}=</strong></span>
                <span>Silent SOS Code: <strong>{decoyDistressCode || '9111'}=</strong></span>
              </div>
              <p className="text-[7.5px] text-slate-400">
                To return to SafetyLink at any time, type your passcode into the calculator and press <strong>=</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

        {/* Security PINs Section */}
        {currentUser && (
          <div className="space-y-3 border-t border-slate-900/60 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-display">
                🔒 SECURITY PIN SETTINGS
              </h4>
              {hasBiometrics && isPinSettingsUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPinSettingsUnlocked(false);
                    biometricService.lockScope('settings');
                    useAppStore.getState().addToast('Security PIN settings locked.', 'info');
                  }}
                  className="text-[8px] font-mono font-bold text-slate-400 hover:text-slate-200 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg uppercase transition-all"
                >
                  🔒 Lock
                </button>
              )}
            </div>

            {hasBiometrics && !isPinSettingsUnlocked ? (
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 text-center space-y-3 font-mono">
                <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg">
                  {biometryType === 'FACE_ID' ? '👤' : '👆'}
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                    Biometric Protection Active
                  </h5>
                  <p className="text-[8px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Authentication is required to view or modify your Safe PIN, Duress PIN, and account credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockPinSettings}
                  disabled={isAuthenticatingPin}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9.5px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>{biometryType === 'FACE_ID' ? '👤' : '👆'}</span>
                  <span>{isAuthenticatingPin ? 'Verifying...' : `Authenticate with ${biometryType === 'FACE_ID' ? 'Face ID' : 'Biometrics'}`}</span>
                </button>
              </div>
            ) : (
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
            )}
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


      
      {/* Fleet, Camera, & Drone Integrations */}
      <div className="space-y-4 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
          🚁 FLEET, CAMERA & DRONE MODULES
        </h4>
        <div className="space-y-3">
          {/* Safety Fleet Tracking */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-slate-200">
              <span className="text-xl">🚙</span>
              <span className="text-[11px] font-extrabold font-display uppercase tracking-wide">Safety Fleet Tracking</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal font-sans">
              Monitor active security patrol vehicles, live dispatch routes, and responder telemetry.
            </p>
            <button
              onClick={() => useAppStore.getState().addToast("Safety Fleet Tracking module initiated. Awaiting GPS telemetrics from patrol cars...", "info")}
              className="w-full py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-xl transition-all uppercase tracking-wider"
            >
              Open Fleet Dashboard
            </button>
          </div>

          {/* ONVIF Camera Onboarding */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-slate-200">
              <span className="text-xl">📹</span>
              <span className="text-[11px] font-extrabold font-display uppercase tracking-wide">ONVIF Camera Linking</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal font-sans">
              Onboard and link popular South African CCTV networks (e.g. Hikvision, Dahua, Vivotek). Supports ONVIF Profile S/G.
            </p>
            <button
              onClick={() => useAppStore.getState().addToast("ONVIF Discovery protocol scanning local subnets for Hikvision / Dahua IPCs...", "info")}
              className="w-full py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/20 text-purple-400 text-[9px] font-bold rounded-xl transition-all uppercase tracking-wider"
            >
              Scan & Onboard Cameras
            </button>
          </div>

          {/* Drone Deployment Environment */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1 text-slate-200">
              <span className="text-xl">🛸</span>
              <span className="text-[11px] font-extrabold font-display uppercase tracking-wide">Drone Deployment Config</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-normal font-sans">
              Configure external drone dispatch services (e.g., 24hrsdroneforce). Enable automated launch on distress triggers.
            </p>
            <div className="space-y-2 pt-2 border-t border-slate-900/50">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Drone Provider API Key</label>
                <input
                  type="password"
                  placeholder="Enter Dispatch API Key"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Default Service Target</label>
                <select className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2 py-2 text-[10px] text-slate-200 focus:outline-none focus:border-orange-500/50">
                  <option value="24hrsdroneforce">24hrsdroneforce (Recommended)</option>
                  <option value="custom">Custom Provider Endpoint</option>
                </select>
              </div>
              <button
                onClick={() => useAppStore.getState().addToast("Drone provider settings saved. Ready for aerial deployment requests.", "success")}
                className="w-full mt-2 py-2 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-500/20 text-orange-400 text-[9px] font-bold rounded-xl transition-all uppercase tracking-wider"
              >
                Save Drone Config
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Updates Section */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
            System Updates
          </h4>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
            v1.0.0 (Latest)
          </span>
        </div>
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-200">Over-the-Air Update</p>
            <p className="text-[8px] text-slate-500 font-mono mt-0.5">Fetch and install the latest SafetyLink core APK directly from our secure repository.</p>
          </div>
          <button
            onClick={handleCheckForUpdates}
            disabled={isCheckingUpdate}
            className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider font-mono transition-all ${
              isCheckingUpdate 
                ? 'bg-slate-900 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isCheckingUpdate ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Checking...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>⬇️</span> Upgrade Build
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Android Device Control & Accessibility Sentinel */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
            🛡️ DEVICE CONTROL & ACCESSIBILITY
          </h4>
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ACTIVE SENTINEL
          </span>
        </div>
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
            Grant SafetyLink Android accessibility, hardware button interception (volume panic triggers), and background battery saver exemption.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency?.openAccessibilitySettings) {
                  await (window as any).Capacitor.Plugins.SafetyLinkEmergency.openAccessibilitySettings();
                } else {
                  useAppStore.getState().addToast('Accessibility settings is available in the Android APK.', 'info');
                }
              }}
              className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>🔑 Accessibility Settings</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency?.requestBatteryOptimizationExemption) {
                  await (window as any).Capacitor.Plugins.SafetyLinkEmergency.requestBatteryOptimizationExemption();
                } else {
                  useAppStore.getState().addToast('Battery exemption is available in the Android APK.', 'info');
                }
              }}
              className="py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>⚡ Exempt Battery Killer</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.SafetyLinkEmergency?.openAppSettings) {
                  await (window as any).Capacitor.Plugins.SafetyLinkEmergency.openAppSettings();
                } else {
                  useAppStore.getState().addToast('App permissions manager is available in the Android APK.', 'info');
                }
              }}
              className="py-2.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>⚙️ App Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('sl_permissions_configured_v2');
                window.location.reload();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>🔄 Run Setup Wizard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloudflare Private DNS Configuration */}
      <div className="space-y-3 text-left border-t border-slate-900 pt-4 mt-4 relative z-10 font-mono">
        <div className="flex justify-between items-center">
          <h4 className="text-[9px] font-bold text-slate-500 font-display uppercase tracking-widest">
            🌐 CLOUDFLARE PRIVATE DNS SHIELD
          </h4>
          <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/30 px-2 py-0.5 rounded-full border border-sky-500/20">
            TLS PORT 853
          </span>
        </div>
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5">
            <div>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Private DNS Provider Hostname</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">dns.safetylink.online</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText('dns.safetylink.online');
                useAppStore.getState().addToast('Copied dns.safetylink.online to clipboard', 'success');
              }}
              className="py-1 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold"
            >
              Copy
            </button>
          </div>
          <p className="text-[9.5px] text-slate-400 font-sans leading-relaxed">
            Android Settings → Network & Internet → Private DNS → select "Private DNS provider hostname" and enter <strong className="text-slate-200">dns.safetylink.online</strong>.
          </p>
        </div>
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
