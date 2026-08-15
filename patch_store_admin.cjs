const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

code = code.replace(/superadmin\/orgs/g, 'super-admin/orgs');
code = code.replace(/superadmin\/users/g, 'super-admin/users');

fs.writeFileSync('src/utils/store.ts', code);
