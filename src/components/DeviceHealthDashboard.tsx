import React, { useState, useEffect } from "react";
import { Activity, Battery, Bluetooth, MapPin, AlertCircle, RefreshCw, Radio } from "lucide-react";
import { DeviceHeartbeat } from "../types_enterprise";
import { HardwareDevice, User } from "../types";

interface DeviceHealthDashboardProps {
  hardware: HardwareDevice[];
  users: User[];
  refreshData?: () => void;
}

export default function DeviceHealthDashboard({ hardware, users, refreshData }: DeviceHealthDashboardProps) {
  const [heartbeats, setHeartbeats] = useState<DeviceHeartbeat[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Poll heartbeat states from the database or simulate
  const fetchHeartbeats = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/heartbeats");
      const data = await res.json();
      setHeartbeats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchHeartbeats();
    const interval = setInterval(fetchHeartbeats, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, []);

  // Trigger a manual Heartbeat transaction (every 60s is standard)
  const triggerManualHeartbeat = async (device: HardwareDevice) => {
    try {
      const userObj = users.find(u => u.id === device.assignedUserId);
      const randomBattery = Math.max(5, device.batteryLevel - Math.floor(Math.random() * 2));
      const randomRssi = -50 - Math.floor(Math.random() * 45);
      
      // South African coordinate mapping
      const lat = -26.3085 + (Math.random() - 0.5) * 0.05;
      const lng = 27.8344 + (Math.random() - 0.5) * 0.05;

      let connectionStatus: "Connected" | "Weak Signal" | "Out of Range" | "Offline" | "Fault" = "Connected";
      if (randomRssi < -85) {
        connectionStatus = "Weak Signal";
      } else if (randomBattery < 10) {
        connectionStatus = "Fault";
      }

      await fetch("/api/heartbeats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: device.id,
          batteryPercent: randomBattery,
          rssi: randomRssi,
          connectionStatus,
          latitude: lat,
          longitude: lng,
          orgId: device.organizationId,
          userId: device.assignedUserId
        })
      });
      fetchHeartbeats();
      if (refreshData) refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // Status Badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Connected":
        return <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-800">Connected</span>;
      case "Weak Signal":
        return <span className="text-[10px] bg-amber-950 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-800">Weak Signal</span>;
      case "Out of Range":
        return <span className="text-[10px] bg-rose-950 text-rose-400 font-mono font-bold px-2 py-0.5 rounded border border-rose-800">Out of Range</span>;
      case "Offline":
        return <span className="text-[10px] bg-slate-900 text-slate-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">Offline</span>;
      case "Fault":
        return <span className="text-[10px] bg-red-950 text-red-400 font-mono font-bold px-2 py-0.5 rounded border border-red-800">Fault</span>;
      default:
        return <span className="text-[10px] bg-slate-900 text-slate-400 font-mono font-bold px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="device-health-mgmt">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-blue-400" />
            BLE Fleet Health Management
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical telemetry heartbeats (60s loop status, RSSI, Battery level)</p>
        </div>
        <button
          onClick={fetchHeartbeats}
          className="p-1.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-slate-300 hover:text-blue-400 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Heartbeat Escalation Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 text-xs">
        <div className="flex gap-2 items-start text-slate-400">
          <span className="p-1 rounded bg-amber-950 text-amber-400 font-bold text-[9px] mt-0.5 font-mono shrink-0">2 MINS</span>
          <div>
            <p className="font-bold text-slate-200">Warning State</p>
            <p className="text-[10px]">Triggers warnings in the Dispatch logs.</p>
          </div>
        </div>
        <div className="flex gap-2 items-start text-slate-400 border-t md:border-t-0 md:border-x border-slate-800/80 pt-2 md:pt-0 md:px-3">
          <span className="p-1 rounded bg-rose-950 text-rose-400 font-bold text-[9px] mt-0.5 font-mono shrink-0">5 MINS</span>
          <div>
            <p className="font-bold text-slate-200">Offline state</p>
            <p className="text-[10px]">Status falls back to Offline in systems.</p>
          </div>
        </div>
        <div className="flex gap-2 items-start text-slate-400 border-t md:border-t-0 pt-2 md:pt-0">
          <span className="p-1 rounded bg-red-950 text-red-400 font-bold text-[9px] mt-0.5 font-mono shrink-0">10 MINS</span>
          <div>
            <p className="font-bold text-slate-200">Critical Alert</p>
            <p className="text-[10px]">Triggers an automatic emergency response ticket.</p>
          </div>
        </div>
      </div>

      {/* Grid of registered hardware with live status */}
      <div className="space-y-3">
        {hardware.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
            No devices currently enrolled in the BLE tracking registry.
          </div>
        ) : (
          hardware.map(device => {
            const hb = heartbeats.find(h => h.deviceId === device.id || h.deviceId === device.deviceId);
            const user = users.find(u => u.id === device.assignedUserId);
            
            // Calculate time elapsed
            let timeString = "No heartbeats logged";
            let state: string = hb ? hb.connectionStatus : "Offline";
            
            if (hb) {
              const diffMs = Date.now() - new Date(hb.lastSeen).getTime();
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins === 0) {
                timeString = "Just now";
              } else {
                timeString = `${diffMins}m ago`;
              }

              // Overriding state based on heartbeat age
              if (diffMins >= 10) {
                state = "Fault";
              } else if (diffMins >= 5) {
                state = "Offline";
              } else if (diffMins >= 2) {
                state = "Weak Signal";
              }
            }

            return (
              <div
                key={device.id}
                className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-900 border border-slate-800 text-blue-400 rounded-lg shadow-inner shrink-0">
                    <Bluetooth className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs text-slate-200">{device.name}</h5>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        MAC: {device.deviceId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[10px] text-slate-400 mt-1.5">
                      <div>Assigned User: <span className="font-bold text-slate-300">{user ? user.name : "Unassigned"}</span></div>
                      <div className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-slate-500" />
                        Battery: <span className={`font-bold ${device.batteryLevel < 20 ? "text-red-400" : "text-emerald-400"}`}>{device.batteryLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-slate-500" />
                        RSSI: <span className="font-bold text-blue-300">{device.rssi || -75} dBm</span>
                      </div>
                    </div>
                    {hb && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        Last Location: <span className="font-mono text-slate-400">{hb.latitude.toFixed(4)}, {hb.longitude.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-bold">Status</span>
                    <div className="mt-0.5">{getStatusBadge(state)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-bold">Last Ping</span>
                    <span className="text-[10px] text-slate-300 font-mono font-semibold block mt-0.5">{timeString}</span>
                  </div>
                  <button
                    onClick={() => triggerManualHeartbeat(device)}
                    className="bg-blue-950 hover:bg-blue-900 text-blue-400 border border-blue-800 font-bold font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded transition shrink-0"
                  >
                    Simulate Ping
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
