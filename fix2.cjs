const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
code = code.replace(/meta\[property="\$\{property\}"\]\\/g, 'meta[property="${property}"]`) || document.querySelector(`meta[property="${property}"]`);');
fs.writeFileSync('src/components/LandingPage.tsx', code);
