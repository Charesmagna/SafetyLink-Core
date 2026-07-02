import React, { useState } from 'react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';

export const AuthScreen: React.FC = () => {
  const { login, registerUser, registerOrganization } = useAppStore();
  const [view, setView] = useState<'LOGIN' | 'REGISTER_USER' | 'REGISTER_ORG'>('LOGIN');

  // Login States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginOrgCode, setLoginOrgCode] = useState('');
  const [loginError, setLoginError] = useState('');

  // User Register States
  const [userUsername, setUserUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');
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
    if (!res.success) {
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
      email: userEmail,
      orgCode: userOrgCode
    });

    if (res.success) {
      setUserSuccessMsg('Profile created successfully! You can now sign in using your username.');
      // Pre-fill login info
      setLoginUsername(userUsername);
      setLoginOrgCode(userOrgCode);
      setTimeout(() => {
        setView('LOGIN');
        setUserSuccessMsg('');
        // Clear fields
        setUserUsername('');
        setUserFullName('');
        setUserPhone('');
        setUserEmail('');
        setUserOrgCode('');
      }, 2000);
    } else {
      setUserError(res.error || 'Registration failed.');
    }
  };

  const handleGenerateOrgId = () => {
    if (!orgName || !orgContactName || !orgEmail) {
      setOrgError('Please fill in human personal details and name before generating ID.');
      return;
    }
    setOrgError('');
    setIsGenerating(true);

    // Simulate Firebase database cluster writing & indexing
    setTimeout(() => {
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      const code = `SL-ORG-${randomHex}`;
      setGeneratedOrgId(code);
      setIsGenerating(false);
    }, 1500);
  };

  const handleOrgRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgError('');
    setOrgSuccessMsg('');

    if (!orgName || !orgContactName || !orgEmail) {
      setOrgError('Please fill in human personal details and organization name.');
      return;
    }

    if (!generatedOrgId) {
      setOrgError('Please extend the menu below and generate a unique organization ID first.');
      return;
    }

    const newOrg = registerOrganization({
      name: orgName,
      contactName: orgContactName,
      contactEmail: orgEmail
    });

    // We force override the random generated code to match what was generated in the stack
    newOrg.id = generatedOrgId;

    setOrgSuccessMsg(`Registered successfully! Unique Code: ${generatedOrgId}`);
    setLoginUsername(orgContactName);
    setLoginOrgCode(generatedOrgId);

    setTimeout(() => {
      setView('LOGIN');
      setOrgSuccessMsg('');
      setOrgName('');
      setOrgContactName('');
      setOrgEmail('');
      setGeneratedOrgId('');
      setShowIdApplication(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-30%] w-[80%] h-[80%] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-30%] w-[80%] h-[80%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-900/60 rounded-3xl p-6.5 shadow-2xl relative z-10 overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-emerald-500 opacity-60" />

        {/* Branding header */}
        <div className="flex flex-col items-center mb-6 mt-1 text-center">
          <SafetyLinkLogo size={64} showText={true} className="justify-center flex-col scale-110 mb-2" />
          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">Sequential Emergency Alert Network</p>
        </div>

        {/* VIEW 1: LOGIN */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4.5 text-left">
            <div className="border-b border-slate-800 pb-2 mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">Secure Access Entry</h2>
              <p className="text-[10px] text-slate-500">Enter your credentials below to log into the safety console.</p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono leading-relaxed">
                ⚠️ {loginError}
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase">Username / Admin Key</label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="e.g. thabo_m"
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase">Organization Code (If Registered)</label>
              <input
                type="text"
                value={loginOrgCode}
                onChange={e => setLoginOrgCode(e.target.value)}
                placeholder="e.g. SL-ORG-8492 or SL-admin-0000"
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[9px] text-slate-500 mt-1 font-mono">Leave blank for independent profiles.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-bold rounded-2xl uppercase tracking-wider shadow-lg shadow-blue-900/20 mt-2 font-mono"
            >
              Sign In to Console
            </button>

            <div className="flex justify-between text-xs pt-3 border-t border-slate-800/60 font-mono">
              <button
                type="button"
                onClick={() => setView('REGISTER_USER')}
                className="text-slate-400 hover:text-slate-200 hover:underline text-left font-bold"
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => setView('REGISTER_ORG')}
                className="text-slate-400 hover:text-slate-200 hover:underline text-right font-bold"
              >
                Register Organization
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTER ORDINARY USER */}
        {view === 'REGISTER_USER' && (
          <form onSubmit={handleUserRegister} className="space-y-4 text-left">
            <div className="border-b border-slate-800 pb-2 mb-2">
              <h2 className="text-sm font-bold text-blue-400 uppercase font-mono tracking-wider">Create User / Responder Profile</h2>
              <p className="text-[10px] text-slate-500">Establish your secure wearable responder record.</p>
            </div>

            {userError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                {userError}
              </div>
            )}

            {userSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-mono">
                ✅ {userSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Username</label>
                <input
                  type="text"
                  value={userUsername}
                  onChange={e => setUserUsername(e.target.value)}
                  placeholder="e.g. thabo_m"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Full Name</label>
                <input
                  type="text"
                  value={userFullName}
                  onChange={e => setUserFullName(e.target.value)}
                  placeholder="e.g. Thabo Molefe"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Cell Phone</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  placeholder="e.g. +27721234567"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="e.g. thabo@wits.co.za"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase">Host Org ID Code (Optional)</label>
              <input
                type="text"
                value={userOrgCode}
                onChange={e => setUserOrgCode(e.target.value)}
                placeholder="e.g. SL-ORG-8492"
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[9px] text-slate-500 mt-1 font-mono">Enables your school, office, gov org, security firm, or accommodation provider to receive pings.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs font-bold rounded-2xl uppercase tracking-wider shadow-lg shadow-blue-900/20 font-mono"
            >
              OK — Create Profile
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono font-bold"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: REGISTER ORGANIZATION */}
        {view === 'REGISTER_ORG' && (
          <form onSubmit={handleOrgRegister} className="space-y-4.5 text-left">
            <div className="border-b border-slate-800 pb-2 mb-2">
              <h2 className="text-sm font-bold text-emerald-400 uppercase font-mono tracking-wider">Secure Organization Provisioning</h2>
              <p className="text-[10px] text-slate-500">Provide focal contact info first, then apply for a node identifier.</p>
            </div>

            {orgError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono">
                {orgError}
              </div>
            )}

            {orgSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-mono">
                ✅ {orgSuccessMsg}
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase">Organization / Entity Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Apex Security, HighSchool, GovDept, CorporateOffice"
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Contact / Manager Name</label>
                <input
                  type="text"
                  value={orgContactName}
                  onChange={e => setOrgContactName(e.target.value)}
                  placeholder="e.g. Mpho Lekota"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Contact Email</label>
                <input
                   type="email"
                  value={orgEmail}
                  onChange={e => setOrgEmail(e.target.value)}
                  placeholder="e.g. mpho@apex.co.za"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* EXTENSIBLE MENU: ORGANIZATION ID APPLICATION */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <button
                type="button"
                onClick={() => setShowIdApplication(!showIdApplication)}
                className="w-full flex justify-between items-center text-xs font-mono font-bold text-emerald-400 tracking-wide uppercase"
              >
                <span>📂 Organization ID Application</span>
                <span className="text-sm">{showIdApplication ? '▲' : '▼'}</span>
              </button>

              {showIdApplication && (
                <div className="space-y-3 pt-2 border-t border-slate-900 animate-fadeIn">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Generate an indexed code in the SafetyLink Firebase database for users, members, or residents to bind to during registration.
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateOrgId}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors text-white font-mono text-[10px] font-bold rounded-xl uppercase tracking-wider shadow"
                    >
                      {isGenerating ? 'GENERATING...' : 'Generate Organization ID'}
                    </button>

                    {generatedOrgId && (
                      <div className="flex-1 bg-slate-900 border border-emerald-500/20 px-3 py-2 rounded-xl text-center font-mono font-black text-xs text-emerald-400 tracking-wider">
                        {generatedOrgId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-xs font-bold rounded-2xl uppercase tracking-wider shadow-lg shadow-emerald-900/20 font-mono"
            >
              Register Organization Profile
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setView('LOGIN')}
                className="text-xs text-slate-400 hover:text-slate-200 font-mono font-bold"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          Secured by DeepMind Firebase Secure Gateway
        </p>
      </div>
    </div>
  );
};
