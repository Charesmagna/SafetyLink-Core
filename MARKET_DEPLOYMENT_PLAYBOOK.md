# SafetyLink Core — Market Deployment & Production Runbook

This runbook outlines the exact sequence to deploy SafetyLink Core to production across Android and Cloud.

---

## 1. Android Release Build & Signing Pipeline

### Step 1.1: Generate Production Keystore
Generate a permanent 2048-bit RSA release keystore:
```bash
keytool -genkey -v -keystore android/app/safetylink-release.keystore \
  -alias safetylink \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "SafetyLink2024!" -keypass "SafetyLink2024!" \
  -dname "CN=SafetyLink Core, OU=Engineering, O=TM Media Solutions, L=Johannesburg, ST=Gauteng, C=ZA"
```

### Step 1.2: Build Web Bundle & Sync Native Assets
```bash
npm run build
npx cap sync android
```

### Step 1.3: Compile Signed Release APK
From the `android/` directory:
```bash
cd android
./gradlew clean assembleRelease
```
* The compiled signed APK will be output to:  
  `android/app/build/outputs/apk/release/app-release.apk`

### Step 1.4: Verify Keystore Signature & Zipalign
```bash
zipalign -v -c 4 android/app/build/outputs/apk/release/app-release.apk
apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
```

---

## 2. Cloudflare / Web Production Deployment

### Step 2.1: Production Build
```bash
npm run build
```

### Step 2.2: Cloudflare Pages / Workers Deployment
Deploy client assets to Cloudflare Pages:
```bash
npx wrangler pages deploy dist --project-name=safetylink-core
```
Or run full-stack container on Cloudflare / GCP:
```bash
npm start
```

---

## 3. Post-Deployment Verification Checklist
1. **Health Check:** `curl -s https://safetylink.online/api/health` returns `{"status":"ok"}`.
2. **Panic Route:** `POST /api/panic` responds cleanly and enqueues to Twilio / Africa's Talking.
3. **Master Suite UI:** Access `https://your-domain/safetylink-master-suite.html` to confirm all 7 golden subsystems are responsive.
4. **Offline Resilience:** Sideload the release APK, disable data and Wi-Fi, and confirm USSD / SMS dispatches cleanly with full audit logging.
