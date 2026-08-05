const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`  if (hasRedis) {
    new Worker('panic_events', async (job) => {
      await processJob(job);
    }, { connection });
  }`,
`  if (hasRedis) {
    const worker = new Worker('panic_events', async (job) => {
      await processJob(job);
    }, { connection });
    worker.on('error', err => console.error('Worker error:', err));
  }
  
  if (panicQueue && typeof panicQueue.on === 'function') {
    panicQueue.on('error', err => console.error('Queue error:', err));
  }`
);

code = code.replace(
`    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });`,
`    app.use('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });`
);

fs.writeFileSync('server.ts', code);
