import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { Mic, Square, Volume2, Globe, MapPin, Upload } from 'lucide-react';

type SubTab = 'chat' | 'voice' | 'transcribe' | 'safercity' | 'image' | 'surveillance';

export const AIHub: React.FC = () => {
  const { addAuditLog, triggerPanic, userLocation } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('chat');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.isFinal) {
        const transcript = latestResult[0].transcript.trim().toLowerCase();
        if (transcript.includes('execute emergency protocol') || transcript.includes('help me now')) {
          triggerPanic('Triggered via Voice Command');
          addAuditLog('SYSTEM', 'SEVERE', 'Emergency protocol initiated via covert voice command');
        }
      }
    };

    recognition.onend = () => {
      try {
        recognition.start();
      } catch {}
    };

    try {
      recognition.start();
    } catch {}

    return () => {
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {}
    };
  }, [triggerPanic, addAuditLog]);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; timestamp: number }>>([
    {
      sender: 'bot',
      text: "Greeting Responder. I am Lizzy AI (K'lev.ai), your Gemini-powered safety coordinator. Ask about routes, nearby SAPS/hospitals, or upload an image for hazard analysis.",
      timestamp: Date.now() - 5000,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Voice Live states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceWaves, setVoiceWaves] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10]);
  const [voiceLog, setVoiceLog] = useState<string>('Press start to establish Gemini Live bidirectional voice link.');

  // Accessibility Audio Transcriber + TTS states
  const [isRecordingTranscript, setIsRecordingTranscript] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const transcribeRecorderRef = useRef<MediaRecorder | null>(null);
  const transcribeChunksRef = useRef<Blob[]>([]);

  // Safer City Search + Maps state
  const [saferQuery, setSaferQuery] = useState('');
  const [saferLoading, setSaferLoading] = useState(false);
  const [saferAdvisory, setSaferAdvisory] = useState('');
  const [saferSafeZones, setSaferSafeZones] = useState('');
  const [saferSearchLinks, setSaferSearchLinks] = useState<Array<{ title: string; uri: string }>>([]);
  const [saferMapLinks, setSaferMapLinks] = useState<Array<{ title: string; uri: string }>>([]);

  // Paid-only notice states (Image / Veo)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoNotice, setVeoNotice] = useState<string | null>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      let lat = userLocation?.lat;
      let lng = userLocation?.lng;
      if ((!lat || !lng) && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          useGrounding: lat && lng ? 'maps' : 'search',
          lat,
          lng,
        }),
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      let reply = data.text || 'I could not process your request at this time.';

      if (data.chunks && Array.isArray(data.chunks)) {
        const links = data.chunks
          .map((chunk: any) => {
            const place = chunk.maps?.title || chunk.web?.title || 'Verified Source';
            const uri = chunk.maps?.uri || chunk.web?.uri;
            if (uri) return `<a href="${uri}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 underline">${place}</a>`;
            return null;
          })
          .filter(Boolean);

        if (links.length > 0) {
          reply += `<br/><br/>📍 <b>Verified Sources:</b><br/>` + links.join('<br/>');
        }
      }

      setChatMessages((prev) => [...prev, { sender: 'bot', text: reply, timestamp: Date.now() }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Could not reach Gemini service. Please verify internet connectivity.', timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', "Lizzy AI processed chat request", `Query: ${userMsg.substring(0, 30)}`);
    }
  };

  const handleAnalyzeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTyping(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'user', text: `[Evidence Photograph Uploaded: ${file.name}]`, timestamp: Date.now() },
      ]);

      fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: reader.result?.toString().split(',')[1],
          mimeType: file.type,
          prompt: 'Analyze this image for safety hazards, security parameters, or tactical anomalies.',
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `EVIDENCE ANALYZED (gemini-4-hydrogen): ${data.text || 'No analysis returned.'}`,
              timestamp: Date.now(),
            },
          ]);
          setIsTyping(false);
          addAuditLog('SECURITY', 'INFO', 'Lizzy AI analyzed evidence image', file.name);
        })
        .catch(() => setIsTyping(false));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (voiceActive) {
      interval = setInterval(() => {
        setVoiceWaves(Array.from({ length: 8 }, () => Math.floor(Math.random() * 32) + 5));
      }, 100);
    } else {
      setVoiceWaves([10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => clearInterval(interval);
  }, [voiceActive]);

  const wsRef = useRef<WebSocket | null>(null);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<any>(null);

  const toggleVoiceLink = async () => {
    if (voiceActive) {
      setVoiceActive(false);
      setVoiceLog('Voice link terminated.');
      addAuditLog('SYSTEM', 'INFO', 'Lizzy AI voice chat disconnected');
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (voiceProcessorRef.current) {
        voiceProcessorRef.current.disconnect();
        voiceProcessorRef.current = null;
      }
      if (voiceAudioCtxRef.current) {
        voiceAudioCtxRef.current.close();
        voiceAudioCtxRef.current = null;
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
        mediaRecorderRef.current = null;
      }
      return;
    }

    setVoiceActive(true);
    setVoiceLog('Connecting to gemini-3.8-live...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
      voiceAudioCtxRef.current = outputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      voiceProcessorRef.current = processor;
      mediaRecorderRef.current = { stream };

      ws.onopen = () => {
        setVoiceLog('Live audio link established! Speak to transmit.');
        addAuditLog('SYSTEM', 'INFO', 'Lizzy AI voice chat connected', 'gemini-3.8-live');

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }
          const bytes = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
          }
        };
        source.connect(processor);
        processor.connect(inputAudioCtx.destination);
      };

      let nextStartTime = 0;
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'audio' && msg.data) {
            const binary = atob(msg.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const pcm16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x7fff;

            const audioBuffer = outputAudioCtx.createBuffer(1, float32.length, 24000);
            audioBuffer.getChannelData(0).set(float32);
            const bufSource = outputAudioCtx.createBufferSource();
            bufSource.buffer = audioBuffer;
            bufSource.connect(outputAudioCtx.destination);
            if (nextStartTime < outputAudioCtx.currentTime) nextStartTime = outputAudioCtx.currentTime;
            bufSource.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            setVoiceLog('Receiving live audio from Lizzy...');
          } else if (msg.type === 'interrupted') {
            nextStartTime = outputAudioCtx.currentTime;
          } else if (msg.type === 'error') {
            setVoiceLog(`Error: ${msg.message}`);
          }
        } catch (err) {
          console.error(err);
        }
      };

      ws.onerror = () => setVoiceLog('WebSocket connection failed.');
      ws.onclose = () => setVoiceActive(false);
    } catch {
      setVoiceActive(false);
      setVoiceLog('Microphone access denied or unavailable.');
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result?.toString().split(',')[1];
        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || 'audio/webm' }),
        });
        const data = await res.json();
        setTranscriptText(data.text || 'No speech detected.');
      } catch {
        setTranscriptText('Transcription request failed.');
      } finally {
        setTranscribing(false);
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleToggleTranscribeMic = async () => {
    if (isRecordingTranscript && transcribeRecorderRef.current) {
      transcribeRecorderRef.current.stop();
      setIsRecordingTranscript(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      transcribeChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) transcribeChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(transcribeChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        transcribeBlob(blob);
      };
      transcribeRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingTranscript(true);
    } catch {
      setTranscriptText('Microphone permission denied.');
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) transcribeBlob(file);
  };

  const handleReadTranscriptAloud = async () => {
    if (!transcriptText.trim() || ttsSpeaking) return;
    setTtsSpeaking(true);
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText, voiceName: 'Kore' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          audio.onended = () => setTtsSpeaking(false);
          await audio.play();
          return;
        }
      }
    } catch {}
    setTtsSpeaking(false);
  };

  const handleSaferCityFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaferLoading(true);
    try {
      const res = await fetch('/api/gemini/safer-city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryText: saferQuery.trim() || undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
        }),
      });
      const data = await res.json();
      setSaferAdvisory(data.advisoryText || 'No active advisories returned.');
      setSaferSafeZones(data.safeZonesText || '');
      const sLinks = Array.isArray(data.searchChunks)
        ? data.searchChunks
            .map((c: any) => (c.web?.uri ? { title: c.web.title || 'Web Source', uri: c.web.uri } : null))
            .filter(Boolean)
        : [];
      const mLinks = Array.isArray(data.mapsChunks)
        ? data.mapsChunks
            .map((c: any) => (c.maps?.uri ? { title: c.maps.title || 'Google Maps Place', uri: c.maps.uri } : null))
            .filter(Boolean)
        : [];
      setSaferSearchLinks(sLinks);
      setSaferMapLinks(mLinks);
    } catch {
      setSaferAdvisory('Failed to reach Safer City Grounding service.');
    } finally {
      setSaferLoading(false);
    }
  };

  const handleCheckPaidImage = async () => {
    const res = await fetch('/api/gemini/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imagePrompt }),
    });
    const data = await res.json();
    setImageNotice(data.error || 'Requires a billing-enabled Gemini API key.');
  };

  const handleCheckPaidVideo = async () => {
    const res = await fetch('/api/gemini/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: veoPrompt }),
    });
    const data = await res.json();
    setVeoNotice(data.error || 'Requires a billing-enabled Gemini API key.');
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 text-left space-y-4 shadow relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <SafetyLinkLogo size={18} glowColor="rgba(16, 185, 129, 0.4)" />
          <h2 className="text-xs font-black tracking-widest font-mono uppercase text-slate-100 flex items-center gap-1">
            LIZZY AI • K&apos;LEV<span className="text-sm font-black text-emerald-400">A</span>.<span className="text-sm font-black text-emerald-400">I</span>NFO
          </h2>
        </div>
        <span className="text-[8px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider">
          gemini-4-hydrogen
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-850">
        {[
          { id: 'chat', label: 'Chatbot', icon: '💬' },
          { id: 'voice', label: 'Live Voice', icon: '🎙️' },
          { id: 'transcribe', label: 'Transcribe', icon: '🗣️' },
          { id: 'safercity', label: 'Safer City', icon: '🌐' },
          { id: 'image', label: 'Img (Pro)', icon: '🎨' },
          { id: 'surveillance', label: 'Veo (Pro)', icon: '📹' },
        ].map((sub) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => setActiveSubTab(sub.id as SubTab)}
            className={`py-1.5 text-[9px] font-mono font-bold rounded-xl uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeSubTab === sub.id ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{sub.icon}</span>
            <span>{sub.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[220px] flex flex-col justify-between">
        {activeSubTab === 'chat' && (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-2.5 text-xs font-mono">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl max-w-[88%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-100 ml-auto'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }} />
                </div>
              ))}
              {isTyping && <div className="text-slate-500 italic animate-pulse">Lizzy AI is analyzing...</div>}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <label
                className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer flex items-center justify-center text-sm shrink-0"
                title="Analyze Hazard Image"
              >
                📸
                <input type="file" accept="image/*" onChange={handleAnalyzeImage} className="hidden" />
              </label>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Lizzy AI about safe routes or hazards..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl uppercase font-mono shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {activeSubTab === 'voice' && (
          <div className="space-y-4 text-center py-4">
            <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs mx-auto bg-slate-950 rounded-2xl border border-slate-800 px-4">
              {voiceWaves.map((val, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: val }}
                  className={`w-1 rounded-full ${voiceActive ? 'bg-emerald-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={toggleVoiceLink}
              className={`px-5 py-2.5 rounded-full font-mono text-xs font-extrabold uppercase tracking-wide border transition-all ${
                voiceActive
                  ? 'bg-red-600/30 hover:bg-red-600 border-red-500 text-red-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
              }`}
            >
              {voiceActive ? '⏹️ Terminate Link' : '🎙️ Establish Live Voice Link'}
            </button>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Powered by gemini-3.8-live
            </p>
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] font-mono text-slate-400 text-left">
              STATUS: {voiceLog}
            </div>
          </div>
        )}

        {activeSubTab === 'transcribe' && (
          <div className="space-y-3">
            <p className="text-[11px] font-mono text-slate-400">
              Accessibility speech-to-text (<span className="text-emerald-400">gemini-3.5-transcribe</span>) &amp; read-aloud TTS (<span className="text-emerald-400">gemini-3.8-flash-lite-tts</span>).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleToggleTranscribeMic}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold ${
                  isRecordingTranscript
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRecordingTranscript ? <Square size={14} /> : <Mic size={14} />}
                {isRecordingTranscript ? 'Stop & Transcribe' : 'Record Voice Note'}
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer">
                <Upload size={14} /> Upload Audio
                <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
              </label>

              {transcriptText && (
                <button
                  type="button"
                  onClick={handleReadTranscriptAloud}
                  disabled={ttsSpeaking}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  <Volume2 size={14} /> {ttsSpeaking ? 'Speaking...' : 'Read Aloud'}
                </button>
              )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 min-h-[110px] text-xs font-mono text-slate-200 whitespace-pre-wrap">
              {transcribing
                ? 'Transcribing spoken audio via gemini-3.5-transcribe...'
                : transcriptText || 'Record or upload an audio clip to generate an accessible transcript.'}
            </div>
          </div>
        )}

        {activeSubTab === 'safercity' && (
          <div className="space-y-3">
            <form onSubmit={handleSaferCityFetch} className="flex gap-2">
              <input
                type="text"
                value={saferQuery}
                onChange={(e) => setSaferQuery(e.target.value)}
                placeholder="City / suburb query (optional, defaults to GPS)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <button
                type="submit"
                disabled={saferLoading}
                className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl font-mono"
              >
                {saferLoading ? 'Scanning...' : 'Refresh'}
              </button>
            </form>

            {saferAdvisory && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs font-mono text-slate-200 max-h-56 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]">
                  <Globe size={12} /> Google Search Safer City Advisories
                </div>
                <p className="whitespace-pre-line">{saferAdvisory}</p>
                {saferSearchLinks.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {saferSearchLinks.map((l, i) => (
                      <a key={i} href={l.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 underline">
                        🔗 {l.title}
                      </a>
                    ))}
                  </div>
                )}

                {saferSafeZones && (
                  <>
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] pt-2 border-t border-slate-800">
                      <MapPin size={12} /> Google Maps Grounded Safe Zones
                    </div>
                    <p className="whitespace-pre-line">{saferSafeZones}</p>
                  </>
                )}
                {saferMapLinks.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {saferMapLinks.map((l, i) => (
                      <a key={i} href={l.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-emerald-400 underline">
                        📍 {l.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'image' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-200">
              AI Image generation requires a billing-enabled Gemini API key. Standard free-tier text, voice, transcription, and hazard image analysis remain active.
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe tactical asset..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={handleCheckPaidImage}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl font-mono"
              >
                Check Tier
              </button>
            </div>
            {imageNotice && <p className="text-[11px] font-mono text-amber-400">{imageNotice}</p>}
          </div>
        )}

        {activeSubTab === 'surveillance' && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-200">
              Veo video generation requires a billing-enabled Gemini API key. Website hero motion and background loops run directly via R2 video streams and interactive HTML5 motion.
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={veoPrompt}
                onChange={(e) => setVeoPrompt(e.target.value)}
                placeholder="Describe video render..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={handleCheckPaidVideo}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl font-mono"
              >
                Check Tier
              </button>
            </div>
            {veoNotice && <p className="text-[11px] font-mono text-amber-400">{veoNotice}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
