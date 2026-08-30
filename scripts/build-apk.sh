#!/bin/bash
export JAVA_HOME=/app/applet/jdk-17.0.2
export PATH=$JAVA_HOME/bin:$PATH
set -e

# Sync Capacitor
npx cap sync android

# Generate Keystore if it doesn't exist
KEYSTORE_PATH="android/app/release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "Generating new release keystore..."
    keytool -genkey -v -keystore $KEYSTORE_PATH -alias safetylink -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=TM Media Solutions, OU=SafetyLink, O=TM Media, L=Johannesburg, S=Gauteng, C=ZA" -storepass "safetylink2026" -keypass "safetylink2026"
fi

# Build Signed APK using Gradle
echo "Building Release APK..."
cd android
./gradlew assembleRelease \
    -Pandroid.injected.signing.store.file=release.keystore \
    -Pandroid.injected.signing.store.password=safetylink2026 \
    -Pandroid.injected.signing.key.alias=safetylink \
    -Pandroid.injected.signing.key.password=safetylink2026

echo "Build complete. Signed APK located at: android/app/build/outputs/apk/release/app-release.apk"
cd ..
