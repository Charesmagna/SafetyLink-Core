import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, Plus, QrCode, RefreshCw, ShieldAlert, Trash2, Copy, Video, Wifi, Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAppStore } from '../utils/store';
import { CameraBrand, CameraDeployMode, CameraDevice } from '../types';

interface HikvisionCameraManagerProps {
  scope?: 'ORG' | 'USER';
  compact?: boolean;
}

function parseHikvisionQrPayload(raw: string): { serialNumber?: string; verificationCode?: string; name?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    if (trimmed.startsWith('{')) {
      const json = JSON.parse(trimmed);
      const sn = json.serial || json.serialNo || json.sn || json.deviceSerial;
      const code = json.verifyCode || json.verificationCode || json.code || json.vc;
      return {
        serialNumber: sn ? String(sn).toUpperCase() : undefined,
        verificationCode: code ? String(code).toUpperCase() : undefined,
      };
    }
  } catch {
    // Fall through to delimiter / serial heuristics
  }
  const tokens = trimmed.split(/[\s,;|/\n\r]+/).filter(Boolean);
  const serialMatch = tokens.find((t) => /^[A-Z0-9]{9,24}$/i.test(t) && /\d/.test(t));
  const codeMatch = tokens.find((t) => t !== serialMatch && /^[A-Z]{6}$/i.test(t));
  if (serialMatch || codeMatch) {
    return {
      serialNumber: serialMatch?.toUpperCase(),
      verificationCode: codeMatch?.toUpperCase(),
    };
  }
  return { serialNumber: trimmed.slice(0, 32).toUpperCase() };
}

