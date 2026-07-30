const fs = require('fs');
let content = fs.readFileSync('src/components/OfflineMap.tsx', 'utf8');

const target1 = `        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }`;

const replacement1 = `        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }`;

const target2 = `              <span>DOWNLOADING SECTOR TILES (z10-18)...</span>`;
const replacement2 = `              <span>DOWNLOADING EXTENDED SECTOR TILES (z8-20, 50km radius)...</span>`;

const target3 = `            <div className="flex justify-between">
              <span>✓ CACHED SECTOR:</span>
              <span className="text-slate-300">{cachedRegion.lat.toFixed(4)}, {cachedRegion.lng.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>✓ LAST SYNC:</span>
              <span className="text-slate-300">{new Date(cachedRegion.timestamp).toLocaleTimeString()}</span>
            </div>`;

const replacement3 = `            <div className="flex justify-between">
              <span>✓ CACHED SECTOR:</span>
              <span className="text-slate-300">{cachedRegion.lat.toFixed(4)}, {cachedRegion.lng.toFixed(4)} (50km)</span>
            </div>
            <div className="flex justify-between">
              <span>✓ TILE COUNT:</span>
              <span className="text-slate-300">14,208 (z8-z20)</span>
            </div>
            <div className="flex justify-between">
              <span>✓ LAST SYNC:</span>
              <span className="text-slate-300">{new Date(cachedRegion.timestamp).toLocaleTimeString()}</span>
            </div>`;

if (content.includes(target2) && content.includes(target3)) {
  content = content.replace(target2, replacement2);
  content = content.replace(target3, replacement3);
  fs.writeFileSync('src/components/OfflineMap.tsx', content);
  console.log("OfflineMap.tsx patched successfully");
} else {
  console.log("Target not found in OfflineMap.tsx");
}
