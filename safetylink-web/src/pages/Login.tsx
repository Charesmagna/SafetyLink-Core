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
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register-org';
      const body = mode === 'login'
        ? { email, password, orgCode }
        : { email, password, orgName, contactName };
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json() as { error?: string; token?: string; orgId?: string; orgName?: string; email?: string };
      if (!res.ok) throw new Error(data.error || 'Request failed');
      onLogin({ token: data.token!, orgId: data.orgId!, orgName: data.orgName!, email: data.email || email });
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
          <img src="/media/new_logo/New_SafetyLink_Official_Logo.svg" alt="SafetyLink Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
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

          {mode === 'signup' && (
            <p className="text-xs text-slate-600 text-center mt-5 leading-relaxed">
              After registering, your Organisation ID will be displayed on the dashboard. Share it with your field users so they can join on the SafetyLink mobile app.
            </p>
          )}
        </div>
        <p className="text-center text-xs text-slate-700 mt-6">SafetyLink · TM Media Solutions · South Africa</p>
      </div>
    </div>
  );
}
