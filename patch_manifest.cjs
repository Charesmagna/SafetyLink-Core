const fs = require('fs');
const file = 'android/app/src/main/AndroidManifest.xml';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        <service android:name=".SafetyBackgroundService" android:enabled="true" android:exported="false" android:foregroundServiceType="connectedDevice" />`,
`        <service android:name=".SafetyBackgroundService" android:enabled="true" android:exported="false" android:foregroundServiceType="connectedDevice|location" />`
);

fs.writeFileSync(file, code);
