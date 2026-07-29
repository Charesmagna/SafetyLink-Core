const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace petal with safetylink_startup
content = content.replace('/media/petal_20260720_023729.mp4', '/media/safetylink_startup.mp4');

// Add confirm exit
content = content.replace(
  "      } else if (activeTab !== 'home') {\n        setActiveTab('home');\n      }",
  "      } else if (activeTab !== 'home') {\n        setActiveTab('home');\n      } else {\n        if (window.confirm('Are you sure you want to exit SafetyLink?')) {\n          CapApp.exitApp();\n        }\n      }"
);

fs.writeFileSync('src/App.tsx', content);
