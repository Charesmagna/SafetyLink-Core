process.on('exit', (code) => console.log('EXITED WITH CODE', code));
process.on('uncaughtException', (err) => console.log('UNCAUGHT', err));
process.on('unhandledRejection', (err) => console.log('UNHANDLED', err));
require('./dist/server.cjs');
