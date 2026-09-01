import fs from 'fs';
const path = 'android/app/src/main/java/com/aistudio/safetylink/vqnztp/MainActivity.java';
let content = fs.readFileSync(path, 'utf8');

const importStr = `
import android.provider.Settings;
import android.text.TextUtils;
import android.content.Context;
import android.content.ComponentName;
`;

if (!content.includes('android.provider.Settings')) {
    content = content.replace('import android.view.WindowManager;', 'import android.view.WindowManager;\n' + importStr);
}

const methodStr = `
    private void checkPermissionsAndServices() {
        // Battery
        requestBatteryOptimizationBypass();
        
        // System Alert Window
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            android.net.Uri.parse("package:" + getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed overlay permission", e);
                }
            }
        }
        
        // Accessibility Service Check
        if (!isAccessibilityServiceEnabled(this, SafetyAccessibilityService.class)) {
            try {
                Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception e) {
                 Log.e(TAG, "Failed accessibility setting", e);
            }
        }
    }
    
    private boolean isAccessibilityServiceEnabled(Context context, Class<?> accessibilityService) {
        ComponentName expectedComponentName = new ComponentName(context, accessibilityService);
        String enabledServicesSetting = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabledServicesSetting == null) return false;
        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);
        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            ComponentName enabledService = ComponentName.unflattenFromString(componentNameString);
            if (enabledService != null && enabledService.equals(expectedComponentName)) return true;
        }
        return false;
    }
`;

if (!content.includes('checkPermissionsAndServices')) {
    content = content.replace('requestBatteryOptimizationBypass();', 'checkPermissionsAndServices();');
    content = content.replace('private void requestBatteryOptimizationBypass()', methodStr + '\n    private void requestBatteryOptimizationBypass()');
}

fs.writeFileSync(path, content);
