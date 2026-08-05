const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/SafelinkForegroundService.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(NOTIF_ID_ONGOING, builder.build());`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID_ONGOING, builder.build(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE | android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION | android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIF_ID_ONGOING, builder.build());
        }`
);

fs.writeFileSync(file, code);
