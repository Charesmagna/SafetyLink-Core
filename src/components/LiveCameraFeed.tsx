import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Grid2X2,
  Maximize2,
  Mic,
  MicOff,
  MoveDown,
  MoveDownLeft,
  MoveDownRight,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveUpLeft,
  MoveUpRight,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Square,
  Trash2,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  Globe,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import { useAppStore } from '../utils/store';
import {
  CameraBrand,
  CameraDeployMode,
  CameraDevice,
  CameraPtzPreset,
  CameraSignalingMode,
  CameraStreamProfile,
} from '../types';
import { HikvisionCameraManager } from './HikvisionCameraManager';

type ConnectionPhase =
  | 'IDLE'
  | 'SIGNALING'
  | 'ICE_CHECKING'
  | 'LIVE'
  | 'RECONNECTING'
  | 'FALLBACK_SNAPSHOT'
  | 'P2P_READY'
  | 'FAILED';

type TalkbackState = 'OFF' | 'REQUESTING_MIC' | 'ACTIVE' | 'PERMISSION_DENIED' | 'UNSUPPORTED';

interface WebRtcStatsSummary {
  codec?: string;
  resolution?: string;
  fps?: number;
  bitrateKbps?: number;
  rttMs?: number;
  candidateType?: string;
  framesDecoded?: number;
}

interface LiveCameraFeedProps {
  scope?: 'ORG' | 'USER';
}

function getEffectiveSignalingMode(cam: CameraDevice): CameraSignalingMode {
  if (cam.signalingMode) return cam.signalingMode;
  if (cam.mode === 'WHEP_HLS_RELAY') return 'WHEP_DIRECT';
  if (cam.mode === 'LAN_ISAPI') return 'LAN_ISAPI_POLL';
  return 'HIK_CONNECT_P2P';
}

function sanitizeDisplayUrl(raw?: string): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    u.username = '';
    u.password = '';
    return u.toString();
  } catch {
    return raw;
  }
}

function phaseBadgeStyles(phase: ConnectionPhase, isLight: boolean) {
  switch (phase) {
    case 'LIVE':
      return isLight
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30';
    case 'SIGNALING':
    case 'ICE_CHECKING':
    case 'RECONNECTING':
    case 'FALLBACK_SNAPSHOT':
      return isLight
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-amber-950/70 text-amber-300 border-amber-500/30';
    case 'FAILED':
      return isLight
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-red-950/70 text-red-300 border-red-500/30';
    case 'P2P_READY':
      return isLight
        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
        : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30';
    default:
      return isLight
        ? 'bg-slate-100 text-slate-600 border-slate-200'
        : 'bg-slate-900 text-slate-400 border-slate-700';
  }
}

function phaseLabel(phase: ConnectionPhase): string {
  switch (phase) {
    case 'LIVE':
      return 'LIVE · WEBRTC';
    case 'SIGNALING':
      return 'SIGNALING';
    case 'ICE_CHECKING':
      return 'ICE CHECKING';
    case 'RECONNECTING':
      return 'RECONNECTING';
    case 'FALLBACK_SNAPSHOT':
      return 'LAN FRAMES';
    case 'P2P_READY':
      return 'HIK-CONNECT P2P';
    case 'FAILED':
      return 'DISCONNECTED';
    default:
      return 'STANDBY';
  }
}

interface TileRegistration {
  captureFrame: () => Promise<void>;
  reconnect: () => void;
  toggleTalkback: (desired?: boolean) => Promise<void>;
  talkbackState: TalkbackState;
  micLevel: number;
  phase: ConnectionPhase;
  statusMessage: string;
}

interface CameraStreamTileProps {
  camera: CameraDevice;
  isSpotlight: boolean;
  isSelected: boolean;
  globalMuted: boolean;
  isLight: boolean;
  reconnectEpoch: number;
  onSelectSpotlight: () => void;
  onOpenConfig: () => void;
  onRegisterActions?: (camId: string, reg: TileRegistration) => void;
}

