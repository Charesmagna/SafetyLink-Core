const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/PanicButton.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import\('\.\.\/services\/NativeDispatchService'\)\.then\(\(\{ NativeDispatchService \}\) => \{\s*NativeDispatchService\.triggerVibration\(\);\s*NativeDispatchService\.forceUnlockAndWake\(\);\s*\}\);/g, "NativeDispatchService.triggerVibration();\n      NativeDispatchService.forceUnlockAndWake();");

fs.writeFileSync(file, content);
