import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useAppStore, getOrgAbbreviation } from '../utils/store';
import { LogoSetPart } from './LogoSetPart';
import { CinematicClosingLogo } from './CinematicClosingLogo';
import { motion, AnimatePresence } from 'motion/react';

import slide1 from '../assets/images/safetylink_officer_phone_1783207722148.jpg';
import slide2 from '../assets/images/safetylink_team_tablet_1783207733837.jpg';
import slide3 from '../assets/images/regenerated_image_1784546645212.png';
import slide4 from '../assets/images/safetylink_control_center_1783424754132.jpg';
import slide5 from '../assets/images/safetylink_campus_patrol_1783424770332.jpg';
import newBg1 from '../assets/images/background1.jpeg';
import newLogo1 from '/media/new_logo/New_SafetyLink_Official_Logo.svg';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    registerUser, 
    registerOrganization,
    demoMode,
    toggleDemoMode
  } = useAppStore();
  const [view, setView] = useState<'LOGIN' | 'REGISTER_USER' | 'REGISTER_ORG' | 'POST_REGISTER_DECISION'>('LOGIN');
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');

  // Background slideshow logic
  const authSlides = [newBg1, newLogo1, slide5, slide4, slide3, slide1, slide2];
  const [currentSlide, setCurrentSlide] = useState(0);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % authSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [authSlides.length]);

  // Login States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginOrgCode, setLoginOrgCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // User Register States
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<import('../types').UserRole>('Community Member');
  const [userPassword, setUserPassword] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [userError, setUserError] = useState('');

  // Org Register States
  const [orgName, setOrgName] = useState('');
  const [orgContactName, setOrgContactName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [showIdApplication, setShowIdApplication] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showClosingLogo, setShowClosingLogo] = useState(false);

  useEffect(() => {
    let listener: any = null;
    const setupListener = async () => {
      listener = await CapacitorApp.addListener('backButton', () => {
        if (showIdApplication) {
          setShowIdApplication(false);
        } else {
          setShowExitConfirm(true);
        }
      });
    };
    setupListener();
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [showIdApplication]);

  const [generatedOrgId, setGeneratedOrgId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccessMsg, setOrgSuccessMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername) {
      setLoginError('Please enter a username or administrative identifier.');
      return;
    }

    const res = await login(loginUsername, loginPassword, loginOrgCode);
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials or code combination.');
    }
  };

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccessMsg('');

    if (!userUsername || !userFullName || !userPhone || !userEmail) {
      setUserError('All personal information fields are strictly required.');
      return;
    }

    const res = await registerUser({
      username: userUsername,
      password: userPassword,
      role: userRole,
      fullName: userFullName,
      phone: userPhone,
      whatsapp: userWhatsapp,
      avatarUrl: userAvatar,
      email: userEmail,
      orgCode: '' // Simplified flow: No OrgID on registration screen
    });

    if (res.success) {
      setUserSuccessMsg('Profile created successfully! Transitioning to mode selection...');
      const tempUsername = userUsername;
      const tempFullName = userFullName;
      const tempEmail = userEmail;
      
      setRegisteredUsername(tempUsername);
      setRegisteredPassword(userPassword);
      
      // Pre-fill organization register fields with the newly created profile data
      setOrgContactName(tempFullName);
      setOrgEmail(tempEmail);

      setTimeout(() => {
        setUserSuccessMsg('');
        setUserUsername('');
        setUserRole('Community Member');
        setUserFullName('');
        setUserPhone('');
        setUserWhatsapp('');
        setUserAvatar('');
        setUserEmail('');
        setView('POST_REGISTER_DECISION');
      }, 1200);
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

  const handleOrgRegister = async (e: React.FormEvent) => {
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

    const newOrg = await registerOrganization({
      name: orgName,
      contactName: orgContactName,
      contactEmail: orgEmail,
      id: generatedOrgId,
      password: orgPassword
    });

    if (!newOrg) {
      setOrgError('Failed to register organization.');
      return;
    }

    if (newOrg.approved === false) {
      setOrgSuccessMsg(`Registered successfully! Unique Code: ${generatedOrgId}. Awaiting registry approval from Super Admin...`);
      const prefillContactName = orgContactName;
      const prefillOrgId = generatedOrgId;
      setTimeout(() => {
        setView('LOGIN');
        setLoginUsername(prefillContactName);
        setLoginOrgCode(prefillOrgId);
        setOrgSuccessMsg('');
        setOrgName('');
        setOrgContactName('');
        setOrgEmail('');
        setOrgPassword('');
        setOrgPassword('');
        setGeneratedOrgId('');
        setShowIdApplication(false);
      }, 4000);
    } else {
      setOrgSuccessMsg(`Registered successfully! Unique Code: ${generatedOrgId}. Logging you in...`);
      const registeredContactName = orgContactName;
      const registeredOrgId = generatedOrgId;

      setTimeout(async () => {
        await login(registeredContactName, orgPassword, registeredOrgId);
        setOrgSuccessMsg('');
        setOrgName('');
        setOrgContactName('');
        setOrgEmail('');
        setGeneratedOrgId('');
        setShowIdApplication(false);
      }, 1500);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col gap-4 items-center justify-start pt-10 pb-32 px-4 sm:px-6 relative overflow-y-auto select-auto scanlines">
      
      {showClosingLogo && <CinematicClosingLogo onComplete={() => CapacitorApp.exitApp()} />}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">🚪</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider font-mono">Exit SafetyLink?</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 rounded-xl border border-slate-700 font-bold uppercase tracking-wider text-xs">
                Cancel
              </button>
              <button onClick={() => { setShowExitConfirm(false); setShowClosingLogo(true); }} className="flex-1 py-3 rounded-xl bg-red-600 font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-500/20">
                Exit App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Slideshow animation */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.45 }} // Subtle 45% opacity for auth background to keep form text legible
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={authSlides[currentSlide]}
              alt="SafetyLink Background"
              className="w-full h-full object-cover filter brightness-[0.35] contrast-[1.1] saturate-[0.8]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950" />
          </motion.div>
        </AnimatePresence>
        {/* HUD Overlay Scanlines and grid */}
        <div className="absolute inset-0 digital-grid opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-red-500/5 mix-blend-color" />
      </div>

      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-red-500/5 blur-[130px] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel rounded-[2rem] p-7 shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 neon-glow-blue" />

        {/* Branding Header with Crisp High-Fidelity Still Brand Logo */}
        <div className="text-center mb-5 -mt-1">
          <div className="inline-flex items-center justify-center">
            <LogoSetPart part="main" size={90} rounded="2xl" />
          </div>
        </div>

        {/* Demo Mode Toggle Banner */}
        <div className="mb-5 glass-panel p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between font-mono">
          <div className="text-left">
            <span className="text-[9.5px] font-black tracking-wide text-slate-300 block uppercase">Demo Showcase Mode</span>
            <span className="text-[7.5px] text-slate-500 block leading-tight">Instantly populates mock networks and active supervisor nodes.</span>
          </div>
          <button
            type="button"
            onClick={toggleDemoMode}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 ${
              demoMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-md shadow-amber-950/40' 
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
            }`}
          >
            {demoMode ? 'ENABLED' : 'DISABLED'}
          </button>
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
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Organizational Mesh Code</label>
                <input
                  type="text"
                  value={loginOrgCode}
                  onChange={e => setLoginOrgCode(e.target.value)}
                  placeholder="e.g. SL-ORG-XXXX"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-mono transition-all"
                />
                <span className="text-[9px] text-slate-500 mt-1 pl-1">Leave blank for standalone mesh profile mode.</span>
              </div>
              <div className="flex flex-col mt-2">
                <label className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-950 border border-slate-900 rounded-2xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-mono transition-all"
                  required
                />
              </div>

              {/* DEMO MODE QUICK LOGIN CHANNELS (Excluding Super Admin) */}
              {demoMode && (
                <div className="glass-panel rounded-2.5xl p-4.5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[8.5px] font-black tracking-widest text-amber-400 uppercase">Exemplary Live Demo Profiles</span>
                    <span className="text-[7.5px] font-mono text-slate-500 uppercase">Excludes Admin</span>
                  </div>
                  <p className="text-[8.5px] text-slate-400 leading-normal mb-1">
                    Select a simulated role to automatically configure the console telemetry and log in directly:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      {
                        name: 'Wits Security Commander',
                        role: 'Organization Deck (ORG)',
                        username: 'commander_wits',
                        orgCode: 'SL-WITS-4829',
                        badge: 'Campus Security',
                        icon: '🏫',
                        color: 'hover:bg-emerald-500/5 hover:border-emerald-500/30 text-emerald-400 border-emerald-500/10 bg-emerald-500/2'
                      },
                      {
                        name: 'City Patrol Dispatcher',
                        role: 'Organization Deck (ORG)',
                        username: 'chief_patrol',
                        orgCode: 'SL-CITY-2810',
                        badge: 'Armed Response',
                        icon: '🚓',
                        color: 'hover:bg-red-500/5 hover:border-red-500/30 text-red-400 border-red-500/10 bg-red-500/2'
                      },
                      {
                        name: 'Tshilidzi Mukwevho (Wits)',
                        role: 'Safety Hub (USER)',
                        username: 'thabo_m',
                        orgCode: 'SL-WITS-4829',
                        badge: 'Bound Student',
                        icon: '👤',
                        color: 'hover:bg-blue-500/5 hover:border-blue-500/30 text-blue-400 border-blue-500/10 bg-blue-500/2'
                      },
                      {
                        name: 'Lerato Khumalo (Private)',
                        role: 'Safety Hub (USER)',
                        username: 'lerato_k',
                        orgCode: '',
                        badge: 'Independent Client',
                        icon: '🏡',
                        color: 'hover:bg-purple-500/5 hover:border-purple-500/30 text-purple-400 border-purple-500/10 bg-purple-500/2'
                      }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLoginUsername(p.username);
                          setLoginOrgCode(p.orgCode);
                          setLoginPassword('');
                          setLoginError('');
                        }}
                        className={`w-full text-left p-3 rounded-2xl border flex items-start gap-3 transition-all ${p.color}`}
                      >
                        <span className="text-base pt-0.5">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-black tracking-wide truncate text-slate-200 block">
                              {p.name}
                            </span>
                            <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 uppercase shrink-0">
                              {p.badge}
                            </span>
                          </div>
                          <span className="text-[8.5px] text-slate-400 block mt-0.5">
                            Role: {p.role}
                          </span>
                          <span className="text-[7.5px] text-slate-500 font-mono block mt-1">
                            Callsign: <strong className="text-slate-300">{p.username}</strong> {p.orgCode && <>· Mesh: <strong className="text-slate-300">{p.orgCode}</strong></>}
                          </span>
                        </div>
                      </button>
                    ))}
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
                {demoMode && (
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
                )}
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
                <div className="flex flex-col mt-3">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={e => setUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
                <div className="flex flex-col mt-3">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Role</label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as import('../types').UserRole)}
                    className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="Community Member">Community Member</option>
                    <option value="Responder">Responder (Guard/Medical)</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={userFullName}
                    onChange={e => setUserFullName(e.target.value)}
                    placeholder="Tshilidzi Mukwevho"
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

          {/* POST REGISTER DECISION */}
          {view === 'POST_REGISTER_DECISION' && (
            <motion.div
              key="post_register_decision"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-left font-mono"
            >
              <div className="border-b border-slate-900 pb-3.5 mb-2 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-emerald-400">✓</span>
                </div>
                <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-display">Profile Established</h2>
                <p className="text-[10px] text-slate-400 mt-1">Select your desired SafetyLink service path to proceed.</p>
              </div>

              <div className="space-y-4">
                {/* Mode A: Personal Account */}
                <button
                  type="button"
                  onClick={() => {
                    login(registeredUsername, registeredPassword);
                  }}
                  className="w-full text-left p-4 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-blue-500/50 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors mt-0.5">
                      👤
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                        Personal / Individual Account
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                        Deploy the tactical panic dashboard for private security, family networks, offline telemetry queueing, and personal BLE buttons.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Mode B: Create Organization */}
                <button
                  type="button"
                  onClick={() => {
                    setView('REGISTER_ORG');
                  }}
                  className="w-full text-left p-4 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-emerald-500/50 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors mt-0.5">
                      🏢
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors uppercase tracking-wider">
                        Create & Provision Organization
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                        Establish an enterprise Safety Node Commander Deck to manage patrol guards, monitor student/staff rosters, and configure a Twilio cloud gateway.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setView('LOGIN')}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono font-bold uppercase tracking-wider"
                >
                  ← Back to Login
                </button>
              </div>
            </motion.div>
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
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Admin Password</label>
                <input
                  type="password"
                  value={orgPassword}
                  onChange={e => setOrgPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              {/* Organization ID Application */}
              <div className="glass-panel rounded-2xl p-3.5 space-y-3">
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
                        <div className="flex-1 bg-slate-950 border border-emerald-500/20 px-3 py-2 rounded-xl text-center font-mono font-black text-xs text-emerald-400 tracking-widest select-text">
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

      <div className="mt-6 text-center space-y-1">
        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em]">
          SECURE ENCRYPTED MESH MATRIX // DEEPMIND SECURITY Blueprints
        </p>
        <p className="text-[8px] text-amber-500/60 font-mono uppercase tracking-[0.25em] font-black">
          POWERED BY TM MEDIA SOLUTIONS
        </p>
      </div>
    </div>
  );
};
