const fs = require('fs');
let content = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

content = content.replace(/--no-parallel/g, "--no-parallel --no-build-cache");
fs.writeFileSync('.github/workflows/build-apk.yml', content);
