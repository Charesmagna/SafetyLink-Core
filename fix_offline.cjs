const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineMap.tsx', 'utf8');

code = code.replace(
  "import { SatTelemetry } from '../types';",
  "export interface SatTelemetry { satelliteCount: number; accuracy: number; lastFix: number; provider: string; }"
);

fs.writeFileSync('src/components/OfflineMap.tsx', code);
