import React, { useState, useEffect } from "react";
import { Bluetooth, RefreshCw, Radio, Battery, ShieldCheck, Unlink, AlertOctagon, HelpCircle } from "lucide-react";
import { HardwareDevice, User } from "../../types";

interface BleScannerViewProps {
  currentUser: User;
  hardware: HardwareDevice[];
  onAssignDevice: (deviceId: string, userId: string) => Promise<void>;
  onUnassignDevice: (deviceId: string) => Promise<void>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  refreshData: () => void;
}

export default function BleScannerView({
  currentUser,
  hardware,
  onAssignDevice,
  onUnassignDevice,
  showToast,
  refreshData,
}: BleScannerViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isAdvertisingSimulated, setIsAdvertisingSimulated] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Filter hardware devices belonging to this user
  const myDevices = hardware.filter(h => h.assignedUserId === currentUser.id);
  // All devices in the pool that are currently unassigned
  const unassignedDevices = hardware.filter(h => !h.assignedUserId);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      setScanProgress(0);
      timer = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsScanning(false);
            return 100;
          }
          return prev + 10;
        });
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const startScan = () => {
    setIsScanning(true);
    refreshData();
  };

  const handleBond = async (deviceId: string) => {
    try {
      await onAssignDevice(deviceId, currentUser.id);
      setIsAdvertisingSimulated(false);
      showToast("iTAG Bond Secured! Core Keep-Alive daemon is monitoring physical BLE signal.", "success");
      refreshData();
    } catch (err) {
      showToast("Bonding handshake rejected by GATT server.", "error");
    }
  };

  const handleUnbond = async (deviceId: string) => {
    try {
      await onUnassignDevice(deviceId);
      showToast("iTAG Unbonded. SafetyLink background tracking suspended for this device.", "info");
      refreshData();
    } catch (err) {
      showToast("Unbonding failed.", "error");
    }
  };

  return (
    <div className="flex-grow flex flex-col p-4 space-y-4 text-left overflow-y-auto pb-16">
      <div className="border-b border-slate-800 pb-3 mb-1">
        <h3 className="font-extrabold text-lg text-white font-sans uppercase tracking-tight flex items-center gap-2">
          <Bluetooth className="w-5 h-5 text-blue-400" />
          iTAG Hardware Manager
        </h3>
        <p className="text-[10px] text-blue-400 font-semibold font-mono">GATT BLUETOOTH LOW ENERGY SERVICE (FFE0)</p>
      </div>

      {/* Intro info box */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-slate-400 text-[10px] leading-relaxed font-semibold space-y-1.5">
        <p>🛡️ Scan, pair, and bond your physical **iTAG BLE smart buttons** or SafetyLink wristbands directly with the application.</p>
        <p className="text-blue-400"><b>To pair:</b> Click "Enable Ad Button" to simulate pressing the hardware button, then click "Start Scan" below to detect the Bluetooth beacon!</p>
      </div>

      {/* Active Paired Device Status */}
      {myDevices.length > 0 ? (
        <div className="space-y-3">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Current Paired Beacon</span>
          {myDevices.map(dev => (
            <div key={dev.id} className="bg-slate-950 p-4 rounded-3xl border border-emerald-500/30 space-y-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-xl border-l border-b border-emerald-500/20">
                SECURED BOND
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <Bluetooth className="w-5 h-5 animate-pulse text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-wide">{dev.name}</h4>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">{dev.deviceId} • GATT Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[9px] font-mono font-bold text-slate-300">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  {dev.batteryLevel}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/80 text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 block uppercase text-[8px] font-bold">Signal (RSSI)</span>
                  <span className={`font-bold ${dev.rssi >= -75 ? "text-emerald-400" : "text-amber-400"}`}>{dev.rssi} dBm</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[8px] font-bold">Mapped Action</span>
                  <span className="text-rose-400 font-bold uppercase">{dev.mappedAction}</span>
                </div>
              </div>

              <button
                onClick={() => handleUnbond(dev.id)}
                className="w-full bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider text-[10px]"
              >
                <Unlink className="w-3.5 h-3.5" />
                Unbond & Disconnect Device
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-950/40 p-5 rounded-3xl border border-dashed border-slate-850 text-center space-y-2">
          <Bluetooth className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No iTAG device bonded to this profile</p>
          <p className="text-[9px] text-slate-500 leading-normal max-w-xs mx-auto font-medium">Your account must be bonded to a hardware keyfob or wristband to trigger standalone mechanical SOS alerts.</p>
        </div>
      )}

      {/* Simulator Hardware Controller: Press the Physical Ad Button */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800/80 space-y-3 shadow-inner">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Hardware simulator control</span>
        
        <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-850">
          <div className="text-left flex-1 pr-4">
            <h5 className="text-[10px] font-bold text-slate-200">Press iTAG Advertising Button</h5>
            <p className="text-[8px] text-slate-500 font-semibold leading-normal">Simulates holding the physical button on your keyfob to broadcast BLE pairing packets.</p>
          </div>
          <button
            onClick={() => {
              setIsAdvertisingSimulated(!isAdvertisingSimulated);
              showToast(
                !isAdvertisingSimulated 
                  ? "iTAG Beacon is now advertising on 2.4GHz. Run Bluetooth Scan inside the app." 
                  : "iTAG Beacon stopped advertising.", 
                "info"
              );
            }}
            className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition ${
              isAdvertisingSimulated
                ? "bg-blue-600 border-blue-400 text-white animate-pulse"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {isAdvertisingSimulated ? "Broadcasting..." : "Enable Ad Button"}
          </button>
        </div>
      </div>

      {/* Interactive BLE Scanning Interface */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800/80 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono">GATT BLE SCANNER</span>
          {isScanning && (
            <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded animate-pulse font-mono font-bold">
              SCANNING {scanProgress}%
            </span>
          )}
        </div>

        {/* Sonar / Radar sweeping graphic */}
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3 relative overflow-hidden">
            <div className="w-24 h-24 rounded-full border border-blue-500/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/40 animate-ping opacity-25"></div>
              <div className="absolute w-16 h-16 rounded-full border border-blue-500/30 flex items-center justify-center">
                <Bluetooth className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Listening on 0xFFE0 / 0xFFE1 characteristic channels...</p>
          </div>
        ) : (
          <button
            onClick={startScan}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Start Bluetooth Scan
          </button>
        )}

        {/* Scan Results */}
        {!isScanning && (
          <div className="space-y-2">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Detected Advertising beacons</span>

            {isAdvertisingSimulated && unassignedDevices.length > 0 ? (
              <div className="space-y-2">
                {unassignedDevices.map(dev => (
                  <div key={dev.id} className="bg-slate-900 p-3 rounded-2xl border border-blue-500/20 flex items-center justify-between hover:border-blue-500/40 transition">
                    <div className="text-left space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                        <h5 className="text-xs font-black text-slate-100 uppercase tracking-wide">{dev.name}</h5>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono">{dev.deviceId} • RSSI: {dev.rssi} dBm (Ready)</p>
                    </div>
                    <button
                      onClick={() => handleBond(dev.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                    >
                      BOND & PAIR
                    </button>
                  </div>
                ))}
              </div>
            ) : isAdvertisingSimulated && unassignedDevices.length === 0 ? (
              <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-850 text-center text-[9px] text-slate-500 italic font-mono">
                iTAG broadcasting detected but all organization hardware is already assigned. Go to Platform Owner or BLE Beacon Mesh to release or register more devices.
              </div>
            ) : (
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-850 text-center space-y-1">
                <p className="text-[9px] text-slate-500 italic font-mono">No advertising Bluetooth beacons detected in proximity.</p>
                <p className="text-[8px] text-slate-600 leading-normal max-w-xs mx-auto">Make sure to enable "Press iTAG Advertising Button" above or add devices in the organizational pool to simulate nearby hardware.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
