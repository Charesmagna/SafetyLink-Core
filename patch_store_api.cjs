const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

const regex = /\/api\/(auth\/register-user|auth\/register-org|superadmin\/orgs|superadmin\/users|admin\/organizations|incidents|dispatch\/ntfy|dispatch\/owncloud|dispatch\/sensorstream)/g;

code = code.replace(/\/api\/auth\/register-user/g, 'https://safetylink.online/api/register');
code = code.replace(/\/api\/auth\/register-org/g, 'https://safetylink.online/api/register-org');
code = code.replace(/\/api\/superadmin\//g, 'https://safetylink.online/api/superadmin/');
code = code.replace(/\/api\/admin\//g, 'https://safetylink.online/api/admin/');
code = code.replace(/\/api\/incidents/g, 'https://safetylink.online/api/incidents');
code = code.replace(/\/api\/dispatch\//g, 'https://safetylink.online/api/dispatch/');
code = code.replace(/\/auth\/register-user/g, '/api/register');
code = code.replace(/\/auth\/register-org/g, '/api/register-org');

fs.writeFileSync('src/utils/store.ts', code);
