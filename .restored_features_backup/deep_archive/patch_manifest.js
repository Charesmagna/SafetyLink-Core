import fs from 'fs';
const path = 'android/app/src/main/AndroidManifest.xml';
let content = fs.readFileSync(path, 'utf8');

const serviceXml = `
        <service android:name=".SafetyAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
`;

if (!content.includes('SafetyAccessibilityService')) {
    content = content.replace('</application>', serviceXml + '</application>');
}

fs.writeFileSync(path, content);

// Add string resource
const stringsPath = 'android/app/src/main/res/values/strings.xml';
let stringsContent = fs.readFileSync(stringsPath, 'utf8');
if (!stringsContent.includes('accessibility_service_description')) {
    stringsContent = stringsContent.replace('</resources>', '    <string name="accessibility_service_description">SafetyLink Accessibility Service keeps the SOS panic system active and intercepts hardware inputs even when the phone is asleep or locked.</string>\n</resources>');
    fs.writeFileSync(stringsPath, stringsContent);
}