export const HikvisionCameraManager: React.FC<HikvisionCameraManagerProps> = ({ scope = 'USER', compact = false }) => {
  const { cameras, currentOrg, currentUser, addCamera, updateCamera, removeCamera, probeCamera, addToast } = useAppStore();

  const activeOrgId = scope === 'ORG'
    ? (currentOrg?.id || currentUser?.orgCode || 'ORG')
    : (currentUser?.orgCode || currentOrg?.id || 'INDIVIDUAL');

  const scopedCameras = useMemo(() => {
    if (scope === 'ORG' && currentOrg?.id) {
      return cameras.filter((c) => c.orgId === currentOrg.id);
    }
    return cameras;
  }, [cameras, scope, currentOrg?.id]);

  const [showAddForm, setShowAddForm] = useState(scopedCameras.length === 0);
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | CameraDeployMode>('ALL');
  const [probingId, setProbingId] = useState<string | null>(null);
  const [previewCamId, setPreviewCamId] = useState<string | null>(null);

  // Onboarding Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CameraBrand>('HIKVISION');
  const [mode, setMode] = useState<CameraDeployMode>('HIK_CONNECT_P2P');
  const [serialNumber, setSerialNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [host, setHost] = useState('192.168.1.64');
  const [httpPort, setHttpPort] = useState(80);
  const [rtspPort, setRtspPort] = useState(554);
  const [channel, setChannel] = useState(102); // 102 = mobile sub-stream by default
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [relayUrl, setRelayUrl] = useState('');
  const [softIoTriggerId, setSoftIoTriggerId] = useState(1);
  const [triggerOnPanic, setTriggerOnPanic] = useState(true);
  const [qrPasteText, setQrPasteText] = useState('');

  const filteredCameras = useMemo(() => {
    return scopedCameras.filter((cam) => {
      const matchesMode = modeFilter === 'ALL' || cam.mode === modeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        cam.name.toLowerCase().includes(q) ||
        (cam.serialNumber || '').toLowerCase().includes(q) ||
        (cam.host || '').toLowerCase().includes(q);
      return matchesMode && matchesQuery;
    });
  }, [scopedCameras, modeFilter, searchQuery]);

  const handleScanStickerQr = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const mod = await import('@capacitor-mlkit/barcode-scanning');
        const perm = await mod.BarcodeScanner.requestPermissions();
        if (perm.camera !== 'granted' && perm.camera !== 'limited') {
          addToast('Camera permission needed to scan the Hikvision NVR/camera sticker QR.', 'warn');
          return;
        }
        const { barcodes } = await mod.BarcodeScanner.scan();
        const raw = barcodes?.[0]?.rawValue;
        if (!raw) {
          addToast('No barcode detected. Try entering the 9-digit serial manually.', 'info');
          return;
        }
        const parsed = parseHikvisionQrPayload(raw);
        if (parsed.serialNumber) setSerialNumber(parsed.serialNumber);
        if (parsed.verificationCode) setVerificationCode(parsed.verificationCode);
        setMode('HIK_CONNECT_P2P');
        addToast(`Scanned Hikvision serial: ${parsed.serialNumber || 'Detected'}`, 'success');
      } catch (err: any) {
        addToast(err?.message || 'QR scanner unavailable; paste sticker text or serial below.', 'warn');
      }
      return;
    }
    if (qrPasteText.trim()) {
      const parsed = parseHikvisionQrPayload(qrPasteText);
      if (parsed.serialNumber) setSerialNumber(parsed.serialNumber);
      if (parsed.verificationCode) setVerificationCode(parsed.verificationCode);
      addToast(`Parsed sticker data (${parsed.serialNumber || 'OK'})`, 'success');
    } else {
      addToast('On web preview, paste the camera sticker text or enter Serial + Verification Code below. On Android APK, taps open the camera QR scanner.', 'info');
    }
  };

  const handleDeployCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || `${brand} Cam ${scopedCameras.length + 1}`;
    if (mode === 'HIK_CONNECT_P2P' && !serialNumber.trim()) {
      addToast('Enter the 9-character Hikvision Serial Number from the NVR/camera sticker.', 'warn');
      return;
    }
    if (mode === 'LAN_ISAPI' && !host.trim()) {
      addToast('Enter the local LAN IP address (e.g. 192.168.1.64).', 'warn');
      return;
    }
    if (mode === 'WHEP_HLS_RELAY' && !relayUrl.trim()) {
      addToast('Enter your HTTPS WebRTC/WHEP/HLS mobile relay URL.', 'warn');
      return;
    }

    const created = addCamera({
      name: cleanName,
      brand,
      mode,
      orgId: activeOrgId,
      serialNumber: serialNumber.trim().toUpperCase() || undefined,
      host: host.trim() || undefined,
      httpPort: Number(httpPort) || 80,
      rtspPort: Number(rtspPort) || 554,
      channel: Number(channel) || 102,
      relayUrl: relayUrl.trim() || undefined,
      softIoTriggerId: Number(softIoTriggerId) || 1,
      triggerOnPanic,
      username: username.trim() || 'admin',
      password: verificationCode.trim() || password,
    });

    setName('');
    setSerialNumber('');
    setVerificationCode('');
    setPassword('');
    setRelayUrl('');
    setQrPasteText('');
    setShowAddForm(false);
    addToast(`Camera "${created.name}" registered under ${activeOrgId}.`, 'success');

    if (mode !== 'HIK_CONNECT_P2P') {
      setProbingId(created.id);
      const res = await probeCamera(created.id);
      setProbingId(null);
      addToast(res.diagnostics, res.reachable ? 'success' : 'info');
    }
  };

  const handleProbe = async (cam: CameraDevice) => {
    setProbingId(cam.id);
    const res = await probeCamera(cam.id);
    setProbingId(null);
    addToast(res.diagnostics, res.reachable ? 'success' : 'warn');
  };

  const buildRtspPreview = (cam: CameraDevice) => {
    const h = cam.host || '<CAMERA_LAN_IP>';
    const p = cam.rtspPort || 554;
    const ch = cam.channel || 102;
    return `rtsp://admin:<PASSWORD>@${h}:${p}/Streaming/Channels/${ch}`;
  };

  const buildGo2RtcYaml = (cam: CameraDevice) => {
    const slug = cam.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'hik_cam';
    return `streams:\n  ${slug}:\n    - ${buildRtspPreview(cam)}`;
  };

  const statusLabel = (s: CameraDevice['status']) => {
    if (s === 'ONLINE') return { text: 'ONLINE', cls: 'text-emerald-600 dark:text-emerald-400' };
    if (s === 'OFFLINE') return { text: 'OFFLINE', cls: 'text-amber-600 dark:text-amber-400' };
    if (s === 'ERROR') return { text: 'ERROR', cls: 'text-red-600 dark:text-red-400' };
    return { text: 'READY / UNPROBED', cls: 'text-slate-600 dark:text-slate-400' };
  };

  const activePreviewCam = scopedCameras.find((c) => c.id === previewCamId) || null;

  return (
    <div className={`space-y-4 text-left ${compact ? 'text-slate-900 dark:text-slate-100' : 'text-slate-100'}`}>
      {/* Top Bar Contract */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Hikvision &amp; ONVIF Mobile Camera Deployment</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Scope: {activeOrgId} · {scopedCameras.length} {scopedCameras.length === 1 ? 'camera' : 'cameras'} linked
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Field Playbook</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'Deploy Camera'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Zero-Router Field Deployment Strategy */}
      {showGuide && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 space-y-2.5 text-xs">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Zero-IT Phone Deployment Strategy (Customer &amp; Installer Flow)
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              <strong>Power &amp; Connect NVR/Camera to Wi-Fi or SIM Router</strong>: Plug the Hikvision camera or NVR into the site router via Ethernet or 2.4 GHz Wi-Fi. Do not waste time opening router ports.
            </li>
            <li>
              <strong>Fastest Path — Hik-Connect P2P (CG-NAT Safe)</strong>: Scan the QR code sticker underneath the camera/NVR (9-char Serial + 6-letter Verification Code). Works over Rain/MTN/Vodacom LTE SIMs immediately.
            </li>
            <li>
              <strong>On-Site Zero-Data Path — LAN ISAPI</strong>: Connect your phone to the same site Wi-Fi, choose <em>On-Site Wi-Fi / LAN</em>, pick sub-stream channel <span className="font-mono">102</span> (saves mobile data), and enable <em>Soft-IO Alarm Trigger on SOS</em>.
            </li>
            <li>
              <strong>Live In-App Viewing — go2rtc / MediaMTX Relay</strong>: For multi-guard control room streaming right inside SafetyLink, point a lightweight <span className="font-mono">go2rtc</span> relay (copied from each camera card) via HTTPS / Cloudflare Tunnel and paste its URL here.
            </li>
          </ol>
        </div>
      )}

      {/* Onboarding Form */}
      {showAddForm && (
        <form
          onSubmit={handleDeployCamera}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold">1. Choose Phone Onboarding Mode</span>
            <button
              type="button"
              onClick={handleScanStickerQr}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{Capacitor.isNativePlatform() ? 'Scan Hikvision Sticker QR' : 'Parse Sticker / QR Text'}</span>
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'HIK_CONNECT_P2P' as const, label: 'Hik-Connect P2P', sub: 'QR / Serial (No router setup)', icon: Globe },
              { id: 'LAN_ISAPI' as const, label: 'On-Site Wi-Fi / LAN', sub: 'Direct ISAPI + SOS Trigger', icon: Wifi },
              { id: 'WHEP_HLS_RELAY' as const, label: 'WebRTC / HLS Relay', sub: 'go2rtc / MediaMTX live feed', icon: Video },
            ].map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{item.sub}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Camera / Gate Label</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Gate Bullet Cam"
                maxLength={100}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Hardware Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as CameraBrand)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:border-emerald-500"
              >
                <option value="HIKVISION">Hikvision (DS-Series / NVR)</option>
                <option value="HILOOK">HiLook by Hikvision</option>
                <option value="ONVIF_GENERIC">ONVIF Profile S/G Camera</option>
              </select>
            </div>
          </div>

          {mode === 'HIK_CONNECT_P2P' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Device Serial Number (9 chars on sticker)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. K12345678"
                  maxLength={64}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Verification Code (kept local on phone only)
                </label>
                <input
                  type="password"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDEF"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:border-emerald-500"
                />
              </div>
              {!Capacitor.isNativePlatform() && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Paste QR Sticker Text (optional auto-fill)
                  </label>
                  <input
                    type="text"
                    value={qrPasteText}
                    onChange={(e) => setQrPasteText(e.target.value)}
                    placeholder="Paste scanned QR content e.g. K12345678 ABCDEF"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {mode === 'LAN_ISAPI' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Local IP / Hostname</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="192.168.1.64"
                  maxLength={128}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">HTTP / RTSP Ports</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={httpPort}
                    onChange={(e) => setHttpPort(Number(e.target.value))}
                    className="w-1/2 px-2.5 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                    title="HTTP ISAPI Port"
                  />
                  <input
                    type="number"
                    value={rtspPort}
                    onChange={(e) => setRtspPort(Number(e.target.value))}
                    className="w-1/2 px-2.5 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                    title="RTSP Port"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Stream Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option value={102}>102 (Sub-stream · Low Mobile Data)</option>
                  <option value={101}>101 (Main HD Stream)</option>
                  <option value={202}>202 (NVR Ch 2 Sub-stream)</option>
                  <option value={302}>302 (NVR Ch 3 Sub-stream)</option>
                  <option value={402}>402 (NVR Ch 4 Sub-stream)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Device Username (Local Only)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Camera / NVR Password (stored on phone only, never synced to cloud)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Camera admin password"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>
          )}

          {mode === 'WHEP_HLS_RELAY' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  HTTPS Relay Stream URL (go2rtc / MediaMTX / Cloudflare Tunnel)
                </label>
                <input
                  type="url"
                  value={relayUrl}
                  onChange={(e) => setRelayUrl(e.target.value)}
                  placeholder="https://cctv.yourdomain.online/api/stream.mp4?src=gate"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Target Channel</label>
                <input
                  type="number"
                  value={channel}
                  onChange={(e) => setChannel(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>
          )}

          {/* SOS Panic Linkage Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={triggerOnPanic}
                onChange={(e) => setTriggerOnPanic(e.target.checked)}
                className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Trigger Hikvision Soft-IO / Snapshot capture automatically on SOS Panic</span>
            </label>
            {triggerOnPanic && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">SoftIO ID:</span>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={softIoTriggerId}
                  onChange={(e) => setSoftIoTriggerId(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs font-mono tabular-nums rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Save &amp; Deploy Camera
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      {scopedCameras.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cameras by label, serial, or IP..."
            className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {[
              { id: 'ALL' as const, label: 'All' },
              { id: 'HIK_CONNECT_P2P' as const, label: 'Hik-Connect' },
              { id: 'LAN_ISAPI' as const, label: 'LAN ISAPI' },
              { id: 'WHEP_HLS_RELAY' as const, label: 'Relay' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setModeFilter(f.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  modeFilter === f.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video / Snapshot Preview Panel */}
      {activePreviewCam && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{activePreviewCam.name} · Live Stream / Frame</span>
            <button
              type="button"
              onClick={() => setPreviewCamId(null)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs"
            >
              Close Preview
            </button>
          </div>
          {activePreviewCam.relayUrl ? (
            <video
              src={activePreviewCam.relayUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full max-h-72 rounded-lg bg-black object-contain"
            />
          ) : activePreviewCam.lastSnapshotBase64 ? (
            <img
              src={activePreviewCam.lastSnapshotBase64}
              alt={`${activePreviewCam.name} latest ISAPI snapshot`}
              className="w-full max-h-72 rounded-lg object-contain bg-black"
            />
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
              No HTTPS relay URL or captured snapshot yet. Run <strong>Test Connection</strong> on LAN ISAPI or launch Hik-Connect on your phone.
            </div>
          )}
        </div>
      )}

      {/* Camera Fleet List or Empty State */}
      {filteredCameras.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {scopedCameras.length === 0
              ? 'No Hikvision or ONVIF cameras deployed yet.'
              : 'No cameras match your current filter.'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Deploy a camera from your phone in under 60 seconds using the sticker serial number or site Wi-Fi IP.
          </p>
          {!showAddForm && scopedCameras.length === 0 && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Deploy First Camera
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCameras.map((cam) => {
            const st = statusLabel(cam.status);
            return (
              <div
                key={cam.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span>{cam.name}</span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className={`font-mono text-[11px] ${st.cls}`}>{st.text}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                      {cam.brand} · {cam.mode} · Ch {cam.channel}
                      {cam.serialNumber ? ` · SN ${cam.serialNumber}` : ''}
                      {cam.host ? ` · ${cam.host}:${cam.httpPort || 80}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {cam.mode === 'HIK_CONNECT_P2P' && (
                      <a
                        href="hikconnect://"
                        onClick={() => addToast('Opening Hik-Connect mobile app (install from Play Store if not yet installed).', 'info')}
                        className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 whitespace-nowrap"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open App</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleProbe(cam)}
                      disabled={probingId === cam.id}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${probingId === cam.id ? 'animate-spin' : ''}`} />
                      <span>{probingId === cam.id ? 'Probing...' : 'Test'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewCamId(previewCamId === cam.id ? null : cam.id)}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 whitespace-nowrap"
                    >
                      <Video className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCamera(cam.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                      title="Remove camera"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {cam.lastError && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                    {cam.lastError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={cam.triggerOnPanic}
                      onChange={(e) => updateCamera(cam.id, { triggerOnPanic: e.target.checked })}
                      className="rounded border-slate-400 text-emerald-600"
                    />
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>SOS Soft-IO Trigger #{cam.softIoTriggerId}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(buildRtspPreview(cam)).catch(() => {});
                        addToast('Copied RTSP template URI.', 'success');
                      }}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy RTSP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(buildGo2RtcYaml(cam)).catch(() => {});
                        addToast('Copied go2rtc.yaml mobile relay snippet.', 'success');
                      }}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy go2rtc</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
