import React, { useEffect, useState } from 'react';
import { useAppStore } from '../utils/store';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  MessageSquare,
} from 'lucide-react';
import { getLizzyMessage } from '../services/lizzy';
import { useGeminiLiveVoice } from '../hooks/useGeminiLiveVoice';

export const LizzyPopup: React.FC = () => {
  const {
    showLizzyPopup,
    setShowLizzyPopup,
    startMultiStagePanic,
    resolvePanic,
    currentPanicEvent,
    language,
    openLizzyCompanion,
  } = useAppStore();

  const [promptMessage, setPromptMessage] = useState<string>(
    "Hi, it's Lizzy from SafetyLink. Are you okay? Should I keep emergency dispatch active, or mark you safe?"
  );

  const liveVoice = useGeminiLiveVoice();

  const handleRestart = () => {
    liveVoice.disconnect();
    setShowLizzyPopup(false);
    startMultiStagePanic('Lizzy post-emergency check-in escalated distress.', 0);
  };

  const handleResolve = () => {
    liveVoice.disconnect();
    if (currentPanicEvent?.id) {
      resolvePanic(currentPanicEvent.id);
    }
    setShowLizzyPopup(false);
  };

  const handleOpenCareChat = () => {
    liveVoice.disconnect();
    setShowLizzyPopup(false);
    openLizzyCompanion('chat', {
      incidentId: currentPanicEvent?.id || 'CHECK-IN',
      summary:
        currentPanicEvent?.description ||
        'User switched from post-emergency welfare check to Lizzy AI Care Chat.',
    });
  };

  const handleToggleLiveVoice = () => {
    if (liveVoice.isConnected || liveVoice.isConnecting) {
      liveVoice.disconnect();
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    liveVoice.connect({
      mode: 'checkin',
      voice: 'Zephyr',
      context: currentPanicEvent?.description || undefined,
    });
  };

  useEffect(() => {
    let active = true;
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    if (showLizzyPopup) {
      getLizzyMessage(currentPanicEvent?.status || 'ACTIVE', language || 'en')
        .then((msg) => {
          if (active && msg) setPromptMessage(msg);
          if (active && synth && msg) {
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            const voices = synth.getVoices();
            utterance.voice = voices.find((v) => v.name.includes('Female')) || voices[0] || null;
            synth.speak(utterance);
          }
        })
        .catch(() => {});
    } else {
      liveVoice.disconnect();
      if (synth) synth.cancel();
    }

    return () => {
      active = false;
      liveVoice.disconnect();
      if (synth) synth.cancel();
    };
  }, [showLizzyPopup]);

  const latestAssistantLine = [...liveVoice.transcript]
    .reverse()
    .find((t) => t.role === 'assistant')?.text;

  return (
    <AnimatePresence>
      {showLizzyPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="bg-slate-900 border border-emerald-500/40 shadow-2xl rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-300 ${
                liveVoice.isConnected
                  ? 'bg-emerald-500/30 border-emerald-400 animate-pulse'
                  : 'bg-slate-800 border-emerald-500/30'
              }`}
            >
              {liveVoice.isConnected ? (
                <Mic className="text-emerald-300" size={24} />
              ) : (
                <span className="text-2xl font-black text-emerald-400">AI</span>
              )}
            </div>

            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
              Post-Emergency Safety Check-In
            </span>
            <h2 className="text-xl font-bold text-white mb-2">Lizzy AI Welfare Check</h2>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              &ldquo;{latestAssistantLine || promptMessage}&rdquo;
            </p>

            {(liveVoice.statusMessage || liveVoice.error) && (
              <p
                className={`text-[11px] font-mono rounded-xl px-3 py-2 mb-4 border ${
                  liveVoice.error
                    ? 'text-red-300 bg-red-950/50 border-red-500/40'
                    : 'text-emerald-300 bg-slate-950/80 border-slate-800'
                }`}
              >
                {liveVoice.error || liveVoice.statusMessage}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleLiveVoice}
                  disabled={liveVoice.isConnecting}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors text-sm ${
                    liveVoice.isConnected
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {liveVoice.isConnected ? <PhoneOff size={17} /> : <PhoneCall size={17} />}
                  {liveVoice.isConnected
                    ? 'End Live Voice'
                    : liveVoice.isConnecting
                      ? 'Connecting...'
                      : 'Talk Live with Lizzy'}
                </button>
                {liveVoice.isConnected && (
                  <button
                    type="button"
                    onClick={liveVoice.toggleMute}
                    className={`px-3.5 rounded-xl border ${
                      liveVoice.isMuted
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                    title={liveVoice.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {liveVoice.isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenCareChat}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                <MessageSquare size={17} />
                Open Post-Emergency Chat
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
