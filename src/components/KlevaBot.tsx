import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "../utils/store";
import {
  Send,
  X,
  MapPin,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  AudioLines,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getLizzyProvider } from "../services/LizzyAIProvider";
import {
  useGeminiLiveVoice,
  type LiveVoiceName,
} from "../hooks/useGeminiLiveVoice";

const klevaLogo =
  "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png";

const STORAGE_KEY = "sl_gemini_companion_chat_v2";

export interface KlevaBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

type CompanionTab = "chat" | "voice";
type ChatRole = "post_emergency" | "coordinator" | "scribe";
type ChatModel = "gemini-4-hydrogen" | "gemini-3.1-flash-lite";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: number;
  model?: string;
  error?: boolean;
  links?: Array<{ title: string; uri: string }>;
}

const ROLE_OPTIONS: Array<{ id: ChatRole; label: string; hint: string }> = [
  {
    id: "post_emergency",
    label: "Post-Emergency Care",
    hint: "Calm check-in, grounding & next steps after an alert",
  },
  {
    id: "coordinator",
    label: "Safety Coordinator",
    hint: "SA safety planning, BLE iTAG & offline PCM help",
  },
  {
    id: "scribe",
    label: "Incident Scribe",
    hint: "Structure timeline & notes for SAPS or family",
  },
];

const VOICE_OPTIONS: LiveVoiceName[] = ["Zephyr", "Kore", "Puck", "Charon", "Fenrir"];

const DEFAULT_WELCOME: ChatMessage = {
  id: "welcome-lizzy",
  sender: "bot",
  text:
    "Hi, I'm **Lizzy**, your SafetyLink AI Companion. After any emergency — or anytime you need calm support — you can **chat here** or switch to **Live Voice** to speak with me in real time.\n\nHow are you feeling right now, and are you in a safe place?",
  timestamp: Date.now(),
  model: "gemini-4-hydrogen",
};

