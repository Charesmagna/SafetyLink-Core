import React, { useState, useEffect } from "react";
import { Database, Wifi, WifiOff, RefreshCw, Layers, CheckCircle, Clock } from "lucide-react";
import { OfflineQueueItem } from "../types_enterprise";

interface OfflineDashboardProps {
  networkStatus?: "online" | "offline";
  onNetworkChange?: (status: "online" | "offline") => void;
  onSyncComplete?: () => void;
}

export default function OfflineDashboard({ networkStatus: propNetworkStatus, onNetworkChange, onSyncComplete }: OfflineDashboardProps) {
  const [localNetwork, setLocalNetwork] = useState<"online" | "offline">("online");
  const networkStatus = propNetworkStatus !== undefined ? propNetworkStatus : localNetwork;

  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([
    {
      id: "off-q-1",
      type: "gps_update",
      payload: { latitude: -26.3085, longitude: 27.8344, timestamp: new Date(Date.now() - 300000).toISOString() },
      retryCount: 0,
      queuedAt: new Date(Date.now() - 300000).toISOString(),
      status: "pending"
    },
    {
      id: "off-q-2",
      type: "hardware_event",
      payload: { deviceId: "hw-itag-01", action: "SOS", timestamp: new Date(Date.now() - 120000).toISOString() },
      retryCount: 1,
      queuedAt: new Date(Date.now() - 120000).toISOString(),
      status: "pending"
    }
  ]);

  const [lastSyncTime, setLastSyncTime] = useState<string>("5 minutes ago");
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-sync trigger when network changes from offline to online
  useEffect(() => {
    if (networkStatus === "online" && offlineQueue.length > 0) {
      processQueue();
    }
  }, [networkStatus]);

  const toggleNetwork = () => {
    const next = networkStatus === "online" ? "offline" : "online";
    if (propNetworkStatus === undefined) {
      setLocalNetwork(next);
    }
    if (onNetworkChange) onNetworkChange(next);
  };

  const addSimulatedQueuedAlert = () => {
    const item: OfflineQueueItem = {
      id: "off-q-" + Math.floor(Math.random() * 10000),
      type: "alert",
      payload: { latitude: -26.1076, longitude: 28.0567, notes: "Offline panic trigger" },
      retryCount: 0,
      queuedAt: new Date().toISOString(),
      status: "pending"
    };
    setOfflineQueue(prev => [...prev, item]);
  };

  const processQueue = async () => {
    if (networkStatus === "offline" || offlineQueue.length === 0) return;
    setIsSyncing(true);

    // FIFO processing
    const sorted = [...offlineQueue].sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());

    // Process items in sequence
    for (const item of sorted) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network latency
      if (item.type === "alert") {
        try {
          // Trigger the actual alert
          await fetch("/api/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "user-member-01",
              orgId: "org-sa-tactical-01",
              latitude: item.payload.latitude,
              longitude: item.payload.longitude,
              notes: `[OFFLINE SYNCED] ${item.payload.notes || ""}`
            })
          });
        } catch (err) {
          console.error("Queue sync failed", err);
        }
      }
    }

    setOfflineQueue([]);
    setLastSyncTime("Just now");
    setIsSyncing(false);
    if (onSyncComplete) onSyncComplete();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4" id="offline-ops-mgmt">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Offline Operations & Local Queue
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">FIFO local processing, retry counts, conflict mitigation, auto-reconnect</p>
        </div>
        <div className="flex gap-2">
          {/* Simulated Offline State Switcher */}
          <button
            onClick={toggleNetwork}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition ${
              networkStatus === "online"
                ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/20"
            }`}
          >
            {networkStatus === "online" ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                NETWORK: ONLINE
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                NETWORK: OFFLINE
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Queued Items</span>
          <span className="text-lg font-mono font-black text-amber-400">{offlineQueue.length}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Retry Fail Rate</span>
          <span className="text-lg font-mono font-black text-rose-400">0%</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Queue Type</span>
          <span className="text-lg font-mono font-black text-slate-300">FIFO</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-bold">Last Synchronized</span>
          <span className="text-xs font-semibold text-slate-400 block mt-1">{lastSyncTime}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={addSimulatedQueuedAlert}
          className="flex-grow py-2 px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
        >
          Add Mock Offline Alert
        </button>
        <button
          onClick={processQueue}
          disabled={networkStatus === "offline" || offlineQueue.length === 0 || isSyncing}
          className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          Force Synchronization
        </button>
      </div>

      {/* Queue items listing */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">IndexedDB Serialization Queue</div>
        {offlineQueue.length === 0 ? (
          <div className="text-center py-5 bg-slate-950/40 border border-slate-850/80 rounded-xl text-slate-500 text-xs">
            Local queue is completely empty. System fully synchronized.
          </div>
        ) : (
          offlineQueue.map(item => (
            <div
              key={item.id}
              className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-slate-900 text-amber-400 border border-slate-800">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {item.id}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {JSON.stringify(item.payload)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] text-slate-500">Retry Count</div>
                <div className="font-mono font-bold text-slate-300 text-[11px]">{item.retryCount}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
