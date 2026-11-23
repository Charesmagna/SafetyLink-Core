import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../utils/store';
import { CommunitySafetyReport, DangerZone, SafetyReportCategory } from '../types';
import { formatRelativeTime, haversineKm } from '../utils/safetyProximity';
import {
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ThumbsUp,
  Users,
  Wind,
  X,
} from 'lucide-react';

interface SafetyFeedProps {
  onOpenMap?: () => void;
}

interface LiveNewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  category: SafetyReportCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  areaName: string;
  timestamp: number;
  feedType: 'LIVE_NEWS';
}

interface LiveWeatherSummary {
  temperatureC: number | null;
  apparentTempC: number | null;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  precipitationMm: number;
  condition: string;
  hazardous: boolean;
  advisoryText: string | null;
  observedAt: string;
}

interface LiveLocationInfo {
  lat: number | null;
  lng: number | null;
  suburb: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  displayLocation: string;
}

const CATEGORY_LABELS: Record<SafetyReportCategory, string> = {
  CRIME: 'Crime / Police',
  SUSPICIOUS: 'Suspicious Activity',
  TRAFFIC: 'Traffic / Road',
  POWER_WATER: 'Power & Utilities',
  FIRE_HAZARD: 'Fire / Weather',
  MEDICAL: 'Medical / EMS',
  PATROL_UPDATE: 'Patrol Update',
};

