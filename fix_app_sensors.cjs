const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`    geoService.startTracking();
    startSensors();`,
`    geoService.startTracking();
    // startSensors(); // Disabled to prevent false auto-alerts as requested`
);

fs.writeFileSync('src/App.tsx', code);
