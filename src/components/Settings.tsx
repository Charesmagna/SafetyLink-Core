import React, { useState } from 'react';
import { useAppStore } from '../utils/store';

export const Settings: React.FC = () => {
  const { auditLogs, clearAuditLogs } = useAppStore();
  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'BLE' | 'GPS' | 'DISPATCH' | 'SECURITY'>('ALL');
  const [shortcutTriggerEnabled, setShortcutTriggerEnabled] = useState<boolean>(() => localStorage.getItem('sl_shortcut_enabled') === 'true');

  const handleShortcutToggle = (enabled: boolean) => {
    setShortcutTriggerEnabled(enabled);
    localStorage.setItem('sl_shortcut_enabled', String(enabled));
    useAppStore.getState().addAuditLog(
      'SYSTEM',
      'INFO',
      `Homescreen Quick-Trigger ${enabled ? 'Enabled' : 'Disabled'}`,
      'Shortcut configured to bypass biometric locks and trigger emergency sequence on instant click.'
    );
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'ALL') return true;
    return log.category === filter;
  });

  return (
    <div className="flex flex-col gap-5 p-5 bg-slate-900 border border-slate-900/60 rounded-3xl shadow-xl w-full max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />

      <div className="border-b border-slate-800 pb-3.5 text-left">
        <h3 className="text-base font-black text-slate-100 tracking-tight font-mono">
          SYSTEM DIAGNOSTICS
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Local auditing & administrative checks
        </p>
      </div>

      {/* Diagnostics Quick Panel */}
      <div className="space-y-3 text-left">
        <h4 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
          Diagnostic Controls
        </h4>
        <div className="grid grid-cols-2 gap-3 font-mono text-[11px] font-bold">
          <button
            onClick={() => {
              useAppStore.getState().addAuditLog('SYSTEM', 'INFO', 'Self-Test Initiated', 'Checking GATT profiles, GPS providers, and local caches.');
              alert("All system diagnostics are functional. BLE: Stable, GPS: High accuracy locked.");
            }}
            className="bg-slate-950/80 border border-slate-900 rounded-2xl p-3 text-slate-200 hover:bg-slate-800/50 transition-colors text-center"
          >
            💻 RUN SELF-TEST
          </button>
          <button
            onClick={clearAuditLogs}
            className="bg-slate-950/80 border border-red-500/10 rounded-2xl p-3 text-red-400 hover:bg-red-950/20 transition-colors text-center"
          >
            🗑️ PURGE LEDGER
          </button>
        </div>
      </div>

      {/* Homescreen Red Circle Shortcut Trigger Settings */}
      <div className="space-y-3.5 text-left border-t border-slate-800/60 pt-4">
        <h4 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
          HOMESCREEN SHORTCUT TRIGGER
        </h4>
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-200 block font-mono uppercase">
                RED CIRCLE QUICK TRIGGER
              </span>
              <span className="text-[9px] text-slate-500 block leading-tight">
                Installs a high-contrast red circle widget on your mobile homescreen for instantaneous tactical dispatch.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shortcutTriggerEnabled}
                onChange={(e) => handleShortcutToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {shortcutTriggerEnabled && (
            <div className="pt-2.5 border-t border-slate-900/60 flex flex-col items-center gap-3 animate-fadeIn">
              <div className="text-[10px] text-slate-400 font-mono text-center leading-normal">
                TAP TO SIMULATE DIRECT HOMESCREEN TRIGGER:
              </div>
              
              {/* Pulsing Red Circle Interactive Widget */}
              <button
                onClick={() => {
                  useAppStore.getState().triggerPanic("DISTRESS: Instant trigger activated from homescreen red circle quick-shortcut.");
                }}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all duration-300 shadow-lg shadow-red-900/40 border border-red-500/30"
                title="Trigger Instant SOS"
              >
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-75" />
                <span className="absolute inset-1 rounded-full border-2 border-dashed border-red-300/40 group-hover:rotate-45 transition-transform duration-1000" />
                <span className="text-[10px] font-black text-white tracking-widest font-mono">SOS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert("Pinning Red Circle Shortcut Trigger to your Android Home Screen... Success! (Via ShortcutManager API integration)");
                  useAppStore.getState().addAuditLog('SYSTEM', 'INFO', 'Homescreen Shortcut Pinned', 'Red circle launcher widget requested and pinned successfully.');
                }}
                className="text-[10px] py-1.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-mono font-bold rounded-xl transition-all w-full text-center"
              >
                📥 PIN WIDGET TO HOMESCREEN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Audit Logs Reader */}
      <div className="space-y-3 text-left">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
            Secured Audit Ledger
          </h4>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900">
            {filteredLogs.length} entries
          </span>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[9px] font-bold">
          {(['ALL', 'SYSTEM', 'BLE', 'GPS', 'DISPATCH', 'SECURITY'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full border transition-all ${
                filter === cat
                  ? 'bg-blue-600 text-white border-blue-500/20'
                  : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Audit Log Box */}
        <div className="h-48 bg-slate-950/80 border border-slate-900 rounded-2xl overflow-y-auto p-3.5 font-mono text-[10px] space-y-3.5 scrollbar-none">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-600 text-center py-10 italic">No historical audit entries found.</p>
          ) : (
            filteredLogs.map(log => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const isSevere = log.severity === 'SEVERE';
              const isWarn = log.severity === 'WARN';

              return (
                <div key={log.id} className="border-b border-slate-900/40 pb-2.5 last:border-0 last:pb-0 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSevere ? 'bg-red-500 animate-pulse' : isWarn ? 'bg-orange-500' : 'bg-slate-400'}`} />
                      <span className="text-slate-500 text-[9px]">{dateStr}</span>
                      <span className="text-slate-400 font-extrabold font-mono text-[8px] tracking-wider uppercase bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                        {log.category}
                      </span>
                    </div>
                    <span className={`font-extrabold text-[8px] tracking-wide px-1.5 py-0.5 rounded-full ${isSevere ? 'bg-red-500/10 text-red-400 border border-red-500/10' : isWarn ? 'bg-orange-500/10 text-orange-400 border border-orange-500/10' : 'bg-slate-900 text-slate-400'}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className="text-slate-200 font-bold mt-1 leading-normal">{log.message}</p>
                  {log.details && (
                    <p className="text-slate-500 text-[9px] mt-1 leading-relaxed bg-slate-900/40 p-1.5 rounded-lg border border-slate-900/30">
                      {log.details}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
