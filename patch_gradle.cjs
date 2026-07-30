const fs = require('fs');
const content = fs.readFileSync('android/app/build.gradle', 'utf8');

const updated = content.replace(
    /signingConfigs \{\s*release \{\s*storeFile file\('safetylink\.keystore'\)\s*storePassword 'safetylink2026'\s*keyAlias 'safetylink'\s*keyPassword 'safetylink2026'\s*storeType 'pkcs12'\s*\}\s*\}/,
    `signingConfigs {
        release {
            def keystoreFile = file('safetylink.keystore')
            if (keystoreFile.exists()) {
                storeFile keystoreFile
                storePassword 'safetylink2026'
                keyAlias 'safetylink'
                keyPassword 'safetylink2026'
                storeType 'pkcs12'
            }
        }
    }`
);

fs.writeFileSync('android/app/build.gradle', updated);
