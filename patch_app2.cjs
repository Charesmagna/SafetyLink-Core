const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const \[showLanding, setShowLanding\] = useState\(Capacitor\.getPlatform\(\) === 'web' && window\.location\.pathname === '\/'\);/,
  `// Check if running in a desktop EXE (Electron) environment
  const isDesktopExe = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0;
  // Only show landing page initially on actual web browsers
  const [showLanding, setShowLanding] = useState(Capacitor.getPlatform() === 'web' && !isDesktopExe && window.location.pathname === '/');`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for Electron");
