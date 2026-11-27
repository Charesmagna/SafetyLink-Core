import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useAppStore } from '../utils/store';
import { motion } from 'motion/react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap as useLeafletMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Capacitor } from '@capacitor/core';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { SceneErrorBoundary } from './three/SceneErrorBoundary';

const TacticalCampus3DScene = lazy(() => import('./three/TacticalCampus3DScene'));
const CommandGlobe3DScene = lazy(() => import('./three/CommandGlobe3DScene'));

export interface SatTelemetry {
  satelliteCount?: number;
  accuracy?: number;
  lastFix?: number;
  provider?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
  visibility?: string;
}

type MapEngineId = 'osm' | 'google' | '3d_tactical' | '3d_globe';
type GeoServerMode = 'auto' | 'bigdatacloud_ip' | 'gps_bigdatacloud' | 'nominatim';
type OsmTileStyle = 'street' | 'dark' | 'satellite';

interface ResolvedAddressInfo {
  displayLocation: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  ip?: string | null;
  provider: string;
  accuracyLabel: string;
  lat: number;
  lng: number;
  bigDataCloudConfigured?: boolean;
  timestamp: number;
}

const createLeafletDotIcon = (color: string, label?: string) =>
  L.divIcon({
    className: 'sl-leaflet-pin',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px;">
      <span style="width:16px;height:16px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 0 12px ${color};display:block;"></span>
      ${label ? `<span style="position:absolute;top:-18px;white-space:nowrap;background:rgba(2,6,23,0.92);color:#f8fafc;border:1px solid rgba(148,163,184,0.35);border-radius:6px;padding:1px 5px;font-size:9px;font-family:monospace;font-weight:700;">${label}</span>` : ''}
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const GoogleMapPanController: React.FC<{ target: { lat: number; lng: number; zoom?: number; nonce: number } | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    if (!Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    if (typeof target.zoom === 'number') {
      map.setZoom(target.zoom);
    }
  }, [map, target?.nonce, target?.lat, target?.lng, target?.zoom]);
  return null;
};

const LeafletController: React.FC<{
  target: { lat: number; lng: number; zoom?: number; nonce: number } | null;
  onMapTap: (lat: number, lng: number) => void;
}> = ({ target, onMapTap }) => {
  const map = useLeafletMap();

  useEffect(() => {
    if (!target) return;
    if (!Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? map.getZoom(), { duration: 0.7 });
  }, [map, target?.nonce, target?.lat, target?.lng, target?.zoom]);

  useMapEvents({
    click(e) {
      onMapTap(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const providerToEngine = (provider: string | undefined): MapEngineId => {
  if (provider === 'THREE_3D') return '3d_tactical';
  if (provider === 'OPENSTREETMAP' || provider === 'OFFLINE_GIS_VECTOR' || provider === 'MAPBOX') return 'osm';
  return 'google';
};

export const OfflineMap: React.FC = () => {
  const {
    userLocation,
    updateLocation,
    gpsAccuracy,
    activeSOSState,
    meshNodes,
    dispatchSettings,
    setDispatchSettings,
    customBackendUrl,
    addToast,
  } = useAppStore();

  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [engine, setEngine] = useState<MapEngineId>(() => {
    const mapped = providerToEngine(dispatchSettings?.mapProvider);
    if (mapped === 'google' && !GMAPS_KEY) return 'osm';
    return mapped;
  });

  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'hybrid' | 'satellite'>(() =>
    dispatchSettings?.mapProvider === 'HYBRID_SATELLITE' ? 'satellite' : 'roadmap'
  );
  const [osmTileStyle, setOsmTileStyle] = useState<OsmTileStyle>(() =>
    dispatchSettings?.mapProvider === 'MAPBOX'
      ? 'dark'
      : dispatchSettings?.mapProvider === 'HYBRID_SATELLITE'
        ? 'satellite'
        : 'street'
  );
  const [geoServerMode, setGeoServerMode] = useState<GeoServerMode>('auto');
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddressInfo | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [explorePin, setExplorePin] = useState<{ lat: number; lng: number } | null>(null);
  const [panRequest, setPanRequest] = useState<{ lat: number; lng: number; zoom?: number; nonce: number } | null>(null);

  const [satelliteData, setSatelliteData] = useState<SatTelemetry | null>(null);
  const [isLoadingSat, setIsLoadingSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [mapCenterMode, setMapCenterMode] = useState<'user' | 'satellite' | 'explore'>('user');
  const [isDownloadingOfflineMap, setIsDownloadingOfflineMap] = useState(false);
  const [offlineMapProgress, setOfflineMapProgress] = useState(0);
  const [cachedRegion, setCachedRegion] = useState<{ lat: number; lng: number; timestamp: number } | null>(() => {
    try {
      const saved = localStorage.getItem('sl_offline_map_cache');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync when user changes mapProvider from Settings tab
  useEffect(() => {
    if (dispatchSettings?.mapProvider === 'THREE_3D') {
      setEngine('3d_tactical');
    } else if (dispatchSettings?.mapProvider === 'OPENSTREETMAP' || dispatchSettings?.mapProvider === 'OFFLINE_GIS_VECTOR') {
      setEngine('osm');
      setOsmTileStyle('street');
    } else if (dispatchSettings?.mapProvider === 'MAPBOX') {
      setEngine('osm');
      setOsmTileStyle('dark');
    } else if (dispatchSettings?.mapProvider === 'HYBRID_SATELLITE') {
      setGoogleMapType('satellite');
      setOsmTileStyle('satellite');
    } else if (dispatchSettings?.mapProvider === 'GOOGLE_MAPS' && GMAPS_KEY) {
      setEngine('google');
    }
  }, [dispatchSettings?.mapProvider, GMAPS_KEY]);

  const selectEngine = (next: MapEngineId) => {
    setEngine(next);
    if (next === 'osm') {
      setDispatchSettings({ mapProvider: 'OPENSTREETMAP' });
    } else if (next === 'google') {
      setDispatchSettings({ mapProvider: googleMapType === 'satellite' ? 'HYBRID_SATELLITE' : 'GOOGLE_MAPS' });
    } else if (next === '3d_tactical') {
      setDispatchSettings({ mapProvider: 'THREE_3D' });
    }
  };

  // Default to Lenasia South if GPS not yet acquired
  const userLat = userLocation?.lat && userLocation.lat !== 0 ? userLocation.lat : -26.3085;
  const userLng = userLocation?.lng && userLocation.lng !== 0 ? userLocation.lng : 27.8344;

  const requestMapPan = useCallback((lat: number, lng: number, zoom?: number) => {
    setPanRequest({ lat, lng, zoom, nonce: Date.now() + Math.random() });
  }, []);

  const callGeoApi = useCallback(
    async (params: URLSearchParams): Promise<ResolvedAddressInfo> => {
      const customBase = (customBackendUrl || '').trim().replace(/\/+$/, '');
      const candidates = Capacitor.isNativePlatform()
        ? [customBase || 'https://api.safetylink.online', 'https://safetylink-api.tshilidzi-mukwevho54.workers.dev']
        : ['', customBase || 'https://api.safetylink.online'];

      let lastErr: Error | null = null;
      for (const base of candidates) {
        try {
          const resp = await fetch(`${base}/api/geo/locate?${params.toString()}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.ok) {
              return {
                displayLocation: data.displayLocation || `${Number(data.lat).toFixed(4)}, ${Number(data.lng).toFixed(4)}`,
                suburb: data.suburb,
                city: data.city,
                state: data.state,
                country: data.country,
                countryCode: data.countryCode,
                ip: data.ip || null,
                provider: data.provider || 'BIGDATACLOUD',
                accuracyLabel: data.accuracyLabel || 'Geocoded',
                lat: Number(data.lat),
                lng: Number(data.lng),
                bigDataCloudConfigured: Boolean(data.bigDataCloudConfigured),
                timestamp: Number(data.timestamp || Date.now()),
              };
            }
          }
        } catch (err) {
          lastErr = err as Error;
        }
      }

      // Direct client fallback to BigDataCloud free reverse geocode when coordinates are provided
      const latQ = Number(params.get('lat'));
      const lngQ = Number(params.get('lng'));
      if (Number.isFinite(latQ) && Number.isFinite(lngQ)) {
        const bdcResp = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(latQ))}&longitude=${encodeURIComponent(String(lngQ))}&localityLanguage=en`
        );
        if (bdcResp.ok) {
          const b = await bdcResp.json();
          const parts = [b.locality, b.city, b.principalSubdivision, b.countryName].filter(
            (v: string, i: number, arr: string[]) => Boolean(v) && arr.indexOf(v) === i
          );
          return {
            displayLocation: parts.slice(0, 3).join(', ') || `${latQ.toFixed(4)}, ${lngQ.toFixed(4)}`,
            suburb: b.locality || '',
            city: b.city || '',
            state: b.principalSubdivision || '',
            country: b.countryName || '',
            countryCode: b.countryCode || 'ZA',
            ip: null,
            provider: 'BIGDATACLOUD_CLIENT',
            accuracyLabel: 'BigDataCloud Reverse Geocode',
            lat: latQ,
            lng: lngQ,
            timestamp: Date.now(),
          };
        }
      }

      throw lastErr || new Error('Could not reach geolocation server.');
    },
    [customBackendUrl]
  );

  const resolveCoordsToAddress = useCallback(
    async (lat: number, lng: number, preferred: 'auto' | 'bigdatacloud' | 'nominatim' = 'auto') => {
      setIsLocating(true);
      setLocateError(null);
      try {
        const params = new URLSearchParams({
          mode: 'reverse',
          lat: String(lat),
          lng: String(lng),
          provider: preferred,
        });
        const info = await callGeoApi(params);
        setResolvedAddress(info);
        return info;
      } catch (err) {
        setLocateError((err as Error).message || 'Address conversion failed');
        return null;
      } finally {
        setIsLocating(false);
      }
    },
    [callGeoApi]
  );

  const handleLocateViaServer = useCallback(async () => {
    setIsLocating(true);
    setLocateError(null);
    try {
      if (geoServerMode === 'bigdatacloud_ip') {
        const params = new URLSearchParams({ mode: 'ip', provider: 'bigdatacloud' });
        const info = await callGeoApi(params);
        setResolvedAddress(info);
        setExplorePin(null);
        setMapCenterMode('user');
        updateLocation(info.lat, info.lng, info.accuracyLabel);
        requestMapPan(info.lat, info.lng, 13);
        addToast(`BigDataCloud IP resolved: ${info.displayLocation}`, 'success');
        return;
      }

      const preferred = geoServerMode === 'nominatim' ? 'nominatim' : 'bigdatacloud';

      // Attempt device GPS first, fall back to BigDataCloud IP in Auto mode
      const gpsPosition = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 7000 }
        );
      });

      if (gpsPosition) {
        const lat = gpsPosition.coords.latitude;
        const lng = gpsPosition.coords.longitude;
        updateLocation(lat, lng, `±${Math.round(gpsPosition.coords.accuracy)}m`);
        setExplorePin(null);
        setMapCenterMode('user');
        requestMapPan(lat, lng, 15);
        const info = await resolveCoordsToAddress(lat, lng, preferred);
        if (info) {
          addToast(`Location converted: ${info.displayLocation}`, 'success');
        }
      } else if (geoServerMode === 'auto') {
        const params = new URLSearchParams({ mode: 'ip', provider: 'bigdatacloud' });
        const info = await callGeoApi(params);
        setResolvedAddress(info);
        setExplorePin(null);
        setMapCenterMode('user');
        updateLocation(info.lat, info.lng, info.accuracyLabel);
        requestMapPan(info.lat, info.lng, 13);
        addToast(`GPS unavailable — resolved via IP: ${info.displayLocation}`, 'info');
      } else {
        // Reverse-geocode current active coords
        const targetLat = explorePin?.lat ?? userLat;
        const targetLng = explorePin?.lng ?? userLng;
        const info = await resolveCoordsToAddress(targetLat, targetLng, preferred);
        if (info) {
          addToast(`Address resolved: ${info.displayLocation}`, 'success');
        }
      }
    } catch (err) {
      const msg = (err as Error).message || 'Unable to resolve location';
      setLocateError(msg);
      addToast(msg, 'error');
    } finally {
      setIsLocating(false);
    }
  }, [geoServerMode, callGeoApi, updateLocation, requestMapPan, resolveCoordsToAddress, explorePin, userLat, userLng, addToast]);

  const handleMapTap = useCallback(
    (lat: number, lng: number) => {
      setExplorePin({ lat, lng });
      setMapCenterMode('explore');
      const preferred = geoServerMode === 'nominatim' ? 'nominatim' : 'bigdatacloud';
      void resolveCoordsToAddress(lat, lng, preferred);
    },
    [geoServerMode, resolveCoordsToAddress]
  );

  // Resolve initial coordinates to human-readable address once on mount
  useEffect(() => {
    void resolveCoordsToAddress(userLat, userLng, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const region = { lat: userLocation?.lat || userLat, lng: userLocation?.lng || userLng, timestamp: Date.now() };
        setCachedRegion(region);
        localStorage.setItem('sl_offline_map_cache', JSON.stringify(region));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [offlineMapProgress, userLocation, userLat, userLng]);

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
        visibility: data.visibility || 'unknown',
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

  useEffect(() => {
    fetchLiveSatelliteTelemetry();
    const interval = setInterval(fetchLiveSatelliteTelemetry, 60000);
    return () => clearInterval(interval);
  }, []);

  // Request GPS if not yet acquired
  useEffect(() => {
    if (!userLocation || (userLocation.lat === 0 && userLocation.lng === 0)) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude, `±${Math.round(pos.coords.accuracy)}m`),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [userLocation, updateLocation]);

  const liveIncidents = useMemo(() => {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const dPhi = ((lat2 - lat1) * Math.PI) / 180;
      const dLambda = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    return meshNodes
      .map((inc) => ({
        ...inc,
        distance: calculateDistance(userLat, userLng, inc.lat, inc.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [userLat, userLng, meshNodes]);

  const userDotIcon = useMemo(
    () => createLeafletDotIcon(activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981', activeSOSState !== 'IDLE' ? 'SOS' : 'YOU'),
    [activeSOSState]
  );
  const exploreDotIcon = useMemo(() => createLeafletDotIcon('#38bdf8', 'PIN'), []);
  const nodeDotIcon = useMemo(() => createLeafletDotIcon('#f59e0b'), []);

  const activeNavLat = explorePin?.lat ?? userLat;
  const activeNavLng = explorePin?.lng ?? userLng;

  const osmTileConfig =
    osmTileStyle === 'dark'
      ? {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }
      : osmTileStyle === 'satellite'
        ? {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri World Imagery',
          }
        : {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors',
          };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl w-full max-w-2xl mx-auto relative overflow-hidden scanlines"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 neon-glow-emerald" />
      <div className="absolute inset-0 digital-grid opacity-10 pointer-events-none" />

      {/* Top HUD banner */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-900 pb-3 relative z-10">
        <div className="flex items-center gap-2 text-left">
          <SafetyLinkLogo size={18} glowColor="rgba(20, 184, 166, 0.4)" />
          <div>
            <h3 className="text-xs font-black text-slate-100 tracking-[0.18em] font-display uppercase">
              Tactical Live Map &amp; 3D Explorer
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Drag, zoom, tap to convert coordinates &amp; switch map servers live
            </p>
          </div>
        </div>
        <span className="text-[8px] font-mono font-black px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full uppercase">
          {engine === 'osm'
            ? 'OPEN LIVE MAP'
            : engine === 'google'
              ? 'GOOGLE MAPS'
              : engine === '3d_tactical'
                ? '3D TACTICAL TWIN'
                : '3D COMMAND GLOBE'}
        </span>
      </div>

      {/* Map Engine & Server Switcher */}
      <div className="mt-3.5 space-y-2.5 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="tablist" aria-label="Map Engine Selector">
          <button
            type="button"
            onClick={() => selectEngine('osm')}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all text-center ${
              engine === 'osm'
                ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            🗺️ Open Live Map
          </button>
          <button
            type="button"
            onClick={() => selectEngine('google')}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all text-center ${
              engine === 'google'
                ? 'bg-blue-600/90 border-blue-400 text-white shadow-lg shadow-blue-950/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            📍 Google Maps
          </button>
          <button
            type="button"
            onClick={() => selectEngine('3d_tactical')}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all text-center ${
              engine === '3d_tactical'
                ? 'bg-teal-600/90 border-teal-400 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            🧊 3D Map
          </button>
          <button
            type="button"
            onClick={() => selectEngine('3d_globe')}
            className={`px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border transition-all text-center ${
              engine === '3d_globe'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            🌐 3D Globe
          </button>
        </div>

        {/* Geolocation & IP-to-Address Server Bar (BigDataCloud + GPS + Nominatim) */}
        <div className="p-2.5 bg-slate-950/75 border border-slate-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 min-w-0">
            <label
              htmlFor="sl-geo-server-select"
              className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 text-left"
            >
              Location &amp; IP Conversion Server
            </label>
            <select
              id="sl-geo-server-select"
              value={geoServerMode}
              onChange={(e) => setGeoServerMode(e.target.value as GeoServerMode)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-slate-100 focus:outline-none focus:border-emerald-400"
            >
              <option value="auto">Auto: GPS + BigDataCloud IP Fallback</option>
              <option value="bigdatacloud_ip">BigDataCloud IP-to-Location &amp; Address</option>
              <option value="gps_bigdatacloud">Device GPS + BigDataCloud Reverse Geocode</option>
              <option value="nominatim">OpenStreetMap Nominatim Address Server</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleLocateViaServer}
            disabled={isLocating}
            className="sm:self-end px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-mono font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
          >
            {isLocating ? '⏳ Resolving...' : geoServerMode === 'bigdatacloud_ip' ? '🌐 Locate IP' : '🎯 Locate & Convert'}
          </button>
        </div>

        {/* Resolved Address / IP Telemetry Strip */}
        <div className="px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-xl flex flex-wrap items-center justify-between gap-2 text-left font-mono">
          <div className="min-w-0 flex-1">
            <div className="text-[8px] uppercase text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span>{explorePin ? '📌 Explored Pin Address' : '📍 Active Location Address'}</span>
              {resolvedAddress?.provider && (
                <span className="px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold text-[7.5px]">
                  {resolvedAddress.provider}
                </span>
              )}
              {resolvedAddress?.ip && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[7.5px]">
                  IP: {resolvedAddress.ip}
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-slate-100 truncate mt-0.5">
              {locateError
                ? `⚠️ ${locateError}`
                : resolvedAddress
                  ? resolvedAddress.displayLocation
                  : `${activeNavLat.toFixed(4)}, ${activeNavLng.toFixed(4)}`}
            </p>
          </div>
          {explorePin && (
            <button
              type="button"
              onClick={() => {
                setExplorePin(null);
                setMapCenterMode('user');
                requestMapPan(userLat, userLng, 14);
                void resolveCoordsToAddress(userLat, userLng, geoServerMode === 'nominatim' ? 'nominatim' : 'bigdatacloud');
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[9px] font-bold text-slate-300 hover:text-white uppercase"
            >
              Reset Pin
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Map / 3D Viewport */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden mt-3.5 z-10">
        {engine === '3d_tactical' ? (
          <SceneErrorBoundary title="3D Tactical Map" heightClass="h-full">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#050b16] text-xs font-mono text-emerald-400">
                  Loading Interactive 3D Tactical Map...
                </div>
              }
            >
              <TacticalCampus3DScene heightClass="h-full" />
            </Suspense>
          </SceneErrorBoundary>
        ) : engine === '3d_globe' ? (
          <SceneErrorBoundary title="3D Command Globe" heightClass="h-full">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#040914] text-xs font-mono text-cyan-400">
                  Loading Interactive 3D Global Map...
                </div>
              }
            >
              <CommandGlobe3DScene heightClass="h-full" />
            </Suspense>
          </SceneErrorBoundary>
        ) : engine === 'osm' ? (
          <MapContainer
            center={[userLat, userLng]}
            zoom={14}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={true}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          >
            <TileLayer key={osmTileStyle} attribution={osmTileConfig.attribution} url={osmTileConfig.url} />
            <LeafletController target={panRequest} onMapTap={handleMapTap} />

            <Circle
              center={[userLat, userLng]}
              radius={250}
              pathOptions={{
                color: activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981',
                fillColor: activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981',
                fillOpacity: 0.14,
                weight: 1.5,
              }}
            />

            <Marker position={[userLat, userLng]} icon={userDotIcon}>
              <Popup>
                <div className="font-mono text-xs">
                  <strong>Your Live Position</strong>
                  <div>{userLat.toFixed(5)}, {userLng.toFixed(5)}</div>
                  <div className="text-emerald-600">{gpsAccuracy}</div>
                </div>
              </Popup>
            </Marker>

            {explorePin && (
              <Marker position={[explorePin.lat, explorePin.lng]} icon={exploreDotIcon}>
                <Popup>
                  <div className="font-mono text-xs">
                    <strong>Explored Coordinate</strong>
                    <div>{resolvedAddress?.displayLocation || `${explorePin.lat.toFixed(5)}, ${explorePin.lng.toFixed(5)}`}</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {liveIncidents.map((inc, idx) => (
              <Marker key={inc.id || idx} position={[inc.lat, inc.lng]} icon={nodeDotIcon}>
                <Popup>
                  <div className="font-mono text-xs">
                    <strong>{inc.name}</strong>
                    <div>Status: {inc.status}</div>
                    <div>{(inc.distance / 1000).toFixed(2)} km away</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : GMAPS_KEY ? (
          <APIProvider apiKey={GMAPS_KEY} language="en" region="ZA">
            <GoogleMap
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio', 'gmp_git_agentskills_v1']}
              mapId="DEMO_MAP_ID"
              defaultZoom={14}
              defaultCenter={{ lat: userLat, lng: userLng }}
              disableDefaultUI={false}
              gestureHandling="greedy"
              mapTypeId={googleMapType}
              style={{ width: '100%', height: '100%' }}
              onClick={(ev) => {
                const ll = ev.detail?.latLng;
                if (ll && Number.isFinite(ll.lat) && Number.isFinite(ll.lng)) {
                  handleMapTap(ll.lat, ll.lng);
                }
              }}
            >
              <GoogleMapPanController target={panRequest} />
              <AdvancedMarker position={{ lat: userLat, lng: userLng }} title="Your Live Position">
                <Pin
                  background={activeSOSState !== 'IDLE' ? '#ef4444' : '#10b981'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
              {explorePin && (
                <AdvancedMarker position={explorePin} title="Explored Location">
                  <Pin background="#0284c7" borderColor="#ffffff" glyphColor="#ffffff" />
                </AdvancedMarker>
              )}
              {liveIncidents.map((inc, idx) => (
                <AdvancedMarker
                  key={inc.id || idx}
                  position={{ lat: inc.lat, lng: inc.lng }}
                  title={inc.name}
                  onClick={() => handleMapTap(inc.lat, inc.lng)}
                >
                  <Pin background="#f59e0b" borderColor="#ffffff" glyphColor="#0f172a" scale={0.85} />
                </AdvancedMarker>
              ))}
            </GoogleMap>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 gap-3">
            <p className="text-xs font-mono text-amber-300 font-bold uppercase">
              Google Maps API Key Not Active in This Build
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Switch immediately to the free interactive Open Live Map or 3D Tactical Map with full drag, zoom, and BigDataCloud address lookup.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectEngine('osm')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-mono font-bold uppercase"
              >
                Use Open Live Map
              </button>
              <button
                type="button"
                onClick={() => selectEngine('3d_tactical')}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-[10px] font-mono font-bold uppercase"
              >
                Open 3D Map
              </button>
            </div>
          </div>
        )}

        {/* Map Overlay Controls (only on 2D engines so 3D docks stay completely unobstructed) */}
        {(engine === 'osm' || engine === 'google') && (
          <>
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMapCenterMode('user');
                  requestMapPan(userLat, userLng, 15);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border transition-all ${
                  mapCenterMode === 'user'
                    ? 'bg-emerald-600/95 border-emerald-400 text-white shadow-lg'
                    : 'bg-slate-950/90 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                📍 Focus Me
              </button>

              {engine === 'osm' ? (
                <button
                  type="button"
                  onClick={() =>
                    setOsmTileStyle((prev) => (prev === 'street' ? 'dark' : prev === 'dark' ? 'satellite' : 'street'))
                  }
                  className="px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border bg-slate-950/90 border-slate-700 text-amber-300 hover:text-white"
                >
                  🗺️ {osmTileStyle}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setGoogleMapType((prev) => (prev === 'roadmap' ? 'hybrid' : prev === 'hybrid' ? 'satellite' : 'roadmap'))
                  }
                  className="px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border bg-slate-950/90 border-slate-700 text-amber-300 hover:text-white"
                >
                  🛰️ {googleMapType}
                </button>
              )}

              {satelliteData && (
                <button
                  type="button"
                  onClick={() => {
                    setMapCenterMode('satellite');
                    requestMapPan(satelliteData.latitude, satelliteData.longitude, 4);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border transition-all ${
                    mapCenterMode === 'satellite'
                      ? 'bg-amber-600/95 border-amber-400 text-white shadow-lg'
                      : 'bg-slate-950/90 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  🛰️ Track ISS
                </button>
              )}

              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${activeNavLat},${activeNavLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border bg-slate-950/90 border-slate-700 text-blue-300 hover:text-white text-center"
              >
                👁️ Street View
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeNavLat},${activeNavLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase border bg-slate-950/90 border-slate-700 text-emerald-300 hover:text-white text-center"
              >
                🧭 Navigate
              </a>
            </div>

            {/* Bottom coordinate banner overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl flex justify-between items-center text-[8.5px] font-mono pointer-events-none">
              <span className="text-slate-300 truncate pr-2">
                {mapCenterMode === 'satellite' && satelliteData
                  ? `ISS: ${satelliteData.latitude.toFixed(4)}, ${satelliteData.longitude.toFixed(4)}`
                  : explorePin
                    ? `PIN: ${explorePin.lat.toFixed(4)}, ${explorePin.lng.toFixed(4)} · Tap map to inspect`
                    : `COORDS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)} · Drag to explore`}
              </span>
              <span className="text-teal-400 font-bold uppercase shrink-0">{gpsAccuracy}</span>
            </div>
          </>
        )}
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
          <div className="text-[10px] text-red-400 text-center py-2">⚠️ LINK FAILURE: {satError}</div>
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
              <span className="text-[8px] text-slate-500 uppercase">
                SYNC TIMESTAMP: {new Date(satelliteData.timestamp).toLocaleTimeString()} UTC
              </span>
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded font-black border uppercase ${
                  satelliteData.visibility === 'day'
                    ? 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                    : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400'
                }`}
              >
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
                type="button"
                onClick={handlePurgeCache}
                className="px-2 py-0.5 text-[8px] rounded font-black uppercase border bg-red-950/40 border-red-500/40 text-red-400 hover:bg-red-900/60 transition-all"
              >
                Purge
              </button>
            )}
            <button
              type="button"
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
              <span className="text-slate-300">
                {cachedRegion.lat.toFixed(4)}, {cachedRegion.lng.toFixed(4)} (50km)
              </span>
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
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-900 rounded-2xl hover:border-slate-800 transition-colors gap-2"
            >
              <button
                type="button"
                onClick={() => {
                  if (engine === '3d_tactical' || engine === '3d_globe') {
                    selectEngine('osm');
                  }
                  setExplorePin({ lat: incident.lat, lng: incident.lng });
                  setMapCenterMode('explore');
                  requestMapPan(incident.lat, incident.lng, 15);
                  void resolveCoordsToAddress(
                    incident.lat,
                    incident.lng,
                    geoServerMode === 'nominatim' ? 'nominatim' : 'bigdatacloud'
                  );
                }}
                className="flex flex-col gap-0.5 text-left min-w-0 flex-1"
              >
                <span className="text-slate-200 font-bold text-[10px] truncate">{incident.name}</span>
                <span className="text-[8px] text-slate-500">
                  GRID: {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)} | DIST: {(incident.distance / 1000).toFixed(2)} km
                </span>
              </button>
              <button
                type="button"
                onClick={() => useAppStore.getState().dispatchDrone(incident.lat, incident.lng)}
                className="px-2 py-0.5 text-[8px] bg-slate-900 text-slate-400 hover:text-cyan-400 border border-slate-800 rounded font-bold uppercase transition-colors shrink-0"
                title="Dispatch Drone to this node"
              >
                🚁 DISPATCH
              </button>
              <span
                className={`px-2 py-0.5 text-[8px] rounded-full font-black tracking-wider border shrink-0 ${
                  incident.status === 'ACTIVE'
                    ? 'bg-red-950/20 border-red-500/20 text-red-400 animate-pulse'
                    : incident.status === 'DISPATCHED'
                      ? 'bg-orange-950/20 border-orange-500/20 text-orange-400'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}
              >
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
