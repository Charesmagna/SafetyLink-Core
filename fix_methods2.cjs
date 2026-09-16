const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');

content = content.replace("  attemptCancelSOS: (pin: string) => {", 
"  cancelSOS: () => set({ activeSOSState: 'IDLE', panicCountdown: null }),\n  attemptCancelSOS: (pin: string) => {");

fs.writeFileSync('src/utils/store.ts', content);

