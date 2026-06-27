# SafetyLink Core — Intelligent Emergency Response System
> Powered by TM Media Solutions ®
> Founded and engineered by **Tshilidzi Mukwevho**

SafetyLink is a mission-critical, full-stack, multi-tenant emergency SOS routing and telemetry gateway. Built to survive and coordinate dispatches in challenging network environments (such as South African local municipalities facing power cuts or remote terrain), SafetyLink combines robust Bluetooth Low Energy (BLE) physical panic keys, localized offline-first persistence queues, and full-stack isolated tenant API gateways (Twilio, Meta WhatsApp Cloud API, and sequential voice escalation cascades).

---

## 🎨 Visual Identity & Aesthetic Choices
SafetyLink utilizes a highly customized **Dark Tactical / Modern Industrial Console** interface, optimized for high-contrast viewing under active field dispatch conditions:
* **Slate/Indigo Palette:** Prevents screen glare and eye strain for emergency dispatch operators during extended shifts.
* **Ambient Alerts & State Banners:** Interactive real-time visual feedback with pulsating status rings mapping to critical threat levels (Active, Escalated, Resolved).
* **Space Grotesk & JetBrains Mono Typography:** Pairs display-grade, high-legibility geometric headings with monospace system pings, giving the dashboard a professional, military-grade command-and-control feel.

---

## 🏗️ Core Architecture & Flow Controls

### 1. Multi-Tenant Gateway & Data Isolation
SafetyLink isolates tenant organizations (e.g., local neighbourhood watches, security companies) at the database and memory layer:
* **Access Code Authentication:** Members join localized organizations (e.g., `CPT-GUARD-99`, `GP-TACTICAL-21`) using randomized, cryptographically secured 8-character codes.
* **Isolated Outbound Dispatch Routing:** When a member triggers an SOS panic, the dispatch engine checks if the tenant has saved their own credentials (Twilio SID/Token, Meta WhatsApp Phone ID, or custom Voice Escalation sequences). If present, the engine instantly bypasses the fallback gateway to use the organization's dedicated isolated channel, protecting data residency and routing logs directly to their isolated history.

### 2. Emergency Escalation Engine
When a high-priority alert is initiated via the phone interface or a paired physical BLE device, the multi-tier escalation cascade fires:
* **Meta WhatsApp Cloud Gateway:** Dispatches structured rich-text alerts containing live Google Maps satellite coordinates to predefined primary contacts.
* **Twilio SMS Dispatch:** Fires high-priority short messages with a secondary coordinates payload.
* **Automated Sequential Voice Cascades:** SafetyLink's voice dialer calls the primary responder immediately. If the call status is simulated as "No-Answer" or "Decline", the escalation system automatically cascades downward to the next emergency responder in the organization’s custom sequence.

### 3. BLE Hardware Integration (iTAG Protocol)
SafetyLink integrates physical keyfob devices via standard BLE attributes:
* **Service UUID:** `0xFFE0` (FFE0 Primary Control Service)
* **Characteristic UUID:** `0xFFE1` (Characteristic for alert payload `0x01` / Panic state).
* **GATT Life-Cycle Handshake Monitor:** Built with an active disconnection listener. If the hardware keyfob experiences sudden signal loss (GATT Code 0), the application automatically flashes a warning notification banner and swaps routing instantly to the fallback on-screen interface.

### 4. Offline Sync & Local Queue
Designed to work offline, the engine stores outgoing logs, user status approvals, and pending alerts inside a synchronized state manager. When internet connectivity is restored, the queue is dynamically processed.

---

## 🔑 Environment Settings (`.env.example`)
To configure a production deployment of SafetyLink, specify the following variables in your environment or local `.env` file:

```env
# Server Binding Port
PORT=3000

# Server-Side Secrets (Never exposed to the client)
GEMINI_API_KEY=your_gemini_api_key_here
SESSION_SECRET=your_production_secret_key_here

# System Fallback Gateway Credentials (If tenants do not configure their own)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_system_twilio_auth_token
META_WHATSAPP_PHONE_ID=10984xxxxxxxxxxx
META_WHATSAPP_ACCESS_TOKEN=EAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Rapid Development & Compilation

### 🛠️ Local Environment Setup
To install dependencies and start the full-stack development environment:

```bash
# 1. Install required Node.js dependencies
npm install

# 2. Spin up the development server (runs Express & Vite on port 3000)
npm run dev
```

### 📦 Production Compilation
SafetyLink builds into a highly optimized, single-bundle backend file with standalone static client assets:

```bash
# Compile and package client-side assets and bundler server
npm run build

# Start the optimized production cluster
npm run start
```

---

## 📱 Mobile Platform Compilation (Capacitor Android)

SafetyLink Core has been fully migrated from Cordova to **Capacitor 6+** to ensure maximum stability, modern API support, and a streamlined native build pipeline.

### 🔄 Cordova-to-Capacitor Plugin Mapping
All emergency, hardware, and offline-first capabilities are preserved without alteration. The native bridging has been mapped as follows:

*   **cordova-plugin-device** ➔ `@capacitor/device` (Accessing native telemetry details)
*   **cordova-plugin-geolocation** ➔ `@capacitor/geolocation` (Accessing real-time native GPS coordinates)
*   **cordova-plugin-background-mode** ➔ Native Android Foreground Services + Capacitor App Lifecycles
*   **cordova-plugin-call-number** ➔ Standard Native Dial Intent routing with high priority

### ⚡ Build Paths & Commands
To compile the web workspace and synchronize assets to your native Android app:

```bash
# 1. Compile the production full-stack bundle and client assets
npm run build

# 2. Sync web assets and Capacitor plugins into the Android workspace
npm run cap:sync

# 3. Open the workspace directly in Android Studio to build, sign or debug
npm run cap:open
```

### 🛡️ Android Manifest & Permissions (`AndroidManifest.xml`)
The native project is pre-configured in `/android/app/src/main/AndroidManifest.xml` with:
*   **Bluetooth BLE Scan & Connect:** Required for iTAG physical panic keys (Android 12+ compliant).
*   **High-Accuracy Geolocation:** Handles live coordinate routing inside South African municipalities.
*   **Foreground Services:** Safeguards active dispatch operations during operator backgrounding.

### ⚙️ GitHub Actions CI/CD APK Build Pipeline
An automated pipeline is configured in `.github/workflows/apk-build.yml` to compile production web assets, synchronize Capacitor, build a native debug APK using Gradle, and upload it as a downloadable release artifact on every push.
