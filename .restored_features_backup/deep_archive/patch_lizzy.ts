import fs from 'fs';
let content = fs.readFileSync('src/services/lizzy.ts', 'utf8');

content = content.replace(
  'const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });',
  'const ai = null; // Removed to prevent Vite crash from process.env on client side.'
);
content = content.replace(
  'const response = await ai.models.generateContent',
  'const response = { text: prompt }; // await ai?.models.generateContent'
);

fs.writeFileSync('src/services/lizzy.ts', content);
