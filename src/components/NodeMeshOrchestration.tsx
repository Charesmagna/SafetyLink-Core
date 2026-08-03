import React, { useState } from 'react';
import { Network, Activity, Cpu, Shield, Users, Radio } from 'lucide-react';

export const NodeMeshOrchestration: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedNodes, setConnectedNodes] = useState<any[]>([]);

  const handleScanMesh = () => {
    setIsScanning(true);
    setTimeout(() => {
      setConnectedNodes([
        { id: 'node-alpha', name: 'Alpha Sector Relay', status: 'active', strength: 98, type: 'BaseStation' },
        { id: 'node-bravo', name: 'Bravo Vehicle Node', status: 'active', strength: 75, type: 'VehicleRelay' },
        { id: 'node-charlie', name: 'Charlie Personnel', status: 'intermittent', strength: 45, type: 'Wearable' }
      ]);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-black text-slate-200 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          Active Node Mesh Orchestration
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Deploy, orchestrate, and monitor decentralized peer-to-peer mesh networks across local BLE/LoRa hardware nodes.
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleScanMesh}
            disabled={isScanning}
            className={`px-4 py-2 font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition-all ${
              isScanning ? 'bg-emerald-900/50 text-emerald-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isScanning ? 'Scanning Network...' : 'Ping Mesh Network'}
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs uppercase tracking-wider rounded-lg border border-slate-700 transition-all">
            Deploy Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedNodes.length === 0 && !isScanning ? (
            <div className="col-span-full py-10 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              No active mesh nodes detected. Ping network to discover.
            </div>
          ) : connectedNodes.map((node, i) => (
            <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-xs font-bold text-slate-300 uppercase">{node.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Type</span>
                  <span className="text-slate-400">{node.type}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Signal Strength</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${node.strength}%` }} />
                    </div>
                    <span className="text-emerald-400">{node.strength}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
