const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const redirectMiddleware = `
  app.use((req, res, next) => {
    // Force www to non-www for canonical SEO and SSL simplicity
    if (req.headers.host && req.headers.host.match(/^www\./i)) {
      const newHost = req.headers.host.replace(/^www\./i, '');
      return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
    }
    next();
  });

  app.use(helmet({`;

content = content.replace(/  app\.use\(helmet\(\{/, redirectMiddleware);

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Patched server.ts with WWW redirect");
