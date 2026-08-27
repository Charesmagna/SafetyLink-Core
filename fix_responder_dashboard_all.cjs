const fs = require('fs');

let rd = fs.readFileSync('src/components/ResponderDashboard.tsx', 'utf8');

rd = rd.replace(/u\.lastLocation/g, '(u as any).lastLocation');

fs.writeFileSync('src/components/ResponderDashboard.tsx', rd);
