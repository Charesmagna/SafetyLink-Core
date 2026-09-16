import fs from 'fs';
let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');
content = content.replace('<div className="landing-wrap">', '<div className="landing-wrap overflow-y-auto h-full">');
fs.writeFileSync('src/components/landing/Home.tsx', content);
