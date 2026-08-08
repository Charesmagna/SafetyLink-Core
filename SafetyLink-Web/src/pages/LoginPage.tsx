import { useState } from 'react';
import { api } from '../api/client';
import { Shield, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onLogin, onBack }: { onLogin: (token: string, name: string, code: string) => void, onBack: () => void }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { org_code: code, admin_password: password });
      onLogin(res.token, res.org_name, res.org_code);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <button onClick={onBack} className="absolute -left-12 top-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Commander Deck</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your organization credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">Organization Code</label>
              <div className="mt-1">
                <input
                  required
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="e.g. SAFELINK-DEMO"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Admin Password</label>
              <div className="mt-1">
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-md p-3">
                {JSON.parse(error).error || error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Authenticating...' : 'Engage uplink'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
