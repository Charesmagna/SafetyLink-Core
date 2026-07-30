const fs = require('fs');
let content = fs.readFileSync('android/app/build.gradle', 'utf8');

// Restore signingConfigs.release
content = content.replace(
    /def keystoreFile = file\('safetylink\.keystore'\)\s*if \(keystoreFile\.exists\(\)\) \{\s*storeFile keystoreFile\s*storePassword 'safetylink2026'\s*keyAlias 'safetylink'\s*keyPassword 'safetylink2026'\s*storeType 'pkcs12'\s*\}/,
    `storeFile file('safetylink.keystore')
            storePassword 'safetylink2026'
            keyAlias 'safetylink'
            keyPassword 'safetylink2026'
            storeType 'pkcs12'`
);

// Apply buildTypes.release change
content = content.replace(
    /signingConfig signingConfigs\.release/,
    `def keystoreFile = file('safetylink.keystore')
            if (keystoreFile.exists()) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }`
);

fs.writeFileSync('android/app/build.gradle', content);
