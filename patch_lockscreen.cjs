const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/LockScreenNotificationService.kt', 'utf8');

const originalStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildBanner(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, buildBanner())
        }`;

const newStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(NOTIFICATION_ID, buildBanner(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } catch (e: Exception) {
                startForeground(NOTIFICATION_ID, buildBanner())
            }
        } else {
            startForeground(NOTIFICATION_ID, buildBanner())
        }`;

code = code.replace(originalStartForeground, newStartForeground);
fs.writeFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/LockScreenNotificationService.kt', code);
