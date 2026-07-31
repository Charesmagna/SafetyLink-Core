import fs from 'fs';
let content = fs.readFileSync('src/services/lizzy.ts', 'utf8');

content = content.replace(
  'const responseStream = await ai.models.generateContentStream({',
  'const responseStream = await (ai as any)?.models?.generateContentStream({'
);
content = content.replace(
  'for await (const chunk of responseStream) {',
  'if (!responseStream) return;\n  for await (const chunk of responseStream) {'
);
fs.writeFileSync('src/services/lizzy.ts', content);
