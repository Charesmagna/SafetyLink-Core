import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '../utils/store';
import { SafetyLinkLogo } from './SafetyLinkLogo';
import { useGeminiLiveVoice, type LiveVoiceName } from '../hooks/useGeminiLiveVoice';
import { fetchGeminiApi } from '../utils/geminiApi';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  Globe,
  MapPin,
  Upload,
  PhoneCall,
  PhoneOff,
  AudioLines,
} from 'lucide-react';

type SubTab = 'chat' | 'voice' | 'transcribe' | 'safetyfeed' | 'image' | 'surveillance';

interface HubChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  links?: Array<{ title: string; uri: string }>;
  error?: boolean;
}

const VOICE_OPTIONS: LiveVoiceName[] = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];

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
  const [chatMessages, setChatMessages] = useState<HubChatMessage[]>([
    {
      sender: 'bot',
      text: "Hello! I am **Kleva AI** (Lizzy), your Gemini-powered safety companion. Ask about personal safety, nearby police/hospitals, or upload an image for hazard analysis.",
      timestamp: Date.now() - 5000,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Live Voice via shared Gemini 3.8 Live hook
  const liveVoice = useGeminiLiveVoice();
  const [selectedVoice, setSelectedVoice] = useState<LiveVoiceName>('Zephyr');
  const [voiceWaves, setVoiceWaves] = useState<number[]>([10, 10, 10, 10, 10, 10, 10, 10]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (liveVoice.isConnected) {
      interval = setInterval(() => {
        const boost = Math.max(6, Math.round(liveVoice.micLevel * 28));
        setVoiceWaves(Array.from({ length: 8 }, () => Math.floor(Math.random() * boost) + 8));
      }, 120);
    } else {
      setVoiceWaves([10, 10, 10, 10, 10, 10, 10, 10]);
    }
    return () => clearInterval(interval);
  }, [liveVoice.isConnected, liveVoice.micLevel]);

  // Accessibility Audio Transcriber + TTS states
  const [isRecordingTranscript, setIsRecordingTranscript] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const transcribeRecorderRef = useRef<MediaRecorder | null>(null);
  const transcribeChunksRef = useRef<Blob[]>([]);

  // Safety Feed AI Grounding state
  const [feedQuery, setFeedQuery] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedAdvisory, setFeedAdvisory] = useState('');
  const [feedSafeZones, setFeedSafeZones] = useState('');
  const [feedSearchLinks, setFeedSearchLinks] = useState<Array<{ title: string; uri: string }>>([]);
  const [feedMapLinks, setFeedMapLinks] = useState<Array<{ title: string; uri: string }>>([]);

  // Paid-only notice states (Image / Veo)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoNotice, setVeoNotice] = useState<string | null>(null);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg || isTyping) return;

    const historySnapshot = chatMessages
      .filter((m) => !m.error)
      .slice(-14)
      .map((m) => ({ role: m.sender === 'bot' ? 'model' : 'user', text: m.text }));

    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      let lat = userLocation?.lat;
      let lng = userLocation?.lng;
      const wantsMaps = /nearest|police|hospital|clinic|safe zone|safe point|near me/i.test(userMsg);
      if (wantsMaps && (!lat || !lng) && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }

      const response = await fetchGeminiApi('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: historySnapshot,
          role: 'coordinator',
          useMaps: Boolean(wantsMaps && lat && lng),
          lat,
          lng,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `AI request failed (HTTP ${response.status})`);
      }

      const links: Array<{ title: string; uri: string }> = Array.isArray(data.chunks)
        ? data.chunks
            .map((chunk: any) => {
              const title = chunk.maps?.title || chunk.web?.title || 'Verified Source';
              const uri = chunk.maps?.uri || chunk.web?.uri;
              return uri ? { title, uri } : null;
            })
            .filter(Boolean)
        : [];

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.text || 'I could not process your request at this time.',
          timestamp: Date.now(),
          links,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Could not complete AI response: ${err?.message || 'Service temporarily unavailable. Please try again.'}`,
          timestamp: Date.now(),
          error: true,
        },
      ]);
    } finally {
      setIsTyping(false);
      addAuditLog('SYSTEM', 'INFO', 'Kleva AI processed chat request', `Query: ${userMsg.substring(0, 30)}`);
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

      fetchGeminiApi('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: reader.result?.toString().split(',')[1],
          mimeType: file.type,
          prompt: 'Analyze this image for safety hazards, security parameters, or tactical anomalies.',
        }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data?.error || 'Image analysis failed');
          return data;
        })
        .then((data) => {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `**Evidence Analysis:** ${data.text || 'No analysis returned.'}`,
              timestamp: Date.now(),
            },
          ]);
          addAuditLog('SECURITY', 'INFO', 'Kleva AI analyzed evidence image', file.name);
        })
        .catch((err) => {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `Image analysis error: ${err?.message || 'Unable to analyze image.'}`,
              timestamp: Date.now(),
              error: true,
            },
          ]);
        })
        .finally(() => setIsTyping(false));
    };
    reader.readAsDataURL(file);
  };

  const toggleVoiceLink = () => {
    if (liveVoice.isConnected || liveVoice.isConnecting) {
      liveVoice.disconnect();
      addAuditLog('SYSTEM', 'INFO', 'Kleva AI live voice disconnected');
      return;
    }
    liveVoice.connect({
      mode: 'assistant',
      voice: selectedVoice,
      context: userLocation
        ? `User GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
        : undefined,
    });
    addAuditLog('SYSTEM', 'INFO', 'Kleva AI live voice connecting', `gemini-3.8-live (${selectedVoice})`);
  };

  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result?.toString().split(',')[1];
        const res = await fetchGeminiApi('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || 'audio/webm' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Transcription failed');
        setTranscriptText(data.text || 'No speech detected.');
      } catch (err: any) {
        setTranscriptText(err?.message || 'Transcription request failed.');
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
      const res = await fetchGeminiApi('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText, voiceName: 'Kore' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          audio.onended = () => setTtsSpeaking(false);
          audio.onerror = () => setTtsSpeaking(false);
          await audio.play();
          return;
        }
      }
    } catch {}
    setTtsSpeaking(false);
  };

  const handleSafetyFeedFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedLoading(true);
    try {
      let lat = userLocation?.lat;
      let lng = userLocation?.lng;
      if ((!lat || !lng) && !feedQuery.trim() && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }
      if (!feedQuery.trim() && (!lat || !lng)) {
        setFeedAdvisory('Please enable GPS location or type your suburb/city above to scan live local safety updates.');
        setFeedLoading(false);
        return;
      }

      const res = await fetchGeminiApi('/api/gemini/safety-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: feedQuery.trim() || undefined,
          lat,
          lng,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load Safety Feed advisories');
      }
      setFeedAdvisory(data.advisoryText || 'No active advisories returned for this location.');
      setFeedSafeZones(data.safeZonesText || '');
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
      setFeedSearchLinks(sLinks);
      setFeedMapLinks(mLinks);
    } catch (err: any) {
      setFeedAdvisory(err?.message || 'Failed to reach Safety Feed grounding service.');
    } finally {
      setFeedLoading(false);
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
            KLEVA AI • SAFETY COMPANION
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
          { id: 'safetyfeed', label: 'Safety Feed', icon: '🌐' },
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
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-100 ml-auto'
                      : m.error
                        ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  {m.sender === 'bot' ? (
                    <div className="prose prose-invert prose-xs max-w-none prose-p:my-1">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-line">{m.text}</span>
                  )}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
                      {m.links.map((lnk, li) => (
                        <a
                          key={li}
                          href={lnk.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-emerald-400 underline"
                        >
                          📍 {lnk.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <div className="text-slate-400 italic animate-pulse font-mono">Kleva AI is thinking...</div>}
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
                placeholder="Ask Kleva AI about safe routes or hazards..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isTyping || !chatInput.trim()}
                className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl uppercase font-mono shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {activeSubTab === 'voice' && (
          <div className="space-y-3 text-center py-2">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={liveVoice.isConnected || liveVoice.isConnecting}
                  onClick={() => setSelectedVoice(v)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                    selectedVoice === v
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 h-12 w-full max-w-xs mx-auto bg-slate-950 rounded-2xl border border-slate-800 px-4">
              {voiceWaves.map((val, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: val }}
                  className={`w-1.5 rounded-full ${
                    liveVoice.isModelSpeaking
                      ? 'bg-cyan-400'
                      : liveVoice.isConnected
                        ? 'bg-emerald-500'
                        : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceLink}
                disabled={liveVoice.isConnecting}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-extrabold uppercase tracking-wide border transition-all ${
                  liveVoice.isConnected
                    ? 'bg-red-600/30 hover:bg-red-600 border-red-500 text-red-100'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                } disabled:opacity-60`}
              >
                {liveVoice.isConnected ? <PhoneOff size={14} /> : <PhoneCall size={14} />}
                {liveVoice.isConnected
                  ? 'End Voice Link'
                  : liveVoice.isConnecting
                    ? 'Connecting...'
                    : 'Start Live Voice'}
              </button>

              {liveVoice.isConnected && (
                <button
                  type="button"
                  onClick={liveVoice.toggleMute}
                  className={`p-2.5 rounded-full border ${
                    liveVoice.isMuted
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                  title={liveVoice.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {liveVoice.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400">
              <AudioLines size={12} className="text-cyan-400" />
              <span>Powered by gemini-3.8-live</span>
            </div>

            <div
              className={`p-3 rounded-xl text-[11px] font-mono text-left border ${
                liveVoice.error
                  ? 'bg-red-950/40 border-red-500/40 text-red-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {liveVoice.error ||
                liveVoice.statusMessage ||
                'Press Start Live Voice to speak directly with Kleva AI in real time.'}
            </div>

            {liveVoice.transcript.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1.5 text-left text-[11px]">
                {liveVoice.transcript.slice(-6).map((t) => (
                  <div key={t.id} className={t.role === 'user' ? 'text-blue-300' : 'text-emerald-300'}>
                    <span className="font-mono font-bold uppercase text-[9px] mr-1.5">
                      {t.role === 'user' ? 'You:' : 'Kleva:'}
                    </span>
                    {t.text}
                  </div>
                ))}
              </div>
            )}
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

        {activeSubTab === 'safetyfeed' && (
          <div className="space-y-3">
            <form onSubmit={handleSafetyFeedFetch} className="flex gap-2">
              <input
                type="text"
                value={feedQuery}
                onChange={(e) => setFeedQuery(e.target.value)}
                placeholder="Your suburb or city (leave blank to use live GPS)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
              />
              <button
                type="submit"
                disabled={feedLoading}
                className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl font-mono"
              >
                {feedLoading ? 'Scanning...' : 'Refresh'}
              </button>
            </form>

            {feedAdvisory && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs font-mono text-slate-200 max-h-56 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]">
                  <Globe size={12} /> Live Safety Feed Advisories
                </div>
                <p className="whitespace-pre-line">{feedAdvisory}</p>
                {feedSearchLinks.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {feedSearchLinks.map((l, i) => (
                      <a key={i} href={l.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 underline">
                        🔗 {l.title}
                      </a>
                    ))}
                  </div>
                )}

                {feedSafeZones && (
                  <>
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] pt-2 border-t border-slate-800">
                      <MapPin size={12} /> Verified Nearby Safe Zones
                    </div>
                    <p className="whitespace-pre-line">{feedSafeZones}</p>
                  </>
                )}
                {feedMapLinks.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {feedMapLinks.map((l, i) => (
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
