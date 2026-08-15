const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafelinkForegroundService.java', 'utf8');

if (!code.includes('import android.Manifest;')) {
  code = code.replace(
    'import android.os.Build;',
    'import android.os.Build;\nimport android.Manifest;\nimport android.content.pm.PackageManager;\nimport androidx.core.content.ContextCompat;\nimport android.content.pm.ServiceInfo;'
  );
}

const originalStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID_ONGOING, builder.build(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE | android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION | android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIF_ID_ONGOING, builder.build());
        }`;

const newStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int type = 0;
            if (Build.VERSION.SDK_INT >= 34) { // UPSIDE_DOWN_CAKE
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                    type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE;
                }
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                    ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
                }
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
                }
                if (type == 0) {
                    type = 0x40000000; // FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                }
            } else {
                type = ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE | ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION | ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            }
            try {
                startForeground(NOTIF_ID_ONGOING, builder.build(), type);
            } catch (Exception e) {
                Log.e(TAG, "Foreground service type error: " + e.getMessage());
                startForeground(NOTIF_ID_ONGOING, builder.build());
            }
        } else {
            startForeground(NOTIF_ID_ONGOING, builder.build());
        }`;

code = code.replace(originalStartForeground, newStartForeground);
fs.writeFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafelinkForegroundService.java', code);
