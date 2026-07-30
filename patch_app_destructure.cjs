const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    setFloatingWidgetDeployed,
    demoMode
  } = useAppStore();`;

const replacement = `    setFloatingWidgetDeployed,
    demoMode,
    localOfflineQueue,
    syncOfflineQueue
  } = useAppStore();`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log("App.tsx destructuring patched successfully");
} else {
  console.log("Target not found in App.tsx destructuring");
}
