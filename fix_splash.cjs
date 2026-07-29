const fs = require('fs');
let content = fs.readFileSync('capacitor.config.ts', 'utf8');

content = content.replace(
  '      launchShowDuration: 3000,',
  '      launchShowDuration: 500,'
);

fs.writeFileSync('capacitor.config.ts', content);
