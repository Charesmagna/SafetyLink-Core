const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const backButtonListener = CapacitorApp\.addListener\('backButton', \(\) => \{([\s\S]*?)\}\);/g;
code = code.replace(regex, (match, p1) => {
  return `let backButtonListener: any = null;
    try {
      backButtonListener = CapacitorApp.addListener('backButton', () => {${p1}});
    } catch (e) {
      console.warn("backButton not supported", e);
    }`;
});

fs.writeFileSync('src/App.tsx', code);
