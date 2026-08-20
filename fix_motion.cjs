const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadHub.tsx', 'utf8');
code = code.replace(/from 'framer-motion'/g, "from 'motion/react'");
fs.writeFileSync('src/components/DownloadHub.tsx', code);
