const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');
code = code.replace(
  "        const emailToTry = username.includes('@') ? username : username;\n        if (emailToTry.includes('@') && password) {",
  `        const emailToTry = username.includes('@') ? username : username + '@safetylink.local';
        if (emailToTry && password) {`
);
fs.writeFileSync('src/utils/store.ts', code);
