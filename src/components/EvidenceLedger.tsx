import React, { useState, useMemo } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export const EvidenceLedger: React.FC = () => {
  const { auditLogs, clearAuditLogs, currentUser, currentOrg } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchCategory = filterCategory === 'ALL' || log.category === filterCategory;
      const searchStr = searchTerm.toLowerCase();
      const matchSearch = 
        log.message.toLowerCase().includes(searchStr) || 
        (log.details && log.details.toLowerCase().includes(searchStr)) ||
        log.category.toLowerCase().includes(searchStr) ||
        log.severity.toLowerCase().includes(searchStr);
      return matchCategory && matchSearch;
    });
  }, [auditLogs, filterCategory, searchTerm]);

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'SEVERE': return 'text-red-400 bg-red-400/10 border-red-500/30';
      case 'WARN': return 'text-amber-400 bg-amber-400/10 border-amber-500/30';
      case 'INFO': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
      default: return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'SYSTEM': return 'fa-server';
      case 'BLE': return 'fa-bluetooth-b';
      case 'GPS': return 'fa-satellite-dish';
      case 'DISPATCH': return 'fa-truck-fast';
      case 'SECURITY': return 'fa-shield-halved';
      default: return 'fa-microchip';
    }
  };

  const categories = ['ALL', 'SYSTEM', 'BLE', 'GPS', 'DISPATCH', 'SECURITY'];

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-amber-500"></i>
            EVIDENCE LEDGER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Immutable Audit Trail &amp; Telemetry Logs
            {currentOrg && ` • ORG: ${currentOrg.id}`}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search signatures..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none w-full md:w-64 font-mono"
            />
          </div>
          
          {currentUser?.role === 'Super Admin' && (
            <button 
              onClick={() => {
                if(confirm('WARNING: Purging the Evidence Ledger will permanently delete local telemetry history. This is restricted to Super Admins. Proceed?')) {
                  clearAuditLogs();
                }
              }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-bold font-mono transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-trash-can"></i>
              PURGE
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/30 flex gap-2 overflow-x-auto custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono whitespace-nowrap transition-colors border ${
              filterCategory === cat 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/80">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-slate-500"
            >
              <i className="fa-solid fa-box-open text-4xl mb-3 opacity-20"></i>
              <p className="font-mono text-sm">No telemetry records found.</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 rounded-lg p-3 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono flex items-center gap-1.5 ${getSeverityColor(log.severity)}`}>
                        <i className={`fa-solid ${getCategoryIcon(log.category)}`}></i>
                        {log.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider">
                        {log.id.split('.')[1]?.substring(0, 8).toUpperCase() || log.id.substring(0,8)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-center gap-1.5">
                      <i className="fa-regular fa-clock"></i>
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}
                    </div>
                  </div>
                  
                  <div className="text-sm font-bold text-slate-200 mb-1">
                    {log.message}
                  </div>
                  
                  {log.details && (
                    <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800 mt-2 break-words">
                      {log.details}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
