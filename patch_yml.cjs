const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

const patchStep = `
    - name: Patch Capacitor Plugins and Create Init Script
      run: |
        sed -i 's/classpath '\\''com.android.tools.build:gradle:8.13.0'\\''/classpath '\\''com.android.tools.build:gradle:8.2.1'\\''/g' android/capacitor-cordova-android-plugins/build.gradle || true
        sed -i '/android {/a \\    namespace "com.tchvu3.capacitorvoicerecorder"' node_modules/capacitor-voice-recorder/android/build.gradle || true
        cat << 'INNER_EOF' > init.gradle
        allprojects {
            buildscript {
                configurations.all {
                    resolutionStrategy {
                        force 'org.bouncycastle:bcprov-jdk15to18:1.78.1'
                        force 'org.bouncycastle:bcprov-jdk18on:1.78.1'
                    }
                }
            }
            configurations.all {
                resolutionStrategy {
                    force 'org.bouncycastle:bcprov-jdk15to18:1.78.1'
                    force 'org.bouncycastle:bcprov-jdk18on:1.78.1'
                }
            }
        }
        INNER_EOF
`;

code = code.replace(
    '    - name: Grant execute permission for gradlew',
    patchStep.trim() + '\n    - name: Grant execute permission for gradlew'
);

code = code.replace(
    './gradlew clean assembleDebug --no-daemon --no-parallel --no-build-cache',
    './gradlew clean assembleDebug --init-script ../init.gradle --no-daemon --no-parallel --no-build-cache'
);

code = code.replace(
    './gradlew assembleRelease --no-daemon --no-parallel --no-build-cache',
    './gradlew assembleRelease --init-script ../init.gradle --no-daemon --no-parallel --no-build-cache'
);

fs.writeFileSync('.github/workflows/build-apk.yml', code);
