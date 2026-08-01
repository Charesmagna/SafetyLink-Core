const fs = require('fs');
let code = fs.readFileSync('android/app/build.gradle', 'utf8');

const regex = /signingConfigs\s*\{\s*release\s*\{[^}]*\}\s*\}/;

if (!code.includes('if (keystoreFile.exists()) {')) {
  code = code.replace(regex, `signingConfigs {
        release {
            def keystoreFile = file("safetylink.keystore")
            if (keystoreFile.exists()) {
                storeFile keystoreFile
                storePassword "safetylink2026"
                keyAlias "safetylink-alias"
                keyPassword "safetylink2026"
            }
        }
    }`);
}

fs.writeFileSync('android/app/build.gradle', code);
