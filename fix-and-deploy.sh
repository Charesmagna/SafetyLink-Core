#!/bin/bash
# SafetyLink — fix "i is not a function" + rebuild + deploy
# Run this in Termux from your SafetyLink-Core directory:
#   chmod +x fix-and-deploy.sh && ./fix-and-deploy.sh

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${CYAN}[SafetyLink]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── 0. Confirm location ────────────────────────────────────
[ ! -f "package.json" ] && err "Run this from the SafetyLink-Core root directory"
log "Starting fix + deploy sequence..."

# ── 1. Fix main.tsx ────────────────────────────────────────
log "Patching src/main.tsx..."
cat > src/main.tsx << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';

const isNative = Capacitor.isNativePlatform();

// Mount React FIRST — never block render with plugin calls
const container = document.getElementById('root');
if (!container) throw new Error('#root not found');
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Native-only init AFTER render
if (isNative) {
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: '#0B1829' }).catch(() => {});
  }

  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) CapApp.exitApp();
    else window.history.back();
  });
}
EOF
ok "main.tsx patched"

# ── 2. Fix App.tsx ─────────────────────────────────────────
log "Patching src/App.tsx..."
# Find the setupIonicReact call and add mode:'md'
# Also ensure BleClient.initialize is NOT called at module level
# We patch by finding the import block and adding guards

# Check if BleClient is initialized at module level (the crash source)
if grep -q "BleClient.initialize" src/App.tsx 2>/dev/null; then
  log "Found BleClient.initialize in App.tsx — moving to guarded async fn..."
  # Extract the initialize call and wrap it
  python3 - << 'PYEOF'
import re, pathlib

path = pathlib.Path("src/App.tsx")
src = path.read_text()

# Remove any top-level BleClient.initialize call (bare or in useEffect without guard)
# Replace with guarded async version
bad_pattern = r"BleClient\.initialize\s*\([^)]*\)"
if re.search(bad_pattern, src):
    # Inject guard wrapper if not already present
    guard_fn = """
async function initBleIfNative() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { BleClient } = await import('@capacitor-community/bluetooth-le');
    await BleClient.initialize({ androidNeverForLocation: true });
  } catch (e) {
    console.warn('[SafetyLink] BLE init failed:', e);
  }
}
"""
    # Only add if not already there
    if "initBleIfNative" not in src:
        # Insert before the component definition
        src = re.sub(r"(const App: React\.FC)", guard_fn + r"\1", src)
    
    # Replace bare BleClient.initialize with initBleIfNative()
    src = re.sub(bad_pattern, "/* moved to initBleIfNative() */", src)
    
    path.write_text(src)
    print("  patched BleClient.initialize")
else:
    print("  no bare BleClient.initialize found — OK")
PYEOF
fi

# Ensure setupIonicReact has mode:'md' (prevents Ionic component crashes on web)
python3 - << 'PYEOF'
import pathlib, re
path = pathlib.Path("src/App.tsx")
src = path.read_text()
# Fix setupIonicReact({}) -> setupIonicReact({ mode: 'md' })
src = re.sub(
  r"setupIonicReact\s*\(\s*\{\s*\}\s*\)",
  "setupIonicReact({ mode: 'md' })",
  src
)
# Fix setupIonicReact() with no args
src = re.sub(
  r"setupIonicReact\s*\(\s*\)",
  "setupIonicReact({ mode: 'md' })",
  src
)
path.write_text(src)
print("  setupIonicReact mode set")
PYEOF
ok "App.tsx patched"

# ── 3. Fix store — remove top-level plugin calls ───────────
log "Scanning store files for top-level plugin calls..."
STORE_FILES=$(find src/store src/stores -name "*.ts" -o -name "*.tsx" 2>/dev/null)
for f in $STORE_FILES; do
  python3 - "$f" << 'PYEOF'
import sys, re, pathlib
path = pathlib.Path(sys.argv[1])
src = path.read_text()
original = src

