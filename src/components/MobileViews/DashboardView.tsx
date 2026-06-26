import React from "react";
import { Shield, MapPin, RefreshCw, Bluetooth, MessageSquare, VolumeX, Heart, Flame, ShieldAlert, CheckCircle2 } from "lucide-react";
import { User, Organization, Alert, HardwareDevice } from "../../types";

interface DashboardViewProps {
  currentUser: User;
  provOrg: Organization | null;
  gpsLatitude: number;
  gpsLongitude: number;
  getClosestSouthAfricanCity: (lat: number, lng: number) => string;
  isGpsLoading: boolean;
  simulateNewGps: () => void;
  myPairedHardware: HardwareDevice[];
  alerts: Alert[];
  offlineQueue: any[];
  simulatedNetwork: "online" | "offline";
  onLogout: () => void;
  onInstantEmergency: (type: "standard" | "silent" | "medical" | "fire" | "security", notes?: string) => void;
  setGpsLatitude: (lat: number) => void;
  setGpsLongitude: (lng: number) => void;
  setActiveScreen: (screen: string) => void;
  batteryLevel?: number;
}

export default function DashboardView({
  currentUser,
  provOrg,
  gpsLatitude,
  gpsLongitude,
  getClosestSouthAfricanCity,
  isGpsLoading,
  simulateNewGps,
  myPairedHardware,
  alerts,
  offlineQueue,
  simulatedNetwork,
  onLogout,
  onInstantEmergency,
  setGpsLatitude,
  setGpsLongitude,
  setActiveScreen,
  batteryLevel = 98,
}: DashboardViewProps) {
  // Recent alert
  const latestAlert = alerts[0];

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4">
      {/* Top Welcome Card */}
      <div className="bg-slate-950/80 p-4 rounded-3xl border border-slate-800/60 flex items-center justify-between shadow-lg">
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
              SHIELD ACTIVE
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {simulatedNetwork === "online" ? "● CELLULAR LTE" : "🚨 OFFLINE MODE"}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white mt-1.5 leading-tight">{currentUser.name}</h3>
          <p className="text-[10px] text-slate-400 font-medium">Role: {currentUser.role} • Gauteng Sec. Watch</p>
        </div>
        <button
          onClick={onLogout}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition border border-slate-850 cursor-pointer"
          title="Disconnect and de-provision device"
        >
          <Shield className="w-4.5 h-4.5 text-rose-500" />
        </button>
      </div>

      {/* Grid of Telemetry Widgets */}
      <div className="grid grid-cols-2 gap-3">
        {/* BLE Wearable Status */}
        <div 
          onClick={() => setActiveScreen("screen-ble-scanner")}
          className={`p-3.5 rounded-2xl border text-left space-y-2 transition-all duration-300 cursor-pointer hover:border-blue-500/50 hover:bg-slate-900/40 ${
            myPairedHardware.length === 0
              ? "bg-slate-950/40 border-slate-850/60"
              : batteryLevel === 98
                ? "bg-slate-950/40 border-slate-850/60"
                : batteryLevel === 15
                  ? "bg-amber-950/20 border-amber-500/30 animate-pulse"
                  : "bg-rose-950/20 border-rose-500/30"
          }`}
          title="Click to manage physical iTAG beacons"
        >
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono">BLE DEVICE</span>
            <Bluetooth className={`w-3.5 h-3.5 ${
              myPairedHardware.length === 0
                ? "text-slate-600"
                : batteryLevel === 98
                  ? "text-blue-400"
                  : batteryLevel === 15
                    ? "text-amber-400"
                    : "text-rose-500"
            }`} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-200">
              {myPairedHardware.length === 0
                ? "Disconnected"
                : batteryLevel === 98
                  ? `${myPairedHardware.length} Connected`
                  : batteryLevel === 15
                    ? "Throttled (Low Power)"
                    : "Suspended (Crit)"}
            </p>
            <p className="text-[8.5px] text-slate-500 mt-0.5 font-medium leading-none">
              {myPairedHardware.length === 0
                ? "Physical keyfob unmapped"
                : batteryLevel === 98
                  ? "iTAG Handshake Secured"
                  : batteryLevel === 15
                    ? "GATT polling restricted to 10s"
                    : "Keep-alive lost! Beacon beeping."}
            </p>
          </div>
        </div>

        {/* Database Sync Status */}
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850/60 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono">DATABASE CACHE</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-200">
              {offlineQueue.length > 0 ? `${offlineQueue.length} Queued` : "Synchronized"}
            </p>
            <p className="text-[8px] text-slate-500 mt-0.5 font-medium leading-none">
              {offlineQueue.length > 0 ? "Stored in local SQL queue" : "No unsynced incidents"}
            </p>
          </div>
        </div>
      </div>

      {/* GPS Staging Area & Location Mapping */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800/80 space-y-3 shadow-inner">
        <div className="flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-rose-500 rounded-xl border border-slate-850">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider font-mono">GPS Telemetry Engine</span>
              <span className="font-extrabold text-sm text-slate-100">
                {getClosestSouthAfricanCity(gpsLatitude, gpsLongitude)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-slate-500 font-semibold bg-slate-900 px-2 py-1 rounded">
              {gpsLatitude.toFixed(4)}, {gpsLongitude.toFixed(4)}
            </span>
            <button
              onClick={simulateNewGps}
              disabled={isGpsLoading}
              className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-emerald-400 transition ml-0.5 border border-transparent hover:border-slate-800 cursor-pointer"
              title="Simulate slight movement / jitter"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? "animate-spin text-emerald-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* SA Staging Sector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900/40 p-2 rounded-xl border border-slate-850/60 text-left">
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono shrink-0">Staging Sector:</span>
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const [latStr, lngStr] = e.target.value.split(",");
              setGpsLatitude(parseFloat(latStr));
              setGpsLongitude(parseFloat(lngStr));
            }}
            className="flex-1 bg-slate-950 text-slate-300 text-xs border border-slate-850 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer font-sans"
          >
            <option value="">-- Jump to SA City/Town --</option>
            <option value="-26.2041,28.0473">Johannesburg, GP (Center)</option>
            <option value="-26.3085,27.8344">Lenasia, GP (HQ Sector)</option>
            <option value="-26.2678,27.8585">Soweto, GP</option>
            <option value="-26.1076,28.0567">Sandton, GP</option>
            <option value="-25.7479,28.2293">Pretoria, GP</option>
            <option value="-33.9249,18.4241">Cape Town, WC</option>
            <option value="-34.0485,18.6052">Mitchells Plain, WC</option>
            <option value="-29.8587,31.0218">Durban, KZN</option>
            <option value="-33.9608,25.6022">Port Elizabeth, EC</option>
            <option value="-29.1181,26.2241">Bloemfontein, FS</option>
          </select>
        </div>
      </div>

      {/* Recent Incident Feed Preview */}
      <div className="bg-slate-950/60 p-4 rounded-3xl border border-slate-850 text-left space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Live Monitoring Channel</span>
          <button 
            onClick={() => setActiveScreen("screen-incidents")}
            className="text-[9px] font-extrabold text-blue-400 hover:text-blue-300"
          >
            VIEW INCIDENTS →
          </button>
        </div>

        {latestAlert ? (
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${latestAlert.status === "resolved" ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`}></span>
                <span className="font-extrabold text-xs text-slate-200 uppercase">{latestAlert.userName}</span>
              </div>
              <p className="text-[9px] text-slate-500 font-mono">
                Triggered: {new Date(latestAlert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {getClosestSouthAfricanCity(latestAlert.latitude, latestAlert.longitude)}
              </p>
            </div>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded font-mono uppercase border ${
              latestAlert.status === "resolved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
            }`}>
              {latestAlert.status}
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic py-1 text-center font-mono">No recent distress broadcasts detected in sector.</p>
        )}
      </div>

      {/* Emergency Shortcuts / Fast Panic Trigger Matrix */}
      <div className="space-y-2.5 text-left">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">Instant Command Shortcuts</span>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Silent Panic */}
          <button
            onClick={() => onInstantEmergency("silent", "Discrete silent emergency triggered via dashboard fast-shortcut.")}
            className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 transition active:scale-95 text-left cursor-pointer shadow"
          >
            <div className="p-2 bg-slate-950 text-slate-400 rounded-xl">
              <VolumeX className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Silent Panic</p>
              <p className="text-[8px] text-slate-500 font-medium">Discrete channel</p>
            </div>
          </button>

          {/* Medical Dispatch */}
          <button
            onClick={() => onInstantEmergency("medical", "Medical ambulance dispatch needed immediately.")}
            className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 transition active:scale-95 text-left cursor-pointer shadow"
          >
            <div className="p-2 bg-slate-950 text-slate-400 rounded-xl">
              <Heart className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Medical EMS</p>
              <p className="text-[8px] text-slate-500 font-medium">ER24 / Netcare</p>
            </div>
          </button>

          {/* Fire Trigger */}
          <button
            onClick={() => onInstantEmergency("fire", "Local Fire and Rescue truck needed immediately.")}
            className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 transition active:scale-95 text-left cursor-pointer shadow"
          >
            <div className="p-2 bg-slate-950 text-slate-400 rounded-xl">
              <Flame className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Fire & Rescue</p>
              <p className="text-[8px] text-slate-500 font-medium">Local brigade</p>
            </div>
          </button>

          {/* Armed Security */}
          <button
            onClick={() => onInstantEmergency("security", "Armed response and tactical patrols needed immediately.")}
            className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-850 rounded-2xl border border-slate-850 transition active:scale-95 text-left cursor-pointer shadow"
          >
            <div className="p-2 bg-slate-950 text-slate-400 rounded-xl">
              <ShieldAlert className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Security / SAPS</p>
              <p className="text-[8px] text-slate-500 font-medium">Armed tactical</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
