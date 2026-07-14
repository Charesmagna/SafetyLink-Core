/**
 * OpenRouterProvider
 *
 * Calls the local backend proxy route /api/ai/chat, which holds the
 * OPENROUTER_API_KEY server-side. The key never appears in this file,
 * in any other src/ file, or in the Vite bundle.
 *
 * SECURITY: APKs can be decompiled. Never embed an API key in client code.
 * Set OPENROUTER_API_KEY as a server environment variable only.
 *
 * Usage: swappable via VITE_AI_PROVIDER=openrouter (see getLizzyProvider pattern).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  reply: string;
  model: string;
  simulated: boolean;
  error?: string;
}

class OpenRouterProvider {
  // Reads the backend base URL from env (consistent with other services).
  // Falls back to same-origin so it works in both dev (Vite proxy) and prod.
  private baseUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';

  async chat(messages: ChatMessage[], model?: string): Promise<ChatResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: model ?? 'openai/gpt-4o-mini' }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        return { reply: '', model: model ?? '', simulated: false, error: err.error ?? 'Server error' };
      }
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? '';
      const usedModel = data?.model ?? model ?? '';
      return { reply, model: usedModel, simulated: false };
    } catch (e) {
      console.warn('[OpenRouterProvider] Unreachable, returning empty reply.', e);
      return {
        reply: '',
        model: model ?? '',
        simulated: true,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}

let _openRouterProvider: OpenRouterProvider | null = null;

export function getOpenRouterProvider(): OpenRouterProvider {
  if (!_openRouterProvider) _openRouterProvider = new OpenRouterProvider();
  return _openRouterProvider;
}

/**
 * Convenience one-shot helper for components that just want a reply string.
 * Returns empty string and logs on failure — never throws.
 */
export async function askOpenRouter(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<string> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const result = await getOpenRouterProvider().chat(messages, model);
  if (result.error && !result.simulated) {
    console.error('[OpenRouterProvider] Chat error:', result.error);
  }
  return result.reply;
}
