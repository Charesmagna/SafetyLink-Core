const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "useState<'LOGIN' | 'REGISTER_ORG'>('LOGIN')",
  "useState<'LOGIN' | 'REGISTER_ORG' | 'REGISTER_USER'>('LOGIN')"
);
fs.writeFileSync('src/App.tsx', code);
