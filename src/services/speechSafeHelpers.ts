// Lightweight runtime helper to safely stop speech recognition and TTS
export function safeStopRecognition(recognitionRef: any) {
  if (!recognitionRef) return;
  try {
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      if (typeof r.abort === 'function') r.abort();
      else if (typeof r.stop === 'function') r.stop();
    }
  } catch (e) {
    console.warn('[safeStopRecognition] failed to stop recognition:', e);
  } finally {
    if (recognitionRef.current) recognitionRef.current = null;
  }
}

export function safeCancelTTS() {
  try {
    if (typeof window !== 'undefined' && (window as any).speechSynthesis) {
      (window as any).speechSynthesis.cancel?.();
    }
  } catch (e) {
    console.warn('[safeCancelTTS] cancel failed:', e);
  }
}
