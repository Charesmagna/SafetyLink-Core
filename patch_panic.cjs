const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/PanicService.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
        } else {
            startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));
        }`
);

fs.writeFileSync(file, code);
