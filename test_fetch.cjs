const http = require('http');
require('./dist/server.cjs');
setTimeout(() => {
  http.get('http://localhost:3000/api/health', (res) => {
    console.log('STATUS:', res.statusCode);
  }).on('error', (err) => {
    console.log('FETCH ERROR:', err);
  });
}, 500);
