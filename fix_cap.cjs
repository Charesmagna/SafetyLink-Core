const fs = require('fs');
let content = fs.readFileSync('capacitor.config.ts', 'utf8');

content = content.replace(
  '  plugins: {\n    LocalNotifications: {',
  '  plugins: {\n    SplashScreen: {\n      launchShowDuration: 3000,\n      launchAutoHide: true,\n      backgroundColor: "#020617",\n      androidSplashResourceName: "splash",\n      androidScaleType: "CENTER_CROP",\n      showSpinner: true,\n      androidSpinnerStyle: "large",\n      spinnerColor: "#999999",\n      splashFullScreen: true,\n      splashImmersive: true,\n    },\n    LocalNotifications: {'
);

fs.writeFileSync('capacitor.config.ts', content);
