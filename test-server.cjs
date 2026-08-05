require('./dist/server.cjs');
setTimeout(() => {
    console.log("Active handles:", process._getActiveHandles().map(h => h.constructor.name));
    console.log("Active requests:", process._getActiveRequests().map(r => r.constructor.name));
}, 1000);
