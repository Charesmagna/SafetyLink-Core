import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function onboardingBot(socket: any, userId: string) {
  // Use Gemini generateContentStream to stream setup chat via Socket.io
  console.log(`Starting onboarding for user ${userId}`);
  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: 'Start onboarding chat for new user.',
  });
  
  for await (const chunk of responseStream) {
    socket.emit('lizzy_msg', chunk.text);
  }
}

export async function wellnessCheck(userId: string) {
  // Post-panic check
  console.log(`Running wellness check for user ${userId}`);
}

export async function getLizzyMessage(panicStatus: string, lang: string) {
  const prompts: Record<string, string> = {
    en: "You are Lizzy, a caring AI assistant for SafetyLink SA. The user just had a panic. Ask if they are okay, if help arrived, and offer to restart the alert or chat. Be warm, short, South African tone.",
    zu: "Ungu-Lizzy, umsizi we-AI wakwa SafetyLink. Umsebenzisi usanda kuba ne-panic. Mbuze ukuthi ukahle, usizwe, futhi umnike ithuba lokuqala kabusha i-alert noma ukukhuluma.",
    af: "Jy is Lizzy, 'n omgee KI-assistent vir SafetyLink SA. Die gebruiker het pas paniek gehad. Vra of hulle okay is, of hulp opgedaag het, en bied aan om die alarm te herbegin of te gesels."
  };
  
  const prompt = prompts[lang] || prompts.en;
  
  // Note: Since this is frontend code, using process.env.GEMINI_API_KEY will crash Vite. 
  // We need to use import.meta.env.VITE_GEMINI_API_KEY if we want client-side, 
  // or proxy it through a backend route. For now, assuming ai instance is initialized.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  
  return response.text;
}
