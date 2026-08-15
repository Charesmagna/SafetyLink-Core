const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
if (!code.includes('import { SplashScreen } from "@capacitor/splash-screen";')) {
  code = code.replace(
    'import { Capacitor } from \'@capacitor/core\';',
    'import { Capacitor } from \'@capacitor/core\';\nimport { SplashScreen } from "@capacitor/splash-screen";'
  );
  
  const target = 'useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 7000); return () => clearTimeout(timer); }, []);';
  const replacement = `useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 7000);
    // Hide native splash screen once React has mounted and our custom cinematic splash is ready
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(console.warn);
    }
    return () => clearTimeout(timer);
  }, []);`;
  
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
}
