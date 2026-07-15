const express = require('express');
const app = express();
const server = app.listen(3002, '0.0.0.0', () => console.log('started'));
server.on('close', () => console.log('closed'));
