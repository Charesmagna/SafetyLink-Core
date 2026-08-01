const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/PanicButton.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Lock, ShieldAlert, X, AlertTriangle, Volume2, VolumeX } from 'lucide-react';", "import { Lock, ShieldAlert, X, AlertTriangle, Volume2, VolumeX } from 'lucide-react';\nimport { NativeDispatchService } from '../services/NativeDispatchService';");
content = content.replace(/import\('\.\.\/services\/NativeDispatchService'\)\.then\(\(\{ NativeDispatchService \}\) => \{\s*NativeDispatchService\.triggerEmergency\(\{/g, "NativeDispatchService.triggerEmergency({");
// and remove the extra closing braces
content = content.replace(/level: 'escalating',\s*metadata: \{ source: 'main_panic_button' \}\s*\}\);\s*\}\);/g, "level: 'escalating',\n          metadata: { source: 'main_panic_button' }\n        });");

fs.writeFileSync(file, content);
