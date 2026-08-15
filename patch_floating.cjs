const fs = require('fs');
let code = fs.readFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/FloatingWidgetService.java', 'utf8');

const originalStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(9922, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(9922, notification);
        }`;

const newStartForeground = `        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(9922, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } catch (Exception e) {
                startForeground(9922, notification);
            }
        } else {
            startForeground(9922, notification);
        }`;

code = code.replace(originalStartForeground, newStartForeground);
fs.writeFileSync('android/app/src/main/java/com/aistudio/safetylink/vqnztp/FloatingWidgetService.java', code);
