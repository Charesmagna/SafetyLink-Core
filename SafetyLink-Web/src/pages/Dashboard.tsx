import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { 
  Shield, Users, Activity, Settings, LogOut, Map as MapIcon, 
  Search, AlertTriangle, MapPin, CheckCircle2, ChevronRight, Zap, RefreshCw, Server
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { User, PanicAlert, EventLog } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const previousAlertsCount = useRef(0);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We can use a base64 encoded simple beep, or an external URL for a distress alarm.
    // Using a reliable public domain sound for demonstration:
    alarmAudio.current = new Audio('https://cdn.freesound.org/previews/235/235338_2336709-lq.mp3');
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [uRes, pRes, eRes] = await Promise.all([
        api.get('/users'),
        api.get('/panic'),
        api.get('/events')
      ]);
      setUsers((uRes as any).users || []);
      const newPanics = (pRes as any).panics || [];
      setPanics(newPanics);
      setEvents((eRes as any).events || []);
      
      // Check if new EXTREME ALERTS entered the triage
      if (newPanics.length > previousAlertsCount.current) {
        if (alarmAudio.current) {
          alarmAudio.current.currentTime = 0;
          alarmAudio.current.play().catch(e => console.error("Audio playback prevented by browser:", e));
        }
      }
      previousAlertsCount.current = newPanics.length;
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
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-emerald-500/30 relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
      
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 border-r border-white/5 flex flex-col z-20 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-slate-950/50 backdrop-blur-3xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm truncate uppercase tracking-wider">{orgName}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
              NET:{orgCode}
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-4">Command Center</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                view === item.id 
                  ? 'bg-white/10 text-white shadow-lg border border-white/10 backdrop-blur-md' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              {view === item.id && (
                <motion.div layoutId="active-nav-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              )}
              <item.icon className={`w-5 h-5 transition-colors ${view === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="relative z-10">{item.label}</span>
              {item.id === 'map' && activeAlertsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse border border-red-400 relative z-10">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Operator</div>
              <div className="text-sm font-bold text-white">Admin Console</div>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all font-medium text-sm backdrop-blur-md group">
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Secure Disconnect
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl flex items-center justify-between px-8 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-white capitalize tracking-tight flex items-center gap-3 drop-shadow-md">
              {view === 'map' && <MapIcon className="w-6 h-6 text-emerald-400" />}
              {view === 'users' && <Users className="w-6 h-6 text-blue-400" />}
              {view === 'events' && <Activity className="w-6 h-6 text-purple-400" />}
              {view === 'settings' && <Settings className="w-6 h-6 text-slate-400" />}
              {view.replace('-', ' ')}
            </h2>
            <button onClick={fetchData} className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md focus-within:bg-white/10 focus-within:border-white/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 w-48"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-200 shadow-inner backdrop-blur-md">
                <Server className="w-4 h-4 text-blue-400" />
                <span>{users.length} Nodes</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 ${activeAlertsCount > 0 ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                {activeAlertsCount > 0 ? <AlertTriangle className="w-4 h-4 animate-pulse text-red-400" /> : <Shield className="w-4 h-4 text-emerald-400" />}
                <span>{activeAlertsCount} {activeAlertsCount === 1 ? 'Alert' : 'Alerts'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-auto relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative bg-slate-900 group"
              >
                {/* Glassmorphism reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none z-10" />
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
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl min-w-[220px]">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-white text-lg">{u.name}</h4>
                            <span className={`w-2.5 h-2.5 rounded-full ${u.panic_status === 'active' ? 'bg-red-500 animate-ping shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} />
                          </div>
                          <p className="text-sm font-mono text-slate-400 mb-4 pb-4 border-b border-white/5">{u.phone}</p>
                          
                          {u.panic_status === 'active' ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-red-300 bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                              <AlertTriangle className="w-4 h-4 animate-pulse" /> DISTRESS SIGNAL ACTIVE
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 className="w-4 h-4" /> SECURE
                            </div>
                          )}
                          <div className="mt-4 p-3 bg-black/40 rounded-lg text-[10px] text-slate-400 font-mono uppercase tracking-widest flex justify-between border border-white/5">
                            <span>LAT: {u.latitude?.toFixed(4)}</span>
                            <span>LNG: {u.longitude?.toFixed(4)}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
                {/* Overlay map HUD */}
                <div className="absolute top-6 left-6 z-[400] flex flex-col gap-3 pointer-events-none">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 text-white text-xs font-bold tracking-wide py-2 px-4 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Live GIS Telemetry Active
                  </div>
                  {activeAlertsCount > 0 && (
                    <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/40 text-red-300 text-xs font-black tracking-widest py-2 px-4 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4" /> PRIORITY THREAT DETECTED
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {view === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-full"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-black/20 text-xs uppercase text-slate-400 font-black tracking-wider border-b border-white/5">
                      <tr>
                        <th className="px-8 py-5">Node Designation</th>
                        <th className="px-8 py-5">Comm Link</th>
                        <th className="px-8 py-5">Security State</th>
                        <th className="px-8 py-5">Coordinates (GIS)</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <tr key={u.id} className={`hover:bg-white/5 transition-colors group ${u.panic_status === 'active' ? 'bg-red-500/[0.05] hover:bg-red-500/[0.1]' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${u.panic_status === 'active' ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                <Users className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-white text-base">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-slate-400 font-mono text-sm">{u.phone}</td>
                          <td className="px-8 py-5">
                            {u.panic_status === 'active' ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                                CRITICAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                SECURE
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-slate-400 font-mono text-sm">
                            {u.latitude ? (
                              <div className="flex items-center gap-2 bg-black/20 inline-flex px-3 py-1.5 rounded-lg border border-white/5">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                {u.latitude.toFixed(4)}, {u.longitude?.toFixed(4)}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic bg-black/20 inline-flex px-3 py-1.5 rounded-lg border border-white/5">OFFLINE</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-medium text-lg">
                            No nodes found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'events' && (
              <motion.div 
                key="events"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-emerald-500/50 before:via-blue-500/20 before:to-transparent">
                  {events.map((e, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={e.id} 
                      className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active ${index !== 0 ? 'mt-8' : ''}`}
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border border-white/10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl backdrop-blur-md z-10 ${
                        e.type === 'PANIC' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                        e.type === 'RESOLVED' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' :
                        'bg-white/10 text-slate-300'
                      }`}>
                        {e.type === 'PANIC' ? <AlertTriangle className="w-5 h-5" /> : 
                         e.type === 'RESOLVED' ? <CheckCircle2 className="w-5 h-5" /> : 
                         <Activity className="w-5 h-5" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white/5 border border-white/10 p-5 rounded-2xl shadow-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-black text-white text-lg tracking-wide">{e.user_name || 'System'}</div>
                          <time className="font-mono text-xs text-slate-400 bg-black/30 px-2 py-1 rounded-lg border border-white/5">{new Date(e.created_at).toLocaleTimeString()}</time>
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed">{e.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-8 backdrop-blur-xl relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
                  <div className="p-8 border-b border-white/5 bg-black/20">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl"><Server className="w-6 h-6 text-blue-400" /></div> 
                      Network Configuration
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Details for binding new hardware or mobile nodes to this command center.</p>
                  </div>
                  <div className="p-8 space-y-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Network Bind Code</label>
                        <div className="flex items-center gap-3">
                          <code className="flex-1 p-4 bg-black/40 rounded-2xl border border-white/5 text-emerald-400 font-mono text-2xl font-black text-center tracking-[0.3em] shadow-inner backdrop-blur-md">
                            {orgCode}
                          </code>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Provide this 6-digit code to operators during mobile APK setup.</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">API Endpoint Base</label>
                        <code className="block p-4 bg-black/40 rounded-2xl border border-white/5 text-slate-300 font-mono text-sm shadow-inner truncate backdrop-blur-md">
                          https://safetylink.online/api
                        </code>
                        <p className="text-xs text-slate-500 font-medium">For third-party hardware integration and custom firmware.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] group-hover:bg-amber-500/20 transition-colors pointer-events-none" />
                  <div className="p-8 border-b border-white/5 bg-black/20">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-xl"><Zap className="w-6 h-6 text-amber-400" /></div> 
                      Hardware Beacons (Simulated)
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Configure BLE (Bluetooth Low Energy) node behaviors for this mesh.</p>
                  </div>
                  <div className="p-8 space-y-4 relative z-10">
                    <div className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                      <div>
                        <div className="font-bold text-white text-lg">Continuous Location Polling</div>
                        <div className="text-sm text-slate-400 mt-1">Enables high-frequency GIS updates (consumes more battery on mobile nodes).</div>
                      </div>
                      <div className="w-14 h-7 bg-emerald-500 rounded-full relative cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                      <div>
                        <div className="font-bold text-white text-lg">Hardware Panic Button Binding</div>
                        <div className="text-sm text-slate-400 mt-1">Allow physical BLE keychain triggers to emit distress signals.</div>
                      </div>
                      <div className="w-14 h-7 bg-emerald-500 rounded-full relative cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Threat Queue Triage (Active Panic Alert Overlays) */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-[9999] pointer-events-none">
        <AnimatePresence>
          {panics.map(p => (
            <motion.div 
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              key={p.id} 
              className="bg-slate-900/90 backdrop-blur-xl border border-red-500/50 p-5 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.4)] flex items-center gap-5 pointer-events-auto border-l-4 border-l-red-500 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none" />
              <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/40 shadow-inner">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-[pulse_0.5s_infinite]" />
              </div>
              <div className="min-w-[200px] relative z-10">
                <div className="flex items-center gap-2 text-xs font-black text-red-400 mb-1 tracking-widest uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_red]" />
                  EXTREME ALERT
                </div>
                <h4 className="font-black text-white text-2xl uppercase tracking-tight">{p.name}</h4>
                <p className="text-slate-300 font-mono text-sm mt-1 bg-black/30 inline-block px-2 py-1 rounded border border-white/5">{p.phone} • {new Date(p.created_at).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => resolvePanic(p.id)}
                className="ml-6 px-6 py-4 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-black rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.7)] whitespace-nowrap active:scale-95 border border-red-400 relative z-10"
              >
                RESOLVE
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
