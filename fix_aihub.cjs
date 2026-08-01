const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/AIHub.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/NodeJS\.Timeout/g, "number");

fs.writeFileSync(file, content);
