import React, { useState, useEffect } from 'react';
import { useAppStore, getOrgAbbreviation } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { motion, AnimatePresence } from 'motion/react';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    registerUser, 
    registerOrganization,
    organizations,
    addToast,
    isSimulationMode,
    setSimulationMode,
    injectDemoData
  } = useAppStore();
  const [view, setView] = useState<'LOGIN' | 'REGISTER_USER' | 'REGISTER_ORG'>('LOGIN');

  // QR Code Scanner States
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [qrScanTarget, setQrScanTarget] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginOrgCode, setLoginOrgCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sl_remembered_username');
    const savedOrg = localStorage.getItem('sl_remembered_org_code');
    if (savedUser) setLoginUsername(savedUser);
    if (savedOrg) setLoginOrgCode(savedOrg);
  }, []);

  // User Register States
  const [userUsername, setUserUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userOrgCode, setUserOrgCode] = useState('');
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userError, setUserError] = useState('');

  // Org Register States
  const [orgName, setOrgName] = useState('');
  const [orgContactName, setOrgContactName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [showIdApplication, setShowIdApplication] = useState(false);
  const [generatedOrgId, setGeneratedOrgId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccessMsg, setOrgSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername) {
      setLoginError('Please enter a username or administrative identifier.');
      return;
    }

    const res = login(loginUsername, loginOrgCode);
    if (res.success) {
      if (rememberMe) {
        localStorage.setItem('sl_remembered_username', loginUsername.trim());
        localStorage.setItem('sl_remembered_org_code', loginOrgCode.trim());
      } else {
        localStorage.removeItem('sl_remembered_username');
        localStorage.removeItem('sl_remembered_org_code');
      }
    } else {
      setLoginError(res.error || 'Invalid credentials or code combination.');
    }
  };

  const handleUserRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccessMsg('');

    if (!userUsername || !userFullName || !userPhone || !userEmail) {
      setUserError('All personal information fields are strictly required.');
      return;
    }

    const res = registerUser({
      username: userUsername,
      fullName: userFullName,
      phone: userPhone,
      whatsapp: userWhatsapp,
      avatarUrl: userAvatar,
      email: userEmail,
      orgCode: userOrgCode
    });

    if (res.success) {
      setUserSuccessMsg('Profile created successfully! Logging you in...');
      const registeredUsername = userUsername;
      const registeredOrgCode = userOrgCode;
      setTimeout(() => {
        login(registeredUsername, registeredOrgCode);
        setUserSuccessMsg('');
        setUserUsername('');
        setUserFullName('');
        setUserPhone('');
        setUserWhatsapp('');
        setUserAvatar('');
        setUserEmail('');
        setUserOrgCode('');
      }, 1500);
    } else {
      setUserError(res.error || 'Registration failed.');
    }
  };

  const handleGenerateOrgId = () => {
    if (!orgName || !orgContactName || !orgEmail) {
      setOrgError('Please fill in contact details and name before generating ID.');
      return;
    }
    setOrgError('');
    setIsGenerating(true);

    setTimeout(() => {
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      const abbrev = getOrgAbbreviation(orgName);
      const code = `SL-${abbrev}-${randomHex}`;
      setGeneratedOrgId(code);
      setIsGenerating(false);
    }, 1200);
  };

  const handleOrgRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');
    setOrgSuccessMsg('');

    if (!orgName || !orgContactName || !orgEmail) {
      setOrgError('Please fill in contact details and organization name.');
      return;
    }

    if (!generatedOrgId) {
      setOrgError('Please expand the menu below and generate a unique organization ID first.');
      return;
    }

    const newOrg = registerOrganization({
      name: orgName,
      contactName: orgContactName,
      contactEmail: orgEmail
    });

    newOrg.id = generatedOrgId;

    setOrgSuccessMsg(`Registered successfully! Unique Code: ${generatedOrgId}. Logging you in...`);
    const registeredContactName = orgContactName;
    const registeredOrgId = generatedOrgId;

    setTimeout(() => {
      login(registeredContactName, registeredOrgId);
      setOrgSuccessMsg('');
      setOrgName('');
      setOrgContactName('');
      setOrgEmail('');
      setGeneratedOrgId('');
      setShowIdApplication(false);
    }, 1500);
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-y-auto select-none scanlines">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 digital-grid opacity-15 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel rounded-[2rem] p-7 shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 neon-glow-blue" />

        {/* Branding Header */}
        <div className="text-center mb-6 mt-2">
          <div className="inline-flex items-center justify-center">
            <SafetyLinkLogo size={64} showText={true} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* LOGIN VIEW */}
          {view === 'LOGIN' && (
            <motion.form 
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-4.5 text-left font-mono"
            >
              <div className="border-b border-slate-900 pb-3.5 mb-4">
                <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest font-display">Secure Command Gateway</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Enter authorized coordinates or administrative key for network access.</p>
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono leading-relaxed">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Username / Callsign</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="e.g. thabo_m"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-mono transition-all"
                  required
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Organizational Mesh Code</label>
                  <button
                    type="button"
                    onClick={() => { setQrScanTarget('LOGIN'); setIsScanningQr(true); }}
                    className="text-[9.5px] font-mono font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase flex items-center gap-1.5"
                  >
                    📷 Scan Node Badge
                  </button>
                </div>
                <input
                  type="text"
                  value={loginOrgCode}
                  onChange={e => setLoginOrgCode(e.target.value)}
                  placeholder="e.g. SL-ORG-XXXX"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-mono transition-all"
                />
                <span className="text-[9px] text-slate-500 mt-1 pl-1">Leave blank for standalone mesh profile mode.</span>
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer accent-blue-600"
                />
                <label htmlFor="rememberMe" className="text-[9px] text-slate-400 font-bold select-none cursor-pointer uppercase tracking-wider">
                  Remember my credentials
                </label>
              </div>

              {/* Simulation Mode Toggle */}
              <div className="flex items-center justify-between border-t border-b border-slate-900/60 py-2.5 my-1">
                <div className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    id="simulationMode"
                    checked={isSimulationMode}
                    onChange={e => {
                      setSimulationMode(e.target.checked);
                      if (!e.target.checked) {
                        localStorage.removeItem('sl_organizations');
                        localStorage.removeItem('sl_users');
                        localStorage.removeItem('sl_ble_devices');
                        window.location.reload();
                      }
                    }}
                    className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="simulationMode" className="text-[10px] text-emerald-400 font-black select-none cursor-pointer uppercase tracking-wider flex items-center gap-1">
                    <span>⚡ Simulation Mode</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </label>
                </div>
                <span className="text-[8px] text-slate-500 font-mono">SANDBOX ACTIVE</span>
              </div>

              {isSimulationMode && (
                <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-2 text-left">
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1 font-mono">
                    Select Quick Preview Profile:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        injectDemoData('USER');
                        login('thabo_m', 'SL-WITS-4829');
                        addToast('Simulated login: Resident Client (Thabo Molefe)', 'success');
                      }}
                      className="p-2 bg-slate-950 hover:bg-emerald-950/10 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all text-left"
                    >
                      <span className="text-[10px] font-bold text-slate-200 block">👤 CLIENT</span>
                      <span className="text-[8px] text-slate-500 block truncate font-mono">thabo_m (Wits Node)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        injectDemoData('RESPONDER');
                        login('officer_ndlovu', 'SL-WITS-4829');
                        addToast('Simulated login: Security Officer Ndlovu', 'success');
                      }}
                      className="p-2 bg-slate-950 hover:bg-emerald-950/10 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all text-left"
                    >
                      <span className="text-[10px] font-bold text-slate-200 block">👮 RESPONDER</span>
                      <span className="text-[8px] text-slate-500 block truncate font-mono">officer_ndlovu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        injectDemoData('ORG');
                        login('commander_wits', 'SL-WITS-4829');
                        addToast('Simulated login: Security Commander Deck', 'success');
                      }}
                      className="p-2 bg-slate-950 hover:bg-emerald-950/10 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all text-left"
                    >
                      <span className="text-[10px] font-bold text-slate-200 block">🏢 DISPATCHER</span>
                      <span className="text-[8px] text-slate-500 block truncate font-mono">commander_wits</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        injectDemoData('ADMIN');
                        login('safetylink', 'sl-admin-000');
                        addToast('Simulated login: Super Admin Console', 'success');
                      }}
                      className="p-2 bg-slate-950 hover:bg-emerald-950/10 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all text-left"
                    >
                      <span className="text-[10px] font-bold text-slate-200 block">⚙️ SUPER ADMIN</span>
                      <span className="text-[8px] text-slate-500 block truncate font-mono">safetylink (Global)</span>
                    </button>
                  </div>
                </div>
              )}

               <button
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 border border-blue-500/20 transition-all text-white text-xs font-bold rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-950 font-mono"
              >
                Sign In to Console
              </button>


              <div className="flex justify-between text-[10px] pt-4 border-t border-slate-900 font-mono font-bold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setView('REGISTER_USER')}
                  className="text-slate-400 hover:text-blue-400 transition-colors"
                >
                  Create User / Responder
                </button>
                <button
                  type="button"
                  onClick={() => setView('REGISTER_ORG')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Register Organization
                </button>
              </div>
            </motion.form>
          )}

          {/* REGISTER ORDINARY USER */}
          {view === 'REGISTER_USER' && (
            <motion.form 
              key="register_user"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleUserRegister} 
              className="space-y-4 text-left font-mono"
            >
              <div className="border-b border-slate-900 pb-3.5 mb-2">
                <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest font-display">Establish Responder Profile</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Register telemetry and hardware coordinates to the secure database.</p>
              </div>

              {userError && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                  {userError}
                </div>
              )}

              {userSuccessMsg && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-mono">
                  ✓ {userSuccessMsg}
                </div>
              )}

              {/* Avatar Section */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Profile Identity Vector</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-950/40 rounded-2xl border border-slate-900">
                  <div className="relative w-12 h-12 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Vector" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                    {userAvatar && (
                      <button
                        type="button"
                        onClick={() => setUserAvatar('')}
                        className="absolute inset-0 bg-slate-950/90 flex items-center justify-center text-[8px] font-black text-red-500 transition-opacity"
                      >
                        RESET
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left space-y-1.5">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                      onDragLeave={() => setIsDraggingAvatar(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingAvatar(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setUserAvatar(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`border border-dashed p-2.5 rounded-xl transition-all cursor-pointer text-center ${
                        isDraggingAvatar ? 'border-purple-500 bg-purple-500/10' : 'border-slate-900 hover:border-slate-800 hover:bg-slate-950/30'
                      }`}
                    >
                      <label className="cursor-pointer block">
                        <span className="text-[9px] text-slate-400 font-mono">
                          Drag & Drop or <span className="text-blue-400 font-bold hover:underline">Browse Image</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setUserAvatar(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">Or select identity role:</span>
                  <div className="flex gap-1.5">
                    {[
                      { emoji: '🛡️', bg: 'bg-purple-900/30 border-purple-500/30' },
                      { emoji: '🚨', bg: 'bg-red-900/30 border-red-500/30' },
                      { emoji: '⚡', bg: 'bg-amber-900/30 border-amber-500/30' },
                      { emoji: '🛰️', bg: 'bg-blue-900/30 border-blue-500/30' },
                      { emoji: '❇️', bg: 'bg-emerald-900/30 border-emerald-500/30' }
                    ].map((preset, idx) => {
                      const selectPreset = () => {
                        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#0f172a"/><circle cx="50" cy="50" r="40" fill="#1e293b" stroke="#6366f1" stroke-width="2"/><text x="50" y="58" font-size="36" text-anchor="middle">${preset.emoji}</text></svg>`;
                        const b64 = `data:image/svg+xml;base64,${btoa(svgString)}`;
                        setUserAvatar(b64);
                      };

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={selectPreset}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs hover:scale-105 transition-all bg-slate-900 border-slate-900"
                        >
                          {preset.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={userUsername}
                    onChange={e => setUserUsername(e.target.value)}
                    placeholder="thabo_m"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={userFullName}
                    onChange={e => setUserFullName(e.target.value)}
                    placeholder="Thabo Molefe"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cell Phone</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    placeholder="+27721234567"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">WhatsApp Link</label>
                  <input
                    type="text"
                    value={userWhatsapp}
                    onChange={e => setUserWhatsapp(e.target.value)}
                    placeholder="+27721234567"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Coordinates</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="thabo@meshnet.co.za"
                  className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mesh Node Code Binding (Optional)</label>
                  <button
                    type="button"
                    onClick={() => { setQrScanTarget('REGISTER'); setIsScanningQr(true); }}
                    className="text-[9.5px] font-mono font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors uppercase flex items-center gap-1.5"
                  >
                    📷 Scan Node Badge
                  </button>
                </div>
                <input
                  type="text"
                  value={userOrgCode}
                  onChange={e => setUserOrgCode(e.target.value)}
                  placeholder="e.g. SL-ORG-8492"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-[8px] text-slate-500 mt-1 pl-1">Bind this responder profile to an established Safety Node Command Deck.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 border border-blue-500/20 transition-all text-white text-xs font-bold rounded-2xl uppercase tracking-widest shadow-lg shadow-blue-950 font-mono"
              >
                Create Account Profile
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView('LOGIN')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono font-bold uppercase tracking-wider"
                >
                  ← Back to Login
                </button>
              </div>
            </motion.form>
          )}

          {/* REGISTER ORGANIZATION */}
          {view === 'REGISTER_ORG' && (
            <motion.form 
              key="register_org"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleOrgRegister} 
              className="space-y-4 text-left font-mono"
            >
              <div className="border-b border-slate-900 pb-3.5 mb-2">
                <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-display">Provision Safety Node</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Register a security agency, campus perimeter, or corporate workspace.</p>
              </div>

              {orgError && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                  {orgError}
                </div>
              )}

              {orgSuccessMsg && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-mono">
                  ✓ {orgSuccessMsg}
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Organization Entity Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Wits Security, Apex patrol, TechCorp, CityCenter"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Commander Name</label>
                  <input
                    type="text"
                    value={orgContactName}
                    onChange={e => setOrgContactName(e.target.value)}
                    placeholder="Mpho Lekota"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Secure Email</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={e => setOrgEmail(e.target.value)}
                    placeholder="mpho@apex.co.za"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Organization ID Application */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-3.5 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowIdApplication(!showIdApplication)}
                  className="w-full flex justify-between items-center text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase"
                >
                  <span>📂 Generate Mesh Node Identifier</span>
                  <span className="text-sm">{showIdApplication ? '▲' : '▼'}</span>
                </button>

                {showIdApplication && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-900/80 animate-fadeIn text-left">
                    <p className="text-[9px] text-slate-400 leading-normal font-sans">
                      Generate a cryptographically validated code on the SafetyLink servers to bind multiple responder devices.
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGenerateOrgId}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 border border-emerald-500/10 transition-colors text-white font-mono text-[9px] font-bold rounded-xl uppercase tracking-wider"
                      >
                        {isGenerating ? 'ROUTING...' : 'GENERATE NODE ID'}
                      </button>

                      {generatedOrgId && (
                        <div className="flex-1 bg-slate-950 border border-emerald-500/20 px-3 py-2 rounded-xl text-center font-mono font-black text-xs text-emerald-400 tracking-widest">
                          {generatedOrgId}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/20 transition-all text-white text-xs font-bold rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-950 font-mono"
              >
                Register Safety Node
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView('LOGIN')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono font-bold uppercase tracking-wider"
                >
                  ← Back to Login
                </button>
              </div>
            </motion.form>
          )}


        </AnimatePresence>
      </motion.div>

      {/* Fututistic Interactive QR Code Scanner overlay */}
      <AnimatePresence>
        {isScanningQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-left"
          >
            <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col relative font-mono text-xs">
              {/* Holographic scanner layout header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Tactical QR Beacon Receiver
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScanningQr(false)}
                  className="text-[9.5px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase border border-slate-800 px-2.5 py-1 bg-slate-950 rounded-lg"
                >
                  Abort [ESC]
                </button>
              </div>

              {/* Scanner Camera Viewfinder Container */}
              <div className="p-6 flex flex-col items-center justify-center bg-slate-950/40 relative min-h-[250px] overflow-hidden">
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

                {/* Red Laser scan line */}
                <div className="absolute left-6 right-6 h-[2px] bg-emerald-500/85 shadow-[0_0_12px_#10b981] animate-[scanline_2s_ease-in-out_infinite] z-20 pointer-events-none" />

                {/* Coordinates overlay tickers */}
                <div className="absolute top-6 left-6 text-[7.5px] text-slate-500 space-y-0.5">
                  <p>LAT: -26.19120</p>
                  <p>LNG: 28.02640</p>
                  <p>ALT: 1764.2M</p>
                </div>

                <div className="absolute top-6 right-6 text-[7.5px] text-slate-500 text-right space-y-0.5">
                  <p>FREQ: 433.92MHZ</p>
                  <p>RSSI: -54DBM</p>
                  <p>SAT: 11_GNSS</p>
                </div>

                {/* Floating target focus */}
                <div className="w-32 h-32 border border-dashed border-emerald-500/30 rounded-full flex items-center justify-center animate-[spin_30s_linear_infinite] pointer-events-none">
                  <div className="w-16 h-16 border border-emerald-500/20 rounded-full" />
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-4 text-center">
                  <span className="text-[10px] font-black text-emerald-400 bg-slate-950/90 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse shadow-md">
                    Align QR Code inside Viewport
                  </span>
                </div>
              </div>

              {/* Simulated Badge Selection */}
              <div className="p-5 border-t border-slate-800 space-y-3 bg-slate-950/20">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">
                    Simulated QR Onboarding Badge Scanner
                  </span>
                  <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
                    Click any active Safety Node below to simulate placing their physical onboarding QR badge in front of your device's camera sensor:
                  </p>
                </div>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        if (qrScanTarget === 'LOGIN') {
                          setLoginOrgCode(org.id);
                        } else {
                          setUserOrgCode(org.id);
                        }
                        addToast(`Successfully bound to node ${org.name}!`, 'success');
                        setIsScanningQr(false);
                      }}
                      className="w-full p-2.5 bg-slate-950 hover:bg-emerald-950/20 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all text-left flex items-center justify-between gap-2 text-slate-200"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-100 truncate">{org.name}</p>
                        <p className="text-[9px] text-slate-500">Code ID: {org.id}</p>
                      </div>
                      <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-2 py-0.5 rounded uppercase">
                        Scan Badge
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center">
        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em]">
          SECURE ENCRYPTED MESH MATRIX // DEEPMIND SECURITY Blueprints
        </p>
      </div>
    </div>
  );
};
