import React from 'react';
import { useAppStore } from '../utils/store';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const MotherboardConsole: React.FC = () => {
  const { currentOrg: storeOrg, currentUser, organizations, users, panicEvents, resolvePanic } = useAppStore();
  const currentOrg = storeOrg || (currentUser?.orgCode ? organizations.find(o => o.id === currentUser.orgCode) : null);

  if (!currentOrg) return null;

  const registeredStudents = users.filter(u => u.orgCode === currentOrg.id);
  const orgUserIds = new Set(registeredStudents.map(s => s.username.toLowerCase()));
  
  const activeOrgPanics = panicEvents.filter(p => 
    p.status !== 'RESOLVED' && 
    (p.description.toLowerCase().includes(currentOrg.name.toLowerCase()) || 
     orgUserIds.has(p.description.split(' ').pop()?.toLowerCase() || ''))
  );

  // Default to Johannesburg or center of active panics
  const mapCenter: [number, number] = activeOrgPanics.length > 0 ? [activeOrgPanics[0].lat, activeOrgPanics[0].lng] : [-26.2041, 28.0473];

  return (
    <div className="bg-[#0b101a] border border-slate-800 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col h-[700px]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-black text-slate-200 tracking-widest font-mono">
          <span className="text-blue-500 mr-2">🛡️</span> 
          MOTHERBOARD RESPONSE CONSOLE
        </h2>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] font-bold">
          <a 
            href="/SafetyLink_ControlRoom_Client.zip"
            download="SafetyLink_ControlRoom_Client_Win64.zip"
            className="flex items-center gap-2 bg-blue-900/40 hover:bg-blue-800/60 px-4 py-1.5 rounded-lg border border-blue-500/50 transition-colors text-blue-300"
          >
            <span className="text-sm">⬇️</span>
            <span>DOWNLOAD DESKTOP CLIENT (.ZIP)</span>
          </a>
          <div className="flex items-center gap-2 bg-[#0E1525] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-blue-400">Ocean Blue #0EASE9</span>
          </div>
          <div className="flex items-center gap-2 bg-[#020617] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
            <span className="text-slate-400">Tactical Jet Dark #020617</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: GPS Map (5 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/80">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">GPS Map</h3>
          </div>
          <div className="flex-1 relative bg-slate-950 z-0">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {activeOrgPanics.map(p => (
                <CircleMarker 
                  key={p.id}
                  center={[p.lat, p.lng]} 
                  radius={12}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5 }}
                >
                  <Popup className="font-mono text-xs">
                    <strong className="text-red-600 block">{p.description}</strong>
                    ID: {p.id}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            {/* Map Overlay info box */}
            {activeOrgPanics.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md z-[1000]">
                <h4 className="text-slate-200 text-xs font-bold font-mono uppercase mb-1">
                  Active Vector 
                </h4>
                <p className="text-[10px] text-slate-400 font-mono break-all">
                  Telemetry coords: {activeOrgPanics[0].lat.toFixed(5)}, {activeOrgPanics[0].lng.toFixed(5)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Active Threat Queue (4 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden relative">
            <div className="p-3 border-b border-slate-800 bg-slate-950">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">Active Threat Queue</h3>
            </div>
            
            <div className="flex-1 p-6 relative overflow-y-auto overflow-x-hidden">
              {activeOrgPanics.length > 0 ? (
                <div className="relative w-full max-w-sm mx-auto mt-4">
                  {/* Stacked Cards Effect */}
                  {activeOrgPanics.slice(0, 4).map((p, index) => {
                    // Creating the stacked effect dynamically based on index
                    const isTop = index === 0;
                    return (
                      <div 
                        key={p.id} 
                        className={`absolute w-full bg-gradient-to-br from-red-950 to-[#2c0505] border border-red-500 rounded-xl p-5 shadow-2xl transition-all duration-300 ${
                          isTop ? 'z-40 relative shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'z-30 opacity-80'
                        }`}
                        style={{
                          transform: isTop ? 'none' : `translateY(-${index * 12}px) scale(${1 - index * 0.04})`,
                          top: isTop ? '0' : `${index * -20}px`
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-red-500 animate-pulse text-lg">⚠️</span>
                          <span className="text-white font-black uppercase text-[11px] tracking-widest drop-shadow-md">
                            EXTREME ALERT: RESIDENT PANIC DETECTED
                          </span>
                        </div>
                        <div className="space-y-1 text-left font-mono text-[10px]">
                          <p className="text-slate-300">
                            <span className="text-red-400">Identity:</span> {p.description.split(' by ')[1] || 'Unknown'}
                          </p>
                          <p className="text-slate-300 truncate">
                            <span className="text-red-400">Address:</span> {p.description.split(' by ')[0] || 'Unknown'}
                          </p>
                          <p className="text-slate-300">
                            <span className="text-red-400">Telemetry coords:</span> {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs uppercase tracking-widest">
                  No Active Threats
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 grid grid-cols-2 gap-4">
              <button className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2">
                <span className="text-base">📍</span> [NAVIGATE]
              </button>
              <button 
                onClick={() => activeOrgPanics.length > 0 && resolvePanic(activeOrgPanics[0].id)}
                className={`py-3 font-mono font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg border ${
                  activeOrgPanics.length > 0 
                    ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-slate-800 text-slate-600 border-slate-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-base">✕</span> [CLEAR SCENE]
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: System Status (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950">
            <h3 className="text-xs font-bold text-slate-300 font-mono tracking-widest uppercase">System Status</h3>
          </div>
          
          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
            {/* Data Throughput Section */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-wider">
                  <span>Data Throughput</span>
                  <span>30%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[30%]"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-wider">
                  <span>Data Throughput</span>
                  <span className="text-slate-400">3868 / 1000/s</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[75%]"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-wider">
                  <span>Data Throughput</span>
                  <span className="text-slate-400">5046 / 1500/s</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[45%]"></div>
                </div>
              </div>
            </div>

            {/* Blinking Status */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Blinking Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Blinking Server
                  </div>
                  <span className="text-emerald-500">8</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Blinking
                  </div>
                  <span className="text-emerald-500">6.1</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">System Status</h4>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                  System Status
                </div>
                <span className="text-emerald-500 font-bold">ONLINE</span>
              </div>
            </div>

          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
            <span className="text-[8px] font-mono font-bold text-slate-500 tracking-widest uppercase">
              NASA-GRADE CONCURRENT UDP SERVER
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
