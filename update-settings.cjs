const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const toRemove = [
  'downloadedLanguages,',
  'setLanguage,',
  'downloadLanguage,',
  'isBackgroundServiceRunning,',
  'toggleBackgroundService,',
  'backgroundServiceTick,',
  'bleDevices,',
  'userLocation,',
  'isFloatingWidgetDeployed,',
  'setFloatingWidgetDeployed,',
  'floatingWidgetSize,',
  'setFloatingWidgetSize,',
  'customBackendUrl,',
  'setCustomBackendUrl,',
  'onlySystemSms,',
  'setOnlySystemSms,',
  'sosSoundSetup,',
  'setSosSoundSetup,'
];

toRemove.forEach(r => {
  code = code.replace(new RegExp(`^\\s*${r}\\s*\\n`, 'm'), '');
});

fs.writeFileSync('src/components/Settings.tsx', code);
