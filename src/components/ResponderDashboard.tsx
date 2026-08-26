import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useAppStore } from '../utils/store';

const STATUS_COLORS: Record<string, string> = {
  safe: '#22c55e',
  panic: '#ef4444',
  offline: '#64748b',
};

export const ResponderDashboard: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const users = useAppStore(s => s.users);
  const activeSOSState = useAppStore(s => s.activeSOSState);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -26.3085, lng: 27.8344 });

  const orgCode = currentUser?.orgCode;
  const guardedUsers = users.filter(u =>
    u.orgCode === orgCode &&
    u.role !== 'Organization Administrator' &&
    u.role !== 'Control Room Operator' &&
    u.role !== 'Dispatcher' &&
    u.role !== 'Responder'
  );

  const getUserStatus = (u: typeof users[0]): 'panic' | 'safe' | 'offline' => {
    if (activeSOSState?.initiatorId === u.id && activeSOSState.isActive) return 'panic';
    if (!u.lastLocation) return 'offline';
    const age = Date.now() - ((u.lastLocation as any).timestamp || 0);
    return age < 5 * 60 * 1000 ? 'safe' : 'offline';
  };

  const panicUsers = guardedUsers.filter(u => getUserStatus(u) === 'panic');
  const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-black font-mono text-sm text-red-400 uppercase tracking-widest">Responder Console</h2>
          <p className="text-gray-400 text-xs font-mono mt-0.5">{guardedUsers.length} residents · {panicUsers.length} alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-mono text-xs font-bold">LIVE</span>
        </div>
      </div>

      {/* Panic alerts */}
      {panicUsers.length > 0 && (
        <div className="bg-red-950 border-b border-red-500/50 px-4 py-2 flex-shrink-0 space-y-1">
          {panicUsers.map(u => (
            <div key={u.id} className="flex items-center gap-2 animate-pulse">
              <span className="text-red-400 font-black font-mono text-xs">🚨 PANIC:</span>
              <span className="text-white font-bold text-xs">{u.fullName}</span>
              <span className="text-red-300 text-xs">{u.phone}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 min-h-0">
        <APIProvider apiKey={GMAPS_KEY}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={14}
            mapId="responder-map"
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {guardedUsers.map(u => {
              const loc = u.lastLocation as any;
              if (!loc?.lat || !loc?.lng) return null;
              const status = getUserStatus(u);
              const color = STATUS_COLORS[status];
              return (
                <AdvancedMarker
                  key={u.id}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: color, border: '2px solid white',
                    boxShadow: `0 0 8px ${color}`,
                    cursor: 'pointer',
                    transform: selectedUserId === u.id ? 'scale(1.6)' : 'scale(1)',
                    transition: 'transform 0.15s',
                  }} title={u.fullName} />
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>
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
            const loc = u.lastLocation as any;
            return (
              <div
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                  if (loc?.lat) setMapCenter({ lat: loc.lat, lng: loc.lng });
                }}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedUserId === u.id ? 'bg-slate-800' : ''}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-white truncate">{u.fullName}</p>
                  <p className="text-gray-400 text-[10px] font-mono">{u.phone || 'No phone'}</p>
                </div>
                <span className="text-[10px] font-black font-mono uppercase px-2 py-0.5 rounded-full"
                  style={{ background: color + '22', color }}>
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
