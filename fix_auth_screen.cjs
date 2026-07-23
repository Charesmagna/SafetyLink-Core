const fs = require('fs');
let content = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

content = content.replace(
  /<video[\s\S]*?<\/video>/,
  "<BackgroundVideoLoop />"
);

if (!content.includes('import { BackgroundVideoLoop }')) {
  content = content.replace(
    "import { AnimatedPulse } from './AnimatedPulse';",
    "import { AnimatedPulse } from './AnimatedPulse';\nimport { BackgroundVideoLoop } from './BackgroundVideoLoop';"
  );
  if (!content.includes('import { BackgroundVideoLoop }')) {
    content = "import { BackgroundVideoLoop } from './BackgroundVideoLoop';\n" + content;
  }
}

fs.writeFileSync('src/components/AuthScreen.tsx', content);
