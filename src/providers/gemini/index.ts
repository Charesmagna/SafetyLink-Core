import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';

let ai: GoogleGenAI | null = null;

if (env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}

export async function summarizeAlertText(text: string) {
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: `Please summarize this alert briefly and formally: ${text}`,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini fallback to plain text due to error:', error);
    return text;
  }
}
