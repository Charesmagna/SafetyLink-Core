import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline } from 'react-leaflet';
import React, { useState, useEffect } from 'react';
import { Network, Cpu, Map as MapIcon, Activity } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// Fix Leaflet marker icons




delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MeshNode {
  id: string;
  name: string;
  status: 'active' | 'intermittent' | 'offline';
  strength: number;
  type: string;
  lat: number;
  lng: number;
}

export const NodeMeshOrchestration: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedNodes, setConnectedNodes] = useState<MeshNode[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  // Johannesburg CBD base coordinates
  const baseLat = -26.2041;
  const baseLng = 28.0473;

  const handleScanMesh = () => {
    setIsScanning(true);
    setTimeout(() => {
      setConnectedNodes([
        { id: 'node-primary', name: 'Primary Sector Relay (Base)', status: 'active', strength: 100, type: 'BaseStation', lat: baseLat, lng: baseLng },
        { id: 'node-02', name: 'Vehicle Node 2', status: 'active', strength: 75, type: 'VehicleRelay', lat: baseLat - 0.002, lng: baseLng + 0.003 },
        { id: 'node-03', name: 'Sector 3 Personnel', status: 'intermittent', strength: 45, type: 'Wearable', lat: baseLat + 0.0015, lng: baseLng - 0.002 },
        { id: 'node-delta', name: 'Delta Forward Beacon', status: 'active', strength: 82, type: 'Repeater', lat: baseLat - 0.0005, lng: baseLng + 0.005 },
        { id: 'node-echo', name: 'Echo Response Unit', status: 'offline', strength: 0, type: 'VehicleRelay', lat: baseLat + 0.003, lng: baseLng + 0.001 },
      ]);
      setIsScanning(false);
    }, 1500);
  };

  const getCustomIcon = (status: string, type: string) => {
    let color = status === 'active' ? '#10b981' : status === 'intermittent' ? '#f59e0b' : '#ef4444';
    return L.divIcon({
      className: 'bg-transparent',
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-black text-slate-200 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          Active Node Mesh Orchestration
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Deploy, orchestrate, and monitor decentralized peer-to-peer mesh networks across local BLE/LoRa hardware nodes.
        </p>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={handleScanMesh}
              disabled={isScanning}
              className={`px-4 py-2 font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition-all ${
                isScanning ? 'bg-emerald-900/50 text-emerald-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isScanning ? 'Scanning Network...' : 'Ping Mesh Network'}
            </button>
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs uppercase tracking-wider rounded-lg border border-slate-700 transition-all">
              Deploy Configuration
            </button>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded ${viewMode === 'map' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MapIcon className="w-4 h-4 inline-block mr-1" /> Map View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded ${viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Activity className="w-4 h-4 inline-block mr-1" /> Status Grid
            </button>
          </div>
        </div>

        {connectedNodes.length === 0 && !isScanning && (
          <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950">
            No active mesh nodes detected. Ping network to discover nearby LoRa/BLE topography.
          </div>
        )}

        {isScanning && (
          <div className="py-16 text-center text-emerald-500 font-mono text-xs border border-dashed border-emerald-900/50 rounded-xl bg-emerald-950/20">
            <div className="animate-pulse flex items-center justify-center gap-2">
              <Network className="w-5 h-5 animate-spin-slow" />
              Triangulating node telemetrics...
            </div>
          </div>
        )}

        {connectedNodes.length > 0 && !isScanning && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {connectedNodes.map((node, i) => (
              <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${node.status === 'offline' ? 'text-red-400' : 'text-blue-400'}`} />
                    <span className={`font-mono text-xs font-bold uppercase ${node.status === 'offline' ? 'text-red-400' : 'text-slate-300'}`}>{node.name}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : node.status === 'intermittent' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Type</span>
                    <span className="text-slate-400">{node.type}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Signal Strength</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${node.status === 'offline' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${node.strength}%` }} />
                      </div>
                      <span className={node.status === 'offline' ? 'text-red-400' : 'text-emerald-400'}>{node.strength}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Coordinates</span>
                    <span className="text-slate-400">{node.lat.toFixed(4)}, {node.lng.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {connectedNodes.length > 0 && !isScanning && viewMode === 'map' && (
          <div className="h-[400px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
            <MapContainer center={[baseLat, baseLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              {/* Draw Mesh Links (Lines from Base to other nodes, or mesh topology) */}
              {connectedNodes.map((node) => {
                if (node.id === 'node-primary') return null; // Skip self
                const baseNode = connectedNodes.find(n => n.id === 'node-primary');
                if (!baseNode) return null;
                
                // If offline, don't draw link, or draw red dashed link
                const isOffline = node.status === 'offline';
                const color = isOffline ? '#ef4444' : '#10b981';
                const dashArray = isOffline ? '5, 10' : node.status === 'intermittent' ? '10, 10' : undefined;

                return (
                  <Polyline 
                    key={`link-${node.id}`} 
                    positions={[[baseNode.lat, baseNode.lng], [node.lat, node.lng]]} 
                    pathOptions={{ color, weight: 2, dashArray, opacity: 0.6 }} 
                  />
                );
              })}

              {/* Draw Nodes */}
              {connectedNodes.map(node => (
                <Marker key={node.id} position={[node.lat, node.lng]} icon={getCustomIcon(node.status, node.type)}>
                  <Popup className="custom-popup">
                    <div className="font-mono text-xs">
                      <strong className="text-slate-800 block mb-1">{node.name}</strong>
                      <div>Type: {node.type}</div>
                      <div>Status: {node.status.toUpperCase()}</div>
                      <div>Signal: {node.strength}%</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Overlay legend */}
            <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/80 p-3 rounded-lg border border-slate-800 backdrop-blur font-mono text-[10px]">
               <div className="font-bold text-slate-300 mb-2 uppercase tracking-wider">Topology Legend</div>
               <div className="space-y-1.5">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-400">Active Node</span></div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-slate-400">Intermittent Link</span></div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-slate-400">Offline Node</span></div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
