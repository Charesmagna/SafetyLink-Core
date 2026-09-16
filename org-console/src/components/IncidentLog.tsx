import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, Clock, MapPin, User } from 'lucide-react';

interface Incident {
  id: string;
  type: string;
  userId: string;
  userName: string;
  timestamp: number;
  lat?: number;
  lng?: number;
  description?: string;
  resolved?: boolean;
}

export default function IncidentLog({ orgId }: { orgId: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'incidents'),
      where('orgId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
      setLoading(false);
    });
    return unsub;
  }, [orgId]);

  if (loading) return <div className="text-slate-500 text-sm text-center py-12">Loading incidents...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Incident Log</h3>
        <span className="text-slate-500 text-xs">{incidents.length} records</span>
      </div>

      {incidents.length === 0 && (
        <div className="bg-sl-panel border border-sl-border rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No incidents recorded for this organisation</p>
        </div>
      )}

      {incidents.map(inc => (
        <div key={inc.id} className={`bg-sl-panel border rounded-xl p-4 ${inc.resolved ? 'border-sl-border' : 'border-red-800/40'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-1.5 rounded-lg ${inc.resolved ? 'bg-slate-800' : 'bg-red-950/50'}`}>
                <AlertTriangle className={`w-4 h-4 ${inc.resolved ? 'text-slate-500' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{inc.type || 'SOS Emergency'}</p>
                {inc.description && <p className="text-slate-400 text-xs mt-0.5">{inc.description}</p>}
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <User className="w-3 h-3" /> {inc.userName || inc.userId}
                  </span>
                  {inc.lat && inc.lng && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <MapPin className="w-3 h-3" /> {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock className="w-3 h-3" /> {new Date(inc.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inc.resolved ? 'bg-green-950/50 text-green-400' : 'bg-red-950/50 text-red-400'}`}>
              {inc.resolved ? 'Resolved' : 'Active'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
