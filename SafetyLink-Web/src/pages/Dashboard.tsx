import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Shield, Users, Activity, Settings, LogOut, Map as MapIcon, 
  Search, AlertTriangle, MapPin, CheckCircle2, ChevronRight, Zap, RefreshCw, Server
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
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

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<'map' | 'users' | 'events' | 'settings'>('map');
  const [users, setUsers] = useState<User[]>([]);
  const [panics, setPanics] = useState<PanicAlert[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const orgName = localStorage.getItem('safetylink_orgName') || 'Organization';
  const orgCode = localStorage.getItem('safetylink_orgCode') || '';

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [uRes, pRes, eRes] = await Promise.all([
        api.get('/users'),
        api.get('/panic'),
        api.get('/events')
      ]);
      setUsers((uRes as any).users || []);
      setPanics((pRes as any).panics || []);
      setEvents((eRes as any).events || []);
    } catch (e) {
      console.error(e);
      if ((e as any)?.message?.includes('Unauthorized')) {
        onLogout();
      }
    } finally {
      setIsRefreshing(false);
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
    { id: 'map', icon: MapIcon, label: 'Tactical Map' },
    { id: 'users', icon: Users, label: 'Node Roster' },
    { id: 'events', icon: Activity, label: 'Audit Logs' },
    { id: 'settings', icon: Settings, label: 'Mesh Settings' }
  ];

  const activeAlertsCount = panics.length;
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery));

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 border-r border-slate-800/50 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-4 bg-slate-900/30">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate uppercase tracking-wider">{orgName}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              NET:{orgCode}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 px-4">Command Center</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
                view === item.id 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {view === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-500 rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 ${view === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
              {item.id === 'map' && activeAlertsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Operator</div>
              <div className="text-sm font-medium text-slate-300">Admin Console</div>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all font-medium text-sm">
            <LogOut className="w-4 h-4" />
            Secure Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none" />
        
        <header className="h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-8 relative z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-white capitalize tracking-tight flex items-center gap-3">
              {view === 'map' && <MapIcon className="w-6 h-6 text-emerald-500" />}
              {view === 'users' && <Users className="w-6 h-6 text-blue-500" />}
              {view === 'events' && <Activity className="w-6 h-6 text-purple-500" />}
              {view === 'settings' && <Settings className="w-6 h-6 text-slate-500" />}
              {view.replace('-', ' ')}
            </h2>
            <button onClick={fetchData} className={`p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-600 w-48"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 shadow-inner">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>{users.length} Nodes</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium shadow-inner transition-colors ${activeAlertsCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {activeAlertsCount > 0 ? <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> : <Shield className="w-3.5 h-3.5" />}
                <span>{activeAlertsCount} {activeAlertsCount === 1 ? 'Alert' : 'Alerts'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-auto relative z-10 custom-scrollbar">
          {view === 'map' && (
            <div className="h-full rounded-2xl overflow-hidden border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative bg-slate-900">
              <MapContainer 
                center={[-26.2041, 28.0473]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                className="z-0"
              >
                <ZoomControl position="bottomright" />
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
                    <Popup className="custom-popup" closeButton={false}>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-lg">{u.name}</h4>
                          <span className={`w-2 h-2 rounded-full ${u.panic_status === 'active' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                        </div>
                        <p className="text-sm font-mono text-slate-400 mb-3 pb-3 border-b border-slate-800">{u.phone}</p>
                        
                        {u.panic_status === 'active' ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                            <AlertTriangle className="w-4 h-4" /> DISTRESS SIGNAL ACTIVE
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" /> SECURE
                          </div>
                        )}
                        <div className="mt-3 text-[10px] text-slate-500 font-mono uppercase tracking-widest flex justify-between">
                          <span>LAT: {u.latitude?.toFixed(4)}</span>
                          <span>LNG: {u.longitude?.toFixed(4)}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              
              {/* Overlay map HUD */}
              <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-300 text-xs font-mono py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live GIS Telemetry Active
                </div>
                {activeAlertsCount > 0 && (
                  <div className="bg-red-950/80 backdrop-blur border border-red-500/30 text-red-400 text-xs font-bold py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> PRIORITY THREAT DETECTED
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'users' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-950/50 text-xs uppercase text-slate-500 font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Node Designation</th>
                      <th className="px-6 py-4">Comm Link</th>
                      <th className="px-6 py-4">Security State</th>
                      <th className="px-6 py-4">Coordinates (GIS)</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <tr key={u.id} className={`hover:bg-slate-800/30 transition-colors ${u.panic_status === 'active' ? 'bg-red-500/[0.02]' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${u.panic_status === 'active' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                              <Users className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-sm">{u.phone}</td>
                        <td className="px-6 py-4">
                          {u.panic_status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
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
                          {u.latitude ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-slate-600" />
                              {u.latitude.toFixed(4)}, {u.longitude?.toFixed(4)}
                            </div>
                          ) : (
                            <span className="text-slate-600">OFFLINE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-500 hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No nodes found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'events' && (
            <div className="max-w-4xl mx-auto">
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {events.map((e, index) => (
                  <div key={e.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${index !== 0 ? 'mt-4' : ''}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_1px_#1e293b] ${
                      e.type === 'PANIC' ? 'bg-red-500 text-white' :
                      e.type === 'RESOLVED' ? 'bg-emerald-500 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {e.type === 'PANIC' ? <AlertTriangle className="w-4 h-4" /> :
                       e.type === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-white">{e.user_name || 'System'}</div>
                        <time className="font-mono text-xs text-slate-500">{new Date(e.created_at).toLocaleTimeString()}</time>
                      </div>
                      <div className="text-sm text-slate-400">{e.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-3xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-500" /> Network Configuration
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Details for binding new hardware or mobile nodes to this command center.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Network Bind Code</label>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-lg font-bold text-center tracking-[0.2em] shadow-inner">
                          {orgCode}
                        </code>
                      </div>
                      <p className="text-xs text-slate-500">Provide this 6-digit code to operators during mobile APK setup.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">API Endpoint Base</label>
                      <code className="block p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-sm shadow-inner truncate">
                        https://safetylink.online/api
                      </code>
                      <p className="text-xs text-slate-500">For third-party hardware integration and custom firmware.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Hardware Beacons (Simulated)
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Configure BLE (Bluetooth Low Energy) node behaviors for this mesh.</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 mb-4">
                    <div>
                      <div className="font-bold text-slate-200">Continuous Location Polling</div>
                      <div className="text-sm text-slate-500">Enables high-frequency GIS updates (consumes more battery on mobile nodes).</div>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer opacity-80 pointer-events-none">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <div className="font-bold text-slate-200">Hardware Panic Button Binding</div>
                      <div className="text-sm text-slate-500">Allow physical BLE keychain triggers to emit distress signals.</div>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer opacity-80 pointer-events-none">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Active Panic Alert Overlays */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[9999] pointer-events-none">
        {panics.map(p => (
          <div key={p.id} className="bg-slate-900/90 backdrop-blur-xl border border-red-500/50 p-5 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] flex items-center gap-5 pointer-events-auto transform transition-all hover:scale-105 border-l-4 border-l-red-500">
            <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 mb-1 tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Priority Distress
              </div>
              <h4 className="font-black text-white text-xl uppercase tracking-tight">{p.name}</h4>
              <p className="text-slate-400 font-mono text-sm mt-1">{p.phone} • {new Date(p.created_at).toLocaleTimeString()}</p>
            </div>
            <button 
              onClick={() => resolvePanic(p.id)}
              className="ml-6 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl shadow-lg transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] whitespace-nowrap active:scale-95"
            >
              RESOLVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
