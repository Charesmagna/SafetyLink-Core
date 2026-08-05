const fs = require('fs');
const file = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/FloatingWidgetService.java';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        startForeground(9922, notification);`,
`        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(9922, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(9922, notification);
        }`
);

fs.writeFileSync(file, code);