const CameraStreamTile: React.FC<CameraStreamTileProps> = ({
  camera,
  isSpotlight,
  isSelected,
  globalMuted,
  isLight,
  reconnectEpoch,
  onSelectSpotlight,
  onOpenConfig,
  onRegisterActions,
}) => {
  const {
    getCameraLocalCredentials,
    fetchCameraSnapshot,
    addCameraEvidenceSnapshot,
    updateCamera,
    addToast,
  } = useAppStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionUrlRef = useRef<string | null>(null);
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const statsTimerRef = useRef<number | null>(null);
  const lastBytesRef = useRef<{ bytes: number; ts: number } | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);

  const [phase, setPhase] = useState<ConnectionPhase>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('Initializing player...');
  const [stats, setStats] = useState<WebRtcStatsSummary>({});
  const [localMuted, setLocalMuted] = useState<boolean>(true);
  const [talkbackState, setTalkbackState] = useState<TalkbackState>('OFF');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [fallbackImage, setFallbackImage] = useState<string | undefined>(camera.lastSnapshotBase64);
  const [manualEpoch, setManualEpoch] = useState<number>(0);

  const effectiveMode = getEffectiveSignalingMode(camera);
  const effectiveMuted = globalMuted || localMuted;
  const endpointUrl = sanitizeDisplayUrl(camera.whepUrl || camera.relayUrl);

  const stopTalkback = useCallback(async () => {
    if (analyserRafRef.current) {
      cancelAnimationFrame(analyserRafRef.current);
      analyserRafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioSenderRef.current) {
      await audioSenderRef.current.replaceTrack(null).catch(() => {});
    }
    setMicLevel(0);
    setTalkbackState((prev) => (prev === 'PERMISSION_DENIED' || prev === 'UNSUPPORTED' ? prev : 'OFF'));
  }, []);

  const teardownPeer = useCallback(async () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    lastBytesRef.current = null;
    await stopTalkback();

    const sessUrl = sessionUrlRef.current;
    sessionUrlRef.current = null;
    if (sessUrl) {
      const creds = getCameraLocalCredentials(camera.id);
      if (effectiveMode === 'SERVER_PROXY') {
        fetch('/api/hikvision/webrtc/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DELETE',
            targetUrl: sessUrl,
            bearerToken: creds.whepBearerToken,
            username: creds.username,
            password: creds.password,
          }),
        }).catch(() => {});
      } else {
        const headers: Record<string, string> = {};
        if (creds.whepBearerToken) headers.Authorization = `Bearer ${creds.whepBearerToken}`;
        fetch(sessUrl, { method: 'DELETE', headers }).catch(() => {});
      }
    }

    if (pcRef.current) {
      try {
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      } catch {
        // Ignore close errors
      }
      pcRef.current = null;
    }
    audioSenderRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [camera.id, effectiveMode, getCameraLocalCredentials, stopTalkback]);

  const startTalkback = useCallback(
    async (forceState?: boolean) => {
      const wantOn = forceState !== undefined ? forceState : talkbackState !== 'ACTIVE';
      if (!wantOn) {
        await stopTalkback();
        return;
      }
      if (camera.twoWayAudioEnabled === false) {
        addToast('Two-way audio is disabled in this camera configuration.', 'warn');
        return;
      }
      if (effectiveMode !== 'WHEP_DIRECT' && effectiveMode !== 'SERVER_PROXY') {
        setTalkbackState('UNSUPPORTED');
        addToast('Two-way WebRTC talkback requires WHEP Direct or Server Proxy streaming mode.', 'info');
        return;
      }
      if (!pcRef.current || pcRef.current.connectionState !== 'connected') {
        addToast('Wait until the WebRTC stream is LIVE before enabling microphone talkback.', 'warn');
        return;
      }
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setTalkbackState('UNSUPPORTED');
        addToast('Microphone talkback requires HTTPS or a secure Android WebView context.', 'warn');
        return;
      }

      setTalkbackState('REQUESTING_MIC');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        const micTrack = stream.getAudioTracks()[0];
        if (!micTrack) {
          throw new Error('No microphone track available.');
        }

        let sender = audioSenderRef.current;
        if (!sender && pcRef.current) {
          const transceivers = pcRef.current.getTransceivers();
          const audioTr = transceivers.find(
            (tr) => tr.receiver.track?.kind === 'audio' || tr.sender.track?.kind === 'audio'
          );
          if (audioTr) {
            if (audioTr.direction === 'recvonly') audioTr.direction = 'sendrecv';
            sender = audioTr.sender;
            audioSenderRef.current = sender;
          }
        }

        if (!sender) {
          stream.getTracks().forEach((t) => t.stop());
          setTalkbackState('UNSUPPORTED');
          addToast('Remote stream SDP has no audio backchannel transceiver. Ensure go2rtc includes isapi:// backchannel.', 'warn');
          return;
        }

        await sender.replaceTrack(micTrack);
        micStreamRef.current = stream;
        setTalkbackState('ACTIVE');

        // Start lightweight microphone level meter
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioCtxRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            const buf = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
              if (!micStreamRef.current) return;
              analyser.getByteTimeDomainData(buf);
              let sum = 0;
              for (let i = 0; i < buf.length; i++) {
                const v = (buf[i] - 128) / 128;
                sum += v * v;
              }
              const rms = Math.min(100, Math.round(Math.sqrt(sum / buf.length) * 260));
              setMicLevel(rms);
              analyserRafRef.current = requestAnimationFrame(tick);
            };
            analyserRafRef.current = requestAnimationFrame(tick);
          }
        } catch {
          // Optional VU meter failure does not stop talkback
        }
      } catch (err: any) {
        const name = err?.name || '';
        const denied = name === 'NotAllowedError' || name === 'PermissionDeniedError';
        setTalkbackState(denied ? 'PERMISSION_DENIED' : 'UNSUPPORTED');
        addToast(
          denied
            ? 'Microphone permission denied. Allow microphone access in browser/Android settings for Talkback.'
            : err?.message || 'Unable to access microphone.',
          'warn'
        );
      }
    },
    [addToast, camera.twoWayAudioEnabled, effectiveMode, stopTalkback, talkbackState]
  );

  const captureFrame = useCallback(async () => {
    const canvas = document.createElement('canvas');
    let sourceEl: HTMLVideoElement | HTMLImageElement | null = null;
    let srcW = 1280;
    let srcH = 720;

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      sourceEl = videoRef.current;
      srcW = videoRef.current.videoWidth;
      srcH = videoRef.current.videoHeight;
    } else if (imgRef.current && imgRef.current.naturalWidth > 0) {
      sourceEl = imgRef.current;
      srcW = imgRef.current.naturalWidth;
      srcH = imgRef.current.naturalHeight;
    }

    if (!sourceEl) {
      if (camera.host) {
        const res = await fetchCameraSnapshot(camera.id);
        if (res.ok && res.imageBase64) {
          addCameraEvidenceSnapshot({
            cameraId: camera.id,
            cameraName: camera.name,
            orgId: camera.orgId,
            dataUrl: res.imageBase64,
          });
          setFallbackImage(res.imageBase64);
          addToast(`Captured ISAPI snapshot for ${camera.name}.`, 'success');
          return;
        }
      }
      addToast('No active video frame available to capture yet.', 'warn');
      return;
    }

    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(sourceEl, 0, 0, srcW, srcH);
      const barH = Math.max(28, Math.round(srcH * 0.055));
      ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
      ctx.fillRect(0, srcH - barH, srcW, barH);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `600 ${Math.max(12, Math.round(barH * 0.45))}px ui-monospace, monospace`;
      const stamp = new Date().toISOString();
      ctx.fillText(`SAFETYLINK · ${camera.name} · ${camera.orgId} · ${stamp}`, 12, srcH - Math.round(barH * 0.32));

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      addCameraEvidenceSnapshot({
        cameraId: camera.id,
        cameraName: camera.name,
        orgId: camera.orgId,
        dataUrl,
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `safetylink-${camera.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}-${Date.now()}.jpg`;
      a.click();
      addToast(`Snapshot saved & downloaded (${srcW}x${srcH}).`, 'success');
    } catch {
      // Tainted cross-origin canvas fallback: try ISAPI server capture
      if (camera.host) {
        const res = await fetchCameraSnapshot(camera.id);
        if (res.ok && res.imageBase64) {
          addCameraEvidenceSnapshot({
            cameraId: camera.id,
            cameraName: camera.name,
            orgId: camera.orgId,
            dataUrl: res.imageBase64,
          });
          addToast(`Captured server ISAPI evidence snapshot for ${camera.name}.`, 'success');
          return;
        }
      }
      addToast('Cross-origin stream blocked canvas export; configure Server Proxy or LAN host for server snapshots.', 'warn');
    }
  }, [addCameraEvidenceSnapshot, addToast, camera.host, camera.id, camera.name, camera.orgId, fetchCameraSnapshot]);

  // Connect / lifecycle effect per camera
  useEffect(() => {
    let cancelled = false;
    retryCountRef.current = 0;

    const startWebRtc = async (attempt = 0) => {
      await teardownPeer();
      if (cancelled) return;

      if (!endpointUrl) {
        setPhase('FAILED');
        setStatusMessage('No WHEP / WebRTC relay URL configured. Open Connection Settings to set URL or switch to LAN ISAPI.');
        return;
      }

      setPhase(attempt > 0 ? 'RECONNECTING' : 'SIGNALING');
      setStatusMessage(
        attempt > 0
          ? `Reconnecting WebRTC peer (attempt ${attempt}/3)...`
          : effectiveMode === 'SERVER_PROXY'
          ? 'Negotiating via signed SafetyLink signaling proxy...'
          : 'Posting WHEP SDP offer...'
      );

      const creds = getCameraLocalCredentials(camera.id);
      const iceServers: RTCIceServer[] = [];
      const stuns = camera.stunServers && camera.stunServers.length > 0 ? camera.stunServers : ['stun:stun.l.google.com:19302'];
      stuns.forEach((url) => {
        if (url && url.trim()) iceServers.push({ urls: url.trim() });
      });
      if (camera.turnUrls && camera.turnUrls.length > 0) {
        camera.turnUrls.forEach((url) => {
          if (url && url.trim()) {
            iceServers.push({
              urls: url.trim(),
              ...(creds.turnUsername ? { username: creds.turnUsername } : {}),
              ...(creds.turnCredential ? { credential: creds.turnCredential } : {}),
            });
          }
        });
      }

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      const remoteStream = new MediaStream();
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }

      pc.ontrack = (ev) => {
        if (ev.streams && ev.streams[0]) {
          ev.streams[0].getTracks().forEach((t) => {
            if (!remoteStream.getTracks().some((rt) => rt.id === t.id)) {
              remoteStream.addTrack(t);
            }
          });
        } else if (ev.track) {
          remoteStream.addTrack(ev.track);
        }
        if (videoRef.current && videoRef.current.srcObject !== remoteStream) {
          videoRef.current.srcObject = remoteStream;
        }
        videoRef.current?.play().catch(() => {});
      };

      const scheduleRetryOrFail = (reason: string) => {
        if (cancelled) return;
        if (retryCountRef.current < 3) {
          const nextAttempt = retryCountRef.current + 1;
          retryCountRef.current = nextAttempt;
          const delayMs = nextAttempt * 2000;
          setPhase('RECONNECTING');
          setStatusMessage(`${reason} Retrying in ${nextAttempt * 2}s (${nextAttempt}/3)...`);
          retryTimerRef.current = window.setTimeout(() => {
            if (!cancelled) startWebRtc(nextAttempt);
          }, delayMs);
        } else {
          setPhase('FAILED');
          setStatusMessage(reason);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (cancelled) return;
        const iceState = pc.iceConnectionState;
        if (iceState === 'checking') {
          setPhase('ICE_CHECKING');
          setStatusMessage('Establishing ICE media path...');
        } else if (iceState === 'failed') {
          scheduleRetryOrFail('ICE connectivity failed (firewall/CG-NAT may require TURN relay).');
        }
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        const connState = pc.connectionState;
        if (connState === 'connected') {
          retryCountRef.current = 0;
          setPhase('LIVE');
          setStatusMessage('Connected · Low-latency WebRTC stream active');
          updateCamera(camera.id, { status: 'ONLINE', lastError: undefined, lastCheckedAt: Date.now() });
        } else if (connState === 'failed') {
          scheduleRetryOrFail('WebRTC peer connection failed.');
        } else if (connState === 'disconnected') {
          setPhase('RECONNECTING');
          setStatusMessage('Peer disconnected — monitoring ICE recovery...');
        }
      };

      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        const audioTransceiver = pc.addTransceiver('audio', {
          direction: camera.twoWayAudioEnabled === false ? 'recvonly' : 'sendrecv',
        });
        audioSenderRef.current = audioTransceiver.sender;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait briefly for initial ICE gathering so non-trickle WHEP servers receive host/srflx candidates
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
            return;
          }
          const t = window.setTimeout(() => resolve(), 1200);
          const onGather = () => {
            if (pc.iceGatheringState === 'complete') {
              window.clearTimeout(t);
              pc.removeEventListener('icegatheringstatechange', onGather);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', onGather);
        });

        if (cancelled || !pc.localDescription?.sdp) return;

        let sdpAnswer = '';
        if (effectiveMode === 'SERVER_PROXY') {
          const proxyRes = await fetch('/api/hikvision/webrtc/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'OFFER',
              targetUrl: endpointUrl,
              sdpOffer: pc.localDescription.sdp,
              bearerToken: creds.whepBearerToken,
              username: creds.username,
              password: creds.password,
            }),
          });
          const data = await proxyRes.json().catch(() => ({}));
          if (!proxyRes.ok || !data.ok || !data.sdpAnswer) {
            throw new Error(data.error || `Server proxy returned HTTP ${proxyRes.status}`);
          }
          sdpAnswer = data.sdpAnswer;
          if (data.locationHeader) {
            sessionUrlRef.current = data.locationHeader;
          }
        } else {
          const headers: Record<string, string> = {
            'Content-Type': 'application/sdp',
            Accept: 'application/sdp',
          };
          if (creds.whepBearerToken) {
            headers.Authorization = `Bearer ${creds.whepBearerToken}`;
          }
          const whepRes = await fetch(endpointUrl, {
            method: 'POST',
            headers,
            body: pc.localDescription.sdp,
          });
          const bodyText = await whepRes.text();
          if (!whepRes.ok) {
            throw new Error(
              whepRes.status === 401
                ? 'WHEP HTTP 401 Unauthorized — check Bearer token in Connection Settings.'
                : `WHEP gateway returned HTTP ${whepRes.status}`
            );
          }
          sdpAnswer = bodyText;
          const loc = whepRes.headers.get('location');
          if (loc) {
            try {
              sessionUrlRef.current = new URL(loc, endpointUrl).toString();
            } catch {
              sessionUrlRef.current = undefined as any;
            }
          }
        }

        if (cancelled) return;
        await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
        setPhase('ICE_CHECKING');
        setStatusMessage('SDP negotiated · Waiting for media packets...');

        // Poll real WebRTC inbound RTP stats every 1.5s
        statsTimerRef.current = window.setInterval(async () => {
          if (!pcRef.current || cancelled) return;
          try {
            const report = await pcRef.current.getStats();
            let codecName: string | undefined;
            let fps: number | undefined;
            let width: number | undefined;
            let height: number | undefined;
            let bytesReceived = 0;
            let framesDecoded = 0;
            let rttMs: number | undefined;
            let candidateType: string | undefined;
            let codecId: string | undefined;

            const codecs = new Map<string, string>();
            const candidates = new Map<string, string>();
            report.forEach((stat: any) => {
              if (stat.type === 'codec' && stat.mimeType) {
                codecs.set(stat.id, String(stat.mimeType).replace('video/', '').replace('audio/', '').toUpperCase());
              }
              if (stat.type === 'remote-candidate' || stat.type === 'local-candidate') {
                if (stat.candidateType) candidates.set(stat.id, String(stat.candidateType));
              }
              if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                bytesReceived = Number(stat.bytesReceived || 0);
                framesDecoded = Number(stat.framesDecoded || 0);
                fps = stat.framesPerSecond !== undefined ? Math.round(Number(stat.framesPerSecond)) : undefined;
                width = stat.frameWidth ? Number(stat.frameWidth) : undefined;
                height = stat.frameHeight ? Number(stat.frameHeight) : undefined;
                codecId = stat.codecId;
              }
              if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                if (stat.currentRoundTripTime !== undefined) {
                  rttMs = Math.round(Number(stat.currentRoundTripTime) * 1000);
                }
                if (stat.localCandidateId && candidates.has(stat.localCandidateId)) {
                  candidateType = candidates.get(stat.localCandidateId);
                }
              }
            });

            if (codecId && codecs.has(codecId)) {
              codecName = codecs.get(codecId);
            }

            const now = Date.now();
            let bitrateKbps: number | undefined;
            if (lastBytesRef.current && bytesReceived >= lastBytesRef.current.bytes) {
              const dt = (now - lastBytesRef.current.ts) / 1000;
              if (dt > 0.2) {
                bitrateKbps = Math.round(((bytesReceived - lastBytesRef.current.bytes) * 8) / (dt * 1000));
              }
            }
            lastBytesRef.current = { bytes: bytesReceived, ts: now };

            setStats({
              codec: codecName,
              resolution: width && height ? `${width}x${height}` : undefined,
              fps,
              bitrateKbps,
              rttMs,
              candidateType,
              framesDecoded,
            });
          } catch {
            // Ignore transient getStats error during close
          }
        }, 1500);
      } catch (err: any) {
        if (cancelled) return;
        const msg = err?.message || 'WebRTC signaling error.';
        const corsHint =
          effectiveMode === 'WHEP_DIRECT' && /failed to fetch|networkerror|cors/i.test(msg)
            ? ' (If blocked by CORS, switch signaling mode to Server Proxy in Settings.)'
            : '';
        setPhase('FAILED');
        setStatusMessage(`${msg}${corsHint}`);
      }
    };

    if (effectiveMode === 'WHEP_DIRECT' || effectiveMode === 'SERVER_PROXY') {
      startWebRtc(0);
      return () => {
        cancelled = true;
        teardownPeer();
      };
    }

    if (effectiveMode === 'LAN_ISAPI_POLL') {
      teardownPeer();
      if (!camera.host) {
        setPhase('FAILED');
        setStatusMessage('No camera IP/hostname configured for LAN ISAPI live frame polling.');
        return;
      }
      setPhase('FALLBACK_SNAPSHOT');
      setStatusMessage(`Polling ${camera.host}:${camera.httpPort || 80} ISAPI channel ${camera.channel || 102}...`);

      const pollOnce = async () => {
        if (cancelled || document.hidden) return;
        const t0 = Date.now();
        const res = await fetchCameraSnapshot(camera.id);
        if (cancelled) return;
        if (res.ok && res.imageBase64) {
          setFallbackImage(res.imageBase64);
          setPhase('FALLBACK_SNAPSHOT');
          setStatusMessage(`LAN ISAPI Live Frames (${Date.now() - t0}ms RTT)`);
        } else {
          setStatusMessage(res.diagnostics);
        }
      };

      pollOnce();
      const iv = window.setInterval(pollOnce, isSpotlight ? 1800 : 3200);
      return () => {
        cancelled = true;
        window.clearInterval(iv);
        teardownPeer();
      };
    }

    // HIK_CONNECT_P2P
    teardownPeer();
    setPhase('P2P_READY');
    setStatusMessage(
      camera.serialNumber
        ? `Hik-Connect P2P Serial ${camera.serialNumber} ready · Tap Open Hik-Connect or attach go2rtc WHEP URL for inline WebRTC.`
        : 'Configure serial number or WHEP relay URL.'
    );
    return () => {
      cancelled = true;
      teardownPeer();
    };
  }, [
    camera.channel,
    camera.host,
    camera.httpPort,
    camera.id,
    camera.serialNumber,
    camera.stunServers,
    camera.turnUrls,
    camera.twoWayAudioEnabled,
    effectiveMode,
    endpointUrl,
    fetchCameraSnapshot,
    getCameraLocalCredentials,
    isSpotlight,
    manualEpoch,
    reconnectEpoch,
    teardownPeer,
    updateCamera,
  ]);

  // Keep muted property synchronized
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = effectiveMuted;
    }
  }, [effectiveMuted]);

  // Register controls for Spotlight Operator Rail
  useEffect(() => {
    if (onRegisterActions && isSelected) {
      onRegisterActions(camera.id, {
        captureFrame,
        reconnect: () => setManualEpoch((e) => e + 1),
        toggleTalkback: startTalkback,
        talkbackState,
        micLevel,
        phase,
        statusMessage,
      });
    }
  }, [camera.id, captureFrame, isSelected, micLevel, onRegisterActions, phase, startTalkback, statusMessage, talkbackState]);

  const cardSurface = isLight
    ? `bg-white border ${isSelected ? 'border-emerald-500' : 'border-slate-200'}`
    : `bg-slate-900/90 border ${isSelected ? 'border-emerald-500/70' : 'border-slate-800'}`;

  return (
    <div className={`rounded-xl overflow-hidden flex flex-col ${cardSurface} transition-colors`}>
      {/* Tile Top Bar */}
      <div
        className={`px-3 py-2 flex items-center justify-between gap-2 border-b ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/60'
        }`}
      >
        <button
          type="button"
          onClick={onSelectSpotlight}
          className="text-left min-w-0 flex-1 group"
          title="Focus this camera in Spotlight control deck"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {camera.name}
            </span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold border rounded shrink-0 ${phaseBadgeStyles(
                phase,
                isLight
              )}`}
            >
              {phaseLabel(phase)}
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 truncate tabular-nums mt-0.5">
            {camera.brand} · Ch {camera.channel} · {effectiveMode}
          </p>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {(effectiveMode === 'WHEP_DIRECT' || effectiveMode === 'SERVER_PROXY') && (
            <button
              type="button"
              onClick={() => setLocalMuted((m) => !m)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
              title={effectiveMuted ? 'Unmute camera audio' : 'Mute camera audio'}
            >
              {effectiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setManualEpoch((e) => e + 1)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                : 'border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title="Reconnect stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${phase === 'SIGNALING' || phase === 'RECONNECTING' ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onOpenConfig}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                : 'border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title="Camera connection, ICE & stream settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          {!isSpotlight && (
            <button
              type="button"
              onClick={onSelectSpotlight}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
              title="Open 1x1 Spotlight & PTZ Controls"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 16:9 Video / Fallback Bay */}
      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {(effectiveMode === 'WHEP_DIRECT' || effectiveMode === 'SERVER_PROXY') && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={effectiveMuted}
            className={`w-full h-full object-contain bg-black ${phase === 'LIVE' || phase === 'ICE_CHECKING' ? 'block' : 'hidden'}`}
          />
        )}

        {effectiveMode === 'LAN_ISAPI_POLL' && fallbackImage && (
          <img
            ref={imgRef}
            src={fallbackImage}
            alt={`${camera.name} LAN ISAPI live frame`}
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Non-live / Signaling / P2P / Failed Overlay */}
        {((effectiveMode === 'WHEP_DIRECT' || effectiveMode === 'SERVER_PROXY') && phase !== 'LIVE') ||
        (effectiveMode === 'LAN_ISAPI_POLL' && !fallbackImage) ||
        effectiveMode === 'HIK_CONNECT_P2P' ? (
          <div className="p-4 text-center max-w-sm space-y-2.5">
            <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
              {effectiveMode === 'HIK_CONNECT_P2P' ? (
                <Globe className="w-5 h-5 text-cyan-400" />
              ) : phase === 'FAILED' ? (
                <ShieldAlert className="w-5 h-5 text-red-400" />
              ) : (
                <Radio className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <p className="text-xs font-semibold text-slate-200">{camera.name}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{statusMessage}</p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {effectiveMode === 'HIK_CONNECT_P2P' && (
                <a
                  href="hikconnect://"
                  onClick={() => addToast('Launching Hik-Connect app for P2P cellular stream.', 'info')}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Hik-Connect</span>
                </a>
              )}

              {phase === 'FAILED' && effectiveMode === 'WHEP_DIRECT' && (
                <button
                  type="button"
                  onClick={() => {
                    updateCamera(camera.id, { signalingMode: 'SERVER_PROXY' });
                    addToast('Switched signaling path to SafetyLink Server Proxy.', 'info');
                  }}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700"
                >
                  Try Server Proxy
                </button>
              )}

              {phase === 'FAILED' && camera.host && (
                <button
                  type="button"
                  onClick={() => {
                    updateCamera(camera.id, { signalingMode: 'LAN_ISAPI_POLL' });
                    addToast('Switched to LAN ISAPI live frame polling.', 'info');
                  }}
                  className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Fallback to LAN Frames
                </button>
              )}

              <button
                type="button"
                onClick={onOpenConfig}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Configure Stream
              </button>
            </div>
          </div>
        ) : null}

        {/* Talkback Active Pill inside video corner */}
        {talkbackState === 'ACTIVE' && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-red-600/95 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 border border-red-400">
            <Mic className="w-3 h-3" />
            <span>TALKBACK LIVE</span>
          </div>
        )}
      </div>

      {/* Bottom Real-Time Telemetry Strip */}
      <div
        className={`px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono tabular-nums border-t ${
          isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-800 bg-slate-950/80 text-slate-400'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span>{stats.codec || (effectiveMode === 'LAN_ISAPI_POLL' ? 'MJPEG/JPEG' : 'WEBRTC')}</span>
          {stats.resolution && <span>{stats.resolution}</span>}
          {stats.fps !== undefined && <span>{stats.fps} fps</span>}
          {stats.bitrateKbps !== undefined && <span>{stats.bitrateKbps} kbps</span>}
          {stats.rttMs !== undefined && <span>RTT {stats.rttMs}ms</span>}
          {stats.candidateType && <span>ICE:{stats.candidateType}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={captureFrame}
            className={`px-2 py-0.5 rounded border text-[10px] font-medium transition-colors inline-flex items-center gap-1 ${
              isLight
                ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                : 'border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Download className="w-3 h-3" />
            <span>Snap</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({ scope = 'USER' }) => {
  const {
    cameras,
    cameraEvidenceSnapshots,
    currentOrg,
    currentUser,
    globalTheme,
    addCamera,
    updateCamera,
    removeCamera,
    getCameraLocalCredentials,
    setCameraLocalCredentials,
    removeCameraEvidenceSnapshot,
    sendCameraPtz,
    triggerSingleCameraSoftIo,
    addToast,
  } = useAppStore();

  const isLight = globalTheme === 'light';

  const activeOrgId =
    scope === 'ORG'
      ? currentOrg?.id || currentUser?.orgCode || 'ORG'
      : currentUser?.orgCode || currentOrg?.id || 'INDIVIDUAL';

  const scopedCameras = useMemo(() => {
    if (scope === 'ORG' && currentOrg?.id) {
      return cameras.filter((c) => c.orgId === currentOrg.id);
    }
    return cameras;
  }, [cameras, scope, currentOrg?.id]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | CameraSignalingMode | 'ONLINE'>('ALL');
  const [layoutMode, setLayoutMode] = useState<'1x1' | '2x2'>('1x1');
  const [quadPage, setQuadPage] = useState(0);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState(true);
  const [reconnectEpoch, setReconnectEpoch] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);

  // Operator Rail States
  const [ptzSpeed, setPtzSpeed] = useState(55);
  const [ptzFeedback, setPtzFeedback] = useState<string>('');
  const [softIoResult, setSoftIoResult] = useState<string>('');
  const [softIoBusy, setSoftIoBusy] = useState(false);
  const [editingPresets, setEditingPresets] = useState(false);
  const [spotlightReg, setSpotlightReg] = useState<TileRegistration | null>(null);

  // Quick-Deploy Form States inside Live Cameras
  const [qName, setQName] = useState('');
  const [qBrand, setQBrand] = useState<CameraBrand>('HIKVISION');
  const [qSignaling, setQSignaling] = useState<CameraSignalingMode>('WHEP_DIRECT');
  const [qWhepUrl, setQWhepUrl] = useState('');
  const [qHost, setQHost] = useState('192.168.1.64');
  const [qHttpPort, setQHttpPort] = useState(80);
  const [qChannel, setQChannel] = useState(102);
  const [qSerial, setQSerial] = useState('');
  const [qUsername, setQUsername] = useState('admin');
  const [qPassword, setQPassword] = useState('');
  const [qBearer, setQBearer] = useState('');
  const [qStun, setQStun] = useState('stun:stun.l.google.com:19302');
  const [qTurnUrl, setQTurnUrl] = useState('');
  const [qTurnUser, setQTurnUser] = useState('');
  const [qTurnCred, setQTurnCred] = useState('');
  const [qPtzEnabled, setQPtzEnabled] = useState(true);
  const [qTwoWayAudio, setQTwoWayAudio] = useState(true);
  const [qSoftIoId, setQSoftIoId] = useState(1);

  const filteredCameras = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedCameras.filter((cam) => {
      const mode = getEffectiveSignalingMode(cam);
      const matchesFilter =
        filterMode === 'ALL'
          ? true
          : filterMode === 'ONLINE'
          ? cam.status === 'ONLINE'
          : mode === filterMode;
      const matchesQuery =
        !q ||
        cam.name.toLowerCase().includes(q) ||
        (cam.serialNumber || '').toLowerCase().includes(q) ||
        (cam.host || '').toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [scopedCameras, filterMode, searchQuery]);

  // Keep selected camera valid
  const activeSpotlightCamera = useMemo(() => {
    const found = filteredCameras.find((c) => c.id === selectedCameraId);
    return found || filteredCameras[0] || null;
  }, [filteredCameras, selectedCameraId]);

  const totalQuadPages = Math.max(1, Math.ceil(filteredCameras.length / 4));
  const safeQuadPage = Math.min(quadPage, totalQuadPages - 1);
  const visibleQuadCameras = useMemo(() => {
    const start = safeQuadPage * 4;
    return filteredCameras.slice(start, start + 4);
  }, [filteredCameras, safeQuadPage]);

  const handleRegisterActions = useCallback((camId: string, reg: TileRegistration) => {
    if (!activeSpotlightCamera || activeSpotlightCamera.id === camId) {
      setSpotlightReg(reg);
    }
  }, [activeSpotlightCamera]);

  const activePtzInFlightRef = useRef<string | null>(null);

  const handlePtzStart = async (cam: CameraDevice, pan: number, tilt: number, zoom: number, label: string) => {
    activePtzInFlightRef.current = cam.id;
    setPtzFeedback(`Sending ${label}...`);
    const scale = ptzSpeed / 100;
    const res = await sendCameraPtz(cam.id, {
      action: 'CONTINUOUS',
      pan: Math.round(pan * scale),
      tilt: Math.round(tilt * scale),
      zoom: Math.round(zoom * scale),
    });
    setPtzFeedback(res.diagnostics);
  };

  const handlePtzStop = async (camId: string) => {
    if (activePtzInFlightRef.current !== camId) return;
    activePtzInFlightRef.current = null;
    const res = await sendCameraPtz(camId, { action: 'STOP' });
    setPtzFeedback(res.diagnostics);
  };

  const handlePresetRecall = async (cam: CameraDevice, preset: CameraPtzPreset) => {
    setPtzFeedback(`Moving to Preset #${preset.presetId} (${preset.label})...`);
    const res = await sendCameraPtz(cam.id, { action: 'PRESET', presetId: preset.presetId });
    setPtzFeedback(res.diagnostics);
    addToast(res.diagnostics, res.ok ? 'success' : 'warn');
  };

  const handleManualSoftIo = async (cam: CameraDevice) => {
    setSoftIoBusy(true);
    const res = await triggerSingleCameraSoftIo(cam.id);
    setSoftIoBusy(false);
    setSoftIoResult(res.diagnostics);
    addToast(res.diagnostics, res.triggered ? 'success' : 'warn');
  };

  const editingCamera = useMemo(
    () => scopedCameras.find((c) => c.id === editingCameraId) || null,
    [scopedCameras, editingCameraId]
  );

  // Populate config drawer when editing an existing camera
  useEffect(() => {
    if (!editingCamera) return;
    const creds = getCameraLocalCredentials(editingCamera.id);
    setQName(editingCamera.name);
    setQBrand(editingCamera.brand);
    setQSignaling(getEffectiveSignalingMode(editingCamera));
    setQWhepUrl(editingCamera.whepUrl || editingCamera.relayUrl || '');
    setQHost(editingCamera.host || '');
    setQHttpPort(editingCamera.httpPort || 80);
    setQChannel(editingCamera.channel || 102);
    setQSerial(editingCamera.serialNumber || '');
    setQUsername(creds.username || 'admin');
    setQPassword(creds.password || '');
    setQBearer(creds.whepBearerToken || '');
    setQStun((editingCamera.stunServers || ['stun:stun.l.google.com:19302']).join(', '));
    setQTurnUrl((editingCamera.turnUrls || []).join(', '));
    setQTurnUser(creds.turnUsername || '');
    setQTurnCred(creds.turnCredential || '');
    setQPtzEnabled(editingCamera.ptzEnabled ?? true);
    setQTwoWayAudio(editingCamera.twoWayAudioEnabled ?? true);
    setQSoftIoId(editingCamera.softIoTriggerId || 1);
  }, [editingCamera, getCameraLocalCredentials]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const stunServers = qStun
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    const turnUrls = qTurnUrl
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);

    const mappedDeployMode: CameraDeployMode =
      qSignaling === 'WHEP_DIRECT' || qSignaling === 'SERVER_PROXY'
        ? 'WHEP_HLS_RELAY'
        : qSignaling === 'LAN_ISAPI_POLL'
        ? 'LAN_ISAPI'
        : 'HIK_CONNECT_P2P';

    const streamProfile: CameraStreamProfile = Number(qChannel) === 101 ? 'MAIN_HD' : 'SUB_MOBILE';

    if (editingCamera) {
      updateCamera(editingCamera.id, {
        name: qName.trim() || editingCamera.name,
        brand: qBrand,
        mode: mappedDeployMode,
        signalingMode: qSignaling,
        streamProfile,
        whepUrl: qWhepUrl.trim() || undefined,
        relayUrl: qWhepUrl.trim() || undefined,
        host: qHost.trim() || undefined,
        httpPort: Number(qHttpPort) || 80,
        channel: Number(qChannel) || 102,
        serialNumber: qSerial.trim().toUpperCase() || undefined,
        stunServers,
        turnUrls,
        ptzEnabled: qPtzEnabled,
        twoWayAudioEnabled: qTwoWayAudio,
        softIoTriggerId: Number(qSoftIoId) || 1,
      });
      setCameraLocalCredentials(editingCamera.id, {
        username: qUsername.trim() || 'admin',
        password: qPassword,
        whepBearerToken: qBearer.trim() || undefined,
        turnUsername: qTurnUser.trim() || undefined,
        turnCredential: qTurnCred || undefined,
      });
      setEditingCameraId(null);
      setReconnectEpoch((v) => v + 1);
      addToast(`Updated WebRTC & hardware config for ${qName || editingCamera.name}.`, 'success');
      return;
    }

    const created = addCamera({
      name: qName.trim() || `${qBrand} Cam ${scopedCameras.length + 1}`,
      brand: qBrand,
      mode: mappedDeployMode,
      signalingMode: qSignaling,
      streamProfile,
      orgId: activeOrgId,
      whepUrl: qWhepUrl.trim() || undefined,
      relayUrl: qWhepUrl.trim() || undefined,
      host: qHost.trim() || undefined,
      httpPort: Number(qHttpPort) || 80,
      rtspPort: 554,
      channel: Number(qChannel) || 102,
      serialNumber: qSerial.trim().toUpperCase() || undefined,
      stunServers,
      turnUrls,
      ptzEnabled: qPtzEnabled,
      twoWayAudioEnabled: qTwoWayAudio,
      softIoTriggerId: Number(qSoftIoId) || 1,
      triggerOnPanic: true,
      username: qUsername.trim() || 'admin',
      password: qPassword,
      whepBearerToken: qBearer.trim() || undefined,
      turnUsername: qTurnUser.trim() || undefined,
      turnCredential: qTurnCred || undefined,
    });
    setSelectedCameraId(created.id);
    setShowOnboarding(false);
    addToast(`Deployed "${created.name}" (${qSignaling}) to Live Cameras.`, 'success');
  };

  const buildTwoWayGo2RtcYaml = (cam?: CameraDevice | null) => {
    const label = (cam?.name || qName || 'hik_gate').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const ip = cam?.host || qHost || '192.168.1.64';
    const ch = cam?.channel || qChannel || 102;
    return [
      'streams:',
      `  ${label}:`,
      `    - rtsp://admin:<PASSWORD>@${ip}:554/Streaming/Channels/${ch}`,
      `    - isapi://admin:<PASSWORD>@${ip}:${cam?.httpPort || qHttpPort || 80}/`,
      '# Point SafetyLink WHEP URL to: https://<YOUR_TUNNEL_HOST>/api/webrtc?src=' + label,
    ].join('\n');
  };

  const panelClass = isLight
    ? 'bg-white border border-slate-200 text-slate-900'
    : 'bg-slate-900/90 border border-slate-800 text-slate-100';

  const inputClass = isLight
    ? 'w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-emerald-500'
    : 'w-full px-3 py-2 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:border-emerald-500';

  return (
    <div className="space-y-4 text-left pb-8">
      {/* Control Deck Header */}
      <div className={`p-4 rounded-xl ${panelClass} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Live Hikvision Camera Feed · WebRTC Control Deck</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
              Scope: {activeOrgId} · {scopedCameras.length} {scopedCameras.length === 1 ? 'camera' : 'cameras'} ·{' '}
              {scopedCameras.filter((c) => c.status === 'ONLINE').length} verified online
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Layout Switcher */}
            <div
              className={`inline-flex items-center p-0.5 rounded-lg border ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setLayoutMode('1x1')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1 transition-colors ${
                  layoutMode === '1x1'
                    ? isLight
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>1x1 Spotlight</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('2x2')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md flex items-center gap-1 transition-colors ${
                  layoutMode === '2x2'
                    ? isLight
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Grid2X2 className="w-3 h-3" />
                <span>2x2 Quad</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setGlobalMuted((m) => !m)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border flex items-center gap-1.5 ${
                isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
              }`}
            >
              {globalMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{globalMuted ? 'Audio Muted' : 'Audio Enabled'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReconnectEpoch((e) => e + 1)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border flex items-center gap-1.5 ${
                isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconnect All</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingCameraId(null);
                setShowOnboarding((v) => !v);
              }}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showOnboarding ? 'Close Setup' : 'Add / Onboard Camera'}</span>
            </button>
          </div>
        </div>

        {/* Search & Signaling Filter Toolbar */}
        {scopedCameras.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setQuadPage(0);
              }}
              placeholder="Search cameras by label, serial, or IP..."
              className={`flex-1 min-w-[200px] ${inputClass}`}
            />
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'ALL' as const, label: 'All' },
                { id: 'WHEP_DIRECT' as const, label: 'WHEP Direct' },
                { id: 'SERVER_PROXY' as const, label: 'Server Proxy' },
                { id: 'LAN_ISAPI_POLL' as const, label: 'LAN ISAPI' },
                { id: 'HIK_CONNECT_P2P' as const, label: 'Hik-Connect' },
                { id: 'ONLINE' as const, label: 'Online Only' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFilterMode(f.id);
                    setQuadPage(0);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                    filterMode === f.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                      : isLight
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Universal WebRTC / Camera Configuration & Onboarding Drawer */}
      {(showOnboarding || editingCamera) && (
        <div className={`p-4 rounded-xl ${panelClass} space-y-4`}>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                {editingCamera ? `Configure Stream & Credentials · ${editingCamera.name}` : 'All-Method Camera & WebRTC Deployment'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch seamlessly between WHEP Direct, Signed Server Proxy, LAN ISAPI Polling, or Hik-Connect P2P. Secrets stay local on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOnboarding(false);
                setEditingCameraId(null);
              }}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* Signaling Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'WHEP_DIRECT' as const, label: 'Direct WHEP (WebRTC)', sub: 'go2rtc / MediaMTX HTTPS' },
                { id: 'SERVER_PROXY' as const, label: 'Server Signaling Proxy', sub: 'CORS-safe + Auth header injection' },
                { id: 'LAN_ISAPI_POLL' as const, label: 'LAN ISAPI Live Frames', sub: 'HTTP Digest/Basic + PTZ/Soft-IO' },
                { id: 'HIK_CONNECT_P2P' as const, label: 'Hik-Connect P2P', sub: 'QR / Serial mobile handoff' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQSignaling(opt.id)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    qSignaling === opt.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isLight
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Camera Label</label>
                <input
                  type="text"
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  placeholder="Main Gate PTZ"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Hardware Brand</label>
                <select value={qBrand} onChange={(e) => setQBrand(e.target.value as CameraBrand)} className={inputClass}>
                  <option value="HIKVISION">Hikvision (DS-Series / NVR)</option>
                  <option value="HILOOK">HiLook by Hikvision</option>
                  <option value="ONVIF_GENERIC">ONVIF Profile S/G</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">ISAPI Channel (101=HD, 102=Sub)</label>
                <input
                  type="number"
                  min={1}
                  max={1024}
                  value={qChannel}
                  onChange={(e) => setQChannel(Number(e.target.value))}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  WebRTC WHEP / go2rtc Signaling URL (HTTPS)
                </label>
                <input
                  type="url"
                  value={qWhepUrl}
                  onChange={(e) => setQWhepUrl(e.target.value)}
                  placeholder="https://cctv.yourdomain.online/api/webrtc?src=gate"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  WHEP Bearer Token (Optional · Local Only)
                </label>
                <input
                  type="password"
                  value={qBearer}
                  onChange={(e) => setQBearer(e.target.value)}
                  placeholder="Optional gateway token"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Camera IP / Host (PTZ & ISAPI)</label>
                <input
                  type="text"
                  value={qHost}
                  onChange={(e) => setQHost(e.target.value)}
                  placeholder="192.168.1.64"
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">HTTP ISAPI Port</label>
                <input
                  type="number"
                  value={qHttpPort}
                  onChange={(e) => setQHttpPort(Number(e.target.value))}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Device Username (Local)</label>
                <input
                  type="text"
                  value={qUsername}
                  onChange={(e) => setQUsername(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Device Password / Verify Code</label>
                <input
                  type="password"
                  value={qPassword}
                  onChange={(e) => setQPassword(e.target.value)}
                  placeholder="Camera password (local only)"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">STUN Servers (comma-separated)</label>
                <input
                  type="text"
                  value={qStun}
                  onChange={(e) => setQStun(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">TURN Relay URL (Optional)</label>
                <input
                  type="text"
                  value={qTurnUrl}
                  onChange={(e) => setQTurnUrl(e.target.value)}
                  placeholder="turns:turn.yourdomain.com:5349"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Hik-Connect Serial (Optional)</label>
                <input
                  type="text"
                  value={qSerial}
                  onChange={(e) => setQSerial(e.target.value.toUpperCase())}
                  placeholder="K12345678"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
            </div>

            {qTurnUrl.trim() && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">TURN Username (Local Only)</label>
                  <input type="text" value={qTurnUser} onChange={(e) => setQTurnUser(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">TURN Credential (Local Only)</label>
                  <input type="password" value={qTurnCred} onChange={(e) => setQTurnCred(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={qPtzEnabled} onChange={(e) => setQPtzEnabled(e.target.checked)} />
                  <span>Enable PTZ & Presets</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={qTwoWayAudio} onChange={(e) => setQTwoWayAudio(e.target.checked)} />
                  <span>Enable Two-Way WebRTC Talkback</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Soft-IO ID:</span>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={qSoftIoId}
                    onChange={(e) => setQSoftIoId(Number(e.target.value))}
                    className={`w-16 px-2 py-1 text-xs font-mono tabular-nums rounded border ${
                      isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-950'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(buildTwoWayGo2RtcYaml(editingCamera)).catch(() => {});
                    addToast('Copied two-way-audio go2rtc.yaml template.', 'success');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 ${
                    isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy go2rtc Two-Way Config</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {editingCamera ? 'Save & Reconnect' : 'Save & Launch Feed'}
                </button>
              </div>
            </div>
          </form>

          {!editingCamera && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Or use Native QR Sticker Scanner &amp; Field Playbook
              </p>
              <HikvisionCameraManager scope={scope} compact />
            </div>
          )}
        </div>
      )}

      {/* Main Content Area: Empty State vs 1x1 Spotlight vs 2x2 Quad Grid */}
      {filteredCameras.length === 0 ? (
        <div className={`p-8 rounded-xl text-center space-y-3 ${panelClass}`}>
          <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold">
            {scopedCameras.length === 0 ? 'No Hikvision Cameras Connected Yet' : 'No Cameras Match Current Filter'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Connect any Hikvision, HiLook, or ONVIF camera using a WebRTC WHEP gateway (go2rtc / MediaMTX), SafetyLink Server Proxy, Direct Site Wi-Fi ISAPI, or Hik-Connect QR Serial.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Deploy &amp; Stream First Camera
            </button>
          </div>
        </div>
      ) : layoutMode === '2x2' ? (
        /* 2x2 QUAD GRID VIEW */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleQuadCameras.map((cam) => (
              <CameraStreamTile
                key={cam.id}
                camera={cam}
                isSpotlight={false}
                isSelected={activeSpotlightCamera?.id === cam.id}
                globalMuted={globalMuted}
                isLight={isLight}
                reconnectEpoch={reconnectEpoch}
                onSelectSpotlight={() => {
                  setSelectedCameraId(cam.id);
                  setLayoutMode('1x1');
                }}
                onOpenConfig={() => setEditingCameraId(cam.id)}
              />
            ))}
          </div>

          {totalQuadPages > 1 && (
            <div className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs ${panelClass}`}>
              <span className="font-mono tabular-nums text-slate-500">
                Quad Page {safeQuadPage + 1} / {totalQuadPages} ({filteredCameras.length} cameras)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeQuadPage === 0}
                  onClick={() => setQuadPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={safeQuadPage >= totalQuadPages - 1}
                  onClick={() => setQuadPage((p) => Math.min(totalQuadPages - 1, p + 1))}
                  className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 1x1 SPOTLIGHT + DOCKED OPERATOR CONTROL DECK */
        activeSpotlightCamera && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 Cols: Active Video Player + Camera Switcher Strip */}
            <div className="lg:col-span-8 space-y-3">
              <CameraStreamTile
                key={activeSpotlightCamera.id}
                camera={activeSpotlightCamera}
                isSpotlight={true}
                isSelected={true}
                globalMuted={globalMuted}
                isLight={isLight}
                reconnectEpoch={reconnectEpoch}
                onSelectSpotlight={() => {}}
                onOpenConfig={() => setEditingCameraId(activeSpotlightCamera.id)}
                onRegisterActions={handleRegisterActions}
              />

              {/* Quick Camera Strip Switcher */}
              {filteredCameras.length > 1 && (
                <div className={`p-2.5 rounded-xl ${panelClass} flex items-center gap-2 overflow-x-auto`}>
                  {filteredCameras.map((c) => {
                    const active = c.id === activeSpotlightCamera.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCameraId(c.id)}
                        className={`px-3 py-1.5 rounded-lg border text-left shrink-0 transition-colors ${
                          active
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500'
                            : isLight
                            ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <p className="text-[11px] font-semibold">{c.name}</p>
                        <p className="text-[9px] font-mono text-slate-500 tabular-nums">
                          Ch {c.channel} · {getEffectiveSignalingMode(c)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Evidence Snapshots Strip */}
              {cameraEvidenceSnapshots.length > 0 && (
                <div className={`p-3.5 rounded-xl ${panelClass} space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                      Captured Evidence Snapshots ({cameraEvidenceSnapshots.length})
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Stored locally on device</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {cameraEvidenceSnapshots.slice(0, 8).map((snap) => (
                      <div
                        key={snap.id}
                        className={`rounded-lg border overflow-hidden ${
                          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <img src={snap.dataUrl} alt={snap.cameraName} className="w-full aspect-video object-cover" />
                        <div className="p-1.5 flex items-center justify-between gap-1 text-[10px]">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{snap.cameraName}</p>
                            <p className="font-mono text-slate-500 tabular-nums">
                              {new Date(snap.capturedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={snap.dataUrl}
                              download={`evidence-${snap.id}.jpg`}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                              title="Download JPEG"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={() => removeCameraEvidenceSnapshot(snap.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10"
                              title="Delete snapshot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Docked Operator Controls (PTZ, Presets, Two-Way Talkback, Snapshot & SOS Soft-IO) */}
            <div className="lg:col-span-4 space-y-3">
              {/* 1. Two-Way WebRTC Audio Talkback + Evidence & SOS Soft-IO */}
              <div className={`p-3.5 rounded-xl ${panelClass} space-y-3`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Operator Response</span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    Soft-IO #{activeSpotlightCamera.softIoTriggerId}
                  </span>
                </div>

                {/* Two-Way Talkback */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={activeSpotlightCamera.twoWayAudioEnabled === false}
                      onPointerDown={() => spotlightReg?.toggleTalkback(true)}
                      onPointerUp={() => spotlightReg?.toggleTalkback(false)}
                      onPointerCancel={() => spotlightReg?.toggleTalkback(false)}
                      onPointerLeave={() => {
                        if (spotlightReg?.talkbackState === 'ACTIVE') spotlightReg.toggleTalkback(false);
                      }}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors select-none disabled:opacity-40 ${
                        spotlightReg?.talkbackState === 'ACTIVE'
                          ? 'bg-red-600 text-white border-red-500'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-100'
                      }`}
                    >
                      {spotlightReg?.talkbackState === 'ACTIVE' ? (
                        <Mic className="w-3.5 h-3.5" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5" />
                      )}
                      <span>Hold to Talk</span>
                    </button>

                    <button
                      type="button"
                      disabled={activeSpotlightCamera.twoWayAudioEnabled === false}
                      onClick={() => spotlightReg?.toggleTalkback()}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors disabled:opacity-40 ${
                        spotlightReg?.talkbackState === 'ACTIVE'
                          ? 'bg-red-500/15 text-red-500 border-red-500/40'
                          : isLight
                          ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{spotlightReg?.talkbackState === 'ACTIVE' ? 'Mute Mic' : 'Mic Lock'}</span>
                    </button>
                  </div>

                  {/* Live Mic Level Bar */}
                  {spotlightReg?.talkbackState === 'ACTIVE' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-red-400 tabular-nums">
                        <span>MICROPHONE TRANSMITTING</span>
                        <span>{spotlightReg.micLevel}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-75"
                          style={{ width: `${spotlightReg.micLevel}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Snapshot & Manual SOS Soft-IO */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => spotlightReg?.captureFrame()}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                      isLight
                        ? 'border-slate-300 hover:bg-slate-100 text-slate-800'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Capture Frame</span>
                  </button>

                  <button
                    type="button"
                    disabled={softIoBusy}
                    onClick={() => handleManualSoftIo(activeSpotlightCamera)}
                    className="py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{softIoBusy ? 'Firing...' : `SOS Soft-IO #${activeSpotlightCamera.softIoTriggerId}`}</span>
                  </button>
                </div>

                {softIoResult && (
                  <p className="text-[11px] font-mono text-amber-500 leading-snug">{softIoResult}</p>
                )}
              </div>

              {/* 2. PTZ Directional Pad, Zoom & Preset Recall */}
              <div className={`p-3.5 rounded-xl ${panelClass} space-y-3`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">PTZ &amp; Presets</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums">
                    <span className="text-slate-500">Speed {ptzSpeed}%</span>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={ptzSpeed}
                      onChange={(e) => setPtzSpeed(Number(e.target.value))}
                      className="w-16 accent-emerald-500"
                    />
                  </div>
                </div>

                {activeSpotlightCamera.ptzEnabled === false ? (
                  <p className="text-[11px] text-slate-500">
                    PTZ is disabled on this camera profile. Enable it in Connection Settings if supported.
                  </p>
                ) : (
                  <>
                    {/* 3x3 PTZ Directional Pad + Zoom */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-3 gap-1.5 flex-1 max-w-[180px] mx-auto">
                        {[
                          { icon: MoveUpLeft, pan: -80, tilt: 80, label: 'Up-Left' },
                          { icon: MoveUp, pan: 0, tilt: 80, label: 'Tilt Up' },
                          { icon: MoveUpRight, pan: 80, tilt: 80, label: 'Up-Right' },
                          { icon: MoveLeft, pan: -80, tilt: 0, label: 'Pan Left' },
                          { icon: Square, pan: 0, tilt: 0, label: 'STOP', isStop: true },
                          { icon: MoveRight, pan: 80, tilt: 0, label: 'Pan Right' },
                          { icon: MoveDownLeft, pan: -80, tilt: -80, label: 'Down-Left' },
                          { icon: MoveDown, pan: 0, tilt: -80, label: 'Tilt Down' },
                          { icon: MoveDownRight, pan: 80, tilt: -80, label: 'Down-Right' },
                        ].map((btn) => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={btn.label}
                              type="button"
                              title={btn.label}
                              onPointerDown={() => {
                                if (btn.isStop) {
                                  sendCameraPtz(activeSpotlightCamera.id, { action: 'STOP' });
                                } else {
                                  handlePtzStart(activeSpotlightCamera, btn.pan, btn.tilt, 0, btn.label);
                                }
                              }}
                              onPointerUp={() => !btn.isStop && handlePtzStop(activeSpotlightCamera.id)}
                              onPointerCancel={() => !btn.isStop && handlePtzStop(activeSpotlightCamera.id)}
                              onPointerLeave={() => !btn.isStop && handlePtzStop(activeSpotlightCamera.id)}
                              onBlur={() => !btn.isStop && handlePtzStop(activeSpotlightCamera.id)}
                              className={`h-10 rounded-lg border flex items-center justify-center transition-colors select-none ${
                                btn.isStop
                                  ? 'border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                  : isLight
                                  ? 'border-slate-300 bg-slate-50 hover:bg-slate-200 active:bg-emerald-500 active:text-white'
                                  : 'border-slate-700 bg-slate-950 hover:bg-slate-800 active:bg-emerald-600 active:text-white'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-2 w-20">
                        <button
                          type="button"
                          onPointerDown={() => handlePtzStart(activeSpotlightCamera, 0, 0, 80, 'Zoom In')}
                          onPointerUp={() => handlePtzStop(activeSpotlightCamera.id)}
                          onPointerCancel={() => handlePtzStop(activeSpotlightCamera.id)}
                          onPointerLeave={() => handlePtzStop(activeSpotlightCamera.id)}
                          className={`py-3 rounded-lg border text-[11px] font-medium flex flex-col items-center justify-center gap-1 select-none ${
                            isLight
                              ? 'border-slate-300 bg-slate-50 hover:bg-slate-200 active:bg-emerald-500 active:text-white'
                              : 'border-slate-700 bg-slate-950 hover:bg-slate-800 active:bg-emerald-600 active:text-white'
                          }`}
                        >
                          <ZoomIn className="w-4 h-4" />
                          <span>Zoom +</span>
                        </button>
                        <button
                          type="button"
                          onPointerDown={() => handlePtzStart(activeSpotlightCamera, 0, 0, -80, 'Zoom Out')}
                          onPointerUp={() => handlePtzStop(activeSpotlightCamera.id)}
                          onPointerCancel={() => handlePtzStop(activeSpotlightCamera.id)}
                          onPointerLeave={() => handlePtzStop(activeSpotlightCamera.id)}
                          className={`py-3 rounded-lg border text-[11px] font-medium flex flex-col items-center justify-center gap-1 select-none ${
                            isLight
                              ? 'border-slate-300 bg-slate-50 hover:bg-slate-200 active:bg-emerald-500 active:text-white'
                              : 'border-slate-700 bg-slate-950 hover:bg-slate-800 active:bg-emerald-600 active:text-white'
                          }`}
                        >
                          <ZoomOut className="w-4 h-4" />
                          <span>Zoom -</span>
                        </button>
                      </div>
                    </div>

                    {/* Presets Recall Grid */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">Presets Recall</span>
                        <button
                          type="button"
                          onClick={() => setEditingPresets((v) => !v)}
                          className="text-emerald-500 hover:underline font-medium"
                        >
                          {editingPresets ? 'Done' : 'Edit Labels'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          activeSpotlightCamera.ptzPresets && activeSpotlightCamera.ptzPresets.length > 0
                            ? activeSpotlightCamera.ptzPresets
                            : [
                                { presetId: 1, label: 'Gate Entry' },
                                { presetId: 2, label: 'Perimeter' },
                                { presetId: 3, label: 'Loading Bay' },
                                { presetId: 4, label: 'Street View' },
                              ]
                        ).map((preset, idx, arr) =>
                          editingPresets ? (
                            <input
                              key={preset.presetId}
                              type="text"
                              maxLength={40}
                              value={preset.label}
                              onChange={(e) => {
                                const next = arr.map((item, i) =>
                                  i === idx ? { ...item, label: e.target.value } : item
                                );
                                updateCamera(activeSpotlightCamera.id, { ptzPresets: next });
                              }}
                              className={inputClass}
                            />
                          ) : (
                            <button
                              key={preset.presetId}
                              type="button"
                              onClick={() => handlePresetRecall(activeSpotlightCamera, preset)}
                              className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] flex items-center justify-between gap-1 transition-colors ${
                                isLight
                                  ? 'border-slate-200 hover:bg-slate-100 text-slate-800'
                                  : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <span className="truncate">{preset.label}</span>
                              <span className="font-mono text-[10px] text-slate-500 tabular-nums shrink-0">
                                #{preset.presetId}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {ptzFeedback && (
                      <p className="text-[11px] font-mono text-slate-400 leading-snug">{ptzFeedback}</p>
                    )}
                  </>
                )}
              </div>

              {/* 3. Active Transport & Camera Management Summary */}
              <div className={`p-3.5 rounded-xl ${panelClass} space-y-2.5 text-[11px]`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider font-mono text-xs">Connection Path</span>
                  <span className="inline-flex items-center gap-1 font-mono text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{getEffectiveSignalingMode(activeSpotlightCamera)}</span>
                  </span>
                </div>
                <p className="font-mono text-slate-500 break-all">
                  {activeSpotlightCamera.whepUrl ||
                    (activeSpotlightCamera.host
                      ? `${activeSpotlightCamera.host}:${activeSpotlightCamera.httpPort || 80} (Ch ${activeSpotlightCamera.channel})`
                      : activeSpotlightCamera.serialNumber || 'Unconfigured')}
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCameraId(activeSpotlightCamera.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                      isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Edit Stream &amp; ICE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeCamera(activeSpotlightCamera.id);
                      setSelectedCameraId(null);
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10"
                    title="Remove camera"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
