import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useAppStore } from '../utils/store';
import { CommunitySafetyReport, SafetyReportCategory } from '../types';
import { formatRelativeTime } from '../utils/safetyProximity';
import { CheckCircle2, Filter, MapPin, Navigation, Plus, Search, X } from 'lucide-react';

interface UnifiedIncident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'PUBLISHED' | 'RESOLVED';
  lat: number;
  lng: number;
  reporter: string;
  areaName: string;
  timestamp: number;
  source: 'PANIC' | 'COMMUNITY';
}

interface OrgLiveIncidentMapProps {
  orgName: string;
  orgId?: string;
  members?: Array<{ id: string; fullName?: string; username?: string; lat?: number; lng?: number; sosActive?: boolean }>;
  onOpenNewIncidentModal?: () => void;
}

export const OrgLiveIncidentMap: React.FC<OrgLiveIncidentMapProps> = ({
  orgName,
  orgId,
  members = [],
}) => {
  const {
    panicEvents,
    communityReports,
    dangerZones,
    globalTheme,
    addCommunityReport,
    resolveCommunityReport,
    resolvePanic,
    addToast,
  } = useAppStore();

  const isDark = globalTheme === 'dark';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'PUBLISHED' | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'ALL'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<UnifiedIncident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create incident modal state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newArea, setNewArea] = useState('Sandton Central');
  const [newCategory, setNewCategory] = useState<SafetyReportCategory>('PATROL_UPDATE');
  const [newSeverity, setNewSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const unifiedIncidents: UnifiedIncident[] = useMemo(() => {
    const panicMapped: UnifiedIncident[] = panicEvents.map((ev) => ({
      id: ev.id,
      title: ev.profileUsed ? `${ev.profileUsed} SOS Alert` : `Emergency SOS (${ev.id.slice(-5)})`,
      description: ev.description || 'Live emergency distress signal triggered.',
      severity: ev.severity || 'CRITICAL',
      status: ev.status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE',
      lat: ev.lat || -26.1076,
      lng: ev.lng || 28.0567,
      reporter: ev.assignedResponder || 'SOS Trigger',
      areaName: `${(ev.lat || -26.1076).toFixed(4)}, ${(ev.lng || 28.0567).toFixed(4)}`,
      timestamp: ev.timestamp || Date.now(),
      source: 'PANIC',
    }));

    const communityMapped: UnifiedIncident[] = communityReports.map((r: CommunitySafetyReport) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      severity: r.severity,
      status: r.status,
      lat: r.lat,
      lng: r.lng,
      reporter: r.reporterName,
      areaName: r.areaName,
      timestamp: r.timestamp,
      source: 'COMMUNITY',
    }));

    return [...panicMapped, ...communityMapped].sort((a, b) => b.timestamp - a.timestamp);
  }, [panicEvents, communityReports]);

  const kpis = useMemo(() => {
    const critical = unifiedIncidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
    const active = unifiedIncidents.filter((i) => i.status === 'ACTIVE').length;
    const resolved = unifiedIncidents.filter((i) => i.status === 'RESOLVED').length;
    return { critical, active, resolved, total: unifiedIncidents.length };
  }, [unifiedIncidents]);

  const filteredIncidents = useMemo(() => {
    const now = Date.now();
    const cutoff =
      timeFilter === '1h'
        ? now - 3600_000
        : timeFilter === '24h'
        ? now - 86_400_000
        : timeFilter === '7d'
        ? now - 7 * 86_400_000
        : 0;

    return unifiedIncidents.filter((inc) => {
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (cutoff && inc.timestamp < cutoff) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!`${inc.title} ${inc.description} ${inc.reporter} ${inc.areaName}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedIncidents, statusFilter, severityFilter, timeFilter, searchQuery]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [-26.155, 28.048],
      zoom: 12,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 200);
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Switch tile layer cleanly between Light Collage Map & Deep-Navy Dark Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const url = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);
  }, [isDark]);

  // Render incident pins, danger zones, and member markers
  useEffect(() => {
    const layer = markerLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    // Danger zones
    dangerZones.forEach((zone) => {
      const color = zone.riskLevel === 'CRITICAL' ? '#dc2626' : zone.riskLevel === 'HIGH' ? '#ea580c' : '#d97706';
      L.circle([zone.lat, zone.lng], {
        radius: zone.radiusMeters,
        color,
        fillColor: color,
        fillOpacity: isDark ? 0.14 : 0.1,
        weight: 1.5,
      })
        .bindPopup(`<strong>${zone.name}</strong><br/>${zone.advisory}`)
        .addTo(layer);
    });

    // Live org members with GPS
    members.forEach((m) => {
      if (typeof m.lat !== 'number' || typeof m.lng !== 'number' || (m.lat === 0 && m.lng === 0)) return;
      const color = m.sosActive ? '#dc2626' : '#059669';
      L.circleMarker([m.lat, m.lng], {
        radius: m.sosActive ? 9 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindPopup(`<strong>${m.fullName || m.username || 'Member'}</strong><br/>${m.sosActive ? 'SOS ACTIVE' : 'Connected Member'}`)
        .addTo(layer);
    });

    // Incidents
    filteredIncidents.forEach((inc) => {
      if (!Number.isFinite(inc.lat) || !Number.isFinite(inc.lng) || (inc.lat === 0 && inc.lng === 0)) return;
      const fill =
        inc.status === 'RESOLVED'
          ? '#10b981'
          : inc.severity === 'CRITICAL'
          ? '#dc2626'
          : inc.severity === 'HIGH'
          ? '#ea580c'
          : inc.severity === 'MEDIUM'
          ? '#f59e0b'
          : '#2563eb';
      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: inc.severity === 'CRITICAL' ? 11 : 8,
        color: '#ffffff',
        weight: 2.5,
        fillColor: fill,
        fillOpacity: 0.95,
      }).addTo(layer);

      marker.on('click', () => {
        setSelectedIncident(inc);
      });
      marker.bindTooltip(`${inc.title} (${inc.severity})`, { direction: 'top' });
    });
  }, [filteredIncidents, dangerZones, members, isDark]);

  const focusIncident = (inc: UnifiedIncident) => {
    setSelectedIncident(inc);
    if (mapInstanceRef.current && Number.isFinite(inc.lat) && Number.isFinite(inc.lng) && !(inc.lat === 0 && inc.lng === 0)) {
      mapInstanceRef.current.flyTo([inc.lat, inc.lng], 15, { duration: 0.7 });
    }
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    const center = mapInstanceRef.current?.getCenter();
    const created = addCommunityReport({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      severity: newSeverity,
      status: 'ACTIVE',
      lat: center?.lat ?? -26.1076,
      lng: center?.lng ?? 28.0567,
      areaName: newArea.trim() || orgName,
      reporterName: `${orgName} Control Room`,
      orgId,
    });
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    addToast('Control room incident logged onto live map.', 'success');
    focusIncident({
      id: created.id,
      title: created.title,
      description: created.description,
      severity: created.severity,
      status: created.status,
      lat: created.lat,
      lng: created.lng,
      reporter: created.reporterName,
      areaName: created.areaName,
      timestamp: created.timestamp,
      source: 'COMMUNITY',
    });
  };

  const severityLabelClass = (sev: UnifiedIncident['severity']) => {
    if (sev === 'CRITICAL') return 'bg-red-600 text-white';
    if (sev === 'HIGH') return 'bg-orange-500 text-white';
    if (sev === 'MEDIUM') return 'bg-amber-500 text-white';
    return 'bg-blue-600 text-white';
  };

  return (
    <div className="relative w-full h-[calc(100dvh-7.5rem)] min-h-[540px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#071124]">
      {/* Full-Bleed Live Map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top Search & Action Bar floating over map */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#0d1b34]/95 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold shadow-md flex items-center gap-2 backdrop-blur-md"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{drawerOpen ? 'Hide Live Security' : `Live Security (${filteredIncidents.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            New Incident
          </button>
        </div>

        <div className="relative w-full sm:w-72 pointer-events-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incidents, patrols, areas..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/95 dark:bg-[#0d1b34]/95 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-md backdrop-blur-md"
          />
        </div>
      </div>

      {/* Collage Panel-2 Floating "Live Security" Drawer */}
      {drawerOpen && (
        <aside className="absolute top-16 left-3 bottom-3 z-20 w-[calc(100%-1.5rem)] sm:w-[350px] rounded-2xl bg-white/95 dark:bg-[#0d1b34]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left">
          {/* Drawer Header */}
          <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Live Security</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[230px]">{orgName}</p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close Live Security panel"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4-Column Tabular KPI Strip (Critical / Active / Resolved / Total) */}
          <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#071124]/60">
            <div className="py-2.5 text-center">
              <div className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{kpis.critical}</div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Critical</div>
            </div>
            <div className="py-2.5 text-center">
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{kpis.active}</div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Active</div>
            </div>
            <div className="py-2.5 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{kpis.resolved}</div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Resolved</div>
            </div>
            <div className="py-2.5 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{kpis.total}</div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total</div>
            </div>
          </div>

          {/* Interactive Filters (Status / Severity / Time) */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Filters</span>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSeverityFilter('ALL');
                  setTimeFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Status */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#071124]">
              {(['ACTIVE', 'PUBLISHED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Severity */}
            <div className="flex items-center gap-1">
              {(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-colors ${
                    severityFilter === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-red-600 border-red-600 text-white'
                        : sev === 'HIGH'
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-[#071124] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sev === 'ALL' ? 'All' : sev === 'MEDIUM' ? 'Med' : sev === 'CRITICAL' ? 'Crit' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Time */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#071124]">
              {(['1h', '24h', '7d', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeFilter(tf)}
                  className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    timeFilter === tf
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf === 'ALL' ? 'All' : tf}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Incident Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 tabular-nums">
              Incidents ({filteredIncidents.length})
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                No incidents match the active filter.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => focusIncident(inc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedIncident?.id === inc.id
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071124]/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {inc.title}
                    </h4>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${severityLabelClass(inc.severity)}`}>
                      {inc.severity.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                    <div className="text-slate-500 dark:text-slate-400 truncate">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{inc.reporter}</span>
                      <span> · {formatRelativeTime(inc.timestamp)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusIncident(inc);
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Selected Incident Floating Detail Card (bottom-right) */}
      {selectedIncident && (
        <div className="absolute bottom-4 right-4 z-20 w-[calc(100%-2rem)] sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0d1b34]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl p-4 text-left space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {selectedIncident.source === 'PANIC' ? 'EMERGENCY SOS' : 'CONTROL ROOM / COMMUNITY'} · {selectedIncident.status}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedIncident.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIncident(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedIncident.description}</p>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 tabular-nums">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{selectedIncident.areaName} ({selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)})</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.lat},${selectedIncident.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              Navigate
            </a>
            {selectedIncident.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => {
                  if (selectedIncident.source === 'PANIC') {
                    resolvePanic(selectedIncident.id);
                  } else {
                    resolveCommunityReport(selectedIncident.id);
                  }
                  setSelectedIncident({ ...selectedIncident, status: 'RESOLVED' });
                  addToast('Incident marked as Resolved.', 'success');
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve
              </button>
            )}
          </div>
        </div>
      )}

      {/* New Control-Room Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Control-Room Incident</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Gate 3 Perimeter Sensor Alert"
                  className="w-full px-3 py-2 text-sm rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="w-full px-2.5 py-2 text-xs rounded-lg">
                    <option value="PATROL_UPDATE">Patrol Update</option>
                    <option value="CRIME">Crime / Breach</option>
                    <option value="SUSPICIOUS">Suspicious Activity</option>
                    <option value="TRAFFIC">Traffic / Road</option>
                    <option value="FIRE_HAZARD">Fire / Hazard</option>
                    <option value="MEDICAL">Medical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Severity</label>
                  <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value as any)} className="w-full px-2.5 py-2 text-xs rounded-lg">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Site / Area</label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Operator Notes</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Enter patrol or dispatch details..."
                  className="w-full px-3 py-2 text-sm rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white">
                  Log Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
