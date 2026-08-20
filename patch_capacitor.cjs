const fs = require('fs');

// Patch App.tsx to ensure showLanding correctly branches Web to Landing and Native to Auth/Dashboard
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "const [showLanding, setShowLanding] = useState(Capacitor.getPlatform() === 'web');",
  "// If we're on the web platform, we always want to show the landing page initially. Otherwise, skip straight to app logic.\n  const [showLanding, setShowLanding] = useState(Capacitor.getPlatform() === 'web' && window.location.pathname === '/');"
);
fs.writeFileSync('src/App.tsx', appCode);

console.log("App.tsx patched for web branching");
