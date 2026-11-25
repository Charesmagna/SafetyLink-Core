import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../utils/store';
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  CreditCard,
  ExternalLink,
  Radio,
  RefreshCw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';

type CheckStatus = 'PENDING' | 'PASS' | 'FAIL';

interface FieldCheckItem {
  id: string;
  category: 'EMERGENCY' | 'OFFLINE' | 'HARDWARE' | 'BILLING';
  title: string;
  criteria: string;
}

const FIELD_CHECKLIST: FieldCheckItem[] = [
  {
    id: 'online_panic_chain',
    category: 'EMERGENCY',
    title: 'Online Panic → Cloud FCM + Mandatory SMS + Mandatory Call',
    criteria: 'Verify Cloud FCM loud alarm rings contact phone, direct SIM SMS sends with GPS coordinates, and direct call dials automatically.',
  },
  {
    id: 'call_stay_open',
    category: 'EMERGENCY',
    title: 'Active Voice Call Stays Minimized (App Does Not Close)',
    criteria: 'Confirm SafetyLink returns to foreground ~1s after CALL_PHONE starts while the call stays active in the Android notification bar (WhatsApp still opens normally).',
  },
  {
    id: 'locked_screen_wake',
    category: 'EMERGENCY',
    title: 'Locked-Screen & Screen-Off SOS Trigger + Wake Overlay',
    criteria: 'Lock screen, trigger panic via iTAG or widget, confirm screen wakes, countdown overlay appears over lock screen, and Safe PIN / Duress PIN work.',
  },
  {
    id: 'offline_rain_ussd',
    category: 'OFFLINE',
    title: 'R0.00 / 0MB Offline Panic → USSD Please Call Me → Rain SIM → FCM + SMS',
    criteria: 'Enable Zero-Airtime USSD Relay on Mission Control, turn off Wi-Fi and mobile data, trigger SOS, and verify USSD fires before voice call and Rain SIM triggers contact FCM loud alarm.',
  },
  {
    id: 'ble_itag_reboot',
    category: 'HARDWARE',
    title: 'BLE iTAG Hardware Trigger, Disconnect/Reconnect & Post-Reboot Recovery',
    criteria: 'Press iTAG button for SOS, walk out of range and return to confirm auto-reconnect, then reboot device and verify foreground watchdog restores.',
  },
  {
    id: 'qr_countdown_settings',
    category: 'HARDWARE',
    title: '1-Way / 2-Way QR Contact Link + Adjustable Countdown + 6-Category Settings',
    criteria: 'Scan QR between two phones (2-Way), change countdown duration, test search bar in Settings, and verify Light & Deep Navy themes match across screens.',
  },
  {
    id: 'safety_feed_hotspots',
    category: 'EMERGENCY',
    title: 'Live Local Safety Feed + Crime Hotspot Warning + BigDataCloud Geolocation',
    criteria: 'Confirm current suburb/city resolves accurately, local + provincial headlines load, and hotspot warning banner + optional chime trigger cleanly.',
  },
  {
    id: 'live_billing_restore',
    category: 'BILLING',
    title: 'Live PayFast & Paystack Checkout + Super Admin Customer DB Restore',
    criteria: 'Run live test checkout on PayFast and Paystack, confirm automatic active subscription upgrade via webhook, and run Restore Customer Database in Super Admin.',
  },
];

const STORAGE_KEY = 'sl_v2_field_test_checklist_v1';

interface LaunchHealthPayload {
  checkedAt?: string;
  environment?: string;
  api?: { status?: string; dbBound?: boolean };
  rainGateway?: {
    number?: string;
    ok?: boolean;
    status?: string;
    gateways?: Array<{ gateway_id?: string; last_seen?: number; silent_minutes?: number; status?: string }>;
  };
  providers?: Record<string, boolean>;
  billing?: {
    payfastConfigured?: boolean;
    payfastLiveMode?: boolean;
    payfastSandbox?: boolean;
    paystackConfigured?: boolean;
    paystackLiveMode?: boolean;
  };
  metrics?: {
    totalAccounts?: number;
    activeSubscribers?: number;
    totalOrgs?: number;
    activeLast24Hours?: number;
    devicesRegistered?: number;
    panicsLast30Days?: number;
  };
}

