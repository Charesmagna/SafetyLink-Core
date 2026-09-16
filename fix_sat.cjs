const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineMap.tsx', 'utf8');

code = code.replace(
  "export interface SatTelemetry { satelliteCount: number; accuracy: number; lastFix: number; provider: string; }",
  "export interface SatTelemetry { satelliteCount: number; accuracy: number; lastFix: number; provider: string; latitude?: number; longitude?: number; altitude?: number; velocity?: number; timestamp?: number; visibility?: 'optimal' | 'marginal' | 'poor'; }"
);

fs.writeFileSync('src/components/OfflineMap.tsx', code);
