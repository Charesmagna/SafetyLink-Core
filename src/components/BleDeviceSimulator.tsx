import React, { useState } from "react";
import { Bluetooth, Radio, Battery, ShieldAlert, CheckCircle, UserPlus, Trash2, Sliders, X, Search, Loader2, Signal, ShieldCheck, Play, RefreshCw, Power } from "lucide-react";
import { HardwareDevice, User } from "../types";
import DeviceHealthDashboard from "./DeviceHealthDashboard";
import OfflineDashboard from "./OfflineDashboard";

interface BleDeviceSimulatorProps {
  hardware: HardwareDevice[];
  users: User[];
  onAddDevice: (name: string, deviceId: string) => void;
  onAssignDevice: (deviceId: string, userId: string) => void;
  onUnassignDevice: (deviceId: string) => void;
  onDeleteDevice: (deviceId: string) => void;
  onTriggerHardwareSos: (deviceId: string) => void;
}

export default function BleDeviceSimulator({
  hardware,
  users,
  onAddDevice,
  onAssignDevice,
  onUnassignDevice,
  onDeleteDevice,
  onTriggerHardwareSos
}: BleDeviceSimulatorProps) {
  const [name, setName] = useState("iTAG Alert Button");
  const [mac, setMac] = useState("FF:E0:12:34:56:AB");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [rssiVal, setRssiVal] = useState<Record<string, number>>({});
  const [batteryVal, setBatteryVal] = useState<Record<string, number>>({});
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // iTAG Scanner Overlay State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discovered, setDiscovered] = useState<Array<{ name: string; mac: string; battery: number; rssi: number }>>([]);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [selectedUserForMac, setSelectedUserForMac] = useState<Record<string, string>>({});
  const [newlyRegisteredMacs, setNewlyRegisteredMacs] = useState<string[]>([]);

  const playBeep = (freq = 800, duration = 0.08) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  };

  const DISCOVERABLE_BEACONS = [
    { name: "iTAG Smart Keyfob v1.0", mac: "FF:E0:41:8B:D3:12", rssi: -58, battery: 94 },
    { name: "SafetyLink Wristband v2.1", mac: "FF:E0:A2:44:9E:81", rssi: -71, battery: 85 },
    { name: "iTAG Panic Button v1.0", mac: "FF:E0:B8:31:AA:6C", rssi: -82, battery: 100 },
    { name: "SirenLink Remote Keyfob", mac: "FF:E0:5F:90:3F:B4", rssi: -65, battery: 72 },
    { name: "iTAG SOS Micro Beacon", mac: "FF:E0:E9:12:4F:D3", rssi: -45, battery: 98 },
  ];

  const startScanning = () => {
    setIsScanning(true);
    setScanProgress(0);
    setDiscovered([]);
    setScanLogs(["[SYSTEM] Initializing BLE GATT Discovery Engine..."]);
    playBeep(600, 0.12);

    const logSteps = [
      { time: 400, log: "[RF] Tuning transceiver to 2.4GHz ISM Band..." },
      { time: 800, log: "[SCAN] Listening on primary advertising channels 37, 38, 39..." },
      { time: 1200, log: "[GATT] Scanning for Service UUID: 0xFFE0 (iTAG Controller)..." },
      { time: 1600, log: "[DISCOVER] Captured advertising packet from FF:E0:E9:12:4F:D3" },
      { time: 2200, log: "[DISCOVER] Captured advertising packet from FF:E0:41:8B:D3:12" },
      { time: 2800, log: "[DISCOVER] Captured advertising packet from FF:E0:A2:44:9E:81" },
      { time: 3400, log: "[DISCOVER] Captured advertising packet from FF:E0:5F:90:3F:B4" },
      { time: 4000, log: "[SYSTEM] Scan sequence complete. 4 beacons verified within range." },
    ];

    // Progress timer
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsScanning(false);
          playBeep(1000, 0.2);
          return 100;
        }
        return prev + 2.5; // reaches 100 in 40 steps (4000ms)
      });
    }, 100);

    // Staggered logs & discoveries
    logSteps.forEach(step => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, step.log]);
        
        // Add discovered devices progressively
        if (step.log.includes("FF:E0:E9:12:4F:D3")) {
          setDiscovered(prev => [...prev, DISCOVERABLE_BEACONS[4]]);
          playBeep(880, 0.05);
        } else if (step.log.includes("FF:E0:41:8B:D3:12")) {
          setDiscovered(prev => [...prev, DISCOVERABLE_BEACONS[0]]);
          playBeep(880, 0.05);
        } else if (step.log.includes("FF:E0:A2:44:9E:81")) {
          setDiscovered(prev => [...prev, DISCOVERABLE_BEACONS[1]]);
          playBeep(880, 0.05);
        } else if (step.log.includes("FF:E0:5F:90:3F:B4")) {
          setDiscovered(prev => [...prev, DISCOVERABLE_BEACONS[3]]);
          playBeep(880, 0.05);
        }
      }, step.time);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mac) return;
    onAddDevice(name, mac);
    // Reset or random MAC for next
    const randomHex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
    setMac(`FF:E0:${randomHex()}:${randomHex()}:${randomHex()}:${randomHex()}`);
  };

  const getRssiStrength = (rssi: number) => {
    if (rssi >= -60) return { label: "Excellent (Strong)", color: "text-emerald-400", bar: "bg-emerald-500 w-full" };
    if (rssi >= -75) return { label: "Good (Medium)", color: "text-teal-400", bar: "bg-teal-500 w-3/4" };
    if (rssi >= -90) return { label: "Fair (Weak)", color: "text-amber-400", bar: "bg-amber-500 w-1/2" };
    return { label: "Out of Range (Dead)", color: "text-rose-500", bar: "bg-rose-500 w-1/12" };
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-500/20 rounded-lg">
            <Bluetooth className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono uppercase tracking-wider text-white">BLE Hardware Button Emulator (iTAG)</h2>
            <p className="text-xs text-slate-400">Simulate physical hardware connections via Bluetooth Low Energy (FFE0 Service / FFE1 Characteristic)</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsScannerOpen(true);
            playBeep(700, 0.1);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-900/20 border border-blue-500/30 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Signal className="w-4 h-4 animate-pulse" />
          iTAG Signal Scanner
        </button>
      </div>

      {warningMsg && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 px-4 py-2.5 rounded-xl text-xs mb-4 flex items-center justify-between font-mono">
          <span>⚠️ {warningMsg}</span>
          <button onClick={() => setWarningMsg(null)} className="text-white hover:text-slate-300 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Provision new simulated device */}
        <div className="lg:col-span-4 bg-slate-950 rounded-xl p-5 border border-slate-800/80 h-fit">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 font-mono">
            <Radio className="w-4 h-4 text-emerald-400" />
            Provision Virtual BLE Button
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 font-mono">Device Profile / Model</label>
              <select 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="iTAG BLE Alert Button">iTAG Smart Button (v1.0)</option>
                <option value="SafetyLink wearable wristband">SafetyLink Wristband (v2.1)</option>
                <option value="SirenLink remote keyfob">SirenLink Keyfob (v3.0)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 font-mono">Simulated MAC Address</label>
              <input 
                type="text" 
                value={mac} 
                onChange={(e) => setMac(e.target.value)}
                placeholder="E.g. FF:E0:12:34:56:78"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg transition uppercase tracking-widest font-mono"
            >
              Add to Organization Pool
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-[10px] font-mono text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>Service UUID:</span>
              <span className="font-bold text-slate-400">0xFFE0</span>
            </div>
            <div className="flex justify-between">
              <span>Characteristic:</span>
              <span className="font-bold text-slate-400">0xFFE1</span>
            </div>
            <div className="flex justify-between">
              <span>Trigger Payload:</span>
              <span className="font-bold text-slate-400">0x01 (Panic)</span>
            </div>
          </div>
        </div>

        {/* Device Pool list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Registered Hardware Pool ({hardware.length})
          </h3>
          
          {hardware.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 rounded-xl border border-dashed border-slate-850 text-slate-500 text-xs italic font-mono">
              No physical BLE hardware devices are currently registered in this organization.
              <p className="text-[10px] text-slate-600 mt-1 not-italic">Use the provision form on the left to add a simulated button.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hardware.map((dev) => {
                const rssi = rssiVal[dev.id] !== undefined ? rssiVal[dev.id] : dev.rssi;
                const battery = batteryVal[dev.id] !== undefined ? batteryVal[dev.id] : dev.batteryLevel;
                const user = users.find(u => u.id === dev.assignedUserId);
                const rssiInfo = getRssiStrength(rssi);

                return (
                  <div 
                    key={dev.id} 
                    className={`border rounded-xl p-4 transition cursor-pointer ${
                      selectedDevice === dev.id 
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-md' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                    }`}
                    onClick={() => setSelectedDevice(dev.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 leading-tight font-mono">{dev.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{dev.deviceId}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        {battery}%
                      </div>
                    </div>

                    <div className="space-y-3 mb-4 font-mono">
                      {/* User Assignment status */}
                      <div className="text-[10px]">
                        <span className="text-slate-500">ASSIGNED TO:</span>{" "}
                        {user ? (
                          <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block">
                            {user.name} ({user.role})
                          </span>
                        ) : (
                          <span className="text-slate-500 italic bg-slate-900 px-2 py-0.5 rounded-md inline-block">Unassigned Pool</span>
                        )}
                      </div>

                      {/* Signal sliders */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-slate-600" />
                            SIGNAL RSSI
                          </span>
                          <span className={`font-mono font-bold ${rssiInfo.color}`}>{rssi} dBm</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" 
                            min="-100" 
                            max="-30" 
                            value={rssi} 
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setRssiVal(prev => ({ ...prev, [dev.id]: v }));
                            }}
                            className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>
                        <p className="text-[9px] text-slate-600 mt-1">{rssiInfo.label}</p>
                      </div>

                      {/* Battery slider */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>BATTERY EMULATOR</span>
                          <span className="font-mono font-bold text-slate-400">{battery}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={battery} 
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setBatteryVal(prev => ({ ...prev, [dev.id]: v }));
                          }}
                          className="w-full accent-slate-600 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (rssi <= -95) {
                            setWarningMsg("Device is out of range! Adjust the Signal strength RSSI slider first.");
                            return;
                          }
                          setWarningMsg(null);
                          onTriggerHardwareSos(dev.id);
                        }}
                        disabled={!user || rssi <= -95}
                        className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition ${
                          !user 
                            ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed' 
                            : rssi <= -95 
                              ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-rose-950 border border-rose-500/20 text-rose-400 hover:border-rose-400'
                        }`}
                        title={!user ? "Assign a user to this hardware button before triggering" : "Simulate physical click of this button"}
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Trigger SOS
                      </button>

                      <div className="flex items-center gap-1">
                        {user ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnassignDevice(dev.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 border border-slate-900 rounded-lg"
                            title="Unassign user"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={selectedUser}
                              onChange={(e) => setSelectedUser(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 max-w-[100px]"
                            >
                              <option value="">User...</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            <button
                              disabled={!selectedUser}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedUser) {
                                  onAssignDevice(dev.id, selectedUser);
                                  setSelectedUser("");
                                }
                              }}
                              className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded border border-slate-850"
                              title="Assign user"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDevice(dev.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-slate-900"
                          title="Delete device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ENTERPRISE HARDWARE OPERATIONS: FLEET HEALTH & OFFLINE QUEUE (Phases 4 & 9) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-800">
        <DeviceHealthDashboard hardware={hardware} users={users} />
        <OfflineDashboard />
      </div>

      {/* iTAG OTC SIGNAL SCANNER OVERLAY MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800/80 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-950 text-blue-400 border border-blue-500/20 rounded-lg">
                  <Bluetooth className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-white flex items-center gap-2">
                    iTAG Signal Scan & Handshake Overlay
                  </h3>
                  <p className="text-[10px] text-blue-400 font-mono">GATT ADV PROTOCOL • PROXIMITY DISCOVERY & PAIRING</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsScannerOpen(false);
                  setIsScanning(false);
                }} 
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-y-auto">
              
              {/* Left Side: Radar and Controls */}
              <div className="md:col-span-5 flex flex-col space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col items-center justify-center space-y-4 relative overflow-hidden min-h-[250px]">
                  
                  {/* Concentric Radar Sweeper Graphic */}
                  <div className="relative w-44 h-44 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                    {/* Concentric rings */}
                    <div className="absolute inset-2 rounded-full border border-slate-800/60" />
                    <div className="absolute inset-8 rounded-full border border-slate-850/40" />
                    <div className="absolute inset-16 rounded-full border border-slate-850/20" />
                    <div className="absolute inset-24 rounded-full border border-slate-900" />
                    
                    {/* Rotating scanning sweep line */}
                    {isScanning && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/35 animate-[spin_3s_linear_infinite]" />
                    )}

                    {/* Central radar pulsing point */}
                    <div className="relative z-10 p-4 bg-slate-900 rounded-full border border-slate-800 shadow-lg">
                      <Bluetooth className={`w-8 h-8 text-blue-400 ${isScanning ? "animate-pulse" : ""}`} />
                    </div>

                    {/* Simulated blips on radar when scanning */}
                    {isScanning && scanProgress > 30 && (
                      <span className="absolute top-8 right-12 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    )}
                    {isScanning && scanProgress > 50 && (
                      <span className="absolute bottom-10 left-10 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </div>

                  {/* Scanner controls */}
                  <div className="w-full text-center space-y-2">
                    {isScanning ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                          <span>AIRSPACE SWEEP PROGRESS</span>
                          <span className="text-blue-400 font-bold">{Math.round(scanProgress)}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-100 shadow-md shadow-blue-500/50" 
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={startScanning}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition shadow-lg shadow-blue-950/40 flex items-center justify-center gap-2 cursor-pointer border border-blue-500/30"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Start Airspace Scan
                      </button>
                    )}
                  </div>
                </div>

                {/* Diagnostics Terminal Logs */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 flex flex-col space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">RF TELEMETRY STREAM</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="h-32 overflow-y-auto font-mono text-[9px] text-blue-400 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                    {scanLogs.length === 0 ? (
                      <div className="text-slate-600 italic">No telemetry capture running. Click "Start Airspace Scan" to scan FFE0 characteristic.</div>
                    ) : (
                      scanLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-600">[{i+1}]</span>
                          <span className="break-all">{log}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Discovered Devices */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider font-sans text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Discovered BLE iTAG Beacons ({discovered.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">FFE0 ADV CHANNELS</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {discovered.length === 0 ? (
                    <div className="text-center py-20 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800/80 p-8 flex flex-col items-center justify-center space-y-3">
                      <Bluetooth className="w-12 h-12 text-slate-700 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-405">Airspace scan required</p>
                        <p className="text-[10px] text-slate-500 max-w-sm leading-normal">
                          Run a signal scan to search the 2.4GHz spectrum for nearby unbonded iTAG keyfobs and SafetyLink wristbands.
                        </p>
                      </div>
                    </div>
                  ) : (
                    discovered.map((beacon, idx) => {
                      // Look up registered hardware device
                      const regDev = hardware.find(h => h.deviceId === beacon.mac);
                      const isRegistered = !!regDev || newlyRegisteredMacs.includes(beacon.mac);
                      const user = regDev ? users.find(u => u.id === regDev.assignedUserId) : null;

                      // Dropdown user selection for assignment
                      const selectedUserForThisBeacon = selectedUserForMac[beacon.mac] || "";

                      return (
                        <div 
                          key={idx} 
                          className={`bg-slate-950 p-4 rounded-2xl border transition-all duration-300 ${
                            isRegistered 
                              ? user 
                                ? 'border-emerald-500/30 bg-emerald-950/5' 
                                : 'border-blue-500/30 bg-blue-950/5'
                              : 'border-slate-850 hover:border-slate-800'
                          }`}
                        >
                          {/* Top Row: Beacon Info */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border ${
                                isRegistered 
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}>
                                <Bluetooth className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-100 font-mono">{beacon.name}</h5>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{beacon.mac}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-850">
                                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                                {beacon.battery}%
                              </span>
                              <span className="flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-850">
                                <Signal className="w-3.5 h-3.5 text-blue-400" />
                                {beacon.rssi} dBm
                              </span>
                            </div>
                          </div>

                          {/* RSSI Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  beacon.rssi >= -60 
                                    ? "bg-emerald-500" 
                                    : beacon.rssi >= -75 
                                      ? "bg-blue-500" 
                                      : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.max(0, 100 + beacon.rssi)}%` }}
                              />
                            </div>
                          </div>

                          {/* Action area */}
                          <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 font-mono">
                            
                            {/* Device status badge */}
                            <div>
                              {!isRegistered ? (
                                <span className="text-[9px] font-bold text-amber-500 bg-amber-950/30 border border-amber-500/20 px-2.5 py-1 rounded-md">
                                  AIRSPACE AVAILABLE
                                </span>
                              ) : user ? (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-md flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  BONDED TO: {user.name}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2.5 py-1 rounded-md">
                                  POOL REGISTERED
                                </span>
                              )}
                            </div>

                            {/* Control button */}
                            <div className="flex items-center gap-2">
                              {!isRegistered ? (
                                <button
                                  onClick={() => {
                                    onAddDevice(beacon.name, beacon.mac);
                                    setNewlyRegisteredMacs(prev => [...prev, beacon.mac]);
                                    playBeep(1200, 0.18);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition shadow cursor-pointer border border-blue-500/20"
                                >
                                  ⚡ Bond to Pool
                                </button>
                              ) : (
                                !user && regDev && (
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={selectedUserForThisBeacon}
                                      onChange={(e) => setSelectedUserForMac(prev => ({ ...prev, [beacon.mac]: e.target.value }))}
                                      className="text-[10px] bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 max-w-[130px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">Pair with User...</option>
                                      {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                      ))}
                                    </select>
                                    <button
                                      disabled={!selectedUserForThisBeacon}
                                      onClick={() => {
                                        onAssignDevice(regDev.id, selectedUserForThisBeacon);
                                        playBeep(1400, 0.22);
                                      }}
                                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md transition border ${
                                        selectedUserForThisBeacon
                                          ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500/20 text-white cursor-pointer"
                                          : "bg-slate-900 border-slate-850 text-slate-500 cursor-not-allowed"
                                      }`}
                                    >
                                      Complete Bond
                                    </button>
                                  </div>
                                )
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 text-[9px] font-mono text-slate-500 flex justify-between items-center">
              <span>SECURITY PROTOCOL: WPA3/BLE-SHIELD SECURE HANDSHAKE ACTIVE</span>
              <span>GATT FFE0 PROTOCOL PORT 3000</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
