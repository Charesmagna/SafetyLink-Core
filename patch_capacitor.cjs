const fs = require('fs');
let code = fs.readFileSync('capacitor.config.ts', 'utf8');
code = code.replace('launchShowDuration: 0,', 'launchShowDuration: 3000,');
code = code.replace('launchAutoHide: true,', 'launchAutoHide: false,');
fs.writeFileSync('capacitor.config.ts', code);
