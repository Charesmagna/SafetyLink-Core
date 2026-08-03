const fs = require('fs');
let content = fs.readFileSync('src/services/TuyaIoTService.ts', 'utf8');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('src/services/TuyaIoTService.ts', content);
