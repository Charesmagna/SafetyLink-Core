import React from "react";
import { ClipboardList, WifiOff, MapPin, RefreshCw, AlertOctagon, Check } from "lucide-react";
import { User, Alert, AlertEvent } from "../../types";

interface IncidentsViewProps {
  currentUser: User;
  alerts: Alert[];
  offlineQueue: any[];
  activeAlertEvents: AlertEvent[];
  getClosestSouthAfricanCity: (lat: number, lng: number) => string;
  onResolveAlert: (id: string) => void;
  refreshData: () => void;
  simulatedNetwork: "online" | "offline";
}

export default function IncidentsView({
  currentUser,
  alerts,
  offlineQueue,
  activeAlertEvents,
  getClosestSouthAfricanCity,
  onResolveAlert,
  refreshData,
  simulatedNetwork,
}: IncidentsViewProps) {
  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left">
      <div className="border-b border-slate-800 pb-3 mb-1 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight">Incident Room</h3>
          <p className="text-[10px] text-rose-400 font-semibold font-mono">SECTOR DISPATCH & ESCALATION LOGS</p>
        </div>
        <button
          onClick={refreshData}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white border border-transparent hover:border-slate-800 transition cursor-pointer"
          title="Refresh active logs feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Offline Queue segment */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/25 rounded-2xl p-4.5 space-y-3 shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Offline Queue ({offlineQueue.length})
            </p>
            <span className="text-[8px] bg-amber-500/10 text-amber-400 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase">
              No Network
            </span>
          </div>

          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {offlineQueue.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/90 rounded-xl p-3 text-xs border border-slate-850 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-slate-200">SOS Distress Queued</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-1 font-semibold leading-none">
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)} • {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
            Distress alarms are stored locally. Toggle the CELLULAR status bar button to ONLINE to automatically re-sync packets.
          </p>
        </div>
      )}

      {/* Main Alerts Feed */}
      {alerts.length === 0 && offlineQueue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 text-slate-500 space-y-3 bg-slate-950/20 rounded-3xl border border-dashed border-slate-850">
          <ClipboardList className="w-12 h-12 text-slate-700 animate-pulse" />
          <p className="text-sm font-bold text-slate-400">Sector Channel Quiet</p>
          <p className="text-[10px] text-slate-500 font-semibold max-w-[200px] leading-relaxed mx-auto">
            Your triggered distress panics and neighborhood alerts will log directly here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
          {alerts.map((alert) => {
            const isMyAlert = alert.userId === currentUser.id;
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition shadow ${
                  alert.status === "resolved"
                    ? "bg-slate-950/50 border-slate-850/80"
                    : isMyAlert
                    ? "bg-rose-950/15 border-rose-500/30 ring-1 ring-rose-500/10"
                    : "bg-slate-900 border-slate-850"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[8px] text-slate-500 font-bold font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                      ID: {alert.id.slice(0, 8)}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-200 mt-1.5 leading-none">
                      {alert.userName} {isMyAlert && "(You)"}
                    </h4>
                  </div>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
                      alert.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : alert.status === "escalated"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>

                {/* Telemetry data */}
                <div className="text-[11px] text-slate-400 space-y-1.5 mb-3.5">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {getClosestSouthAfricanCity(alert.latitude, alert.longitude)} ({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold font-mono">
                    Initiated: {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Event Logs Waterfall */}
                {isMyAlert && activeAlertEvents.length > 0 && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 mb-3.5 shadow-inner">
                    <span className="text-[8px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                      Dynamic Escalation Logs
                    </span>
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {activeAlertEvents.map((e) => (
                        <div
                          key={e.id}
                          className="text-[9px] text-slate-300 border-l border-slate-800 pl-2 py-0.5 text-left font-mono"
                        >
                          <span className="text-slate-500 text-[8px] block">
                            {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          {e.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution trigger */}
                {alert.status !== "resolved" && (
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Resolved & Close Incident
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
