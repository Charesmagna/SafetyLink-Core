const fs = require('fs');
const file = 'src/services/EmergencyBridgeService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\} else \{\s*console\.error\('Dispatch failed with status:', response\.status\);\s*\}/, '} else { console.error("Dispatch failed after all retries."); }');
fs.writeFileSync(file, content);
