import React, { useState, useEffect } from "react";
import { AlertCircle, User, Shield, MapPin, Clock, CheckCircle, PlusCircle, RefreshCw } from "lucide-react";
import { Incident } from "../types_enterprise";
import { User as CoreUser } from "../types";

interface IncidentLifecycleProps {
  orgId?: string;
  users?: CoreUser[];
  onIncidentUpdated?: () => void;
}

export default function IncidentLifecycle({ orgId, users = [], onIncidentUpdated }: IncidentLifecycleProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Note and Action log inputs
  const [newNote, setNewNote] = useState("");
  const [newAction, setNewAction] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const fetchIncidents = async () => {
    setIsSyncing(true);
    try {
      const url = orgId ? `/api/incidents?orgId=${orgId}` : "/api/incidents";
      const res = await fetch(url);
      const data = await res.json();
      setIncidents(data);
      if (selectedIncident) {
        const updated = data.find((i: Incident) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [orgId]);

  const updateIncidentStatus = async (status: "Open" | "Investigating" | "Dispatch" | "Resolved" | "Escalated") => {
    if (!selectedIncident) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchIncidents();
        if (onIncidentUpdated) onIncidentUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignResponder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !assigneeId) return;

    const matchedUser = users.find(u => u.id === assigneeId);
    if (!matchedUser) return;

    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedResponderId: matchedUser.id,
          assignedResponderName: matchedUser.name
        })
      });
      if (res.ok) {
        setAssigneeId("");
        fetchIncidents();
        if (onIncidentUpdated) onIncidentUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newNote) return;

    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote })
      });
      if (res.ok) {
        setNewNote("");
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !newAction) return;

    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newAction })
      });
      if (res.ok) {
        setNewAction("");
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerGpsTrailUpdate = async () => {
    if (!selectedIncident) return;
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;
    const baseLat = -26.1076;
    const baseLng = 28.0567;

    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gpsUpdate: {
            latitude: baseLat + offsetLat,
            longitude: baseLng + offsetLng
          }
        })
      });
      if (res.ok) {
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-950 text-blue-400 border-blue-800";
      case "Investigating": return "bg-indigo-950 text-indigo-400 border-indigo-800";
      case "Dispatch": return "bg-amber-950 text-amber-400 border-amber-800";
      case "Resolved": return "bg-emerald-950 text-emerald-400 border-emerald-800";
      case "Escalated": return "bg-red-950 text-red-400 border-red-800";
      default: return "bg-slate-950 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="incident-lifecycle-mgmt">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            Tactical Incident Lifecycle Log
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Track dispatches, record timelines, allocate resources, and compile responder notes</p>
        </div>
        <button
          onClick={fetchIncidents}
          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-lg text-slate-300 hover:text-rose-400 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Incident selector list */}
        <div className="lg:col-span-4 space-y-2 max-h-[480px] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">Active Incident Log</div>
          {incidents.length === 0 ? (
            <div className="text-center py-6 text-slate-600 italic text-[11px] bg-slate-950/20 border border-slate-850 rounded-xl">
              No incident entries recorded yet.
            </div>
          ) : (
            incidents.map(inc => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selectedIncident?.id === inc.id
                    ? "bg-rose-950/20 border-rose-500"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">ID: {inc.id.slice(0, 8)}</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusClass(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-200 mt-1">{inc.userName}</div>
                <div className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">{inc.notes}</div>
                <div className="text-[9px] text-slate-500 mt-1.5 font-mono">
                  {new Date(inc.createdAt).toLocaleTimeString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detailed Panel */}
        <div className="lg:col-span-8">
          {selectedIncident ? (
            <div className="space-y-4 bg-slate-950/35 p-4.5 rounded-2xl border border-slate-850">
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <div>
                  <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wide">
                    Incident {selectedIncident.id.slice(0, 8)}: {selectedIncident.userName}
                  </h5>
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    SOS alert triggered. Mode: <span className="font-bold uppercase text-red-400 font-mono">{selectedIncident.mode}</span>
                  </p>
                </div>
                {/* State transitioning controllers */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["Open", "Investigating", "Dispatch", "Resolved", "Escalated"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => updateIncidentStatus(st)}
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded transition ${
                        selectedIncident.status === st
                          ? "bg-rose-600 text-black border border-rose-500"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responder assignment and Dispatch Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Assigned Responder</div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold text-slate-200">
                      {selectedIncident.assignedResponderName || "None Assigned"}
                    </span>
                  </div>
                  {/* Allocation Selector */}
                  <form onSubmit={handleAssignResponder} className="flex gap-1 pt-1">
                    <select
                      value={assigneeId}
                      onChange={e => setAssigneeId(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-[10.5px] text-slate-300 rounded px-2 py-1 outline-none flex-grow"
                    >
                      <option value="">Select Responders</option>
                      {users
                        .filter(u => u.role === "Responder" || u.role === "Supervisor")
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      className="bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-850 px-2 rounded text-[10px] font-bold uppercase"
                    >
                      Deploy
                    </button>
                  </form>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">GPS Coordinates Trail</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{selectedIncident.gpsTrail.length} Coordinates logged</span>
                    </div>
                    <button
                      onClick={triggerGpsTrailUpdate}
                      className="text-[9px] font-mono font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-900 transition"
                    >
                      Log Coordinates
                    </button>
                  </div>
                  {/* Coordinate Breadcrumbs */}
                  <div className="text-[9px] font-mono text-slate-500 max-h-12 overflow-y-auto pr-1">
                    {selectedIncident.gpsTrail.map((gp, index) => (
                      <div key={index}>
                        • Lat: {gp.latitude.toFixed(4)}, Lng: {gp.longitude.toFixed(4)} ({new Date(gp.timestamp).toLocaleTimeString()})
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form entries for adding Actions and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Notes log */}
                <form onSubmit={handleAddNote} className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Add Dispatch Note</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Hostage negotiator en route..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 rounded px-2.5 py-1.5 outline-none flex-grow"
                    />
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-3 rounded"
                    >
                      Add
                    </button>
                  </div>
                </form>

                {/* Actions taken list */}
                <form onSubmit={handleAddAction} className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Log Tactical Action</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Secured the outer quadrant."
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 rounded px-2.5 py-1.5 outline-none flex-grow"
                    />
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-3 rounded"
                    >
                      Log
                    </button>
                  </div>
                </form>
              </div>

              {/* Actions taken & notes displays */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Actions Recorded</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-900 text-[11px] text-slate-300">
                    {selectedIncident.actionsTaken.map((ac, index) => (
                      <div key={index} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{ac}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Linear timeline logs */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Incident Event Timeline</span>
                <div className="space-y-2.5 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-xl border border-slate-900">
                  {selectedIncident.timeline.map((tm, index) => (
                    <div key={index} className="flex gap-2.5 items-start text-[10.5px]">
                      <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-slate-300 leading-normal">{tm.message}</p>
                        <span className="text-[9px] text-slate-600 font-mono">{new Date(tm.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-slate-850 rounded-2xl text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-slate-700" />
              <span>Select an active SOS or manual incident record from the log panel to initiate tactical dispatch workflows.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
