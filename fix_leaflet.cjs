const fs = require('fs');

function addLeafletImports(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes("import { MapContainer")) {
    const importStr = "import { MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline } from 'react-leaflet';\n";
    // Find the last import statement or the beginning of the file
    code = importStr + code;
    fs.writeFileSync(file, code);
  }
}

addLeafletImports('src/components/GeospatialAnalytics.tsx');
addLeafletImports('src/components/MotherboardConsole.tsx');
addLeafletImports('src/components/NodeMeshOrchestration.tsx');

let nmo = fs.readFileSync('src/components/NodeMeshOrchestration.tsx', 'utf8');
if (!nmo.includes("import L from 'leaflet'")) {
    nmo = "import L from 'leaflet';\n" + nmo;
    fs.writeFileSync('src/components/NodeMeshOrchestration.tsx', nmo);
}

