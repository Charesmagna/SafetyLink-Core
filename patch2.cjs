const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'if (process.env.NODE_ENV !== "production" && !__dirname.includes("dist")) {',
  'if (process.env.NODE_ENV !== "production" && !process.argv[1].endsWith("server.cjs")) {'
);
fs.writeFileSync('server.ts', code);
