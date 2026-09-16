# Performance Fixes Integration & Build Pipeline

This document outlines the complete integration of all 9 performance fixes and the automated build pipeline for APK, EXE, and website releases.

## Phase 1: Core Integration (Week 1)

### Step 1.1: Update src/utils/store.ts with Performance Fixes

Replace the entire `getStoredJSON` and `setStoredJSON` functions and update `initMeshSync`:

```typescript
// Add at top of file
const storageCacheMap = new Map<string, any>();

const getStoredJSON = <T>(key: string, fallback: T): T => {
  if (storageCacheMap.has(key)) {
    return storageCacheMap.get(key);
  }
  try {
    const item = localStorage.getItem(key);
    const result = item ? JSON.parse(item) : fallback;
    storageCacheMap.set(key, result);
    return result;
  } catch {
    return fallback;
  }
};

const setStoredJSON = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    storageCacheMap.set(key, data);
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

// In useAppStore create function, replace initMeshSync:
let meshSyncUnsubscribe: (() => void) | null = null;

initMeshSync: () => {
  if (meshSyncUnsubscribe) {
    meshSyncUnsubscribe();
    meshSyncUnsubscribe = null;
  }

  const state = get();
  if (state.firestoreSync && state.currentUser) {
    const q = query(
      collection(db, 'users'),
      where('orgCode', '==', state.currentUser.orgCode || '')
    );
    
    meshSyncUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nodes: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.id !== state.currentUser?.id && data.lat && data.lng) {
            nodes.push({
              id: data.id,
              name: data.username || 'Responder',
              lat: data.lat,
              lng: data.lng,
              status: data.activeSOS ? 'ACTIVE' : 'SECURE',
              type: 'RESPONDER',
              battery: data.battery || 100,
            });
          }
        });

        const currentState = get();
        const localNodes = currentState.meshNodes.filter(n => n.type !== 'RESPONDER');
        const newMeshNodes = [...localNodes, ...nodes];
        
        if (JSON.stringify(newMeshNodes) !== JSON.stringify(currentState.meshNodes)) {
          set({ meshNodes: newMeshNodes });
        }
      },
      (error) => {
        console.warn('Mesh sync listener error:', error);
        if (meshSyncUnsubscribe) {
          meshSyncUnsubscribe();
          meshSyncUnsubscribe = null;
        }
      }
    );
  }

  return () => {
    if (meshSyncUnsubscribe) {
      meshSyncUnsubscribe();
      meshSyncUnsubscribe = null;
    }
  };
},

// Update logout function:
logout: () => {
  if (meshSyncUnsubscribe) {
    meshSyncUnsubscribe();
    meshSyncUnsubscribe = null;
  }
  storageCacheMap.clear(); // Clear cache on logout
  set({ currentUser: null, currentOrg: null, superAdminActive: false, token: null });
  setStoredJSON('sl_current_user', null);
  setStoredJSON('sl_current_org', null);
  setStoredJSON('sl_super_admin', false);
  setStoredJSON('sl_jwt_token', null);
  get().addAuditLog('SECURITY', 'INFO', 'User/Session Terminated', 'Current session cleared.');
},
```

### Step 1.2: Integrate Network Request Utilities

Replace all fetch calls in TwilioService.ts and other services:

```typescript
// src/services/TwilioService.ts
import { fetchWithTimeout } from '../utils/fetchUtils';

export const TwilioService = {
  sendSms: async (...): Promise<boolean> => {
    try {
      const r = await fetchWithTimeout(`${getProxyBase()}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: toNumber, message }),
        timeout: 15000, // 15 seconds for SMS
      });
      return r.ok;
    } catch (e) {
      console.error('[TwilioService] SMS proxy error:', e);
      return false;
    }
  },
};
```

### Step 1.3: Integrate Geolocation Service

In src/App.tsx, replace geolocation initialization:

```typescript
import GeolocationCacheService from '../services/GeolocationCacheService';

useEffect(() => {
  // Instead of calling navigator.geolocation directly
  const unsubscribe = GeolocationCacheService.subscribe((loc) => {
    // Location automatically updated in store
  });

  return () => {
    unsubscribe();
    GeolocationCacheService.destroy();
  };
}, []);
```

### Step 1.4: Integrate BLE Service Improvements

```typescript
// src/utils/store.ts - update BLE-related methods
import BleServiceImproved from '../services/BleServiceImproved';

