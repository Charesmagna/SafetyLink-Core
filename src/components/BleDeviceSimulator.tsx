import React, { useState } from "react";
import { Bluetooth, Radio, Battery, ShieldAlert, CheckCircle, UserPlus, Trash2, Sliders } from "lucide-react";
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
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-500/20 rounded-lg">
          <Bluetooth className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-mono uppercase tracking-wider text-white">BLE Hardware Button Emulator (iTAG)</h2>
          <p className="text-xs text-slate-400">Simulate physical hardware connections via Bluetooth Low Energy (FFE0 Service / FFE1 Characteristic)</p>
        </div>
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

    </div>
  );
}
