const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/PanicService.java', 'utf8');

if (!code.includes('import android.Manifest;')) {
  code = code.replace(
    'import android.os.Build;',
    'import android.os.Build;\nimport android.Manifest;\nimport android.content.pm.PackageManager;\nimport androidx.core.content.ContextCompat;\nimport android.content.pm.ServiceInfo;'
  );
}

const originalStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
        } else {
            startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));
        }`;

const newStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int type = 0;
            if (Build.VERSION.SDK_INT >= 34) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                    type = ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                } else {
                    type = 0x40000000; // FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                }
            } else {
                type = ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
            }
            try {
                startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"), type);
            } catch (Exception e) {
                Log.e(TAG, "Foreground service type error: " + e.getMessage());
                startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));
            }
        } else {
            startForeground(NOTIFICATION_ID, buildForegroundNotification("SafetyLink Ghost Engine", "Listening in background for SOS signals"));
        }`;

code = code.replace(originalStartForeground, newStartForeground);
fs.writeFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/PanicService.java', code);