startBleScan: () => {
  if (get().isScanning) return;
  set({ isScanning: true, pairingProgress: 'Requesting Bluetooth permission...', discoveredDevices: [] });
  
  BleServiceImproved.scanForNearbyDevices(
    (found) => {
      set(state => {
        if (state.discoveredDevices.some(d => d.deviceId === found.deviceId)) return state;
        return { discoveredDevices: [...state.discoveredDevices, found].sort((a, b) => b.rssi - a.rssi) };
      });
    },
    15000
  ).catch((err) => {
    set({ isScanning: false, pairingProgress: null });
    get().addAuditLog('BLE', 'SEVERE', 'BLE Scan Failed', err.message);
  });

  setTimeout(() => {
    BleServiceImproved.stopScan();
    set({ isScanning: false, pairingProgress: null });
  }, 15500);
},

stopBleScan: () => {
  BleServiceImproved.stopScan();
  set({ isScanning: false, pairingProgress: null });
},
```

### Step 1.5: Integrate Carousel Visibility

In src/App.tsx:

```typescript
import { CarouselWithVisibility } from '../components/CarouselWithVisibility';

// Replace the manual carousel useEffect with:
const backgroundSlides = [newBg1, newLogo1, klevaLogo, polishLogo, slLogoMain, slLogoSet, slide3, slide1, slide2];

return (
  <CarouselWithVisibility 
    slides={backgroundSlides} 
    interval={4500} 
  />
);
```

### Step 1.6: Integrate Crypto Web Worker

In src/utils/store.ts, update vault password handling:

```typescript
import { derivePasswordVerifierAsync, terminateCryptoWorker } from '../utils/cryptoAsync';

setVaultPassword: async (password, question, answer) => {
  try {
    const hash = await derivePasswordVerifierAsync(password); // Non-blocking!
    set({ vaultPassword: hash, vaultSecurityQuestion: question, vaultSecurityAnswer: answer });
    setStoredJSON('sl_vault_password_hash', hash);
    setStoredJSON('sl_vault_security_question', question);
    setStoredJSON('sl_vault_security_answer', answer);
    get().addAuditLog('SECURITY', 'INFO', 'Confidential Vault Password set/updated', 'PBKDF2 verifier stored; raw password never persisted.');
  } catch (error) {
    console.error('Failed to derive password verifier:', error);
    get().addToast('Failed to set vault password', 'error');
  }
},

logout: () => {
  // ... existing logout code ...
  terminateCryptoWorker(); // Clean up worker
},
```

### Step 1.7: Integrate Satellite Telemetry Hook

In src/components/OfflineMap.tsx:

```typescript
import { useSatelliteTelemetry } from '../hooks/useSatelliteTelemetry';

export function OfflineMap() {
  const { satelliteData, isLoadingSat, satError } = useSatelliteTelemetry();
  
  // Rest of component remains the same, using satelliteData state
  // No need for manual polling management anymore
}
```

---

## Phase 2: Build Pipeline Setup (Week 2)

### Step 2.1: Create GitHub Actions Workflow for Releases

Create `.github/workflows/release-build.yml`:

```yaml
name: Build & Release APK, EXE, and Website

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., 1.2.3)'
        required: true

