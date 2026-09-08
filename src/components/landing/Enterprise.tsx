import React from 'react';
import { Shield, Server, Users, Activity } from 'lucide-react';

interface Props { onLogin: () => void; onRegisterUser: () => void; onRegisterOrg: () => void; navigate?: (p: string) => void; }

export function Enterprise({ onLogin, onRegisterOrg }: Props) {
  return (
    <section className="pt-10 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 text-red-700 text-sm font-bold uppercase tracking-wider mb-6">
            <Shield className="w-4 h-4" /> Enterprise & Organisations
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Built for Scale. Designed for Command.</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Estate management companies, armed response units, schools, municipalities, and corporate campuses. SafetyLink Enterprise gives your organisation real-time situational awareness and dispatch coordination at every level.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: <Users className="w-8 h-8 text-red-600" />, title: 'Multi-User Management', desc: 'Manage hundreds of members across zones, shifts, and roles. Assign responders, commanders, and civilians to nested org structures.' },
            { icon: <Activity className="w-8 h-8 text-red-600" />, title: 'Live Dispatch Dashboard', desc: 'Command Deck gives supervisors real-time panic event feeds, GPS tracking, BLE mesh status, and one-click escalation tools.' },
            { icon: <Server className="w-8 h-8 text-red-600" />, title: 'Dedicated Infrastructure', desc: 'Enterprise clients get dedicated Firestore nodes, private API endpoints, and SLA-backed uptime guarantees.' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-3xl p-10 text-white text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Deploy SafetyLink at Scale?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">Contact us to discuss your organisation's needs. Custom pricing, dedicated support, and onboarding within 48 hours.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={onRegisterOrg} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all">
              Start 14-Day Trial
            </button>
            <a href="mailto:info@safetylink.online" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all">
              Contact Enterprise Team
            </a>
            <a href="https://wa.me/message/YIEA73M7H3P5M1" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
