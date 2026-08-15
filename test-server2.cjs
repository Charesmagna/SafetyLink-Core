const express = require('express');
const app = express();
const server = app.listen(3001, () => console.log('started'));
console.log('Server is:', !!server);
