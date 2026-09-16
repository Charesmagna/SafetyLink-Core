const fs = require('fs');
let content = fs.readFileSync('src/utils/store.ts', 'utf8');
content = content.replace(/, firebaseRegisterUser, firebaseRegisterOrg/g, '');
fs.writeFileSync('src/utils/store.ts', content);