export const KlevaBot: React.FC<KlevaBotProps> = ({
  isOpen: controlledIsOpen,
  onClose,
}) => {
  const {
    addAuditLog,
    userLocation,
    panicEvents,
    contacts,
    currentUser,
    lizzyInitialTab,
    postEmergencyPrompt,
    dismissPostEmergencyPrompt,
  } = useAppStore();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const [activeTab, setActiveTab] = useState<CompanionTab>(lizzyInitialTab || "chat");
  const [role, setRole] = useState<ChatRole>("post_emergency");
  const [selectedModel, setSelectedModel] = useState<ChatModel>("gemini-4-hydrogen");
  const [selectedVoice, setSelectedVoice] = useState<LiveVoiceName>("Zephyr");
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [micNoteError, setMicNoteError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceTranscriptEndRef = useRef<HTMLDivElement>(null);

  const liveVoice = useGeminiLiveVoice();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(-40);
        }
      }
    } catch {}
    return [DEFAULT_WELCOME];
  });

  // Sync requested initial tab when opened via post-emergency trigger or launcher
  useEffect(() => {
    if (isOpen && lizzyInitialTab) {
      setActiveTab(lizzyInitialTab);
    }
  }, [isOpen, lizzyInitialTab]);

  // Persist multi-turn chat history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  // Build concise recent incident context for both Chat & Live Voice
  const incidentContextString = useMemo(() => {
    const parts: string[] = [];
    if (currentUser?.fullName) parts.push(`User: ${currentUser.fullName}`);
    if (postEmergencyPrompt) {
      parts.push(
        `Recent Emergency (${postEmergencyPrompt.incidentId}): ${postEmergencyPrompt.summary}`
      );
    } else if (panicEvents && panicEvents.length > 0) {
      const latest = panicEvents[0];
      parts.push(
        `Latest Incident (${latest.id}, status=${latest.status}, at ${new Date(
          latest.timestamp
        ).toLocaleString()}): ${latest.description}`
      );
    }
    if (userLocation && (userLocation.lat !== 0 || userLocation.lng !== 0)) {
      parts.push(
        `Last GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
      );
    }
    if (contacts && contacts.length > 0) {
      parts.push(
        `Saved emergency contacts: ${contacts
          .slice(0, 4)
          .map((c) => c.label)
          .join(", ")}`
      );
    }
    return parts.join(" | ");
  }, [currentUser, postEmergencyPrompt, panicEvents, userLocation, contacts]);

  const closePanel = () => {
    liveVoice.disconnect();
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const speakResponse = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    const plain = text.replace(/[*_`#>-]+/g, " ").replace(/\s+/g, " ").trim();
    try {
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain.slice(0, 450), voiceName: "Kore" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          if (ttsAudioRef.current) ttsAudioRef.current.pause();
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          ttsAudioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch {}
    getLizzyProvider().speak(plain).catch(() => {});
  };

  useEffect(() => {
    if (!isOpen) {
      liveVoice.disconnect();
      getLizzyProvider().cancel();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    }
  }, [isOpen, liveVoice.disconnect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    voiceTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveVoice.transcript]);

  const sendToLizzyGemini = async (
    textToSend: string,
    options?: { useMaps?: boolean; lat?: number; lng?: number }
  ) => {
    const clean = textToSend.trim();
    if (!clean || isTyping) return;
    setMicNoteError(null);

    const historySnapshot = messages
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.sender === "bot" ? "model" : "user",
        text: m.text,
      }));

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: clean,
      timestamp: Date.now(),
    };
    const botId = `b-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: botId,
        sender: "bot",
        text: "",
        timestamp: Date.now(),
        model: selectedModel,
      },
    ]);
    setIsTyping(true);

    const lat = options?.lat ?? (userLocation?.lat || undefined);
    const lng = options?.lng ?? (userLocation?.lng || undefined);
    const shouldUseMaps = Boolean(
      (options?.useMaps ||
        /safe point|police|hospital|nearest|safe zone|clinic/i.test(clean)) &&
        lat &&
        lng
    );

    const payload = {
      message: clean,
      history: historySnapshot,
      role,
      model: selectedModel,
      incidentContext: incidentContextString || undefined,
      useMaps: shouldUseMaps,
      lat,
      lng,
    };

    try {
      const res = await fetch("/api/gemini/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server returned HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";
      let accumulatedText = "";
      let links: Array<{ title: string; uri: string }> = [];

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            const dataLine = block
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;
            try {
              const evt = JSON.parse(dataLine.slice(6));
              if (evt.error) {
                throw new Error(evt.error);
              }
              if (evt.delta) {
                accumulatedText += evt.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
              if (evt.done && Array.isArray(evt.chunks)) {
                links = evt.chunks
                  .map((c: any) => {
                    const uri = c?.maps?.uri || c?.web?.uri;
                    const title = c?.maps?.title || c?.web?.title;
                    return uri ? { title: title || "Verified Location", uri } : null;
                  })
                  .filter(Boolean);
              }
            } catch (streamErr: any) {
              if (streamErr?.message && !streamErr.message.includes("JSON")) {
                throw streamErr;
              }
            }
          }
        }
      } else {
        const data = await res.json();
        accumulatedText = data.text || "";
        if (Array.isArray(data.chunks)) {
          links = data.chunks
            .map((c: any) => {
              const uri = c?.maps?.uri || c?.web?.uri;
              const title = c?.maps?.title || c?.web?.title;
              return uri ? { title: title || "Verified Location", uri } : null;
            })
            .filter(Boolean);
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error("Empty response received from Gemini.");
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? { ...m, text: accumulatedText, links, model: selectedModel }
            : m
        )
      );

      if (voiceEnabled) {
        await speakResponse(accumulatedText);
      }

      addAuditLog(
        "SYSTEM",
        "INFO",
        `Lizzy AI (${selectedModel}) replied`,
        `Role: ${role} · Query: ${clean.slice(0, 48)}`
      );
    } catch (err: any) {
      const errMsg =
        err?.message || "Unable to reach Gemini AI right now. Please retry.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                text: `Could not complete AI response: ${errMsg}\n\nIf you are in immediate danger in South Africa, call **10111** (SAPS), **112** (Emergency), or **10177** (Ambulance), or press your SafetyLink SOS button.`,
                error: true,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    const msg = inputMessage;
    setInputMessage("");
    sendToLizzyGemini(msg);
  };

  const handleToggleVoiceNote = async () => {
    setMicNoteError(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(",")[1];
          if (!base64) return;
          try {
            const res = await fetch("/api/gemini/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioBase64: base64,
                mimeType: blob.type || "audio/webm",
              }),
            });
            const data = await res.json();
            if (res.ok && data.text) {
              sendToLizzyGemini(data.text);
            } else {
              setMicNoteError(data?.error || "Voice transcription failed.");
            }
          } catch (err: any) {
            setMicNoteError(err?.message || "Voice transcription failed.");
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setMicNoteError("Microphone permission is needed to record a voice message.");
    }
  };

  const handleShareLocation = () => {
    const lat = userLocation?.lat || -26.2041;
    const lng = userLocation?.lng || 28.0473;
    sendToLizzyGemini(
      `My current GPS coordinates are (${lat.toFixed(5)}, ${lng.toFixed(5)}). Where are the nearest SAPS police stations, hospitals, or verified safe zones?`,
      { useMaps: true, lat, lng }
    );
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard?.writeText(msg.text).catch(() => {});
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId((prev) => (prev === msg.id ? null : prev)), 1800);
  };

  const handleClearChat = () => {
    setMessages([{ ...DEFAULT_WELCOME, timestamp: Date.now() }]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleStartLiveVoice = () => {
    if (liveVoice.isConnected || liveVoice.isConnecting) {
      liveVoice.disconnect();
      return;
    }
    liveVoice.connect({
      mode: role === "coordinator" ? "assistant" : "post_emergency",
      voice: selectedVoice,
      context: incidentContextString || undefined,
    });
  };

  const handleTransferVoiceToChat = () => {
    if (liveVoice.transcript.length === 0) {
      setActiveTab("chat");
      return;
    }
    const summaryText = liveVoice.transcript
      .map((entry) => `${entry.role === "user" ? "Me" : "Lizzy"}: ${entry.text}`)
      .join("\n");
    liveVoice.disconnect();
    setActiveTab("chat");
    setRole("scribe");
    sendToLizzyGemini(
      `Please summarize our live voice check-in below into a calm, clear post-emergency status note and recommended next steps:\n\n${summaryText}`
    );
  };

  const quickChips = useMemo(() => {
    if (role === "post_emergency") {
      return [
        {
          label: "Help me calm down",
          q: "I just had an emergency scare and feel shaken. Guide me through a short 60-second grounding exercise.",
        },
        {
          label: "Draft 'I'm safe' SMS",
          q: "Write a short, reassuring 'I am safe now' SMS message I can send to my emergency contacts.",
        },
        {
          label: "Post-incident checklist",
          q: "Give me a practical 5-step checklist of what to do immediately after a safety incident in South Africa.",
        },
        {
          label: "Nearest SAPS / Hospital",
          q: "Where is the nearest SAPS police station or emergency hospital to my location?",
        },
      ];
    }
    if (role === "scribe") {
      return [
        {
          label: "Draft SAPS statement",
          q: "Help me structure a clear, factual incident summary for a SAPS police report based on my latest SafetyLink event.",
        },
        {
          label: "Insurance / Estate log",
          q: "Create a concise incident log template with time, location, and witness details for estate security or insurance.",
        },
        {
          label: "Evidence checklist",
          q: "What photos, timestamps, or details should I preserve right now while everything is fresh?",
        },
      ];
    }
    return [
      { label: "SA Emergency Numbers", q: "List key South African emergency numbers (SAPS, ambulance, private EMS, GBV)." },
      { label: "Zero-Airtime PCM Help", q: "Explain how SafetyLink's free Please Call Me zero-airtime relay works on Rain SIM." },
      { label: "Night Travel Safety", q: "Give me 4 practical personal safety tips for driving or walking at night in South Africa." },
    ];
  }, [role]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="kleva-chat-panel"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", damping: 26, stiffness: 360 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[430px] h-[620px] max-h-[88vh] z-[120] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-3.5 shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500" />
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 flex items-center justify-center shrink-0">
                  <img
                    src={klevaLogo}
                    alt="Lizzy AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black tracking-wider font-mono text-white uppercase truncate">
                    Lizzy AI · Post-Emergency Companion
                  </h3>
                  <p className="text-[9px] font-mono text-emerald-400 truncate">
                    {activeTab === "voice"
                      ? "GEMINI 3.8 LIVE · REAL-TIME VOICE"
                      : selectedModel === "gemini-3.1-flash-lite"
                        ? "FAST TRIAGE · GEMINI 3.1 FLASH LITE"
                        : "CARE & DEBRIEF · GEMINI 4 HYDROGEN"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {activeTab === "chat" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      title={voiceEnabled ? "Mute spoken replies" : "Read replies aloud"}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        voiceEnabled
                          ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearChat}
                      title="Start new conversation"
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={closePanel}
                  title="Close companion"
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Dual Mode Switcher: Multi-turn Chat vs Real-Time Voice */}
            <div className="grid grid-cols-2 gap-1.5 mt-3 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (liveVoice.isConnected) liveVoice.disconnect();
                  setActiveTab("chat");
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activeTab === "chat"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare size={13} />
                Gemini Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("voice")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activeTab === "voice"
                    ? "bg-cyan-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <AudioLines size={13} />
                Live Voice
                {liveVoice.isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                )}
              </button>
            </div>
          </div>

          {/* Active / Recent Post-Emergency Context Banner */}
          {postEmergencyPrompt && (
            <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-3.5 py-2 flex items-start justify-between gap-2 shrink-0 text-left">
              <div className="flex items-start gap-2 min-w-0">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                    Post-Emergency Care Active · {postEmergencyPrompt.incidentId}
                  </p>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {postEmergencyPrompt.summary}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPostEmergencyPrompt}
                className="text-slate-400 hover:text-white p-0.5 shrink-0"
                title="Clear incident banner"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* ===================== TAB 1: MULTI-TURN GEMINI CHAT ===================== */}
          {activeTab === "chat" && (
            <>
              {/* Role & Model Selector Bar */}
              <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRole(opt.id)}
                      title={opt.hint}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors whitespace-nowrap ${
                        role === opt.id
                          ? "bg-emerald-600/25 border border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedModel("gemini-4-hydrogen")}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                      selectedModel === "gemini-4-hydrogen"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="gemini-4-hydrogen — thoughtful care & guidance"
                  >
                    <Sparkles size={10} /> Care
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModel("gemini-3.1-flash-lite")}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                      selectedModel === "gemini-3.1-flash-lite"
                        ? "bg-amber-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="gemini-3.1-flash-lite — ultra-fast triage answers"
                  >
                    <Zap size={10} /> Fast
                  </button>
                </div>
              </div>

              {/* Scrollable Multi-Turn Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[90%] ${
                      m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed text-left ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-sm font-sans"
                          : m.error
                            ? "bg-red-950/50 border border-red-500/40 text-red-200 rounded-bl-sm font-sans"
                            : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm font-sans"
                      }`}
                    >
                      {m.sender === "bot" ? (
                        m.text ? (
                          <div className="prose prose-invert prose-xs max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-emerald-400 animate-pulse">
                            Lizzy is typing...
                          </span>
                        )
                      ) : (
                        <span className="whitespace-pre-line">{m.text}</span>
                      )}

                      {m.links && m.links.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                          {m.links.map((lnk, li) => (
                            <a
                              key={li}
                              href={lnk.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[11px] text-emerald-400 underline hover:text-emerald-300"
                            >
                              📍 {lnk.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {m.sender === "bot" && m.model ? ` · ${m.model}` : ""}
                      </span>
                      {m.sender === "bot" && m.text && !m.error && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m)}
                          className="text-slate-500 hover:text-emerald-400 transition-colors"
                          title="Copy message"
                        >
                          {copiedId === m.id ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Follow-Up Prompts */}
              <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-900 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {quickChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isTyping}
                      onClick={() => sendToLizzyGemini(chip.q)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg shrink-0 whitespace-nowrap disabled:opacity-40"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                {micNoteError && (
                  <p className="text-[10px] font-mono text-amber-400 mt-1 text-left">
                    {micNoteError}
                  </p>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 flex gap-2"
              >
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={isTyping}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-emerald-400 disabled:opacity-40"
                  title="Share GPS for nearest SAPS & hospitals"
                >
                  <MapPin size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleVoiceNote}
                  disabled={isTyping}
                  className={`p-2.5 border rounded-xl transition-colors ${
                    isRecording
                      ? "bg-red-600 border-red-500 text-white animate-pulse"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300"
                  }`}
                  title={isRecording ? "Stop & transcribe" : "Dictate message"}
                >
                  {isRecording ? <Square size={15} /> : <Mic size={15} />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tell Lizzy how you are doing..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-xl text-white disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}

          {/* ===================== TAB 2: REAL-TIME GEMINI LIVE VOICE ===================== */}
          {activeTab === "voice" && (
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* Voice Persona Picker */}
              <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Voice
                </span>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={liveVoice.isConnected || liveVoice.isConnecting}
                      onClick={() => setSelectedVoice(v)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        selectedVoice === v
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reactive Voice Orb */}
              <div className="p-5 flex flex-col items-center justify-center border-b border-slate-900 shrink-0">
                <div className="relative flex items-center justify-center mb-3">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-150 border-2 ${
                      liveVoice.isModelSpeaking
                        ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_32px_rgba(34,211,238,0.45)]"
                        : liveVoice.isConnected
                          ? "bg-emerald-500/15 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)]"
                          : liveVoice.error
                            ? "bg-red-950/40 border-red-500/50"
                            : "bg-slate-900 border-slate-700"
                    }`}
                    style={{
                      transform: liveVoice.isConnected
                        ? `scale(${1 + Math.min(0.18, liveVoice.micLevel * 0.25)})`
                        : "scale(1)",
                    }}
                  >
                    {liveVoice.isConnected ? (
                      <AudioLines
                        size={34}
                        className={
                          liveVoice.isModelSpeaking
                            ? "text-cyan-300 animate-pulse"
                            : "text-emerald-300"
                        }
                      />
                    ) : (
                      <PhoneCall size={30} className="text-slate-400" />
                    )}
                  </div>
                </div>

                <p className="text-xs font-bold text-white">
                  {liveVoice.isConnecting
                    ? "Connecting to Gemini Live..."
                    : liveVoice.isConnected
                      ? liveVoice.isModelSpeaking
                        ? "Lizzy is speaking..."
                        : liveVoice.isMuted
                          ? "Microphone muted"
                          : "Listening — speak naturally"
                      : "Real-Time Post-Emergency Voice"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 text-center max-w-xs">
                  {liveVoice.error
                    ? liveVoice.error
                    : liveVoice.statusMessage ||
                      "Hands-free, low-latency conversation powered by Gemini 3.8 Live. Interrupt anytime."}
                </p>

                <div className="flex items-center gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={handleStartLiveVoice}
                    disabled={liveVoice.isConnecting}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-colors ${
                      liveVoice.isConnected
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    } disabled:opacity-60`}
                  >
                    {liveVoice.isConnected ? (
                      <>
                        <PhoneOff size={15} /> End Voice
                      </>
                    ) : (
                      <>
                        <PhoneCall size={15} />{" "}
                        {liveVoice.isConnecting ? "Connecting..." : "Start Live Voice"}
                      </>
                    )}
                  </button>

                  {liveVoice.isConnected && (
                    <button
                      type="button"
                      onClick={liveVoice.toggleMute}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        liveVoice.isMuted
                          ? "bg-amber-600 border-amber-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                      }`}
                      title={liveVoice.isMuted ? "Unmute mic" : "Mute mic"}
                    >
                      {liveVoice.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Live Transcript Stream */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Live Transcript
                  </span>
                  {liveVoice.transcript.length > 0 && (
                    <button
                      type="button"
                      onClick={handleTransferVoiceToChat}
                      className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Summarize in Chat →
                    </button>
                  )}
                </div>

                {liveVoice.transcript.length === 0 ? (
                  <div className="text-center py-6 px-4 text-[11px] text-slate-500 font-mono">
                    Live captions of your conversation with Lizzy will appear here in real time.
                  </div>
                ) : (
                  liveVoice.transcript.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-2.5 rounded-xl text-xs text-left ${
                        entry.role === "user"
                          ? "bg-blue-600/20 border border-blue-500/30 text-blue-100 ml-6"
                          : "bg-slate-900 border border-slate-800 text-slate-200 mr-6"
                      }`}
                    >
                      <span className="block text-[9px] font-mono uppercase text-slate-400 mb-0.5">
                        {entry.role === "user" ? "You" : `Lizzy (${selectedVoice})`}
                      </span>
                      {entry.text}
                    </div>
                  ))
                )}
                <div ref={voiceTranscriptEndRef} />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
