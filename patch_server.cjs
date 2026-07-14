const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "const app = express();",
  `import { db } from './src/db/index.js';\nimport { users, organizations, incidents, telemetryLogs, dispatchLogs } from './src/db/schema.js';\nimport { eq } from 'drizzle-orm';\nconst app = express();`
);
fs.writeFileSync('server.ts', code);
