const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/panic/trigger',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify({ userId: 'test', latitude: 0, longitude: 0 }));
req.end();
