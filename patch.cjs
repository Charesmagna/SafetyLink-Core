const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'if (process.env.NODE_ENV !== "production") {',
  'if (process.env.NODE_ENV !== "production" && !__dirname.includes("dist")) {'
);
fs.writeFileSync('server.ts', code);
