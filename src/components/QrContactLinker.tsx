import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../utils/store';
import { syncProfile } from '../services/ProfileSync';

interface FcmStatusSnapshot {
  phone?: string;
  registered?: boolean;
  deviceCount?: number;
  lastUpdated?: number | null;
}

interface ScannedPartner {
  name: string;
  phone: string;
  code?: string;
  fcmStatus?: FcmStatusSnapshot | null;
}

const DEFAULT_API_BASE = 'https://api.safetylink.online';

function normalizeSaPhone(raw: string): string {
  let n = String(raw || '').replace(/[^0-9+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0') && n.length === 10) n = '27' + n.slice(1);
  if (n.length === 9 && /^[6-8]/.test(n)) n = '27' + n;
  return n ? '+' + n : '';
}

function parseSafetyLinkQrText(raw: string): { name: string; phone: string; code?: string } | null {
  const txt = String(raw || '').trim();
  if (!txt) return null;

  // 1. Canonical JSON payload: {"v":1,"t":"SL_LINK","name":"...","phone":"+27...","code":"SL-XXXXXX"}
  try {
    const parsed = JSON.parse(txt);
    if (parsed && (parsed.t === 'SL_LINK' || parsed.phone)) {
      const phone = normalizeSaPhone(parsed.phone || '');
      if (phone.length >= 10) {
        return {
          name: String(parsed.name || 'SafetyLink Contact').trim().slice(0, 60),
          phone,
          code: typeof parsed.code === 'string' ? parsed.code.trim().toUpperCase() : undefined,
        };
      }
    }
  } catch {
    // fall through
  }

  // 2. Direct pairing code (SL-XXXXXX)
  const codeMatch = txt.toUpperCase().match(/\bSL-[A-Z0-9]{6}\b/);
  if (codeMatch) {
    return { name: '', phone: '', code: codeMatch[0] };
  }

  // 3. URL format: safetylink://link?phone=...&name=...&code=...
  try {
    const u = new URL(txt);
    const phone = normalizeSaPhone(u.searchParams.get('phone') || '');
    const code = (u.searchParams.get('code') || '').trim().toUpperCase() || undefined;
    const name = (u.searchParams.get('name') || 'SafetyLink Contact').trim().slice(0, 60);
    if (phone.length >= 10 || code) {
      return { name, phone, code };
    }
  } catch {
    // ignore
  }

  return null;
}

export const QrContactLinker: React.FC = () => {
  const currentUser = useAppStore(s => s.currentUser);
  const contacts = useAppStore(s => s.contacts);
  const customBackendUrl = useAppStore(s => s.customBackendUrl);
  const addContact = useAppStore(s => s.addContact);
  const addToast = useAppStore(s => s.addToast);
  const addAuditLog = useAppStore(s => s.addAuditLog);

  const [modeTab, setModeTab] = useState<'GENERATE' | 'SCAN'>('GENERATE');

  // Generate QR state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [myFcmStatus, setMyFcmStatus] = useState<FcmStatusSnapshot | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [incomingLinkedNotice, setIncomingLinkedNotice] = useState<string>('');

  // Scan QR state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isResolvingCode, setIsResolvingCode] = useState<boolean>(false);
  const [scannedPartner, setScannedPartner] = useState<ScannedPartner | null>(null);
  const [selectedLinkMode, setSelectedLinkMode] = useState<'TWO_WAY' | 'ONE_WAY'>('TWO_WAY');
  const [isClaimingLink, setIsClaimingLink] = useState<boolean>(false);
  const [completedLink, setCompletedLink] = useState<{
    name: string;
    phone: string;
    mode: 'TWO_WAY' | 'ONE_WAY';
    fcmStatus?: FcmStatusSnapshot | null;
    synced: boolean;
  } | null>(null);
  const [isTestingRing, setIsTestingRing] = useState<boolean>(false);
  const [testRingResult, setTestRingResult] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const apiBase = (customBackendUrl || DEFAULT_API_BASE).replace(/\/+$/, '');
  const myPhone = normalizeSaPhone(currentUser?.phone || '');
  const myName = (currentUser?.fullName || currentUser?.username || 'SafetyLink Member').trim();

  const stopCamera = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (modeTab !== 'SCAN') {
      stopCamera();
    }
  }, [modeTab]);

  // Helper: add a contact locally if not already present (deduped by normalized SA phone)
  const ensureLocalContact = (name: string, phone: string, noteLabel: string) => {
    const norm = normalizeSaPhone(phone);
    if (!norm) return false;
    const existing = useAppStore.getState().contacts || [];
    const dup = existing.some(c => normalizeSaPhone(c.phone) === norm);
    if (dup) return false;
    addContact({
      label: name || 'SafetyLink Contact',
      name: name || 'SafetyLink Contact',
      phone: norm,
      relation: noteLabel,
      channelType: 'CALL',
      hasWhatsApp: true,
      priority: existing.length + 1,
    });
    return true;
  };

  const generateMyQr = async () => {
    if (!myPhone || myPhone.length < 10) {
      addToast('Add your phone number to your profile before generating a SafetyLink QR code.', 'warn');
      return;
    }
    setIsGenerating(true);
    setIncomingLinkedNotice('');
    try {
      // Sync profile & FCM token first so partner sees accurate FCM readiness
      void syncProfile(true);

      let serverCode = '';
      let serverExp: number | null = null;
      let serverFcm: FcmStatusSnapshot | null = null;

      try {
        const res = await fetch(`${apiBase}/api/link/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: myPhone, name: myName }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          serverCode = data.code || '';
          serverExp = data.expiresAt || null;
          serverFcm = data.fcmStatus || null;
        }
      } catch {
        // Offline QR fallback still works locally
      }

      const payload = JSON.stringify({
        v: 1,
        t: 'SL_LINK',
        name: myName.slice(0, 60),
        phone: myPhone,
        ...(serverCode ? { code: serverCode } : {}),
      });

      const url = await QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#020617', light: '#FFFFFF' },
      });

      setQrDataUrl(url);
      setPairingCode(serverCode);
      setExpiresAt(serverExp);
      setMyFcmStatus(serverFcm);
    } catch (e: any) {
      addToast(`QR generation failed: ${e?.message || e}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate when opening Generate tab with a valid phone
  useEffect(() => {
    if (modeTab === 'GENERATE' && myPhone.length >= 10 && !qrDataUrl && !isGenerating) {
      void generateMyQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeTab, myPhone]);

  // While showing QR code, poll for incoming 2-way mutual links so partner's scan appears live!
  useEffect(() => {
    if (modeTab !== 'GENERATE' || !qrDataUrl || !myPhone) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`${apiBase}/api/link/incoming?phone=${encodeURIComponent(myPhone)}&ack=1`);
        const data: any = await res.json().catch(() => ({}));
        if (!active || !res.ok || !Array.isArray(data.links) || data.links.length === 0) return;
        let addedAny = false;
        const names: string[] = [];
        for (const item of data.links) {
          if (item?.phone) {
            const added = ensureLocalContact(item.name || 'SafetyLink Contact', item.phone, 'QR Mutual Emergency Contact');
            if (added) addedAny = true;
            names.push(`${item.name || item.phone}`);
          }
        }
        if (names.length > 0) {
          setIncomingLinkedNotice(`2-Way Mutual Link confirmed with ${names.join(', ')}!`);
          addToast(`Mutual SafetyLink contact added: ${names.join(', ')}`, 'success');
          if (addedAny) {
            void syncProfile(true);
          }
        }
      } catch {
        // ignore transient poll errors
      }
    };
    void poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeTab, qrDataUrl, myPhone, apiBase]);

  const hydrateScannedPartner = async (rawText: string) => {
    const parsed = parseSafetyLinkQrText(rawText);
    if (!parsed) {
      addToast('Not a valid SafetyLink QR code.', 'warn');
      return;
    }

    stopCamera();
    setCompletedLink(null);
    setTestRingResult('');
    setIsResolvingCode(true);

    try {
      let resolvedName = parsed.name;
      let resolvedPhone = parsed.phone;
      let resolvedCode = parsed.code;
      let fcmStatus: FcmStatusSnapshot | null = null;

      if (resolvedCode && (!resolvedPhone || !resolvedName)) {
        const res = await fetch(`${apiBase}/api/link/resolve?code=${encodeURIComponent(resolvedCode)}`);
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          addToast(data.error || 'Pairing code expired or invalid.', 'warn');
          return;
        }
        resolvedPhone = normalizeSaPhone(data.phone || '');
        resolvedName = data.name || resolvedName || 'SafetyLink Contact';
        fcmStatus = data.fcmStatus || null;
      }

      if (!resolvedPhone || resolvedPhone.length < 10) {
        addToast('QR code did not contain a valid phone number.', 'warn');
        return;
      }
      if (myPhone && resolvedPhone === myPhone) {
        addToast('That is your own SafetyLink QR code — scan another person’s phone.', 'warn');
        return;
      }

      if (!fcmStatus) {
        try {
          const stRes = await fetch(`${apiBase}/api/device/token/status?phone=${encodeURIComponent(resolvedPhone)}`);
          const stData: any = await stRes.json().catch(() => null);
          if (stRes.ok && stData) fcmStatus = stData;
        } catch {
          // offline check skipped
        }
      }

      setScannedPartner({
        name: resolvedName || 'SafetyLink Contact',
        phone: resolvedPhone,
        code: resolvedCode,
        fcmStatus,
      });
      setSelectedLinkMode('TWO_WAY');
    } finally {
      setIsResolvingCode(false);
    }
  };

  const startCameraScan = async () => {
    setCameraError('');
    setScannedPartner(null);
    setCompletedLink(null);

    // Try Capacitor MLKit barcode scanner first on native Android if available
    if (Capacitor.isNativePlatform()) {
      try {
        const mod = await import('@capacitor-mlkit/barcode-scanning');
        const perm = await mod.BarcodeScanner.requestPermissions();
        if (perm.camera === 'granted' || perm.camera === 'limited') {
          const result = await mod.BarcodeScanner.scan();
          const first = result?.barcodes?.[0]?.rawValue;
          if (first) {
            await hydrateScannedPartner(first);
            return;
          }
        }
      } catch {
        // Fallback smoothly to WebRTC camera + jsQR below
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable in this browser. Upload a QR screenshot or enter the 6-character code below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      // Attach stream once video mounts
      window.setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        void video.play().catch(() => {});

        scanTimerRef.current = window.setInterval(() => {
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (!v || !canvas || v.readyState < 2 || v.videoWidth === 0) return;
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (decoded?.data) {
            void hydrateScannedPartner(decoded.data);
          }
        }, 250);
      }, 100);
    } catch (e: any) {
      setCameraError(`Camera permission denied or unavailable (${e?.message || 'error'}). Use Upload QR Image or Manual Pairing Code below.`);
      setIsCameraActive(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(data.data, data.width, data.height);
        if (decoded?.data) {
          void hydrateScannedPartner(decoded.data);
        } else {
          addToast('No readable QR code found in that image.', 'warn');
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualCodeSubmit = async () => {
    const cleaned = manualCodeInput.trim().toUpperCase();
    const formatted = cleaned.startsWith('SL-') ? cleaned : `SL-${cleaned}`;
    await hydrateScannedPartner(formatted);
  };

  const handleConfirmLink = async () => {
    if (!scannedPartner) return;
    setIsClaimingLink(true);
    setTestRingResult('');
    try {
      const relationTag = selectedLinkMode === 'TWO_WAY' ? 'QR Mutual Emergency Contact' : 'QR Emergency Contact';
      ensureLocalContact(scannedPartner.name, scannedPartner.phone, relationTag);

      let serverFcm = scannedPartner.fcmStatus || null;
      let serverClaimOk = false;

      if (myPhone.length >= 10) {
        try {
          const res = await fetch(`${apiBase}/api/link/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: scannedPartner.code,
              targetPhone: scannedPartner.phone,
              targetName: scannedPartner.name,
              scannerPhone: myPhone,
              scannerName: myName,
              mode: selectedLinkMode,
            }),
          });
          const data: any = await res.json().catch(() => ({}));
          if (res.ok && data.ok) {
            serverClaimOk = true;
            if (data.target?.fcmStatus) serverFcm = data.target.fcmStatus;
          }
        } catch {
          // Local contact is still added; ProfileSync will retry server sync
        }
      }

      const synced = await syncProfile(true);

      addAuditLog(
        'SYSTEM',
        'INFO',
        `QR Contact Linked (${selectedLinkMode})`,
        `${scannedPartner.name} (${scannedPartner.phone}) • Server: ${serverClaimOk ? 'LINKED' : 'LOCAL_ONLY'} • FCM: ${serverFcm?.registered ? 'READY' : 'PENDING'}`
      );
      addToast(
        selectedLinkMode === 'TWO_WAY'
          ? `Two-Way Mutual Link active with ${scannedPartner.name}!`
          : `${scannedPartner.name} added to your emergency contacts!`,
        'success'
      );

      setCompletedLink({
        name: scannedPartner.name,
        phone: scannedPartner.phone,
        mode: selectedLinkMode,
        fcmStatus: serverFcm,
        synced: synced || serverClaimOk,
      });
      setScannedPartner(null);
      setManualCodeInput('');
    } finally {
      setIsClaimingLink(false);
    }
  };

  const handleTestRingLinkedContact = async () => {
    if (!completedLink) return;
    setIsTestingRing(true);
    setTestRingResult('');
    try {
      const res = await fetch(`${apiBase}/api/fcm/test-ring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: completedLink.phone,
          callerName: myName,
          callerNumber: myPhone || completedLink.phone,
          location: 'QR Instant-Link Loud Ring Verification',
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setTestRingResult(`✓ Firebase accepted loud alarm for ${data.registeredDevices || 1} device(s) on ${completedLink.phone}.`);
        addToast(`Real FCM loud alarm sent to ${completedLink.name}!`, 'success');
      } else {
        setTestRingResult(`⚠ ${data.error || `HTTP ${res.status}`} — make sure ${completedLink.name} opened SafetyLink while signed in.`);
        addToast(data.error || 'Contact device not FCM-registered yet.', 'warn');
      }
    } catch (e: any) {
      setTestRingResult(`⚠ Request failed: ${e?.message || e}`);
    } finally {
      setIsTestingRing(false);
    }
  };

  return (
    <div
      className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3.5 font-mono text-left"
      data-testid="qr-contact-linker"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h5 className="text-[10px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔗</span> QR Instant Contact &amp; FCM Linker
          </h5>
          <p className="text-[8.5px] text-slate-400 mt-0.5 font-sans">
            Scan another SafetyLink user&apos;s QR code (or share yours) to instantly link emergency contacts, choose <strong className="text-slate-200">Two-Way Mutual</strong> or <strong className="text-slate-200">One-Way</strong>, and verify FCM loud-ring readiness.
          </p>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[8px] font-bold shrink-0 self-start sm:self-center">
          {contacts.length} CONTACT{contacts.length === 1 ? '' : 'S'} LINKED
        </span>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-900">
        <button
          type="button"
          onClick={() => setModeTab('GENERATE')}
          className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
            modeTab === 'GENERATE'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📱 Show My QR Code
        </button>
        <button
          type="button"
          onClick={() => setModeTab('SCAN')}
          className={`py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
            modeTab === 'SCAN'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📷 Scan Partner QR
        </button>
      </div>

      {/* GENERATE TAB */}
      {modeTab === 'GENERATE' && (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-3">
          {!myPhone ? (
            <p className="text-[9px] text-amber-300">
              Please add your phone number in your SafetyLink profile first to generate a scannable QR code.
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-md shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="My SafetyLink QR Code"
                      className="w-40 h-40 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-700 text-[9px]">
                      {isGenerating ? 'Generating QR...' : 'Tap Refresh QR'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Linked SafetyLink Identity</div>
                    <div className="text-[11px] font-black text-slate-100">{myName}</div>
                    <div className="text-[10px] text-cyan-300 font-mono">{myPhone}</div>
                  </div>

                  {pairingCode && (
                    <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5">
                      <div>
                        <span className="text-[7px] text-slate-500 uppercase block">Manual Pairing Code (15 min)</span>
                        <span className="text-[12px] font-black tracking-widest text-amber-300">{pairingCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(pairingCode).catch(() => {});
                          addToast(`Copied pairing code ${pairingCode}`, 'info');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[8px] font-bold text-slate-200 uppercase"
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[8px] px-2 py-1 rounded bg-slate-900/70">
                    <span className="text-slate-400">Your Phone FCM Status</span>
                    <span className={myFcmStatus?.registered ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {myFcmStatus?.registered
                        ? `✓ READY (${myFcmStatus.deviceCount} DEVICE${myFcmStatus.deviceCount === 1 ? '' : 'S'})`
                        : 'OPEN ANDROID APK & TAP SYNC'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={generateMyQr}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[8.5px] font-bold text-emerald-300 uppercase"
                    >
                      {isGenerating ? 'Refreshing...' : '↻ Refresh QR & Code'}
                    </button>
                    {expiresAt && (
                      <span className="text-[7.5px] text-slate-500">
                        Valid until {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {incomingLinkedNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold">
                  ✓ {incomingLinkedNotice}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SCAN TAB */}
      {modeTab === 'SCAN' && (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-3">
          {!scannedPartner && !completedLink && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCameraScan}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-bold uppercase tracking-wider shadow"
                  >
                    📷 Open QR Camera Scanner
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider"
                  >
                    ✕ Stop Camera
                  </button>
                )}

                <label className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[8.5px] font-bold uppercase cursor-pointer">
                  🖼️ Scan QR Screenshot
                  <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                </label>
              </div>

              {cameraError && (
                <p className="text-[8.5px] text-amber-300 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2">
                  {cameraError}
                </p>
              )}

              {isCameraActive && (
                <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-black max-w-xs mx-auto">
                  <video ref={videoRef} className="w-full h-56 object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-36 border-2 border-emerald-400 rounded-xl shadow-[0_0_0_999px_rgba(2,6,23,0.45)]" />
                  </div>
                  <div className="absolute bottom-2 inset-x-0 text-center text-[8px] text-emerald-300 font-bold bg-slate-950/70 py-1">
                    Point camera at partner&apos;s SafetyLink QR code
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-900 space-y-1.5">
                <label className="text-[8px] text-slate-500 uppercase font-bold block">
                  Or Enter 6-Character Pairing Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={e => setManualCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. SL-7K4M9P"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-100 uppercase tracking-widest focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    disabled={isResolvingCode || manualCodeInput.trim().length < 6}
                    onClick={handleManualCodeSubmit}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 text-[9px] font-bold uppercase"
                  >
                    {isResolvingCode ? 'Looking up...' : 'Lookup'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TWO-WAY vs ONE-WAY CONFIRMATION PROMPT */}
          {scannedPartner && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[8px] text-cyan-300 uppercase font-bold">QR Contact Detected</div>
                  <div className="text-[12px] font-black text-white">{scannedPartner.name}</div>
                  <div className="text-[10px] text-slate-300">{scannedPartner.phone}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    scannedPartner.fcmStatus?.registered
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {scannedPartner.fcmStatus?.registered
                    ? `✓ FCM READY (${scannedPartner.fcmStatus.deviceCount})`
                    : '⚠ FCM NOT SYNCED YET'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-[8.5px] font-bold text-slate-300 uppercase">
                  How should this link work?
                </div>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedLinkMode === 'TWO_WAY'
                      ? 'bg-emerald-950/50 border-emerald-500/60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="qrLinkMode"
                    checked={selectedLinkMode === 'TWO_WAY'}
                    onChange={() => setSelectedLinkMode('TWO_WAY')}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div>
                    <div className="text-[9.5px] font-black text-emerald-300 uppercase">
                      🔄 Two-Way Mutual Link (Recommended)
                    </div>
                    <p className="text-[8px] text-slate-400 font-sans mt-0.5">
                      Adds <strong>{scannedPartner.name}</strong> to your emergency contacts AND automatically adds you to their emergency contacts so both phones ring via FCM and Rain PCM.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedLinkMode === 'ONE_WAY'
                      ? 'bg-cyan-950/50 border-cyan-500/60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="qrLinkMode"
                    checked={selectedLinkMode === 'ONE_WAY'}
                    onChange={() => setSelectedLinkMode('ONE_WAY')}
                    className="mt-0.5 accent-cyan-500"
                  />
                  <div>
                    <div className="text-[9.5px] font-black text-cyan-300 uppercase">
                      ➡️ One-Way Link Only
                    </div>
                    <p className="text-[8px] text-slate-400 font-sans mt-0.5">
                      Adds <strong>{scannedPartner.name}</strong> to your emergency contacts only (their contact list is not modified).
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isClaimingLink}
                  onClick={handleConfirmLink}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[9.5px] font-black uppercase tracking-wider shadow"
                >
                  {isClaimingLink ? 'Linking & Syncing FCM...' : '✓ Confirm & Link Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => setScannedPartner(null)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* LINK COMPLETED + INSTANT FCM RING TEST */}
          {completedLink && (
            <div className="space-y-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-300 uppercase">
                  ✓ {completedLink.mode === 'TWO_WAY' ? 'Two-Way Mutual Link Active' : 'One-Way Contact Linked'}
                </span>
                <span className="text-[8px] text-emerald-400 font-bold">
                  {completedLink.synced ? 'SERVER SYNCED' : 'LOCAL SAVED'}
                </span>
              </div>
              <p className="text-[8.5px] text-slate-300 font-sans">
                <strong>{completedLink.name}</strong> ({completedLink.phone}) is now linked for SMS, Call, Rain Please Call Me, and FCM loud alarm alerts.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={isTestingRing}
                  onClick={handleTestRingLinkedContact}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[9px] font-bold uppercase tracking-wider"
                >
                  {isTestingRing ? 'Pushing FCM Ring...' : '📲 Send Real FCM Test Ring'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompletedLink(null);
                    setTestRingResult('');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold uppercase"
                >
                  Scan Another
                </button>
              </div>

              {testRingResult && (
                <p className="text-[8.5px] text-cyan-200 bg-slate-950/80 border border-slate-800 rounded-lg p-2">
                  {testRingResult}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
