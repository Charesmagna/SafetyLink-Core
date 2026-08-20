const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

code = code.replace(
  /listener = await CapacitorApp\.addListener\('backButton', \(\) => \{[\s\S]*?\}\);/g,
  `try {
        listener = await CapacitorApp.addListener('backButton', () => {
          if (showIdApplication) {
            setShowIdApplication(false);
          } else {
            setShowExitConfirm(true);
          }
        });
      } catch (e) {
        console.log("Capacitor backButton listener not supported on this platform", e);
      }`
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
