const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const backButtonListener = CapApp.addListener(\'backButton\', ({ canGoBack }) => {',
  'const backButtonListener = CapApp.addListener(\'backButton\', ({ canGoBack: _canGoBack }) => {'
);

fs.writeFileSync('src/App.tsx', content);
