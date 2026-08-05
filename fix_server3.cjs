const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });`,
`  const server = app.listen(PORT, "0.0.0.0", (err) => {
    if (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });`
);

code = code.replace(
`startServer();`,
`startServer().catch(err => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});`
);

code = code.replace(
`  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));`,
`  let isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));
  if (process.env.NODE_ENV !== 'development' && !fs.existsSync(path.join(process.cwd(), 'node_modules', 'vite'))) {
    isProduction = true; // Force production if vite is not installed
  }`
);

fs.writeFileSync('server.ts', code);
