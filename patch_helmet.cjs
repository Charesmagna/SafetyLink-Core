const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
  }));
`;

content = content.replace(/app\.use\(helmet\(\{.*?\}\)\);/s, replacement.trim());
fs.writeFileSync('server.ts', content);
console.log("Patched server.ts helmet");
