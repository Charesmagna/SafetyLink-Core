const fs = require('fs');
let content = fs.readFileSync('src/routes/ussd.ts', 'utf8');

content = content.replace(/import \{ alertQueue \} from '\.\.\/jobs';/, 'import { processPanicAlert } from "../services/panic-alert";');
content = content.replace(/await alertQueue\.add\('process-incident', \{ incidentId \}\);/, 'processPanicAlert(incidentId).catch(console.error);');

fs.writeFileSync('src/routes/ussd.ts', content, 'utf8');
