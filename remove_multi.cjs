const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /\{\/\* Multi-lined buttons \*\/\}[\s\S]*?pointerEvents:\s*'none'\s*\}\}\s*\/>/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/LandingPage.tsx', code);