permissions:
  contents: read
  packages: write

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      - id: version
        run: |
          if [[ "${{ github.ref }}" == refs/tags/* ]]; then
            VERSION=${GITHUB_REF#refs/tags/v}
          else
            VERSION=${{ github.event.inputs.version }}
          fi
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "Release Version: $VERSION"

  android-build:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install dependencies
        run: npm ci

      - name: Build web assets
        run: npm run build

      - name: Setup Gradle
        uses: gradle/gradle-build-action@v2

      - name: Decode keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
        run: |
          echo "$KEYSTORE_BASE64" | base64 -d > android/app/safetylink.keystore

      - name: Build signed APK
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew assembleRelease \
            -Dorg.gradle.jvmargs="-Xmx2048m" \
            -PKEYSTORE_FILE=app/safetylink.keystore \
            -PKEYSTORE_PASSWORD=$KEYSTORE_PASSWORD \
            -PKEY_ALIAS=$KEY_ALIAS \
            -PKEY_PASSWORD=$KEY_PASSWORD

      - name: Upload APK to Releases
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: android/app/build/outputs/apk/release/app-release.apk
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload APK to Artifact
        uses: actions/upload-artifact@v3
        with:
          name: safetylink-${{ needs.setup.outputs.version }}.apk
          path: android/app/build/outputs/apk/release/app-release.apk

  windows-build:
    needs: setup
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build web assets
        run: npm run build

      - name: Build Electron app
        run: npm run electron:build

      - name: Code sign EXE
        env:
          SIGN_CERTIFICATE: ${{ secrets.SIGN_CERTIFICATE }}
          SIGN_PASSWORD: ${{ secrets.SIGN_PASSWORD }}
        run: |
          # Import certificate
          [System.IO.File]::WriteAllBytes('cert.pfx', [System.Convert]::FromBase64String('$env:SIGN_CERTIFICATE'))
          
          # Sign executable
          & "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign `
            /f cert.pfx `
            /p "$env:SIGN_PASSWORD" `
            /t "http://timestamp.digicert.com" `
            "dist_electron\SafetyLink-Setup.exe"

      - name: Upload EXE to Releases
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: dist_electron/SafetyLink-Setup.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload EXE to Artifact
        uses: actions/upload-artifact@v3
        with:
          name: safetylink-${{ needs.setup.outputs.version }}.exe
          path: dist_electron/SafetyLink-Setup.exe

  web-deploy:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build website
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: |
          npm install -g vercel
          vercel pull --yes --environment=production
          vercel build --prod
          vercel deploy --prod --token=$VERCEL_TOKEN

  create-release:
    needs: [setup, android-build, windows-build, web-deploy]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v4

      - name: Generate Release Notes
        id: release_notes
        run: |
          VERSION=${{ needs.setup.outputs.version }}
          echo "CHANGELOG=## SafetyLink $VERSION Release Notes

          ### Performance Improvements
          - ✅ Fixed Firestore listener memory leak
          - ✅ Optimized localStorage caching
          - ✅ Added satellite API backoff
          - ✅ Improved carousel visibility detection
          - ✅ Moved crypto operations to Web Worker
          - ✅ Centralized geolocation service
          - ✅ Added request timeout management
          - ✅ Enhanced BLE scan cleanup

          ### Download
          - 📱 [APK for Android](https://github.com/Charesmagna/SafetyLink-Core/releases/download/v$VERSION/safetylink-$VERSION.apk)
          - 💻 [EXE for Windows](https://github.com/Charesmagna/SafetyLink-Core/releases/download/v$VERSION/safetylink-$VERSION.exe)
          - 🌐 [Website](https://safetylink.online)" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.release_notes.outputs.CHANGELOG }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  notify:
    needs: [setup, create-release]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Success
        if: success()
        run: |
          echo "✅ SafetyLink v${{ needs.setup.outputs.version }} released successfully!"
          echo "APK | EXE | Website all deployed"

      - name: Notify Failure
        if: failure()
        run: echo "❌ Build failed for version ${{ needs.setup.outputs.version }}"
```

### Step 2.2: Create Android Build Configuration

Create `android/app/build.gradle.kts`:

```gradle
android {
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.safetylink.app"
        minSdk = 24
        targetSdk = 34
        versionCode = System.getenv("BUILD_NUMBER")?.toInt() ?: 1
        versionName = System.getenv("VERSION") ?: "1.0.0"
    }

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_FILE") ?: "safetylink.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

### Step 2.3: Create Windows Electron Configuration

Create `electron/forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    asar: true,
    name: 'SafetyLink',
    icon: './assets/icon',
    win32metadata: {
      CompanyName: 'TM Media Solutions',
      FileDescription: 'SafetyLink - Intelligent Emergency System',
      ProductName: 'SafetyLink',
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        certificateFile: process.env.SIGN_CERTIFICATE_PATH,
        certificatePassword: process.env.SIGN_PASSWORD,
        signWithParams: '/tr http://timestamp.digicert.com /td sha256',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'Charesmagna',
          name: 'SafetyLink-Core',
        },
        prerelease: false,
      },
    },
  ],
};
```

---

## Phase 3: Update Management System

### Step 3.1: Implement In-App Update Checker

The existing `src/components/UpdateBanner.tsx` is already configured, but enhance it:

```typescript
// Add to src/services/UpdateService.ts
export interface UpdateInfo {
  available: boolean;
  version: string;
  apkUrl: string;
  exeUrl: string;
  releaseNotes: string;
  releaseDate: string;
  isForce: boolean; // Force update if critical security fix
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  try {
    const res = await fetchWithTimeout(
      'https://api.github.com/repos/Charesmagna/SafetyLink-Core/releases/latest',
      { timeout: 10000 }
    );
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const release = await res.json();
    const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    return {
      available: isNewer(release.tag_name, currentVersion),
      version: release.tag_name,
      apkUrl: release.assets?.find(a => a.name.endsWith('.apk'))?.browser_download_url || '',
      exeUrl: release.assets?.find(a => a.name.endsWith('.exe'))?.browser_download_url || '',
      releaseNotes: release.body,
      releaseDate: release.published_at,
      isForce: release.prerelease === false && release.draft === false,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { available: false, version: '', apkUrl: '', exeUrl: '', releaseNotes: '', releaseDate: '', isForce: false };
  }
}
```

### Step 3.2: Create Version Configuration

Create `src/config/version.ts`:

```typescript
export const APP_VERSION = '1.0.0'; // Bump this for each release
export const MIN_REQUIRED_VERSION = '0.9.0'; // Minimum version supported
export const BUILD_DATE = new Date().toISOString();
export const BUILD_NUMBER = process.env.BUILD_NUMBER || '1';

export const RELEASE_FEATURES = {
  '1.0.0': [
    '✅ Fixed Firestore listener memory leak',
    '✅ Optimized localStorage caching',
    '✅ Added satellite API backoff',
    '✅ Improved carousel visibility',
    '✅ Web Worker crypto operations',
    '✅ Centralized geolocation service',
    '✅ Request timeout management',
    '✅ Enhanced BLE scan cleanup',
  ],
};
```

---

## Phase 4: Deployment Checklist

### Before Release:
- [ ] All performance fixes integrated and tested
- [ ] GitHub Actions workflow created and validated
- [ ] Signing certificates configured in GitHub Secrets
- [ ] Version number bumped in package.json, build.gradle, and version.ts
- [ ] Release notes prepared
- [ ] CHANGELOG.md updated

### Release Day:
```bash
# 1. Create a new version tag
git tag -a v1.0.0 -m "Release v1.0.0 - Performance Fixes & Build Pipeline"

# 2. Push tag (automatically triggers build)
git push origin v1.0.0

# 3. Monitor Actions tab for build completion
# https://github.com/Charesmagna/SafetyLink-Core/actions

# 4. Verify all artifacts on Releases page
# https://github.com/Charesmagna/SafetyLink-Core/releases
```

### Post-Release:
- [ ] Test APK installation and update flow
- [ ] Test EXE installer and update prompts
- [ ] Verify website deployment
- [ ] Announce release on social media
- [ ] Monitor crash reports and user feedback

---

## Secrets Configuration

Add these to GitHub Settings → Secrets and variables → Actions:

```
KEYSTORE_BASE64         - Base64 encoded Android keystore file
KEYSTORE_PASSWORD       - Android keystore password
KEY_ALIAS               - Android signing key alias
KEY_PASSWORD            - Android signing key password
SIGN_CERTIFICATE        - Base64 encoded Windows code signing certificate
SIGN_PASSWORD           - Windows certificate password
VERCEL_TOKEN            - Vercel deployment token
VERCEL_PROJECT_ID       - Vercel project ID
VERCEL_ORG_ID           - Vercel organization ID
```

---

## Version Bump Instructions

For each release, update:

1. **package.json**
   ```json
   { "version": "1.0.0" }
   ```

2. **android/app/build.gradle**
   ```gradle
   versionCode = 100
   versionName = "1.0.0"
   ```

3. **src/config/version.ts**
   ```typescript
   export const APP_VERSION = '1.0.0';
   export const RELEASE_FEATURES = { '1.0.0': [...] };
   ```

4. **Commit and tag**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.0"
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin main
   git push origin v1.0.0
   ```

---

## Verification Checklist

After release, verify:

- [ ] APK can be downloaded and installed on Android
- [ ] In-app update checker detects new version
- [ ] EXE can be downloaded and installed on Windows
- [ ] Website loads and displays latest version
- [ ] Release notes display correctly
- [ ] All artifacts are signed/verified
- [ ] GitHub release page is properly formatted

