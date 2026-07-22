const fs = require('fs');
let content = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

content = content.replace(
  "await login(registeredContactName.replace(/\\s+/g, '_').toLowerCase(), orgPassword, registeredOrgId);",
  "await login(registeredContactName, orgPassword, registeredOrgId);"
);

fs.writeFileSync('src/components/AuthScreen.tsx', content);
