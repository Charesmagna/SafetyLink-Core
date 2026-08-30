import { Shield, Server, Users, Activity } from 'lucide-react';

export function Enterprise() {
  return (
    <section className="pt-[140px] pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight">For Security Companies</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upgrade your dispatch operations with real-time BLE tracking, offline-first syncing, and advanced telemetry for guards and clients.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Command Center</h3>
            <p className="text-slate-600">Full visibility of all active distress signals and guard locations on a live map.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Live Telemetry</h3>
            <p className="text-slate-600">Track BLE panic buttons and smartphone vitals with offline-first synchronization.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Client Management</h3>
            <p className="text-slate-600">Easily onboard families and households under your corporate monitoring umbrella.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-6">
              <Server size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">API Access</h3>
            <p className="text-slate-600">Integrate SafetyLink triggers directly into your existing proprietary systems.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
