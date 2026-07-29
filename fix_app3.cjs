const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "      } else {\n        if (!canGoBack) {\n          setShowExitConfirm(true);\n        }\n      }",
  "      } else {\n        if (!canGoBack) {\n          setShowExitConfirm(true);\n        }\n        if (window.confirm('Are you sure you want to exit SafetyLink?')) {\n          CapApp.exitApp();\n        }\n      }"
);

fs.writeFileSync('src/App.tsx', content);
