const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(
  /app\.use\(helmet\(\{([\s\S]*?)\}\)\);/,
  `app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    frameguard: false
  }));`
);
fs.writeFileSync('server.ts', serverTs);
