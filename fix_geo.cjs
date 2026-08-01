const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/BaseService.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Capacitor } from '@capacitor/core';", "import { Capacitor } from '@capacitor/core';\nimport { Geolocation } from '@capacitor/geolocation';");
content = content.replace(/const \{ Geolocation \} = await import\('@capacitor\/geolocation'\);\s*/, "");

fs.writeFileSync(file, content);
