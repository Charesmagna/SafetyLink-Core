import React, { useState, useEffect } from "react";
import { Compass, Plus, AlertOctagon, MapPin, Trash2, RefreshCw } from "lucide-react";
import { Geofence, GeofenceAlert } from "../types_enterprise";
import { User } from "../types";

interface GeofenceEngineProps {
  orgId?: string;
  users?: User[];
  onTriggerAlert?: (msg: string) => void;
}

export default function GeofenceEngine({ orgId, users = [], onTriggerAlert }: GeofenceEngineProps) {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<GeofenceAlert[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // New fence form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Patrol Zone" | "Estate" | "School" | "Community Zone" | "Restricted">("Community Zone");
  const [newLat, setNewLat] = useState(-26.3085);
  const [newLng, setNewLng] = useState(27.8344);
  const [newRadius, setNewRadius] = useState(2000);

  const fetchGeofences = async () => {
    setIsSyncing(true);
    try {
      const url = orgId ? `/api/geofences?orgId=${orgId}` : "/api/geofences";
      const res = await fetch(url);
      const data = await res.json();
      setGeofences(data);

      const urlAlerts = orgId ? `/api/geofences/alerts?orgId=${orgId}` : "/api/geofences/alerts";
      const resAlerts = await fetch(urlAlerts);
      const dataAlerts = await resAlerts.json();
      setBreachAlerts(dataAlerts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
    const interval = setInterval(fetchGeofences, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [orgId]);

  const handleCreateFence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await fetch("/api/geofences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          centerLat: newLat,
          centerLng: newLng,
          radiusMeters: newRadius,
          orgId
        })
      });

      if (res.ok) {
        setNewName("");
        fetchGeofences();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate a breach trigger (for demonstrations)
  const triggerSimulatedBreach = async (fence: Geofence) => {
    const randomResponder = users.filter(u => u.role === "Responder")[0]?.name || "Officer Sipho Dlamini";
    const triggers = ["exit", "enter", "unexpected_movement"] as const;
    const trig = triggers[Math.floor(Math.random() * triggers.length)];
    
    let message = "";
    if (trig === "exit") {
      message = `${randomResponder} exited active ${fence.type} [${fence.name}] boundary without dispatch authorization. Coordinates: ${fence.centerLat.toFixed(4)}, ${fence.centerLng.toFixed(4)}.`;
    } else if (trig === "enter") {
      message = `${randomResponder} entered designated RESTRICTED zone [${fence.name}]. Critical alarm issued to supervisors.`;
    } else {
      message = `Wearable panic button registered unexpected motion trail displacement in [${fence.name}].`;
    }

    try {
      const res = await fetch("/api/geofences/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geofenceId: fence.id,
          geofenceName: fence.name,
          responderName: randomResponder,
          triggerType: trig,
          message,
          orgId
        })
      });
      if (res.ok) {
        fetchGeofences();
        if (onTriggerAlert) onTriggerAlert(message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="geofencing-engine-mgr">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            Tactical Geo-Fencing Engine
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Define active patrol sectors, estate boundaries, community perimeters, and restricted zones</p>
        </div>
        <button
          onClick={fetchGeofences}
          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-teal-500 rounded-lg text-slate-300 hover:text-teal-400 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Create Geofence Form */}
        <form onSubmit={handleCreateFence} className="lg:col-span-5 bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Define New Mapped Fence</div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block font-semibold">Boundary Name</label>
            <input
              type="text"
              placeholder="e.g. Lenasia Community Center"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none placeholder-slate-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Zone Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none"
              >
                <option value="Patrol Zone">Patrol Zone</option>
                <option value="Estate">Estate Boundary</option>
                <option value="School">School Zone</option>
                <option value="Community Zone">Community Zone</option>
                <option value="Restricted">Restricted Area</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Radius (Meters)</label>
              <input
                type="number"
                value={newRadius}
                onChange={e => setNewRadius(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none"
                min="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Latitude Center</label>
              <input
                type="number"
                step="0.00001"
                value={newLat}
                onChange={e => setNewLat(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg py-1.5 px-3 text-xs text-slate-100 font-mono outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Longitude Center</label>
              <input
                type="number"
                step="0.00001"
                value={newLng}
                onChange={e => setNewLng(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-lg py-1.5 px-3 text-xs text-slate-100 font-mono outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg transition mt-2"
          >
            Deploy Boundary Fence
          </button>
        </form>

        {/* Existing Geofences List */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Active Sector Boundaries</div>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {geofences.map(fence => (
              <div
                key={fence.id}
                className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200">{fence.name}</span>
                    <span className="text-[9px] bg-slate-900 text-teal-400 border border-teal-800/40 px-1.5 py-0.5 rounded uppercase font-mono">
                      {fence.type}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                    <span>Center: {fence.centerLat.toFixed(4)}, {fence.centerLng.toFixed(4)}</span>
                    <span>•</span>
                    <span>Radius: {fence.radiusMeters}m</span>
                  </div>
                </div>
                <button
                  onClick={() => triggerSimulatedBreach(fence)}
                  className="bg-teal-950 hover:bg-teal-900 text-teal-400 border border-teal-800 font-bold font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded transition shrink-0"
                >
                  Simulate Breach
                </button>
              </div>
            ))}
          </div>

          {/* Breach Alerts Activity Feed */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Breach Alarm Feed</div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {breachAlerts.length === 0 ? (
                <div className="text-center py-4 text-slate-600 italic text-[11px]">
                  No geofence breach alarms detected. Perimeters secure.
                </div>
              ) : (
                breachAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-2 rounded bg-rose-950/20 border border-rose-900/30 text-[10.5px] text-rose-300 flex gap-2"
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-200">{alert.responderName}</span>: {alert.message}
                      <span className="text-[9px] text-slate-500 block mt-0.5">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
