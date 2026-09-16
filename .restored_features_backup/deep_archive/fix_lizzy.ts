import fs from 'fs';
let content = fs.readFileSync('src/services/lizzy.ts', 'utf8');

content = content.replace(
  `    model: 'gemini-2.5-flash',\n    contents: prompt,\n  });`,
  `    // model: 'gemini-2.5-flash',\n    // contents: prompt,\n  // });`
);

fs.writeFileSync('src/services/lizzy.ts', content);
