import React, { Suspense, lazy, useEffect, useState } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useAppStore } from '../utils/store';
import { SceneErrorBoundary } from './three/SceneErrorBoundary';

const TacticalCampus3DScene = lazy(() => import('./three/TacticalCampus3DScene'));

const ResponderMapPanner: React.FC<{ lat: number; lng: number; focusKey: string }> = ({ lat, lng, focusKey }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.panTo({ lat, lng });
  }, [map, focusKey, lat, lng]);
  return null;
};

const STATUS_COLORS: Record<string, string> = {
  safe: '#22c55e',
  panic: '#ef4444',
  offline: '#64748b',
};

export const ResponderDashboard: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const users = useAppStore(s => s.users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mapCenter] = useState({ lat: -26.3085, lng: 27.8344 });
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid' | 'satellite'>('roadmap');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const panicEvents = useAppStore(s => s.panicEvents);
  const orgCode = currentUser?.orgCode;
  const guardedUsers = users.filter(u =>
    u.orgCode === orgCode &&
    u.role !== 'Organization Administrator' &&
    u.role !== 'Control Room Operator' &&
    u.role !== 'Dispatcher' &&
    u.role !== 'Responder'
  );

  const getUserStatus = (u: typeof users[0]): 'panic' | 'safe' | 'offline' => {
    const isPanic = panicEvents.some(e => e.profileUsed === u.id && e.status !== 'RESOLVED');
    if (isPanic) return 'panic';
    if (!(u as any).lastLocation) return 'offline';
    const age = Date.now() - (((u as any).lastLocation as any).timestamp || 0);
    return age < 5 * 60 * 1000 ? 'safe' : 'offline';
  };

  const panicUsers = guardedUsers.filter(u => getUserStatus(u) === 'panic');
  const selectedUser = guardedUsers.find(u => u.id === selectedUserId) || panicUsers[0] || guardedUsers[0];
  const focusLoc = (selectedUser as any)?.lastLocation || mapCenter;
  const focusLat = typeof focusLoc?.lat === 'number' && focusLoc.lat !== 0 ? focusLoc.lat : mapCenter.lat;
  const focusLng = typeof focusLoc?.lng === 'number' && focusLoc.lng !== 0 ? focusLoc.lng : mapCenter.lng;
  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div>
          <h2 className="font-black font-mono text-sm text-red-400 uppercase tracking-widest">Responder Console</h2>
          <p className="text-gray-400 text-xs font-mono mt-0.5">{guardedUsers.length} residents · {panicUsers.length} alerts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`text-[10px] font-mono font-bold px-2.5 py-1 uppercase ${
                viewMode === '2d' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2D Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`text-[10px] font-mono font-bold px-2.5 py-1 uppercase ${
                viewMode === '3d' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3D Campus
            </button>
          </div>
          {viewMode === '2d' && (
            <button
              type="button"
              onClick={() => setMapTypeId(prev => prev === 'roadmap' ? 'hybrid' : prev === 'hybrid' ? 'satellite' : 'roadmap')}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 uppercase"
            >
              Layer: {mapTypeId}
            </button>
          )}
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${focusLat},${focusLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-blue-300 hover:bg-slate-700 uppercase"
          >
            Street View
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${focusLat},${focusLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white hover:bg-emerald-500 uppercase"
          >
            Navigate
          </a>
          <div className="flex items-center gap-1.5 pl-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-mono text-xs font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Panic alerts */}
      {panicUsers.length > 0 && (
        <div className="bg-red-950 border-b border-red-500/50 px-4 py-2 flex-shrink-0 space-y-1">
          {panicUsers.map(u => (
            <div key={u.id} className="flex items-center gap-2 animate-pulse">
              <span className="text-red-400 font-black font-mono text-xs">PANIC:</span>
              <span className="text-white font-bold text-xs">{u.fullName}</span>
              <span className="text-red-300 text-xs">{u.phone}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map or 3D Campus Tactical View */}
      <div className="flex-1 min-h-[260px]">
        {viewMode === '3d' ? (
          <SceneErrorBoundary title="3D Responder Campus View" heightClass="h-full">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#050b16] text-xs font-mono text-emerald-400">
                  Loading 3D Campus Tactical View...
                </div>
              }
            >
              <TacticalCampus3DScene heightClass="h-full" />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          <APIProvider apiKey={GMAPS_KEY} language="en" region="ZA">
            <GoogleMap
              defaultCenter={{ lat: focusLat, lng: focusLng }}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio", "gmp_git_agentskills_v1"]}
              mapTypeId={mapTypeId}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              <ResponderMapPanner lat={focusLat} lng={focusLng} focusKey={selectedUser?.id || 'default'} />
              {guardedUsers.map(u => {
                const loc = (u as any).lastLocation as any;
                if (!loc?.lat || !loc?.lng) return null;
                const status = getUserStatus(u);
                const color = STATUS_COLORS[status];
                return (
                  <AdvancedMarker
                    key={u.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: color,
                        border: '2px solid white',
                        boxShadow: `0 0 8px ${color}`,
                        cursor: 'pointer',
                        transform: selectedUserId === u.id ? 'scale(1.6)' : 'scale(1)',
                        transition: 'transform 0.15s',
                      }}
                      title={u.fullName}
                    />
                  </AdvancedMarker>
                );
              })}
            </GoogleMap>
          </APIProvider>
        )}
      </div>

      {/* Resident list */}
      <div className="bg-slate-900 border-t border-slate-800 flex-shrink-0 max-h-44 overflow-y-auto">
        {guardedUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 font-mono text-xs">
            No residents assigned to this organisation yet.
          </div>
        ) : (
          guardedUsers.map(u => {
            const status = getUserStatus(u);
            const color = STATUS_COLORS[status];
            return (
              <div
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedUserId === u.id ? 'bg-slate-800' : ''}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-white truncate">{u.fullName}</p>
                  <p className="text-gray-400 text-[10px] font-mono">{u.phone || 'No phone'}</p>
                </div>
                <span
                  className="text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded-full"
                  style={{ background: color + '22', color }}
                >
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
