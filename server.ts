import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  const initGemini = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return ai;
  };

  // API ROUTES
  
  // 1. Text / Thinking / Chat / Grounding (Map/Search)
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, useThinking, useGrounding, useFlashLite } = req.body;
      const genAI = initGemini();
      
      let modelName = "gemini-3.5-flash"; // Default
      if (useThinking) modelName = "gemini-3.1-pro-preview";
      if (useFlashLite) modelName = "gemini-3.1-flash-lite";

      const config: any = {};
      
      if (useThinking) {
        config.thinkingConfig = { thinkingLevel: "HIGH" };
      }
      
      if (useGrounding === "search") {
        config.tools = [{ googleSearch: {} }];
      } else if (useGrounding === "maps") {
        config.tools = [{ googleMaps: {} }];
      }

      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Audio Transcription (gemini-3.5-flash)
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: "Transcribe this audio file accurately." },
          { inlineData: { data: audioBase64, mimeType: mimeType || "audio/mp3" } }
        ]
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Image Analysis (gemini-3.1-pro-preview)
  app.post("/api/gemini/analyze-image", async (req, res) => {
    try {
      const { imageBase64, mimeType, prompt } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { text: prompt || "Analyze this image." },
          { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
        ]
      });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // 4. Image Generation (gemini-3.1-flash-image-preview)
  app.post("/api/gemini/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const genAI = initGemini();
      const response = await genAI.models.generateImages({
        model: "gemini-3.1-flash-image-preview",
        prompt: prompt,
        config: {
          aspectRatio: aspectRatio || "1:1",
          outputMimeType: "image/jpeg",
        }
      });
      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (!b64) throw new Error("No image generated");
      res.json({ imageBase64: b64 });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
