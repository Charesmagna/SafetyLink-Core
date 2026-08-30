const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// We just replace the processJob and worker block with empty string.
content = content.replace(/const processJob = async[\s\S]*?if \(hasRedis\) \{[\s\S]*?\}\n\n/m, '');
content = content.replace(/const panicQueue = hasRedis \? new Queue\('panic_events', \{ connection \}\) : \{[\s\S]*?\} as any;/m, '');

fs.writeFileSync('server.ts', content, 'utf8');
