# SafetyLink Core — Feature Registry & Cloudflare R2 Asset Map

> **Persistent Architecture Reference**
> This file documents all SafetyLink Core capabilities, backend modules, and Cloudflare R2 storage assets.
> Bucket: `media` | Storage Root: `Safetylink/` | Endpoint: `https://d089bef8b0b58c5d9506b512ec2f63dc.r2.cloudflarestorage.com`

---

## 1. Verified Official Artifacts in Cloudflare R2
- **Android APK**: `Safetylink/SafetyLink.apk` (119.63 MB, Android 8.0+)
  - Direct High-Speed Download: `/api/r2/download/apk`
  - Signed release build with active BLE beacon scanning, background foreground service, and offline emergency caches.
- **Manifest**: `manifest.json` (auto-generated in bucket root)
  - Maps 122+ media files, categories, file sizes, and streaming endpoints.

---

## 2. Official Media & Video Demonstrations
- `Safetylink/Inside_SafetyLink_s_Offline-First_Emergency_Ecosystem.mp4` (9.5 MB)
- `Safetylink/How_Emergency_Escalation_Pipelines_Work.mp4` (2.5 MB)
- `Safetylink/How_SafetyLink_Automates_Emergency_Responses.mp4` (3.6 MB)
- `Safetylink/SafetyLink_s_New_Emergency_Hardware_Lineup.mp4` (7.5 MB)
- `Safetylink/The_Reliability_Gap__Standard_Panic_Apps_vs.mp4` (65.1 MB)
- `Safetylink/SafetyLink 3D Animation Logo.mp4` (2.7 MB)
- `Safetylink/SafetyLink_Ecosystem.mp4` (45.9 MB)
- `Safetylink/SafetyLink__Offline-First.mp4` (41.5 MB)

---

## 3. High-Resolution Architecture Blueprints
- `Safetylink/Emergency_Response_System_Architecture.png` (5.56 MB)
- `Safetylink/Emergency_Response_Platform_Architecture_Overview.png` (4.57 MB)
- `Safetylink/Emergency_System_Architecture_Anatomy.png` (4.13 MB)
- `Safetylink/Emergency_Mesh_Platform_Overview.png` (4.50 MB)

---

## 4. Backend R2 Storage Architecture (`/src/services/r2-storage.ts`)
- **Direct S3 Protocol Integration**: Native `@aws-sdk/client-s3` communication with Cloudflare R2.
- **Byte-Range Streaming**: Enables real-time video seeking, scrubbing, and streaming in the browser via `/api/r2/stream/:key(*)`.
- **Automated Manifest Synchronization**: `syncR2Manifest()` scans the entire bucket and saves metadata both locally and in R2 root.
- **Incident Evidence Upload**: Dedicated `uploadIncidentEvidence()` uploads emergency audio recordings, snapshot captures, and responder logs into `Safetylink/evidence/{incidentId}/`.
- **Cloudflare Workers AI (Llava)**: Integrated image description service via `@cf/llava-1.5-alpha-hf` using `CLOUDFLARE_API_TOKEN`.

---

## 5. Emergency Platform Core Capabilities
1. **Zero-Signal Panic Dispatch**: BLE mesh beacon emulation and offline-first queueing.
2. **Multi-Channel Sequential Escalation**: Push Notification -> WhatsApp Session -> SMS Broadcast -> AI Voice Dispatch (VAPI/Twilio).
3. **Guard & Patrol Telemetry**: GPS breadcrumbs, muster-point validation, and dispatch acknowledgment.
4. **Editorial Live Control**: In-app over-the-air version broadcasts and fleet updates.
5. **Real-Time Verification**: Live WebSocket voice coordinator (K'leva.info / Gemini Live).
