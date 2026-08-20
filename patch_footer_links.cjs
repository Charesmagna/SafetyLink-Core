const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The simplest way is to replace the href anchors with onClick navTo calls
code = code.replace(/href="#platform"/g, 'href="#" onClick={(e) => { e.preventDefault(); navTo("platform"); }}');
code = code.replace(/href="#klev"/g, 'href="#" onClick={(e) => { e.preventDefault(); navTo("klev"); }}');
code = code.replace(/href="#pricing"/g, 'href="#" onClick={(e) => { e.preventDefault(); navTo("pricing"); }}');
code = code.replace(/href="#download"/g, 'href="#" onClick={(e) => { e.preventDefault(); navTo("download"); }}');
code = code.replace(/href="#hardware"/g, 'href="#" onClick={(e) => { e.preventDefault(); navTo("hardware"); }}');

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log('Patched footer anchors');
