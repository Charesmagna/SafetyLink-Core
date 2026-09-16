const fs = require('fs');

let nmo = fs.readFileSync('src/components/NodeMeshOrchestration.tsx', 'utf8');
const iconImports = `
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
`;
if (!nmo.includes("import markerIcon from")) {
    nmo = nmo.replace("import L from 'leaflet';", "import L from 'leaflet';" + iconImports);
    fs.writeFileSync('src/components/NodeMeshOrchestration.tsx', nmo);
}

let offlineMap = fs.readFileSync('src/components/OfflineMap.tsx', 'utf8');
if (!offlineMap.includes("import { SatTelemetry")) {
    offlineMap = offlineMap.replace(
        "import React", 
        "import { SatTelemetry } from '../types';\nimport React"
    );
    fs.writeFileSync('src/components/OfflineMap.tsx', offlineMap);
}

