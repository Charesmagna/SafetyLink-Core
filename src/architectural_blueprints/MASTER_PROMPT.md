## 🚀 Master Prompt for Google AI Studio

### 1. TARGET & BUILD CONFIGURATION (`build.gradle.kts`)
- Updated Android config to target API 34.
- Handled offline tracking and BLE dependencies.

### 2. ANDROID MANIFEST & SERVICE DECLARATION (AndroidManifest.xml)
- Included permissions for location, background location, SMS, foreground services.

### 3. DATABASE SCHEMA (/data/db/)
- Offline SQLite integration for incidents.

### 4. CORE FOREGROUND ENGINE & DISPATCHER (EmergencyService.kt)
- Engineered high-priority background service for offline dispatching.

### 5. AUTOMATED GITHUB ACTIONS CI/CD WORKFLOW (.github/workflows/android.yml)
- GitHub Actions pipeline to auto-build debug APK on push.

### 6. BACKEND - AUTO CREATE OC USER ON REGISTER
- Automatically generate OwnCloud user credentials when Organization or Family registers.
- Save credentials to database.
- Implemented in `standalone-backend/services/owncloud.js` and `server.js`.

### 7. FRONTEND - "DOWNLOAD ZIP" BUTTON
- Native ZIP download for evidence via Capacitor.
- Open share sheet for seamless evidence handoff.
- Implemented in `src/components/OrgDashboard.tsx`.

### 8. UPDATE DATABASE SCHEMA
- Added `ocUsername` and `ocPassword` directly to Organization and Family models.
- Retention cron sweeps old evidence after 90 days.
