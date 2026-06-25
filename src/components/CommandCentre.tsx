import React, { useEffect, useRef, useState } from "react";
import { 
  ShieldAlert, User, Phone, Heart, Clock, CheckCircle, RefreshCw, AlertTriangle, 
  ChevronRight, Sparkles, Filter, Users, MapPin, Activity, FileText, Compass
} from "lucide-react";
import { Alert, User as UserType, AlertEvent } from "../types";
import { getClosestSouthAfricanCity } from "../utils";
import IncidentLifecycle from "./IncidentLifecycle";
import ShiftManagement from "./ShiftManagement";
import GeofenceEngine from "./GeofenceEngine";

interface CommandCentreProps {
  alerts: Alert[];
  users: UserType[];
  onResolveAlert: (id: string, resolvedBy: string) => void;
  onUpdateAlertStatus: (id: string, status: "active" | "escalated" | "resolved", message?: string) => void;
  onTriggerAISummary: (alertId: string) => Promise<string>;
  refreshData: () => void;
}

export default function CommandCentre({
  alerts,
  users,
  onResolveAlert,
  onUpdateAlertStatus,
  onTriggerAISummary,
  refreshData
}: CommandCentreProps) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [subTab, setSubTab] = useState<"map" | "incidents" | "shifts" | "geofences">("map");
  const [operatorNote, setOperatorNote] = useState("");
  const [aiReport, setAiReport] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<AlertEvent[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  const selectedAlert = alerts.find(a => a.id === selectedAlertId);

  // Initialize and update Leaflet Map
  useEffect(() => {
    // If Leaflet is not loaded on window yet, wait
    if (!(window as any).L || !mapContainerRef.current) return;

    const L = (window as any).L;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");
      const defaultCenter: [number, number] = activeAlerts.length > 0 
        ? [activeAlerts[0].latitude, activeAlerts[0].longitude] 
        : [-29.0, 25.0];
      const defaultZoom = activeAlerts.length > 0 ? 13 : 5.5;

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Filter alerts to show on map
    const mapAlerts = alerts.filter(a => {
      if (filterStatus === "all") return true;
      if (filterStatus === "active") return a.status === "active" || a.status === "escalated";
      return a.status === "resolved";
    });

    // Add active & resolved markers
    mapAlerts.forEach(alert => {
      let iconColor = "#ef4444"; // red active
      let className = "pulse-marker-active";

      if (alert.status === "escalated") {
        iconColor = "#f59e0b"; // amber escalated
        className = "pulse-marker-escalated";
      } else if (alert.status === "resolved") {
        iconColor = "#10b981"; // green resolved
        className = "";
      }

      let markerIcon;
      if (alert.status !== "resolved") {
        markerIcon = L.divIcon({
          className: className,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
      } else {
        markerIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#10b981;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
          className: "",
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
      }

      const marker = L.marker([alert.latitude, alert.longitude], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 13px; line-height: 1.4;">
            <b style="color: #1e293b;">${alert.userName}</b><br/>
            <span style="color: #64748b;">Status: <b>${alert.status.toUpperCase()}</b></span><br/>
            <span style="color: #ef4444; font-size:11px;">Coordinates: ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}</span>
          </div>
        `);

      marker.on("click", () => {
        setSelectedAlertId(alert.id);
      });

      markersRef.current[alert.id] = marker;
    });

    // Also add simulated security patrol cars on the map near active coordinates (blue markers)
    const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");
    const baseLat = activeAlerts.length > 0 ? activeAlerts[0].latitude : -26.2041;
    const baseLng = activeAlerts.length > 0 ? activeAlerts[0].longitude : 28.0473;

    const responders = [
      { name: "Tactical Response Unit", lat: baseLat + 0.006, lng: baseLng + 0.004 },
      { name: "K9 Patrol Unit", lat: baseLat - 0.005, lng: baseLng - 0.003 },
      { name: "Sector Volunteer Vehicle", lat: baseLat - 0.003, lng: baseLng + 0.007 }
    ];

    responders.forEach((resp, idx) => {
      const respIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#3b82f6;border:2.5px solid white;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.6)"></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const m = L.marker([resp.lat, resp.lng], { icon: respIcon })
        .addTo(map)
        .bindPopup(`<div style="font-size:12px;"><b>👮 ${resp.name}</b><br/><span style="color:#2563eb;">ACTIVE PATROL</span></div>`);
      
      markersRef.current[`resp-${idx}`] = m;
    });

    // If an alert is selected, pan the map there
    if (selectedAlert) {
      map.setView([selectedAlert.latitude, selectedAlert.longitude], 14, { animate: true });
    }

  }, [alerts, filterStatus, selectedAlertId]);

  // Fetch alert events whenever selected alert changes
  useEffect(() => {
    if (!selectedAlertId) return;
    setAiReport(""); // Reset AI reports on change
    fetch(`/api/alerts/${selectedAlertId}/events`)
      .then(res => res.json())
      .then(data => setTimelineEvents(data))
      .catch(err => console.error(err));
  }, [selectedAlertId, alerts]);

  // Handle Gemini AI incident report analysis triggers
  const handleAIReview = async () => {
    if (!selectedAlertId) return;
    setIsAiLoading(true);
    setAiReport("");
    try {
      const markdown = await onTriggerAISummary(selectedAlertId);
      setAiReport(markdown);
    } catch (err) {
      setAiReport("Failed to generate report from Gemini server.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleEscalate = () => {
    if (!selectedAlertId) return;
    onUpdateAlertStatus(selectedAlertId, "escalated", operatorNote);
    setOperatorNote("");
  };

  const handleResolve = () => {
    if (!selectedAlertId) return;
    onResolveAlert(selectedAlertId, "Control Room dispatcher");
  };

  const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");
  const filteredList = alerts.filter(a => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return a.status === "active" || a.status === "escalated";
    return a.status === "resolved";
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[740px]">
      
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight font-mono text-white flex items-center gap-2">
              SafetyLink Core <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider">TM Media Solutions</span>
            </h2>
            <p className="text-xs text-slate-400">Enterprise multi-tenant dispatcher, South African city-aware dispatch engine, & BLE gateways</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 text-xs px-3 py-1 rounded-full text-slate-300 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            {activeAlerts.length} ACTIVE ALARMS IN SECTOR
          </div>
          <button 
            onClick={refreshData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Refresh logs & telemetry status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tactical Control Sub-Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap gap-2 shrink-0">
        <button
          onClick={() => setSubTab("map")}
          className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-lg border transition ${
            subTab === "map"
              ? "bg-rose-950/40 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Alert Map
        </button>
        <button
          onClick={() => setSubTab("incidents")}
          className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-lg border transition ${
            subTab === "incidents"
              ? "bg-rose-950/40 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Incident Lifecycle Log
        </button>
        <button
          onClick={() => setSubTab("shifts")}
          className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-lg border transition ${
            subTab === "shifts"
              ? "bg-rose-950/40 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Tactical Shift Roster
        </button>
        <button
          onClick={() => setSubTab("geofences")}
          className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-bold px-3.5 py-1.5 rounded-lg border transition ${
            subTab === "geofences"
              ? "bg-rose-950/40 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Mapped Geo-Fences
        </button>
      </div>

      <div className={`flex-1 ${subTab === "map" ? "flex" : "hidden"} overflow-hidden`}>
        
        {/* Left Side: Filterable alerts sidebar */}
        <div className="w-[300px] border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase">
              <span>Incident Feeds</span>
              <Filter className="w-3.5 h-3.5" />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button 
                onClick={() => setFilterStatus("all")}
                className={`flex-1 py-1.5 rounded-md text-center transition ${filterStatus === "all" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus("active")}
                className={`flex-1 py-1.5 rounded-md text-center transition ${filterStatus === "active" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Active ({activeAlerts.length})
              </button>
              <button 
                onClick={() => setFilterStatus("resolved")}
                className={`flex-1 py-1.5 rounded-md text-center transition ${filterStatus === "resolved" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No telemetry alerts found in this filter range.
              </div>
            ) : (
              filteredList.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 text-left cursor-pointer transition ${selectedAlertId === alert.id ? 'bg-blue-50/30 border-l-4 border-blue-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-slate-800">{alert.userName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : alert.status === 'escalated' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-rose-100 text-rose-800 animate-pulse'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    {getClosestSouthAfricanCity(alert.latitude, alert.longitude)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(alert.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle: Leaflet Map Container */}
        <div className="flex-grow relative h-full bg-slate-100">
          <div ref={mapContainerRef} className="absolute inset-0 z-10" />
        </div>

        {/* Right Side: Detailed incident parameters card */}
        {selectedAlert && (
          <div className="w-[380px] border-l border-slate-100 flex flex-col bg-white overflow-y-auto shrink-0 z-20 shadow-lg">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">INCIDENT ID: {selectedAlert.id.slice(0, 8)}</span>
                  <h3 className="font-bold text-base text-slate-800 leading-tight mt-0.5">{selectedAlert.userName}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAlertId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 font-semibold transition"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Alert Latitude</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedAlert.latitude.toFixed(5)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Alert Longitude</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedAlert.longitude.toFixed(5)}</span>
                </div>
              </div>
            </div>

            {/* Core telemetry details tab */}
            <div className="flex-grow p-5 space-y-5 overflow-y-auto max-h-[500px]">
              
              {/* Medical profiles summary */}
              <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100/40 space-y-2">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-600" />
                  Medical Profile Summary
                </h4>
                <p className="text-xs text-rose-950 font-medium leading-relaxed bg-white/60 p-2 rounded border border-rose-100">
                  {selectedAlert.medicalSummary || "No critical allergies or chronic conditions noted on profile."}
                </p>
              </div>

              {/* Real-time automated escalation logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Escalation Chain Timeline
                </h4>
                <div className="space-y-3 relative border-l border-slate-200 pl-4 py-1">
                  {timelineEvents.map(evt => (
                    <div key={evt.id} className="text-xs relative">
                      {/* Circle bullet */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-slate-700 capitalize">{evt.type.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed bg-slate-50 p-1.5 rounded">{evt.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gemini AI Summary markdown block */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI Incident Debrief
                  </h4>
                  <button 
                    onClick={handleAIReview}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg py-1 px-2.5 transition shrink-0"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Analyze with Gemini
                      </>
                    )}
                  </button>
                </div>

                {aiReport && (
                  <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100 text-xs text-indigo-950 font-sans space-y-2 prose prose-sm max-h-[300px] overflow-y-auto">
                    <div className="whitespace-pre-line leading-relaxed font-normal">{aiReport}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Operator Actions bottom drawer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
              {selectedAlert.status !== "resolved" ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operator notes/drills log</label>
                    <input 
                      type="text" 
                      value={operatorNote}
                      onChange={(e) => setOperatorNote(e.target.value)}
                      placeholder="e.g. sector patrol team en route"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleEscalate}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition"
                    >
                      Escalate Threat
                    </button>
                    <button 
                      onClick={handleResolve}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition"
                    >
                      Resolve Alarm
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-100">
                  ✅ Incident marked closed & resolved by dispatcher.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {subTab === "incidents" && (
        <div className="flex-1 overflow-y-auto bg-slate-950 p-5">
          <IncidentLifecycle orgId="org-sa-tactical-01" users={users} onIncidentUpdated={refreshData} />
        </div>
      )}

      {subTab === "shifts" && (
        <div className="flex-1 overflow-y-auto bg-slate-950 p-5">
          <ShiftManagement orgId="org-sa-tactical-01" users={users} onShiftUpdated={refreshData} />
        </div>
      )}

      {subTab === "geofences" && (
        <div className="flex-1 overflow-y-auto bg-slate-950 p-5">
          <GeofenceEngine orgId="org-sa-tactical-01" users={users} onTriggerAlert={(msg) => refreshData()} />
        </div>
      )}

    </div>
  );
}
