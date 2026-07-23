const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importFg = "import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';\n";
if (!content.includes('ForegroundService')) {
  content = content.replace("import { LocalNotificationService }", importFg + "import { LocalNotificationService }");
}

const effectBlock = `
  // Manage actual Android Foreground Service
  useEffect(() => {
    const manageForegroundService = async () => {
      try {
        if (isBackgroundServiceRunning) {
          await ForegroundService.startForegroundService({
            id: 111,
            title: "SafetyLink Secure Node",
            body: "Monitoring triggers...",
            smallIcon: "ic_stat_icon_config_sample",
            buttons: []
          });
        } else {
          await ForegroundService.stopForegroundService();
        }
      } catch (err) {
        console.warn("ForegroundService plugin error:", err);
      }
    };
    manageForegroundService();
  }, [isBackgroundServiceRunning]);
`;

if (!content.includes('manageForegroundService')) {
  content = content.replace("  // Synchronize state with actual phone", effectBlock + "\n  // Synchronize state with actual phone");
}

fs.writeFileSync('src/App.tsx', content);