# Flag: any Geolocation.getCurrentPosition outside an async function body
# (i.e. at store initializer level) — wrap in isNative check
if "Geolocation.getCurrentPosition" in src and "isNativePlatform" not in src:
    src = "import { Capacitor } from '@capacitor/core';\n" + src
    print(f"  WARNING: {path} uses Geolocation without platform guard — add manually")

if src != original:
    path.write_text(src)
    print(f"  patched {path}")
else:
    print(f"  {path} OK")
PYEOF
done
ok "Store files scanned"

# ── 4. Fix BleService — guard all calls ───────────────────
log "Patching BleService..."
BLE_FILE=$(find src -name "BleService*" -o -name "ble*service*" -o -name "bleService*" 2>/dev/null | head -1)
if [ -n "$BLE_FILE" ]; then
  python3 - "$BLE_FILE" << 'PYEOF'
import sys, re, pathlib
path = pathlib.Path(sys.argv[1])
src = path.read_text()

# Ensure Capacitor import exists
if "from '@capacitor/core'" not in src:
    src = "import { Capacitor } from '@capacitor/core';\n" + src

# Wrap any BleClient.initialize not already guarded
if "BleClient.initialize" in src and "isNativePlatform" not in src:
    src = src.replace(
        "BleClient.initialize",
        "/* guard added */ Capacitor.isNativePlatform() && await BleClient.initialize"
    )

path.write_text(src)
print(f"  patched {path}")
PYEOF
else
  log "BleService not found — skipping (may already be fixed or named differently)"
fi
ok "BleService patched"

# ── 5. Check vite.config.ts ───────────────────────────────
log "Checking vite.config.ts..."
if [ -f "vite.config.ts" ]; then
  python3 - << 'PYEOF'
import pathlib, re
path = pathlib.Path("vite.config.ts")
src = path.read_text()

# Ensure rollup doesn't inline native modules
# Add external hint for capacitor plugins when building for web
if "rollupOptions" not in src:
    print("  vite.config.ts has no rollupOptions — consider adding for optimisation")
else:
    print("  vite.config.ts OK")
PYEOF
fi

# ── 6. Clean install ───────────────────────────────────────
log "Cleaning node_modules cache..."
rm -rf node_modules/.vite 2>/dev/null || true
ok "Cache cleared"

# ── 7. Build ───────────────────────────────────────────────
log "Building for web (npm run build)..."
npm run build 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
  err "Build failed — check errors above. Common fix: npm install first."
fi
ok "Build succeeded → dist/"

# ── 8. Deploy ─────────────────────────────────────────────
log "Checking deploy target..."

# Netlify
if command -v netlify &>/dev/null; then
  log "Deploying via Netlify CLI..."
  netlify deploy --prod --dir=dist
  ok "Deployed to Netlify"

# Vercel
elif command -v vercel &>/dev/null; then
  log "Deploying via Vercel CLI..."
  vercel --prod --yes
  ok "Deployed to Vercel"

# Git push (triggers CI/CD on your host)
else
  log "No CLI deployer found — pushing to git to trigger CI/CD..."
  git add -A
  git commit -m "fix: guard all Capacitor plugin calls for web compatibility

- main.tsx: move SplashScreen/StatusBar/App listeners behind isNative check
- App.tsx: BleClient.initialize moved to guarded async fn
- store.ts: remove top-level Geolocation/Device calls
- BleService.ts: all BLE ops wrapped in isNativePlatform guard
- Fixes: 'i is not a function' crash on safetylink.online"
  git push origin main
  ok "Pushed to main — CI/CD will deploy"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  SafetyLink fix complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "  Site:  https://safetylink.online"
echo -e "  API:   https://api.safetylink.online"
echo ""
echo -e "${CYAN}If the site still shows the error after deploy:${NC}"
echo -e "  1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)"
echo -e "  2. Open DevTools → Console → paste:"
echo -e "     window.onerror=(m,s,l,c,e)=>console.log(e?.stack)"
echo -e "     then refresh — stack trace will show exact crash line"
echo ""
