/**
 * Client-safe Gemini text summarization proxy (delegates to /api/gemini/generate on server).
 */
export async function summarizeAlertText(text: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Please summarize this emergency alert briefly and formally in 1-2 sentences: ${text}`,
        useFlashLite: true,
      }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.text || text;
  } catch {
    return text;
  }
}
