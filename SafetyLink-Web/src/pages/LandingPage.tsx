import { Shield, Smartphone, Globe, Lock } from 'lucide-react';

export default function LandingPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            <span className="font-bold text-lg tracking-wide">SafetyLink</span>
          </div>
          <button 
            onClick={() => onNavigate('/login')}
            className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors"
          >
            Admin Login
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Real-time safety <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                monitoring for organizations
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Deploy a private safety network in minutes. Connect field personnel, students, or guards directly to a centralized Commander Deck.
            </p>
            <button 
              onClick={() => onNavigate('/login')}
              className="px-8 py-4 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
            >
              Access Commander Deck
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-slate-900 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Smartphone, title: 'Mobile APK Integration', desc: 'Distribute the SafetyLink APK directly to your personnel for instant telemetry.' },
                { icon: Globe, title: 'Global Map View', desc: 'Monitor live locations and panic events on an interactive tactical map.' },
                { icon: Lock, title: 'Private & Secure', desc: 'Organizations are completely siloed. You only see your registered nodes.' }
              ].map((f, i) => (
                <div key={i} className="bg-slate-950 p-8 rounded-2xl border border-slate-800">
                  <f.icon className="w-10 h-10 text-emerald-400 mb-6" />
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 text-center text-slate-500 border-t border-slate-900">
        <p>&copy; {new Date().getFullYear()} SafetyLink Core Systems.</p>
      </footer>
    </div>
  );
}
