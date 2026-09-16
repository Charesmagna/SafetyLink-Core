const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');

// Fix 'SUCCESS'
content = content.replace(/'DISPATCH', 'SUCCESS', 'DATA MODE SUCCESS'/g, "'DISPATCH', 'INFO', 'DATA MODE SUCCESS'");

// Fix timelineData object
content = content.replace(/{ time: new Date\(\)\.toLocaleTimeString\(\), message: 'Fallback Chain executed.' }/g, "\`\${new Date().toLocaleTimeString()} - Fallback Chain executed.\`");

fs.writeFileSync('src/utils/store.ts', content);
