const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ForcedCountdownOverlay.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Capacitor } from '@capacitor/core';", "import { Capacitor } from '@capacitor/core';\nimport { Haptics } from '@capacitor/haptics';");
content = content.replace(/const hapticsModule = await import\('@capacitor\/haptics'\);\s*await hapticsModule\.Haptics\.vibrate\(\{ duration: 400 \}\);/, "await Haptics.vibrate({ duration: 400 });");

fs.writeFileSync(file, content);
