const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Undo the confirm exit replacement
content = content.replace(
  "      } else {\n        if (window.confirm('Are you sure you want to exit SafetyLink?')) {\n          CapApp.exitApp();\n        }\n      } else {",
  "      } else {"
);

fs.writeFileSync('src/App.tsx', content);
