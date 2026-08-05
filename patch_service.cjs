const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafetyBackgroundService.kt';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(NOTIFICATION_ID, notification)`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE or android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }`
);

fs.writeFileSync(file, code);
