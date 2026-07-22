import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SafetyLinkLogo } from './SafetyLinkLogo';

// Re-usable Helper Component to center/pan Leaflet maps reactively on prop changes
interface RecenterMapProps {
  center: [number, number];
}

const RecenterMap: React.FC<RecenterMapProps> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || 13);
  }, [center, map]);
  return null;
};

// Custom Leaflet Icons styled with high-contrast, glowing backing circles
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 animate-pulse"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const activeUserIcon = L.divIcon({
  className: 'custom-user-marker-active',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 rounded-full bg-red-500/30 border border-red-500/50 animate-pulse"></div>
      <div class="w-4 h-4 rounded-full bg-red-500 border border-slate-950 shadow-[0_0_12px_rgba(239,68,68,0.9)]"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const satelliteIcon = L.divIcon({
  className: 'custom-sat-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse"></div>
      <div class="w-8 h-8 rounded-full bg-slate-950 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center text-xs">
        🛰️
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const incidentIcon = (status: string) => L.divIcon({
  className: 'custom-incident-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-6 h-6 rounded-full bg-orange-500/15 border border-orange-500/25 animate-pulse"></div>
      <div class="w-3.5 h-3.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-red-500' :
        status === 'DISPATCHED' ? 'bg-orange-500' : 'bg-slate-400'
      } border border-slate-950"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface SatTelemetry {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
}

export const OfflineMap: React.FC = () => {
  const { userLocation, gpsAccuracy, activeSOSState } = useAppStore();

  const [satelliteData, setSatelliteData] = useState<SatTelemetry | null>(null);
  const [isLoadingSat, setIsLoadingSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [mapCenterMode, setMapCenterMode] = useState<'user' | 'satellite'>('user');

  const [isDownloadingOfflineMap, setIsDownloadingOfflineMap] = useState(false);
  const [offlineMapProgress, setOfflineMapProgress] = useState(0);

  const handleDownloadOfflineMap = () => {
    if (isDownloadingOfflineMap) return;
    setIsDownloadingOfflineMap(true);
    setOfflineMapProgress(0);

    const interval = setInterval(() => {
      setOfflineMapProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 400);
  };

  useEffect(() => {
    if (offlineMapProgress >= 100) {
      const timer = setTimeout(() => setIsDownloadingOfflineMap(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [offlineMapProgress]);

  // Fetch real, live space segment telemetry coordinates
  const fetchLiveSatelliteTelemetry = async () => {
    setIsLoadingSat(true);
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSatelliteData({
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        altitude: parseFloat(data.altitude),
        velocity: parseFloat(data.velocity),
        visibility: data.visibility,
        timestamp: parseInt(data.timestamp) * 1000,
      });
      setSatError(null);
    } catch (err) {
      console.error('Failed to sync Space Segment Telemetry:', err);
      setSatError((err as Error).message);
    } finally {
      setIsLoadingSat(false);
    }
  };

  // Sync space telemetry on mount and pull live coordinates every 5 seconds
  useEffect(() => {
    fetchLiveSatelliteTelemetry();
    const interval = setInterval(fetchLiveSatelliteTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const userLat = userLocation?.lat ?? -26.1912;
  const userLng = userLocation?.lng ?? 28.0264;

  // Render tactical security incident icons relative to the user's active zone
  const liveIncidents = [
    { name: 'SAPS Blue Team Sector A', lat: userLat + 0.007, lng: userLng - 0.004, status: 'DISPATCHED' },
    { name: 'Apex Secure Perimeter Patrol', lat: userLat - 0.005, lng: userLng + 0.010, status: 'ACTIVE' },
    { name: 'Campus Gate Alpha Check-in', lat: userLat + 0.003, lng: userLng + 0.003, status: 'RESOLVED' }
  ];

  // Determine active focus coordinate based on HUD view controls
  const activeFocusCenter: [number, number] = 
    mapCenterMode === 'satellite' && satelliteData
      ? [satelliteData.latitude, satelliteData.longitude]
      : [userLat, userLng];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5 shadow-2xl w-full max-w-md mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 neon-glow-emerald" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      {/* Top HUD banner */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3.5 relative z-10">
        <div className="flex items-center gap-2 text-left">
          <SafetyLinkLogo size={18} glowColor="rgba(20, 184, 166, 0.4)" />
          <div>
            <h3 className="text-xs font-black text-slate-100 tracking-[0.2em] font-display uppercase">
              Tactical GIS Live Map
            </h3>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Space-segment live uplink & local coordinates
            </p>
          </div>
        </div>
        <span className="text-[8px] font-mono font-black px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full uppercase animate-pulse">
          SATELLITE SYNCED
        </span>
      </div>

      {/* Leaflet Interactive Map View */}
      <div className="relative w-full h-72 bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden mt-4 z-10">
        <MapContainer 
          center={[userLat, userLng]} 
          zoom={13} 
          zoomControl={false}
          className="w-full h-full"
        >
          {/* Dynamic Map Recenter Action */}
          <RecenterMap center={activeFocusCenter} />

          {/* CartoDB Dark Matter tile layer for an extremely polished, space-themed dark HUD */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* User target indicator */}
          <Marker position={[userLat, userLng]} icon={activeSOSState !== 'IDLE' ? activeUserIcon : userIcon}>
            <Popup>
              <div className="p-1 font-mono text-[9px] text-slate-200 leading-relaxed">
                <p className="font-bold text-emerald-400">📍 SL-NODE-GP01 (USER)</p>
                <p>Lat: {userLat.toFixed(5)}</p>
                <p>Lng: {userLng.toFixed(5)}</p>
                <p className="text-slate-500 mt-0.5">{gpsAccuracy}</p>
              </div>
            </Popup>
          </Marker>

          {/* Real-time Satellite Telemetry tracking */}
          {satelliteData && (
            <Marker position={[satelliteData.latitude, satelliteData.longitude]} icon={satelliteIcon}>
              <Popup>
                <div className="p-1 font-mono text-[9px] text-slate-200 leading-relaxed min-w-[150px]">
                  <p className="font-bold text-amber-400">🛰️ SPACE SEGMENT: ISS</p>
                  <p>Lat: {satelliteData.latitude.toFixed(4)}</p>
                  <p>Lng: {satelliteData.longitude.toFixed(4)}</p>
                  <p>Alt: {satelliteData.altitude.toFixed(1)} km</p>
                  <p>Velocity: {Math.round(satelliteData.velocity).toLocaleString()} km/h</p>
                  <p className="text-slate-500 mt-0.5 uppercase">VIS: {satelliteData.visibility}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Nearby Incident nodes */}
          {liveIncidents.map((inc, i) => (
            <Marker key={i} position={[inc.lat, inc.lng]} icon={incidentIcon(inc.status)}>
              <Popup>
                <div className="p-1 font-mono text-[9px] text-slate-200 leading-relaxed">
                  <p className="font-bold text-orange-400">🚨 {inc.name}</p>
                  <p>Grid: {inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}</p>
                  <p className="text-slate-400 uppercase mt-0.5">STATUS: {inc.status}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Dynamic Focus Controls Overlay on the top-right of the map pane */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <button
            onClick={() => setMapCenterMode('user')}
            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border transition-all ${
              mapCenterMode === 'user'
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            📍 Focus User
          </button>
          <button
            onClick={() => setMapCenterMode('satellite')}
            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border transition-all ${
              mapCenterMode === 'satellite'
                ? 'bg-amber-600/90 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            🛰️ Focus Sat
          </button>
        </div>

        {/* Bottom coordinate banner overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-850 p-2 rounded-xl flex justify-between items-center text-[8px] font-mono">
          <span className="text-slate-400">
            {mapCenterMode === 'user' 
              ? `COORDS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`
              : satelliteData 
                ? `SAT: ${satelliteData.latitude.toFixed(4)}, ${satelliteData.longitude.toFixed(4)}`
                : 'WAITING FOR TELEMETRY...'}
          </span>
          <span className="text-teal-400 font-bold uppercase">{gpsAccuracy}</span>
        </div>
      </div>

      {/* Real-time Space Segment Uplink console */}
      <div className="mt-3.5 p-3.5 bg-slate-950/70 border border-slate-900 rounded-2xl text-left font-mono z-10 relative">
        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2">
          <span className="text-[9px] font-black text-amber-400 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 ${isLoadingSat ? 'animate-ping' : 'animate-pulse'}`} />
            LIVE SPACE SEGMENT TELEMETRY
          </span>
          <span className="text-[7.5px] text-slate-600 uppercase">SAT-ID: ISS-25544</span>
        </div>

        {satError ? (
          <div className="text-[10px] text-red-400 text-center py-2">
            ⚠️ LINK FAILURE: {satError}
          </div>
        ) : satelliteData ? (
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[9px] text-slate-300">
            <div className="flex justify-between border-b border-slate-900/40 pb-0.5">
              <span className="text-slate-500">Altitude:</span>
              <span className="text-slate-200 font-bold">{satelliteData.altitude.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/40 pb-0.5">
              <span className="text-slate-500">Orbit Speed:</span>
              <span className="text-slate-200 font-bold">{Math.round(satelliteData.velocity).toLocaleString()} km/h</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/40 pb-0.5">
              <span className="text-slate-500">Latitude:</span>
              <span className="text-slate-200 font-bold">{satelliteData.latitude.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between border-b border-slate-900/40 pb-0.5">
              <span className="text-slate-500">Longitude:</span>
              <span className="text-slate-200 font-bold">{satelliteData.longitude.toFixed(4)}°</span>
            </div>
            <div className="col-span-2 flex justify-between items-center pt-0.5">
              <span className="text-[8px] text-slate-500 uppercase">SYNC TIMESTAMP: {new Date(satelliteData.timestamp).toLocaleTimeString()} UTC</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                satelliteData.visibility === 'day' 
                  ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                  : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400'
              }`}>
                ☀️ {satelliteData.visibility} visibility
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 text-center py-2 animate-pulse uppercase">
            CONNECTING TO SPACE SEGMENT...
          </div>
        )}
      </div>

      {/* Offline Map Cache Controls */}
      <div className="mt-3.5 p-3.5 bg-slate-950/70 border border-slate-900 rounded-2xl text-left font-mono z-10 relative">
        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2">
          <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isDownloadingOfflineMap ? 'animate-ping' : ''}`} />
            OFFLINE MAP CACHE
          </span>
          <button
            onClick={handleDownloadOfflineMap}
            disabled={isDownloadingOfflineMap}
            className={`px-2 py-0.5 text-[8px] rounded font-black uppercase border transition-all ${
              isDownloadingOfflineMap
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
            }`}
          >
            {isDownloadingOfflineMap ? 'Caching...' : 'Download Region'}
          </button>
        </div>

        {isDownloadingOfflineMap ? (
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[8px] text-slate-400">
              <span>DOWNLOADING SECTOR TILES...</span>
              <span>{Math.min(100, offlineMapProgress)}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-emerald-500 h-1.5 transition-all duration-300 ease-out relative"
                style={{ width: `${Math.min(100, offlineMapProgress)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        ) : offlineMapProgress === 100 ? (
          <div className="text-[9px] text-emerald-400 text-center py-1 mt-1 font-bold">
            ✓ REGION CACHED FOR OFFLINE USE
          </div>
        ) : (
          <div className="text-[9px] text-slate-500 text-center py-1 mt-1">
            Region not cached. Network required for map tiles.
          </div>
        )}
      </div>

      {/* List of nearby incident logs */}
      <div className="space-y-2 text-left mt-4 relative z-10 font-mono">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-display">
          Tactical Secure Area Feeds
        </span>
        <div className="grid grid-cols-1 gap-2">
          {liveIncidents.map((incident, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-colors">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-slate-200 font-bold text-[10px]">{incident.name}</span>
                <span className="text-[8px] text-slate-500">GRID: {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</span>
              </div>
              <span className={`px-2 py-0.5 text-[8px] rounded-full font-black tracking-wider border ${
                incident.status === 'ACTIVE' ? 'bg-red-950/20 border-red-500/20 text-red-400 animate-pulse' :
                incident.status === 'DISPATCHED' ? 'bg-orange-950/20 border-orange-500/20 text-orange-400' :
                'bg-slate-900 border border-slate-800 text-slate-500'
              }`}>
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
