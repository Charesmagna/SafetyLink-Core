const express = require('express');
const app = express();
app.listen(8081, '0.0.0.0', () => {
  console.log('Listening 8081');
});
process.on('beforeExit', () => console.log('BEFORE EXIT EVENT'));
