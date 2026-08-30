const fs = require('fs');
let manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

const permissions = `
    <!-- DNS VPN Permissions -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
`;

manifest = manifest.replace('</manifest>', permissions + '</manifest>');

const appTags = `
        <service
            android:name=".DnsVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="DNS filtering via local VPN" />
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>
        <activity
            android:name=".DnsVpnActivity"
            android:exported="false" />
    </application>`;

manifest = manifest.replace('</application>', appTags);

fs.writeFileSync('android/app/src/main/AndroidManifest.xml', manifest, 'utf8');
console.log("Patched AndroidManifest.xml");
