const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/LockScreenNotificationService.kt';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(NOTIFICATION_ID, buildBanner())`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildBanner(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, buildBanner())
        }`
);

fs.writeFileSync(file, code);
