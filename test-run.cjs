const cp = require('child_process');
const p = cp.spawn('node', ['dist/server.cjs'], { env: { ...process.env, NODE_ENV: 'production', PORT: '8080' } });
p.stdout.on('data', d => console.log('OUT:', d.toString()));
p.stderr.on('data', d => console.log('ERR:', d.toString()));
p.on('exit', code => console.log('EXITED:', code));
