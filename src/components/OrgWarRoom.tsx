import React, { Suspense, lazy, useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useAppStore } from '../utils/store';
import { useEditorialStore } from '../utils/editorialStore';
import { SceneErrorBoundary } from './three/SceneErrorBoundary';

const TacticalCampus3DScene = lazy(() => import('./three/TacticalCampus3DScene'));

export const OrgWarRoom = () => {
  const { meshNodes, panicEvents, currentOrg } = useAppStore();
  const editorialExe = useEditorialStore((s) => s.exe);
  const liveSOSStream = (panicEvents || []).map((p: any) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    status: p.status,
  }));
  const [messages, setMessages] = useState<string[]>([]);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const activeIncident = liveSOSStream.find((s: any) => s.lat && s.lng && s.status !== 'RESOLVED') || liveSOSStream[0];
  const targetLat = activeIncident?.lat || -26.3085;
  const targetLng = activeIncident?.lng || 27.8344;

  useEffect(() => {
    const eventSource = new EventSource('https://ntfy.sh/safetylink_warroom/sse');
    eventSource.onmessage = (e) => {
      setMessages(prev => [...prev, e.data]);
    };
    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-[#020617] h-screen text-slate-200 flex flex-col font-sans">
      <div className="p-4 bg-slate-950 border-b border-slate-900 flex flex-wrap justify-between items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-widest uppercase">
            {editorialExe.dispatchHeader || 'Live GIS Map — Commander Deck'}
          </h1>
          {editorialExe.threatLevelLabel && (
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mt-0.5">
              {editorialExe.threatLevelLabel}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider transition-colors ${
                viewMode === '2d' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              2D GIS Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider transition-colors ${
                viewMode === '3d' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              3D Tactical Twin
            </button>
          </div>
          {viewMode === '2d' && (
            <button
              type="button"
              onClick={() => setMapTypeId(prev => prev === 'hybrid' ? 'roadmap' : prev === 'roadmap' ? 'satellite' : 'hybrid')}
              className="text-[10px] px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 font-bold uppercase tracking-wider"
            >
              View: {mapTypeId}
            </button>
          )}
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${targetLat},${targetLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-3 py-1.5 bg-indigo-600 rounded-md hover:bg-indigo-700 font-bold uppercase tracking-wider"
          >
            Street View
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] px-3 py-1.5 bg-blue-600 rounded-md hover:bg-blue-700 font-bold uppercase tracking-wider"
          >
            Navigate
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative min-h-0">
        <div className="flex-1 relative bg-slate-900 min-h-[400px]">
          {viewMode === '3d' ? (
            <SceneErrorBoundary title="3D Tactical Campus Twin" heightClass="h-full">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-[#050b16] text-xs font-mono text-emerald-400">
                    Initializing 3D Tactical Campus Twin...
                  </div>
                }
              >
                <TacticalCampus3DScene heightClass="h-full" orgName={currentOrg?.name} />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} language="en" region="ZA">
              <Map
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                mapTypeId={mapTypeId}
                defaultZoom={12}
                defaultCenter={{ lat: targetLat, lng: targetLng }}
                disableDefaultUI={false}
                gestureHandling="greedy"
              >
                {meshNodes.map(node => (
                  <AdvancedMarker key={node.id} position={{ lat: node.lat, lng: node.lng }}>
                    <Pin background={node.status === 'ACTIVE' ? '#ef4444' : '#3b82f6'} borderColor="#fff" glyphColor="#fff" />
                  </AdvancedMarker>
                ))}
                {liveSOSStream.map((sos: any) =>
                  sos.lat && sos.lng ? (
                    <AdvancedMarker key={sos.id} position={{ lat: sos.lat, lng: sos.lng }}>
                      <Pin background="#ef4444" borderColor="#fff" glyphColor="#fff" />
                    </AdvancedMarker>
                  ) : null
                )}
              </Map>
            </APIProvider>
          )}
        </div>

        <div className="w-full lg:w-80 bg-slate-950 border-l border-slate-900 flex flex-col max-h-[300px] lg:max-h-full">
          <div className="p-3 border-b border-slate-900">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live Event Stream</h2>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-[9px] text-slate-500 font-mono text-center mt-4">Waiting for telemetry...</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="text-[9px] font-mono text-slate-300 border-b border-slate-900/50 pb-2">
                <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span> {m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgWarRoom;