export const LaunchReadinessPanel: React.FC = () => {
  const { customBackendUrl, addToast } = useAppStore();
  const [health, setHealth] = useState<LaunchHealthPayload | null>(null);
  const [latestRelease, setLatestRelease] = useState<{ tag: string; publishedAt: string; assets: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [checks, setChecks] = useState<Record<string, { status: CheckStatus; note: string }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    } catch {}
  }, [checks]);

  const setCheckStatus = (id: string, status: CheckStatus) => {
    setChecks((prev) => ({
      ...prev,
      [id]: { status, note: prev[id]?.note || '' },
    }));
  };

  const setCheckNote = (id: string, note: string) => {
    setChecks((prev) => ({
      ...prev,
      [id]: { status: prev[id]?.status || 'PENDING', note },
    }));
  };

  const runLiveHealthCheck = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const base = (customBackendUrl || 'https://api.safetylink.online').trim().replace(/\/+$/, '');
    const token =
      localStorage.getItem('sl_admin_session_token') ||
      localStorage.getItem('sl_auth_token') ||
      '';

    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${base}/api/admin/launch-health`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        // Public non-sensitive fallback probe if Super Admin bearer token is not yet issued for edge API
        const [provRes, pcmRes, gwRes] = await Promise.all([
          fetch(`${base}/api/health/providers`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}/api/pcm/health`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`${base}/api/pcm/gateway`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        setHealth({
          checkedAt: new Date().toISOString(),
          environment: 'edge-public-probe',
          api: { status: provRes ? 'ONLINE' : 'DEGRADED', dbBound: true },
          rainGateway: {
            number: gwRes?.number || '+27816738186',
            ...(pcmRes || {}),
          },
          providers: provRes || {},
        });
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Unable to reach live SafetyLink API');
    }

    try {
      const relRes = await fetch('https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest', {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (relRes.ok) {
        const rel = await relRes.json();
        setLatestRelease({
          tag: rel.tag_name || 'latest',
          publishedAt: rel.published_at || '',
          assets: Array.isArray(rel.assets) ? rel.assets.map((a: any) => a.name) : [],
        });
      }
    } catch {}

    setLoading(false);
  }, [customBackendUrl]);

  useEffect(() => {
    runLiveHealthCheck();
  }, [runLiveHealthCheck]);

  const progress = useMemo(() => {
    const passed = FIELD_CHECKLIST.filter((c) => checks[c.id]?.status === 'PASS').length;
    const failed = FIELD_CHECKLIST.filter((c) => checks[c.id]?.status === 'FAIL').length;
    const pct = Math.round((passed / FIELD_CHECKLIST.length) * 100);
    return { passed, failed, total: FIELD_CHECKLIST.length, pct };
  }, [checks]);

  const copyValue = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    addToast(`Copied ${label}`, 'success');
  };

  const primaryGateway = health?.rainGateway?.gateways?.[0];
  const rainStatus =
    primaryGateway?.status === 'online' || health?.rainGateway?.ok
      ? 'ONLINE'
      : primaryGateway?.silent_minutes && primaryGateway.silent_minutes > 15
        ? 'STALE'
        : 'MONITORING';

  return (
    <div className="space-y-6 animate-fadeIn text-left" data-testid="launch-readiness-panel">
      {/* Header & Refresh */}
      <div className="glass-panel p-5 border-l-4 border-l-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider font-mono text-slate-100">
              Commercial Launch Readiness &amp; Live Operations Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status of Edge API, Rain SIM Zero-Airtime Watchdog, PayFast/Paystack Billing, APK/Web/EXE releases, and v2 Real-Device sign-off.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={runLiveHealthCheck}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Probing...' : 'Run Live Health Check'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 font-mono">
          Live probe warning: {errorMsg}
        </div>
      )}

      {/* 4 Production Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Edge API &amp; DB</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-400">
            {health?.api?.status || 'CHECKING...'}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {health?.checkedAt ? `Checked ${new Date(health.checkedAt).toLocaleTimeString()}` : 'api.safetylink.online'}
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Rain SIM PCM Gateway</span>
            <Radio className={`w-4 h-4 ${rainStatus === 'STALE' ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-lg font-black font-mono ${rainStatus === 'STALE' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {rainStatus}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            SIM: {health?.rainGateway?.number || '+27816738186'}
            {primaryGateway?.silent_minutes !== undefined ? ` · ${primaryGateway.silent_minutes}m ago` : ''}
          </p>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Consumer Billing</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">PayFast:</span>
              <span className={health?.billing?.payfastLiveMode ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {health?.billing?.payfastLiveMode
                  ? 'LIVE'
                  : health?.billing?.payfastSandbox
                    ? 'SANDBOX'
                    : health?.billing
                      ? 'SET SECRETS'
                      : 'VERIFY'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Paystack:</span>
              <span className={health?.billing?.paystackLiveMode ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {health?.billing?.paystackLiveMode
                  ? 'LIVE'
                  : health?.billing?.paystackConfigured
                    ? 'TEST KEY'
                    : health?.billing
                      ? 'SET SECRETS'
                      : 'VERIFY'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Distribution Builds</span>
            <Smartphone className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-black font-mono text-slate-100 truncate">
            {latestRelease?.tag || 'v2 Release Ready'}
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">
            APK · Web · Windows EXE
          </p>
        </div>
      </div>

      {/* Live Provider Matrix */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Live Emergency &amp; Enrichment Provider Matrix
          </h3>
          {health?.metrics && (
            <span className="text-[10px] font-mono text-slate-400">
              Accounts: {health.metrics.totalAccounts ?? 0} · Active: {health.metrics.activeSubscribers ?? 0}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[10px]">
          {[
            { key: 'fcm', label: 'Firebase FCM Loud Ring' },
            { key: 'smsgate', label: 'Rain SIM SMSGate' },
            { key: 'twilio', label: 'Twilio SMS / Voice' },
            { key: 'vapi', label: 'VAPI AI Voice' },
            { key: 'africasTalking', label: "Africa's Talking" },
            { key: 'bland', label: 'Bland Voice Backup' },
            { key: 'bigDataCloud', label: 'BigDataCloud Geo' },
            { key: 'freeNewsApi', label: 'FreeNewsAPI Feed' },
          ].map((p) => {
            const active = Boolean(health?.providers?.[p.key]);
            return (
              <div
                key={p.key}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <span className="truncate">{p.label}</span>
                <span className={`font-black shrink-0 ${active ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {active ? 'READY' : 'CHECK'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive v2 Real-Device Field Test Sign-Off Checklist */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              v2 Real-Device Field Test Sign-Off ({progress.passed}/{progress.total} Passed)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Complete each test on a physical Android phone before flipping public commercial launch. Progress saves automatically.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono">
              <div className="text-sm font-black text-emerald-400">{progress.pct}%</div>
              <div className="text-[9px] text-slate-500 uppercase">Launch Gate</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setChecks({});
                addToast('Field test checklist reset', 'info');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress.pct}%` }}
          />
        </div>

        <div className="space-y-3">
          {FIELD_CHECKLIST.map((item) => {
            const state = checks[item.id]?.status || 'PENDING';
            const note = checks[item.id]?.note || '';
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-colors space-y-2 ${
                  state === 'PASS'
                    ? 'bg-emerald-950/15 border-emerald-500/30'
                    : state === 'FAIL'
                      ? 'bg-red-950/15 border-red-500/30'
                      : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-slate-100">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.criteria}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCheckStatus(item.id, 'PASS')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        state === 'PASS'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckStatus(item.id, 'FAIL')}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        state === 'FAIL'
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-red-300'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> FAIL
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setCheckNote(item.id, e.target.value)}
                  placeholder="Optional device/test evidence note (e.g. Samsung A54 · MTN SIM · 3s ring)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Webhook Endpoints & Multi-Channel Release Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 space-y-3">
          <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Live Production Webhook URLs (PayFast, Paystack &amp; IoT)
          </h3>
          <div className="space-y-2 font-mono text-[10px]">
            {[
              { label: 'PayFast ITN Notify URL', url: 'https://api.safetylink.online/api/payfast/notify' },
              { label: 'Paystack Live Webhook URL', url: 'https://api.safetylink.online/api/paystack/webhook' },
              { label: 'IoT Hardware Panic Webhook', url: 'https://api.safetylink.online/api/webhook/iot-panic' },
              { label: 'Rain SIM PCM Heartbeat URL', url: 'https://api.safetylink.online/api/pcm/heartbeat' },
            ].map((ep) => (
              <div key={ep.label} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">{ep.label}</div>
                  <div className="text-emerald-300 truncate">{ep.url}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue(ep.label, ep.url)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5 space-y-3">
          <h3 className="text-xs font-black font-mono uppercase tracking-wider text-slate-200">
            Launch Cutover &amp; Distribution Links (APK · Web · EXE)
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Once all 8 real-device tests pass, rotate all development API keys/PATs, verify PayFast &amp; Paystack live keys on Cloudflare Workers, and publish the verified APK, Web, and Windows EXE builds.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
            <a
              href="https://safetylink.online"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-slate-200 flex items-center justify-between"
            >
              <span>Web App (safetylink.online)</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://api.safetylink.online/download/safetylink.apk"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-slate-200 flex items-center justify-between"
            >
              <span>Signed Android APK</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://github.com/Charesmagna/SafetyLink-Core/releases/latest"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-slate-200 flex items-center justify-between"
            >
              <span>Windows EXE Release</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href="https://github.com/Charesmagna/SafetyLink-Core/actions"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-slate-200 flex items-center justify-between"
            >
              <span>GitHub Actions Gates</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
