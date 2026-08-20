const fs = require('fs');
const content = fs.readFileSync('/tmp/landing_backup.tsx', 'utf8');

// Find the start and end of CSS
const cssStart = content.indexOf('<style dangerouslySetInnerHTML={{ __html: `');
const cssEnd = content.indexOf('`}} />', cssStart) + 6;

const imports = content.substring(0, content.indexOf('export function LandingPage'));
const cssPart = content.substring(cssStart, cssEnd);
const jsxPart = content.substring(cssEnd, content.lastIndexOf('</div>'));

fs.writeFileSync('imports.txt', imports);
fs.writeFileSync('css.txt', cssPart);
fs.writeFileSync('jsx.txt', jsxPart);
console.log('Done splitting');
