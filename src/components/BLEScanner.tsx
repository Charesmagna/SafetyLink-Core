import React from 'react';
import { useAppStore } from '../utils/store';

export const BLEScanner: React.FC = () => {
  const { bleDevices, isScanning, pairingProgress, startBleScan, disconnectBleDevice, connectBleDevice, removeDevice } = useAppStore();

  const handleSimulateClick = (mac: string, clickType: string) => {
    // Injects a simulated BLE notification click event
    useAppStore.getState().addAuditLog('BLE', 'WARN', `Simulated [${clickType}] Click`, `MAC: ${mac}`);
    
    if (clickType === 'SINGLE' || clickType === 'TRIPLE') {
      useAppStore.getState().triggerPanic(`Silent alert triggered via wearable button ${clickType} press.`);
    } else if (clickType === 'DOUBLE') {
      useAppStore.getState().cancelSOS();
    } else if (clickType === 'FALL') {
      useAppStore.getState().triggerPanic("CRITICAL: Fall Impact detected by internal inertial G-Sensor.");
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60" />

      <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
        <div className="text-left">
          <h3 className="text-base font-black text-slate-100 tracking-tight font-mono">
            WEARABLE BEACONS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            HST-01 Trackers & BLE Keyfobs
          </p>
        </div>
        <button
          onClick={startBleScan}
          disabled={isScanning}
          className={`px-3.5 py-1.5 text-[10px] font-mono font-bold rounded-full border transition-all uppercase ${
            isScanning
              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white shadow-md shadow-emerald-900/20'
          }`}
        >
          {isScanning ? "SCANNING..." : "SCAN BEACON"}
        </button>
      </div>

      {/* Pairing progress bar */}
      {pairingProgress && (
        <div className="p-3.5 bg-slate-950/80 border border-emerald-500/20 rounded-2xl space-y-2 font-mono text-[11px] text-left">
          <div className="flex justify-between text-emerald-400 font-bold">
            <span>PAIRING SEQUENCER</span>
            <span className="animate-pulse">ACTIVE</span>
          </div>
          <p className="text-slate-300">{pairingProgress}</p>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Paired devices list */}
      <div className="space-y-3.5 text-left">
        {bleDevices.map((device) => {
          const isConnected = device.connectionState === 'CONNECTED';

          return (
            <div key={device.macAddress} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 space-y-4">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-slate-100">{device.friendlyName}</h4>
                  <p className="text-[9px] font-mono text-slate-500">{device.macAddress}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {device.connectionState}
                  </span>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-2.5 rounded-xl text-center font-mono text-[10px] border border-slate-800/40">
                <div className="border-r border-slate-800">
                  <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Battery</span>
                  <span className={`font-bold text-xs ${device.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                    🔋 {device.batteryLevel}%
                  </span>
                </div>
                <div className="border-r border-slate-800">
                  <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Signal</span>
                  <span className="text-slate-200 font-bold text-xs">📶 {device.rssi} dBm</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[8px] uppercase font-bold mb-0.5">Type</span>
                  <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wide bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-500/10 inline-block mt-0.5">{device.deviceType}</span>
                </div>
              </div>

              {/* simulated actions triggers */}
              {isConnected && (
                <div className="space-y-2 border-t border-slate-900 pt-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                    Simulate Wearable Hardware Click
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] font-bold">
                    <button
                      onClick={() => handleSimulateClick(device.macAddress, 'SINGLE')}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full py-1.5 px-2 text-slate-300 transition-colors"
                    >
                      1x PRESS
                    </button>
                    <button
                      onClick={() => handleSimulateClick(device.macAddress, 'DOUBLE')}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full py-1.5 px-2 text-slate-300 transition-colors"
                    >
                      2x PRESS
                    </button>
                    <button
                      onClick={() => handleSimulateClick(device.macAddress, 'TRIPLE')}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full py-1.5 px-2 text-slate-300 transition-colors"
                    >
                      3x PRESS
                    </button>
                    <button
                      onClick={() => handleSimulateClick(device.macAddress, 'FALL')}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/20 rounded-full py-1.5 px-2 text-red-400 transition-colors"
                    >
                      FALL G
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toggles */}
              <div className="flex justify-between items-center text-[10px] pt-1">
                <button
                  onClick={() => isConnected ? disconnectBleDevice(device.macAddress) : connectBleDevice(device.macAddress)}
                  className="text-slate-400 hover:text-slate-200 font-bold transition-colors"
                >
                  {isConnected ? "DISCONNECT LINK" : "RE-ESTABLISH LINK"}
                </button>
                <button
                  onClick={() => removeDevice(device.macAddress)}
                  className="text-red-500 hover:text-red-400 font-bold transition-colors"
                >
                  UNPAIR / FORGET
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
