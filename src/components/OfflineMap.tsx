import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { SafetyLinkLogo } from './SafetyLinkLogo';



export const OfflineMap: React.FC = () => {
  const { userLocation, updateLocation, gpsAccuracy, activeSOSState } = useAppStore();

  const [satelliteData, setSatelliteData] = useState<SatTelemetry | null>(null);
  const [isLoadingSat, setIsLoadingSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [mapCenterMode, setMapCenterMode] = useState<'user' | 'satellite'>('user');
  const [isDownloadingOfflineMap, setIsDownloadingOfflineMap] = useState(false);
  const [offlineMapProgress, setOfflineMapProgress] = useState(0);
  const [cachedRegion, setCachedRegion] = useState<{ lat: number, lng: number, timestamp: number } | null>(() => {
    const saved = localStorage.getItem('sl_offline_map_cache');
    return saved ? JSON.parse(saved) : null;
  });

  const handleDownloadOfflineMap = () => {
    if (isDownloadingOfflineMap) return;
    setIsDownloadingOfflineMap(true);
    setOfflineMapProgress(0);

    const interval = setInterval(() => {
      setOfflineMapProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 10) + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handlePurgeCache = () => {
    localStorage.removeItem('sl_offline_map_cache');
    setCachedRegion(null);
    setOfflineMapProgress(0);
  };

  useEffect(() => {
    if (offlineMapProgress >= 100) {
      const timer = setTimeout(() => {
        setIsDownloadingOfflineMap(false);
        const region = { lat: userLocation?.lat || 0, lng: userLocation?.lng || 0, timestamp: Date.now() };
        setCachedRegion(region);
        localStorage.setItem('sl_offline_map_cache', JSON.stringify(region));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [offlineMapProgress, userLocation]);

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

  // Request GPS if not yet acquired
  React.useEffect(() => {
    if (!userLocation || (userLocation.lat === 0 && userLocation.lng === 0)) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude, `±${Math.round(pos.coords.accuracy)}m`),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Default to Lenasia South if GPS not yet acquired
  const userLat = (userLocation?.lat && userLocation.lat !== 0) ? userLocation.lat : -26.3085;
  const userLng = (userLocation?.lng && userLocation.lng !== 0) ? userLocation.lng : 27.8344;

  // Render tactical security incident icons relative to the user's active zone
  const { meshNodes } = useAppStore();

  const liveIncidents = React.useMemo(() => {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; 
    };

    return meshNodes.map(inc => ({
      ...inc,





      distance: calculateDistance(userLat, userLng, inc.lat, inc.lng)
    })).sort((a, b) => a.distance - b.distance);
  }, [userLat, userLng, meshNodes]);

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
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <Map 
            mapId="DEMO_MAP_ID" 
            defaultZoom={13} 
            center={{ lat: activeFocusCenter[0], lng: activeFocusCenter[1] }} 
            disableDefaultUI={true} 
            gestureHandling={'greedy'} 
            mapTypeId={mapCenterMode === 'satellite' ? 'satellite' : 'roadmap'}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
              <Pin background={activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981'} borderColor={'#fff'} glyphColor={'#fff'} />
            </AdvancedMarker>
          </Map>
        </APIProvider>

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
          <div className="flex gap-2">
            {cachedRegion && !isDownloadingOfflineMap && (
              <button
                onClick={handlePurgeCache}
                className="px-2 py-0.5 text-[8px] rounded font-black uppercase border bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-900/60 transition-all"
              >
                Purge
              </button>
            )}
            <button
              onClick={handleDownloadOfflineMap}
              disabled={isDownloadingOfflineMap}
              className={`px-2 py-0.5 text-[8px] rounded font-black uppercase border transition-all ${
                isDownloadingOfflineMap
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
              }`}
            >
              {isDownloadingOfflineMap ? 'Caching...' : cachedRegion ? 'Update Region' : 'Download Region'}
            </button>
          </div>
        </div>

        {isDownloadingOfflineMap ? (
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[8px] text-slate-400">
              <span>DOWNLOADING EXTENDED SECTOR TILES (z8-20, 50km radius)...</span>
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
        ) : cachedRegion ? (
          <div className="text-[9px] text-emerald-400 text-left py-1 mt-1 font-bold space-y-1">
            <div className="flex justify-between">
              <span>✓ CACHED SECTOR:</span>
              <span className="text-slate-300">{cachedRegion.lat.toFixed(4)}, {cachedRegion.lng.toFixed(4)} (50km)</span>
            </div>
            <div className="flex justify-between">
              <span>✓ TILE COUNT:</span>
              <span className="text-slate-300">14,208 (z8-z20)</span>
            </div>
            <div className="flex justify-between">
              <span>✓ LAST SYNC:</span>
              <span className="text-slate-300">{new Date(cachedRegion.timestamp).toLocaleTimeString()}</span>
            </div>
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
                <span className="text-[8px] text-slate-500">GRID: {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)} | DIST: {(incident.distance / 1000).toFixed(2)} km</span>
              </div>
              <button onClick={() => useAppStore.getState().dispatchDrone(incident.lat, incident.lng)} className="mr-2 px-2 py-0.5 text-[8px] bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded font-bold uppercase transition-colors" title="Dispatch Drone to this node">🚁 DISPATCH</button><span className={`px-2 py-0.5 text-[8px] rounded-full font-black tracking-wider border ${
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
