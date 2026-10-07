import React, { useState, useEffect } from 'react';
import { useAppStore } from '../utils/store';
import { ClientDatabaseRecord } from '../types';

export const ClientDatabaseModule: React.FC = () => {
  const {
    clientDatabaseRecords,
    refreshClientDatabase,
    exportToGoogleDrive,
    isAutoRefreshUsersEnabled,
    setAutoRefreshUsersEnabled,
    autoRefreshIntervalSeconds,
    setAutoRefreshIntervalSeconds,
    lastClientDatabaseSync,
    googleDriveSyncFileId,
    addToast
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | 'active' | 'trial' | 'locked'>('ALL');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize roster on mount if empty
  useEffect(() => {
    if (clientDatabaseRecords.length === 0) {
      refreshClientDatabase();
    }
  }, []);

  // Auto-refresh worker timer
  useEffect(() => {
    if (!isAutoRefreshUsersEnabled) return;

    const interval = setInterval(() => {
      refreshClientDatabase();
    }, autoRefreshIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshUsersEnabled, autoRefreshIntervalSeconds, refreshClientDatabase]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshClientDatabase();
    setIsRefreshing(false);
    addToast('Client database refreshed with latest telemetry.', 'info');
  };

  const handleDriveExport = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await exportToGoogleDrive();
      if (res.success) {
        addToast(`Google Drive document updated: ${res.fileId?.slice(-8)}`, 'success');
      } else {
        addToast(res.error || 'Drive sync failed', 'error');
      }
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDownloadCsv = () => {
    const headers = 'ID,Full Name,Username,Phone,Email,Org,Role,Subscription,Last Seen,Lat,Lng,Beacon ID,Battery\n';
    const rows = clientDatabaseRecords.map(r => 
      `"${r.id}","${r.fullName}","${r.username}","${r.phone}","${r.email}","${r.orgName}","${r.role}","${r.subscriptionTier}","${new Date(r.lastSeen).toISOString()}","${r.location?.lat || 0}","${r.location?.lng || 0}","${r.hardwareBeaconId || 'NONE'}","${r.batteryLevel || 100}%"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SafetyLink_Users_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Master CSV roster downloaded.', 'success');
  };

  const filteredRecords = clientDatabaseRecords.filter(r => {
    const matchesSearch = 
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.orgName.toLowerCase().includes(search.toLowerCase());
    const matchesTier = filterTier === 'ALL' || r.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-4 font-mono text-left max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <div>
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest font-display">
            👥 Client Database Server & Drive Sync
          </h3>
          <p className="text-[9px] text-slate-500 mt-0.5">
            Auto-refreshing master roster with real-time Google Drive document export
          </p>
        </div>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-slate-800 rounded-xl text-[9px] font-bold"
            title="Refresh from server"
          >
            {isRefreshing ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Auto-Refresh Control Bar */}
      <div className="p-3 bg-slate-950/70 border border-slate-900 rounded-2xl flex items-center justify-between gap-2 text-[8.5px]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAutoRefreshUsersEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-slate-300 font-bold uppercase">Auto-Refresh Updates</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={autoRefreshIntervalSeconds}
            onChange={e => setAutoRefreshIntervalSeconds(parseInt(e.target.value) || 15)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-slate-200 text-[8px]"
          >
            <option value={5}>Every 5s</option>
            <option value={15}>Every 15s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 60s</option>
          </select>

          <input
            type="checkbox"
            checked={isAutoRefreshUsersEnabled}
            onChange={e => setAutoRefreshUsersEnabled(e.target.checked)}
            className="accent-emerald-500 w-4 h-4 cursor-pointer"
          />
        </div>
      </div>

      {/* Google Drive Export Bar */}
      <div className="p-3.5 bg-slate-950/90 border border-blue-500/20 rounded-2xl space-y-2.5">
        <div className="flex justify-between items-center text-[8.5px]">
          <div>
            <span className="font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <span>📁</span> Google Drive Linked Master Doc
            </span>
            <span className="text-[7.5px] text-slate-500 block">
              {googleDriveSyncFileId ? `Doc ID: ${googleDriveSyncFileId}` : 'Not yet exported'}
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleDriveExport}
              disabled={isSyncingDrive}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-[8px] transition-all shadow-md flex items-center gap-1"
            >
              {isSyncingDrive ? 'Syncing...' : 'Export to Drive'}
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl font-bold uppercase text-[8px] border border-slate-800"
            >
              CSV
            </button>
          </div>
        </div>

        {lastClientDatabaseSync && (
          <div className="text-[7.5px] text-slate-500 flex justify-between pt-1 border-t border-slate-900">
            <span>TOTAL USERS SYNCED: {clientDatabaseRecords.length}</span>
            <span>LAST POLLING: {new Date(lastClientDatabaseSync).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or org..."
            className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-[9px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value as any)}
            className="bg-slate-950 border border-slate-900 rounded-xl px-2 py-1 text-[8.5px] text-slate-300"
          >
            <option value="ALL">All Tiers</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Users Roster List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-6 text-[9px] text-slate-600">
            No client records matching filter.
          </div>
        ) : (
          filteredRecords.map(user => (
            <div
              key={user.id}
              className="p-3 bg-slate-950/80 border border-slate-900 hover:border-slate-850 rounded-2xl text-[8.5px] space-y-1.5 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200 text-[9.5px]">
                    {user.fullName}
                  </h4>
                  <span className="text-[7.5px] text-slate-500">
                    {user.email} • {user.phone}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${
                  user.subscriptionTier === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  user.subscriptionTier === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {user.subscriptionTier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[7.5px] text-slate-400 bg-slate-900/60 p-1.5 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 uppercase block">ORG / ROLE:</span>
                  <span className="text-slate-300 font-bold">{user.orgName} ({user.role})</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">HARDWARE BEACON:</span>
                  <span className="text-cyan-400 font-bold">{user.hardwareBeaconId || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">BATTERY:</span>
                  <span className="text-emerald-400 font-bold">{user.batteryLevel}%</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase block">LAST SEEN:</span>
                  <span className="text-slate-400">{new Date(user.lastSeen).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
