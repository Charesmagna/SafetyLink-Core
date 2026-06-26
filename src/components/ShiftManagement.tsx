import React, { useState, useEffect } from "react";
import { Clock, Shield, Calendar, RefreshCw, AlertCircle, PlayCircle, StopCircle } from "lucide-react";
import { Shift } from "../types_enterprise";
import { User } from "../types";

interface ShiftManagementProps {
  orgId?: string;
  users?: User[];
  onShiftUpdated?: () => void;
}

export default function ShiftManagement({ orgId, users = [], onShiftUpdated }: ShiftManagementProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Shift starter states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"Responder" | "Supervisor">("Responder");
  const [initialTask, setInitialTask] = useState("Routine Area Patrol");

  const fetchShifts = async () => {
    setIsSyncing(true);
    try {
      const url = orgId ? `/api/shifts?orgId=${orgId}` : "/api/shifts";
      const res = await fetch(url);
      const data = await res.json();
      setShifts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    const interval = setInterval(fetchShifts, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [orgId]);

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const matchedUser = users.find(u => u.id === selectedUserId);
    if (!matchedUser) return;

    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: matchedUser.id,
          userName: matchedUser.name,
          role: selectedRole,
          organizationId: orgId || "org-sa-tactical-01",
          state: "Available",
          currentTask: initialTask
        })
      });

      if (res.ok) {
        setSelectedUserId("");
        fetchShifts();
        if (onShiftUpdated) onShiftUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndShift = async (shiftId: string) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endShift: true })
      });
      if (res.ok) {
        fetchShifts();
        if (onShiftUpdated) onShiftUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateState = async (shiftId: string, state: "Available" | "Responding" | "Patrol" | "Busy" | "Offline", currentTask?: string) => {
    try {
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, currentTask })
      });
      if (res.ok) {
        fetchShifts();
        if (onShiftUpdated) onShiftUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "Available":
        return <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">Available</span>;
      case "Responding":
        return <span className="text-[10px] bg-rose-950 text-rose-400 font-mono font-bold px-2 py-0.5 rounded border border-rose-800 animate-pulse">Responding</span>;
      case "Patrol":
        return <span className="text-[10px] bg-blue-950 text-blue-400 font-mono font-bold px-2 py-0.5 rounded border border-blue-800">Patrol</span>;
      case "Busy":
        return <span className="text-[10px] bg-amber-950 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-800">Busy</span>;
      case "Offline":
        return <span className="text-[10px] bg-slate-900 text-slate-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">Offline</span>;
      default:
        return <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">{state}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="shift-mgmt-panel">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Tactical Shift & Roster Management
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Control active responder states, duty clocks, and dispatch availability indicators</p>
        </div>
        <button
          onClick={fetchShifts}
          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-lg text-slate-300 hover:text-purple-400 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Duty Clock-in form */}
        <form onSubmit={handleStartShift} className="lg:col-span-5 bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-3">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Clock Responder Into Active Shift</div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block font-semibold">Select Enrolled Officer</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 outline-none"
              required
            >
              <option value="">Choose User...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Shift Duty Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none"
              >
                <option value="Responder">Tactical Responder</option>
                <option value="Supervisor">Shift Supervisor</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-semibold">Initial Assignment</label>
              <input
                type="text"
                value={initialTask}
                onChange={e => setInitialTask(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg py-1.5 px-3 text-xs text-slate-100 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-[10px] uppercase tracking-wider py-2 rounded-lg transition mt-2 flex items-center justify-center gap-1.5"
          >
            <PlayCircle className="w-4 h-4" />
            Clock In Duty Shift
          </button>
        </form>

        {/* Shift log tracker */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Active Patrol Roster</div>
          
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {shifts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
                No active responders currently clocked on shift duty.
              </div>
            ) : (
              shifts.map(shift => (
                <div
                  key={shift.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200">{shift.userName}</span>
                      <span className="text-[9px] bg-slate-900 text-purple-400 border border-purple-800/40 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                        {shift.role}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      Started: <span className="text-slate-300">{new Date(shift.startedAt).toLocaleTimeString()}</span>
                      {shift.endedAt && (
                        <> | Ended: <span className="text-slate-500">{new Date(shift.endedAt).toLocaleTimeString()}</span></>
                      )}
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Task: <span className="font-semibold text-slate-300">{shift.currentTask}</span>
                    </div>
                  </div>

                  {!shift.endedAt ? (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900 shrink-0">
                      <select
                        value={shift.state}
                        onChange={e => handleUpdateState(shift.id, e.target.value as any, shift.currentTask)}
                        className="bg-slate-900 border border-slate-800 text-[10.5px] text-slate-300 rounded px-2 py-1 outline-none font-mono"
                      >
                        <option value="Available">Available</option>
                        <option value="Responding">Responding</option>
                        <option value="Patrol">Patrol</option>
                        <option value="Busy">Busy</option>
                      </select>
                      <button
                        onClick={() => handleEndShift(shift.id)}
                        className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-400 p-1 rounded transition"
                        title="Clock Out duty shift"
                      >
                        <StopCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0">{getStateBadge("Offline")}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
