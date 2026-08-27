const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineMap.tsx', 'utf8');

code = code.replace(
  "visibility: data.visibility,",
  "visibility: data.visibility || 'unknown',"
);

fs.writeFileSync('src/components/OfflineMap.tsx', code);
