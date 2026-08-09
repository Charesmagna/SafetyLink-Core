import React, { useState } from 'react';
import { Shield, MapPin, Users, Settings, Power, Bell, ArrowLeft } from 'lucide-react';

type Tab = 'home' | 'map' | 'contacts' | 'settings';
type Status = 'safe' | 'warning' | 'danger';

export default function WebUserApp({ onBack, isEmbedded = false }: { onBack?: () => void, isEmbedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [status, setStatus] = useState<Status>('safe');
  const [sosActive, setSosActive] = useState(false);
  
  const triggerSos = () => {
    setSosActive(true);
    setStatus('danger');
    
    // Simulate API call to backend
    fetch('/api/user/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'USR-WEB', orgId: 'SL-WEB-01', lat: -26.2041, lng: 28.0473 })
    }).catch(console.error);
  };
  
  const cancelSos = () => {
    setSosActive(false);
    setStatus('safe');
  };

  return (
    <div className={`flex items-center justify-center font-sans text-white w-full max-w-[400px] mx-auto ${isEmbedded ? '' : 'min-h-[100dvh]'}`}>
      {/* App Container */}
      <div className={`w-full ${isEmbedded ? 'h-[700px]' : 'h-[100dvh] sm:h-[800px]'} sm:max-w-[400px] sm:border sm:border-white/10 sm:rounded-[40px] bg-[#0a0a0a] relative overflow-hidden flex flex-col shadow-2xl sm:shadow-black/50 ${isEmbedded ? 'rounded-[40px]' : ''}`}>
        
        {/* Header Area */}
        <header className="px-6 pt-12 pb-4 flex items-center justify-between z-10 shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            {!isEmbedded && onBack && (
              <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className={!isEmbedded && onBack ? '' : 'ml-2'}>
              <h1 className="font-bold text-lg tracking-tight">SafetyLink Web</h1>
              <p className="text-xs text-emerald-400 font-mono">Live Node Active</p>
            </div>
          </div>
          <button className="relative p-2 rounded-full bg-white/5 border border-white/10">
            <Bell className="w-5 h-5 text-white/70" />
            {sosActive && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0a]"></span>}
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-none pb-24">
            {activeTab === 'home' && (
              <div className="px-6 py-4 flex flex-col h-full min-h-[500px]">
                {/* Status Indicator */}
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'safe' ? 'bg-emerald-500' : 
                      status === 'warning' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                    }`}></div>
                    <span className="text-sm font-semibold tracking-wide uppercase text-white/70">
                      System Status
                    </span>
                  </div>
                  <h2 className={`text-3xl font-black tracking-tight ${
                    status === 'safe' ? 'text-emerald-400' : 
                    status === 'warning' ? 'text-amber-400' : 'text-red-500'
                  }`}>
                    {status === 'safe' ? 'Armed & Ready' : 
                     status === 'warning' ? 'Elevated Risk' : 'Distress Active'}
                  </h2>
                </div>

                {/* Hero Panic Button */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-10 relative">
                  <div className="relative">
                    {sosActive && (
                      <div className="absolute inset-0 bg-red-500 rounded-full blur-xl pointer-events-none opacity-50 animate-pulse" />
                    )}
                    <button 
                      onClick={sosActive ? cancelSos : triggerSos}
                      className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl z-10 ${
                        sosActive 
                          ? 'bg-red-600 border-4 border-red-400 shadow-[0_0_50px_rgba(220,38,38,0.5)] scale-105' 
                          : 'bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,1)] hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Power className={`w-20 h-20 mb-2 ${sosActive ? 'text-white' : 'text-red-500'}`} />
                      <span className={`text-2xl font-black tracking-widest uppercase ${sosActive ? 'text-white' : 'text-white/80'}`}>
                        {sosActive ? 'Cancel' : 'Panic'}
                      </span>
                    </button>
                  </div>
                  <p className="mt-8 text-sm text-center text-white/40 max-w-[200px] z-10">
                    {sosActive ? 'Emergency responders have been notified.' : 'Tap to trigger web-based silent alarm.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="px-6 py-4">
                <h2 className="text-2xl font-bold mb-6 tracking-tight">Area Map</h2>
                <div className="w-full h-[400px] bg-[#111] border border-white/10 rounded-3xl flex flex-col items-center justify-center">
                  <MapPin className="w-10 h-10 text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">Offline Map Component</p>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="px-6 py-4">
                <h2 className="text-2xl font-bold mb-6 tracking-tight">Responders</h2>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">Responder Unit {i}</h3>
                        <p className="text-xs text-emerald-400">Online · {i * 2}km away</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="px-6 py-4">
                <h2 className="text-2xl font-bold mb-6 tracking-tight">Settings</h2>
                <div className="space-y-2">
                  {['Account Details', 'Emergency Contacts', 'Location Permissions', 'Notification Preferences'].map(s => (
                    <button key={s} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl text-left hover:bg-white/10 transition-colors">
                      <span className="font-medium text-white/90">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-2 px-6 flex justify-between items-center z-20 h-24 sm:rounded-b-[40px]">
          {[
            { id: 'home', icon: Shield, label: 'Panic' },
            { id: 'map', icon: MapPin, label: 'Map' },
            { id: 'contacts', icon: Users, label: 'Contacts' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className="flex flex-col items-center gap-1.5 min-w-[64px]"
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-white/40'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
