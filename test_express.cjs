const express = require('express');
const app = express();
app.listen(3000, "0.0.0.0", () => {
  console.log('Listening on 3000');
});
process.on('exit', code => console.log('EXITING', code));
