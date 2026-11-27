import { fetchGeminiApi } from '../utils/geminiApi';

/**
 * Server-proxied Lizzy AI welfare & onboarding messages powered by free-tier Gemini models.
 */
export async function onboardingBot(socket: any, userId: string) {
  try {
    const res = await fetchGeminiApi('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Welcome user ${userId} to SafetyLink South Africa and explain how to test their iTAG button and add emergency contacts in 3 brief bullets.`,
        useFlashLite: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text && socket?.emit) socket.emit('lizzy_msg', data.text);
    }
  } catch (e) {
    console.warn('onboardingBot fallback:', e);
  }
}

export async function getLizzyMessage(panicStatus: string, lang: string): Promise<string> {
  const fallback: Record<string, string> = {
    en: "Hi, it's Lizzy from SafetyLink. Are you safe right now? Tap or say 'I am okay' to resolve, or 'Restart Panic' if you still need help.",
    zu: "Sawubona, ngu-Lizzy wakwa SafetyLink. Ingabe uphephile manje? Yithi 'Ngilungile' ukuvala noma 'Qala Kabusha' uma udinga usizo.",
    af: "Hallo, dis Lizzy van SafetyLink. Is jy nou veilig? Sê 'Ek is okay' om af te sluit of 'Herbegin' as jy nog hulp nodig het.",
  };

  try {
    const res = await fetchGeminiApi('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Panic status: ${panicStatus}. Language code: ${lang}. Write a short, warm 2-sentence check-in asking if the user is okay 10 minutes after an SOS alert and whether to keep dispatch active.`,
        useFlashLite: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch {
    // Fallback below
  }
  return fallback[lang] || fallback.en;
}
