const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/AuthScreen.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/CapacitorApp\.exitApp\(\);\s*if \(\(App as any\)\.canOpenUrl\) \{\s*\(App as any\)\.canOpenUrl\(\{ url: 'moya:\/\/' \}\)\.then\(\(res: any\) => setHasMoya\(res\.value\)\)\.catch\(\(\) => setHasMoya\(false\)\);\s*\}\s*\};\s*}/g, 
"CapacitorApp.canOpenUrl({ url: 'moya://' } as any).then((res: any) => setHasMoya(res.value)).catch(() => setHasMoya(false));\n    }");
fs.writeFileSync(file, content);
