# SafetyLink Core — Commercial Launch, Multi-Channel Release & Google Play Compliance Kit

## 1. Multi-Channel Distribution Readiness (APK + Web + Windows EXE)

| Channel | Distribution URL / Artifact | Release Pipeline | Pre-Launch Verification |
| :--- | :--- | :--- | :--- |
| **Web App** | `https://safetylink.online` | `Deploy safetylink.online` | Verify `/ads.txt`, Light/Dark theme parity, PayFast & Paystack live checkout, and `/api/safety-feed/live`. |
| **Android APK (v2)** | `https://api.safetylink.online/download/safetylink.apk` | `Build Android APK` | Install signed v2 APK on physical Android device and complete all 8 tests in **Super Admin → Launch Readiness**. |
| **Windows Desktop (.exe)** | GitHub Releases (`SafetyLink.Setup.*.exe`) | `Build Windows EXE` | Verify installer launches, connects to `api.safetylink.online`, and renders Mission Control + Super Admin cleanly. |
| **Edge API (Cloudflare Worker)** | `https://api.safetylink.online` | `Deploy Cloudflare Worker` | Confirm `/api/health`, `/api/health/providers`, `/api/pcm/health`, `/api/payfast/notify`, and `/api/paystack/webhook`. |

---

## 2. Live Production Billing Checklist (PayFast & Paystack)

### PayFast (South African EFT, Instant EFT & Card)
1. Set Cloudflare Worker secrets:
   - `PAYFAST_MERCHANT_ID` (live merchant ID)
   - `PAYFAST_MERCHANT_KEY` (live merchant key)
   - `PAYFAST_PASSPHRASE` (live passphrase matching PayFast dashboard)
   - `PAYFAST_SANDBOX=false`
2. Confirm PayFast ITN Notify URL is set to:
   `https://api.safetylink.online/api/payfast/notify`
3. Run a real low-value transaction and confirm `users.status` updates to `'active'` in D1 and a `PAYMENT_COMPLETE` record appears in `audit_logs`.

### Paystack (Cards, Apple Pay, Instant EFT)
1. Set Cloudflare Worker secrets:
   - `PAYSTACK_SECRET_KEY` (`sk_live_...` — server-side only)
   - Set `VITE_PAYSTACK_PUBLIC_KEY` (`pk_live_...`) in Cloudflare Pages / Vite production build environment.
2. In the Paystack Dashboard (**Settings → API Keys & Webhooks**), set the Live Webhook URL to:
   `https://api.safetylink.online/api/paystack/webhook`
3. Verify HMAC-SHA512 webhook delivery returns HTTP `200` and automatically unlocks the consumer account.

---

## 3. Google Play Store Compliance Kit

### A. Sensitive Permissions Exemption Package
SafetyLink uses restricted safety permissions solely for life-critical physical emergency dispatch:
- **`SEND_SMS`** — Automated background SOS transmission with incident ID and GPS coordinates when cellular data is unavailable (*Policy Exemption: Physical Safety / Emergency Alert Apps*).
- **`CALL_PHONE`** — Automated hands-free voice call escalation to emergency contacts/responders while keeping SafetyLink in the foreground (*Policy Exemption: Physical Safety / Emergency Services*).
- **`ACCESS_BACKGROUND_LOCATION`** — Live emergency GPS tracking triggered from a paired BLE iTAG button or lock-screen overlay with prominent first-launch disclosure.
- **`SYSTEM_ALERT_WINDOW`** — Draggable Floating SOS Bubble and Lock-Screen Countdown Disarm Overlay.

> **Required Play Console Asset**: Record a 45–60 second unlisted YouTube video demonstrating (1) prominent in-app permission disclosure, (2) triggering SOS from locked screen / iTAG button, and (3) automatic SMS + Call escalation.

### B. Google Play Data Safety Matrix
| Data Category | Collected | Shared | Purpose | Encrypted in Transit | User Deletion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Name, Email, Phone Number | Yes | Only with user's chosen emergency contacts / bound org during SOS | Account management & emergency dispatch | Yes (TLS 1.3) | Yes (In-app POPIA deletion & `privacy@safetylink.online`) |
| Precise & Approximate Location | Yes | Only with emergency contacts / responders during active SOS | Emergency geolocation & local Safety Feed | Yes (TLS 1.3) | Yes |
| Contacts (Emergency Chain) | Yes | Never sold; used strictly for user's emergency escalation | SOS SMS, Voice Call & FCM Loud Alarm | Yes (TLS 1.3) | Yes |
| Payment Info | Processed by PayFast / Paystack | Never stored raw on SafetyLink servers | Subscription billing | Yes (TLS 1.3) | Managed via billing provider |

### C. Signed Android App Bundle (`.aab`) Build for Google Play
```bash
npm run build
npx cap sync android
cd android
./gradlew clean bundleRelease
```
Upload `android/app/build/outputs/bundle/release/app-release.aab` to the Play Console Internal Testing track first before promoting to Production.

---

## 4. Final Launch-Day Secret Rotation Checklist
Before announcing public launch, rotate every key shared during development/testing and update Cloudflare Workers + GitHub Actions Secrets:
1. GitHub Personal Access Token (revoke old PAT, create minimal-scope token).
2. Cloudflare API Token (rotate with Workers Edit + D1 + R2 scope only).
3. BigDataCloud API Key (`BIGDATACLOUD_API_KEY`).
4. FreeNewsAPI Key (`FREENEWSAPI_KEY`).
5. DeepAI API Key (`DEEPAI_API_KEY`, if enabled on Render).
6. Render API Key & Environment Secrets.
7. `PCM_WEBHOOK_TOKEN`, `PCM_WEBHOOK_SECRET`, and `IOT_WEBHOOK_SECRET` (update SMS Forwarder app on the Rain SIM device at the same time).
