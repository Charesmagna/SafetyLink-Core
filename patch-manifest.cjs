const fs = require('fs');
let xml = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

const permissions = `
    <!-- Networking -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Location (High Accuracy & Background) -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    
    <!-- Bluetooth / BLE (Android 12+) -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    
    <!-- Background Services & Battery -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
</manifest>
`;

xml = xml.replace('    <uses-permission android:name="android.permission.INTERNET" />\n</manifest>', permissions.trim());

const service = `
        <service 
            android:name=".SafetyBackgroundService" 
            android:enabled="true" 
            android:exported="false"
            android:foregroundServiceType="location" />
    </application>
`;

xml = xml.replace('    </application>', service);

fs.writeFileSync('android/app/src/main/AndroidManifest.xml', xml);
