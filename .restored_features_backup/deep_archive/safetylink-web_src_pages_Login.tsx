import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { Page, Session } from '../App';

interface Props {
  mode: 'login' | 'signup';
  onLogin: (s: Session) => void;
  onBack: () => void;
  onSwitch: (m: Page) => void;
}

export default function Login({ mode, onLogin, onBack, onSwitch }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        // Unified login — same endpoint as APK
        const res = await fetch('/api/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, org_code: orgCode, password })
        });
        const data = await res.json() as any;
        if (!res.ok) {
          if (data.trialExpired) throw new Error('Your trial has expired. Contact SafetyLink to activate your plan.');
          throw new Error(data.error || 'Login failed');
        }
        if (data.trialDaysLeft !== null && data.trialDaysLeft <= 3) {
          setError(`Trial expires in ${data.trialDaysLeft} day(s). Upgrade to continue.`);
        }
        onLogin({ token: data.token!, orgId: String(data.superAdmin ? 0 : data.org_code), orgName: data.org_name!, email });
      } else {
        // Register new org — 14-day trial starts now
        const res = await fetch('/api/register-org', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_name: orgName, admin_password: password })
        });
        const data = await res.json() as any;
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        setError('');
        alert(`Organisation registered! Your code: ${data.org_code}\n14-day trial started. Share this code with your members.`);
        onSwitch('login' as Page);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen bg-sl-dark flex items-center justify-center p-4 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover object-center opacity-30"
        >
          <source src="/media/safetylink_startup.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to home
        </button>

        <div className="text-center mb-8">
          <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SafetyLink Logo" className="w-16 h-16 mx-auto mb-4 object-contain bg-white p-2 rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-black text-white">SafetyLink</h1>
          <p className="text-slate-500 text-sm mt-1">Organisation Portal</p>
        </div>

        <div className="bg-sl-card border border-sl-border rounded-3xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-sl-dark rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => onSwitch(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${mode === m ? 'bg-sl-red text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Register Org'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Organisation Name</label>
                <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Acme Security Services"
                  className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 focus:ring-1 focus:ring-sl-red/20 text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Full Name</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith"
                  className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 focus:ring-1 focus:ring-sl-red/20 text-sm transition-all" />
              </div>
            </>}

            {mode === 'login' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Organisation ID</label>
                <input value={orgCode} onChange={e => setOrgCode(e.target.value.toUpperCase())} placeholder="SL-ACME-1234"
                  className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 focus:ring-1 focus:ring-sl-red/20 text-sm font-mono transition-all" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourorg.com"
                className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 focus:ring-1 focus:ring-sl-red/20 text-sm transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-sl-dark border border-sl-border rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-sl-red/50 focus:ring-1 focus:ring-sl-red/20 text-sm transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-sl-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 hover:shadow-lg hover:shadow-red-900/30">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Organisation'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="mb-4">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Exemplary Live Demo Profiles</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Select a simulated role to access the Commander Deck directly without a password:</p>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onLogin({ token: 'demo-token-wits', orgId: 'SL-WITS-4829', orgName: 'Wits Campus Security', email: 'commander_wits@demo.com' })}
                  className="w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all hover:bg-emerald-500/5 hover:border-emerald-500/30 text-emerald-400 border-emerald-500/10 bg-emerald-500/2 group"
                >
                  <span className="text-2xl">🏫</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black tracking-wide text-slate-200 block">Wits Security Commander</span>
                    <span className="text-[10px] font-mono text-slate-500 block">Organization Deck (ORG)</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    AUTO-LOGIN
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onLogin({ token: 'demo-token-city', orgId: 'SL-CITY-2810', orgName: 'City Patrol Dispatch', email: 'chief_patrol@demo.com' })}
                  className="w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all hover:bg-red-500/5 hover:border-red-500/30 text-red-400 border-red-500/10 bg-red-500/2 group"
                >
                  <span className="text-2xl">🚓</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black tracking-wide text-slate-200 block">City Patrol Dispatcher</span>
                    <span className="text-[10px] font-mono text-slate-500 block">Organization Deck (ORG)</span>
                  </div>
                  <div className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    AUTO-LOGIN
                  </div>
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-slate-600 text-center mt-5 leading-relaxed">
              After registering, your Organisation ID will be displayed on the dashboard. Share it with your field users so they can join on the SafetyLink mobile app.
            </p>
          )}
        </div>
        <div className="flex flex-col items-center mt-6 gap-2">
          <img src="/media/new_logo/Official_Umbrella_Logo.png" alt="TM Media Solutions" className="h-6 object-contain opacity-50 bg-white p-1 rounded" />
          <p className="text-center text-xs text-slate-700">SafetyLink · TM Media Solutions · South Africa</p>
        </div>
      </div>
    </div>
  );
}
