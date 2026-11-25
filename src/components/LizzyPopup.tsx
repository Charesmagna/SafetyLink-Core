import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Volume2,
  Clock,
  Send,
  X,
} from 'lucide-react';
import { useGeminiLiveVoice } from '../hooks/useGeminiLiveVoice';
import { fetchGeminiApi } from '../utils/geminiApi';

type CheckInStage = 'ASKING_STATUS' | 'SAFE_UPDATE' | 'NOT_OKAY_ESCALATE' | 'NO_RESPONSE';

export const LizzyPopup: React.FC = () => {
  const {
    showLizzyPopup,
    setShowLizzyPopup,
    startMultiStagePanic,
    resolvePanic,
    currentPanicEvent,
    dispatchSettings,
    scheduleAiCheckIn,
    cancelAiCheckIn,
    openLizzyCompanion,
    addAuditLog,
    addToast,
  } = useAppStore();

  const [stage, setStage] = useState<CheckInStage>('ASKING_STATUS');
  const [aiMessage, setAiMessage] = useState<string>(
    'Are you okay? Please say Yes if you are safe, or No if you need help.'
  );
  const [heardText, setHeardText] = useState<string>('');
  const [situationUpdate, setSituationUpdate] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listenModeLabel, setListenModeLabel] = useState<string>('Listening automatically — just speak...');
  const [waitSecondsLeft, setWaitSecondsLeft] = useState<number>(45);

  const liveVoice = useGeminiLiveVoice();
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const recorderTimerRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakWatchdogRef = useRef<number | null>(null);
  const restartListenTimerRef = useRef<number | null>(null);

  const isOpenRef = useRef<boolean>(showLizzyPopup);
  isOpenRef.current = showLizzyPopup;
  const stageRef = useRef<CheckInStage>('ASKING_STATUS');
  stageRef.current = stage;
  const liveConnectedRef = useRef<boolean>(liveVoice.isConnected);
  liveConnectedRef.current = liveVoice.isConnected;

  const stopListening = useCallback(() => {
    if (restartListenTimerRef.current) {
      window.clearTimeout(restartListenTimerRef.current);
      restartListenTimerRef.current = null;
    }
    if (recorderTimerRef.current) {
      window.clearTimeout(recorderTimerRef.current);
      recorderTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (recorderRef.current) {
      try {
        recorderRef.current.ondataavailable = null;
        recorderRef.current.onstop = null;
        if (recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      } catch {}
      recorderRef.current = null;
    }
    if (recorderStreamRef.current) {
      try {
        recorderStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      recorderStreamRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speakWatchdogRef.current) {
      window.clearTimeout(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
    if (ttsAudioRef.current) {
      try {
        ttsAudioRef.current.onended = null;
        ttsAudioRef.current.onerror = null;
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  // Fallback hands-free voice capture via MediaRecorder + Gemini Transcribe (for Android WebView where SpeechRecognition is unavailable)
  const startMediaRecorderListener = useCallback(
    async (onTranscript: (spoken: string) => void) => {
      if (!isOpenRef.current || liveConnectedRef.current) return;
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isOpenRef.current || liveConnectedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        recorderStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          recorderStreamRef.current = null;
          recorderRef.current = null;
          setIsListening(false);
          if (!isOpenRef.current || liveConnectedRef.current) return;
          if (chunks.length === 0) return;
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result?.toString().split(',')[1];
            if (!base64 || !isOpenRef.current) return;
            try {
              const res = await fetchGeminiApi('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: blob.type || 'audio/webm' }),
              });
              const data = await res.json().catch(() => ({}));
              const spoken = String(data?.text || '').trim();
              if (spoken) {
                setHeardText(spoken);
                onTranscript(spoken);
              } else if (isOpenRef.current && stageRef.current === 'ASKING_STATUS' && !liveConnectedRef.current) {
                // Keep listening automatically without requiring a tap
                restartListenTimerRef.current = window.setTimeout(() => {
                  startMediaRecorderListener(onTranscript);
                }, 600);
              }
            } catch {
              // Retry auto-listen cleanly if popup still open
              if (isOpenRef.current && stageRef.current === 'ASKING_STATUS' && !liveConnectedRef.current) {
                restartListenTimerRef.current = window.setTimeout(() => {
                  startMediaRecorderListener(onTranscript);
                }, 1500);
              }
            }
          };
          reader.readAsDataURL(blob);
        };
        setListenModeLabel('Listening automatically (hands-free mic)...');
        setIsListening(true);
        recorder.start();
        // Record 5.5s hands-free window then transcribe automatically
        recorderTimerRef.current = window.setTimeout(() => {
          if (recorder.state !== 'inactive') {
            try {
              recorder.stop();
            } catch {}
          }
        }, 5500);
      } catch {
        setIsListening(false);
      }
    },
    []
  );

  // Hands-free auto-listening: uses SpeechRecognition with auto-restart, falling back seamlessly to MediaRecorder + Gemini Transcribe
  const startVoiceListener = useCallback(
    (onTranscript: (spoken: string) => void) => {
      if (typeof window === 'undefined' || !isOpenRef.current || liveConnectedRef.current) return;
      stopListening();

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        startMediaRecorderListener(onTranscript);
        return;
      }

      let gotFinalResult = false;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          setListenModeLabel('Listening automatically — just speak...');
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalText = '';
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const chunk = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) finalText += chunk;
            else interimText += chunk;
          }
          const combined = (finalText || interimText).trim();
          if (combined) setHeardText(combined);
          if (finalText.trim()) {
            gotFinalResult = true;
            stopListening();
            onTranscript(finalText.trim());
          }
        };

        recognition.onerror = (ev: any) => {
          setIsListening(false);
          const errCode = String(ev?.error || '');
          // If browser speech recognition isn't supported/available in WebView, automatically fall back to MediaRecorder + Gemini
          if (errCode === 'service-not-allowed' || errCode === 'network' || errCode === 'language-not-supported') {
            stopListening();
            startMediaRecorderListener(onTranscript);
            return;
          }
          // On no-speech / aborted while still waiting for an answer, auto-restart hands-free listening
          if (!gotFinalResult && isOpenRef.current && !liveConnectedRef.current && (errCode === 'no-speech' || errCode === 'aborted')) {
            restartListenTimerRef.current = window.setTimeout(() => {
              if (isOpenRef.current && !liveConnectedRef.current) {
                startVoiceListener(onTranscript);
              }
            }, 400);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // Keep listening automatically without requiring a button press while asking status
          if (!gotFinalResult && isOpenRef.current && !liveConnectedRef.current && stageRef.current === 'ASKING_STATUS') {
            restartListenTimerRef.current = window.setTimeout(() => {
              if (isOpenRef.current && !liveConnectedRef.current && stageRef.current === 'ASKING_STATUS') {
                startVoiceListener(onTranscript);
              }
            }, 450);
          }
        };

        recognition.start();
      } catch {
        setIsListening(false);
        startMediaRecorderListener(onTranscript);
      }
    },
    [startMediaRecorderListener, stopListening]
  );

  // Automatically speak aloud AND immediately transition to hands-free listening without pressing anything
  const speakAndThenListen = useCallback(
    async (text: string, onHeard?: (spoken: string) => void) => {
      setAiMessage(text);
      stopListening();
      stopSpeaking();

      const autoSpeak = dispatchSettings.aiCheckInAutoSpeak !== false;
      let transitioned = false;

      const beginListen = () => {
        if (transitioned) return;
        transitioned = true;
        if (speakWatchdogRef.current) {
          window.clearTimeout(speakWatchdogRef.current);
          speakWatchdogRef.current = null;
        }
        setIsSpeaking(false);
        if (onHeard && isOpenRef.current && !liveConnectedRef.current) {
          startVoiceListener(onHeard);
        }
      };

      if (!autoSpeak) {
        beginListen();
        return;
      }

      setIsSpeaking(true);

      // Guaranteed safety watchdog: even if audio autoplay is blocked or onend never fires on Android WebView, ALWAYS start listening automatically
      const estimatedSpeakMs = Math.min(9000, Math.max(3800, text.length * 75));
      speakWatchdogRef.current = window.setTimeout(() => {
        beginListen();
      }, estimatedSpeakMs);

      // 1. Try Gemini high-clarity WAV TTS first (with fast 3.5s abort timeout so it never stalls)
      try {
        const ctrl = new AbortController();
        const timeoutId = window.setTimeout(() => ctrl.abort(), 3500);
        const res = await fetchGeminiApi('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.slice(0, 500), voiceName: 'Kore' }),
          signal: ctrl.signal,
        });
        window.clearTimeout(timeoutId);
        if (res.ok && isOpenRef.current) {
          const data = await res.json();
          if (data.audioBase64) {
            const audio = new Audio(
              `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`
            );
            ttsAudioRef.current = audio;
            audio.onended = beginListen;
            audio.onerror = beginListen;
            await audio.play();
            return;
          }
        }
      } catch {
        // Fall through smoothly to device SpeechSynthesis
      }

      if (!isOpenRef.current || transitioned) return;

      // 2. Instant device SpeechSynthesis fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          utterance.voice =
            voices.find((v) => /female|samantha|google us english|zira/i.test(v.name)) ||
            voices[0] ||
            null;
          utterance.rate = 0.98;
          utterance.onend = beginListen;
          utterance.onerror = beginListen;
          window.speechSynthesis.speak(utterance);
          return;
        } catch {
          // Fall through to immediate listening
        }
      }

      beginListen();
    },
    [
      dispatchSettings.aiCheckInAutoSpeak,
      startVoiceListener,
      stopListening,
      stopSpeaking,
    ]
  );

  const handleRestartAlert = useCallback(
    (customUpdate?: string) => {
      stopListening();
      stopSpeaking();
      liveVoice.disconnect();
      const note = (customUpdate ?? situationUpdate).trim();
      const reason = note
        ? `Post-check-in re-trigger: ${note}`
        : 'User reported NOT OKAY during AI welfare check-in — alert restarted.';
      addAuditLog('SECURITY', 'SEVERE', 'AI Welfare Check-In Restarted Emergency Alert', reason);
      setShowLizzyPopup(false);
      startMultiStagePanic(reason, 0);
    },
    [
      addAuditLog,
      liveVoice,
      setShowLizzyPopup,
      situationUpdate,
      startMultiStagePanic,
      stopListening,
      stopSpeaking,
    ]
  );

  const handleMarkSafe = useCallback(
    (customUpdate?: string) => {
      stopListening();
      stopSpeaking();
      liveVoice.disconnect();
      cancelAiCheckIn();
      const note = (customUpdate ?? situationUpdate).trim();
      if (note) {
        addAuditLog('SYSTEM', 'INFO', 'Post-Emergency Situational Update Logged', note);
      }
      if (currentPanicEvent?.id) {
        resolvePanic(currentPanicEvent.id);
      } else {
        addToast(note ? 'Situational update saved — marked safe.' : 'Marked safe.', 'success');
      }
      setShowLizzyPopup(false);
    },
    [
      addAuditLog,
      addToast,
      cancelAiCheckIn,
      currentPanicEvent?.id,
      liveVoice,
      resolvePanic,
      setShowLizzyPopup,
      situationUpdate,
      stopListening,
      stopSpeaking,
    ]
  );

  const handleSnoozeCheckIn = useCallback(() => {
    stopListening();
    stopSpeaking();
    liveVoice.disconnect();
    const mins = dispatchSettings.aiCheckInDelayMinutes ?? 5;
    scheduleAiCheckIn(mins);
    addAuditLog(
      'SYSTEM',
      'INFO',
      `AI Welfare Check-In Rescheduled (+${mins} min)`,
      situationUpdate.trim() || 'User requested another check-in.'
    );
    addToast(`Kleva AI will check in again in ${mins} minute${mins === 1 ? '' : 's'}.`, 'info');
    setShowLizzyPopup(false);
  }, [
    addAuditLog,
    addToast,
    dispatchSettings.aiCheckInDelayMinutes,
    liveVoice,
    scheduleAiCheckIn,
    setShowLizzyPopup,
    situationUpdate,
    stopListening,
    stopSpeaking,
  ]);

  const enterSafeUpdateStage = useCallback(() => {
    setStage('SAFE_UPDATE');
    speakAndThenListen(
      "I'm glad you're okay. Tell me a quick situational update, or confirm to mark yourself safe.",
      (spoken) => {
        if (/trigger|restart|not okay|help me|danger/i.test(spoken)) {
          enterNotOkayStage();
          return;
        }
        setSituationUpdate((prev) => (prev ? `${prev} ${spoken}` : spoken));
      }
    );
  }, [speakAndThenListen]);

  const enterNotOkayStage = useCallback(() => {
    setStage('NOT_OKAY_ESCALATE');
    speakAndThenListen(
      "Understood — I'm right here with you. Say restart alert to trigger another emergency dispatch right now, or tell me what's happening.",
      (spoken) => {
        if (/restart|trigger|send alert|panic|yes|help now|call/i.test(spoken)) {
          handleRestartAlert(spoken);
        } else {
          setSituationUpdate((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      }
    );
  }, [handleRestartAlert, speakAndThenListen]);

  const handleInitialSpokenReply = useCallback(
    (spoken: string) => {
      const low = spoken.toLowerCase();
      if (/\b(no|not okay|not ok|help|danger|need help|hurt|unsafe|restart|trigger|panic|emergency)\b/.test(low)) {
        enterNotOkayStage();
      } else if (/\b(yes|yeah|yep|okay|ok|safe|fine|good|alright|i am okay|i'm okay)\b/.test(low)) {
        enterSafeUpdateStage();
      } else {
        setSituationUpdate(spoken);
        speakAndThenListen(
          'Are you okay? Please say Yes if you are safe, or No if you need help.',
          handleInitialSpokenReply
        );
      }
    },
    [enterNotOkayStage, enterSafeUpdateStage, speakAndThenListen]
  );

  // Automatically speak "Are you okay?" and immediately listen hands-free the instant popup opens
  useEffect(() => {
    if (showLizzyPopup) {
      const timeoutSec = dispatchSettings.aiCheckInResponseTimeoutSec ?? 45;
      setStage('ASKING_STATUS');
      setHeardText('');
      setSituationUpdate('');
      setWaitSecondsLeft(timeoutSec);

      speakAndThenListen(
        'Are you okay? Please say Yes if you are safe, or No if you need help.',
        handleInitialSpokenReply
      );
    } else {
      stopListening();
      stopSpeaking();
      liveVoice.disconnect();
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLizzyPopup]);

  // Response wait countdown while in ASKING_STATUS
  useEffect(() => {
    if (!showLizzyPopup || stage !== 'ASKING_STATUS' || liveVoice.isConnected) return;
    if (waitSecondsLeft <= 0) {
      setStage('NO_RESPONSE');
      speakAndThenListen(
        "I haven't heard from you yet. Say Yes if you are okay, or say Help to restart your emergency alert.",
        handleInitialSpokenReply
      );
      return;
    }
    const timer = setTimeout(() => setWaitSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [showLizzyPopup, stage, waitSecondsLeft, liveVoice.isConnected, speakAndThenListen, handleInitialSpokenReply]);

  const handleOpenCareChat = () => {
    stopListening();
    stopSpeaking();
    liveVoice.disconnect();
    setShowLizzyPopup(false);
    openLizzyCompanion('chat', {
      incidentId: currentPanicEvent?.id || 'CHECK-IN',
      summary:
        situationUpdate.trim() ||
        currentPanicEvent?.description ||
        'User switched from post-trigger welfare check to Kleva AI Chat.',
    });
  };

  const handleToggleLiveVoice = () => {
    stopListening();
    stopSpeaking();
    if (liveVoice.isConnected || liveVoice.isConnecting) {
      liveVoice.disconnect();
      return;
    }
    liveVoice.connect({
      mode: 'checkin',
      voice: 'Zephyr',
      context: situationUpdate.trim() || currentPanicEvent?.description || undefined,
    });
  };

  const handleManualListenAgain = () => {
    if (liveVoice.isConnected) return;
    setHeardText('');
    if (stage === 'ASKING_STATUS' || stage === 'NO_RESPONSE') {
      startVoiceListener(handleInitialSpokenReply);
    } else if (stage === 'SAFE_UPDATE') {
      startVoiceListener((spoken) =>
        setSituationUpdate((prev) => (prev ? `${prev} ${spoken}` : spoken))
      );
    } else if (stage === 'NOT_OKAY_ESCALATE') {
      startVoiceListener((spoken) => {
        if (/restart|trigger|send alert|panic|yes/i.test(spoken)) {
          handleRestartAlert(spoken);
        } else {
          setSituationUpdate((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      });
    }
  };

  const latestLiveLine = [...liveVoice.transcript]
    .reverse()
    .find((t) => t.role === 'assistant')?.text;
  const delayMins = dispatchSettings.aiCheckInDelayMinutes ?? 5;

  return (
    <AnimatePresence>
      {showLizzyPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="bg-slate-900 border border-emerald-500/40 shadow-2xl rounded-3xl p-5 sm:p-6 max-w-md w-full text-center relative overflow-hidden max-h-[92dvh] overflow-y-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

            <button
              type="button"
              onClick={() => setShowLizzyPopup(false)}
              aria-label="Close welfare check-in"
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Reactive Voice / Listening Avatar */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-2 transition-all duration-300 ${
                stage === 'NOT_OKAY_ESCALATE' || stage === 'NO_RESPONSE'
                  ? 'bg-red-500/20 border-red-400 animate-pulse'
                  : liveVoice.isConnected || isListening
                    ? 'bg-emerald-500/25 border-emerald-400 animate-pulse'
                    : isSpeaking
                      ? 'bg-cyan-500/25 border-cyan-400'
                      : 'bg-slate-800 border-emerald-500/30'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="text-cyan-300" size={26} />
              ) : isListening || liveVoice.isConnected ? (
                <Mic className="text-emerald-300" size={26} />
              ) : (
                <img
                  src="/media/kleva_logo/IMG_20260703_235254.svg"
                  alt="Kleva AI"
                  className="w-9 h-9 object-contain"
                />
              )}
            </div>

            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
              Kleva AI · Hands-Free Voice Check-In
            </span>

            <h2 className="text-xl font-bold text-white mb-2">
              {stage === 'ASKING_STATUS'
                ? 'Are You Okay?'
                : stage === 'SAFE_UPDATE'
                  ? 'Situational Update'
                  : stage === 'NOT_OKAY_ESCALATE'
                    ? 'Need Immediate Help?'
                    : 'Waiting for Your Response'}
            </h2>

            <p className="text-slate-200 text-sm mb-3 leading-relaxed">
              &ldquo;{latestLiveLine || aiMessage}&rdquo;
            </p>

            {/* Voice Status / Waiting Countdown Pill */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-[11px] font-mono">
              {isSpeaking && (
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                  Asking aloud: &ldquo;Are you okay?&rdquo;...
                </span>
              )}
              {isListening && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 animate-pulse">
                  {listenModeLabel}
                </span>
              )}
              {!isSpeaking && !isListening && !liveVoice.isConnected && (
                <button
                  type="button"
                  onClick={handleManualListenAgain}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 inline-flex items-center gap-1"
                >
                  <Mic size={12} className="text-emerald-400" /> Listen Again
                </button>
              )}
              {stage === 'ASKING_STATUS' && !liveVoice.isConnected && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 tabular-nums inline-flex items-center gap-1">
                  <Clock size={12} /> {waitSecondsLeft}s
                </span>
              )}
            </div>

            {heardText && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 text-left">
                <span className="text-[10px] font-mono uppercase text-emerald-400 mr-1.5">Heard:</span>
                &ldquo;{heardText}&rdquo;
              </div>
            )}

            {(liveVoice.statusMessage || liveVoice.error) && (
              <p
                className={`text-[11px] font-mono rounded-xl px-3 py-2 mb-3 border ${
                  liveVoice.error
                    ? 'text-red-300 bg-red-950/50 border-red-500/40'
                    : 'text-emerald-300 bg-slate-950/80 border-slate-800'
                }`}
              >
                {liveVoice.error || liveVoice.statusMessage}
              </p>
            )}

            {/* Stage 1 & No Response: Clear YES / NO Choice */}
            {(stage === 'ASKING_STATUS' || stage === 'NO_RESPONSE') && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={enterSafeUpdateStage}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg"
                  >
                    <CheckCircle2 size={18} />
                    Yes — I&apos;m Okay
                  </button>
                  <button
                    type="button"
                    onClick={enterNotOkayStage}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg"
                  >
                    <ShieldAlert size={18} />
                    No — Need Help
                  </button>
                </div>

                {stage === 'NO_RESPONSE' && (
                  <button
                    type="button"
                    onClick={() => handleRestartAlert('No response during post-trigger AI welfare check-in.')}
                    className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    <ShieldAlert size={18} />
                    Restart / Trigger Another Alert Now
                  </button>
                )}
              </div>
            )}

            {/* Stage 2 & Stage 3: Situational Update Capture + Action Buttons */}
            {(stage === 'SAFE_UPDATE' || stage === 'NOT_OKAY_ESCALATE') && (
              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Situational Update (Speak or Type)
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={situationUpdate}
                      onChange={(e) => setSituationUpdate(e.target.value)}
                      placeholder={
                        stage === 'SAFE_UPDATE'
                          ? 'e.g. Security arrived, false alarm, safely indoors...'
                          : 'e.g. Still need armed response, suspect outside gate...'
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleManualListenAgain}
                      title="Dictate situational update"
                      className={`px-3 rounded-xl border flex items-center justify-center ${
                        isListening
                          ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
                          : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                      }`}
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                </div>

                {stage === 'SAFE_UPDATE' ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleMarkSafe()}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                      <Send size={15} />
                      Save Update &amp; Mark Safe (Resolve)
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSnoozeCheckIn}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs"
                      >
                        <Clock size={14} /> Check Again ({delayMins}m)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestartAlert()}
                        className="flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                      >
                        <ShieldAlert size={14} /> Trigger New Alert
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleRestartAlert()}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg"
                    >
                      <ShieldAlert size={18} />
                      Restart / Trigger Another Alert Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkSafe()}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-2.5 rounded-xl text-xs"
                    >
                      <CheckCircle2 size={15} />
                      Actually I&apos;m Safe (Resolve)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Always-Available Live Voice + Care Chat Row */}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-800">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleLiveVoice}
                  disabled={liveVoice.isConnecting}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-colors text-xs ${
                    liveVoice.isConnected
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {liveVoice.isConnected ? <PhoneOff size={15} /> : <PhoneCall size={15} />}
                  {liveVoice.isConnected
                    ? 'End Live Voice'
                    : liveVoice.isConnecting
                      ? 'Connecting...'
                      : 'Talk Live with Kleva'}
                </button>
                {liveVoice.isConnected && (
                  <button
                    type="button"
                    onClick={liveVoice.toggleMute}
                    className={`px-3 rounded-xl border ${
                      liveVoice.isMuted
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                    title={liveVoice.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {liveVoice.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenCareChat}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-bold py-2.5 rounded-xl transition-colors text-xs"
              >
                <MessageSquare size={15} />
                Open Full Kleva AI Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
