import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Shield, Users, Activity, Settings, LogOut, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import { User, PanicAlert, EventLog } from '../types';

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:2px solid #0f172a;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5)"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});

const panicIcon = L.divIcon({
  className: 'custom-panic-marker',
  html: `<div style="width:24px;height:24px;background:#ef4444;border:2px solid #0f172a;border-radius:50%;box-shadow:0 0 15px rgba(239,68,68,0.9);animation:pulse 1s infinite"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12]
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom() || 13); }, [center]);
  return null;
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<'map' | 'users' | 'events' | 'settings'>('map');
  const [users, setUsers] = useState<User[]>([]);
  const [panics, setPanics] = useState<PanicAlert[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  
  const orgName = localStorage.getItem('safetylink_orgName') || 'Organization';
  const orgCode = localStorage.getItem('safetylink_orgCode') || '';

  const fetchData = async () => {
    try {
      const [uRes, pRes, eRes] = await Promise.all([
        api.get('/users'),
        api.get('/panic'),
        api.get('/events')
      ]);
      setUsers(uRes.users);
      setPanics(pRes.panics);
      setEvents(eRes.events);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.includes('token')) onLogout();
    }
  };

  useEffect(() => {
    fetchData();
    const int = setInterval(fetchData, 5000);
    return () => clearInterval(int);
  }, []);

  const resolvePanic = async (id: number) => {
    try {
      await api.post('/panic/resolve', { panic_id: id });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: 'map', icon: MapIcon, label: 'Live Map' },
    { id: 'users', icon: Users, label: 'Personnel' },
    { id: 'events', icon: Activity, label: 'Event Log' },
    { id: 'settings', icon: Settings, label: 'System Settings' }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="font-bold text-white leading-tight truncate">{orgName}</h1>
            <p className="text-xs text-slate-500 font-mono">{orgCode}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                view === item.id ? 'bg-slate-800 text-emerald-400' : 'hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold text-white capitalize">{view.replace('-', ' ')}</h2>
          <div className="flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span>{users.length} Active Nodes</span>
            </div>
            <div className={`flex items-center gap-2 ${panics.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              <Activity className="w-4 h-4" />
              <span>{panics.length} Active Alerts</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {view === 'map' && (
            <div className="h-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
              <MapContainer 
                center={[-26.2041, 28.0473]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {users.filter(u => u.latitude && u.longitude).map(u => (
                  <Marker 
                    key={u.id} 
                    position={[u.latitude!, u.longitude!]} 
                    icon={u.panic_status === 'active' ? panicIcon : userIcon}
                  >
                    <Popup className="bg-slate-900 border border-slate-800 rounded-lg p-0">
                      <div className="p-3">
                        <h4 className="font-bold text-white">{u.name}</h4>
                        <p className="text-xs text-slate-400 mb-2">{u.phone}</p>
                        {u.panic_status === 'active' && (
                          <div className="mt-2 pt-2 border-t border-slate-700">
                            <span className="text-xs text-red-400 font-bold">EMERGENCY ACTIVE</span>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {view === 'users' && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">Node / User</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-800/50 ${u.panic_status === 'active' ? 'bg-red-950/20' : ''}`}>
                      <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-sm">{u.phone}</td>
                      <td className="px-6 py-4">
                        {u.panic_status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                            CRITICAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            SECURE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {u.latitude ? `${u.latitude.toFixed(4)}, ${u.longitude?.toFixed(4)}` : 'OFFLINE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === 'events' && (
            <div className="max-w-3xl">
              <div className="space-y-4">
                {events.map(e => (
                  <div key={e.id} className="flex gap-4 items-start p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className={`p-2 rounded-lg ${
                      e.type === 'PANIC' ? 'bg-red-500/20 text-red-400' :
                      e.type === 'RESOLVED' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">
                        <span className="font-bold text-white">{e.user_name || 'System'}</span> — {e.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(e.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-6">API Integration Reference</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base API URL</label>
                  <code className="block mt-2 p-3 bg-slate-950 rounded-lg text-emerald-400 border border-slate-800">
                    https://safetylink.online/api
                  </code>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization Code</label>
                  <code className="block mt-2 p-3 bg-slate-950 rounded-lg text-emerald-400 border border-slate-800">
                    {orgCode}
                  </code>
                  <p className="text-xs text-slate-500 mt-2">Enter this code into the Android APK when registering new nodes.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Active Panic Alert Overlays */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[9999]">
        {panics.map(p => (
          <div key={p.id} className="bg-red-500 text-white p-4 rounded-xl shadow-[0_8px_30px_rgba(239,68,68,0.4)] flex items-center gap-4 animate-in slide-in-from-right">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">🚨 PANIC ALERT: {p.name}</h4>
              <p className="text-sm font-medium opacity-90">{p.phone} • {new Date(p.created_at).toLocaleTimeString()}</p>
            </div>
            <button 
              onClick={() => resolvePanic(p.id)}
              className="ml-4 px-4 py-2 bg-white text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors"
            >
              Resolve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
