import React, { useState } from 'react';
import { Database, RefreshCw, } from 'lucide-react';
import { useAppStore } from '../utils/store';

export const AdvancedOfflineSyncManager: React.FC = () => {
  const { localOfflineQueue, syncOfflineQueue, addToast, syncStrategy, setSyncStrategy } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = () => {
    setIsSyncing(true);
    addToast('Initiating secure offline payload synchronization...', 'info');
    
    // Simulate complex sync process
    setTimeout(() => {
      syncOfflineQueue(false);
      setIsSyncing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-black text-slate-200 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Offline Mobile Sync Mechanisms
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Manage robust non-volatile caching and secure synchronization of critical telemetry and incident reports collected during prolonged network outages.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Local Queue Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${localOfflineQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-xs font-mono text-slate-300">{localOfflineQueue.length} Pending</span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {localOfflineQueue.length === 0 ? (
                <div className="text-[10px] text-slate-600 font-mono italic text-center py-4">
                  Queue is empty. All telemetry synchronized.
                </div>
              ) : (
                localOfflineQueue.map((item) => (
                  <div key={item.id} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 truncate w-3/4">{item.description}</span>
                    <span className="text-[9px] font-mono text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing || localOfflineQueue.length === 0}
                className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg transition-colors
                  ${isSyncing ? 'bg-blue-900/50 text-blue-500 cursor-wait' : 
                    localOfflineQueue.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronizing...' : 'Force Manual Sync'}
              </button>
              {localOfflineQueue.length > 0 && (
                <button
                  onClick={() => useAppStore.setState({ localOfflineQueue: [] })}
                  className="px-4 py-2 flex items-center justify-center text-xs font-bold font-mono uppercase tracking-wider rounded-lg bg-red-900/30 text-red-500 hover:bg-red-900/50 hover:text-red-400 transition-colors border border-red-900/50"
                  title="Clear Offline Queue"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-2">
              Sync Strategy Configuration
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input 
                  type="radio" 
                  name="syncStrategy" 
                  value="batch" 
                  checked={syncStrategy === 'batch'}
                  onChange={() => setSyncStrategy('batch')}
                  className="mt-1"
                />
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider mb-0.5">Optimized Batch Sync (Recommended)</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">Groups payloads to conserve battery and minimize network overhead. Syncs every 15 minutes or when buffer exceeds 5MB.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input 
                  type="radio" 
                  name="syncStrategy" 
                  value="immediate" 
                  checked={syncStrategy === 'immediate'}
                  onChange={() => setSyncStrategy('immediate')}
                  className="mt-1"
                />
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider mb-0.5">Aggressive Immediate Sync</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">Attempts to flush payload immediately upon connection restablishment. High battery impact.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input 
                  type="radio" 
                  name="syncStrategy" 
                  value="wifi-only" 
                  checked={syncStrategy === 'wifi-only'}
                  onChange={() => setSyncStrategy('wifi-only')}
                  className="mt-1"
                />
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider mb-0.5">Wi-Fi Only Sync</span>
                  <span className="text-[10px] text-slate-500 leading-tight block">Defers synchronization of non-critical media and telemetry until a secure Wi-Fi connection is available.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
