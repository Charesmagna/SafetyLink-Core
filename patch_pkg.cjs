const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts['dev:all'] = 'concurrently "npm run dev" "cd standalone-backend && npm run dev"';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Patched package.json');
