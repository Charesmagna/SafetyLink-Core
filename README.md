# SafetyLink — Intelligent Emergency Response System
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

SafetyLink is prepared for native Android wrapping via Capacitor, accessing Bluetooth capabilities and system hardware permissions:

### ⚡ Build Paths & Commands
To wrap the web application and generate a native release APK:

```bash
# 1. Install Capacitor native platforms
npm install @capacitor/core @capacitor/android

# 2. Sync web assets with the Android native project
npx cap sync android

# 3. Open the workspace in Android Studio to compile / debug
npx cap open android
```

### 🛡️ Android Manifest & Permissions (`AndroidManifest.xml`)
The following hardware and runtime permission rules must be appended to your `android/app/src/main/AndroidManifest.xml` to enable background tracking and BLE handshakes:

```xml
<!-- Bluetooth Scanning & Connection Permissions -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Core Geo-Location Tracking Permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Internet & Push Notification Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```
