#!/usr/bin/env bash
# Sync www/ assets into Cordova platforms directory and prepare for build.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Preparing Cordova www assets"
cordova prepare android

echo "==> www assets synced to platforms/android"
echo "    Run: cordova build android"
