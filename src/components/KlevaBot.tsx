import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "../utils/store";
import { Send, X, MapPin, Volume2, VolumeX, Mic, Square } from "lucide-react";
import { getLizzyProvider } from "../services/LizzyAIProvider";

const klevaLogo =
  "https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png";

export interface KlevaBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: number;
  links?: Array<{ title: string; uri: string }>;
}

export const KlevaBot: React.FC<KlevaBotProps> = ({
  isOpen: controlledIsOpen,
  onClose,
}) => {
  const { addAuditLog, userLocation } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const closePanel = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hi my dear, I'm Lizzy AI from K'lev.ai — your SafetyLink assistant. Tell me what you need, tap the mic to transcribe speech, or share your coordinates for nearby safe zones.",
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const speakResponse = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;
    try {
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 450), voiceName: "Kore" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
          }
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          ttsAudioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to offline Web Speech API
    }
    getLizzyProvider().speak(text).catch(() => {});
  };

  useEffect(() => {
    if (!isOpen) {
      getLizzyProvider().cancel();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const sendToLizzyGemini = async (
    textToSend: string,
    options?: { useMaps?: boolean; lat?: number; lng?: number }
  ) => {
    const clean = textToSend.trim();
    if (!clean) return;

    const historySnapshot = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: clean, timestamp: Date.now() },
    ]);
    setIsTyping(true);

    try {
      const lat = options?.lat ?? (userLocation?.lat || undefined);
      const lng = options?.lng ?? (userLocation?.lng || undefined);
      const shouldUseMaps =
        options?.useMaps ||
        /safe point|police|hospital|nearest|safe zone|where/i.test(clean);

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          history: historySnapshot,
          useMaps: Boolean(shouldUseMaps && lat && lng),
          lat,
          lng,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const replyText =
        data.text ||
        "I am here for you. In a life-threatening emergency in South Africa, call 10111 (SAPS) or 112 (Emergency), or trigger the main SOS button.";

      const links: Array<{ title: string; uri: string }> = Array.isArray(data.chunks)
        ? data.chunks
            .map((c: any) => {
              const uri = c?.maps?.uri || c?.web?.uri;
              const title = c?.maps?.title || c?.web?.title;
              return uri ? { title: title || "Verified Location", uri } : null;
            })
            .filter(Boolean)
        : [];

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: replyText, timestamp: Date.now(), links },
      ]);

      await speakResponse(replyText);
      addAuditLog(
        "SYSTEM",
        "INFO",
        "Lizzy AI answered inquiry",
        `Query: ${clean.substring(0, 40)}`
      );
    } catch {
      const offlineReply =
        "Network unreachable for Gemini AI. Offline guidance: dial 10111 (SAPS) or 112, or press the main SOS trigger for native SMS & hardware alerts.";
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: offlineReply, timestamp: Date.now() },
      ]);
      getLizzyProvider().speak(offlineReply).catch(() => {});
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
            if (data.text) {
              sendToLizzyGemini(data.text);
            }
          } catch (err) {
            console.warn("Voice note transcription failed:", err);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone permission is needed to record voice messages for Lizzy AI.");
    }
  };

  const handleShareLocation = () => {
    const lat = userLocation?.lat || -26.195246;
    const lng = userLocation?.lng || 28.034088;
    sendToLizzyGemini(
      `Here is my current GPS location (${lat.toFixed(5)}, ${lng.toFixed(5)}). Where are the nearest verified safe points or SAPS police stations?`,
      { useMaps: true, lat, lng }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="kleva-chat-panel"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[390px] h-[540px] max-h-[85vh] z-[120] bg-slate-950 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900/95 border-b border-slate-800 p-4 shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-blue-500" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                  <img
                    src={klevaLogo}
                    alt="Lizzy AI Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest font-mono text-slate-100 uppercase">
                    Lizzy AI • Safety Assistant
                  </h3>
                  <div className="flex flex-col text-[8.5px] font-mono uppercase tracking-wider text-slate-400">
                    <span>SIMPLIFIED BY K&apos;LEV.AI • GEMINI POWERED</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  title={voiceEnabled ? "Mute Lizzy Voice" : "Enable Lizzy Voice"}
                  className="p-1.5 rounded-full hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  title="Close Lizzy AI"
                  className="p-1.5 rounded-full hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-slate-950">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[88%] ${
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed font-mono whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {m.text}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                      {m.links.map((lnk, li) => (
                        <a
                          key={li}
                          href={lnk.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-emerald-400 underline hover:text-emerald-300"
                        >
                          📍 {lnk.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex mr-auto items-center gap-2">
                <div className="p-3 bg-slate-900 border border-slate-800 text-emerald-400 text-xs rounded-2xl rounded-bl-none font-mono italic animate-pulse">
                  Lizzy AI is analyzing safety context...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { label: "SA Emergency Numbers", q: "What are the emergency numbers in South Africa?" },
                { label: "Nearest Safe Point", q: "Where is the nearest SAPS police station or safe zone?" },
                { label: "Night Walk Safety", q: "Give me 3 brief safety tips while walking at night in SA." },
                { label: "Check-In Help", q: "How does Lizzy 10-minute panic check-in work?" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendToLizzyGemini(chip.q)}
                  className="px-2.5 py-1 text-[9px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg shrink-0 whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 flex gap-2"
          >
            <button
              type="button"
              onClick={handleShareLocation}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-emerald-400"
              title="Share GPS for nearby safe zones"
            >
              <MapPin size={14} />
            </button>
            <button
              type="button"
              onClick={handleToggleVoiceNote}
              className={`p-2.5 border rounded-xl transition-colors ${
                isRecording
                  ? "bg-red-600 border-red-500 text-white animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300"
              }`}
              title={isRecording ? "Stop & Transcribe Audio" : "Record Voice Message"}
            >
              {isRecording ? <Square size={14} /> : <Mic size={14} />}
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Lizzy AI anything..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 rounded-xl text-white disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
