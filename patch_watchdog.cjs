const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/services/WatchdogService.kt';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(NOTIFICATION_ID, createNotification())`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, createNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, createNotification())
        }`
);

fs.writeFileSync(file, code);
