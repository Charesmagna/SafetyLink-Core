import { Capacitor } from '@capacitor/core';
import { SafetyLinkEmergency } from '../services/NativeDispatchService';
import { fetchGeminiApi } from './geminiApi';

let cloudTtsUnavailableUntil = 0;
let activeWebAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/**
 * Unlocks WebAudio + window.speechSynthesis on the first user gesture so
 * multi-minute post-panic timers can speak aloud automatically in browsers.
 */
export function unlockWebAudioAndSpeech(): void {
  if (audioUnlocked || typeof window === 'undefined') return;
  audioUnlocked = true;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.02);
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 150);
    }
  } catch {
    // ignore
  }
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch {
    // ignore
  }
}

export function stopHandsFreeSpeech(): void {
  if (Capacitor.isNativePlatform()) {
    SafetyLinkEmergency.stopSpeaking().catch(() => {});
  }
  if (activeWebAudio) {
    try {
      activeWebAudio.onended = null;
      activeWebAudio.onerror = null;
      activeWebAudio.pause();
      activeWebAudio = null;
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Speaks aloud hands-free across Android APK (native Android TextToSpeech) and
 * Web browsers (fast Gemini WAV TTS with instant window.speechSynthesis fallback).
 * Always resolves cleanly once finished so auto-listening starts immediately.
 */
export async function speakHandsFree(
  text: string,
  options?: { preferCloudTts?: boolean }
): Promise<boolean> {
  const clean = text.replace(/[*_`#>-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return false;

  stopHandsFreeSpeech();

  // 1. Android APK: Native Android TextToSpeech works reliably after any timer & offline
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await SafetyLinkEmergency.speakText({ text: clean.slice(0, 500) });
      if (res?.spoken) return true;
    } catch {
      // Fall through to audio/speechSynthesis fallback
    }
  }

  // 2. Web / fallback: try Gemini WAV TTS only when cloud TTS isn't known unavailable
  const shouldTryCloud =
    options?.preferCloudTts !== false &&
    typeof navigator !== 'undefined' &&
    navigator.onLine !== false &&
    Date.now() > cloudTtsUnavailableUntil;

  if (shouldTryCloud) {
    try {
      const ctrl = new AbortController();
      const tId = window.setTimeout(() => ctrl.abort(), 2200);
      const res = await fetchGeminiApi('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean.slice(0, 480), voiceName: 'Kore' }),
        signal: ctrl.signal,
      });
      window.clearTimeout(tId);
      if (res.status === 503 || res.status === 401 || res.status === 403) {
        // Cache unavailability briefly so future check-ins speak instantly with zero lag
        cloudTtsUnavailableUntil = Date.now() + 10 * 60 * 1000;
      } else if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.audioBase64) {
          const played = await new Promise<boolean>((resolve) => {
            let done = false;
            const finish = (ok: boolean) => {
              if (done) return;
              done = true;
              window.clearTimeout(watchdog);
              resolve(ok);
            };
            const watchdog = window.setTimeout(
              () => finish(true),
              Math.min(11000, Math.max(3500, clean.length * 80))
            );
            const audio = new Audio(
              `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`
            );
            activeWebAudio = audio;
            audio.onended = () => finish(true);
            audio.onerror = () => finish(false);
            audio.play().catch(() => finish(false));
          });
          if (played) return true;
        }
      }
    } catch {
      // Fall through instantly to device SpeechSynthesis
    }
  }

  // 3. Instant browser SpeechSynthesis fallback (works offline & without API key)
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(watchdog);
        resolve(ok);
      };
      const watchdog = window.setTimeout(
        () => finish(true),
        Math.min(10000, Math.max(3200, clean.length * 78))
      );
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utterance = new SpeechSynthesisUtterance(clean.slice(0, 480));
        const voices = window.speechSynthesis.getVoices();
        utterance.voice =
          voices.find((v) => /female|samantha|google us english|zira|en-za|en-gb/i.test(v.name)) ||
          voices.find((v) => /^en/i.test(v.lang)) ||
          voices[0] ||
          null;
        utterance.rate = 0.98;
        utterance.pitch = 1.02;
        utterance.onend = () => finish(true);
        utterance.onerror = () => finish(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        finish(false);
      }
    });
  }

  return false;
}

/**
 * Generates an intelligent, calm, South Africa-aware SafetyLink Kleva/Lizzy AI reply
 * whenever cloud Gemini is offline or the Worker API key is not configured yet.
 */
export function generateLocalKlevaResponse(
  query: string,
  opts?: {
    role?: string;
    incidentContext?: string;
    safetyWord?: string;
    lat?: number;
    lng?: number;
  }
): string {
  const q = query.trim().toLowerCase();
  const safetyWord = (opts?.safetyWord || 'all clear').trim();

  if (/\b(help|danger|hurt|attack|intruder|unsafe|not okay|not ok|emergency|panic|bleeding|fire)\b/.test(q)) {
    return [
      "I hear you — your safety comes first right now.",
      "1. **Move to a locked room or well-lit public place** if you can do so safely.",
      "2. **Trigger SafetyLink SOS** immediately to notify your emergency contacts and responders (ZeroLink offline USSD works even with R0 airtime).",
      "3. **South Africa Emergency Lines:** **10111** (SAPS Police) · **112** (Any Mobile Network) · **10177** (Ambulance/Fire) · **084 124** (ER24) · **082 911** (Netcare 911) · **0800 428 428** (GBV Command Centre).",
      opts?.lat && opts?.lng
        ? `Your last recorded GPS is **${opts.lat.toFixed(5)}, ${opts.lng.toFixed(5)}** — share this directly with responders.`
        : "Keep your phone screen on or pocket your BLE iTAG button so you can trigger without looking.",
    ].join('\n\n');
  }

  if (/\b(safe|okay|ok|fine|yes|all clear)\b/.test(q) || (safetyWord && q.includes(safetyWord.toLowerCase()))) {
    return [
      "I'm really glad you're safe. Take a slow breath in for 4 seconds, hold for 4, and breathe out for 6.",
      "Whenever you're ready, you can tell me a quick summary of what happened so I can log it to your incident timeline, or tap **Mark Safe** to resolve any active alert.",
      `Your check-in safety word is currently set to **"${safetyWord}"** (customizable in Settings → Post-Trigger AI Welfare Check-In).`,
    ].join('\n\n');
  }

  if (/\b(ussd|zerolink|airtime|offline|pcm|please call me|sim)\b/.test(q)) {
    return [
      "**ZeroLink Offline USSD** works even with **R0 airtime and zero mobile data**:",
      "- **Vodacom / Telkom:** `*140*0816738186#`",
      "- **MTN:** `*121*0816738186#`",
      "- **Cell C:** `*111*0816738186#`",
      "Make sure the blinking **ZeroLink** SIM indicator next to Mute on Mission Control is enabled, and tap **Sync Profile & FCM** in Settings while online so the Rain gateway (`+27 81 673 8186`) has your emergency contacts saved.",
    ].join('\n\n');
  }

  if (/\b(itag|ble|bluetooth|fob|button|keyfob)\b/.test(q)) {
    return [
      "**BLE iTAG Panic Button Quick Check:**",
      "1. Enable Bluetooth and Location on your phone.",
      "2. Open the **BLE / iTAG** tab in SafetyLink and tap **Scan**, then press the physical button on your iTAG fob once to wake it.",
      "3. Once paired, SafetyLink's foreground sentinel automatically reconnects even when the screen is locked.",
    ].join('\n\n');
  }

  if (/\b(police|hospital|clinic|nearest|safe point|safe zone)\b/.test(q)) {
    const mapLink =
      opts?.lat && opts?.lng
        ? `https://www.google.com/maps/search/police+station+or+hospital/@${opts.lat},${opts.lng},14z`
        : 'https://www.google.com/maps/search/nearest+police+station+or+hospital/';
    return [
      "Here are immediate emergency contacts & directions:",
      "- **SAPS Police:** 10111 · **Mobile Emergency:** 112 · **Ambulance:** 10177",
      "- **Private EMS:** ER24 `084 124` · Netcare 911 `082 911`",
      `- [Open Nearest Police & Hospitals on Google Maps](${mapLink})`,
    ].join('\n\n');
  }

  if (/\b(safety word|pin|duress|timer|check-?in)\b/.test(q)) {
    return [
      `**Hands-Free Check-In & Safety Word:**`,
      `- Your current safety word is **"${safetyWord}"**.`,
      "- When a post-trigger check-in timer fires, Lizzy automatically asks **\"Are you okay?\"** aloud and listens hands-free.",
      `- Say **"Yes"** or **"${safetyWord}"** to confirm you're safe, or say **"Help"** / **"No"** to restart emergency dispatch.`,
      "- You can customize the check-in delay (1–60 min) and your safety word anytime under **Settings → Post-Trigger AI Welfare Check-In Timer**.",
    ].join('\n\n');
  }

  return [
    "I'm **Lizzy / Kleva AI**, active in resilient local safety mode right now.",
    "Are you okay and in a safe place? You can say or type:",
    `- **"Yes"** or your safety word (**"${safetyWord}"**) to confirm you're safe`,
    '- **"Help"** or **"Not okay"** for immediate emergency steps & SA responder numbers',
    '- **"Nearest police or hospital"** for quick safe-zone routing',
    '- **"ZeroLink USSD"** or **"iTAG"** for offline panic setup help',
  ].join('\n');
}
