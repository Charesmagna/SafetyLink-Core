import { useCallback, useEffect, useRef, useState } from 'react';

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
    setIsModelSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
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
  }, [stopPlaybackQueue]);

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

  const connect = useCallback(
    async (options?: ConnectLiveOptions) => {
      disconnect();
      setError(null);
      setStatus('connecting');
      setStatusMessage('Requesting microphone & connecting to Gemini Live...');

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

        ws.onopen = () => {
          source.connect(processor);
          processor.connect(inCtx.destination);
          setStatus('connected');
          setStatusMessage('Connected to Lizzy Live Voice (gemini-3.8-live). Speak naturally.');
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
              const errMsg = msg.message || 'Live voice session encountered an error.';
              setError(errMsg);
              setStatus('error');
              setStatusMessage(errMsg);
            } else if (msg.type === 'closed') {
              setStatus('idle');
              setStatusMessage('Voice session ended.');
            }
          } catch (parseErr) {
            console.error('[useGeminiLiveVoice] message parse error:', parseErr);
          }
        };

        ws.onerror = () => {
          const msg = 'Unable to connect to the live voice server. Please check your connection and try again.';
          setError(msg);
          setStatus('error');
          setStatusMessage(msg);
        };

        ws.onclose = () => {
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
      } catch (err: any) {
        const msg =
          err?.name === 'NotAllowedError'
            ? 'Microphone permission denied. Please allow microphone access to start a live voice conversation.'
            : err?.message || 'Could not start microphone for live voice.';
        setError(msg);
        setStatus('error');
        setStatusMessage(msg);
      }
    },
    [appendTranscript, disconnect, stopPlaybackQueue]
  );

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setIsMuted(mutedRef.current);
  }, []);

  const sendTextTurn = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', text: clean }));
    appendTranscript('user', clean);
  }, [appendTranscript]);

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
