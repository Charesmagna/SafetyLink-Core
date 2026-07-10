/**
 * Lizzy AI Voice Provider Abstraction
 * Swap providers by changing VITE_LIZZY_PROVIDER env var.
 * K'lev.ai replaces Web Speech without touching UI logic.
 */

export interface LizzyProvider {
  speak(text: string): Promise<void>;
  cancel(): void;
}

/** Web Speech Synthesis — always available, works offline */
class WebSpeechProvider implements LizzyProvider {
  async speak(text: string): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9;
      utt.pitch = 1.1;
      utt.lang = 'en-ZA';
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }
  cancel() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

/** K'lev.ai / Anthropic provider — requires internet */
class KlevAIProvider implements LizzyProvider {
  private fallback = new WebSpeechProvider();
  private endpoint = import.meta.env.VITE_KLEV_AI_ENDPOINT ?? '';

  async speak(text: string): Promise<void> {
    if (!this.endpoint) return this.fallback.speak(text);
    try {
      const r = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error('K\'lev.ai unavailable');
      const { reply } = await r.json();
      return this.fallback.speak(reply || text);
    } catch {
      // Graceful fallback to TTS if AI unreachable
      return this.fallback.speak(text);
    }
  }

  cancel() { this.fallback.cancel(); }
}

let _provider: LizzyProvider | null = null;

export function getLizzyProvider(): LizzyProvider {
  if (_provider) return _provider;
  const providerName = import.meta.env.VITE_LIZZY_PROVIDER ?? 'webspeech';
  _provider = providerName === 'klev' ? new KlevAIProvider() : new WebSpeechProvider();
  return _provider;
}
