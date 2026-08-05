const express = require('express');
const app = express();
const server = app.listen(3015, () => {
    console.log("Listening 3015");
});
console.log("Server returned:", server.constructor.name);
setTimeout(() => {
    console.log("Active handles:", process._getActiveHandles().map(h => h.constructor.name));
}, 100);
