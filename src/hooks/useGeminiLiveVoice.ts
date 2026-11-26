import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SafetyLinkEmergency } from '../services/NativeDispatchService';
import { fetchGeminiApi } from '../utils/geminiApi';
import {
  generateLocalKlevaResponse,
  speakHandsFree,
  stopHandsFreeSpeech,
} from '../utils/localKlevaResponder';
import { useAppStore } from '../utils/store';

export type LiveVoiceName = 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
export type LiveVoiceMode = 'post_emergency' | 'checkin' | 'assistant';

export interface LiveTranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ConnectLiveOptions {
  mode?: LiveVoiceMode;
  voice?: LiveVoiceName;
  context?: string;
}

function pcmFloat32ToBase64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 0x8000;
  }
  return float32;
}

export function useGeminiLiveVoice() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState<LiveTranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const mutedRef = useRef<boolean>(false);

  // Built-in hands-free voice loop state (activates seamlessly on Android APK & Cloudflare Pages where /live WebSocket isn't hosted)
  const fallbackActiveRef = useRef<boolean>(false);
  const fallbackRecognitionRef = useRef<any>(null);
  const fallbackContextRef = useRef<string | undefined>(undefined);
  const fallbackModeRef = useRef<LiveVoiceMode>('post_emergency');

  const stopPlaybackQueue = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    stopHandsFreeSpeech();
    setIsModelSpeaking(false);
  }, []);

  const stopFallbackLoop = useCallback(() => {
    fallbackActiveRef.current = false;
    stopHandsFreeSpeech();
    if (Capacitor.isNativePlatform()) {
      SafetyLinkEmergency.stopListening().catch(() => {});
    }
    if (fallbackRecognitionRef.current) {
      try {
        fallbackRecognitionRef.current.onend = null;
        fallbackRecognitionRef.current.onresult = null;
        fallbackRecognitionRef.current.onerror = null;
        fallbackRecognitionRef.current.stop();
      } catch {}
      fallbackRecognitionRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    stopFallbackLoop();
    stopPlaybackQueue();
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (inputCtxRef.current) {
      try {
        inputCtxRef.current.close();
      } catch {}
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      try {
        outputCtxRef.current.close();
      } catch {}
      outputCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setMicLevel(0);
    setStatus('idle');
    setStatusMessage('');
  }, [stopFallbackLoop, stopPlaybackQueue]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const appendTranscript = useCallback((role: 'user' | 'assistant', chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && Date.now() - last.timestamp < 5000) {
        const updated = [...prev];
        const needsSpace = !last.text.endsWith(' ') && !clean.startsWith(' ') && !/^[.,!?']/.test(clean);
        updated[updated.length - 1] = {
          ...last,
          text: `${last.text}${needsSpace ? ' ' : ''}${clean}`,
          timestamp: Date.now(),
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role,
          text: clean,
          timestamp: Date.now(),
        },
      ];
    });
  }, []);

  const listenOnceHandsFree = useCallback(async (): Promise<string> => {
    if (!fallbackActiveRef.current) return '';
    if (Capacitor.isNativePlatform()) {
      const res = await SafetyLinkEmergency.listenSpeech({ lang: 'en-US' });
      return String(res?.text || '').trim();
    }
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRecognition) return '';

    return new Promise<string>((resolve) => {
      let settled = false;
      const done = (txt: string) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        fallbackRecognitionRef.current = null;
        resolve(txt.trim());
      };
      const timer = window.setTimeout(() => done(''), 9500);
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        fallbackRecognitionRef.current = rec;
        rec.onresult = (ev: any) => {
          const text = String(ev?.results?.[0]?.[0]?.transcript || '');
          done(text);
        };
        rec.onerror = () => done('');
        rec.onend = () => done('');
        rec.start();
      } catch {
        done('');
      }
    });
  }, []);

  const answerHandsFreeTurn = useCallback(
    async (userText: string): Promise<string> => {
      const state = useAppStore.getState();
      const safetyWord = (state.dispatchSettings?.aiSafetyWord || 'all clear').trim();
      try {
        const res = await fetchGeminiApi('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            role: fallbackModeRef.current === 'checkin' ? 'post_emergency' : 'coordinator',
            incidentContext: fallbackContextRef.current,
          }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.text && String(data.text).trim()) {
            return String(data.text).trim();
          }
        }
      } catch {
        // Fall back to local Kleva responder cleanly
      }
      return generateLocalKlevaResponse(userText, {
        role: fallbackModeRef.current,
        incidentContext: fallbackContextRef.current,
        safetyWord,
        lat: state.userLocation?.lat,
        lng: state.userLocation?.lng,
      });
    },
    []
  );

  const startHandsFreeFallbackSession = useCallback(
    async (options?: ConnectLiveOptions) => {
      fallbackActiveRef.current = true;
      fallbackContextRef.current = options?.context;
      fallbackModeRef.current = options?.mode || 'post_emergency';
      setError(null);
      setStatus('connected');
      setStatusMessage('Hands-free Lizzy Voice active — speak naturally.');

      const safetyWord = (useAppStore.getState().dispatchSettings?.aiSafetyWord || 'all clear').trim();
      const opening =
        options?.mode === 'checkin'
          ? `Are you okay? Please say Yes or your safety word, ${safetyWord}, if you are safe, or say Help if you need emergency assistance.`
          : `Hi, I'm Lizzy. Are you okay? Say Yes or your safety word if you are safe, or tell me how I can help right now.`;

      appendTranscript('assistant', opening);
      setIsModelSpeaking(true);
      await speakHandsFree(opening);
      setIsModelSpeaking(false);

      while (fallbackActiveRef.current) {
        if (mutedRef.current) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        setStatusMessage('Listening automatically — speak anytime...');
        setMicLevel(0.45);
        const spoken = await listenOnceHandsFree();
        setMicLevel(0);
        if (!fallbackActiveRef.current) break;
        if (!spoken) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        appendTranscript('user', spoken);
        setStatusMessage('Lizzy is responding...');
        const reply = await answerHandsFreeTurn(spoken);
        if (!fallbackActiveRef.current) break;
        appendTranscript('assistant', reply);
        setIsModelSpeaking(true);
        await speakHandsFree(reply);
        setIsModelSpeaking(false);
      }
    },
    [answerHandsFreeTurn, appendTranscript, listenOnceHandsFree]
  );

  const connect = useCallback(
    async (options?: ConnectLiveOptions) => {
      disconnect();
      setError(null);
      setStatus('connecting');
      setStatusMessage('Starting hands-free Lizzy Voice...');

      // On Android APK or static hosts without a Node /live WebSocket server, start hands-free voice immediately
      const host = typeof window !== 'undefined' ? window.location.host : '';
      const isStaticOrNative =
        Capacitor.isNativePlatform() ||
        /safetylink\.online|pages\.dev/i.test(host);

      if (isStaticOrNative) {
        startHandsFreeFallbackSession(options);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const inCtx = new AudioCtx({ sampleRate: 16000 });
        const outCtx = new AudioCtx({ sampleRate: 24000 });
        if (inCtx.state === 'suspended') await inCtx.resume();
        if (outCtx.state === 'suspended') await outCtx.resume();
        inputCtxRef.current = inCtx;
        outputCtxRef.current = outCtx;
        nextStartTimeRef.current = outCtx.currentTime;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const params = new URLSearchParams();
        params.set('mode', options?.mode || 'post_emergency');
        params.set('voice', options?.voice || 'Zephyr');
        if (options?.context) {
          params.set('context', options.context.slice(0, 500));
        }

        const ws = new WebSocket(`${protocol}//${window.location.host}/live?${params.toString()}`);
        wsRef.current = ws;

        const source = inCtx.createMediaStreamSource(stream);
        const processor = inCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (ev) => {
          const input = ev.inputBuffer.getChannelData(0);
          let sumSq = 0;
          for (let i = 0; i < input.length; i++) sumSq += input[i] * input[i];
          const rms = Math.sqrt(sumSq / input.length);
          setMicLevel(mutedRef.current ? 0 : Math.min(1, rms * 8));

          if (!mutedRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const base64 = pcmFloat32ToBase64(input);
            wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
          }
        };

        let wsOpened = false;

        ws.onopen = () => {
          wsOpened = true;
          source.connect(processor);
          processor.connect(inCtx.destination);
          setStatus('connected');
          setStatusMessage('Connected to Lizzy Live Voice. Speak naturally.');
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'ready') {
              setStatus('connected');
              setStatusMessage(`Live voice active (${msg.voice || 'Zephyr'}) — speak anytime.`);
            } else if (msg.type === 'audio' && msg.data && outputCtxRef.current) {
              const out = outputCtxRef.current;
              const f32 = base64Pcm16ToFloat32(msg.data);
              const buffer = out.createBuffer(1, f32.length, 24000);
              buffer.getChannelData(0).set(f32);

              const srcNode = out.createBufferSource();
              srcNode.buffer = buffer;
              srcNode.connect(out.destination);

              if (nextStartTimeRef.current < out.currentTime) {
                nextStartTimeRef.current = out.currentTime;
              }
              const startAt = nextStartTimeRef.current;
              nextStartTimeRef.current = startAt + buffer.duration;

              activeSourcesRef.current.add(srcNode);
              setIsModelSpeaking(true);
              srcNode.onended = () => {
                activeSourcesRef.current.delete(srcNode);
                if (activeSourcesRef.current.size === 0) {
                  setIsModelSpeaking(false);
                }
              };
              srcNode.start(startAt);
            } else if (msg.type === 'interrupted') {
              stopPlaybackQueue();
            } else if (msg.type === 'inputTranscript' && msg.text) {
              appendTranscript('user', msg.text);
            } else if ((msg.type === 'outputTranscript' || msg.type === 'text') && msg.text) {
              appendTranscript('assistant', msg.text);
            } else if (msg.type === 'error') {
              // Seamlessly switch to hands-free fallback voice if Gemini Live stream rejects
              try { ws.close(); } catch {}
              startHandsFreeFallbackSession(options);
            } else if (msg.type === 'closed') {
              setStatus('idle');
              setStatusMessage('Voice session ended.');
            }
          } catch (parseErr) {
            console.error('[useGeminiLiveVoice] message parse error:', parseErr);
          }
        };

        ws.onerror = () => {
          if (!wsOpened) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            startHandsFreeFallbackSession(options);
          }
        };

        ws.onclose = () => {
          if (!wsOpened && !fallbackActiveRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            startHandsFreeFallbackSession(options);
            return;
          }
          if (fallbackActiveRef.current) return;
          stopPlaybackQueue();
          if (processorRef.current) {
            try {
              processorRef.current.disconnect();
            } catch {}
            processorRef.current = null;
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          setMicLevel(0);
          setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
        };
      } catch {
        // Fall back smoothly to hands-free speech mode instead of dead-ending
        startHandsFreeFallbackSession(options);
      }
    },
    [appendTranscript, disconnect, startHandsFreeFallbackSession, stopPlaybackQueue]
  );

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setIsMuted(mutedRef.current);
  }, []);

  const sendTextTurn = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'text', text: clean }));
        appendTranscript('user', clean);
        return;
      }
      if (fallbackActiveRef.current) {
        appendTranscript('user', clean);
        const reply = await answerHandsFreeTurn(clean);
        appendTranscript('assistant', reply);
        setIsModelSpeaking(true);
        await speakHandsFree(reply);
        setIsModelSpeaking(false);
      }
    },
    [answerHandsFreeTurn, appendTranscript]
  );

  const clearTranscript = useCallback(() => setTranscript([]), []);

  return {
    status,
    statusMessage,
    error,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isMuted,
    isModelSpeaking,
    micLevel,
    transcript,
    connect,
    disconnect,
    toggleMute,
    sendTextTurn,
    clearTranscript,
  };
}