export const SafetyFeed: React.FC<SafetyFeedProps> = ({ onOpenMap }) => {
  const {
    communityReports,
    setCommunityReports,
    setDangerZones,
    userLocation,
    updateLocation,
    currentUser,
    addToast,
  } = useAppStore();

  const [locationInfo, setLocationInfo] = useState<LiveLocationInfo | null>(null);
  const [liveNews, setLiveNews] = useState<LiveNewsItem[]>([]);
  const [liveAdvisories, setLiveAdvisories] = useState<DangerZone[]>([]);
  const [weather, setWeather] = useState<LiveWeatherSummary | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [areaSearchInput, setAreaSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<Record<string, boolean>>({});

  // Filters
  const [sourceTab, setSourceTab] = useState<'ALL' | 'NEWS' | 'COMMUNITY'>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SafetyReportCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'ALL'>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // New report form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SafetyReportCategory>('SUSPICIOUS');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [areaName, setAreaName] = useState('');

  const fetchLiveFeed = useCallback(
    async (opts: { lat?: number; lng?: number; query?: string; radius?: number }) => {
      const hasCoords =
        typeof opts.lat === 'number' &&
        typeof opts.lng === 'number' &&
        Number.isFinite(opts.lat) &&
        Number.isFinite(opts.lng) &&
        (opts.lat !== 0 || opts.lng !== 0);
      const cleanQuery = (opts.query || '').trim();
      if (!hasCoords && !cleanQuery) return;

      setLoading(true);
      setFeedError(null);
      try {
        const params = new URLSearchParams();
        if (hasCoords) {
          params.set('lat', String(opts.lat));
          params.set('lng', String(opts.lng));
        } else {
          params.set('query', cleanQuery);
        }
        params.set('radiusKm', String(opts.radius ?? radiusKm));

        const res = await fetch(`/api/safety-feed/live?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Live Safety Feed error (HTTP ${res.status})`);
        }

        if (data.location) {
          setLocationInfo(data.location);
          if (!areaName && data.location.displayLocation) {
            setAreaName(data.location.displayLocation);
          }
        }
        setWeather(data.weather || null);
        setLiveNews(Array.isArray(data.liveNews) ? data.liveNews : []);
        const advisories: DangerZone[] = Array.isArray(data.advisories) ? data.advisories : [];
        setLiveAdvisories(advisories);
        setDangerZones(advisories);

        const reports: CommunitySafetyReport[] = Array.isArray(data.communityReports)
          ? data.communityReports
          : [];
        setCommunityReports(reports);
        setLastFetchedAt(data.fetchedAt || Date.now());
      } catch (err: any) {
        setFeedError(err?.message || 'Unable to load live local safety feed right now.');
      } finally {
        setLoading(false);
      }
    },
    [radiusKm, areaName, setCommunityReports, setDangerZones]
  );

  const requestDeviceGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFeedError('GPS geolocation is not supported on this browser. Enter your suburb or city below.');
      return;
    }
    setLocatingGps(true);
    setFeedError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateLocation(lat, lng);
        setLocatingGps(false);
        fetchLiveFeed({ lat, lng, radius: radiusKm });
      },
      (err) => {
        setLocatingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setFeedError('Location permission was denied. Allow GPS access or enter your suburb/city below to see live local alerts.');
        } else {
          setFeedError('Could not get a GPS lock right now. Enter your suburb or city below to load your local Safety Feed.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchLiveFeed, radiusKm, updateLocation]);

  // Auto-load on mount from real GPS (either store GPS or live browser geolocation)
  useEffect(() => {
    if (userLocation && (userLocation.lat !== 0 || userLocation.lng !== 0)) {
      fetchLiveFeed({ lat: userLocation.lat, lng: userLocation.lng, radius: radiusKm });
    } else {
      requestDeviceGps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualAreaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = areaSearchInput.trim();
    if (!q) return;
    fetchLiveFeed({ query: q, radius: radiusKm });
  };

  const handleRadiusChange = (nextRadius: number) => {
    setRadiusKm(nextRadius);
    if (locationInfo?.lat && locationInfo?.lng) {
      fetchLiveFeed({ lat: locationInfo.lat, lng: locationInfo.lng, radius: nextRadius });
    } else if (userLocation) {
      fetchLiveFeed({ lat: userLocation.lat, lng: userLocation.lng, radius: nextRadius });
    } else if (areaSearchInput.trim()) {
      fetchLiveFeed({ query: areaSearchInput.trim(), radius: nextRadius });
    }
  };

  const handleRefresh = () => {
    if (locationInfo?.lat && locationInfo?.lng) {
      fetchLiveFeed({ lat: locationInfo.lat, lng: locationInfo.lng, radius: radiusKm });
    } else if (userLocation) {
      fetchLiveFeed({ lat: userLocation.lat, lng: userLocation.lng, radius: radiusKm });
    } else if (areaSearchInput.trim()) {
      fetchLiveFeed({ query: areaSearchInput.trim(), radius: radiusKm });
    } else {
      requestDeviceGps();
    }
  };

  const handleVerifyReport = async (id: string) => {
    if (verifiedIds[id]) return;
    setVerifiedIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/safety-feed/report/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setCommunityReports(
          communityReports.map((r) =>
            r.id === id ? { ...r, verifications: data.verifications, verifiedByMe: true } : r
          )
        );
      }
    } catch {}
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('Please add a short title and description for the alert.', 'warn');
      return;
    }
    const lat = locationInfo?.lat ?? userLocation?.lat;
    const lng = locationInfo?.lng ?? userLocation?.lng;
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      addToast('Detect your GPS location or search your city first so the report is tagged to your real area.', 'warn');
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await fetch('/api/safety-feed/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          lat,
          lng,
          areaName: areaName.trim() || locationInfo?.displayLocation || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          reporterName: currentUser?.fullName || currentUser?.username || 'Community Member',
          reporterId: currentUser?.id,
          orgId: currentUser?.orgCode || undefined,
        }),
      });
      const created = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(created?.error || 'Could not publish report');
      }
      setCommunityReports([created, ...communityReports]);
      setTitle('');
      setDescription('');
      setCategory('SUSPICIOUS');
      setSeverity('MEDIUM');
      setIsReportModalOpen(false);
      addToast('Live community safety alert published for your area.', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to publish safety alert.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Merge and filter live news + live community reports
  const combinedItems = useMemo(() => {
    const now = Date.now();
    const cutoff =
      timeFilter === '1h'
        ? now - 3600_000
        : timeFilter === '24h'
        ? now - 86_400_000
        : timeFilter === '7d'
        ? now - 7 * 86_400_000
        : 0;

    type UnifiedItem =
      | (LiveNewsItem & { kind: 'NEWS' })
      | (CommunitySafetyReport & { kind: 'COMMUNITY' });

    const list: UnifiedItem[] = [];
    if (sourceTab === 'ALL' || sourceTab === 'COMMUNITY') {
      for (const r of communityReports) {
        list.push({ ...r, kind: 'COMMUNITY' });
      }
    }
    if (sourceTab === 'ALL' || sourceTab === 'NEWS') {
      for (const n of liveNews) {
        list.push({ ...n, kind: 'NEWS' });
      }
    }

    return list
      .filter((item) => {
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
        if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
        if (cutoff && item.timestamp < cutoff) return false;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const sourceText = item.kind === 'NEWS' ? item.source : item.reporterName;
          const hay = `${item.title} ${item.description} ${item.areaName} ${sourceText}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [communityReports, liveNews, sourceTab, categoryFilter, severityFilter, timeFilter, search]);

  const severityTone = (sev: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    if (sev === 'CRITICAL') return 'text-red-600 dark:text-red-400 font-semibold';
    if (sev === 'HIGH') return 'text-orange-600 dark:text-orange-400 font-semibold';
    if (sev === 'MEDIUM') return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-blue-600 dark:text-blue-400 font-medium';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 pb-24 space-y-5 text-left">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Live Safety Feed
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Real-time local safety news, live weather hazards, and verified community reports for your exact area.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || locatingGps}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1b34] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1b34] text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Live Map
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (locationInfo?.displayLocation && !areaName) {
                setAreaName(locationInfo.displayLocation);
              }
              setIsReportModalOpen(true);
            }}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Location Lock & Area Switcher Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Safety Feed Area
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {locatingGps
                  ? 'Detecting your live GPS location...'
                  : locationInfo?.displayLocation || 'Location not set yet'}
              </div>
              {locationInfo?.lat !== null && locationInfo?.lat !== undefined && locationInfo?.lng !== null && (
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  GPS {locationInfo.lat.toFixed(4)}, {locationInfo.lng.toFixed(4)}
                  {lastFetchedAt ? ` · Updated ${formatRelativeTime(lastFetchedAt)}` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={requestDeviceGps}
              disabled={locatingGps}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-60"
            >
              {locatingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              Use My Live GPS
            </button>
            <select
              value={radiusKm}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              aria-label="Search radius"
              className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071124] text-slate-800 dark:text-slate-100"
            >
              <option value={10}>10 km radius</option>
              <option value={25}>25 km radius</option>
              <option value={50}>50 km radius</option>
              <option value={100}>100 km radius</option>
            </select>
          </div>
        </div>

        {/* Manual Suburb / City Override for Devices Without GPS */}
        <form onSubmit={handleManualAreaSearch} className="flex gap-2">
          <input
            type="text"
            value={areaSearchInput}
            onChange={(e) => setAreaSearchInput(e.target.value)}
            placeholder="Or enter your exact suburb, town, or city (e.g. Durban, Polokwane, Soweto)..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071124] text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !areaSearchInput.trim()}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-50 whitespace-nowrap"
          >
            Set Area
          </button>
        </form>

        {feedError && (
          <div className="p-3 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{feedError}</span>
          </div>
        )}
      </div>

      {/* Live Local Weather & Real Advisories Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Live Weather Telemetry */}
        {weather && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              weather.hazardous
                ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Live Local Weather · {weather.temperatureC !== null ? `${Math.round(weather.temperatureC)}°C` : '--'} ({weather.condition})
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
                {weather.apparentTempC !== null && <span>Feels like {Math.round(weather.apparentTempC)}°C</span>}
                {weather.windSpeedKmh !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> {Math.round(weather.windSpeedKmh)} km/h
                  </span>
                )}
                <span>Rain: {weather.precipitationMm.toFixed(1)} mm</span>
              </div>
              {weather.advisoryText && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1.5">
                  Advisory: {weather.advisoryText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active Area Advisory Status */}
        {liveAdvisories.length > 0 ? (
          <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {liveAdvisories[0].name}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                {liveAdvisories[0].advisory}
              </p>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                Risk: {liveAdvisories[0].riskLevel} · Updated {formatRelativeTime(liveAdvisories[0].updatedAt)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                No Active High-Risk Advisories Detected
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {locationInfo
                  ? `Monitoring live feeds within ${radiusKm} km of ${locationInfo.displayLocation}.`
                  : 'Allow GPS or set your area above to activate live local safety monitoring.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#071124]">
            {([
              { id: 'ALL', label: `All Live (${liveNews.length + communityReports.length})` },
              { id: 'NEWS', label: `Local News (${liveNews.length})` },
              { id: 'COMMUNITY', label: `Community (${communityReports.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  sourceTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#071124]">
            {(['1h', '24h', '7d', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeFilter(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  timeFilter === tf
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf === 'ALL' ? 'All Time' : tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter local alerts by keyword, street, or source..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071124] text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            aria-label="Filter by category"
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071124] text-slate-900 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as SafetyReportCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            aria-label="Filter by severity"
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071124] text-slate-900 dark:text-white"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Live Feed Cards */}
      <div className="space-y-3">
        {loading && combinedItems.length === 0 ? (
          <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34] text-center space-y-2">
            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Loading live local safety updates...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Checking local news feeds, weather conditions, and verified community reports for your location.
            </p>
          </div>
        ) : combinedItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34] text-center">
            <AlertTriangle className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {locationInfo
                ? `No matching live alerts in ${locationInfo.displayLocation}`
                : 'Set your location to load live local safety updates'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {locationInfo
                ? 'Try clearing your filters, expanding the radius, or submit a live community report if you spot a hazard nearby.'
                : 'Tap "Use My Live GPS" or type your suburb/city above — Safety Feed never displays placeholder or fake alerts.'}
            </p>
          </div>
        ) : (
          combinedItems.map((item) => {
            if (item.kind === 'NEWS') {
              return (
                <article
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1b34] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                        <Newspaper className="w-3.5 h-3.5" /> Live Local News
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={severityTone(item.severity)}>{item.severity}</span>
                      <span aria-hidden="true">·</span>
                      <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.areaName}</span>
                    </div>
                    <span className="tabular-nums">{formatRelativeTime(item.timestamp)}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Source: <span className="font-medium text-slate-700 dark:text-slate-200">{item.source}</span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors inline-flex items-center gap-1.5 no-underline"
                    >
                      Read Source
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              );
            }

            const refLat = locationInfo?.lat ?? userLocation?.lat;
            const refLng = locationInfo?.lng ?? userLocation?.lng;
            const dist =
              refLat !== undefined && refLat !== null && refLng !== undefined && refLng !== null
                ? haversineKm(refLat, refLng, item.lat, item.lng)
                : null;
            const isVerified = Boolean(item.verifiedByMe || verifiedIds[item.id]);

            return (
              <article
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border border-emerald-200/70 dark:border-emerald-500/25 bg-white dark:bg-[#0d1b34] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Users className="w-3.5 h-3.5" /> Community Report
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={severityTone(item.severity)}>{item.severity}</span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.areaName}</span>
                    {dist !== null && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{dist.toFixed(1)} km away</span>
                      </>
                    )}
                  </div>
                  <span className="tabular-nums">{formatRelativeTime(item.timestamp)}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Reporter: <span className="font-medium text-slate-700 dark:text-slate-200">{item.reporterName}</span>
                    <span className="mx-2">·</span>
                    <span>Status: {item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyReport(item.id)}
                      disabled={isVerified}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                        isVerified
                          ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                      <span className="tabular-nums">{isVerified ? 'Confirmed' : 'Confirm'} ({item.verifications})</span>
                    </button>
                    {onOpenMap && (
                      <button
                        type="button"
                        onClick={onOpenMap}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors"
                      >
                        View Map
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Report Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#0d1b34] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Local Safety Incident</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Published live for SafetyLink users near your GPS area. For immediate danger, use the SOS button.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken traffic light or suspicious vehicle"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071124] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SafetyReportCategory)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071124] text-slate-900 dark:text-white"
                  >
                    {(Object.keys(CATEGORY_LABELS) as SafetyReportCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071124] text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Suburb / Street Location
                </label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder={locationInfo?.displayLocation || 'Your current street or suburb'}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071124] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened so nearby residents and patrols can stay safe..."
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071124] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                >
                  {submittingReport ? 'Publishing...' : 'Publish Safety Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
