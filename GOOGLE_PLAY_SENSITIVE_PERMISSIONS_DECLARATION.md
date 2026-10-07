# Google Play Console — Sensitive Permissions & User Data Declarations

**Application ID:** `com.aistudio.safetylink.vqnztp`  
**Application Name:** SafetyLink Core  
**Core Category:** Personal Safety & Emergency Dispatch

---

## 1. `SEND_SMS` (SMS Permissions Declaration Form)

### Core Functionality Justification:
* **Primary Use Case:** Physical safety and emergency SOS broadcasting under network-constrained, offline, or cellular-data-depleted scenarios.
* **Why Alternative (SMS Intent) Cannot Be Used:** In genuine panic scenarios (e.g., kidnapping, physical assault, lone-worker injury), the user cannot manually unlock the phone, review a system SMS dialog, and tap "Send". `SmsManager` transmits distress telemetry with incident ID and GNSS coordinates automatically to sequential escalation contacts.
* **Google Play Policy Exemption Category:** **"Physical Safety / Emergency Alert Apps"**
* **Video Demonstration URL Requirement:** Provide link showing physical BLE button or widget triggering background SMS dispatch with screen locked.

---

## 2. `CALL_PHONE` (Direct Telephony Call Permission)

### Core Functionality Justification:
* **Primary Use Case:** Automated voice call escalation to emergency response coordinators and private security dispatch centers.
* **Why Dial Intent (`ACTION_DIAL`) Cannot Be Used:** `ACTION_DIAL` only populates the keypad and requires manual user intervention to press the green call button. In unconsciousness or hands-bound scenarios, `CALL_PHONE` allows direct execution of the escalation chain.
* **Google Play Policy Exemption Category:** **"Physical Safety / Emergency Services"**

---

## 3. `ACCESS_BACKGROUND_LOCATION` (All the Time Location)

### Core Functionality Justification:
* **Primary Use Case:** Transmitting live incident coordinates when distress is triggered from hardware BLE beacons (iTAG) or the lock screen without bringing the application to the foreground.
* **Prominent In-App Disclosure:** Displayed during the mandatory first-launch permissions onboarding flow (`PermissionsScreen.tsx`), informing the user that location data is accessed in the background solely for emergency dispatch.
* **Battery Efficiency:** Background location uses high-precision bursts during panic and passive low-power geofence polling during standby.

---

## 4. `SYSTEM_ALERT_WINDOW` (Display Over Other Apps)

### Core Functionality Justification:
* **Primary Use Case:** Providing the Floating SOS Bubble (Chat Heads style) and the Fullscreen Countdown Disarm Overlay over third-party applications and the Android lock screen.
* **User Control:** The overlay can be toggled on or off at any time in SafetyLink Settings.
