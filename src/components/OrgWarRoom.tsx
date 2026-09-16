
import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useAppStore } from '../utils/store';

export const OrgWarRoom = () => {
  const { meshNodes, liveSOSStream, orgUsers } = useAppStore();
  const [messages, setMessages] = useState<string[]>([]);
  
  useEffect(() => {
    // SSE setup (NTFY)
    const eventSource = new EventSource('https://ntfy.sh/safetylink_warroom/sse');
    eventSource.onmessage = (e) => {
      setMessages(prev => [...prev, e.data]);
    };
    return () => eventSource.close();
  }, []);

  return (
    <div className="bg-[#020617] h-screen text-slate-200 flex flex-col font-sans">
      <div className="p-4 bg-slate-950 border-b border-slate-900 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-100 tracking-widest uppercase">
          Live GIS Map — Commander Deck
        </h1>
        <div className="flex gap-2">
          <button className="text-[10px] px-3 py-1.5 bg-blue-600 rounded-md hover:bg-blue-700 font-bold uppercase tracking-wider">Navigate</button>
          <button className="text-[10px] px-3 py-1.5 bg-green-600 rounded-md hover:bg-green-700 font-bold uppercase tracking-wider">Call Victim</button>
          <button className="text-[10px] px-3 py-1.5 bg-red-600 rounded-md hover:bg-red-700 font-bold uppercase tracking-wider">Clear Scene</button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 relative bg-slate-900 min-h-[400px]">
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
            <Map 
              mapId="DEMO_MAP_ID" 
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              defaultZoom={12} 
              defaultCenter={{ lat: -26.3085, lng: 27.8344 }}
              disableDefaultUI={true}
              gestureHandling={'greedy'}
            >
              {meshNodes.map(node => (
                <AdvancedMarker key={node.id} position={{ lat: node.lat, lng: node.lng }}>
                  <Pin background={node.status === 'ACTIVE' ? '#ef4444' : '#3b82f6'} borderColor={'#fff'} glyphColor={'#fff'} />
                </AdvancedMarker>
              ))}
              {liveSOSStream && liveSOSStream.map(sos => (
                <AdvancedMarker key={sos.id} position={{ lat: sos.lat, lng: sos.lng }}>
                  <Pin background="#ef4444" borderColor="#fff" glyphColor="#fff" />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
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
