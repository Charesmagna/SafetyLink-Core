const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const backButtonListener = CapApp.addListener(\'backButton\', ({ canGoBack: _canGoBack }) => {',
  'const backButtonListener = CapApp.addListener(\'backButton\', ({ canGoBack }) => {'
);
content = content.replace(
  "      } else {\n        if (true) {\n          setShowExitConfirm(true);\n        }\n        if (window.confirm('Are you sure you want to exit SafetyLink?')) {\n          CapApp.exitApp();\n        }\n      }",
  "      } else {\n        if (!canGoBack) {\n          setShowExitConfirm(true);\n        } else {\n           window.history.back();\n        }\n      }"
);

fs.writeFileSync('src/App.tsx', content);
