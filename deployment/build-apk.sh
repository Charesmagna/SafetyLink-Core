#!/usr/bin/env bash
# SAFETY-LINK Android APK Build Script
# Requires: Node.js 20+, JDK 21+, Android SDK, Cordova CLI
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "==> Building SAFETY-LINK Android APK"

cd "$ROOT"

if ! command -v cordova &>/dev/null; then
  echo "Installing Cordova CLI..."
  npm install -g cordova
fi

echo "==> Installing npm dependencies"
npm install

echo "==> Adding Android platform"
cordova platform add android --save || echo "Platform already added"

echo "==> Adding plugins"
cordova plugin add cordova-plugin-bluetoothle        --save || true
cordova plugin add cordova-plugin-geolocation        --save || true
cordova plugin add cordova-plugin-device             --save || true
cordova plugin add cordova-plugin-network-information --save || true
cordova plugin add cordova-plugin-background-mode    --save || true
cordova plugin add cordova-plugin-vibration          --save || true
cordova plugin add cordova-plugin-whitelist          --save || true
cordova plugin add cordova-plugin-android-permissions --save || true
cordova plugin add cordova-plugin-sms               --save || true
cordova plugin add mx.ferreyra.callnumber            --save || true

echo "==> Building debug APK"
cordova build android

echo ""
echo "==> APK location:"
find "$ROOT/platforms/android" -name "*.apk" 2>/dev/null || echo "Check platforms/android/app/build/outputs/apk/"
echo ""
echo "Done."
