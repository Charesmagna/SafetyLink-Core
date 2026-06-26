import React, { useEffect, useRef, useState } from "react";
import { 
  ShieldAlert, User, Phone, Heart, Clock, CheckCircle, RefreshCw, AlertTriangle, 
  ChevronRight, Sparkles, Filter, Users, MapPin, Activity, FileText, Compass,
  Radio, HardDrive, Cpu, Database, Eye, Terminal, Signal
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

  // Telemetry Flickering States
  const [telemetryBars, setTelemetryBars] = useState<number[]>([44, 55, 32, 60, 48, 70, 52, 65, 58, 42]);
  const [systemPing, setSystemPing] = useState(12);
  const [cpuLoad, setCpuLoad] = useState(24);
  const [satLinkState, setSatLinkState] = useState("SECURED");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  const selectedAlert = alerts.find(a => a.id === selectedAlertId);

  // Statistics loop to make the app feel alive and physical
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryBars(prev => {
        const next = [...prev];
        next.shift();
        next.push(Math.floor(Math.random() * 55) + 15);
        return next;
      });
      setSystemPing(p => Math.max(7, Math.min(22, p + Math.floor(Math.random() * 5) - 2)));
      setCpuLoad(c => Math.max(15, Math.min(42, c + Math.floor(Math.random() * 7) - 3)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!(window as any).L || !mapContainerRef.current) return;
    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");
      const defaultCenter: [number, number] = activeAlerts.length > 0 
        ? [activeAlerts[0].latitude, activeAlerts[0].longitude] 
        : [-26.2041, 28.0473]; // Johannesburg base
      const defaultZoom = activeAlerts.length > 0 ? 13 : 9;

      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      });

      // CartoDB Dark Matter tile layer for an incredibly premium dark theme feel
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
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
      let iconColor = "#ef4444"; 
      let className = "pulse-marker-active";

      if (alert.status === "escalated") {
        iconColor = "#f59e0b"; 
        className = "pulse-marker-escalated";
      } else if (alert.status === "resolved") {
        iconColor = "#10b981"; 
        className = "";
      }

      let markerIcon;
      if (alert.status !== "resolved") {
        markerIcon = L.divIcon({
          className: className,
          html: `<div style="width:16px;height:16px;background:${iconColor};border:2px solid #090d16;border-radius:50%;box-shadow:0 0 12px ${iconColor}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
      } else {
        markerIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#10b981;border:2px solid #020617;border-radius:50%;box-shadow:0 0 6px rgba(16,185,129,0.4)"></div>`,
          className: "",
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
      }

      const marker = L.marker([alert.latitude, alert.longitude], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 13px; line-height: 1.4; color:#fff; background:#020617; padding: 6px; border-radius: 8px;">
            <b style="color: #ef4444;">🚨 ${alert.userName}</b><br/>
            <span style="color: #94a3b8;">Status: <b>${alert.status.toUpperCase()}</b></span><br/>
            <span style="color: #10b981; font-size:10px;">GPS: ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}</span>
          </div>
        `);

      marker.on("click", () => {
        setSelectedAlertId(alert.id);
      });

      markersRef.current[alert.id] = marker;
    });

    // Plot security patrol vehicles (blue indicators)
    const baseLat = -26.2041;
    const baseLng = 28.0473;
    const responders = [
      { name: "Soweto Armed Response", lat: baseLat - 0.04, lng: baseLng - 0.05 },
      { name: "Pretoria East Tactical", lat: baseLat + 0.15, lng: baseLng + 0.08 },
      { name: "Sandton Patrol Cruiser", lat: baseLat + 0.05, lng: baseLng + 0.02 },
      { name: "Khayelitsha Safety Unit", lat: -34.03, lng: 18.67 } // WC
    ];

    responders.forEach((resp, idx) => {
      const respIcon = L.divIcon({
        html: `<div style="width:12px;height:12px;background:#3b82f6;border:2px solid #020617;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.8)"></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const m = L.marker([resp.lat, resp.lng], { icon: respIcon })
        .addTo(map)
        .bindPopup(`<div style="font-size:11px;color:#fff;"><b>👮 ${resp.name}</b><br/><span style="color:#3b82f6;">ACTIVE TELEMETRY LINK</span></div>`);
      
      markersRef.current[`resp-${idx}`] = m;
    });

    if (selectedAlert) {
      map.setView([selectedAlert.latitude, selectedAlert.longitude], 13, { animate: true });
    }
  }, [alerts, filterStatus, selectedAlertId]);

  // Sync timeline events when selecting alerts
  useEffect(() => {
    if (!selectedAlertId) return;
    setAiReport("");
    fetch(`/api/alerts/${selectedAlertId}/events`)
      .then(res => res.json())
      .then(data => setTimelineEvents(data))
      .catch(err => console.error(err));
  }, [selectedAlertId, alerts]);

  const handleAIReview = async () => {
    if (!selectedAlertId) return;
    setIsAiLoading(true);
    setAiReport("");
    try {
      const markdown = await onTriggerAISummary(selectedAlertId);
      setAiReport(markdown);
    } catch (err) {
      setAiReport("Failed to compile intelligence report from Gemini.");
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
    onResolveAlert(selectedAlertId, "Operations Commander");
  };

  const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "escalated");
  const filteredList = alerts.filter(a => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return a.status === "active" || a.status === "escalated";
    return a.status === "resolved";
  });

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-900 shadow-2xl overflow-hidden flex flex-col h-[820px] relative">
      
      {/* ADVANCED GLOWING BACKGROUND LIGHTS (Ambient Light Moving) */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none -z-10" />

      {/* Header operations bridge */}
      <div className="bg-slate-950/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-slate-900 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
            <Activity className="w-5.5 h-5.5 animate-pulse text-rose-500" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-wider font-mono text-slate-200 flex items-center gap-2">
              TACTICAL OPERATIONS COMMAND <span className="text-[9px] bg-rose-950 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-widest font-extrabold">SafetyLink Hub</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono font-bold">GRID MONITORS • 3D SPATIAL BLE TRANSCEIVER MATRIX • SOUTH AFRICA</p>
          </div>
        </div>

        {/* Global monitors ping */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 text-[10px] px-3.5 py-1.5 rounded-full text-slate-400 font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            {activeAlerts.length} SECTOR ALARMS PENDING
          </div>
          <button 
            onClick={refreshData}
            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-rose-400 rounded-xl transition border border-slate-800 cursor-pointer"
            title="Refresh satellite connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="bg-slate-950/90 border-b border-slate-900 px-6 py-2 flex flex-wrap gap-2 shrink-0 z-10">
        <button
          onClick={() => setSubTab("map")}
          className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-black px-4 py-2 rounded-xl border transition cursor-pointer ${
            subTab === "map"
              ? "bg-rose-950/30 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Signal className="w-3.5 h-3.5" />
          Tactical Grid Map
        </button>
        <button
          onClick={() => setSubTab("incidents")}
          className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-black px-4 py-2 rounded-xl border transition cursor-pointer ${
            subTab === "incidents"
              ? "bg-rose-950/30 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Incident Lifecycle Log
        </button>
        <button
          onClick={() => setSubTab("shifts")}
          className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-black px-4 py-2 rounded-xl border transition cursor-pointer ${
            subTab === "shifts"
              ? "bg-rose-950/30 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Shift Roster
        </button>
        <button
          onClick={() => setSubTab("geofences")}
          className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-black px-4 py-2 rounded-xl border transition cursor-pointer ${
            subTab === "geofences"
              ? "bg-rose-950/30 border-rose-500 text-rose-400 font-mono"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Geo-Fences
        </button>
      </div>

      <div className={`flex-1 ${subTab === "map" ? "flex" : "hidden"} overflow-hidden`}>
        
        {/* Left Side: Incident Feeds */}
        <div className="w-[280px] border-r border-slate-900 flex flex-col bg-slate-950 shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-900 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
              <span>ACTIVE SOS SENSORS</span>
              <Filter className="w-3.5 h-3.5" />
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl text-[9px] font-bold font-mono">
              <button 
                onClick={() => setFilterStatus("all")}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === "all" ? 'bg-slate-850 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
              >
                ALL
              </button>
              <button 
                onClick={() => setFilterStatus("active")}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === "active" ? 'bg-slate-850 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
              >
                ACTIVE ({activeAlerts.length})
              </button>
              <button 
                onClick={() => setFilterStatus("resolved")}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === "resolved" ? 'bg-slate-850 text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
              >
                RESOLVED
              </button>
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-900 overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-slate-600 italic font-mono">
                No active alarms in sector database.
              </div>
            ) : (
              filteredList.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 text-left cursor-pointer transition-all border-l-4 ${selectedAlertId === alert.id ? 'bg-rose-950/20 border-rose-500' : 'hover:bg-slate-900/40 border-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-extrabold text-xs text-slate-300">{alert.userName}</span>
                    <span className={`text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${alert.status === 'resolved' ? 'bg-emerald-950 text-emerald-400' : alert.status === 'escalated' ? 'bg-amber-950 text-amber-400 animate-pulse' : 'bg-rose-950 text-rose-400 animate-pulse'}`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    {getClosestSouthAfricanCity(alert.latitude, alert.longitude)}
                  </p>
                  <p className="text-[8px] text-slate-600 mt-1 font-mono">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle: Leaflet Map Container with subtle neon border */}
        <div className="flex-grow relative h-full bg-slate-950 border-r border-slate-900">
          <div ref={mapContainerRef} className="absolute inset-0 z-10" />
        </div>

        {/* Right Side: Highly Advanced operator telemetry cockpit with 3D Radar scanning */}
        <div className="w-[320px] border-l border-slate-900 flex flex-col bg-slate-950 shrink-0 overflow-y-auto space-y-4 p-4">
          
          {/* REALISTIC 3D RADAR SCANNER ANIMATION */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 text-center relative overflow-hidden flex flex-col items-center justify-center">
            <style>{`
              @keyframes rotate-radar {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes rotate-3d-grid {
                0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); }
                100% { transform: rotateX(60deg) rotateY(0deg) rotateZ(360deg); }
              }
              .radar-sweep {
                animation: rotate-radar 4s linear infinite;
              }
              .grid-3d-wireframe {
                transform-style: preserve-3d;
                animation: rotate-3d-grid 15s linear infinite;
              }
            `}</style>
            
            <div className="absolute top-1.5 left-2 bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 text-[7px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase font-mono">
              3D GATT SPATIAL BEACON SCANNER
            </div>

            {/* Glowing 3D Wireframe Grid Graphic */}
            <div className="w-32 h-32 relative mt-4 mb-2 flex items-center justify-center rounded-full border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
              {/* Radial scanning sweep */}
              <div className="absolute inset-0 bg-conic-gradient-radar radar-sweep opacity-20 pointer-events-none" style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(59,130,246,0.8) 100%)" }} />
              
              {/* 3D spinning wireframe matrix */}
              <div className="absolute w-24 h-24 border border-dashed border-indigo-500/20 rounded-full grid-3d-wireframe flex items-center justify-center">
                <div className="w-20 h-20 border border-indigo-500/10 rounded-full" />
                <div className="w-12 h-12 border border-indigo-500/30 rounded-full" />
                <div className="w-4 h-4 bg-rose-500/40 rounded-full animate-ping absolute" />
                {/* Simulated physical tags inside grid */}
                <span className="absolute top-2 left-6 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_#34d399]" />
                <span className="absolute bottom-4 right-6 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_4px_#f87171] animate-pulse" />
              </div>
            </div>

            <div className="text-left w-full space-y-1 mt-1 font-mono">
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>RADAR GATEWAY STATUS:</span>
                <span className="text-emerald-400 font-bold">100% NOMINAL</span>
              </div>
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>BEACON SIGNAL TYPE:</span>
                <span className="text-indigo-400 font-bold">BLE GATT HARTBEAT</span>
              </div>
            </div>
          </div>

          {/* FLICKERING BARGRAPH STATS PANEL */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest font-mono block">
              REAL-TIME COMM METRICS (FLICKS)
            </span>

            {/* Simulated Live Bar Chart with fluctuations */}
            <div className="h-16 flex items-end gap-1.5 pt-2 px-1">
              {telemetryBars.map((bar, idx) => (
                <div key={idx} className="flex-1 bg-slate-950 h-full rounded-t-lg flex flex-col justify-end overflow-hidden">
                  <div 
                    className="bg-emerald-500/60 hover:bg-rose-500/80 transition-all duration-300 w-full"
                    style={{ height: `${bar}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-left pt-1 font-mono">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                <span className="text-[6.5px] text-slate-500 font-bold uppercase block tracking-wider">SECURE SATELLITE PING</span>
                <span className="text-xs font-black text-emerald-400">{systemPing} ms</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                <span className="text-[6.5px] text-slate-500 font-bold uppercase block tracking-wider">GATEWAY NODE CPU LOAD</span>
                <span className="text-xs font-black text-indigo-400">{cpuLoad}%</span>
              </div>
            </div>
          </div>

          {/* LIVE STREAM OPERATOR FEEDS GRID (Random Thumbnails Alive) */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest font-mono block flex items-center justify-between">
              <span>LIVE PARAMEDIC & WATCH FEEDS</span>
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Feed 1 */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 relative group overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=120&h=80&q=80" 
                  alt="GP Patrol" 
                  className="w-full h-14 object-cover rounded-lg opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/75 px-1 py-0.5 rounded text-[6px] font-bold text-rose-400 uppercase tracking-widest leading-none">
                  GP_PATROL_04
                </div>
                <div className="absolute bottom-1 right-1.5 text-[5.5px] font-mono text-slate-400 bg-black/40 px-1 rounded font-bold">
                  26.204S
                </div>
              </div>

              {/* Feed 2 */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 relative group overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1516513809596-e233b54d33a2?auto=format&fit=crop&w=120&h=80&q=80" 
                  alt="WC Control" 
                  className="w-full h-14 object-cover rounded-lg opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/75 px-1 py-0.5 rounded text-[6px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                  WC_AIR_RESCUE
                </div>
                <div className="absolute bottom-1 right-1.5 text-[5.5px] font-mono text-slate-400 bg-black/40 px-1 rounded font-bold">
                  33.924S
                </div>
              </div>

              {/* Feed 3 */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 relative group overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=120&h=80&q=80" 
                  alt="KZN Patrol" 
                  className="w-full h-14 object-cover rounded-lg opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/75 px-1 py-0.5 rounded text-[6px] font-bold text-indigo-400 uppercase tracking-widest leading-none">
                  KZN_K9_02
                </div>
                <div className="absolute bottom-1 right-1.5 text-[5.5px] font-mono text-slate-400 bg-black/40 px-1 rounded font-bold">
                  29.858S
                </div>
              </div>

              {/* Feed 4 */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 relative group overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=80&q=80" 
                  alt="Venda Node" 
                  className="w-full h-14 object-cover rounded-lg opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/75 px-1 py-0.5 rounded text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  LP_VENDA_GATEWAY
                </div>
                <div className="absolute bottom-1 right-1.5 text-[5.5px] font-mono text-emerald-400 bg-black/40 px-1 rounded font-bold animate-pulse">
                  ONLINE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel inside maps */}
      {subTab === "map" && selectedAlert && (
        <div className="absolute right-0 top-[114px] bottom-0 w-[380px] bg-slate-950 border-l border-slate-900 flex flex-col overflow-y-auto z-20 shadow-2xl">
          <div className="p-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">ALERT DISPATCH CONSOLE</span>
                <h3 className="font-extrabold text-base text-slate-200 mt-0.5">{selectedAlert.userName}</h3>
              </div>
              <button 
                onClick={() => setSelectedAlertId(null)}
                className="text-[9px] text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg px-2.5 py-1 font-bold font-mono transition cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 text-[10px] font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-850">
                <span className="text-slate-500 block mb-0.5">Latitude</span>
                <span className="font-semibold text-slate-300">{selectedAlert.latitude.toFixed(5)}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-850">
                <span className="text-slate-500 block mb-0.5">Longitude</span>
                <span className="font-semibold text-slate-300">{selectedAlert.longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {/* Medical Profiles */}
            <div className="bg-rose-950/30 rounded-2xl p-4 border border-rose-500/20 space-y-2">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Heart className="w-4 h-4 text-rose-500" />
                Medical Biodata
              </h4>
              <p className="text-[11px] text-rose-200 font-medium leading-relaxed bg-slate-950 p-3 rounded-xl border border-rose-950/50">
                {selectedAlert.medicalSummary || "No critical allergies or chronic conditions noted on profile."}
              </p>
            </div>

            {/* Escalation timeline */}
            <div className="space-y-3 font-mono">
              <h4 className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                <Clock className="w-4 h-4 text-slate-500" />
                Escalation Timeline Logs
              </h4>
              <div className="space-y-3 relative border-l border-slate-850 pl-4 py-1 text-[10px]">
                {timelineEvents.map(evt => (
                  <div key={evt.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-slate-950 shadow-sm" />
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-slate-300 capitalize">{evt.type.replace('_', ' ')}</span>
                      <span className="text-[8px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-500 leading-normal bg-slate-900/40 p-2 rounded-xl border border-slate-850">{evt.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI intelligence report summary */}
            <div className="border-t border-slate-900 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest font-mono">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Gemini Dispatch intelligence
                </h4>
                <button 
                  onClick={handleAIReview}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 text-[9.5px] font-bold bg-indigo-950 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl py-1 px-3 transition cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Analyze SOS
                    </>
                  )}
                </button>
              </div>

              {aiReport && (
                <div className="bg-indigo-950/20 rounded-2xl p-4 border border-indigo-500/20 text-xs text-indigo-200 font-sans space-y-2 max-h-[300px] overflow-y-auto">
                  <div className="whitespace-pre-line leading-relaxed">{aiReport}</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-slate-900 bg-slate-950 shrink-0 space-y-3">
            {selectedAlert.status !== "resolved" ? (
              <>
                <div className="space-y-1">
                  <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">Operator Action Log</label>
                  <input 
                    type="text" 
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    placeholder="e.g. Armed patrol dispatched"
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleEscalate}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase font-mono py-2 px-3 rounded-xl transition cursor-pointer"
                  >
                    Escalate Threat
                  </button>
                  <button 
                    onClick={handleResolve}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase font-mono py-2 px-3 rounded-xl transition cursor-pointer"
                  >
                    Resolve Alarm
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-2.5 bg-emerald-950/30 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20">
                ✅ RESOLVED BY COMMAND COMMANDER
              </div>
            )}
          </div>
        </div>
      )}

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
