import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, CheckCircle2, Mic, PhoneCall, PhoneOff } from 'lucide-react';
import { getLizzyMessage } from '../services/lizzy';

export const LizzyPopup: React.FC = () => {
  const {
    showLizzyPopup,
    setShowLizzyPopup,
    startMultiStagePanic,
    resolvePanic,
    currentPanicEvent,
    language,
  } = useAppStore();

  const [isListening, setIsListening] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const [promptMessage, setPromptMessage] = useState<string>(
    "Hi, it's Lizzy from SafetyLink. Are you okay? Should I keep emergency dispatch active, or mark you safe?"
  );

  const recognitionRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopLiveVoice = () => {
    setLiveActive(false);
    setLiveStatus('');
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleRestart = () => {
    stopLiveVoice();
    setShowLizzyPopup(false);
    startMultiStagePanic('Lizzy 10-minute check-in escalated distress.', 0);
  };

  const handleResolve = () => {
    stopLiveVoice();
    if (currentPanicEvent?.id) {
      resolvePanic(currentPanicEvent.id);
    }
    setShowLizzyPopup(false);
  };

  const startLiveGeminiConversation = async () => {
    if (liveActive) {
      stopLiveVoice();
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    setLiveActive(true);
    setLiveStatus('Connecting live voice check-in with Lizzy...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live?mode=checkin`);
      wsRef.current = ws;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inCtx = new AudioCtx({ sampleRate: 16000 });
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      audioCtxRef.current = outCtx;

      const source = inCtx.createMediaStreamSource(stream);
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let nextStart = 0;

      ws.onopen = () => {
        setLiveStatus('Connected to Lizzy Live Voice (gemini-3.8-live). Speak naturally.');
        processor.onaudioprocess = (ev) => {
          const input = ev.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
          }
          const bytes = new Uint8Array(pcm16.buffer);
          let bin = '';
          for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', data: btoa(bin) }));
          }
        };
        source.connect(processor);
        processor.connect(inCtx.destination);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'audio' && msg.data) {
            const bin = atob(msg.data);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const pcm16 = new Int16Array(bytes.buffer);
            const f32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x7fff;

            const buf = outCtx.createBuffer(1, f32.length, 24000);
            buf.getChannelData(0).set(f32);
            const src = outCtx.createBufferSource();
            src.buffer = buf;
            src.connect(outCtx.destination);
            if (nextStart < outCtx.currentTime) nextStart = outCtx.currentTime;
            src.start(nextStart);
            nextStart += buf.duration;
          } else if (msg.type === 'text' && msg.text) {
            setPromptMessage(msg.text);
          } else if (msg.type === 'error') {
            setLiveStatus(`Live voice fallback: ${msg.message}`);
          }
        } catch (err) {
          console.error('Live check-in decode error:', err);
        }
      };

      ws.onerror = () => setLiveStatus('Live voice unavailable — use tap or speech buttons below.');
      ws.onclose = () => setLiveActive(false);
    } catch {
      setLiveActive(false);
      setLiveStatus('Microphone unavailable for live voice.');
    }
  };

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    let active = true;
    if (showLizzyPopup) {
      getLizzyMessage(currentPanicEvent?.status || 'ACTIVE', language || 'en')
        .then((msg) => {
          if (active && msg) setPromptMessage(msg);
          if (active && synth) {
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            const voices = synth.getVoices();
            utterance.voice = voices.find((v) => v.name.includes('Female')) || voices[0] || null;
            utterance.onend = () => {
              if (!active) return;
              try {
                const SpeechRecognition =
                  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                  recognitionRef.current = new SpeechRecognition();
                  recognitionRef.current.continuous = false;
                  recognitionRef.current.interimResults = false;
                  recognitionRef.current.onstart = () => setIsListening(true);
                  recognitionRef.current.onend = () => setIsListening(false);
                  recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript.toLowerCase();
                    if (
                      transcript.includes('help') ||
                      transcript.includes('no') ||
                      transcript.includes('restart') ||
                      transcript.includes('dispatch')
                    ) {
                      handleRestart();
                    } else if (
                      transcript.includes('okay') ||
                      transcript.includes('safe') ||
                      transcript.includes('cancel') ||
                      transcript.includes('yes')
                    ) {
                      handleResolve();
                    }
                  };
                  recognitionRef.current.start();
                }
              } catch {}
            };
            synth.speak(utterance);
          }
        })
        .catch(() => {});
    } else {
      stopLiveVoice();
      if (synth) synth.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    }

    return () => {
      active = false;
      stopLiveVoice();
      if (synth) synth.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, [showLizzyPopup]);

  return (
    <AnimatePresence>
      {showLizzyPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-emerald-500/40 shadow-2xl rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${
                liveActive || isListening
                  ? 'bg-emerald-500/30 border-emerald-400 animate-pulse'
                  : 'bg-slate-800 border-emerald-500/30'
              }`}
            >
              {liveActive || isListening ? (
                <Mic className="text-emerald-300" size={24} />
              ) : (
                <span className="text-2xl font-black text-emerald-400">AI</span>
              )}
            </div>

            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
              10-Minute Safety Check-In
            </span>
            <h2 className="text-xl font-bold text-white mb-2">Lizzy AI Welfare Check</h2>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              &ldquo;{promptMessage}&rdquo;
            </p>
            {liveStatus && (
              <p className="text-[11px] font-mono text-emerald-300 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 mb-4">
                {liveStatus}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startLiveGeminiConversation}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors text-sm ${
                  liveActive
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {liveActive ? <PhoneOff size={17} /> : <PhoneCall size={17} />}
                {liveActive ? 'End Live Voice Call' : 'Talk Live with Lizzy AI'}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                <ShieldAlert size={18} />
                Start / Restart Dispatch
              </button>

              <button
                type="button"
                onClick={handleResolve}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-3.5 rounded-xl transition-colors"
              >
                <CheckCircle2 size={18} />
                I&apos;m Okay (Resolve)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
