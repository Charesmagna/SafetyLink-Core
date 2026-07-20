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
