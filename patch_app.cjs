const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update LandingPage onLogin to trigger splash screen
code = code.replace(
  /<LandingPage onLogin=\{\(\) => setShowLanding\(false\)\} \/>/,
  `<LandingPage onLogin={() => {
          setShowLanding(false);
          setShowSplash(true);
          setTimeout(() => setShowSplash(false), 7000);
        }} />`
);

// Update AuthScreen to receive onBackToSite
code = code.replace(
  /return <AuthScreen \/>;/,
  `return <AuthScreen onBackToSite={Capacitor.getPlatform() === 'web' ? () => setShowLanding(true) : undefined} />;`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
