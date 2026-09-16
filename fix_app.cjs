const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We need to look at AuthScreen props
code = code.replace(
  'initialView={authInitialView}',
  'initialView={authInitialView as any}'
);
fs.writeFileSync('src/App.tsx', code);
