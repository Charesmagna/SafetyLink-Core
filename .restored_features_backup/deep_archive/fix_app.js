const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// The original line was:
//                        import('@capacitor/core').then(({ Capacitor }) => {
//                          const bridge = ((Capacitor as any).Plugins).SafetyLinkBridge;
//                          if (bridge) bridge.toggleFloatingWidget({ enable: newState });
//                        });
// We want it to be:
//                        if (Capacitor.isNativePlatform()) {
//                          const bridge = ((Capacitor as any).Plugins).SafetyLinkBridge;
//                          if (bridge) bridge.toggleFloatingWidget({ enable: newState });
//                        }

content = content.replace(/if \(bridge\) bridge\.toggleFloatingWidget\(\{ enable: newState \} catch/g, "if (bridge) bridge.toggleFloatingWidget({ enable: newState });\n                        }");
content = content.replace(/\} catch\s+\} catch \(e\) \{/g, "} catch (e) {");
fs.writeFileSync(file, content);
